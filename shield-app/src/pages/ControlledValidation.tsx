/* ============================================================
   SHIELD — STAGE 03: VALIDATE & CONTROLLED TEST LAB WORKSTATION
   Strict 3-Column Professional Engineering Workspace Layout
   - Row 1: Single Top Global Navigation (handled by App Shell TopBar)
   - Row 2: Page Header & Toolbar with Dark Navy Heading (#101820)
   - Row 3: Grid (300px Left Collapsible Panel | Flexible Viewport | 280px Right Result Panel)
   - 5 Major Steps: 01 Test Setup, 02 Apply Load, 03 Response, 04 CAE Correlation, 05 Decision
   - Row 4: Thin 42px Viewport Toolbar (Stress | Strain | Deformation | Load Path)
   ============================================================ */

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { TEST_RIGS, PROVING_GROUND_SECTORS } from '../data/engineering';
import { PageHeader } from '../ui/PageHeader';

export function ControlledValidation() {
  const activeTestRig = useStore((s) => s.activeTestRig);
  const setActiveTestRig = useStore((s) => s.setActiveTestRig);
  const visualDeformationScale = useStore((s) => s.visualDeformationScale);
  const setVisualDeformationScale = useStore((s) => s.setVisualDeformationScale);
  const requestResetCamera = useStore((s) => s.requestResetCamera);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const wireframeOpacity = useStore((s) => s.wireframeOpacity);
  const setWireframeOpacity = useStore((s) => s.setWireframeOpacity);

  // Layout & Panel Collapse State
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(false);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(false);
  const [testStep, setTestStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Test Simulation State
  const [targetComponent, setTargetComponent] = useState<string>('Front Left Rail (HP-F01-L)');
  const [testLoadType, setTestLoadType] = useState<string>('Vertical Bump');
  const [loadDirection, setLoadDirection] = useState<string>('-Y Down');
  const [appliedLoadKn, setAppliedLoadKn] = useState<number>(15.0);
  const [loadState, setLoadState] = useState<'IDLE' | 'HOLD' | 'RELEASING'>('IDLE');
  const [metricMode, setMetricMode] = useState<'stress' | 'strain' | 'displacement' | 'loadpath'>('stress');

  // Calculated Structural Metrics
  const stressMpa = Math.round(appliedLoadKn * 10.0);
  const strainMicro = Math.round(stressMpa * 4.76);
  const dispMm = Math.round((appliedLoadKn * 0.24) * 10) / 10;
  const utilizationPct = Math.round((stressMpa / 250.0) * 100);
  const safetyFactor = Math.round((250.0 / Math.max(1, stressMpa)) * 100) / 100;

  // Thresholds: SAFE (0-25 kN), WARNING (25-45 kN), CRITICAL (>45 kN)
  const thresholdState = appliedLoadKn > 45 ? 'CRITICAL' : appliedLoadKn > 25 ? 'WARNING' : 'SAFE';

  return (
    <div
      className="controlled-val-layout"
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
        title="03 Validate & Testing"
        description='"Does the manufactured structure behave as predicted?"'
        badge="TEST LAB RIG"
        badgeType="default"
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
            <option value="test_rig">Engineering Stream (Test Rig A)</option>
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
            <option value="transparent">Transparent Stress Overlay</option>
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
            {!leftCollapsed && <span style={{ fontWeight: 800, fontSize: 12, color: '#00A6D6', letterSpacing: '0.05em' }}>CONTROLLED TEST</span>}
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
              
              {/* STEP 1: TEST SETUP */}
              <div style={{ background: '#070B11', borderRadius: 8, border: testStep === 1 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setTestStep(1)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: testStep === 1 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 01 TEST SETUP</span>
                  <span style={{ fontSize: 10, color: '#00A6D6', fontWeight: 700 }}>CONFIGURED</span>
                </button>
                {testStep === 1 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>TEST TYPE:</span>
                      <select
                        value={testLoadType}
                        onChange={(e) => setTestLoadType(e.target.value)}
                        style={{ background: '#0F172A', color: '#F8FAFC', border: '1px solid #334155', padding: 4, borderRadius: 4, fontSize: 11 }}
                      >
                        <option value="Vertical Bump">Vertical Bump Excitation</option>
                        <option value="Torsion Couple">Pure Torsional Couple</option>
                        <option value="Bending Ram">Static Floor Bending</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>TARGET COMPONENT:</span>
                      <select
                        value={targetComponent}
                        onChange={(e) => setTargetComponent(e.target.value)}
                        style={{ background: '#0F172A', color: '#38BDF8', border: '1px solid #334155', padding: 4, borderRadius: 4, fontSize: 11, fontWeight: 700 }}
                      >
                        <option value="Front Left Rail (HP-F01-L)">Front Left Rail (HP-F01-L)</option>
                        <option value="Battery Tray Mount FL">Battery Tray Mount FL</option>
                        <option value="Rear Subframe Crossmember">Rear Subframe Crossmember</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>DIRECTION:</span>
                      <select
                        value={loadDirection}
                        onChange={(e) => setLoadDirection(e.target.value)}
                        style={{ background: '#0F172A', color: '#F8FAFC', border: '1px solid #334155', padding: 4, borderRadius: 4, fontSize: 11 }}
                      >
                        <option value="-Y Down">-Y Vertical Downward</option>
                        <option value="+X Transverse">+X Transverse Inward</option>
                        <option value="+Z Longitudinal">+Z Longitudinal Crash</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setTestStep(2)}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, background: '#00A6D6', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
                    >
                      ▶ START TEST SETUP
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: APPLY LOAD */}
              <div style={{ background: '#070B11', borderRadius: 8, border: testStep === 2 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setTestStep(2)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: testStep === 2 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 02 APPLY LOAD</span>
                  <span style={{ fontSize: 10, color: thresholdState === 'SAFE' ? '#16A36A' : thresholdState === 'WARNING' ? '#F4A62A' : '#D83B3B', fontWeight: 800 }}>
                    {appliedLoadKn.toFixed(1)} kN
                  </span>
                </button>
                {testStep === 2 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                      <span>APPLIED LOAD:</span>
                      <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: 13 }}>{appliedLoadKn.toFixed(1)} kN</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={appliedLoadKn}
                      onChange={(e) => setAppliedLoadKn(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#00A6D6', cursor: 'pointer' }}
                    />

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => setLoadState('HOLD')}
                        style={{ flex: 1, padding: 5, borderRadius: 4, background: '#0F172A', border: '1px solid #334155', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: 10 }}
                      >
                        HOLD
                      </button>
                      <button
                        onClick={() => setAppliedLoadKn(0)}
                        style={{ flex: 1, padding: 5, borderRadius: 4, background: '#0F172A', border: '1px solid #334155', color: '#94A3B8', fontWeight: 700, cursor: 'pointer', fontSize: 10 }}
                      >
                        RELEASE
                      </button>
                    </div>

                    {/* DYNAMIC THRESHOLD LIGHTS DERIVED FROM COMPONENT PROFILE */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, paddingTop: 4, borderTop: '1px solid #1E293B' }}>
                      <span style={{ color: thresholdState === 'SAFE' ? '#16A36A' : '#64748B', fontWeight: thresholdState === 'SAFE' ? 800 : 500 }}>● SAFE (0-25 kN)</span>
                      <span style={{ color: thresholdState === 'WARNING' ? '#F4A62A' : '#64748B', fontWeight: thresholdState === 'WARNING' ? 800 : 500 }}>● WARN (25-45 kN)</span>
                      <span style={{ color: thresholdState === 'CRITICAL' ? '#D83B3B' : '#64748B', fontWeight: thresholdState === 'CRITICAL' ? 800 : 500 }}>● CRIT (&gt;45 kN)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: RESPONSE */}
              <div style={{ background: '#070B11', borderRadius: 8, border: testStep === 3 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setTestStep(3)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: testStep === 3 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 03 RESPONSE</span>
                  <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 700 }}>{stressMpa} MPa</span>
                </button>
                {testStep === 3 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Von Mises Stress:</span><strong style={{ color: '#F8FAFC' }}>{stressMpa} MPa</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Strain Response:</span><strong style={{ color: '#38BDF8' }}>{strainMicro} µε</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Displacement:</span><strong style={{ color: '#38BDF8' }}>{dispMm} mm</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Utilization:</span><strong style={{ color: utilizationPct > 80 ? '#F4A62A' : '#16A36A' }}>{utilizationPct}%</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Safety Factor:</span><strong style={{ color: safetyFactor >= 1.5 ? '#16A36A' : '#F4A62A' }}>{safetyFactor}</strong></div>
                  </div>
                )}
              </div>

              {/* STEP 4: CAE CORRELATION */}
              <div style={{ background: '#070B11', borderRadius: 8, border: testStep === 4 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setTestStep(4)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: testStep === 4 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 04 CAE CORRELATION</span>
                  <span style={{ fontSize: 10, color: '#16A36A', fontWeight: 800 }}>98.4% Match</span>
                </button>
                {testStep === 4 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CAE Stress:</span><span>148 MPa</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Test Stress:</span><span>150 MPa</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Difference:</span><strong style={{ color: '#16A36A' }}>+1.3%</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Correlation Score:</span><strong style={{ color: '#16A36A' }}>98.4% Match</strong></div>
                  </div>
                )}
              </div>

              {/* STEP 5: DECISION */}
              <div style={{ background: '#070B11', borderRadius: 8, border: testStep === 5 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                <button
                  onClick={() => setTestStep(5)}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: testStep === 5 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>✓ 05 DECISION</span>
                  <span style={{ fontSize: 10, color: thresholdState === 'CRITICAL' ? '#D83B3B' : '#16A36A', fontWeight: 800 }}>
                    {thresholdState === 'CRITICAL' ? 'EVENT RECORDED' : 'VALIDATED'}
                  </span>
                </button>
                {testStep === 5 && (
                  <div style={{ padding: 10, borderTop: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {thresholdState === 'CRITICAL' && (
                      <div style={{ background: 'rgba(216,59,59,0.2)', border: '1px solid #D83B3B', padding: 8, borderRadius: 6, color: '#FF9999', fontWeight: 800, textAlign: 'center' }}>
                        ⚠️ STRUCTURAL EVENT RECORDED
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button style={{ flex: 1, padding: 6, borderRadius: 4, background: '#059669', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}>
                        PASS
                      </button>
                      <button style={{ flex: 1, padding: 6, borderRadius: 4, background: '#D97706', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}>
                        RETEST
                      </button>
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
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              height: 38,
              padding: '0 12px',
              background: 'rgba(17,26,36,0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: 8,
              border: '1px solid rgba(0,166,214,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#FFFFFF',
              fontSize: 11,
              fontFamily: 'var(--mono)',
            }}
          >
            <span style={{ color: '#94A3B8', fontWeight: 700 }}>RESULT:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['stress', 'strain', 'displacement', 'loadpath'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMetricMode(mode)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: metricMode === mode ? '#00A6D6' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    border: metricMode === mode ? '1px solid #38BDF8' : '1px solid transparent',
                    textTransform: 'uppercase',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <span style={{ color: '#94A3B8', fontWeight: 700, marginLeft: 6 }}>SCALE:</span>
            {([1, 5, 10] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setVisualDeformationScale(scale)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: visualDeformationScale === scale ? '#00A6D6' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: visualDeformationScale === scale ? '1px solid #38BDF8' : '1px solid transparent',
                }}
              >
                {scale === 1 ? '1× True' : `${scale}×`}
              </button>
            ))}

            <span style={{ color: '#94A3B8', fontWeight: 700, marginLeft: 6 }}>OPACITY:</span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={wireframeOpacity}
              onChange={(e) => setWireframeOpacity(parseFloat(e.target.value))}
              style={{ width: 70, accentColor: '#00A6D6', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 700, minWidth: 28, color: '#38BDF8' }}>{Math.round(wireframeOpacity * 100)}%</span>
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
              <span style={{ fontWeight: 800, fontSize: 12, color: '#38BDF8' }}>LIVE RESPONSE</span>
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
                <div style={{ color: '#94A3B8', fontSize: 10 }}>APPLIED LOAD</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{appliedLoadKn.toFixed(1)} kN</div>
                <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 1 }}>{targetComponent}</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>VON MISES STRESS</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: thresholdState === 'SAFE' ? '#16A36A' : thresholdState === 'WARNING' ? '#F4A62A' : '#D83B3B', marginTop: 2 }}>
                  {stressMpa} MPa
                </div>
                <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1 }}>Strain: {strainMicro} µε | Disp: {dispMm} mm</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>THRESHOLD STATE</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: thresholdState === 'SAFE' ? '#16A36A' : thresholdState === 'WARNING' ? '#F4A62A' : '#D83B3B', marginTop: 2 }}>
                  ● {thresholdState}
                </div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>CAE CORRELATION</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#16A36A', marginTop: 2 }}>98.4% MATCH</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
