import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { FLEET_CORRELATIONS, FLEET_VEHICLES, BASELINES, INVESTIGATIONS } from '../data/scenarios';
import { SENSORS } from '../data/sensors';
import { ALL_FASTENERS } from '../data/fasteners';
import { Card, StatusChip, ProvTag, fmtTs, EmptyState } from '../ui/kit';
import type { SensorStatus } from '../schema/types';
import { PageHeader } from '../ui/PageHeader';

interface ReportRow {
  sensorId: string;
  name: string;
  signal: string;
  value: number;
  unit: string;
  residualPct: number;
  persistence: number;
  anomaly: number;
  state: SensorStatus;
}

function buildReport() {
  const st = useStore.getState();
  const rows: ReportRow[] = SENSORS.map((s) => {
    const live = st.sensorLive[s.id];
    return {
      sensorId: s.id,
      name: s.name,
      signal: s.signal,
      value: live ? live.packet.value : NaN,
      unit: s.unit,
      residualPct: live ? live.analytics.residualPercent : NaN,
      persistence: live ? live.analytics.persistenceScore : NaN,
      anomaly: live ? live.analytics.anomalyScore : NaN,
      state: live ? live.analytics.state : 'OFFLINE',
    };
  });
  const flagged = ALL_FASTENERS.filter((f) => f.status === 'flagged');
  const openInv = INVESTIGATIONS.filter((i) => i.state !== 'CLOSED');
  return {
    id: `SHR-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    vehicleId: st.vehicleId,
    disclaimer: 'DEMO engineering-use-case report. Not OEM Tata data; analytics are MODEL_ESTIMATED.',
    rows,
    flaggedJoints: flagged.map((f) => f.id),
    openInvestigations: openInv.map((i) => i.id),
    fleetCorrelations: FLEET_CORRELATIONS,
    fleetUnits: FLEET_VEHICLES.length,
    baselines: BASELINES.length,
  };
}

function toCsv(r: ReturnType<typeof buildReport>): string {
  const head = ['sensorId', 'name', 'signal', 'value', 'unit', 'residualPct', 'persistence', 'anomaly', 'state'];
  const lines = [head.join(',')];
  for (const row of r.rows) {
    lines.push([
      row.sensorId, `"${row.name.replace(/"/g, '""')}"`, row.signal,
      Number.isFinite(row.value) ? row.value.toFixed(3) : '', row.unit,
      Number.isFinite(row.residualPct) ? row.residualPct.toFixed(2) : '',
      Number.isFinite(row.persistence) ? row.persistence.toFixed(3) : '',
      Number.isFinite(row.anomaly) ? row.anomaly.toFixed(3) : '',
      row.state,
    ].join(','));
  }
  return lines.join('\n');
}

