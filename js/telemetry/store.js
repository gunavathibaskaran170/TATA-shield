/* ============================================================
   SHIELD — Telemetry Store (UI-facing)
   Reactive store for latest readings, derived metrics, connection state.
   ============================================================ */

let _state = {
  readings: new Map(),      // sensorId -> SensorReading
  derived: new Map(),       // sensorId -> DerivedMetrics
  connection: {
    link: 'SIMULATED',
    source: 'SIMULATED',
    lastPacketAt: null,
    packetRateHz: 0,
    dropped: 0,
  },
  providerMode: 'SIMULATION',
};

const listeners = new Set();

function notify() {
  for (const cb of listeners) cb(_state);
}

export function subscribe(cb) {
  listeners.add(cb);
  cb(_state);
  return () => listeners.delete(cb);
}

function updateReadings(reading) {
  _state.readings.set(reading.sensorId, reading);
}

function updateDerived(derived) {
  _state.derived.set(derived.sensorId, derived);
}

function updateConnection(conn) {
  _state.connection = { ..._state.connection, ...conn };
}

/* ---- Provider event bridge ---- */
export function attachProvider(provider) {
  // Subscribe to all sensor readings
  provider.subscribe('*', (r) => { _state.readings.set(r.sensorId, r); });
  provider.subscribeDerived('*', (d) => { _state.derived.set(d.sensorId, d); notify(); });
  
  // Connection state polling
  setInterval(() => {
    const conn = provider.getConnectionState();
    _state.connection = { ..._state.connection, ...conn };
    notify();
  }, 1000);
}

export function initTelemetryStore() {
  // Dynamic import to avoid circular deps
  import('./TelemetryProvider.js').then(m => {
    const provider = m.getActiveProvider();
    provider.subscribe('*', (r) => { _state.readings.set(r.sensorId, r); notify(); });
    provider.subscribeDerived('*', (d) => { _state.derived.set(d.sensorId, d); notify(); });
    setInterval(() => { notify(); }, 1000);
  });
}

export function setProviderMode(mode) {
  import('./TelemetryProvider.js').then(m => m.setProviderMode(mode)).then(() => {
    _state.providerMode = mode;
    notify();
  });
}

export function getState() { return _state; }
export function getLatest(sensorId) { return _state.readings.get(sensorId) || null; }
export function getDerived(sensorId) { return _state.derived.get(sensorId) || null; }
export function getConnection() { return _state.connection; }
export function getProviderMode() { return _state.providerMode; }

/* ---- Helpers for UI ---- */
export function getSensorHealth(sensorId) {
  const r = _state.readings.get(sensorId);
  if (!r) return 'UNKNOWN';
  return r.status;
}

export function getSensorValue(sensorId) {
  const r = _state.readings.get(sensorId);
  return r?.value ?? null;
}

export function getSensorQuality(sensorId) {
  const r = _state.readings.get(sensorId);
  return r?.quality ?? 0;
}