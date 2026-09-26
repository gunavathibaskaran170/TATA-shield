import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import { CATALOG_BY_ID } from '../data/catalog';
import { SENSOR_REGION_COMPONENTS } from '../dataflow/engine';
import { Card, StatusChip, ProvTag, pct } from '../ui/kit';
import { HeatmapControls, HeatmapLegend } from '../ui/HeatmapLegend';

export function StructuralIntelligence() {
  const sensorLive = useStore((s) => s.sensorLive);
  const regionStates = useStore((s) => s.regionStates);
  const heatValues = useStore((s) => s.heatValues);
  const focusOn = useStore((s) => s.focusOn);
  const select = useStore((s) => s.select);
  const setHeatmapMode = useStore((s) => s.setHeatmapMode);

  const rankedRegions = Object.entries(regionStates)
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => b.anomaly - a.anomaly);

  const heatTop = Object.entries(heatValues)
    .map(([id, v]) => ({ id, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 8);

  const maxHeat = Math.max(0.01, ...Object.values(heatValues));

  return (
    <div className="col stack splash-fade" style={{ padding: 14, maxWidth: 1500 }}>
      <div className="spread wrap">
        <div>
          <h2 className="h3" style={{ margin: 0 }}>Structural Intelligence</h2>
          <div className="tiny muted">Region states are derived in-app from the sensor stream via residual → persistence → anomaly. All values are MODEL_ESTIMATED.</div>
        </div>
        <HeatmapControls />
      </div>

      <div className="grid2">
        <Card title={
          <span className="row" style={{ gap: 8 }}>
            Region states <ProvTag p="MODEL_ESTIMATED" />
          </span>
        }>
          <div style={{ overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr><th>Region</th><th>State</th><th>Anomaly</th><th>Residual</th><th>Persistence</th><th>Conf</th><th /></tr>
              </thead>
              <tbody>
                {rankedRegions.slice(0, 14).map((r) => {
                  const def = CATALOG_BY_ID[r.id];
                  return (
                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => select(r.id)} onDoubleClick={() => focusOn(r.id)}>
                      <td>
                        <div className="small">{def?.name ?? r.id}</div>
                        <div className="tiny faint mono">{r.id}</div>
                      </td>
                      <td><StatusChip state={r.state} /></td>
                      <td className="num">{r.anomaly.toFixed(2)}</td>
                      <td className="num">{pct(r.residualPct, 1)}</td>
                      <td className="num">{r.persistence.toFixed(2)}</td>
                      <td className="num">{r.confidence.toFixed(2)}</td>
                      <td><span className="tiny faint">M-E</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="tiny faint" style={{ marginTop: 8 }}>
            Sorted by anomaly score. Sources are model-estimated until hardware-verified baselines are loaded.
          </div>
        </Card>

        <Card title="Sensor → structure influence map">
          <div className="col" style={{ gap: 6 }}>
            {SENSORS.map((s) => {
              const live = sensorLive[s.id];
              const comps = SENSOR_REGION_COMPONENTS[s.id] ?? [];
              return (
                <div key={s.id} className="panel" style={{ padding: '7px 9px' }}>
                  <div className="spread">
                    <span className="mono small" style={{ color: 'var(--cyan)' }}>{s.id}</span>
                    <span className="tiny muted">{comps.length} components · {s.signal}</span>
                    {live ? <StatusChip state={live.analytics.state} /> : <span className="tiny faint">no data</span>}
                  </div>
                  <div className="tiny faint" style={{ marginTop: 3 }}>
                    informs: {comps.map((c) => CATALOG_BY_ID[c]?.id ?? c).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid2">
        <Card title="Highest heat (model-estimated overlay)">
          <div className="col" style={{ gap: 8 }}>
            {heatTop.map((h) => {
              const def = CATALOG_BY_ID[h.id];
              return (
                <div key={h.id} className="row" style={{ gap: 8 }}>
                  <span className="small" style={{ width: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {def?.name ?? h.id}
                  </span>
                  <div style={{ flex: 1, height: 9, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
                    <HeatBar v={h.v / maxHeat} />
                  </div>
                  <span className="mono tiny">{h.v.toFixed(3)}</span>
                </div>
              );
            })}
          </div>
          <HeatmapLegend />
          <div className="tiny faint" style={{ marginTop: 6 }}>
            Heat = anomaly per component, aggregated from the influencing sensors. Not strain/stress until physical models are fitted.
          </div>
        </Card>

        <Card title="Twin-level intelligence summary">
          <div className="col" style={{ gap: 8 }}>
            <VerificationRow label="Sensor baseline fingerprint" body="Baseline B commissioning values (SIMULATED) drive residual computation." />
            <VerificationRow label="Anomaly model" body="0.42·residual + 0.40·persistence + 0.18·quality — a lightweight heuristic, not an FEA solver." />
            <VerificationRow label="Load redistribution" body="Currently reporting 0 — requires installation of strain at load-transfer points to be meaningful." />
            <VerificationRow label="Next steps" body="Fit physical model → replace heuristic with derived stress states (label becomes DERIVED)." />
          </div>
          <div className="panel" style={{ marginTop: 10, padding: 8, background: 'var(--bg2)' }}>
            <div className="tiny faint">
              Nothing on this page should be used to clear or condemn hardware without engineering review. Values marked MODEL_ESTIMATED are produced by the in-app demo analytics pipeline.
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick controls">
        <div className="row wrap">
          <button className="btn" onClick={() => setHeatmapMode('anomaly')}>Heatmap: anomaly</button>
          <button className="btn" onClick={() => setHeatmapMode('strain')}>Heatmap: strain (model)</button>
          <button className="btn" onClick={() => setHeatmapMode('off')}>Heatmap off</button>
        </div>
      </Card>
    </div>
  );
}

function HeatBar({ v }: { v: number }) {
  const pctw = Math.max(2, Math.min(100, v * 100));
  return (
    <div style={{ width: `${pctw}%`, height: '100%', background: v > 0.66 ? 'var(--red)' : v > 0.33 ? 'var(--amber)' : 'var(--green)' }} />
  );
}

function VerificationRow({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="small" style={{ fontWeight: 600 }}>{label}</div>
      <div className="tiny muted" style={{ marginTop: 2 }}>{body}</div>
    </div>
  );
}