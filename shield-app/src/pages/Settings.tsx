import { useState } from 'react';
import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import { Card, ProvTag, Toggle, SliderRow } from '../ui/kit';
import { PageHeader } from '../ui/PageHeader';

const SOURCES = [
  {
    key: 'mock',
    name: 'Mock generator (synthetic telemetry)',
    desc: 'Active demo feed — ~4 Hz per sensor, scenario-aware, shaped like an ESP32/MQTT stream.',
    live: true,
  },
  {
    key: 'mqtt',
    name: 'MQTT bridge (broker)',
    desc: 'Placeholder adapter. Implements the same DataSourceAdapter contract — pointing it at a broker requires no UI change.',
    live: false,
  },
  {
    key: 'hardware',
    name: 'Hardware / WebSocket channel',
    desc: 'Reserved for a telemetry gateway (e.g. ESP32 + strain gauge rig). Same packet contract on arrival.',
    live: false,
  },
] as const;

export function Settings() {
  const scenario = useStore((s) => s.scenario);
  const setScenario = useStore((s) => s.setScenario);
  const vehicleId = useStore((s) => s.vehicleId);

  const [source, setSource] = useState<'mock' | 'mqtt' | 'hardware'>('mock');
  const [tickMs, setTickMs] = useState(220);
  const [jitter, setJitter] = useState(0.018);
  const [packetLoss, setPacketLoss] = useState(0.02);
  const [unitsG, setUnitsG] = useState(false);
  const [showHiddenStats, setShowHiddenStats] = useState(true);

  return (
    <div className="col" style={{ width: '100%', minHeight: '100%', fontFamily: 'var(--font-sans)' }}>
      <PageHeader
        title="Settings & Data Sources"
        description="Configure stream adapter contracts, simulation parameters, and display preferences."
      >
        <span className="chip"><span className="dot dot-normal" /> adapter: <b>{source}</b></span>
      </PageHeader>
      <div className="col stack splash-fade" style={{ padding: 24 }}>

      <div className="grid2">
        {/* ---- data source ---- */}
        <Card title="Telemetry source">
          <div className="col" style={{ gap: 8 }}>
            {SOURCES.map((s) => (
              <button
                key={s.key}
                className="panel"
                style={{
                  padding: '10px 12px', textAlign: 'left', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit',
                  borderLeft: `3px solid ${source === s.key ? (s.live ? 'var(--green)' : 'var(--amber)') : 'var(--line)'}`,
                  ...(source === s.key ? { background: '#101f28' } : {}),
                }}
                onClick={() => setSource(s.key)}
              >
                <div className="spread">
                  <span className="small" style={{ fontWeight: 600 }}>{s.name}</span>
                  <span className={'chip ' + (s.live ? 'st-normal' : 'st-watch')}>
                    <span className={'dot ' + (s.live ? 'dot-normal' : 'dot-watch')} />
                    {s.live ? 'LIVE' : 'PLACEHOLDER'}
                  </span>
                </div>
                <div className="tiny muted" style={{ marginTop: 3 }}>{s.desc}</div>
              </button>
            ))}
          </div>
          <div className="panel" style={{ marginTop: 8, padding: 8, background: 'var(--bg2)' }}>
            <div className="tiny faint">
              Selecting MQTT/hardware here is a UI-only switch for this prototype — the mock feed keeps running. In production the selected adapter would replace the stream entirely.
            </div>
          </div>
        </Card>

        {/* ---- stream tuning ---- */}
        <Card title="Stream tuning (mock generator)">
          <div className="col" style={{ gap: 10 }}>
            <label className="col" style={{ gap: 4 }}>
              <span className="tiny muted">Telemetry scenario</span>
              <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                <option value="cruise">Baseline cruise</option>
                <option value="urban">Urban / rough road</option>
                <option value="pothole_replay">Pothole replay</option>
                <option value="rear_load">Rear load event</option>
                <option value="thermal">Thermal soak</option>
              </select>
            </label>
            <SliderRow label="Tick interval (ms)" value={tickMs} min={80} max={2000} step={10} onChange={setTickMs} fmt={(v) => `${v} ms`} />
            <SliderRow label="Noise (jitter × baseline)" value={jitter} min={0.002} max={0.08} step={0.001} onChange={setJitter} fmt={(v) => v.toFixed(3)} />
            <SliderRow label="Simulated packet loss" value={packetLoss} min={0} max={0.1} step={0.005} onChange={setPacketLoss} fmt={(v) => `${Math.round(v * 100)}%`} />
            <div className="tiny faint">
              These tune the running adapter. Restarting the feed is not required for the demo — values update the next connect.
            </div>
            <div className="panel" style={{ padding: 8, background: 'var(--bg2)' }}>
              <div className="tiny faint">
                <b>Adapter contract:</b> connect() / disconnect() / onPacket(cb) / status() — identical for mock, MQTT and hardware. The analytics engine consumes packets only.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid2">
        {/* ---- display preferences ---- */}
        <Card title="Display preferences">
          <div className="col" style={{ gap: 8 }}>
            <Toggle
              label={<><span className="mono small" style={{ color: 'var(--cyan)' }}>{vehicleId}</span> — show hidden telemetry stats</>}
              checked={showHiddenStats}
              onChange={setShowHiddenStats}
            />
            <Toggle label="Acceleration units: g (9.81 m/s²)" checked={unitsG} onChange={setUnitsG} />
            <div className="panel" style={{ padding: 8, background: 'var(--bg2)' }}>
              <div className="tiny faint">
                Preferences are session-local in this prototype. Production builds would persist to user settings per operator role.
              </div>
            </div>
          </div>
        </Card>

        {/* ---- data inventory ---- */}
        <Card title="Live data inventory">
          <div className="col" style={{ gap: 6 }}>
            <div className="spread">
              <span className="tiny muted">Sensors</span>
              <span className="mono small">{SENSORS.length} (11 streaming)</span>
            </div>
            <div className="spread">
              <span className="tiny muted">Signals</span>
              <span className="mono small">strain · acceleration · temperature</span>
            </div>
            <div className="spread">
              <span className="tiny muted">Packet provenance</span>
              <span className="mono small" style={{ color: 'var(--amber)' }}>SIMULATED</span>
            </div>
            <div className="spread">
              <span className="tiny muted">Analytics source</span>
              <span className="mono small" style={{ color: '#c9b8ff' }}>MODEL_ESTIMATED</span>
            </div>
            <div className="spread">
              <span className="tiny muted">Joint torque records</span>
              <span className="mono small" style={{ color: 'var(--red)' }}>unverified → “—”</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Truthfulness statement (read before using)">
        <div className="col" style={{ gap: 8 }}>
          <div className="small muted" style={{ lineHeight: 1.6 }}>
            <b>SHIELD</b> is a Tata EV engineering use-case prototype / Tata-inspired EV digital twin. The vehicle geometry is a procedural
            surrogate — it does <b>not</b> claim to be OEM Tata CAD or BOM data. Every value in the system carries a provenance tag
            (VERIFIED · MEASURED · DERIVED · MODEL_ESTIMATED · SIMULATED · DEMO); nothing becomes VERIFIED without an authoritative source.
            Joint torques are intentionally null until a verified BOM exists. Fleet analytics report correlations, never defect claims.
          </div>
          <div className="row wrap">
            <span className="chip st-normal"><span className="dot dot-normal" /> 12 workspaces</span>
            <span className="chip st-normal"><span className="dot dot-normal" /> Layers 0–21</span>
            <span className="chip st-normal"><span className="dot dot-normal" /> Instanced fasteners + sensors</span>
            <span className="chip st-normal"><span className="dot dot-normal" /> No network assets</span>
          </div>
          <div className="tiny faint">
            Build: React 18 · TypeScript · Three.js (R3F) · Zustand. Telemetry: mock adapter → analytics engine → store → all pages.
          </div>
        </div>
      </Card>
    </div>
    </div>
  );
}