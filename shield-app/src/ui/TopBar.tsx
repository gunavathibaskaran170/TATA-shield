import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';

export function TopBar() {
  const page = useStore((s) => s.page);
  const navigate = useStore((s) => s.navigate);
  const vehicleId = useStore((s) => s.vehicleId);
  const scenario = useStore((s) => s.scenario);
  const setScenario = useStore((s) => s.setScenario);
  const sensorLive = useStore((s) => s.sensorLive);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const liveCount = Object.keys(sensorLive).length;
  const worst = (['INSPECTION_REQUIRED', 'WATCH', 'NORMAL'] as const)
    .find((st) => Object.values(sensorLive).some((l) => l.analytics.state === st));

  const pageTitle =
    { command: 'Command Center', twin: 'Vehicle Twin', intelligence: 'Structural Intelligence', manufacturing: 'Manufacturing Digital Thread', telemetry: 'Live Telemetry', fleet: 'Fleet Analytics', forensics: 'Event Forensics', diagnostics: 'AI Diagnostics', investigations: 'Investigations', passport: 'Structural Passport', reports: 'Reports', settings: 'Settings & Data Sources' }[page] ?? '';

  return (
    <header
      style={{
        height: 48, flex: 'none', display: 'flex', alignItems: 'center', gap: 14,
        padding: '0 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', zIndex: 6, position: 'relative',
      }}
    >
      <div className="row" style={{ gap: 8 }}>
        <span className="h3" style={{ margin: 0 }}>{pageTitle}</span>
        <span className="tag">Page {page}</span>
      </div>

      <div className="spacer" />

      {/* scenario selector (drives the telemetry stream) */}
      <label className="row" style={{ gap: 6 }} title="Drives the mock telemetry generator">
        <span className="tiny muted">Scenario</span>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          style={{ width: 130 }}
        >
          <option value="cruise">Baseline cruise</option>
          <option value="urban">Urban / rough road</option>
          <option value="pothole_replay">Pothole replay</option>
          <option value="rear_load">Rear load event</option>
          <option value="thermal">Thermal soak</option>
        </select>
      </label>

      <div className="row" style={{ gap: 6 }}>
        <span className="tiny muted">Vehicle</span>
        <button className="btn" onClick={() => navigate('passport')} title="Open passport">
          <span className="mono" style={{ color: 'var(--cyan)' }}>{vehicleId}</span>
        </button>
      </div>

      <span className={'chip ' + (worst ? 'st-' + (worst === 'INSPECTION_REQUIRED' ? 'inspection' : worst === 'WATCH' ? 'watch' : 'normal') : 'st-normal')}>
        <span className={'dot ' + (worst ? 'dot-' + (worst === 'INSPECTION_REQUIRED' ? 'inspection' : worst === 'WATCH' ? 'watch' : 'normal') : 'dot-normal')} />
        {liveCount}/{SENSORS.length} sensors · {worst ?? 'NORMAL'}
      </span>

      <span className="chip" style={{ color: 'var(--green)', borderColor: '#1e4a38', background: '#0c231b' }}>
        <span className="dot dot-normal" />
        LIVE · Mock stream
      </span>

      <span className="mono small faint">{clock.toLocaleTimeString('en-IN', { hour12: false })}</span>
    </header>
  );
}