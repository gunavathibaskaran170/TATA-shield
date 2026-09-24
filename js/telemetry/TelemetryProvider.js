/* ============================================================
   SHIELD — Telemetry Provider Interface & Simulated Adapter
   Single provider interface for SIMULATED and LIVE modes.
   ============================================================ */

import { SensorReadingSchema, DerivedMetricsSchema, validateReading, validateDerived } from './schemas.js';
import { RingBuffer, createSensorBuffer } from './RingBuffer.js';
import { SENSORS, sensorById, INSTALL_SUMMARY } from '../config/sensorConfig.js';
import { THRESHOLDS } from '../config/thresholdConfig.js';

/* ---- Provider Interface (contract) ----
interface TelemetryProvider {
  start(): void;
  stop(): void;
  subscribe(sensorId: string | '*', cb: (r: SensorReading) => void): () => void;
  subscribeDerived(sensorId: string | '*', cb: (d: DerivedMetrics) => void): () => void;
  getLatest(sensorId: string): SensorReading | null;
  getHistory(sensorId: string, windowMs: number): SensorReading[];
  getConnectionState(): { link, source, lastPacketAt, packetRateHz, dropped };
}
*/

/* ---- Derived Metrics Computation ---- */
function computeDerived(sensorId, reading, buffer) {
  const cfg = sensorById(sensorId);
  if (!cfg) return null;

  const history = buffer.getAll();
  if (history.values.length < 2) return null;

  const values = history.values.map(v => v[0]);
  const timestamps = history.timestamps;

  // Expected from config (k_i * F_nominal) or baseline
  const expected = cfg.expected ?? cfg.baseline ?? null;
  const measured = reading.value;
  const residual = expected !== null ? measured - expected : null;

  // RMS over window
  const sumSq = values.reduce((s, v) => s + v * v, 0);
  const rms = Math.sqrt(sumSq / values.length);

  // Peak
  const peak = Math.max(...values.map(Math.abs));

  // Trend (slope of linear regression over window)
  let trend = null;
  if (values.length >= 3) {
    const n = values.length;
    const sumX = timestamps.reduce((s, t) => s + t, 0);
    const sumY = values.reduce((s, v) => s + v, 0);
    const sumXY = timestamps.reduce((s, t, i) => s + t * values[i], 0);
    const sumXX = timestamps.reduce((s, t) => s + t * t, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom !== 0) trend = (n * sumXY - sumX * sumY) / denom; // slope per ms
  }

  // Anomaly score (simple: residual / expected threshold)
  let anomalyScore = null;
  if (expected !== null && expected !== 0) {
    anomalyScore = Math.abs(residual) / Math.abs(expected);
  }

  // Status from thresholds
  let state = 'NORMAL';
  if (cfg.type === 'strain' && residual !== null) {
    if (Math.abs(residual) > THRESHOLDS.strain.inspection) state = 'INSPECTION_REQUIRED';
    else if (Math.abs(residual) > THRESHOLDS.strain.watch) state = 'WATCH';
  } else if (cfg.type === 'imu' && rms !== null) {
    if (rms > THRESHOLDS.imu.inspectionRms) state = 'INSPECTION_REQUIRED';
    else if (rms > THRESHOLDS.imu.watchRms) state = 'WATCH';
  }
  if (reading.quality < THRESHOLDS.qualityGate) state = 'FAULT';

  return {
    sensorId,
    timestamp: reading.timestamp,
    expected,
    residual,
    rms,
    peak,
    trend,
    anomalyScore,
    state,
  };
}

