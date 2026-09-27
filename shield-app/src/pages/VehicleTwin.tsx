import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { CadOverlay } from '../three/ExplodedView';
import { Inspector } from '../ui/Inspector';
import { Timeline } from '../ui/Timeline';
import { HeatmapControls } from '../ui/HeatmapLegend';
import { CATALOG_BY_ID } from '../data/catalog';
import { SENSOR_BY_ID } from '../data/sensors';
import { SYSTEM_GROUPS } from '../data/catalog';
import type { ViewPreset } from '../store/useStore';
import type { BatteryViewMode } from '../store/useStore';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { InteractiveCadFallback } from '../three/InteractiveCadFallback';

const CAM_PRESETS: { key: ViewPreset; label: string }[] = [
  { key: 'iso', label: 'Iso' },
  { key: 'front', label: 'Front' },
  { key: 'rear', label: 'Rear' },
  { key: 'left', label: 'L' },
  { key: 'right', label: 'R' },
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Under' },
];

const BAT_MODES: { key: BatteryViewMode; label: string }[] = [
  { key: 'closed', label: 'Closed' },
  { key: 'cover_transparent', label: 'Cover×' },
  { key: 'open', label: 'Open' },
  { key: 'exploded', label: 'Exploded' },
  { key: 'module_view', label: 'Modules' },
  { key: 'mount_view', label: 'Mounts' },
];

const CLIP_PRESETS = [
  { key: 'none', label: 'No cut' },
  { key: 'longitudinal', label: 'Longitudinal' },
  { key: 'transverse', label: 'Transverse' },
  { key: 'underbody', label: 'Underbody' },
  { key: 'cabin', label: 'Cabin' },
] as const;

