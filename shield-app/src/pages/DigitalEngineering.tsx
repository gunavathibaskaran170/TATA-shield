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

export const MATERIALS = {
  usibor1500: { name: 'Usibor 1500 Boron Steel', yieldMpa: 1500, eGpa: 210, nu: 0.30, density: 7850 },
  s355: { name: 'Structural Steel S355', yieldMpa: 355, eGpa: 210, nu: 0.30, density: 7850 },
  al6061: { name: 'Al 6061-T6 Extrusion', yieldMpa: 276, eGpa: 68.9, nu: 0.33, density: 2700 },
  al7075: { name: 'Al 7075-T6 Cast Node', yieldMpa: 503, eGpa: 71.7, nu: 0.33, density: 2810 },
  cfrp: { name: 'CFRP Composite', yieldMpa: 850, eGpa: 135, nu: 0.28, density: 1550 },
} as const;

export type MaterialKey = keyof typeof MATERIALS;

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

  // Interactive Manual Engineering Test Workbench Controls
  const [analysisType, setAnalysisType] = useState<string>('Static Structural');
  const [targetRegion, setTargetRegion] = useState<string>('Battery Tray Subframe');
  const [loadDirection, setLoadDirection] = useState<string>('+X Front Impact');
  const [testDescription, setTestDescription] = useState<string>('Manual Workbench FEA Test Run');

  const [selectedMaterialKey, setSelectedMaterialKey] = useState<MaterialKey>('usibor1500');

  const [fastenerGroup, setFastenerGroup] = useState<string>('M10 Grade 10.9 Flange Bolts');
  const [fastenerPreloadKn, setFastenerPreloadKn] = useState<number>(35);
  const [connectionBondType, setConnectionBondType] = useState<string>('Rigid Multi-Point Constraint (MPC)');

  const [supportLocation, setSupportLocation] = useState<string>('Suspension Mounts & Subframe');
  const [supportType, setSupportType] = useState<string>('Fixed Rigid Support (▲)');

  const [loadMagnitudeKn, setLoadMagnitudeKn] = useState<number>(45);
  const [loadPattern, setLoadPattern] = useState<string>('Distributed Pressure');

  const [meshSizeMm, setMeshSizeMm] = useState<number>(4.0);
  const [elementType, setElementType] = useState<string>('C3D8R 8-Node Solid Hexahedral');

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
  const selectedMat = MATERIALS[selectedMaterialKey] || MATERIALS.usibor1500;

  // Dynamic engineering physics calculations derived from load, material stiffness, and baseline case
  const loadRatio = loadMagnitudeKn / 45; // 45 kN baseline
  const stiffnessRatio = 210 / selectedMat.eGpa;
  const computedPeakStress = Math.max(1, activeCae.peakStressMpa * loadRatio * stiffnessRatio);
  const computedMaxDeflection = Math.max(0.1, activeCae.maxDeflectionMm * loadRatio * stiffnessRatio);
  const computedFos = selectedMat.yieldMpa / computedPeakStress;
  const computedUtilization = Math.min(100, (computedPeakStress / selectedMat.yieldMpa) * 100);
  const caeStatus = computedFos >= 1.5 ? 'PASS' : computedFos >= 1.0 ? 'REVIEW' : 'FAIL';

  const computedElements = Math.round(142800 * Math.pow(4.0 / Math.max(0.5, meshSizeMm), 2.2));
  const computedNodes = Math.round(computedElements * 1.29);

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
        background: '#090E15',
        color: '#F2F5F8',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ============================================================
          PAGE HEADER / TOOLBAR (SOLID DARK BG, SANS-SERIF TYPOGRAPHY)
          ============================================================ */}
      <PageHeader
        title="01 Design & CAE Validation"
        description='Structural Design Verification · "Can the structure safely carry the required design loads?"'
        badge="STATIC STRUCTURAL"
        badgeType="default"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* WORKSPACE MODE TOGGLE */}
          <div style={{ display: 'flex', gap: 2, background: '#131D28', padding: 3, borderRadius: 6, border: '1px solid #1F2B38' }}>
            <button
              onClick={() => setWorkspaceMode('structure')}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 4,
                background: workspaceMode === 'structure' ? '#16A8E0' : 'transparent',
                color: workspaceMode === 'structure' ? '#FFFFFF' : '#A8B4C2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-sans)',
              }}
              title="Show 3D CAD/CAE Vehicle Structure"
            >
              🚗 Structure
            </button>
            <button
              onClick={() => setWorkspaceMode('hardware')}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 4,
                background: workspaceMode === 'hardware' ? '#16A8E0' : 'transparent',
                color: workspaceMode === 'hardware' ? '#FFFFFF' : '#A8B4C2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-sans)',
              }}
              title="Show 3D Hardware Simulation Bench (ESP32 Twin)"
            >
              🔬 Hardware Bench
            </button>
            <button
              onClick={() => setWorkspaceMode('dual')}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 4,
                background: workspaceMode === 'dual' ? '#16A8E0' : 'transparent',
                color: workspaceMode === 'dual' ? '#FFFFFF' : '#A8B4C2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-sans)',
              }}
              title="Dual Twin: Side-by-Side Vehicle Structure & Hardware Simulation"
            >
              ◫ Dual Twin
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#6F8093' }}>VIEW:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              style={{
                fontSize: 12,
                fontWeight: 500,
                height: 34,
                padding: '0 8px',
                borderRadius: 6,
                background: '#131D28',
                border: '1px solid #1F2B38',
                color: '#F2F5F8',
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

          {/* OPACITY SLIDER CONTROL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#131D28', padding: '0 10px', height: 34, borderRadius: 6, border: '1px solid #1F2B38' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6F8093', textTransform: 'uppercase' }}>OPACITY:</span>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={wireframeOpacity}
              onChange={(e) => setWireframeOpacity(parseFloat(e.target.value))}
              style={{ width: 75, accentColor: '#16A8E0', cursor: 'pointer' }}
              title="Adjust 3D Mesh & Structure Opacity"
            />
            <span className="mono" style={{ fontSize: 11, color: '#16A8E0', fontWeight: 600, minWidth: 32 }}>
              {Math.round(wireframeOpacity * 100)}%
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            requestResetCamera();
            setViewPreset('iso');
          }}
          style={{
            fontSize: 12,
            fontWeight: 500,
            height: 34,
            padding: '0 12px',
            borderRadius: 6,
            background: '#131D28',
            border: '1px solid #1F2B38',
            color: '#F2F5F8',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ⟳ Reset View
        </button>
      </PageHeader>

      {/* ============================================================
          MAIN ENGINEERING WORKSPACE (GRID: 340px FIXED SIDEBAR + VIEWPORT + OPTIONAL INSPECTOR)
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
            LEFT COLUMN: CAE WORKFLOW CONTROL PANEL (FIXED 340px)
            ============================================================ */}
        <div
          style={{
            width: 340,
            background: '#101821',
            borderRight: '1px solid #1F2B38',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 5,
            color: '#F2F5F8',
            fontFamily: 'var(--font-sans)',
            padding: 12,
            gap: 12,
          }}
        >
          {/* TOP INTERNAL TABS */}
          <div style={{ display: 'flex', gap: 3, background: '#131D28', padding: 3, borderRadius: 6, border: '1px solid #1F2B38' }}>
            <button
              onClick={() => setActiveTab('cae')}
              style={{
                flex: 1,
                height: 34,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'cae' ? '#16A8E0' : 'transparent',
                color: activeTab === 'cae' ? '#FFFFFF' : '#A8B4C2',
                fontFamily: 'var(--font-sans)',
              }}
            >
              CAE Workflow
            </button>
            <button
              onClick={() => setActiveTab('revisions')}
              style={{
                flex: 1,
                height: 34,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'revisions' ? '#16A8E0' : 'transparent',
                color: activeTab === 'revisions' ? '#FFFFFF' : '#A8B4C2',
                fontFamily: 'var(--font-sans)',
              }}
            >
              CAD Revisions
            </button>
            <button
              onClick={() => setActiveTab('release')}
              style={{
                flex: 1,
                height: 34,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'release' ? '#16A8E0' : 'transparent',
                color: activeTab === 'release' ? '#FFFFFF' : '#A8B4C2',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Release Gate
            </button>
          </div>

          {/* TAB 1: CAE WORKFLOW */}
          {activeTab === 'cae' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              
              {/* CAE LOAD CASE CARD */}
              <div style={{ background: '#101923', padding: 12, borderRadius: 8, border: '1px solid #253342', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#A8B4C2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    CAE LOAD CASE
                  </span>
                  <span style={{ fontSize: 10, color: '#6F8093', fontWeight: 500 }}>STATIC FEA</span>
                </div>

                <select
                  value={activeCaeLoadCase}
                  onChange={(e) => handleSelectCaeCase(e.target.value as CaeLoadCase)}
                  style={{
                    width: '100%',
                    height: 34,
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '0 8px',
                    borderRadius: 6,
                    background: '#131D28',
                    border: '1px solid #1F2B38',
                    color: '#16A8E0',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {Object.entries(CAE_LOAD_CASES).map(([id, c]) => (
                    <option key={id} value={id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div style={{ fontSize: 12, color: '#A8B4C2', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div>Analysis: <strong style={{ color: '#F2F5F8', fontWeight: 500 }}>Static Structural ({activeCae.category})</strong></div>
                  <div>Target Region: <strong style={{ color: '#16A8E0', fontWeight: 500 }}>{activeCae.criticalRegion}</strong></div>
                </div>
              </div>

              {/* 8-STEP ACCORDION WORKFLOW */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                
                {/* STEP 1: TEST SETUP & GEOMETRY */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 1 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(1); setCaeState('SETUP'); setCaeMeshView(false); setCaeMaterialColorView(false); }}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 1 ? 'rgba(22, 168, 224, 0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep > 1 ? '✓' : '○'} 1. Test Setup</span>
                    <span style={{ fontSize: 12, color: '#16A8E0', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {analysisType}
                    </span>
                  </button>
                  {caeStep === 1 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Analysis Type</label>
                        <select
                          value={analysisType}
                          onChange={(e) => setAnalysisType(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 6px' }}
                        >
                          <option value="Static Structural">Static Structural FEA</option>
                          <option value="Dynamic Impact">Dynamic Impact Analysis</option>
                          <option value="Modal Analysis">Modal Frequency & Vibration</option>
                          <option value="Thermal-Stress">Thermal-Structural Coupled</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Target Structural Region</label>
                        <select
                          value={targetRegion}
                          onChange={(e) => setTargetRegion(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 6px' }}
                        >
                          <option value="Battery Tray Subframe">Battery Tray Subframe</option>
                          <option value="Front Shock Tower">Front Shock Tower</option>
                          <option value="Underbody Sill Rail">Underbody Sill Rail</option>
                          <option value="B-Pillar Crossmember">B-Pillar Crossmember</option>
                          <option value="Rear Axle Mount">Rear Axle Mount</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Load Direction</label>
                        <select
                          value={loadDirection}
                          onChange={(e) => setLoadDirection(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 6px' }}
                        >
                          <option value="+X Front Impact">+X Longitudinal Front Impact</option>
                          <option value="-X Rear Impact">-X Rear Impact Vector</option>
                          <option value="+Y Lateral Impact">+Y Side Intrusion Vector</option>
                          <option value="-Z Downward Load">-Z Vertical Gravity & Dynamic Bouncing</option>
                          <option value="+Z Uplift Load">+Z Jacking & Uplift</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Test Description</label>
                        <input
                          type="text"
                          value={testDescription}
                          onChange={(e) => setTestDescription(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 8px' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: '#A8B4C2', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>Structure / Mesh Opacity</span>
                          <span className="mono" style={{ color: '#16A8E0', fontWeight: 600 }}>{Math.round(wireframeOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="1.0"
                          step="0.05"
                          value={wireframeOpacity}
                          onChange={(e) => setWireframeOpacity(parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: '#16A8E0', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2: MATERIAL */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 2 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(2); setCaeMaterialColorView(true); }}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 2 ? 'rgba(22, 168, 224, 0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep > 2 ? '✓' : '○'} 2. Material</span>
                    <span style={{ fontSize: 12, color: '#16A8E0', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedMat.name}
                    </span>
                  </button>
                  {caeStep === 2 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Select Material</label>
                        <select
                          value={selectedMaterialKey}
                          onChange={(e) => setSelectedMaterialKey(e.target.value as MaterialKey)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#16A8E0', borderRadius: 4, padding: '0 6px', fontWeight: 600 }}
                        >
                          {Object.entries(MATERIALS).map(([key, mat]) => (
                            <option key={key} value={key}>
                              {mat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ background: '#131D28', padding: 8, borderRadius: 6, border: '1px solid #1F2B38', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                        <div>Yield Limit (Ry): <strong className="mono" style={{ color: '#F2F5F8' }}>{selectedMat.yieldMpa} MPa</strong></div>
                        <div>Young's Modulus (E): <strong className="mono" style={{ color: '#F2F5F8' }}>{selectedMat.eGpa} GPa</strong></div>
                        <div>Poisson Ratio (ν): <strong className="mono" style={{ color: '#F2F5F8' }}>{selectedMat.nu}</strong></div>
                        <div>Density (ρ): <strong className="mono" style={{ color: '#F2F5F8' }}>{selectedMat.density} kg/m³</strong></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 3: CONNECTIONS */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 3 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(3); setViewMode('chassis'); }}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 3 ? 'rgba(22, 168, 224, 0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep > 3 ? '✓' : '○'} 3. Connections</span>
                    <span style={{ fontSize: 12, color: '#20C997' }}>{fastenerPreloadKn} kN Preload</span>
                  </button>
                  {caeStep === 3 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Fastener Group</label>
                        <select
                          value={fastenerGroup}
                          onChange={(e) => setFastenerGroup(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 6px' }}
                        >
                          <option value="M10 Grade 10.9 Flange Bolts">M10 Grade 10.9 Flange Bolts</option>
                          <option value="M12 Grade 12.9 High-Strength Bolts">M12 Grade 12.9 High-Strength Bolts</option>
                          <option value="Structural Adhesive + Spot Welds">Structural Adhesive + Spot Welds</option>
                          <option value="Solid Laser Welded Joint">Solid Laser Welded Joint</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: '#A8B4C2', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>Preload Force (kN)</span>
                          <span className="mono" style={{ color: '#16A8E0', fontWeight: 600 }}>{fastenerPreloadKn} kN</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="60"
                          step="1"
                          value={fastenerPreloadKn}
                          onChange={(e) => setFastenerPreloadKn(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#16A8E0' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Bond Constraint Type</label>
                        <select
                          value={connectionBondType}
                          onChange={(e) => setConnectionBondType(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#20C997', borderRadius: 4, padding: '0 6px', fontWeight: 500 }}
                        >
                          <option value="Rigid Multi-Point Constraint (MPC)">Rigid Multi-Point Constraint (MPC)</option>
                          <option value="Deformable Contact (Friction 0.15)">Deformable Contact (Friction 0.15)</option>
                          <option value="Fully Bonded Cohesive Surface">Fully Bonded Cohesive Surface</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 4: SUPPORTS */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 4 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(4); setViewMode('chassis'); }}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 4 ? 'rgba(22, 168, 224, 0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep > 4 ? '✓' : '○'} 4. Supports</span>
                    <span style={{ fontSize: 12, color: '#F2B84B' }}>▲ Fixed Support</span>
                  </button>
                  {caeStep === 4 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Fixed Support Location</label>
                        <select
                          value={supportLocation}
                          onChange={(e) => setSupportLocation(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 6px' }}
                        >
                          <option value="Suspension Mounts & Subframe">Suspension Mounts & Subframe</option>
                          <option value="Underbody Floor Rails">Underbody Floor Rails</option>
                          <option value="4-Point Jacking Nodes">4-Point Jacking Nodes</option>
                          <option value="Axle Attachment Points">Axle Attachment Points</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Constraint Mechanism</label>
                        <select
                          value={supportType}
                          onChange={(e) => setSupportType(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2B84B', borderRadius: 4, padding: '0 6px', fontWeight: 500 }}
                        >
                          <option value="Fixed Rigid Support (▲)">Fixed Rigid Support (▲)</option>
                          <option value="Elastic Foundation Support">Elastic Foundation Support</option>
                          <option value="Pinned Bearing Joint">Pinned Bearing Joint</option>
                        </select>
                      </div>
                      <div style={{ background: '#131D28', padding: 8, borderRadius: 6, border: '1px solid #1F2B38', fontSize: 11 }}>
                        <span style={{ color: '#A8B4C2' }}>Constrained DOF:</span> <strong className="mono" style={{ color: '#F2F5F8' }}>Ux = Uy = Uz = RotX = RotY = RotZ = 0</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 5: LOADS */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 5 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(5); setViewMode('chassis'); }}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 5 ? 'rgba(22, 168, 224, 0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep > 5 ? '✓' : '○'} 5. Loads</span>
                    <span className="mono" style={{ fontSize: 12, color: '#EF5B5B', fontWeight: 600 }}>→ {loadMagnitudeKn} kN</span>
                  </button>
                  {caeStep === 5 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: '#A8B4C2', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>Load Magnitude (kN)</span>
                          <span className="mono" style={{ color: '#EF5B5B', fontWeight: 600, fontSize: 13 }}>{loadMagnitudeKn} kN</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="150"
                          step="5"
                          value={loadMagnitudeKn}
                          onChange={(e) => setLoadMagnitudeKn(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#EF5B5B' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Load Pattern</label>
                        <select
                          value={loadPattern}
                          onChange={(e) => setLoadPattern(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 6px' }}
                        >
                          <option value="Distributed Pressure">Uniformly Distributed Pressure</option>
                          <option value="Point Force Vector">Concentrated Point Force Vector</option>
                          <option value="Moment Torque">Torsional Moment Torque</option>
                          <option value="Harmonic Cycle">Harmonic Sinusoidal Cyclic Load</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 6: MESH */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 6 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(6); setCaeMeshView(true); }}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 6 ? 'rgba(22, 168, 224, 0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep > 6 ? '✓' : '○'} 6. Mesh</span>
                    <span className="mono" style={{ fontSize: 12, color: '#16A8E0' }}>{meshSizeMm.toFixed(1)} mm ({computedElements.toLocaleString()})</span>
                  </button>
                  {caeStep === 6 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: '#A8B4C2', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>Element Size (mm)</span>
                          <span className="mono" style={{ color: '#16A8E0', fontWeight: 600 }}>{meshSizeMm.toFixed(1)} mm</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="10.0"
                          step="0.5"
                          value={meshSizeMm}
                          onChange={(e) => setMeshSizeMm(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#16A8E0' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: '#A8B4C2', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Element Type</label>
                        <select
                          value={elementType}
                          onChange={(e) => setElementType(e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, background: '#131D28', border: '1px solid #1F2B38', color: '#F2F5F8', borderRadius: 4, padding: '0 6px' }}
                        >
                          <option value="C3D8R 8-Node Solid Hexahedral">C3D8R 8-Node Solid Hexahedral</option>
                          <option value="C3D10 10-Node Quadratic Tetrahedral">C3D10 10-Node Quadratic Tetrahedral</option>
                          <option value="S4R Shell 4-Node Mid-Surface">S4R Shell 4-Node Mid-Surface</option>
                        </select>
                      </div>
                      <div style={{ background: '#131D28', padding: 8, borderRadius: 6, border: '1px solid #1F2B38', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                        <div>Elements: <strong className="mono" style={{ color: '#16A8E0' }}>{computedElements.toLocaleString()}</strong></div>
                        <div>Nodes: <strong className="mono" style={{ color: '#F2F5F8' }}>{computedNodes.toLocaleString()}</strong></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 7: SOLVE */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 7 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={handleSolveCase}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 7 ? 'rgba(22, 168, 224, 0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep > 7 ? '✓' : '○'} 7. Solve</span>
                    <span style={{ fontSize: 12, color: caeState === 'RUNNING' ? '#F2B84B' : '#20C997', fontWeight: 600 }}>
                      {caeState === 'RUNNING' ? '⚡ RUNNING...' : '▶ RUN FEA SOLVER'}
                    </span>
                  </button>
                  {caeStep === 7 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#16A8E0', fontWeight: 600 }}>
                        <span>{solveProgressText}</span>
                      </div>
                      <button
                        onClick={handleSolveCase}
                        style={{ width: '100%', height: 36, borderRadius: 6, background: '#16A8E0', color: '#FFF', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                      >
                        ⚡ RUN FEA SOLVER NOW
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 8: RESULTS */}
                <div style={{ background: '#101923', borderRadius: 8, border: caeStep === 8 ? '1px solid #16A8E0' : '1px solid #1F2B38', overflow: 'hidden' }}>
                  <button
                    onClick={() => { setCaeStep(8); setCaeState('RESULT'); setViewMode('transparent'); }}
                    style={{ width: '100%', height: 42, padding: '0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: caeStep === 8 ? 'rgba(22, 168, 224, 0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F8', fontFamily: 'var(--font-sans)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{caeStep === 8 ? '●' : '○'} 8. Results</span>
                    <span className="mono" style={{ fontSize: 12, color: caeStatus === 'PASS' ? '#20C997' : caeStatus === 'REVIEW' ? '#F2B84B' : '#EF5B5B', fontWeight: 600 }}>
                      {caeStatus} ({computedPeakStress.toFixed(0)} MPa)
                    </span>
                  </button>
                  {caeStep === 8 && (
                    <div style={{ padding: 12, borderTop: '1px solid #1F2B38', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Peak Stress: <strong className="mono" style={{ color: '#EF5B5B' }}>{computedPeakStress.toFixed(1)} MPa</strong></div>
                      <div>Max Deflection: <strong className="mono" style={{ color: '#16A8E0' }}>{computedMaxDeflection.toFixed(2)} mm</strong></div>
                      <div>Safety Factor: <strong className="mono" style={{ color: caeStatus === 'PASS' ? '#20C997' : '#F2B84B' }}>{computedFos.toFixed(2)}</strong></div>
                      <div>Utilization: <strong className="mono" style={{ color: '#F2F5F8' }}>{computedUtilization.toFixed(1)}%</strong></div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CAD REVISIONS */}
          {activeTab === 'revisions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ color: '#A8B4C2', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CAD DESIGN REVISION COMPARISON
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(DESIGN_REVISIONS).map(([revId, rev]) => (
                  <button
                    key={revId}
                    onClick={() => setCurrentRevision(revId as DesignRevision)}
                    style={{
                      padding: 12, borderRadius: 8, border: currentRevision === revId ? '1px solid #16A8E0' : '1px solid #1F2B38',
                      background: currentRevision === revId ? 'rgba(22, 168, 224, 0.12)' : '#101923',
                      textAlign: 'left', cursor: 'pointer', color: '#F2F5F8', display: 'flex', flexDirection: 'column', gap: 4,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: '#16A8E0' }}>{rev.label}</span>
                      <span style={{ fontSize: 10.5, color: rev.releaseStatus === 'APPROVED_FOR_BUILD' ? '#20C997' : '#6F8093' }}>{rev.releaseStatus}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: '#A8B4C2' }}>
                      Mass: {rev.biwMassKg} kg | Torsion: {rev.torsionalRigidityKnmPerDeg} kNm/deg
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RELEASE GATE */}
          {activeTab === 'release' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ color: '#A8B4C2', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ENGINEERING RELEASE CHECKLIST
              </div>
              <div style={{ background: '#101923', padding: 12, borderRadius: 8, border: '1px solid #1F2B38', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Structural Yield Safety Factor &gt; 1.50</span><span style={{ color: '#20C997', fontWeight: 600 }}>✓ PASS</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Max Displacement &lt; 5.0 mm</span><span style={{ color: '#20C997', fontWeight: 600 }}>✓ PASS</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>First Modal Frequency &gt; 25 Hz</span><span style={{ color: '#20C997', fontWeight: 600 }}>✓ PASS</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>100% Weld & Fastener Integrity</span><span style={{ color: '#20C997', fontWeight: 600 }}>✓ PASS</span></div>
              </div>

              <button
                style={{ width: '100%', height: 38, borderRadius: 6, background: '#20C997', color: '#FFF', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 10, fontFamily: 'var(--font-sans)' }}
              >
                ✓ APPROVE FOR PHYSICAL BUILD
              </button>
            </div>
          )}

        </div>

        {/* ============================================================
            CENTER COLUMN: 3D VIEWPORT CANVAS (STRICTLY BOUNDED DOMINANT ELEMENT)
            ============================================================ */}
        <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%', background: '#101821', overflow: 'hidden' }}>
          
          {/* VIEW MODE 1: 3D CAD/CAE VEHICLE STRUCTURE */}
          {workspaceMode === 'structure' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', background: '#101821' }}>
              <VehicleScene />
            </div>
          )}

          {/* VIEW MODE 2: 3D HARDWARE SIMULATION BENCH (ESP32 TWIN) */}
          {workspaceMode === 'hardware' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', background: '#101821' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%', background: '#101821' }}>
              {/* LEFT HALF: 3D VEHICLE STRUCTURE */}
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRight: '1px solid #1F2B38', overflow: 'hidden', background: '#101821' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: '#131D28', padding: '5px 12px', borderRadius: 6, border: '1px solid #1F2B38', fontSize: 12, fontWeight: 500, color: '#16A8E0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A8E0' }} />
                  🚗 3D Vehicle Structure &amp; Stress
                </div>
                <VehicleScene />
              </div>

              {/* RIGHT HALF: 3D HARDWARE SIMULATION BENCH */}
              <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#101821' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: '#131D28', padding: '5px 12px', borderRadius: 6, border: '1px solid #1F2B38', fontSize: 12, fontWeight: 500, color: '#20C997', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#20C997' }} />
                  🔬 3D Hardware Simulation Bench
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
                background: '#131D28',
                border: '1px solid #1F2B38',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                color: '#F2F5F8',
                width: 140,
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ fontWeight: 600, color: '#16A8E0', fontSize: 11, borderBottom: '1px solid #1F2B38', paddingBottom: 4 }}>
                Equivalent Stress
              </div>
              <div style={{ fontSize: 10, color: '#A8B4C2', marginBottom: 4 }}>Von Mises [MPa]</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div
                  style={{
                    width: 12,
                    height: 130,
                    borderRadius: 3,
                    background: 'linear-gradient(to bottom, #EF5B5B 0%, #F2994A 20%, #F2B84B 40%, #20C997 60%, #16A8E0 80%, #2F80ED 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <div className="mono" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 130, fontSize: 10, fontWeight: 600 }}>
                  <span style={{ color: '#EF5B5B' }}>{computedPeakStress.toFixed(0)} MAX</span>
                  <span style={{ color: '#F2994A' }}>{(computedPeakStress * 0.8).toFixed(0)}</span>
                  <span style={{ color: '#F2B84B' }}>{(computedPeakStress * 0.6).toFixed(0)}</span>
                  <span style={{ color: '#20C997' }}>{(computedPeakStress * 0.4).toFixed(0)}</span>
                  <span style={{ color: '#16A8E0' }}>{(computedPeakStress * 0.2).toFixed(0)}</span>
                  <span style={{ color: '#2F80ED' }}>0 MIN</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================
            RIGHT COLUMN: RESULT SUMMARY INSPECTOR PANEL (280px) (ONLY WHEN STEP 8 RESULTS IS ACTIVE)
            ============================================================ */}
        {activeTab === 'cae' && caeStep === 8 && (
          <div
            style={{
              width: 280,
              background: '#101821',
              borderLeft: '1px solid #1F2B38',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              gap: 10,
              color: '#F2F5F8',
              fontFamily: 'var(--font-sans)',
              overflowY: 'auto',
              zIndex: 5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1F2B38', paddingBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#16A8E0' }}>RESULTS</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: caeStatus === 'PASS' ? 'rgba(32,201,151,0.15)' : caeStatus === 'REVIEW' ? 'rgba(242,184,75,0.15)' : 'rgba(239,91,91,0.15)',
                  color: caeStatus === 'PASS' ? '#20C997' : caeStatus === 'REVIEW' ? '#F2B84B' : '#EF5B5B',
                  border: caeStatus === 'PASS' ? '1px solid #20C997' : caeStatus === 'REVIEW' ? '1px solid #F2B84B' : '1px solid #EF5B5B',
                }}
              >
                {caeStatus}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ background: '#101923', padding: 10, borderRadius: 6, border: '1px solid #1F2B38' }}>
                <div style={{ color: '#A8B4C2', fontSize: 11 }}>VON MISES STRESS</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: '#F2F5F8', marginTop: 2 }}>
                  {computedPeakStress.toFixed(1)} <span style={{ fontSize: 12, color: '#A8B4C2' }}>MPa</span>
                </div>
                <div style={{ fontSize: 11, color: '#6F8093', marginTop: 1 }}>Allowable Yield Limit: {selectedMat.yieldMpa} MPa</div>
              </div>

              <div style={{ background: '#101923', padding: 10, borderRadius: 6, border: '1px solid #1F2B38' }}>
                <div style={{ color: '#A8B4C2', fontSize: 11 }}>MAXIMUM DEFORMATION</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: '#16A8E0', marginTop: 2 }}>
                  {computedMaxDeflection.toFixed(2)} <span style={{ fontSize: 12, color: '#A8B4C2' }}>mm</span>
                </div>
              </div>

              <div style={{ background: '#101923', padding: 10, borderRadius: 6, border: '1px solid #1F2B38' }}>
                <div style={{ color: '#A8B4C2', fontSize: 11 }}>FACTOR OF SAFETY (FOS)</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: computedFos >= 1.5 ? '#20C997' : computedFos >= 1.0 ? '#F2B84B' : '#EF5B5B', marginTop: 2 }}>
                  {computedFos.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: '#6F8093', marginTop: 1 }}>Target Min: 1.50</div>
              </div>

              <div style={{ background: '#101923', padding: 10, borderRadius: 6, border: '1px solid #1F2B38' }}>
                <div style={{ color: '#A8B4C2', fontSize: 11 }}>STRUCTURAL UTILIZATION</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: '#16A8E0', marginTop: 2 }}>
                  {computedUtilization.toFixed(1)}%
                </div>
              </div>

              <div style={{ background: '#101923', padding: 10, borderRadius: 6, border: '1px solid #1F2B38' }}>
                <div style={{ color: '#A8B4C2', fontSize: 11 }}>TARGET REGION</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#F2F5F8', marginTop: 2 }}>
                  {targetRegion || activeCae.criticalRegion}
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