/* ---- Simulated Telemetry Provider ---- */
export class SimulatedTelemetryProvider {
  constructor() {
    this.running = false;
    this.intervalId = null;
    this.subscribers = new Map(); // sensorId -> Set<cb>
    this.derivedSubscribers = new Map();
    this.buffers = new Map(); // sensorId -> RingBuffer
    this.latest = new Map(); // sensorId -> SensorReading
    this.packetCount = 0;
    this.droppedCount = 0;
    this.lastPacketAt = null;
    this.startTime = Date.now();

    // Initialize buffers for all sensors
    for (const cfg of SENSORS) {
      const capacity = 300 * 10; // 5 min at 10 Hz
      this.buffers.set(cfg.id, createSensorBuffer(cfg.type, capacity));
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.intervalId = setInterval(() => this.emitTick(), 100); // 10 Hz
    console.log('[Telemetry] Simulated provider started (10 Hz)');
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    console.log('[Telemetry] Simulated provider stopped');
  }

  emitTick() {
    const now = Date.now();
    for (const cfg of SENSORS) {
      if (!this.running) break;
      const live = cfg.live();
      const reading = {
        sensorId: cfg.id,
        timestamp: now,
        value: typeof live.current === 'number' ? live.current : (live.force ? live.force : (live.rms ? parseFloat(live.rms) : (live.temp ? parseFloat(live.temp) : (live.current ? parseFloat(live.current) : 0)))),
        unit: cfg.unit,
        source: 'SIMULATED',
        quality: cfg.signalQuality / 100,
        status: cfg.health === 'HEALTHY' ? 'NORMAL' : 'FAULT',
        seq: this.packetCount++,
      };

      // Validate
      const parsed = validateReading(reading);
      if (!parsed.success) {
        this.droppedCount++;
        continue;
      }

      // Store latest
      this.latest.set(cfg.id, parsed.data);

      // Push to buffer
      const buffer = this.buffers.get(cfg.id);
      if (buffer) buffer.push(now, parsed.data.value);

      // Notify subscribers
      const subs = this.subscribers.get(cfg.id) || this.subscribers.get('*');
      if (subs) {
        for (const cb of subs) cb(parsed.data);
      }

      // Derived metrics
      const derived = computeDerived(cfg.id, parsed.data, buffer);
      if (derived) {
        const dSubs = this.derivedSubscribers.get(cfg.id) || this.derivedSubscribers.get('*');
        if (dSubs) {
          for (const cb of dSubs) cb(derived);
        }
      }
    }
    this.lastPacketAt = now;
  }

  subscribe(sensorId, cb) {
    const key = sensorId || '*';
    if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
    this.subscribers.get(key).add(cb);
    return () => {
      const set = this.subscribers.get(key);
      if (set) set.delete(cb);
    };
  }

  subscribeDerived(sensorId, cb) {
    const key = sensorId || '*';
    if (!this.derivedSubscribers.has(key)) this.derivedSubscribers.set(key, new Set());
    this.derivedSubscribers.get(key).add(cb);
    return () => {
      const set = this.derivedSubscribers.get(key);
      if (set) set.delete(cb);
    };
  }

  getLatest(sensorId) {
    return this.latest.get(sensorId) || null;
  }

  getHistory(sensorId, windowMs) {
    const buffer = this.buffers.get(sensorId);
    if (!buffer) return [];
    const { timestamps, values } = buffer.getWindow(windowMs);
    return timestamps.map((ts, i) => ({
      sensorId,
      timestamp: ts,
      value: values[i][0],
      unit: sensorById(sensorId)?.unit || '',
      source: 'SIMULATED',
      quality: 1,
      status: 'NORMAL',
    }));
  }

  getConnectionState() {
    return {
      link: 'SIMULATED',
      source: 'SIMULATED',
      lastPacketAt: this.lastPacketAt,
      packetRateHz: this.running ? 10 : 0,
      dropped: this.droppedCount,
    };
  }
}

/* ---- Singleton instance ---- */
let _simulatedInstance = null;
export function getSimulatedProvider() {
  if (!_simulatedInstance) _simulatedInstance = new SimulatedTelemetryProvider();
  return _simulatedInstance;
}

/* ---- Live Telemetry Provider (stub - connects to WebSocket) ---- */
export class LiveTelemetryProvider {
  constructor(url = 'ws://localhost:8124/ws/telemetry') {
    this.url = url;
    this.ws = null;
    this.running = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.subscribers = new Map();
    this.derivedSubscribers = new Map();
    this.buffers = new Map();
    this.latest = new Map();
    this.packetCount = 0;
    this.droppedCount = 0;
    this.lastPacketAt = null;
    this.heartbeatTimer = null;

    for (const cfg of SENSORS) {
      const capacity = 300 * 10;
      this.buffers.set(cfg.id, createSensorBuffer(cfg.type, capacity));
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[Telemetry] Live WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('[Telemetry] Live WebSocket disconnected');
        this.stopHeartbeat();
        if (this.running && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
          console.log(`[Telemetry] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[Telemetry] Max reconnect attempts reached');
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Telemetry] WebSocket error:', err);
      };
    } catch (e) {
      console.error('[Telemetry] Failed to create WebSocket:', e);
    }
  }

  handleMessage(data) {
    try {
      const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
      const envelope = JSON.parse(text);
      if (!envelope.type || !envelope.data) return;

      if (envelope.type === 'telemetry') {
        const parsed = validateReading(envelope.data);
        if (!parsed.success) {
          this.droppedCount++;
          return;
        }
        const reading = parsed.data;
        this.latest.set(reading.sensorId, reading);

        const buffer = this.buffers.get(reading.sensorId);
        if (buffer) buffer.push(reading.timestamp, reading.value);

        const subs = this.subscribers.get(reading.sensorId) || this.subscribers.get('*');
        if (subs) for (const cb of subs) cb(reading);

        const derived = computeDerived(reading.sensorId, reading, buffer);
        if (derived) {
          const dSubs = this.derivedSubscribers.get(reading.sensorId) || this.derivedSubscribers.get('*');
          if (dSubs) for (const cb of dSubs) cb(derived);
        }

        this.packetCount++;
        this.lastPacketAt = Date.now();
      } else if (envelope.type === 'heartbeat') {
        // heartbeat received
      } else if (envelope.type === 'verdict') {
        // verdict received - handled by decision store
      }
    } catch (e) {
      this.droppedCount++;
      console.warn('[Telemetry] Failed to parse message:', e);
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat', data: { timestamp: Date.now() } }));
      }
    }, 5000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  stop() {
    this.running = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(sensorId, cb) {
    const key = sensorId || '*';
    if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
    this.subscribers.get(key).add(cb);
    return () => {
      const set = this.subscribers.get(key);
      if (set) set.delete(cb);
    };
  }

  subscribeDerived(sensorId, cb) {
    const key = sensorId || '*';
    if (!this.derivedSubscribers.has(key)) this.derivedSubscribers.set(key, new Set());
    this.derivedSubscribers.get(key).add(cb);
    return () => {
      const set = this.derivedSubscribers.get(key);
      if (set) set.delete(cb);
    };
  }

  getLatest(sensorId) {
    return this.latest.get(sensorId) || null;
  }

  getHistory(sensorId, windowMs) {
    const buffer = this.buffers.get(sensorId);
    if (!buffer) return [];
    const { timestamps, values } = buffer.getWindow(windowMs);
    return timestamps.map((ts, i) => ({
      sensorId,
      timestamp: ts,
      value: values[i][0],
      unit: sensorById(sensorId)?.unit || '',
      source: 'HARDWARE',
      quality: 1,
      status: 'NORMAL',
    }));
  }

  getConnectionState() {
    let link = 'DISCONNECTED';
    if (this.ws) {
      switch (this.ws.readyState) {
        case WebSocket.CONNECTING: link = 'CONNECTING'; break;
        case WebSocket.OPEN: link = 'CONNECTED'; break;
        case WebSocket.CLOSING:
        case WebSocket.CLOSED: link = 'DISCONNECTED'; break;
      }
    }
    return {
      link,
      source: 'HARDWARE',
      lastPacketAt: this.lastPacketAt,
      packetRateHz: 10,
      dropped: this.droppedCount,
    };
  }
}

/* ---- Factory ---- */
let _activeProvider = null;
let _providerMode = 'SIMULATION'; // or 'LIVE'

export function setProviderMode(mode) {
  if (mode === _providerMode) return;
  if (_activeProvider) _activeProvider.stop();
  _providerMode = mode;
  _activeProvider = mode === 'LIVE' ? new LiveTelemetryProvider() : getSimulatedProvider();
  _activeProvider.start();
  console.log(`[Telemetry] Switched to ${mode} mode`);
}

export function getActiveProvider() {
  if (!_activeProvider) _activeProvider = getSimulatedProvider();
  return _activeProvider;
}

export function getProviderMode() {
  return _providerMode;
}