function toMarkdown(r: ReturnType<typeof buildReport>): string {
  const l: string[] = [];
  l.push(`# SHIELD vehicle report — ${r.vehicleId}`);
  l.push('');
  l.push(`> ${r.disclaimer}`);
  l.push(`> Generated: ${fmtTs(r.generatedAt)} · Report id: ${r.id}`);
  l.push('');
  l.push('## Sensor summary');
  l.push('');
  l.push('| Sensor | State | Anomaly | Persistence | Residual % |');
  l.push('| --- | --- | ---: | ---: | ---: |');
  for (const row of r.rows) {
    l.push(`| ${row.sensorId} ${row.signal} | ${row.state} | ${Number.isFinite(row.anomaly) ? row.anomaly.toFixed(3) : '—'} | ${Number.isFinite(row.persistence) ? row.persistence.toFixed(3) : '—'} | ${Number.isFinite(row.residualPct) ? row.residualPct.toFixed(1) : '—'} |`);
  }
  l.push('');
  l.push(`## Joints — ${r.flaggedJoints.length} flagged of ${ALL_FASTENERS.length}`);
  l.push('');
  l.push(r.flaggedJoints.map((j) => `- ${j}`).join('\n') || '- none');
  l.push('');
  l.push(`## Fleet correlations (correlation ≠ causation)`);
  l.push('');
  for (const c of r.fleetCorrelations) l.push(`- ${c.label} (${Math.round(c.strength * 100)}%)`);
  l.push('');
  l.push(`## Investigations — ${r.openInvestigations.length} open`);
  l.push('');
  l.push(r.openInvestigations.join('\n') || '- none');
  return l.join('\n');
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function Reports() {
  const [fmt, setFmt] = useState<'overview' | 'json' | 'csv' | 'md'>('overview');
  const [gen, setGen] = useState(0);
  const [report, setReport] = useState<ReturnType<typeof buildReport> | null>(null);

  useEffect(() => { setReport(buildReport()); }, [gen]);

  if (!report) return <EmptyState title="Building report…" sub="Reading current twin state" />;

  const worst = [...report.rows].sort((a, b) => b.anomaly - a.anomaly)[0];
  const counts = report.rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.state] = (acc[r.state] ?? 0) + 1;
    return acc;
  }, {});

  const ext = fmt === 'csv' ? 'csv' : fmt === 'md' ? 'md' : 'json';

  return (
    <div className="col" style={{ width: '100%', minHeight: '100%', fontFamily: 'var(--font-sans)' }}>
      <PageHeader
        title="Event History & Export Records"
        description="Export engineering summaries and data logs from the active vehicle digital twin."
        badge={report.id}
        badgeType="default"
      >
        <button className="btn" onClick={() => setGen((g) => g + 1)} title="Re-read current twin state">⟳ Refresh</button>
        <button className="btn accent" onClick={() => download(`shield-report-${report.vehicleId}.${ext}`, fmt === 'csv' ? toCsv(report) : fmt === 'md' ? toMarkdown(report) : JSON.stringify(report, null, 2), fmt === 'csv' ? 'text/csv' : fmt === 'md' ? 'text/markdown' : 'application/json')}>
          ⬇ Export {ext.toUpperCase()}
        </button>
      </PageHeader>
      <div className="col stack splash-fade" style={{ padding: 24 }}>

      <div className="row wrap">
        {(['overview', 'json', 'csv', 'md'] as const).map((f) => (
          <button key={f} className={fmt === f ? 'btn active' : 'btn'} onClick={() => setFmt(f)}>
            {f === 'overview' ? 'Overview' : f === 'json' ? 'JSON preview' : f === 'csv' ? 'CSV preview' : 'Markdown preview'}
          </button>
        ))}
      </div>

      {fmt === 'overview' && (
        <div className="col stack">
          <div className="panel" style={{ padding: 12 }}>
            <div className="spread wrap">
              <div>
                <div className="row" style={{ gap: 10 }}>
                  <span className="h3" style={{ margin: 0 }}>Vehicle report — {report.vehicleId}</span>
                  <ProvTag p="DEMO" />
                </div>
                <div className="tiny muted" style={{ marginTop: 4 }}>
                  Generated {fmtTs(report.generatedAt)} · twin build 2026-06 · {report.fleetUnits} synthetic fleet units referenced
                </div>
              </div>
              <div className="row wrap">
                <MiniStat label="Normal" value={counts.NORMAL ?? 0} />
                <MiniStat label="Watch" value={counts.WATCH ?? 0} accent="var(--amber)" />
                <MiniStat label="Inspection" value={counts.INSPECTION_REQUIRED ?? 0} accent="var(--red)" />
                <MiniStat label="Joints flagged" value={report.flaggedJoints.length} accent="var(--amber)" />
              </div>
            </div>
          </div>

          <div className="grid2">
            <Card title="Sensor state summary">
              <div style={{ overflow: 'auto', maxHeight: 320 }}>
                <table className="tbl">
                  <thead><tr><th>Sensor</th><th>State</th><th className="num">Anomaly</th><th className="num">Persistence</th><th className="num">Residual %</th></tr></thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={row.sensorId}>
                        <td><span className="mono small" style={{ color: 'var(--cyan)' }}>{row.sensorId}</span> <span className="tiny faint">{row.signal}</span></td>
                        <td><StatusChip state={row.state} /></td>
                        <td className="num">{Number.isFinite(row.anomaly) ? row.anomaly.toFixed(3) : '—'}</td>
                        <td className="num">{Number.isFinite(row.persistence) ? row.persistence.toFixed(3) : '—'}</td>
                        <td className="num">{Number.isFinite(row.residualPct) ? row.residualPct.toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {worst && <div className="tiny faint" style={{ marginTop: 6 }}>Lead signal: {worst.sensorId} · anomaly {worst.anomaly.toFixed(3)}</div>}
            </Card>

            <div className="col" style={{ gap: 10 }}>
              <Card title="Flagged joints">
                {report.flaggedJoints.length
                  ? <div className="row wrap">{report.flaggedJoints.map((j) => <span key={j} className="tag" style={{ color: 'var(--red)' }}>{j}</span>)}</div>
                  : <div className="tiny faint">No flagged joints.</div>}
                <div className="tiny faint" style={{ marginTop: 6 }}>Torque values remain unverified for all joints — reported as “—” not fabricated figures.</div>
              </Card>
              <Card title="Fleet correlations (DEMO)">
                <div className="col" style={{ gap: 5 }}>
                  {report.fleetCorrelations.map((c) => (
                    <div key={c.factor} className="panel" style={{ padding: '7px 9px', background: 'var(--bg2)' }}>
                      <div className="small">{c.label}</div>
                      <div className="tiny" style={{ color: 'var(--amber)', marginTop: 2 }}>{c.note}</div>
                    </div>
                  ))}
                </div>
                <div className="tiny faint" style={{ marginTop: 6 }}>Correlation ≠ causation. No defect claim is made.</div>
              </Card>
              <Card title="Investigations">
                <div className="col" style={{ gap: 5 }}>
                  {report.openInvestigations.length
                    ? report.openInvestigations.map((id) => <span key={id} className="tag" style={{ color: 'var(--cyan)' }}>{id}</span>)
                    : <div className="tiny faint">None open.</div>}
                </div>
                <div className="tiny faint" style={{ marginTop: 6 }}>
                  {BASELINES.length} baseline record(s) referenced. Full provenance in the Structural Passport.
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {fmt === 'json' && (
        <Card title="JSON preview">
          <pre className="mono" style={{ fontSize: 11, maxHeight: 520, overflow: 'auto', color: 'var(--text)', lineHeight: 1.5 }}>{JSON.stringify(report, null, 2)}</pre>
        </Card>
      )}

      {fmt === 'csv' && (
        <Card title="CSV preview (sensor rows)">
          <pre className="mono" style={{ fontSize: 11, maxHeight: 520, overflow: 'auto', color: 'var(--text)', lineHeight: 1.6 }}>{toCsv(report)}</pre>
        </Card>
      )}

      {fmt === 'md' && (
        <Card title="Markdown preview">
          <pre className="mono" style={{ fontSize: 11, maxHeight: 520, overflow: 'auto', color: 'var(--text)', lineHeight: 1.6 }}>{toMarkdown(report)}</pre>
        </Card>
      )}
    </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="panel" style={{ padding: '7px 10px', minWidth: 90 }}>
      <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="h3" style={{ margin: '2px 0 0', color: accent ?? 'var(--text)' }}>{value}</div>
    </div>
  );
}