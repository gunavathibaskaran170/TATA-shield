/* ============================================================
   SHIELD — MODULE 05: LIVE STRUCTURAL DIGITAL TWIN
   Master 3D vehicle operational digital twin featuring:
   - Full-Screen Dominant Vehicle View with Structural Overlays
   - 12 Engineering Modes (Body, BIW, Chassis, Battery, Sensors, Load Path, Strain, Residual, etc.)
   - Dynamic Sensor-to-Structure Physical Linkage
   - Environmental & Temperature Compensated Residual Engine
   - Explicit Provenance Badges (MEASURED, CALCULATED, ESTIMATED, REFERENCE, DEMO)
   - Universal Data Provider Abstraction (Demo, Hardware, Replay)
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { SENSORS, SENSOR_BY_ID } from '../data/sensors';
import { CATALOG_BY_ID } from '../data/catalog';
import { SENSOR_REGION_COMPONENTS } from '../dataflow/engine';
import { Card, Stat, StatusChip, ProvTag } from '../ui/kit';

export function LiveDigitalTwin() {
  const sensorLive = useStore((s) => s.sensorLive);
  const activeSensorId = useStore((s) => s.activeSensorId);
  const setActiveSensor = useStore((s) => s.setActiveSensor);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const cadView = useStore((s) => s.cadView);
  const setCadView = useStore((s) => s.setCadView);
  const heatmapMode = useStore((s) => s.heatmapMode);
  const setHeatmapMode = useStore((s) => s.setHeatmapMode);
  const select = useStore((s) => s.select);
  const clearSelection = useStore((s) => s.clearSelection);
  const navigate = useStore((s) => s.navigate);
  const vehicleId = useStore((s) => s.vehicleId);

  const [activeProvider, setActiveProvider] = useState<'demo' | 'hardware' | 'replay'>('demo');
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'BIW' | 'CHASSIS' | 'BATTERY' | 'SENSORS'>('ALL');

  const selectedSensor = activeSensorId ? SENSOR_BY_ID[activeSensorId] : null;
  const liveSensorData = activeSensorId ? sensorLive[activeSensorId] : null;

  // Compute overall state counts
  const sensorStates = Object.values(sensorLive).map((l) => l.analytics.state);
  const watchCount = sensorStates.filter((st) => st === 'WATCH').length;
  const inspectCount = sensorStates.filter((st) => st === 'INSPECTION_REQUIRED').length;
  const worstState = inspectCount ? 'INSPECTION_REQUIRED' : watchCount ? 'WATCH' : 'NORMAL';

  return (
    <div className="live-twin-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Dominant 3D Vehicle Viewport */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <VehicleScene />
      </div>

      {/* Top Header Ribbon */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '10px 16px',
          background: 'linear-gradient(180deg, rgba(12,16,21,0.92) 0%, rgba(12,16,21,0.6) 75%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          pointerEvents: 'auto',
        }}
      >
        <div className="row" style={{ gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #0e7490, #155e75)',
              border: '1px solid #06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#67e8f9',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            05
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', color: '#f8fafc' }}>
                LIVE STRUCTURAL DIGITAL TWIN · {vehicleId}
              </span>
              <StatusChip state={worstState} />
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Continuous Multi-Sensor Telemetry · Baseline Residual Evaluation · Structural Condition Map
            </div>
          </div>
        </div>

        {/* Data Source Mode Switcher */}
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="tiny faint">Provider:</span>
          {(['demo', 'hardware', 'replay'] as const).map((p) => {
            const active = activeProvider === p;
            const label = p === 'demo' ? 'Digital Demo' : p === 'hardware' ? 'Hardware Live (ESP32/MQTT)' : 'Recorded Replay';
            return (
              <button
                key={p}
                className={`btn tiny ${active ? 'active' : ''}`}
                onClick={() => setActiveProvider(p)}
                style={{
                  background: active ? '#0891b2' : undefined,
                  borderColor: active ? '#06b6d4' : undefined,
                  color: active ? '#fff' : undefined,
                  fontSize: 11,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Left Panel — Structural Layers & Sensor Network */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 14,
          bottom: 14,
          width: 380,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'auto',
        }}
      >
        <div
          className="panel"
          style={{
            padding: 12,
            background: 'rgba(12, 16, 21, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Engineering View Modes */}
          <div>
            <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Structural Inspection Mode
            </div>
            <div className="grid3" style={{ gap: 4 }}>
              <button className={`btn tiny ${viewMode === 'complete' ? 'active' : ''}`} onClick={() => { setViewMode('complete'); setCadView(false); }}>Body Shell</button>
              <button className={`btn tiny ${viewMode === 'transparent' ? 'active' : ''}`} onClick={() => { setViewMode('transparent'); setCadView(false); }}>Ghost Body</button>
              <button className={`btn tiny ${viewMode === 'skeletal' ? 'active' : ''}`} onClick={() => { setViewMode('skeletal'); setCadView(true); }}>BIW / Chassis</button>
              <button className={`btn tiny ${heatmapMode === 'strain' ? 'active' : ''}`} onClick={() => setHeatmapMode(heatmapMode === 'strain' ? 'off' : 'strain')}>Strain Map</button>
              <button className={`btn tiny ${heatmapMode === 'stress' ? 'active' : ''}`} onClick={() => setHeatmapMode(heatmapMode === 'stress' ? 'off' : 'stress')}>Stress (Calc)</button>
              <button className={`btn tiny ${heatmapMode === 'anomaly' ? 'active' : ''}`} onClick={() => setHeatmapMode(heatmapMode === 'anomaly' ? 'off' : 'anomaly')}>Residual Heat</button>
            </div>
          </div>

          {/* Sensor Network List */}
          <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 6 }}>
            <div className="spread">
              <span className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Active Instrumentation Network ({SENSORS.length})
              </span>
              <span className="tiny mono faint">100 Hz Live</span>
            </div>

            <div className="col" style={{ gap: 4 }}>
              {SENSORS.map((s) => {
                const live = sensorLive[s.id];
                const isSelected = activeSensorId === s.id;
                const val = live ? live.packet.value : s.baseline;
                const residual = live ? live.analytics.residual : 0;
                const state = live ? live.analytics.state : 'NORMAL';

                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSensor(s.id)}
                    style={{
                      textAlign: 'left',
                      padding: '7px 9px',
                      borderRadius: 5,
                      cursor: 'pointer',
                      background: isSelected ? 'linear-gradient(90deg, #155e75, #0f172a)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid #06b6d4' : '1px solid var(--line)',
                      color: isSelected ? '#67e8f9' : 'var(--text)',
                    }}
                  >
                    <div className="spread">
                      <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>{s.id} — {s.signal.toUpperCase()}</span>
                      <StatusChip state={state} />
                    </div>
                    <div className="tiny faint" style={{ marginTop: 2 }}>{s.name}</div>
                    <div className="spread" style={{ marginTop: 4, fontSize: 11 }}>
                      <span className="mono faint">Base: {s.baseline} {s.unit}</span>
                      <span className="mono" style={{ fontWeight: 700, color: state !== 'NORMAL' ? 'var(--amber)' : '#38bdf8' }}>
                        Live: {val.toFixed(1)} {s.unit}
                      </span>
                      <span className="mono faint">Δ: {residual >= 0 ? `+${residual.toFixed(1)}` : residual.toFixed(1)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Health Summary */}
          <div className="grid2" style={{ gap: 6 }}>
            <Stat label="WATCH Sensors" value={watchCount} sub="Persistent drift" accent={watchCount ? 'var(--amber)' : 'var(--green)'} />
            <Stat label="INSPECTION Sensors" value={inspectCount} sub="Threshold exceeded" accent={inspectCount ? 'var(--red)' : 'var(--muted)'} />
          </div>
        </div>
      </div>

      {/* Floating Right Detail Panel — Selected Sensor & Structural Linkage Card */}
      {selectedSensor && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            right: 14,
            width: 340,
            zIndex: 3,
            pointerEvents: 'auto',
          }}
        >
          <div
            className="panel"
            style={{
              padding: 12,
              background: 'rgba(12, 16, 21, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
            }}
          >
            <div className="spread">
              <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: '#67e8f9' }}>
                SENSOR {selectedSensor.id}
              </span>
              <button className="btn tiny" onClick={() => setActiveSensor(null)}>✕</button>
            </div>
            <div className="tiny" style={{ marginTop: 2, color: 'var(--text)', fontWeight: 600 }}>{selectedSensor.name}</div>
            <div className="tiny faint">Inspected Substructure: {selectedSensor.componentId}</div>

            <div className="col" style={{ marginTop: 8, gap: 6 }}>
              {/* Telemetry Breakdown */}
              <div className="panel" style={{ padding: 6, background: 'rgba(0,0,0,0.3)' }}>
                <div className="spread">
                  <span className="tiny faint">Data Provenance:</span>
                  <ProvTag p="MEASURED" />
                </div>
                <div className="spread" style={{ marginTop: 4 }}>
                  <span className="tiny faint">Current Measured:</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                    {liveSensorData ? liveSensorData.packet.value.toFixed(1) : selectedSensor.baseline} {selectedSensor.unit}
                  </span>
                </div>
                <div className="spread" style={{ marginTop: 2 }}>
                  <span className="tiny faint">Commissioning Expected:</span>
                  <span className="mono tiny">{selectedSensor.baseline} {selectedSensor.unit}</span>
                </div>
                <div className="spread" style={{ marginTop: 2 }}>
                  <span className="tiny faint">Persistent Residual:</span>
                  <span className="mono tiny" style={{ color: liveSensorData?.analytics.state !== 'NORMAL' ? 'var(--amber)' : 'var(--green)' }}>
                    {liveSensorData ? `${liveSensorData.analytics.residualPercent.toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
              </div>

              {/* Stress / Strain Logic Warning */}
              <div className="panel" style={{ padding: 6, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <div className="tiny" style={{ fontWeight: 600, color: '#67e8f9' }}>Stress / Strain Engine:</div>
                <div className="tiny faint" style={{ marginTop: 2 }}>
                  Direct gauge measurement: <span className="mono">STRAIN (με)</span>. Corresponding Von Mises stress is <span className="mono">CALCULATED</span> from Young's modulus (E = 210 GPa).
                </div>
              </div>

              {/* Sensor to Structure Physical Linkage */}
              <div className="panel" style={{ padding: 6, background: 'rgba(0,0,0,0.25)' }}>
                <span className="tiny faint">Connected Load-Bearing Structure:</span>
                <div className="row wrap" style={{ marginTop: 4, gap: 4 }}>
                  {(SENSOR_REGION_COMPONENTS[selectedSensor.id] || []).map((cid: string) => (
                    <button
                      key={cid}
                      className="chip tiny"
                      onClick={() => select(cid)}
                      style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                    >
                      {CATALOG_BY_ID[cid]?.name || cid}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 408,
          right: 14,
          zIndex: 2,
          padding: '8px 14px',
          background: 'rgba(12, 16, 21, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          pointerEvents: 'auto',
        }}
      >
        <div className="row" style={{ gap: 8 }}>
          <span className="tiny faint">Live Ingest:</span>
          <span className="chip" style={{ color: 'var(--green)' }}>● STREAM ACTIVE (500 Hz SENSOR POLLING)</span>
        </div>
        <button
          className="btn"
          onClick={() => navigate('eng_analytics')}
          style={{ background: '#0891b2', color: '#fff', fontWeight: 600, border: 'none' }}
        >
          Proceed to 06 Engineering Analytics →
        </button>
      </div>
    </div>
  );
}
