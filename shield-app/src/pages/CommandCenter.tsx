import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import { ALL_FASTENERS } from '../data/fasteners';
import { INVESTIGATIONS } from '../data/scenarios';
import { CATALOG, SYSTEM_GROUPS, childrenOf } from '../data/catalog';
import { Card, StatusChip, Stat, ProvTag } from '../ui/kit';
import type { PageKey } from '../schema/types';

const NAV_GRID: { key: PageKey; label: string; hint: string; num: string }[] = [
  { key: 'digital_eng', label: '01 Digital Engineering & CAE', hint: 'Interactive unibody BIW, 12 CAE load cases, and release gate', num: '01' },
  { key: 'mfg_quality', label: '02 Manufacturing Quality', hint: 'Digital Nominal CAD vs As-Built CMM laser metrology cell', num: '02' },
  { key: 'controlled_val', label: '03 Controlled Validation', hint: '4-Post road simulator, torsional rigidity rig, and CAE correlation', num: '03' },
  { key: 'road_corr', label: '04 Road Correlation', hint: '10 proving ground sectors, Indian road profiles, and event replay', num: '04' },
  { key: 'live_twin', label: '05 Live Digital Twin', hint: 'Full-screen vehicle view, sensor-structure link, and residual engine', num: '05' },
  { key: 'eng_analytics', label: '06 Engineering Analytics', hint: 'Root-Cause Trace backwards from road to factory & CAD release', num: '06' },
  { key: 'passport', label: '07 Vehicle Digital Passport', hint: 'Immutable 8-tab lifecycle ledger, ISO structural certification', num: '07' },
  { key: 'hardware', label: 'Hardware Live Diagnostic', hint: 'ESP32 serial / MQTT real-time sensor node connection', num: 'HW' },
];

