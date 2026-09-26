import { useStore } from '../store/useStore';
import { CATALOG, CATALOG_BY_ID } from '../data/catalog';
import { BASELINES, FLEET_VEHICLES } from '../data/scenarios';
import { SENSORS } from '../data/sensors';
import { ALL_FASTENERS } from '../data/fasteners';
import { Card, StatusChip, ProvTag, fmtTs } from '../ui/kit';
import type { Provenance } from '../schema/types';

const PROVENANCE_ORDER: Provenance[] = ['VERIFIED', 'MEASURED', 'DERIVED', 'MODEL_ESTIMATED', 'SIMULATED', 'DEMO'];

export function StructuralPassport() {
  const vehicleId = useStore((s) => s.vehicleId);
  const sensorLive = useStore((s) => s.sensorLive);

  const provCounts = PROVENANCE_ORDER.map((p) => ({
    p,
    n: CATALOG.filter((c) => (c.provenance ?? 'DEMO') === p).length,
  }));

  const flaggedFasteners = ALL_FASTENERS.filter((f) => f.status === 'flagged').length;
  const verifiedTorque = ALL_FASTENERS.filter((f) => f.torqueSpecNm !== null).length;
  const verifiedComp = CATALOG.filter((c) => c.provenance === 'VERIFIED' || c.provenance === 'MEASURED').length;

  const exportJson = () => {
    const doc = {
      schema: 'shield.passport.v1',
      generatedAt: new Date().toISOString(),
      vehicleId,
      disclaimer: 'DEMO surrogate twin — not OEM Tata CAD/BOM. Provenance tags are honest labels, not verified records.',
      baselines: BASELINES,
      sensors: SENSORS.map((s) => ({ id: s.id, baseline: s.baseline, calibrationDate: s.calibrationDate, provenance: s.provenance })),
      jointSummary: { total: ALL_FASTENERS.length, flagged: flaggedFasteners, verifiedTorque },
      componentProvenance: provCounts,
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shield-passport-${vehicleId}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="col stack splash-fade" style={{ padding: 14, maxWidth: 1500 }}>
      <div className="spread wrap">
        <div>
          <h2 className="h3" style={{ margin: 0 }}>Structural Passport</h2>
          <div className="tiny muted">
            The honest provenance ledger for this twin: baselines, calibration, joints and data confidence — nothing claims to be verified OEM data when it is not.
          </div>
        </div>
        <button className="btn accent" onClick={exportJson}>⬇ Export passport JSON</button>
      </div>

      {/* vehicle identity */}
      <div className="panel" style={{ padding: 12, background: 'linear-gradient(90deg, rgba(20,52,60,0.25), transparent)' }}>
        <div className="spread wrap">
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="mono" style={{ color: 'var(--cyan)', fontSize: 16 }}>{vehicleId}</span>
              <ProvTag p="DEMO" />
            </div>
            <div className="small muted" style={{ marginTop: 4 }}>
              Twin — Compact EV SUV (procedural surrogate) · build 2026-06 · fleet sample {FLEET_VEHICLES.length} units
            </div>
          </div>
          <div className="row wrap">
            <PassportStat label="Components" value={CATALOG.length} sub={`${verifiedComp} verified/measured`} />
            <PassportStat label="Sensors" value={SENSORS.length} sub={`${Object.keys(sensorLive).length} streaming`} />
            <PassportStat label="Joints" value={ALL_FASTENERS.length} sub={`${flaggedFasteners} flagged · torque verified ${verifiedTorque}`} />
          </div>
        </div>
      </div>

      <div className="grid2">
        {/* ---- baselines ---- */}
        <Card title="Baselines">
          <div className="col" style={{ gap: 10 }}>
            {BASELINES.map((b) => (
              <div key={b.id} className="panel" style={{ padding: '9px 11px' }}>
                <div className="spread">
                  <span className="small" style={{ fontWeight: 600 }}>Baseline {b.id} — {b.name}</span>
                  <span className="tiny faint mono">{fmtTs(b.timestamp)}</span>
                </div>
                <div className="col" style={{ gap: 3, marginTop: 6 }}>
                  {b.items.map((it) => (
                    <div key={it.label} className="spread" style={{ gap: 8 }}>
                      <span className="tiny muted">{it.label}</span>
                      <span className="row" style={{ gap: 6, minWidth: 0 }}>
                        <span className="tiny mono" style={{ textAlign: 'right', color: 'var(--text)', overflowWrap: 'anywhere' }}>{it.value}</span>
                        <ProvTag p={it.provenance} />
                      </span>
                    </div>
                  ))}
                </div>
                {!b.items.every((i) => i.verified) && (
                  <div className="tiny faint" style={{ marginTop: 6 }}>
                    Baseline {b.id} items are {b.items[0]?.provenance.toLowerCase()} placeholders — they become VERIFIED only when the authoritative source is supplied.
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ---- provenance ledger ---- */}
        <Card title="Provenance ledger (all components)">
          <div className="col" style={{ gap: 8 }}>
            {provCounts.map(({ p, n }) => (
              <div key={p} className="row" style={{ gap: 8 }}>
                <ProvTag p={p} />
                <div style={{ flex: 1, height: 8, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(n / CATALOG.length) * 100}%`, height: '100%', background: 'var(--cyan)', opacity: 0.6 }} />
                </div>
                <span className="mono tiny">{n}</span>
              </div>
            ))}
          </div>
          <div className="tiny faint" style={{ marginTop: 8 }}>
            Nearly every catalog entry is DEMO by design — the twin is an engineering-use-case prototype, not a production database.
          </div>
          <hr className="rule" />
          <div className="small" style={{ fontWeight: 600, color: 'var(--amber)' }}>Understanding the tags</div>
          <div className="col" style={{ gap: 4, marginTop: 4 }}>
            <LegendLine p="VERIFIED" text="confirmed against an authoritative supplied source" />
            <LegendLine p="MEASURED" text="direct hardware measurement" />
            <LegendLine p="DERIVED" text="computed from measurements" />
            <LegendLine p="MODEL_ESTIMATED" text="engineering model / in-app heuristic" />
            <LegendLine p="SIMULATED" text="synthetic feed from the mock generator" />
            <LegendLine p="DEMO" text="placeholder for presentation only" />
          </div>
        </Card>
      </div>

      {/* ---- sensor calibration ---- */}
      <Card title="Sensor calibration & commissioning (Baseline B)">
        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Signal</th><th className="num">Baseline</th><th className="num">Sampling</th><th>Calibrated</th><th className="num">Quality</th><th>Live state</th></tr>
            </thead>
            <tbody>
              {SENSORS.map((s) => {
                const live = sensorLive[s.id];
                return (
                  <tr key={s.id}>
                    <td><span className="mono small" style={{ color: 'var(--cyan)' }}>{s.id}</span></td>
                    <td className="small">{s.name}</td>
                    <td><span className="tiny">{s.signal}</span></td>
                    <td className="num">{s.baseline.toFixed(s.signal === 'temperature' ? 1 : 0)} {s.unit}</td>
                    <td className="num">{s.samplingHz} Hz</td>
                    <td className="small mono">{s.calibrationDate}</td>
                    <td className="num">{s.quality.toFixed(2)}</td>
                    <td>{live ? <StatusChip state={live.analytics.state} /> : <span className="tiny faint">no data</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="tiny faint" style={{ marginTop: 8 }}>
          Baselines are the commissioning fingerprint (SIMULATED) used by the analytics engine. Calibration dates are DEMO.
        </div>
      </Card>

      {/* ---- joint verification note ---- */}
      <Card title="Joint verification status">
        <div className="grid3">
          <PassportStat label="Joints (total)" value={ALL_FASTENERS.length} />
          <PassportStat label="Flagged for review" value={flaggedFasteners} sub="seen in joint cards / investigations" />
          <PassportStat label="Verified torque values" value={`${verifiedTorque}/${ALL_FASTENERS.length}`} sub="rest intentionally display —" />
        </div>
        <div className="panel" style={{ marginTop: 10, padding: 8, background: 'var(--bg2)' }}>
          <div className="tiny faint">
            SHIELD renders a torque of “—” for every unverified fastener. A real torque number appears only when a verified BOM record is attached to that joint — never fabricated.
          </div>
        </div>
      </Card>

      <Card title="Sample component records">
        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Component</th><th>Confidence</th><th>Provenance</th><th>Last inspection</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {['FrontLongitudinal_L', 'Rocker_L', 'CrossMember_Front', 'Mount_BFL', 'BatteryPack_Tray', 'A_Pillar_L', 'RearFloor', 'B_Pillar_L'].map((id) => {
                const d = CATALOG_BY_ID[id];
                if (!d) return null;
                return (
                  <tr key={id}>
                    <td>
                      <div className="small">{d.name}</div>
                      <div className="tiny faint mono">{id}</div>
                    </td>
                    <td className="num">{(d.dataConfidence ?? 0).toFixed(2)}</td>
                    <td><ProvTag p={d.provenance} /></td>
                    <td className="small mono">{d.lastInspection ? fmtTs(d.lastInspection) : '—'}</td>
                    <td className="small mono">{d.lastUpdated ? fmtTs(d.lastUpdated) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PassportStat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="panel" style={{ padding: '8px 10px', minWidth: 120 }}>
      <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="h3" style={{ margin: '2px 0 0', color: 'var(--cyan)' }}>{value}</div>
      {sub && <div className="tiny faint" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function LegendLine({ p, text }: { p: Provenance; text: string }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <ProvTag p={p} />
      <span className="tiny muted">{text}</span>
    </div>
  );
}