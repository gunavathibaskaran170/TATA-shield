import { useStore, systemOf } from '../store/useStore';
import { CATALOG_BY_ID } from '../data/catalog';
import { BASELINES } from '../data/scenarios';
import { FASTENER_GROUPS, ALL_FASTENERS } from '../data/fasteners';
import { LAYER_BY_INDEX } from '../data/layers';
import { Card, ProvTag } from '../ui/kit';

/* Stations on the (conceptual) build sequence. DEMO representation —
   SHIELD does not claim these match any real Tata plant operation. */
const STATIONS = [
  { key: 'stamping', label: 'Stamping', desc: 'Panels & structural blanks formed from sheet', icon: '▱' },
  { key: 'biw', label: 'Body shop (BIW)', desc: 'Rails, pillars, floor and closures joined', icon: '⛓' },
  { key: 'paint', label: 'Paint / pre-treatment', desc: 'Coating + sealing of the body shell', icon: '◍' },
  { key: 'battery', label: 'Battery pack line', desc: 'Tray, modules, cover and mounts', icon: '▤' },
  { key: 'trim', label: 'Trim & final', desc: 'Cabin, electrical, closures fit-out', icon: '▣' },
  { key: 'audit', label: 'QC / audit', desc: 'Gates, torque sampling, leak & seat check', icon: '✓' },
] as const;

const THREAD_COMPONENTS = [
  'FrontLongitudinal_L', 'FrontLongitudinal_R', 'A_Pillar_L', 'B_Pillar_L', 'Rocker_L', 'Rocker_R',
  'FrontFloor', 'RearFloor', 'CrossMember_Front', 'CrossMember_Rear',
  'BatteryPack_Tray', 'BatteryPack_Cover', 'Mount_BFL', 'Mount_BRR',
];

