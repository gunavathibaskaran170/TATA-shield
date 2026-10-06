/* ============================================================
   SHIELD — STAGE 02: BUILD & MANUFACTURING BASELINE WORKSTATION
   Strict 3-Column Professional Engineering Workspace Layout
   - Row 1: Single Top Global Navigation (handled by App Shell TopBar)
   - Row 2: Page Header & Toolbar with Dark Navy Heading (#101820)
   - Row 3: Grid (300px Left Collapsible Panel | Flexible Viewport | 280px Right Result Panel)
   - 4 Major Steps: 01 Dimensional Check, 02 Joint Check, 03 Baseline Capture, 04 Build Decision
   - Row 4: Thin 42px Viewport Toolbar (Nominal | As-Built | Deviation)
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { METROLOGY_DATUM_POINTS, BATTERY_MOUNTS } from '../data/engineering';
import { PageHeader } from '../ui/PageHeader';

export function ManufacturingQuality() {
  const selectedDatumPoint = useStore((s) => s.selectedDatumPoint);
  const setSelectedDatumPoint = useStore((s) => s.setSelectedDatumPoint);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const requestResetCamera = useStore((s) => s.requestResetCamera);
  const vehicleId = useStore((s) => s.vehicleId);
  const wireframeOpacity = useStore((s) => s.wireframeOpacity);
  const setWireframeOpacity = useStore((s) => s.setWireframeOpacity);

  // Layout & Panel Collapse State
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(false);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(false);
  const [mfgStep, setMfgStep] = useState<1 | 2 | 3 | 4>(1);
  const [inspectionMode, setInspectionMode] = useState<'nominal' | 'as_built' | 'deviation'>('deviation');
  const [filterRegion, setFilterRegion] = useState<string>('ALL');
  const [baselineFrozen, setBaselineFrozen] = useState<boolean>(false);

  const selectedPoint = METROLOGY_DATUM_POINTS.find((p) => p.id === selectedDatumPoint) ?? METROLOGY_DATUM_POINTS[0];
  const regions = ['ALL', ...new Set(METROLOGY_DATUM_POINTS.map((p) => p.region))];
  const filteredPoints = filterRegion === 'ALL'
    ? METROLOGY_DATUM_POINTS
    : METROLOGY_DATUM_POINTS.filter((p) => p.region === filterRegion);

  const totalPoints = METROLOGY_DATUM_POINTS.length;
  const acceptedPoints = METROLOGY_DATUM_POINTS.filter((p) => p.status === 'ACCEPT').length;
  const maxDev = Math.max(...METROLOGY_DATUM_POINTS.map((p) => p.deviationMm));

  const handleLocatePoint = (id: string) => {
    setSelectedDatumPoint(id);
    requestResetCamera();
  };

  return (
    <div
      className="mfg-quality-layout"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#E8EDF3',
        color: '#101820',
        fontFamily: 'var(--sans)',
      }}
    >
      {/* ============================================================
          ROW 2 — PAGE HEADER / TOOLBAR (SOLID LIGHT BG, DARK NAVY HEADING)
          ============================================================ */}
      <PageHeader
        title="02 Build & Baseline"
        description='"Was the vehicle built according to the released design?"'
        badge="CMM METROLOGY"
        badgeType="success"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>DATA SOURCE:</span>
          <select
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 6,
              background: '#141b24',
              border: '1px solid #273342',
              color: '#F8FAFC',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="factory">Engineering Stream (CMM Cell 04)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>VIEW:</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 6,
              background: '#141b24',
              border: '1px solid #273342',
              color: '#F8FAFC',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="chassis">Complete Vehicle / Chassis</option>
            <option value="skeletal">Skeletal Frame Only</option>
            <option value="body">Full Exterior Body</option>
          </select>
        </div>

        <button
          onClick={() => requestResetCamera()}
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 6,
            background: '#141b24',
            border: '1px solid #273342',
            color: '#F8FAFC',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          ⟳ Reset View
        </button>
      </PageHeader>

      {/* ============================================================
          ROW 3 — MAIN WORKSPACE GRID (300px LEFT | FLEX VIEWPORT | 280px RIGHT)
          ============================================================ */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `${leftCollapsed ? '48px' : '300px'} minmax(0, 1fr) ${rightCollapsed ? '0px' : '280px'}`,
          overflow: 'hidden',
          position: 'relative',
          transition: 'grid-template-columns 0.2s ease',
        }}
      >
        {/* ------------------------------------------------------------
            LEFT CONTROL PANEL (300px / 48px COLLAPSED)
            ------------------------------------------------------------ */}
        <div
          style={{
            background: '#111A24',
            borderRight: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 5,
            color: '#E2E8F0',
            fontFamily: 'var(--mono)',
            padding: leftCollapsed ? 8 : 12,
            gap: 12,
          }}
        >
          {/* HEADER & COLLAPSE BUTTON */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: leftCollapsed ? 'center' : 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: leftCollapsed ? 4 : 8 }}>
            {!leftCollapsed && <span style={{ fontWeight: 800, fontSize: 12, color: '#16A36A', letterSpacing: '0.05em' }}>MANUFACTURING CHECK</span>}
            <button
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              style={{ background: 'transparent', border: 'none', color: '#38BDF8', fontSize: 14, cursor: 'pointer' }}
              title={leftCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              ☰
            </button>
          </div>

          {!leftCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              
              {/* STEP 1: DIMENSIONAL CHECK */}
              <div style={{ background: '#070B11', borderRadius: 8, border: mfgStep === 1 ? '1px solid #16A36A' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setMfgStep(1)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: mfgStep === 1 ? 'rgba(22,163,106,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 01 DIMENSIONAL CHECK</span>
                  <span style={{ fontSize: 10, color: '#16A36A', fontWeight: 700 }}>24/24 Datums</span>
                </button>
                {mfgStep === 1 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>REGION FILTER:</span>
                      <select
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value)}
                        style={{ background: '#0F172A', color: '#F8FAFC', border: '1px solid #334155', padding: 4, borderRadius: 4, fontSize: 11 }}
                      >
                        {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>MEASUREMENT POINT:</span>
                      <select
                        value={selectedPoint.id}
                        onChange={(e) => setSelectedDatumPoint(e.target.value)}
                        style={{ background: '#0F172A', color: '#38BDF8', border: '1px solid #334155', padding: 4, borderRadius: 4, fontSize: 11, fontWeight: 700 }}
                      >
                        {filteredPoints.map((p) => (
                          <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ background: '#0D1724', padding: 8, borderRadius: 6, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10.5 }}>
                      <div>Nominal: <strong style={{ color: '#F8FAFC' }}>{selectedPoint.nominal.map(v => (v / 1000).toFixed(2)).join(', ')} m</strong></div>
                      <div>Measured: <strong style={{ color: '#38BDF8' }}>{selectedPoint.measured.map(v => (v / 1000).toFixed(4)).join(', ')} m</strong></div>
                      <div>Deviation: <strong style={{ color: selectedPoint.deviationMm > selectedPoint.toleranceMm ? '#F4A62A' : '#16A36A' }}>+{selectedPoint.deviationMm.toFixed(2)} mm</strong></div>
                      <div>Tolerance: <strong style={{ color: '#94A3B8' }}>±{selectedPoint.toleranceMm.toFixed(2)} mm</strong></div>
                      <div>Status: <span style={{ fontWeight: 800, color: selectedPoint.status === 'ACCEPT' ? '#16A36A' : '#D83B3B' }}>{selectedPoint.status}</span></div>
                    </div>

                    <button
                      onClick={() => handleLocatePoint(selectedPoint.id)}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, background: '#00A6D6', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
                    >
                      🎯 LOCATE ON VEHICLE
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: JOINT & ASSEMBLY CHECK */}
              <div style={{ background: '#070B11', borderRadius: 8, border: mfgStep === 2 ? '1px solid #16A36A' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setMfgStep(2)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: mfgStep === 2 ? 'rgba(22,163,106,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 02 JOINT & ASSEMBLY CHECK</span>
                  <span style={{ fontSize: 10, color: '#16A36A', fontWeight: 700 }}>6/6 Mounts</span>
                </button>
                {mfgStep === 2 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {BATTERY_MOUNTS.map((m) => (
                      <div key={m.id} style={{ background: '#0D1724', padding: 6, borderRadius: 6, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#38BDF8' }}>
                          <span>{m.id} ({m.location})</span>
                          <span style={{ color: m.status === 'ACCEPT' ? '#16A36A' : '#F4A62A' }}>{m.status}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 10 }}>
                          <span>Torque: {m.measuredTorqueNm} Nm</span>
                          <span>Preload: {m.preloadKn} kN</span>
                          <span style={{ color: '#16A36A' }}>{m.ultrasonicIntegrityPct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STEP 3: BASELINE CAPTURE */}
              <div style={{ background: '#070B11', borderRadius: 8, border: mfgStep === 3 ? '1px solid #16A36A' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setMfgStep(3)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: mfgStep === 3 ? 'rgba(22,163,106,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 03 BASELINE CAPTURE</span>
                  <span style={{ fontSize: 10, color: baselineFrozen ? '#16A36A' : '#F4A62A', fontWeight: 700 }}>{baselineFrozen ? 'FROZEN' : 'READY'}</span>
                </button>
                {mfgStep === 3 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Geometry Baseline:</span><strong style={{ color: '#16A36A' }}>24 Datums Locked</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Joint Baseline:</span><strong style={{ color: '#16A36A' }}>6 Mounts Verified</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Structural Reference:</span><strong style={{ color: '#38BDF8' }}>Zero Tare Fixed</strong></div>
                    
                    <button
                      onClick={() => setBaselineFrozen(true)}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, background: baselineFrozen ? '#059669' : '#00A6D6', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 4 }}
                    >
                      {baselineFrozen ? '✓ BASELINE A CAPTURED' : '🔒 FREEZE MANUFACTURING BASELINE'}
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 4: BUILD DECISION */}
              <div style={{ background: '#070B11', borderRadius: 8, border: mfgStep === 4 ? '1px solid #16A36A' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setMfgStep(4)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: mfgStep === 4 ? 'rgba(22,163,106,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 04 BUILD DECISION</span>
                  <span style={{ fontSize: 10, color: '#16A36A', fontWeight: 800 }}>ACCEPTED</span>
                </button>
                {mfgStep === 4 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Points Inspected: <strong style={{ color: '#F8FAFC' }}>24 / 24</strong></div>
                    <div>Max Deviation: <strong style={{ color: '#38BDF8' }}>{maxDev.toFixed(2)} mm (Tol 0.80 mm)</strong></div>
                    <div>Joint Checks: <strong style={{ color: '#16A36A' }}>6 / 6 PASS</strong></div>

                    <div style={{ width: '100%', padding: 10, borderRadius: 6, background: 'rgba(22,163,106,0.2)', border: '1px solid #16A36A', color: '#34D399', fontWeight: 800, textAlign: 'center', marginTop: 4, fontSize: 12 }}>
                      ✓ BUILD ACCEPTED
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* ------------------------------------------------------------
            CENTER COLUMN: 3D VIEWPORT CANVAS (FLEXIBLE)
            ------------------------------------------------------------ */}
        <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%', background: '#E8EDF3', overflow: 'hidden' }}>
          
          {/* 3D Scene bounded strictly inside viewport */}
          <VehicleScene />

          {/* ROW 4 THIN BOTTOM VIEWPORT TOOLBAR (MAX 42px) */}
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              height: 38,
              padding: '0 12px',
              background: '#131D28',
              borderRadius: 8,
              border: '1px solid #1F2B38',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#F2F5F8',
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ color: '#A8B4C2', fontWeight: 500 }}>VIEW MODE:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['nominal', 'as_built', 'deviation'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInspectionMode(mode)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: inspectionMode === mode ? '#16A8E0' : 'rgba(255,255,255,0.05)',
                    color: '#FFFFFF',
                    border: inspectionMode === mode ? '1px solid #28B8EE' : '1px solid transparent',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>

            <span style={{ color: '#A8B4C2', fontWeight: 500, marginLeft: 4 }}>OPACITY:</span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={wireframeOpacity}
              onChange={(e) => setWireframeOpacity(parseFloat(e.target.value))}
              style={{ width: 80, accentColor: '#16A8E0', cursor: 'pointer' }}
            />
            <span className="mono" style={{ fontWeight: 600, minWidth: 32, color: '#16A8E0' }}>{Math.round(wireframeOpacity * 100)}%</span>
          </div>

        </div>

        {/* ------------------------------------------------------------
            RIGHT RESULT PANEL (280px / 0px CLOSED)
            ------------------------------------------------------------ */}
        {!rightCollapsed && (
          <div
            style={{
              width: 280,
              background: '#111A24',
              borderLeft: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              gap: 10,
              color: '#E2E8F0',
              fontFamily: 'var(--mono)',
              overflowY: 'auto',
              zIndex: 5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: '#38BDF8' }}>POINT DETAILS</span>
              <button
                onClick={() => setRightCollapsed(true)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 14, cursor: 'pointer' }}
                title="Close Right Panel"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>SELECTED DATUM ID</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{selectedPoint.id} — {selectedPoint.name}</div>
                <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 1 }}>Region: {selectedPoint.region}</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>SCAN DEVIATION</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: selectedPoint.deviationMm > selectedPoint.toleranceMm ? '#F4A62A' : '#16A36A', marginTop: 2 }}>
                  +{selectedPoint.deviationMm.toFixed(2)} mm
                </div>
                <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1 }}>Tolerance Limit: ±{selectedPoint.toleranceMm.toFixed(2)} mm</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>INSPECTION STATUS</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: selectedPoint.status === 'ACCEPT' ? '#16A36A' : '#D83B3B', marginTop: 2 }}>
                  {selectedPoint.status}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
