/* ============================================================
   SHIELD — Mock data generator (DataSourceAdapter implementation).
   Produces realistic synthetic telemetry shaped like an ESP32 /
   MQTT stream. Swapping to physical hardware later requires only
   a new adapter with the SAME interface — the UI never changes.
   ============================================================ */

import type { DataSourceAdapter, TelemetryPacket } from '../schema/types';
import { SENSORS } from '../data/sensors';
import { EVENTS } from '../data/scenarios';
import { useStore } from '../store/useStore';

export interface GeneratorOptions {
  tickMs?: number;
  jitter?: number;          // noise amplitude factor
  packetLoss?: number;      // 0..1 probability a sensor is skipped per tick
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SensorState {
  noise: number;          // random walk level
  drift: number;
  emaResidual: number;
  prev: number;
}

export class MockStream implements DataSourceAdapter {
  kind = 'mock' as const;
  label = 'Mock generator (synthetic telemetry)';
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: ((pkt: TelemetryPacket) => void)[] = [];
  private stat: 'idle' | 'connecting' | 'live' | 'error' = 'idle';
  private opts: Required<GeneratorOptions> = { tickMs: 220, jitter: 0.018, packetLoss: 0.02 };
  private rand: () => number;
  private states: Record<string, SensorState> = {};
  private tick = 0;

  constructor(opts: GeneratorOptions = {}) {
    Object.assign(this.opts, opts);
    this.rand = mulberry32(20260518);
    for (const s of SENSORS) {
      this.states[s.id] = {
        noise: 0, drift: (this.rand() - 0.5) * 0.01,
        emaResidual: 0, prev: s.baseline,
      };
    }
  }

  status() { return this.stat; }

  connect() {
    if (this.timer) return;
    this.stat = 'connecting';
    // simulate a short handshake
    setTimeout(() => { this.stat = 'live'; }, 400);
    this.timer = setInterval(() => this.tickNow(), this.opts.tickMs);
  }

  disconnect() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stat = 'idle';
  }

  onPacket(cb: (pkt: TelemetryPacket) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  /* Context from the twin state — replay time drives the scenario. */
  private context() {
    const st = useStore.getState();
    const t = st.tlTime;
    const vehicleId = st.vehicleId;
    let delta: Record<string, number> = {};
    let windowPhase = 'before';
    for (const e of EVENTS) {
      if (e.time <= t) { delta = { ...e.delta }; windowPhase = e.phase === 'event' || e.phase === 'immediately_after' || e.phase === 'next_journey' ? e.phase : 'before'; }
    }
    return { t, vehicleId, delta, windowPhase };
  }

  private tickNow() {
    this.tick++;
    const { vehicleId, delta, windowPhase } = this.context();
    const ts = new Date().toISOString();
    for (const s of SENSORS) {
      // packet loss sim
      if (this.rand() < this.opts.packetLoss) continue;
      const st = this.states[s.id]!;
      // random walk noise
      st.noise = st.noise * 0.86 + (this.rand() - 0.5) * s.baseline * this.opts.jitter;
      const mult = delta[s.id] ?? 1;
      const windowed = windowPhase !== 'before' ? 1 + (mult - 1) * Math.min(1, 0.5 + (this.tick % 30) / 60) : 1;
      let value: number;
      if (s.signal === 'temperature') {
        const off = typeof delta[s.id] === 'number' ? (delta[s.id] as number) * Math.min(1, 0.4 + ((this.tick % 40) / 40)) : 0;
        value = s.baseline + off + st.noise * 6;
      } else if (s.signal === 'acceleration') {
        // impulse response for IMUs during event windows
        const impulse = windowed > 1.6 ? (1 - Math.exp(-((this.tick % 14) / 6))) * 0.7 + 0.6 : 1;
        value = s.baseline * impulse + st.noise;
      } else {
        value = s.baseline * windowed + st.noise;
      }
      // slight per-sensor bias drift
      value += st.drift * this.tick * 0.0015;
      st.prev = value;
      const quality = Math.max(0.82, Math.min(0.999, 0.99 - this.rand() * 0.02));
      const pkt: TelemetryPacket = {
        vehicleId, timestamp: ts, sensorId: s.id, componentId: s.componentId,
        signal: s.signal, value, unit: s.unit, quality, provenance: 'SIMULATED',
      };
      for (const cb of this.listeners) cb(pkt);
    }
  }
}

/** A stub adapter showing the MQTT bridge shape — not functional yet. */
export class MqttStub implements DataSourceAdapter {
  kind = 'mqtt' as const;
  label = 'MQTT bridge (broker) — placeholder';
  private stat: 'idle' | 'connecting' | 'live' | 'error' = 'idle';
  status() { return this.stat; }
  connect() { this.stat = this.stat === 'idle' ? 'connecting' : this.stat; }
  disconnect() { this.stat = 'idle'; }
  onPacket() { return () => {}; }
}