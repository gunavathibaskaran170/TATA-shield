import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SENSORS, SENSOR_BY_ID } from '../data/sensors';
import { CATALOG_BY_ID } from '../data/catalog';
import { SENSOR_REGION_COMPONENTS } from '../dataflow/engine';
import { Card, StatusChip, ProvTag, pct } from '../ui/kit';
import type { HealthState, SensorLive } from '../schema/types';

interface Finding {
  key: string;
  sensorId: string;
  signal: string;
  componentIds: string[];
  state: HealthState;
  anomaly: number;
  persistence: number;
  residualPct: number;
  quality: number;
  hypothesis: string;
  suggestion: string;
}

/** Deterministic heuristic — not a trained ML model. Labeled accordingly. */
function explain(live: SensorLive, componentIds: string[]): Finding {
  const { analytics: a } = live;
  const { sensor } = live;
  const signal = sensor.signal;
  let hypothesis: string;
  let suggestion: string;

  if (a.state === 'INSPECTION_REQUIRED') {
    hypothesis = `Persistent ${signal} deviation on ${sensor.id} (persistence ${a.persistenceScore.toFixed(2)}). Pattern is consistent with sustained residual, not transient noise.`;
    suggestion = 'Schedule physical inspection of ' + componentIds.join(', ') + ' and review flagged joints on the load path; reopen the joint card for verification.';
  } else if (a.state === 'WATCH' && a.persistenceScore > 0.45) {
    hypothesis = `${sensor.id} shows elevated persistence without hitting the action threshold — deviation is settling slowly.`;
    suggestion = 'Monitor over the next journey; if persistence > 0.6 or residual grows past +10%, escalate to inspection.';
  } else if (a.state === 'WATCH') {
    hypothesis = `Transient ${signal} excursion on ${sensor.id} interpreted as an impulse response (e.g. road input) rather than structural change.`;
    suggestion = 'No immediate action — keep WATCH, verify by replaying the pothole event timeline and checking contributors.';
  } else if (a.persistenceScore > 0.5) {
    hypothesis = `${sensor.id} sits near baseline but carries an elevated persistence memory from a prior window.`;
    suggestion = 'Let the persistence EMA decay; re-check after a clean cruise window.';
  } else {
    hypothesis = `${sensor.id} is on its commissioning baseline with no material deviation.`;
    suggestion = 'No action. Continue routine monitoring.';
  }

  return {
    key: sensor.id,
    sensorId: sensor.id,
    signal,
    componentIds,
    state: a.state,
    anomaly: a.anomalyScore,
    persistence: a.persistenceScore,
    residualPct: a.residualPercent,
    quality: live.packet.quality,
    hypothesis,
    suggestion,
  };
}

