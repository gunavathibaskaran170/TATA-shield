import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, ZAxis, Cell,
} from 'recharts';
import { useStore } from '../store/useStore';
import { FLEET_VEHICLES, FLEET_CORRELATIONS, MILEAGE_BANDS, mileageBandOf, INVESTIGATIONS } from '../data/scenarios';
import { Card, StatusChip, Stat, fmtNum } from '../ui/kit';
import type { FleetFilterKey, HealthState } from '../schema/types';
import { PageHeader } from '../ui/PageHeader';

const HEALTH_HEX: Record<HealthState, string> = {
  NORMAL: '#4fe0a0', WATCH: '#f2b94e', INSPECTION_REQUIRED: '#ff6b5e',
};

const CRITICAL_COMPONENTS = [
  'FrontLongitudinal_L', 'FrontLongitudinal_R', 'CrossMember_Front', 'CrossMember_Rear',
  'Mount_BFL', 'Mount_BRR', 'Rocker_L', 'Rocker_R',
];

export function FleetAnalytics() {
  const filters = useStore((s) => s.fleetFilters);
  const setFleetFilter = useStore((s) => s.setFleetFilter);
  const resetFleetFilters = useStore((s) => s.resetFleetFilters);
  const navigate = useStore((s) => s.navigate);
  const [selVin, setSelVin] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FLEET_VEHICLES.filter((v) => {
      if (filters.model && v.model !== filters.model) return false;
      if (filters.variant && v.variant !== filters.variant) return false;
      if (filters.modelYear && String(v.year) !== filters.modelYear) return false;
      if (filters.plant && v.plant !== filters.plant) return false;
      if (filters.batch && v.batch !== filters.batch) return false;
      if (filters.mileageBand && mileageBandOf(v.mileageKm) !== filters.mileageBand) return false;
      if (filters.region && v.region !== filters.region) return false;
      if (filters.healthState && v.health !== filters.healthState) return false;
      if (filters.component) {
        if ((v.componentHealth[filters.component] ?? 'NORMAL') === 'NORMAL') return false;
      }
      return true;
    });
  }, [filters]);

  const bandData = useMemo(() => MILEAGE_BANDS.map((b) => {
    const inBand = filtered.filter((v) => mileageBandOf(v.mileageKm) === b);
    return {
      band: b,
      NORMAL: inBand.filter((v) => v.health === 'NORMAL').length,
      WATCH: inBand.filter((v) => v.health === 'WATCH').length,
      INSPECTION_REQUIRED: inBand.filter((v) => v.health === 'INSPECTION_REQUIRED').length,
      total: inBand.length,
    };
  }), [filtered]);

  const scatterData = useMemo(() => filtered.map((v) => ({
    x: v.mileageKm, y: v.anomalyScore, vin: v.vin, health: v.health, batch: v.batch,
  })), [filtered]);

  const sel = FLEET_VEHICLES.find((v) => v.vin === selVin) ?? null;
  const watch = filtered.filter((v) => v.health === 'WATCH').length;
  const insp = filtered.filter((v) => v.health === 'INSPECTION_REQUIRED').length;
  const avgAnomaly = filtered.length
    ? filtered.reduce((a, v) => a + v.anomalyScore, 0) / filtered.length
    : 0;

  const filterOptions = (key: Exclude<FleetFilterKey, 'component' | 'healthState' | 'mileageBand'>) => [
    ...new Set(FLEET_VEHICLES.map((v) => (key === 'modelYear' ? String(v.year) : v[key]))),
  ].sort();

  return (
    <div className="col" style={{ width: '100%', minHeight: '100%', fontFamily: 'var(--font-sans)' }}>
      <PageHeader
        title="Fleet Structural Analytics"
        description="Cross-vehicle statistical degradation patterns, mileage correlations, and fleet-wide anomaly distribution."
      >
        <span className="chip st-normal"><span className="dot dot-normal" /> {filtered.length}/{FLEET_VEHICLES.length} shown</span>
        <button className="btn" onClick={resetFleetFilters}>Reset filters</button>
      </PageHeader>
      <div className="col stack splash-fade" style={{ padding: 24 }}>

      {/* correlation banner */}
      <Card title="Fleet correlations (statistical, DEMO)">
        <div className="col" style={{ gap: 8 }}>
          {FLEET_CORRELATIONS.map((c) => (
            <div key={c.factor} className="panel" style={{
              padding: '9px 11px',
              borderLeft: `3px solid ${c.strength > 0.6 ? 'var(--amber)' : 'var(--blue)'}`,
            }}>
              <div className="spread wrap">
                <span className="small" style={{ fontWeight: 600 }}>{c.label}</span>
                <span className="tag">{Math.round(c.strength * 100)}% strength</span>
              </div>
              <div className="tiny muted" style={{ marginTop: 3, fontFamily: 'var(--mono)' }}>factor: {c.factor}</div>
              <div className="tiny" style={{ marginTop: 4, color: c.strength > 0.6 ? 'var(--amber)' : 'var(--muted)' }}>
                {c.note}
              </div>
            </div>
          ))}
        </div>
        <div className="panel" style={{ marginTop: 8, padding: 8, background: 'var(--bg2)' }}>
          <div className="tiny faint">
            Correlation ≠ causation. No fleet health claim is made from these synthetic associations — the top correlation is deliberately surfaced for <b>engineering investigation</b>, not as a defect finding.
          </div>
        </div>
      </Card>

      <div className="grid4">
        <Stat label="Units (filtered)" value={filtered.length} sub={`of ${FLEET_VEHICLES.length} synthetic`} />
        <Stat label="WATCH" value={watch} sub="persistent deviation" accent={watch ? 'var(--amber)' : 'var(--muted)'} />
        <Stat label="INSPECTION REQUIRED" value={insp} sub="action threshold" accent={insp ? 'var(--red)' : 'var(--muted)'} />
        <Stat label="Avg anomaly" value={avgAnomaly.toFixed(2)} sub="0..1 model-estimated" accent={avgAnomaly > 0.4 ? 'var(--amber)' : 'var(--green)'} />
      </div>

      {/* filters */}
      <Card title="Filters">
        <div className="grid3">
          <Filter label="Model" value={filters.model} options={filterOptions('model')} k="model" set={setFleetFilter} />
          <Filter label="Variant" value={filters.variant} options={filterOptions('variant')} k="variant" set={setFleetFilter} />
          <Filter label="Year" value={filters.modelYear} options={filterOptions('modelYear')} k="modelYear" set={setFleetFilter} />
          <Filter label="Plant" value={filters.plant} options={filterOptions('plant')} k="plant" set={setFleetFilter} />
          <Filter label="Batch" value={filters.batch} options={filterOptions('batch')} k="batch" set={setFleetFilter} />
          <Filter label="Mileage band" value={filters.mileageBand} options={MILEAGE_BANDS} k="mileageBand" set={setFleetFilter} />
          <Filter label="Region" value={filters.region} options={filterOptions('region')} k="region" set={setFleetFilter} />
          <Filter label="Health" value={filters.healthState} options={['NORMAL', 'WATCH', 'INSPECTION_REQUIRED']} k="healthState" set={setFleetFilter} />
          <Filter label="Component deviation" value={filters.component} options={CRITICAL_COMPONENTS} k="component" set={setFleetFilter} />
        </div>
      </Card>

      <div className="grid2">
        <Card title="Health by mileage band (model-estimated)">
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandData} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2631" />
                <XAxis dataKey="band" tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" />
                <YAxis tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#10151c', border: '1px solid #273342', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="NORMAL" stackId="h" fill="#2c5a46" />
                <Bar dataKey="WATCH" stackId="h" fill="#f2b94e" />
                <Bar dataKey="INSPECTION_REQUIRED" stackId="h" fill="#ff6b5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="tiny faint">Stacked counts per mileage band for the current filter. Values derive from the synthetic fleet generator (SIMULATED).</div>
        </Card>

        <Card title="Mileage vs anomaly score">
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2631" />
                <XAxis type="number" dataKey="x" name="mileage km" tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" domain={[0, 80000]} />
                <YAxis type="number" dataKey="y" name="anomaly" tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" domain={[0, 1]} />
                <ZAxis type="number" range={[40, 40]} />
                <Tooltip
                  content={<FleetScatterTip />}
                  cursor={{ strokeDasharray: '3 3', stroke: '#273342' }}
                />
                <Scatter data={scatterData} name="units">
                  {scatterData.map((p, i) => (
                    <Cell key={i} fill={HEALTH_HEX[p.health]} fillOpacity={0.85} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="tiny faint">Each point = one synthetic unit. Colour = fleet-level health state. Engineering interpretation required — do not read as causation.</div>
        </Card>
      </div>

      <div className="grid2">
        {/* fleet table */}
        <Card title="Fleet units">
          <div style={{ overflow: 'auto', maxHeight: 420 }}>
            <table className="tbl">
              <thead>
                <tr><th>VIN</th><th>Model</th><th>Plant · batch</th><th className="num">km</th><th>Region</th><th className="num">Anom.</th><th>Health</th></tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.vin}
                    style={{ cursor: 'pointer', ...(sel?.vin === v.vin ? { background: '#101f28' } : {}) }}
                    onClick={() => setSelVin(v.vin)}
                  >
                    <td><span className="mono small" style={{ color: 'var(--cyan)' }}>{v.vin.replace('SHIELD-DEMO-', '')}</span></td>
                    <td className="small">{v.model} {v.variant}</td>
                    <td className="tiny">{v.plant} · {v.batch}</td>
                    <td className="num">{fmtNum(v.mileageKm)}</td>
                    <td className="tiny">{v.region}</td>
                    <td className="num">{v.anomalyScore.toFixed(2)}</td>
                    <td><StatusChip state={v.health} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tiny faint" style={{ marginTop: 6 }}>Click a row to inspect its component-level health (right).</div>
        </Card>

        {/* unit detail */}
        <Card title={sel ? `Unit detail — ${sel.vin}` : 'Unit detail'}>
          {sel ? (
            <div className="col" style={{ gap: 8 }}>
              <div className="spread">
                <span className="mono small" style={{ color: 'var(--cyan)' }}>{sel.vin}</span>
                <StatusChip state={sel.health} />
              </div>
              <div className="grid2">
                <UnitField k="Model" v={`${sel.model} ${sel.variant} ${sel.year}`} />
                <UnitField k="Plant / batch" v={`${sel.plant} · ${sel.batch}`} />
                <UnitField k="Mileage" v={`${fmtNum(sel.mileageKm)} km`} />
                <UnitField k="Region" v={sel.region} />
              </div>
              <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Component health (model-estimated)</div>
              <div className="col" style={{ gap: 3 }}>
                {CRITICAL_COMPONENTS.map((cid) => {
                  const st = sel.componentHealth[cid] ?? 'NORMAL';
                  return (
                    <div key={cid} className="row" style={{ gap: 8 }}>
                      <span className="tiny" style={{ width: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cid}</span>
                      <div className="spacer" />
                      <StatusChip state={st} />
                    </div>
                  );
                })}
              </div>
              <button className="btn" onClick={() => navigate('investigations')}>
                Related investigations
              </button>
            </div>
          ) : (
            <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 24 }}>▤</div>
              <div className="small" style={{ marginTop: 6 }}>Select a unit to see component-level health</div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Investigations linked to fleet">
        <div className="col" style={{ gap: 6 }}>
          <div className="tiny faint">
            {INVESTIGATIONS.filter((i) => i.vehicleIds.some((v) => v.startsWith('SHIELD-DEMO'))).length} fleet-linked investigation(s) — open in the Investigations workspace.
          </div>
          {INVESTIGATIONS.filter((i) => i.vehicleIds.some((v) => v.startsWith('SHIELD-DEMO'))).map((i) => (
            <button key={i.id} className="panel" style={{ padding: '7px 9px', textAlign: 'left', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit' }} onClick={() => navigate('investigations')}>
              <div className="spread">
                <span className="mono small" style={{ color: 'var(--cyan)' }}>{i.id}</span>
                <StatusChip state={i.state === 'CLOSED' ? 'NORMAL' : 'WATCH'} />
              </div>
              <div className="small" style={{ marginTop: 2 }}>{i.title}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
    </div>
  );
}

function FleetScatterTip({ active, payload }: { active?: boolean; payload?: { payload: { vin: string; x: number; y: number; health: string; batch: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="panel" style={{ padding: '7px 9px', fontSize: 11 }}>
      <div className="mono" style={{ color: 'var(--cyan)' }}>{p.vin}</div>
      <div>{fmtNum(p.x)} km · anomaly {p.y.toFixed(2)}</div>
      <div className="tiny faint">{p.health} · {p.batch}</div>
    </div>
  );
}

function Filter({ label, value, options, k, set }: {
  label: string; value: string; options: string[]; k: FleetFilterKey; set: (k: FleetFilterKey, v: string) => void;
}) {
  return (
    <label className="col" style={{ gap: 4 }}>
      <span className="tiny muted">{label}</span>
      <select value={value} onChange={(e) => set(k, e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function UnitField({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="panel" style={{ padding: '6px 9px' }}>
      <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
      <div className="small" style={{ marginTop: 2 }}>{v}</div>
    </div>
  );
}