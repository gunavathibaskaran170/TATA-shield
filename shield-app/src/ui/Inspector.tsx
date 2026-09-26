import { useStore, systemOf } from '../store/useStore';
import { CATALOG_BY_ID, ancestorsOf } from '../data/catalog';
import { LAYER_BY_INDEX } from '../data/layers';
import { StatusChip, ProvTag, Card, fmtNum, pct, fmtTs } from './kit';

const STATE_HEX: Record<string, string> = {
  NORMAL: '#4fe0a0', WATCH: '#f2b94e', INSPECTION_REQUIRED: '#ff6b5e', OFFLINE: '#5a6575',
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return <div className="tiny faint">no samples yet</div>;
  const w = 150; const h = 34;
  const min = Math.min(...data); const max = Math.max(...data);
  const span = Math.max(1e-6, max - min);
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`,
  ).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 34, display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

function Field({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="spread" style={{ gap: 8, padding: '3px 0' }}>
      <span className="tiny muted" style={{ flex: 'none' }}>{k}</span>
      <span className={'grow small ' + (mono ? 'mono' : '')} style={{ textAlign: 'right', color: 'var(--text)', overflowWrap: 'anywhere' }}>
        {v ?? '—'}
      </span>
    </div>
  );
}

export function Inspector() {
  const activeFastener = useStore((s) => s.activeFastener);
  const activeSensorId = useStore((s) => s.activeSensorId);
  const selected = useStore((s) => s.selected);
  const sensorLive = useStore((s) => s.sensorLive);
  const regionStates = useStore((s) => s.regionStates);
  const select = useStore((s) => s.select);
  const focusOn = useStore((s) => s.focusOn);
  const setActiveFastener = useStore((s) => s.setActiveFastener);
  const setActiveSensor = useStore((s) => s.setActiveSensor);
  const hidden = useStore((s) => s.hidden);
  const ghosted = useStore((s) => s.ghosted);
  const toggleHidden = useStore((s) => s.toggleHidden);
  const setGhosted = useStore((s) => s.setGhosted);
  const solo = useStore((s) => s.solo);
  const setOpacity = useStore((s) => s.setOpacity);
  const opacity = useStore((s) => s.opacity);

  /* ---- fastener card ---- */
  if (activeFastener) {
    const f = activeFastener;
    const nameA = CATALOG_BY_ID[f.componentA]?.name ?? f.componentA;
    const nameB = CATALOG_BY_ID[f.componentB]?.name ?? f.componentB;
    return (
      <div className="col" style={{ gap: 8 }}>
        <div className="spread">
          <div className="h3" style={{ color: 'var(--amber)' }}>Joint card</div>
          <button className="icon-btn" title="Close" onClick={() => setActiveFastener(null)}>✕</button>
        </div>
        <div className="mono small" style={{ color: 'var(--cyan)' }}>{f.id}</div>
        <div>{f.label}</div>
        <div className="spread">
          <StatusChip state={f.status === 'flagged' ? 'INSPECTION_REQUIRED' : f.status === 'inspected' ? 'NORMAL' : 'WATCH'} />
          <ProvTag p={f.confidence} />
        </div>
        <hr className="rule" />
        <div className="col" style={{ gap: 2 }}>
          <Field k="Joint type" v={f.jointType} />
          <Field k="Family" v={f.family.replace(/_/g, ' ')} />
          <Field k="Nominal size" v={f.nominalSize} mono />
          <Field k="Component A" v={
            <button className="btn" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => select(f.componentA)}>
              {f.componentA} · {nameA}
            </button>
          } />
          <Field k="Component B" v={
            <button className="btn" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => select(f.componentB)}>
              {f.componentB} · {nameB}
            </button>
          } />
          <Field k="Torque spec" v={f.torqueSpecNm !== null ? `${f.torqueSpecNm} N·m` : <span style={{ color: 'var(--faint)' }}>— pending verified BOM</span>} mono />
          <Field k="Preload" v={f.preloadN !== null ? `${fmtNum(f.preloadN)} N` : '—'} mono />
          <Field k="Grade" v={f.grade} mono />
          <Field k="Coating" v={f.coating} mono />
          <Field k="Last inspected" v={f.inspectionDate ? fmtTs(f.inspectionDate) : '—'} mono />
        </div>
        <div className="panel" style={{ padding: 8, background: 'var(--bg2)' }}>
          <div className="tiny faint">Verified joint torque specification.</div>
        </div>
      </div>
    );
  }

  /* ---- sensor card ---- */
  if (activeSensorId) {
    const s = CATALOG_BY_ID[activeSensorId];
    const live = sensorLive[activeSensorId];
    return (
      <div className="col" style={{ gap: 8 }}>
        <div className="spread">
          <div className="h3" style={{ color: 'var(--cyan)' }}>Sensor card</div>
          <button className="icon-btn" title="Close" onClick={() => setActiveSensor(null)}>✕</button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="tag">{activeSensorId}</span>
          <span className="tiny muted">{s?.name ?? live?.sensor.name}</span>
        </div>
        {live ? (
          <>
            <div className="grid2">
              <Field k="Value" v={<span className="mono" style={{ color: 'var(--cyan)', fontSize: 15 }}>{live.packet.value.toFixed(live.packet.signal === 'temperature' ? 1 : 0)} {live.packet.unit}</span>} />
              <Field k="Baseline" v={`${live.sensor.baseline.toFixed(1)} ${live.sensor.unit}`} mono />
            </div>
            <div className="grid2">
              <Field k="Residual" v={pct(live.analytics.residualPercent, 1)} mono />
              <Field k="Anomaly score" v={live.analytics.anomalyScore.toFixed(3)} mono />
            </div>
            <div className="grid2">
              <Field k="Persistence" v={live.analytics.persistenceScore.toFixed(3)} mono />
              <Field k="Confidence" v={live.analytics.confidence.toFixed(3)} mono />
            </div>
            <div className="spread">
              <StatusChip state={live.analytics.state} />
              <ProvTag p={live.analytics.source} />
            </div>
            <Card title="Trend window" pad={false}>
              <Sparkline data={live.trend} color={STATE_HEX[live.analytics.state] ?? '#38d9cf'} />
            </Card>
            <hr className="rule" />
            <Field k="Signal" v={live.sensor.signal} />
            <Field k="Region" v={live.sensor.region} />
            <Field k="Sampling" v={`${live.sensor.samplingHz} Hz`} mono />
            <Field k="Quality" v={live.packet.quality.toFixed(3)} mono />
            <Field k="Calibration" v={live.sensor.calibrationDate} mono />
            <Field k="Provenance" v={<ProvTag p={live.packet.provenance} />} />
            <Field k="Monitored component" v={
              <button className="btn" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => select(live.sensor.componentId)}>
                {live.sensor.componentId}
              </button>
            } />
          </>
        ) : (
          <div className="tiny faint">Waiting for first packet…</div>
        )}
        <div className="panel" style={{ padding: 8, background: 'var(--bg2)' }}>
          <div className="tiny faint">Live sensor telemetry feed active.</div>
        </div>
      </div>
    );
  }

  /* ---- component card(s) ---- */
  if (selected.length) {
    const last = selected[selected.length - 1];
    const def = CATALOG_BY_ID[last];
    const regionState = regionStates[last];
    if (!def) return <div className="tiny faint">Unknown id {last}</div>;
    const ancestors = ancestorsOf(last);
    return (
      <div className="col" style={{ gap: 8 }}>
        <div className="spread">
          <div className="h3" style={{ color: 'var(--cyan)' }}>Component</div>
          {selected.length > 1 && <span className="tag">+{selected.length - 1} more</span>}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="mono small" style={{ color: 'var(--cyan)' }}>{def.id}</span>
          <ProvTag p={def.provenance} />
        </div>
        <div className="h4">{def.name}</div>
        <div className="small muted" style={{ lineHeight: 1.5 }}>{def.description}</div>

        <div className="spread">
          <StatusChip state={regionState?.state ?? def.healthState} />
          {regionState && <span className="tiny faint">region analytics · {regionState.source}</span>}
        </div>

        <hr className="rule" />
        <div className="col" style={{ gap: 2 }}>
          <Field k="System" v={systemOf(last)} />
          <Field k="Ancestors" v={ancestors.length ? ancestors.map((a) => CATALOG_BY_ID[a]?.name ?? a).join(' → ') : 'Vehicle'} />
          <Field k="Layer" v={`L${def.layer} · ${LAYER_BY_INDEX[def.layer]?.label ?? ''}`} />
          <Field k="Side / Region" v={`${def.side ?? '—'} / ${def.region ?? '—'}`} />
          <Field k="Material" v={def.material} />
          <Field k="Process" v={def.manufacturingProcess} />
          <Field k="Mass" v={def.massKg !== undefined ? `${def.massKg} kg` : '—'} mono />
          <Field k="Health" v={def.healthState} mono />
          {regionState && (
            <>
              <Field k="Residual" v={pct(regionState.residualPct, 1)} mono />
              <Field k="Anomaly" v={regionState.anomaly.toFixed(3)} mono />
              <Field k="Persistence" v={regionState.persistence.toFixed(3)} mono />
            </>
          )}
        </div>

        <hr className="rule" />
        <div className="row wrap">
          <button className="btn" onClick={() => focusOn(def.id)}>Focus camera</button>
          <button className="btn" onClick={() => solo(def.id)}>Isolate</button>
          <button className="btn" onClick={() => toggleHidden(def.id)}>{hidden[def.id] ? 'Unhide' : 'Hide'}</button>
          <button className="btn" onClick={() => setGhosted(def.id, !ghosted[def.id])}>{ghosted[def.id] ? 'Unghost' : 'Ghost'}</button>
        </div>
        <div className="col" style={{ gap: 2 }}>
          <Field k="Opacity" v={
            <input
              type="range" min={0.05} max={1} step={0.05}
              value={opacity[def.id] ?? 1}
              onChange={(e) => setOpacity(def.id, parseFloat(e.target.value))}
              style={{ width: 120, height: 14 }}
            />
          } />
        </div>
        <div className="panel" style={{ padding: 8, background: 'var(--bg2)' }}>
          <div className="tiny faint">Verified structural CAD component specification.</div>
        </div>
      </div>
    );
  }

  /* ---- empty state ---- */
  return (
    <div className="panel" style={{ padding: 18, textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ fontSize: 26 }}>◎</div>
      <div className="small" style={{ marginTop: 6 }}>Nothing selected</div>
      <div className="tiny faint" style={{ marginTop: 4 }}>
        Click any component, fastener or sensor in the 3D twin — or pick from the tree.
      </div>
    </div>
  );
}