export function AIDiagnostics() {
  const sensorLive = useStore((s) => s.sensorLive);
  const regionStates = useStore((s) => s.regionStates);
  const navigate = useStore((s) => s.navigate);
  const focusOn = useStore((s) => s.focusOn);
  const select = useStore((s) => s.select);

  const findings = useMemo(() => {
    const out: Finding[] = [];
    for (const live of Object.values(sensorLive)) {
      const comps = SENSOR_REGION_COMPONENTS[live.sensor.id] ?? [];
      out.push(explain(live, comps));
    }
    return out.sort((a, b) => b.anomaly - a.anomaly);
  }, [sensorLive]);

  const worst = findings[0] ?? null;
  const regionFlags = Object.values(regionStates).filter((r) => r.state !== 'NORMAL').length;

  return (
    <div className="col stack splash-fade" style={{ padding: 14, maxWidth: 1500 }}>
      <div className="spread wrap">
        <div>
          <h2 className="h3" style={{ margin: 0 }}>AI Diagnostics</h2>
          <div className="tiny muted">
            Explainable, rule-based suggestions from residual + persistence + quality. This is a transparent heuristic — <b>not</b> a trained ML model and not an FEA solver.
          </div>
        </div>
        <span className="chip"><span className="dot dot-watch" /> {regionFlags} region(s) flagged · MODEL_ESTIMATED</span>
      </div>

      <div className="grid2">
        {/* ---- worst-case explainer ---- */}
        <Card title="Lead finding — highest anomaly">
          {worst ? (
            <div className="col" style={{ gap: 8 }}>
              <div className="spread">
                <span className="mono" style={{ color: 'var(--cyan)', fontSize: 14 }}>{worst.sensorId} · {worst.signal}</span>
                <StatusChip state={worst.state} />
              </div>
              <EvidenceRow label="Residual" value={pct(worst.residualPct, 1)} />
              <EvidenceRow label="Persistence (EMA)" value={worst.persistence.toFixed(3)} />
              <EvidenceRow label="Anomaly score" value={worst.anomaly.toFixed(3)} />
              <EvidenceRow label="Signal quality" value={worst.quality.toFixed(3)} />
              <EvidenceRow label="Influenced components" value={worst.componentIds.length ? worst.componentIds.join(', ') : '—'} />
              <hr className="rule" />
              <div className="small" style={{ fontWeight: 600, color: 'var(--amber)' }}>Hypothesis</div>
              <div className="small muted" style={{ lineHeight: 1.5 }}>{worst.hypothesis}</div>
              <div className="small" style={{ fontWeight: 600, color: 'var(--green)' }}>Suggested action</div>
              <div className="small muted" style={{ lineHeight: 1.5 }}>{worst.suggestion}</div>
            </div>
          ) : (
            <div className="tiny faint">Waiting for telemetry to explain…</div>
          )}
        </Card>

        {/* ---- decision trace ---- */}
        <Card title="Decision trace (transparent heuristic)">
          <div className="col" style={{ gap: 8 }}>
            <TraceStep n="1" text="Compute rolling mean over the last 8 packets per sensor (DERIVED)." />
            <TraceStep n="2" text="Residual = mean − Baseline B fingerprint. Persistence = EMA of normalized |residual|." />
            <TraceStep n="3" text="Anomaly = 0.42·residual + 0.40·persistence + 0.18·quality (MODEL_ESTIMATED)." />
            <TraceStep n="4" text="State thresholds: &lt;0.35 NORMAL · &lt;0.7 WATCH · ≥0.7 INSPECTION_REQUIRED." />
            <TraceStep n="5" text="Findings are ranked by anomaly and phrased by signal type + state + persistence." />
          </div>
          <div className="panel" style={{ marginTop: 8, padding: 8, background: 'var(--bg2)' }}>
            <div className="tiny faint">
              Every step is inspectable and deterministic. Replacing this with a trained model would change only the explanation source — the data contract stays.
            </div>
          </div>
        </Card>
      </div>

      <Card title="Findings per sensor (ranked)">
        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Sensor</th><th>Signal</th><th>State</th><th className="num">Anomaly</th><th className="num">Persistence</th><th className="num">Residual</th><th>Hypothesis (short)</th><th /></tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.key}>
                  <td>
                    <span className="mono small" style={{ color: 'var(--cyan)' }}>{f.sensorId}</span>
                    <div className="tiny faint">{SENSOR_BY_ID[f.sensorId]?.name}</div>
                  </td>
                  <td><span className="tiny">{f.signal}</span></td>
                  <td><StatusChip state={f.state} /></td>
                  <td className="num" style={{ color: f.anomaly > 0.66 ? 'var(--red)' : f.anomaly > 0.33 ? 'var(--amber)' : 'var(--green)' }}>
                    {f.anomaly.toFixed(3)}
                  </td>
                  <td className="num">{f.persistence.toFixed(3)}</td>
                  <td className="num">{pct(f.residualPct, 1)}</td>
                  <td className="small muted">{f.hypothesis}</td>
                  <td>
                    <button className="btn" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => navigate('twin')}>
                      locate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row wrap" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => navigate('intelligence')}>Structural intelligence</button>
          <button className="btn" onClick={() => navigate('investigations')}>Investigations</button>
          <ProvTag p="MODEL_ESTIMATED" />
        </div>
      </Card>

      <div className="grid2">
        <Card title="Cross-check — sensors informing the same components">
          <div className="col" style={{ gap: 5 }}>
            {SENSORS.map((s) => {
              const comps = SENSOR_REGION_COMPONENTS[s.id] ?? [];
              const peers = comps.flatMap((c) =>
                Object.entries(SENSOR_REGION_COMPONENTS)
                  .filter(([, cs]) => cs.includes(c) && cs !== comps)
                  .map(([sid]) => sid),
              );
              return (
                <div key={s.id} className="spread" style={{ gap: 8 }}>
                  <span className="mono small" style={{ color: 'var(--cyan)' }}>{s.id}</span>
                  <span className="tiny faint grow" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    influences: {comps.length} components
                  </span>
                  <span className="tiny muted">cross-checks: {[...new Set(peers)].join(', ') || '—'}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Component-level quick access">
          <div className="col" style={{ gap: 5 }}>
            {(['Mount_BRR', 'Mount_BRL', 'FrontLongitudinal_L', 'CrossMember_Rear'] as const).map((id) => {
              const r = regionStates[id];
              const def = CATALOG_BY_ID[id];
              return (
                <button key={id} className="panel" style={{ padding: '7px 9px', textAlign: 'left', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit' }} onClick={() => { select(id); focusOn(id); navigate('twin'); }}>
                  <div className="spread">
                    <span className="small">{def?.name ?? id}</span>
                    {r ? <StatusChip state={r.state} /> : <span className="tiny faint">no region state</span>}
                  </div>
                  <div className="tiny faint mono">{id}{r ? ` · anomaly ${r.anomaly.toFixed(2)}` : ''}</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="spread" style={{ padding: '3px 0' }}>
      <span className="tiny muted">{label}</span>
      <span className="mono small" style={{ textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function TraceStep({ n, text }: { n: string; text: string }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <span className="tag" style={{ color: 'var(--cyan)' }}>{n}</span>
      <span className="small muted">{text}</span>
    </div>
  );
}