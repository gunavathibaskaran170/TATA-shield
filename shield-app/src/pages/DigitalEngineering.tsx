/* ============================================================
   SHIELD — STAGE 01: DESIGN & CAE VALIDATION WORKSTATION
   Strict 2-Column Professional Automotive Engineering Layout
   - Single Top Lifecycle Navigation (handled by App Shell TopBar)
   - Solid Row 2 Header Toolbar with Dark Navy Heading (#101820)
   - Fixed 340px Left CAE Workflow Sidebar
   - Main 3D Viewport bounded strictly to remaining screen area
   - Step 1-8 Mechanical Engineering Workflow Accordions
   - ANSYS-Style Vertical Contour Legend & Result Summary Panel
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { HardwareBenchScene3D } from '../three/HardwareBenchScene3D';
import { hardwareStream } from '../dataflow/hardwareStream';
import { HARDWARE_COMPONENTS, INITIAL_WIRES } from '../data/hardwareLayout';
import type {
  SensorTelemetry,
  HardwareComponentMeta,
  WireConnection,
  WireRoutingMode,
} from '../types/simulation';
import { ComponentInspectorModal } from '../ui/modals/ComponentInspectorModal';
import { ComponentLockValidationPanel } from '../ui/modals/ComponentLockValidationPanel';
import { DESIGN_REVISIONS, CAE_LOAD_CASES } from '../data/engineering';
import { CATALOG_BY_ID } from '../data/catalog';
import type { CaeLoadCase, DesignRevision } from '../schema/types';
import { PageHeader } from '../ui/PageHeader';

export function DigitalEngineering() {
  const currentRevision = useStore((s) => s.currentRevision);
  const setCurrentRevision = useStore((s) => s.setCurrentRevision);
  const activeCaeLoadCase = useStore((s) => s.activeCaeLoadCase);
  const setActiveCaeLoadCase = useStore((s) => s.setActiveCaeLoadCase);

  // 8-Step CAE Workflow State
  const caeStep = useStore((s) => s.caeStep);
  const setCaeStep = useStore((s) => s.setCaeStep);
  const caeState = useStore((s) => s.caeState);
  const setCaeState = useStore((s) => s.setCaeState);
  const setCaeAnimationProgress = useStore((s) => s.setCaeAnimationProgress);
  const caeMetric = useStore((s) => s.caeMetric);
  const setCaeMetric = useStore((s) => s.setCaeMetric);
  const caeDeformationScale = useStore((s) => s.caeDeformationScale);
  const setCaeDeformationScale = useStore((s) => s.setCaeDeformationScale);

  // Probe & View Toggles
  const caeProbeActive = useStore((s) => s.caeProbeActive);
  const setCaeProbeActive = useStore((s) => s.setCaeProbeActive);
  const caeProbeData = useStore((s) => s.caeProbeData);
  const setCaeProbeData = useStore((s) => s.setCaeProbeData);
  const setCaeMeshView = useStore((s) => s.setCaeMeshView);
  const caeMaterialColorView = useStore((s) => s.caeMaterialColorView);
  const setCaeMaterialColorView = useStore((s) => s.setCaeMaterialColorView);
  const wireframeOpacity = useStore((s) => s.wireframeOpacity);
  const setWireframeOpacity = useStore((s) => s.setWireframeOpacity);

  const selected = useStore((s) => s.selected);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const setViewPreset = useStore((s) => s.setViewPreset);
  const setCadView = useStore((s) => s.setCadView);
  const requestResetCamera = useStore((s) => s.requestResetCamera);

  // Tabs: 'cae' | 'revisions' | 'release'
  const [activeTab, setActiveTab] = useState<'cae' | 'revisions' | 'release'>('cae');
  const [solveProgressText, setSolveProgressText] = useState<string>('READY TO SOLVE');

  // Unified Workspace View: Structure, Hardware Simul, or Dual Twin
  const [workspaceMode, setWorkspaceMode] = useState<'structure' | 'hardware' | 'dual'>('structure');
  const [selectedCompMeta, setSelectedCompMeta] = useState<HardwareComponentMeta | null>(null);
  const [selectedWire, setSelectedWire] = useState<WireConnection | null>(null);
  const [wires] = useState<WireConnection[]>(INITIAL_WIRES);
  const [components] = useState<HardwareComponentMeta[]>(HARDWARE_COMPONENTS);
  const [routingMode, setRoutingMode] = useState<WireRoutingMode>('ALIGNED_ORTHOGONAL');
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [showValidator, setShowValidator] = useState<boolean>(false);

  const activeRev = DESIGN_REVISIONS[currentRevision];
  const activeCae = CAE_LOAD_CASES[activeCaeLoadCase] || CAE_LOAD_CASES.battery_enclosure;
  const caeStatus = activeCae.safetyFactor >= 1.5 ? 'PASS' : 'REVIEW';

  const hwMetrics = hardwareStream.currentMetrics;
  const computedLoadKg = hwMetrics.weightKg > 0 ? hwMetrics.weightKg : (activeCae.peakStressMpa / 4.8);
  const computedMicrostrain = hwMetrics.dynStressMpa > 0 ? hwMetrics.dynStressMpa * 14.5 : activeCae.peakStressMpa * 10;
  const caeTelemetry: SensorTelemetry = {
    timestamp: Date.now(),
    strainMicroStrain: computedMicrostrain,
    loadKg: computedLoadKg,
    loadCell1Raw: Math.round(computedLoadKg * 1000),
    loadCell2Raw: Math.round(computedLoadKg * 1000),
    strainDeformationMm: activeCae.maxDeflectionMm,
    accel: { x: 0, y: 0, z: hwMetrics.gForce || 1.0 },
    gyro: { x: 0, y: 0, z: hwMetrics.gyroDps || 0 },
    roll: hwMetrics.rollDeg || 0,
    pitch: hwMetrics.pitchDeg || 0,
    yaw: 0,
    vibrationSensorDetected: hwMetrics.vibrationActive,
    vibrationSensorRaw: hwMetrics.vibrationActive ? 1 : 0,
    temperatureC: hwMetrics.chassisTempC > 0 ? hwMetrics.chassisTempC : 26.5,
    vibrationMotorActive: caeState === 'RUNNING' || hwMetrics.vibrationActive,
    vibrationDutyCycle: caeState === 'RUNNING' ? 220 : 0,
    buzzerActive: caeState === 'RUNNING' && caeStep === 7,
    buzzerFrequency: 2400,
    ledGreen: caeStatus === 'PASS',
    ledYellow: false,
    ledRed: caeStatus !== 'PASS',
    systemStatus: caeStatus === 'PASS' ? 'NORMAL' : 'WARNING',
    activeScenario: 'NORMAL',
    scenarioProgress: 0,
    dataSource: hardwareStream.isConnected() ? 'REAL_HARDWARE' : 'SIMULATION',
  };

  const selectedCompId = selected.length ? selected[selected.length - 1] : null;
  const selectedComp = selectedCompId ? CATALOG_BY_ID[selectedCompId] : null;

  // Predefined Case Selection Handler
  const handleSelectCaeCase = (caseId: CaeLoadCase) => {
    setActiveCaeLoadCase(caseId);
    setCaeStep(1);
    setCaeState('SETUP');
    setCaeAnimationProgress(0);
    setCaeProbeData(null);
    setCaeMaterialColorView(false);
    setCaeMeshView(false);

    switch (caseId) {
      case 'battery_enclosure':
      case 'kerb_strike':
        setViewPreset('left');
        setViewMode('chassis');
        break;
      case 'underbody_intrusion':
        setViewPreset('bottom');
        setViewMode('chassis');
        break;
      case 'suspension_mount':
      case 'wheel_input':
      case 'pothole_impact':
        setViewPreset('front');
        setViewMode('chassis');
        break;
      case 'modal_excitation':
      case 'torsion':
        setViewPreset('iso');
        setViewMode('skeletal');
        setCadView(true);
        break;
      default:
        setViewPreset('iso');
        setViewMode('chassis');
        break;
    }
  };

  // Step 7 SOLVE CASE Handler
  const handleSolveCase = () => {
    setCaeState('RUNNING');
    setCaeStep(7);
    setCaeAnimationProgress(0);

    const stages = [
      'PREPARING CASE SETUP...',
      'ASSEMBLING RESPONSE MATRIX...',
      'SOLVING FEA EQUATIONS...',
      'POST-PROCESSING RESULTS...',
      'RESULTS READY',
    ];

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < stages.length) {
        setSolveProgressText(stages[idx]);
        setCaeAnimationProgress(idx / (stages.length - 1));
      } else {
        clearInterval(interval);
        setCaeState('RESULT');
        setCaeStep(8);
        setSolveProgressText('SOLVE COMPLETED');
        setViewMode('transparent');
      }
    }, 400);
  };

  return (
    <div
      className="digital-eng-layout"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#E9EEF5',
        color: '#101820',
      }}
    >
      {/* ============================================================
          ROW 2 — PAGE HEADER / TOOLBAR (SOLID LIGHT BG, DARK NAVY HEADING)
          ============================================================ */}
      <PageHeader
        title="01 Design & CAE Validation"
        description='Structural Design Verification · "Can the structure safely carry the required design loads?"'
        badge="STATIC STRUCTURAL"
        badgeType="default"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* WORKSPACE MODE: STRUCTURE / HARDWARE SIMUL / DUAL TWIN */}
          <div style={{ display: 'flex', gap: 3, background: '#141b24', padding: 3, borderRadius: 6, border: '1px solid #273342' }}>
            <button
              onClick={() => setWorkspaceMode('structure')}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 4,
                background: workspaceMode === 'structure' ? '#00A6D6' : 'transparent',
                color: workspaceMode === 'structure' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Show 3D CAD/CAE Vehicle Structure"
            >
              🚗 Structure
            </button>
            <button
              onClick={() => setWorkspaceMode('hardware')}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 4,
                background: workspaceMode === 'hardware' ? '#00A6D6' : 'transparent',
                color: workspaceMode === 'hardware' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Show 3D Hardware Simulation Bench (ESP32 Twin)"
            >
              🔬 Hardware Bench
            </button>
            <button
              onClick={() => setWorkspaceMode('dual')}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 4,
                background: workspaceMode === 'dual' ? '#00A6D6' : 'transparent',
                color: workspaceMode === 'dual' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Dual Twin: Side-by-Side Vehicle Structure & Hardware Simulation"
            >
              ◫ Dual Twin
            </button>
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
              <option value="transparent">Transparent Stress Overlay</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            requestResetCamera();
            setViewPreset('iso');
          }}
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
          ROW 3 — MAIN ENGINEERING WORKSPACE (GRID: 340px FIXED SIDEBAR + VIEWPORT)
          ============================================================ */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: activeTab === 'cae' && caeStep === 8 ? '340px minmax(0, 1fr) 280px' : '340px minmax(0, 1fr)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ============================================================
            LEFT COLUMN: CAE WORKFLOW SIDEBAR (FIXED 340px)
            ============================================================ */}
        <div
          style={{
            width: 340,
            background: '#0D1724',
            borderRight: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 5,
            color: '#E2E8F0',
            fontFamily: 'var(--mono)',
            padding: 12,
            gap: 12,
          }}
        >
          {/* TOP INTERNAL TABS */}
          <div style={{ display: 'flex', gap: 4, background: '#070B11', padding: 4, borderRadius: 8, border: '1px solid #1E293B' }}>
            <button
              onClick={() => setActiveTab('cae')}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 10.5,
                fontWeight: 700,
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'cae' ? '#00A6D6' : 'transparent',
                color: activeTab === 'cae' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              CAE Workflow
            </button>
            <button
              onClick={() => setActiveTab('revisions')}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 10.5,
                fontWeight: 700,
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'revisions' ? '#00A6D6' : 'transparent',
                color: activeTab === 'revisions' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              CAD Revisions
            </button>
            <button
              onClick={() => setActiveTab('release')}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 10.5,
                fontWeight: 700,
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'release' ? '#00A6D6' : 'transparent',
                color: activeTab === 'release' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              Release Gate
            </button>
          </div>

          {/* TAB 1: CAE WORKFLOW */}
          {activeTab === 'cae' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              
              {/* CAE LOAD CASE SELECTOR */}
              <div style={{ background: '#070B11', padding: 10, borderRadius: 8, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#00A6D6', letterSpacing: '0.05em' }}>CAE LOAD CASE</span>
                  <span style={{ fontSize: 9, color: '#64748B' }}>STATIC FEA</span>
                </div>

                <select
                  value={activeCaeLoadCase}
                  onChange={(e) => handleSelectCaeCase(e.target.value as CaeLoadCase)}
                  style={{
                    width: '100%',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: '#0F172A',
                    border: '1px solid #334155',
                    color: '#38BDF8',
                    cursor: 'pointer',
                  }}
                >
                  {Object.entries(CAE_LOAD_CASES).map(([id, c]) => (
                    <option key={id} value={id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div style={{ fontSize: 10, color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div>Analysis: <strong style={{ color: '#F8FAFC' }}>Static Structural ({activeCae.category})</strong></div>
                  <div>Target Region: <strong style={{ color: '#38BDF8' }}>{activeCae.criticalRegion}</strong></div>
                </div>
              </div>

              {/* 8-STEP ACCORDION WORKFLOW */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                
                {/* STEP 1: GEOMETRY */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 1 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(1); setCaeState('SETUP'); setCaeMeshView(false); setCaeMaterialColorView(false); }}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 1 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep > 1 ? '✓' : '○'} 1. Geometry</span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{activeCae.criticalRegion}</span>
                  </button>
                  {caeStep === 1 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Critical Region: <strong style={{ color: '#38BDF8' }}>{activeCae.criticalRegion}</strong></div>
                      <div>Selected: <strong style={{ color: '#F8FAFC' }}>{selectedComp ? selectedComp.name : activeCae.criticalRegion}</strong></div>
                      <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.4 }}>
                        CAD geometry imported from official OEM model. Surface mesh clean & closed.
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2: MATERIAL */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 2 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(2); setCaeMaterialColorView(true); }}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 2 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep > 2 ? '✓' : '○'} 2. Material</span>
                    <span style={{ fontSize: 10, color: '#38BDF8' }}>Advanced Steel / Al</span>
                  </button>
                  {caeStep === 2 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Yield Strength (Ry): <strong style={{ color: '#F8FAFC' }}>{activeCae.yieldLimitMpa} MPa</strong></div>
                      <div>Elastic Modulus (E): <strong style={{ color: '#F8FAFC' }}>210 GPa</strong></div>
                      <div>Poisson Ratio (ν): <strong style={{ color: '#F8FAFC' }}>0.30</strong></div>
                    </div>
                  )}
                </div>

                {/* STEP 3: CONNECTIONS */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 3 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(3); setViewMode('chassis'); }}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 3 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep > 3 ? '✓' : '○'} 3. Connections</span>
                    <span style={{ fontSize: 10, color: '#10B981' }}>Bolts & Spot Welds</span>
                  </button>
                  {caeStep === 3 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Fastener Group: <strong style={{ color: '#38BDF8' }}>M10 Grade 10.9 Flange Bolts</strong></div>
                      <div>Preload: <strong style={{ color: '#F8FAFC' }}>35 kN / Fastener</strong></div>
                      <div>Bond Type: <strong style={{ color: '#10B981' }}>Rigid Multi-Point Constraint (MPC)</strong></div>
                    </div>
                  )}
                </div>

                {/* STEP 4: SUPPORTS */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 4 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(4); setViewMode('chassis'); }}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 4 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep > 4 ? '✓' : '○'} 4. Supports</span>
                    <span style={{ fontSize: 10, color: '#F59E0B' }}>▲ Fixed Constraints</span>
                  </button>
                  {caeStep === 4 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Fixed Locations: <strong style={{ color: '#F59E0B' }}>Suspension Mounts & Subframe</strong></div>
                      <div>Degrees of Freedom: <strong style={{ color: '#F8FAFC' }}>u_x = u_y = u_z = 0</strong></div>
                      <div>Constraint Type: <strong style={{ color: '#F59E0B' }}>Fixed Rigid Support (▲)</strong></div>
                    </div>
                  )}
                </div>

                {/* STEP 5: LOADS */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 5 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(5); setViewMode('chassis'); }}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 5 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep > 5 ? '✓' : '○'} 5. Loads</span>
                    <span style={{ fontSize: 10, color: '#EF4444' }}>→ {activeCae.loadInput}</span>
                  </button>
                  {caeStep === 5 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Load Input Spec: <strong style={{ color: '#EF4444' }}>{activeCae.loadInput}</strong></div>
                      <div>Load Path: <strong style={{ color: '#38BDF8' }}>{activeCae.loadPathDescription}</strong></div>
                    </div>
                  )}
                </div>

                {/* STEP 6: MESH */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 6 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(6); setCaeMeshView(true); }}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 6 ? 'rgba(0,166,214,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep > 6 ? '✓' : '○'} 6. Mesh</span>
                    <span style={{ fontSize: 10, color: '#38BDF8' }}>142,800 Elements</span>
                  </button>
                  {caeStep === 6 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Element Type: <strong style={{ color: '#38BDF8' }}>C3D8R 8-Node Solid Hexahedral</strong></div>
                      <div>Nodes Count: <strong style={{ color: '#F8FAFC' }}>184,200</strong></div>
                      <div>Element Size: <strong style={{ color: '#F8FAFC' }}>4.0 mm Fine Mesh</strong></div>
                    </div>
                  )}
                </div>

                {/* STEP 7: SOLVE */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 7 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={handleSolveCase}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 7 ? 'rgba(0,166,214,0.2)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep > 7 ? '✓' : '○'} 7. Solve</span>
                    <span style={{ fontSize: 10, color: caeState === 'RUNNING' ? '#F59E0B' : '#10B981', fontWeight: 800 }}>
                      {caeState === 'RUNNING' ? '⚡ RUNNING...' : '▶ RUN FEA SOLVER'}
                    </span>
                  </button>
                  {caeStep === 7 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#38BDF8', fontWeight: 700 }}>
                        <span>{solveProgressText}</span>
                      </div>
                      <button
                        onClick={handleSolveCase}
                        style={{ width: '100%', padding: '8px', borderRadius: 6, background: '#00A6D6', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                      >
                        ⚡ RUN FEA SOLVER NOW
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 8: RESULTS */}
                <div style={{ background: '#070B11', borderRadius: 8, border: caeStep === 8 ? '1px solid #00A6D6' : '1px solid #1E293B', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(8); setCaeState('RESULT'); setViewMode('transparent'); }}
                    style={{ width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 8 ? 'rgba(0,166,214,0.2)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{caeStep === 8 ? '●' : '○'} 8. Results</span>
                    <span style={{ fontSize: 10, color: caeStatus === 'PASS' ? '#34D399' : '#FBBF24', fontWeight: 800 }}>
                      {caeStatus} ({activeCae.peakStressMpa.toFixed(0)} MPa)
                    </span>
                  </button>
                  {caeStep === 8 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1E293B', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Peak Stress: <strong style={{ color: '#EF4444' }}>{activeCae.peakStressMpa.toFixed(1)} MPa</strong></div>
                      <div>Max Deflection: <strong style={{ color: '#38BDF8' }}>{activeCae.maxDeflectionMm.toFixed(2)} mm</strong></div>
                      <div>Safety Factor: <strong style={{ color: '#34D399' }}>{activeCae.safetyFactor.toFixed(2)}</strong></div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CAD REVISIONS */}
          {activeTab === 'revisions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
              <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700 }}>CAD DESIGN REVISION COMPARISON</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(DESIGN_REVISIONS).map(([revId, rev]) => (
                  <button
                    key={revId}
                    onClick={() => setCurrentRevision(revId as DesignRevision)}
                    style={{
                      padding: 10, borderRadius: 8, border: currentRevision === revId ? '1px solid #00A6D6' : '1px solid #1E293B',
                      background: currentRevision === revId ? 'rgba(0,166,214,0.15)' : '#070B11',
                      textAlign: 'left', cursor: 'pointer', color: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span style={{ color: '#38BDF8' }}>{rev.label}</span>
                      <span style={{ fontSize: 9, color: rev.releaseStatus === 'APPROVED_FOR_BUILD' ? '#34D399' : '#64748B' }}>{rev.releaseStatus}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Mass: {rev.biwMassKg} kg | Torsion: {rev.torsionalRigidityKnmPerDeg} kNm/deg</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RELEASE GATE */}
          {activeTab === 'release' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
              <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700 }}>ENGINEERING RELEASE CHECKLIST</div>
              <div style={{ background: '#070B11', padding: 10, borderRadius: 8, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Structural Yield Safety Factor &gt; 1.50</span><span style={{ color: '#34D399' }}>✓ PASS</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Max Displacement &lt; 5.0 mm</span><span style={{ color: '#34D399' }}>✓ PASS</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>First Modal Frequency &gt; 25 Hz</span><span style={{ color: '#34D399' }}>✓ PASS</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>100% Weld & Fastener Integrity</span><span style={{ color: '#34D399' }}>✓ PASS</span></div>
              </div>

              <button
                style={{ width: '100%', padding: 10, borderRadius: 8, background: '#059669', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 10 }}
              >
                ✓ APPROVE FOR PHYSICAL BUILD
              </button>
            </div>
          )}

        </div>

        {/* ============================================================
            CENTER COLUMN: 3D VIEWPORT CANVAS (STRICTLY BOUNDED TO REMAINING AREA)
            ============================================================ */}
        <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%', background: '#0B131E', overflow: 'hidden' }}>
          
          {/* VIEW MODE 1: 3D CAD/CAE VEHICLE STRUCTURE */}
          {workspaceMode === 'structure' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', background: '#E9EEF5' }}>
              <VehicleScene />
            </div>
          )}

          {/* VIEW MODE 2: 3D HARDWARE SIMULATION BENCH (ESP32 TWIN) */}
          {workspaceMode === 'hardware' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', background: '#070B11' }}>
              <HardwareBenchScene3D
                telemetry={caeTelemetry}
                viewMode="HARDWARE"
                wires={wires}
                components={components}
                selectedComponent={selectedCompMeta}
                selectedWire={selectedWire}
                onSelectComponent={(comp) => {
                  setSelectedCompMeta(comp);
                  if (comp) setShowInspector(true);
                }}
                onSelectWire={setSelectedWire}
                routingMode={routingMode}
                onToggleRoutingMode={setRoutingMode}
                onAlignWiring={() => setRoutingMode('ALIGNED_ORTHOGONAL')}
                onOpenLockManager={() => setShowValidator(true)}
              />
            </div>
          )}

          {/* VIEW MODE 3: DUAL TWIN (STRUCTURE + HARDWARE SIMULATION SIDE-BY-SIDE) */}
          {workspaceMode === 'dual' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%', background: '#0B131E' }}>
              {/* LEFT HALF: 3D VEHICLE STRUCTURE */}
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRight: '2px solid #1E293B', overflow: 'hidden', background: '#E9EEF5' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(13,23,36,0.92)', padding: '5px 12px', borderRadius: 6, border: '1px solid #00A6D6', fontSize: 11, fontWeight: 700, color: '#38BDF8', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00A6D6' }} />
                  🚗 3D VEHICLE STRUCTURE &amp; CAE STRESS
                </div>
                <VehicleScene />
              </div>

              {/* RIGHT HALF: 3D HARDWARE SIMULATION BENCH */}
              <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#070B11' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(13,23,36,0.92)', padding: '5px 12px', borderRadius: 6, border: '1px solid #00A6D6', fontSize: 11, fontWeight: 700, color: '#38BDF8', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                  🔬 3D HARDWARE SIMULATION BENCH (ESP32 TWIN)
                </div>
                <HardwareBenchScene3D
                  telemetry={caeTelemetry}
                  viewMode="HARDWARE"
                  wires={wires}
                  components={components}
                  selectedComponent={selectedCompMeta}
                  selectedWire={selectedWire}
                  onSelectComponent={(comp) => {
                    setSelectedCompMeta(comp);
                    if (comp) setShowInspector(true);
                  }}
                  onSelectWire={setSelectedWire}
                  routingMode={routingMode}
                  onToggleRoutingMode={setRoutingMode}
                  onAlignWiring={() => setRoutingMode('ALIGNED_ORTHOGONAL')}
                  onOpenLockManager={() => setShowValidator(true)}
                />
              </div>
            </div>
          )}

          {/* ANSYS-STYLE VERTICAL CONTOUR LEGEND (SHOWN WHEN STEP 8 RESULTS IS ACTIVE) */}
          {caeStep === 8 && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 10,
                background: 'rgba(13,23,36,0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,166,214,0.4)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontSize: 10,
                fontFamily: 'var(--mono)',
                color: '#FFFFFF',
                width: 140,
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: 11, borderBottom: '1px solid #1E293B', paddingBottom: 4 }}>
                Equivalent Stress
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', marginBottom: 4 }}>Von Mises [MPa]</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div
                  style={{
                    width: 14,
                    height: 130,
                    borderRadius: 3,
                    background: 'linear-gradient(to bottom, #EF4444 0%, #F97316 20%, #EAB308 40%, #10B981 60%, #06B6D4 80%, #3B82F6 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 130, fontSize: 9.5, fontWeight: 700 }}>
                  <span style={{ color: '#EF4444' }}>{activeCae.peakStressMpa.toFixed(0)} MAX</span>
                  <span style={{ color: '#F97316' }}>{(activeCae.peakStressMpa * 0.8).toFixed(0)}</span>
                  <span style={{ color: '#EAB308' }}>{(activeCae.peakStressMpa * 0.6).toFixed(0)}</span>
                  <span style={{ color: '#10B981' }}>{(activeCae.peakStressMpa * 0.4).toFixed(0)}</span>
                  <span style={{ color: '#06B6D4' }}>{(activeCae.peakStressMpa * 0.2).toFixed(0)}</span>
                  <span style={{ color: '#3B82F6' }}>0 MIN</span>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM CENTER: VIEWPORT CONTROLS */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'rgba(13,23,36,0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: 8,
              border: '1px solid rgba(0,166,214,0.4)',
              color: '#FFFFFF',
              fontSize: 11,
              fontFamily: 'var(--mono)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ color: '#94A3B8', fontWeight: 700 }}>RESULT:</span>
            <select
              value={caeMetric}
              onChange={(e) => setCaeMetric(e.target.value as any)}
              style={{ background: '#0F172A', color: '#38BDF8', border: '1px solid #1E293B', padding: '3px 8px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
            >
              <option value="vonMises">Von Mises Stress (MPa)</option>
              <option value="displacement">Deformation (mm)</option>
              <option value="safetyFactor">Safety Factor (FOS)</option>
            </select>

            <span style={{ color: '#94A3B8', fontWeight: 700, marginLeft: 6 }}>DEFORMATION:</span>
            {([1, 5, 10] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setCaeDeformationScale(scale)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: caeDeformationScale === scale ? '#00A6D6' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: caeDeformationScale === scale ? '1px solid #38BDF8' : '1px solid transparent',
                }}
              >
                {scale === 1 ? '1× True' : `${scale}×`}
              </button>
            ))}

            <span style={{ color: '#94A3B8', fontWeight: 700, marginLeft: 6 }}>PROBE:</span>
            <button
              onClick={() => setCaeProbeActive(!caeProbeActive)}
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                background: caeProbeActive ? '#10B981' : 'rgba(255,255,255,0.08)',
                color: '#FFFFFF',
                border: caeProbeActive ? '1px solid #34D399' : '1px solid transparent',
              }}
            >
              {caeProbeActive ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* BOTTOM RIGHT: SHELL OPACITY SLIDER */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'rgba(13,23,36,0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: 8,
              border: '1px solid #1E293B',
              color: '#FFFFFF',
              fontSize: 11,
              fontFamily: 'var(--mono)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ color: '#94A3B8' }}>OPACITY:</span>
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

        {/* ============================================================
            RIGHT COLUMN: RESULT SUMMARY PANEL (280px) (ONLY WHEN STEP 8 RESULTS IS ACTIVE)
            ============================================================ */}
        {activeTab === 'cae' && caeStep === 8 && (
          <div
            style={{
              width: 280,
              background: '#0D1724',
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
              <span style={{ fontWeight: 800, fontSize: 12, color: '#38BDF8' }}>RESULT SUMMARY</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: caeStatus === 'PASS' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: caeStatus === 'PASS' ? '#34D399' : '#FBBF24',
                  border: caeStatus === 'PASS' ? '1px solid #10B981' : '1px solid #F59E0B',
                }}
              >
                {caeStatus}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>PEAK VON MISES STRESS</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>
                  {activeCae.peakStressMpa.toFixed(1)} <span style={{ fontSize: 11, color: '#94A3B8' }}>MPa</span>
                </div>
                <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1 }}>Allowable: {activeCae.yieldLimitMpa} MPa</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>MAXIMUM DEFORMATION</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8', marginTop: 2 }}>
                  {activeCae.maxDeflectionMm.toFixed(2)} <span style={{ fontSize: 11, color: '#94A3B8' }}>mm</span>
                </div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>FACTOR OF SAFETY (FOS)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: activeCae.safetyFactor >= 1.5 ? '#34D399' : '#FBBF24', marginTop: 2 }}>
                  {activeCae.safetyFactor.toFixed(2)}
                </div>
                <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1 }}>Target Min: 1.50</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>STRUCTURAL UTILIZATION</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8', marginTop: 2 }}>
                  {((activeCae.peakStressMpa / activeCae.yieldLimitMpa) * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>CRITICAL REGION</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>
                  {activeCae.criticalRegion}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* SIMULATION MODALS */}
      {showInspector && selectedCompMeta && (
        <ComponentInspectorModal
          component={selectedCompMeta}
          telemetry={caeTelemetry}
          onClose={() => {
            setShowInspector(false);
            setSelectedCompMeta(null);
          }}
        />
      )}

      {showValidator && (
        <ComponentLockValidationPanel
          components={components}
          wires={wires}
          lockedComponents={{
            'breadboard': true,
            'esp32-c3': true,
            'hx711': true,
            'load-cell-1': true,
            'load-cell-2': true,
            'load-cell-3': true,
            'load-cell-4': true,
            'load-cell-combiner': true,
            'mpu6050': true,
            'sw420': true,
            'ds18b20': true,
            'l298n': true,
            'coin-motor': true,
            'buzzer': true,
            'traffic-leds': true,
          }}
          onToggleLock={() => {}}
          onLockAll={() => {}}
          onUnlockAll={() => {}}
          routingMode={routingMode}
          onToggleRoutingMode={setRoutingMode}
          onFocusComponent={(compId) => {
            const comp = components.find((c) => c.id === compId);
            if (comp) {
              setSelectedCompMeta(comp);
              setShowInspector(true);
            }
          }}
          onClose={() => setShowValidator(false)}
        />
      )}
    </div>
  );
}