export function CommandCenter() {
  const navigate = useStore((s) => s.navigate);
  const sensorLive = useStore((s) => s.sensorLive);
  const regionStates = useStore((s) => s.regionStates);
  const vehicleId = useStore((s) => s.vehicleId);
  const tlTime = useStore((s) => s.tlTime);
  const setTlTime = useStore((s) => s.setTlTime);

  const counts = { NORMAL: 0, WATCH: 0, INSPECTION_REQUIRED: 0, OFFLINE: 0 };
  let totalAnomaly = 0;
  let worstAnomaly = 0;
  let worstSensor = '';
  for (const [id, live] of Object.entries(sensorLive)) {
    const st = live.analytics.state;
    counts[st] = (counts[st] ?? 0) + 1;
    totalAnomaly += live.analytics.anomalyScore;
    if (live.analytics.anomalyScore > worstAnomaly) { worstAnomaly = live.analytics.anomalyScore; worstSensor = id; }
  }
  const liveSensors = Object.keys(sensorLive).length;
  const avgAnomaly = liveSensors ? totalAnomaly / liveSensors : 0;
  const regionCount = Object.values(regionStates).filter((r) => r.state !== 'NORMAL').length;
  const flaggedFasteners = ALL_FASTENERS.filter((f) => f.status === 'flagged').length;
  const openInvestigations = INVESTIGATIONS.filter((i) => i.state !== 'CLOSED').length;

  const alerts = Object.entries(sensorLive)
    .filter(([, l]) => l.analytics.state !== 'NORMAL')
    .sort((a, b) => b[1].analytics.anomalyScore - a[1].analytics.anomalyScore)
    .slice(0, 6);

  const totalParts = CATALOG.length;

  return (
    <div className="col stack splash-fade" style={{ padding: 14, maxWidth: 1500 }}>
      <div className="panel" style={{ padding: 12, background: 'linear-gradient(90deg, rgba(20,52,60,0.25), transparent)' }}>
        <div className="spread wrap">
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="h3" style={{ margin: 0, fontSize: 16 }}>Tata EV engineering use-case prototype</span>
              <ProvTag p="DEMO" />
            </div>
            <div className="small muted" style={{ marginTop: 4 }}>
              Interactive digital twin of a Tata-inspired compact electric SUV · procedural surrogate geometry — it does not claim to be OEM Tata CAD or BOM data.
            </div>
          </div>
          <div className="row wrap">
            <Stat label="Twin" value={<span className="mono">{vehicleId}</span>} sub="surrogate build · 2026-06" />
            <Stat label="Replay time" value={`${tlTime.toFixed(0)}s`} sub="timeline / 30 s" />
            <Stat label="Fleet sample" value="36" sub="synthetic units" />
          </div>
        </div>
      </div>

      <div className="grid4">
        <Stat label="Sensors live" value={`${liveSensors}/${SENSORS.length}`} sub={`avg anomaly ${avgAnomaly.toFixed(2)}`} accent={avgAnomaly > 0.5 ? 'var(--amber)' : 'var(--green)'} />
        <Stat label="WATCH" value={counts.WATCH} sub="persistent deviation" accent="var(--amber)" />
        <Stat label="INSPECTION REQUIRED" value={counts.INSPECTION_REQUIRED} sub="action threshold" accent={counts.INSPECTION_REQUIRED ? 'var(--red)' : 'var(--muted)'} />
        <Stat label="Regions flagged" value={regionCount} sub="model-estimated states" accent={regionCount ? 'var(--amber)' : 'var(--green)'} />
        <Stat label="Fasteners" value={ALL_FASTENERS.length} sub={`${flaggedFasteners} flagged (joint review)`} accent={flaggedFasteners ? 'var(--amber)' : 'var(--muted)'} />
        <Stat label="Open investigations" value={openInvestigations} sub="across fleet + this twin" accent={openInvestigations ? 'var(--amber)' : 'var(--muted)'} />
        <Stat label="Components" value={totalParts} sub="selectable in the twin" />
        <Stat label="Worst sensor" value={worstSensor || '—'} sub={worstAnomaly ? `anomaly ${worstAnomaly.toFixed(3)}` : 'no deviation'} accent={worstAnomaly > 0.5 ? 'var(--amber)' : 'var(--green)'} />
      </div>

      <div className="grid2">
        <Card title="System health (derived from sensor evidence)">
          <div className="col" style={{ gap: 6 }}>
            {SYSTEM_GROUPS.filter((g) => g.id !== 'SYS_FASTENERS' && g.id !== 'SYS_SENSORS').map((g) => {
              const comps = childrenOf(g.id);
              const flagged = comps.filter((c) => regionStates[c.id] && regionStates[c.id].state !== 'NORMAL').length;
              const frac = comps.length ? flagged / comps.length : 0;
              const label = g.id === 'SYS_EXTERIOR' ? 'EXTERIOR' : g.id === 'SYS_BIW' ? 'BIW' : g.id === 'SYS_SKATEBOARD' ? 'SKATEBOARD' : g.id.replace('SYS_', '');
              return (
                <div key={g.id} className="row" style={{ gap: 8 }}>
                  <span className="small" style={{ width: 150, flex: 'none' }}>{label}</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg2)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, frac * 100)}%`,
                        height: '100%', borderRadius: 4,
                        background: frac > 0.5 ? 'var(--red)' : frac > 0 ? 'var(--amber)' : 'var(--green)',
                        opacity: 0.9,
                      }}
                    />
                  </div>
                  <span className="tiny faint">{flagged}/{comps.length}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Alert feed — highest anomaly first">
          {alerts.length === 0 ? (
            <div className="tiny faint">No active alerts — all sensors at or near baseline.</div>
          ) : (
            <div className="col" style={{ gap: 6 }}>
              {alerts.map(([id, live]) => (
                <button
                  key={id}
                  className="panel"
                  style={{ padding: '7px 9px', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--text)', fontFamily: 'inherit' }}
                  onClick={() => navigate('diagnostics')}
                >
                  <div className="spread">
                    <span className="mono small" style={{ color: 'var(--cyan)' }}>{id}</span>
                    <StatusChip state={live.analytics.state} />
                  </div>
                  <div className="tiny muted" style={{ marginTop: 2 }}>{live.sensor.name}</div>
                  <div className="tiny faint" style={{ marginTop: 2 }}>
                    residual {live.analytics.residualPercent.toFixed(1)}% · persistence {live.analytics.persistenceScore.toFixed(2)} · anomaly {live.analytics.anomalyScore.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Vehicle Engineering Lifecycle Workspaces (01–07)">
        <div className="grid4">
          {NAV_GRID.map((n) => (
            <button
              key={n.key}
              className="panel"
              style={{
                padding: '10px 12px',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--text)',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--line)',
                transition: 'all 0.15s ease',
              }}
              onClick={() => navigate(n.key)}
            >
              <div className="spread">
                <span className="small" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{n.label}</span>
                <span className="tiny mono" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '1px 5px', borderRadius: 3 }}>{n.num}</span>
              </div>
              <div className="tiny faint" style={{ lineHeight: 1.3 }}>{n.hint}</div>
            </button>
          ))}
        </div>
        <div className="tiny faint" style={{ marginTop: 10 }}>
          Live data source: <b>Continuous Lifecycle Ingest</b> (Hardware Live ESP32 serial bridge, MQTT gateway, or physics-coupled mock). All analytical residual models comply with ISO structural verification guidelines.
        </div>
      </Card>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => setTlTime(18)}>Load event replay (t=18s)</button>
      </div>
    </div>
  );
}