function HUD() {
  const hovered = useStore((s) => s.hovered);
  const pinned = useStore((s) => s.pinned);
  const activeFastener = useStore((s) => s.activeFastener);
  const activeSensorId = useStore((s) => s.activeSensorId);
  const selected = useStore((s) => s.selected);

  let title: string | null = null;
  let sub: string | null = null;
  let color = 'var(--cyan)';

  if (activeFastener) {
    title = `⚙ ${activeFastener.id} — joint`;
    sub = `${activeFastener.componentA} ⇄ ${activeFastener.componentB} · ${activeFastener.jointType}`;
    color = 'var(--amber)';
  } else if (activeSensorId) {
    const s = SENSOR_BY_ID[activeSensorId];
    title = `◈ ${activeSensorId} — sensor`;
    sub = s ? `${s.name} · ${s.signal}` : '';
    color = 'var(--cyan)';
  } else if (hovered) {
    const d = CATALOG_BY_ID[hovered];
    if (d) {
      title = d.name;
      sub = `${d.id} · L${d.layer} · ${d.system}`;
    }
  } else if (pinned && !selected.length) {
    const d = CATALOG_BY_ID[pinned];
    if (d) { title = d.name; sub = `${d.id} · L${d.layer}`; }
  }

  if (!title) return null;
  return (
    <div className="hud-chip">
      <div className="small" style={{ color, fontWeight: 600 }}>{title}</div>
      {sub && <div className="tiny faint" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TwinToolbar() {
  const viewPreset = useStore((s) => s.viewPreset);
  const setViewPreset = useStore((s) => s.setViewPreset);
  const requestResetCamera = useStore((s) => s.requestResetCamera);
  const requestFitCamera = useStore((s) => s.requestFitCamera);
  const cadView = useStore((s) => s.cadView);
  const setCadView = useStore((s) => s.setCadView);
  const xray = useStore((s) => s.xray);
  const setXray = useStore((s) => s.setXray);
  const wireframe = useStore((s) => s.wireframe);
  const setWireframe = useStore((s) => s.setWireframe);
  const dimOthers = useStore((s) => s.dimOthers);
  const setDimOthers = useStore((s) => s.setDimOthers);
  const explode = useStore((s) => s.explode);
  const setExplode = useStore((s) => s.setExplode);
  const explodeSelected = useStore((s) => s.explodeSelected);
  const setExplodeSelected = useStore((s) => s.setExplodeSelected);
  const explodeSystem = useStore((s) => s.explodeSystem);
  const setExplodeSystem = useStore((s) => s.setExplodeSystem);
  const applyClipPreset = useStore((s) => s.applyClipPreset);
  const clipEnabled = useStore((s) => s.clipEnabled);
  const batteryMode = useStore((s) => s.batteryMode);
  const applyBatteryMode = useStore((s) => s.applyBatteryMode);

  const requestZoomIn = useStore((s) => s.requestZoomIn);
  const requestZoomOut = useStore((s) => s.requestZoomOut);

  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const autoRotate = useStore((s) => s.autoRotate);
  const setAutoRotate = useStore((s) => s.setAutoRotate);

  return (
    <div className="panel" style={{ padding: '6px 10px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* mode switcher */}
      <div className="row" style={{ gap: 4, background: 'var(--bg2)', padding: '2px 4px', borderRadius: 6, border: '1px solid var(--line2)', flexWrap: 'wrap' }}>
        {[
          { key: 'complete' as const, label: '🚘 Complete Car' },
          { key: 'transparent' as const, label: '💎 Transparent Body' },
          { key: 'chassis' as const, label: '🏎️ Chassis Only' },
          { key: 'exploded' as const, label: '💥 Exploded Assembly' },
          { key: 'skeletal' as const, label: '🦴 Skeletal View' },
        ].map((m) => (
          <button
            key={m.key}
            className={viewMode === m.key ? 'btn active' : 'btn'}
            style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 4,
              background: viewMode === m.key ? '#123a40' : 'transparent',
              color: viewMode === m.key ? 'var(--cyan)' : 'var(--text)'
            }}
            onClick={() => setViewMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* camera */}
      <div className="row" style={{ gap: 3 }}>
        <span className="tiny muted" style={{ marginRight: 2 }}>Camera</span>
        {CAM_PRESETS.map((p) => (
          <button key={p.key} className={viewPreset === p.key ? 'btn active' : 'btn'} style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => setViewPreset(p.key)}>
            {p.label}
          </button>
        ))}
        <button className="btn" style={{ padding: '2px 8px', fontSize: 13, fontWeight: 'bold' }} title="Zoom In (+)" onClick={requestZoomIn}>+</button>
        <button className="btn" style={{ padding: '2px 8px', fontSize: 13, fontWeight: 'bold' }} title="Zoom Out (-)" onClick={requestZoomOut}>−</button>
        <button className="btn" style={{ padding: '2px 7px', fontSize: 11 }} title="Reset camera" onClick={requestResetCamera}>⟲</button>
        <button className="btn" style={{ padding: '2px 7px', fontSize: 11 }} title="Frame the whole vehicle" onClick={requestFitCamera}>⤢</button>
        <button className={autoRotate ? 'btn active' : 'btn'} style={{ padding: '2px 7px', fontSize: 11 }} title="Toggle 360° Auto Rotation" onClick={() => setAutoRotate(!autoRotate)}>
          🔄 360° Auto
        </button>
      </div>

      {/* render modes */}
      <div className="row" style={{ gap: 3 }}>
        <span className="tiny muted">View</span>
        <button className={xray ? 'btn active' : 'btn'} style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => setXray(!xray)}>X-ray</button>
        <button className={wireframe ? 'btn active' : 'btn'} style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => setWireframe(!wireframe)}>Wireframe</button>
        <button className={dimOthers ? 'btn active' : 'btn'} style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => setDimOthers(!dimOthers)}>Dim others</button>
        <button
          className={cadView ? 'btn active' : 'btn'}
          style={{ padding: '2px 7px', fontSize: 11 }}
          title="Exploded-isometric CAD cutaway presentation"
          onClick={() => setCadView(!cadView)}
        >
          CAD cutaway
        </button>
      </div>

      {/* battery modes */}
      <div className="row" style={{ gap: 3 }}>
        <span className="tiny muted">Battery</span>
        {BAT_MODES.map((m) => (
          <button key={m.key} className={batteryMode === m.key ? 'btn active' : 'btn'} style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => applyBatteryMode(m.key)}>
            {m.label}
          </button>
        ))}
      </div>

      {/* explode */}
      <div className="row" style={{ gap: 6, minWidth: 200 }}>
        <span className="tiny muted">Explode</span>
        <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(parseFloat(e.target.value))} style={{ width: 90, height: 12 }} />
        <label className="row tiny muted" style={{ gap: 3, cursor: 'pointer' }}>
          <input type="checkbox" checked={explodeSelected} onChange={(e) => setExplodeSelected(e.target.checked)} style={{ accentColor: 'var(--cyan)' }} />
          selected
        </label>
        <select value={explodeSystem ?? ''} onChange={(e) => setExplodeSystem(e.target.value || null)} style={{ width: 110 }}>
          <option value="">system…</option>
          {SYSTEM_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* clips */}
      <div className="row" style={{ gap: 3 }}>
        <span className="tiny muted">Cut</span>
        {CLIP_PRESETS.map((c) => (
          <button key={c.key} className={clipEnabled && c.key !== 'none' ? 'btn active' : 'btn'} style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => applyClipPreset(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VehicleTwin() {
  const [rightTab, setRightTab] = useState<'inspect' | 'sensors'>('inspect');
  const cadView = useStore((s) => s.cadView);
  const navigate = useStore((s) => s.navigate);
  const sensorLive = useStore((s) => s.sensorLive);
  const select = useStore((s) => s.select);
  const focusOn = useStore((s) => s.focusOn);
  const requestZoomIn = useStore((s) => s.requestZoomIn);
  const requestZoomOut = useStore((s) => s.requestZoomOut);
  const requestFitCamera = useStore((s) => s.requestFitCamera);

  return (
    <div className="col" style={{ height: '100%', padding: 8, gap: 8, minWidth: 0 }}>
      <TwinToolbar />

      <div className="row" style={{ flex: 1, minHeight: 0, alignItems: 'stretch', gap: 8 }}>
        {/* centre: 3D + timeline */}
        <div className="col" style={{ flex: 1, minWidth: 0, gap: 8 }}>
          <div className="panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, background: 'var(--bg)' }}>
            <ErrorBoundary fallbackTitle="3D Viewport Error" fallbackComponent={<InteractiveCadFallback />}>
              <VehicleScene />
            </ErrorBoundary>
            {cadView && <CadOverlay />}
            <HUD />
            {/* Floating 3D Viewport Zoom Widget */}
            <div
              style={{
                position: 'absolute', left: 12, top: cadView ? 85 : 12, zIndex: 15,
                display: 'flex', flexDirection: 'column', gap: 4,
                background: 'rgba(15, 23, 32, 0.85)', padding: '5px',
                borderRadius: '6px', border: '1px solid var(--line2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <button className="btn" style={{ padding: '4px 8px', fontSize: 14, fontWeight: 'bold' }} title="Zoom In (+)" onClick={requestZoomIn}>+</button>
              <button className="btn" style={{ padding: '4px 8px', fontSize: 14, fontWeight: 'bold' }} title="Zoom Out (-)" onClick={requestZoomOut}>−</button>
              <button className="btn" style={{ padding: '4px 6px', fontSize: 11 }} title="Fit Model" onClick={requestFitCamera}>⤢</button>
            </div>
            <div
              style={{
                position: 'absolute', right: 8, bottom: 8, zIndex: 5,
                display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end',
              }}
            >
              <HeatmapControls compact />
            </div>
          </div>
        </div>

        {/* right: inspector + sensors */}
        <div className="panel desktop-only" style={{ width: 286, flex: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div className="spread" style={{ padding: '8px 10px 0' }}>
            <div className="row" style={{ gap: 2, background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 5, padding: 2 }}>
              {(['inspect', 'sensors'] as const).map((t) => (
                <button key={t} className="btn" style={{ padding: '2px 8px', fontSize: 11, border: 'none', borderRadius: 3, background: rightTab === t ? '#123a40' : 'transparent' }} onClick={() => setRightTab(t)}>
                  {t === 'inspect' ? 'Inspector' : 'Sensors'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            {rightTab === 'inspect' ? (
              <Inspector />
            ) : (
              <div className="col" style={{ gap: 6 }}>
                {Object.entries(sensorLive).map(([id, live]) => (
                  <button
                    key={id}
                    className="panel"
                    style={{
                      padding: '7px 9px', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'block',
                      color: 'var(--text)', fontFamily: 'inherit',
                    }}
                    onClick={() => { select(id); }}
                    onDoubleClick={() => focusOn(id)}
                  >
                    <div className="spread">
                      <span className="mono small" style={{ color: 'var(--cyan)' }}>{id}</span>
                      <span className={'chip ' + (live.analytics.state === 'NORMAL' ? 'st-normal' : live.analytics.state === 'WATCH' ? 'st-watch' : 'st-inspection')}>
                        <span className={'dot ' + (live.analytics.state === 'NORMAL' ? 'dot-normal' : live.analytics.state === 'WATCH' ? 'dot-watch' : 'dot-inspection')} />
                        {live.analytics.state === 'INSPECTION_REQUIRED' ? 'INSP' : live.analytics.state}
                      </span>
                    </div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>{live.sensor.name}</div>
                    <div className="mono small" style={{ marginTop: 2 }}>
                      {live.packet.value.toFixed(live.packet.signal === 'temperature' ? 1 : 0)} {live.packet.unit}
                      <span className="faint"> · Δ{live.analytics.residualPercent.toFixed(1)}%</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile quick action sheet */}
      <div className="panel mobile-only" style={{ padding: 8 }}>
        <div className="row wrap">
          <button className="btn" onClick={() => navigate('telemetry')}>Telemetry</button>
          <button className="btn" onClick={() => navigate('forensics')}>Forensics</button>
          <button className="btn" onClick={() => navigate('intelligence')}>Intelligence</button>
          <button className="btn" onClick={() => navigate('passport')}>Passport</button>
        </div>
      </div>
    </div>
  );
}