export function ManufacturingThread() {
  const select = useStore((s) => s.select);
  const focusOn = useStore((s) => s.focusOn);
  const navigate = useStore((s) => s.navigate);
  const baselineA = BASELINES.find((b) => b.category === 'manufacturing');

  const jointCounts = FASTENER_GROUPS.map((g) => {
    const n = g.items.length;
    const flagged = g.items.filter((f) => f.status === 'flagged').length;
    const inspected = g.items.filter((f) => f.status === 'inspected').length;
    const withTorque = g.items.filter((f) => f.torqueSpecNm !== null).length;
    return { ...g, n, flagged, inspected, withTorque };
  });

  const totalJoints = ALL_FASTENERS.length;
  const flaggedJoints = ALL_FASTENERS.filter((f) => f.status === 'flagged').length;
  const verifiedTorque = ALL_FASTENERS.filter((f) => f.torqueSpecNm !== null).length;

  return (
    <div className="col stack splash-fade" style={{ padding: 14, maxWidth: 1500 }}>
      <div className="spread wrap">
        <div>
          <h2 className="h3" style={{ margin: 0 }}>Manufacturing Digital Thread</h2>
          <div className="tiny muted">
            A conceptual trace from stamping → body → battery → audit for the surrogate twin. Processes and gates are DEMO —
            no claim is made that they reflect a real Tata plant or BOM.
          </div>
        </div>
        <div className="row wrap">
          <span className="chip"><span className="dot dot-normal" /> {totalJoints} joints</span>
          <span className="chip"><span className="dot dot-watch" /> {flaggedJoints} flagged</span>
          <span className="chip"><span className="dot dot-offline" /> {verifiedTorque}/{totalJoints} with verified torque</span>
        </div>
      </div>

      {/* ---- build stations ---- */}
      <Card title="Build sequence stations (DEMO workflow)">
        <div className="grid3">
          {STATIONS.map((s) => (
            <div key={s.key} className="panel" style={{ padding: '9px 11px' }}>
              <div className="spread">
                <span className="small" style={{ fontWeight: 600, color: 'var(--cyan)' }}>{s.icon} {s.label}</span>
                <ProvTag p="DEMO" />
              </div>
              <div className="tiny faint" style={{ marginTop: 3 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid2">
        {/* ---- manufacturing quality gates ---- */}
        <Card title={
          <span className="row" style={{ gap: 8 }}>
            Manufacturing quality gates <ProvTag p="DEMO" />
          </span>
        }>
          <div className="col" style={{ gap: 6 }}>
            {baselineA?.items.map((it) => (
              <div key={it.label} className="row" style={{ gap: 8 }}>
                <span
                  style={{
                    width: 14, height: 14, borderRadius: '50%', flex: 'none',
                    background: it.verified ? 'var(--green)' : 'var(--amber)',
                    opacity: it.verified ? 1 : 0.75,
                    display: 'inline-block',
                  }}
                  title={it.verified ? 'Verified' : 'DEMO placeholder — pending real gate data'}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small">{it.label}</div>
                  <div className="tiny faint mono" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{it.value}</div>
                </div>
                <ProvTag p={it.provenance} />
              </div>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => navigate('passport')}>
            Open full passport (Baselines A / B)
          </button>
          <div className="panel" style={{ marginTop: 10, padding: 8, background: 'var(--bg2)' }}>
            <div className="tiny faint">
              Gate results above are placeholders. When a real quality database is attached, each gate becomes traceable to a part/batch serial.
            </div>
          </div>
        </Card>

        {/* ---- joint verification status ---- */}
        <Card title="Joint verification status (torques remain unverified)">
          <div style={{ overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr><th>Group</th><th className="num">Joints</th><th className="num">Inspected</th><th className="num">Flagged</th><th className="num">Verified torque</th></tr>
              </thead>
              <tbody>
                {jointCounts.map((g) => (
                  <tr key={g.id} style={{ cursor: 'pointer' }} onClick={() => { select(g.id); focusOn(g.id); }}>
                    <td>
                      <div className="small">{g.family.replace(/_/g, ' ')}</div>
                      <div className="tiny faint mono">{g.id}</div>
                    </td>
                    <td className="num">{g.n}</td>
                    <td className="num">{g.inspected}</td>
                    <td className="num">{g.flagged ? <span style={{ color: 'var(--red)' }}>{g.flagged}</span> : 0}</td>
                    <td className="num">{g.withTorque || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel" style={{ marginTop: 8, padding: 8, background: 'var(--bg2)' }}>
            <div className="tiny faint">
              No torque values are displayed anywhere in SHIELD until a verified BOM supplies them — the UI renders “—” instead of fabricated figures.
            </div>
          </div>
        </Card>
      </div>

      {/* ---- digital thread records ---- */}
      <Card title="Component-level thread (representative BIW/battery records)">
        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Component</th><th>System</th><th>Layer</th><th>Manufacturing process</th><th>Material</th><th>Conf.</th><th /></tr>
            </thead>
            <tbody>
              {THREAD_COMPONENTS.map((id) => {
                const def = CATALOG_BY_ID[id];
                if (!def) return null;
                return (
                  <tr key={id} style={{ cursor: 'pointer' }} onDoubleClick={() => focusOn(id)} onClick={() => select(id)}>
                    <td>
                      <div className="small">{def.name}</div>
                      <div className="tiny faint mono">{id}</div>
                    </td>
                    <td><span className="tiny">{systemOf(id).replace('SYS_', '')}</span></td>
                    <td><span className="tiny mono">L{def.layer} · {LAYER_BY_INDEX[def.layer]?.label.slice(0, 18)}</span></td>
                    <td className="small">{def.manufacturingProcess}</td>
                    <td className="small">{def.material}</td>
                    <td><ProvTag p={def.provenance} /></td>
                    <td>
                      <button className="btn" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => navigate('twin')}>in twin</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="tiny faint" style={{ marginTop: 8 }}>
          Materials / processes are DEMO representative values — every row carries its provenance. Masses, gauges and tolerances are DEMO until verified CAD/BOM is loaded.
        </div>
      </Card>
    </div>
  );
}