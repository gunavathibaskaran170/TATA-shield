/* ============================================================
   SHIELD — MANUAL ENGINEERING WORKBENCH
   Central manual interaction workspace:
   - Manual Component & Point Picking
   - 3D Load Application with Dynamic Force Vector Gizmo
   - Real-Time Calculated Stress & Strain Physics Engine
   - Apply / Hold / Release / Reset Experiment Execution
   - Before / During / After Phase Synchronization
   - Human-in-the-Loop Engineering Review & Test Run Ledger
   ============================================================ */

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { MANUAL_LOAD_POINTS, type RevisionDef } from '../data/engineering';
import { CATALOG_BY_ID } from '../data/catalog';
import { SENSORS, SENSOR_BY_ID } from '../data/sensors';
import { SENSOR_REGION_COMPONENTS } from '../dataflow/engine';
import { Card, Stat, StatusChip, ProvTag } from '../ui/kit';
import type { ManualLoadType, ManualLoadState, ManualTestPhase, EngineeringTestRun, HealthState } from '../schema/types';

export function EngineeringWorkbench() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const clearSelection = useStore((s) => s.clearSelection);
  const setViewMode = useStore((s) => s.setViewMode);
  const setCadView = useStore((s) => s.setCadView);
  const xray = useStore((s) => s.xray);
  const setXray = useStore((s) => s.setXray);
  const wireframe = useStore((s) => s.wireframe);
  const setWireframe = useStore((s) => s.setWireframe);
  const vehicleId = useStore((s) => s.vehicleId);

  // Workbench State from store
  const manualSelectedLoadPointId = useStore((s) => s.manualSelectedLoadPointId);
  const setManualSelectedLoadPointId = useStore((s) => s.setManualSelectedLoadPointId);
  const manualAppliedForceN = useStore((s) => s.manualAppliedForceN);
  const setManualAppliedForceN = useStore((s) => s.setManualAppliedForceN);
  const manualLoadType = useStore((s) => s.manualLoadType);
  const setManualLoadType = useStore((s) => s.setManualLoadType);
  const manualLoadVector = useStore((s) => s.manualLoadVector);
  const setManualLoadVector = useStore((s) => s.setManualLoadVector);
  const manualLoadState = useStore((s) => s.manualLoadState);
  const setManualLoadState = useStore((s) => s.setManualLoadState);
  const manualLoadDurationS = useStore((s) => s.manualLoadDurationS);
  const setManualLoadDurationS = useStore((s) => s.setManualLoadDurationS);
  const manualLoadRamp = useStore((s) => s.manualLoadRamp);
  const setManualLoadRamp = useStore((s) => s.setManualLoadRamp);
  const manualDeformationScale = useStore((s) => s.manualDeformationScale);
  const setManualDeformationScale = useStore((s) => s.setManualDeformationScale);
  const manualTemperatureC = useStore((s) => s.manualTemperatureC);
  const setManualTemperatureC = useStore((s) => s.setManualTemperatureC);
  const manualMaterialE = useStore((s) => s.manualMaterialE);
  const setManualMaterialE = useStore((s) => s.setManualMaterialE);
  const manualTestPhase = useStore((s) => s.manualTestPhase);
  const setManualTestPhase = useStore((s) => s.setManualTestPhase);
  const manualRecordedRuns = useStore((s) => s.manualRecordedRuns);
  const saveManualTestRun = useStore((s) => s.saveManualTestRun);
  const resetManualInputs = useStore((s) => s.resetManualInputs);
  const returnToBaseline = useStore((s) => s.returnToBaseline);

  const [activeTab, setActiveTab] = useState<'load_lab' | 'strain_lab' | 'runs' | 'review'>('load_lab');
  const [engineerDecision, setEngineerDecision] = useState<'CONFIRM' | 'OVERRIDE' | 'RETEST_REQUIRED' | 'INCONCLUSIVE'>('CONFIRM');
  const [reviewNote, setReviewNote] = useState<string>('Elastic linearity verified under normal operating envelope.');

  // Current active load point
  const activePoint = MANUAL_LOAD_POINTS.find((p) => p.id === manualSelectedLoadPointId) ?? MANUAL_LOAD_POINTS[0];
  const activeComp = CATALOG_BY_ID[activePoint.componentId];

  // Associated sensor for this load point
  const linkedSensor = SENSORS.find((s) => s.componentId === activePoint.componentId) ?? SENSORS[0];

  // --------------------------------------------------------------------------
  // PHYSICS & CALCULATED STRESS / STRAIN FORMULAS
  // --------------------------------------------------------------------------
  const baseStrain = linkedSensor.baseline; // e.g. 452 με or 205 με
  const forceFraction = manualAppliedForceN / activePoint.maxForceN;

  // Thermal expansion / sensitivity factor (0.12% per °C above 25°C standard)
  const thermalFactor = 1 + (manualTemperatureC - 25.0) * 0.0012;

  // Phase Multiplier (Before: 0, During: 1, After: recovery or residual)
  const phaseK = manualTestPhase === 'BEFORE' ? 0 : manualTestPhase === 'DURING' ? 1 : 0.08 * Math.pow(forceFraction, 2);

  // Live Microstrain (με)
  const dynamicStrainDelta = (manualAppliedForceN / (activePoint.kStiffnessNPerMm / 100)) * thermalFactor * phaseK;
  const liveMicrostrain = Math.round(baseStrain + dynamicStrainDelta);

  // CALCULATED Stress (MPa) = Young's Modulus E (GPa) * Strain (με) * 10^-3
  const calculatedStressMpa = Number(((manualMaterialE * 1000 * liveMicrostrain * 1e-6)).toFixed(1));

  // Local Deflection / Displacement (mm)
  const localDisplacementMm = Number(((manualAppliedForceN / activePoint.kStiffnessNPerMm) * phaseK * (manualDeformationScale / 10)).toFixed(2));

  // Residual offset
  const residualOffsetMicrostrain = manualTestPhase === 'AFTER' ? Math.round(dynamicStrainDelta) : 0;
  const healthOutcome: HealthState = residualOffsetMicrostrain > 35 ? 'INSPECTION_REQUIRED' : residualOffsetMicrostrain > 12 ? 'WATCH' : 'NORMAL';

  // --------------------------------------------------------------------------
  // ACTION HANDLERS
  // --------------------------------------------------------------------------
  const handleApply = () => {
    setManualLoadState('APPLYING');
    setManualTestPhase('DURING');
    setTimeout(() => {
      setManualLoadState('HOLDING');
    }, 400);
  };

  const handleHold = () => {
    setManualLoadState('HOLDING');
    setManualTestPhase('DURING');
  };

  const handleRelease = () => {
    setManualLoadState('RELEASING');
    setManualTestPhase('AFTER');
    setTimeout(() => {
      setManualLoadState('IDLE');
    }, 400);
  };

  const handleSaveRun = () => {
    const newRun: EngineeringTestRun = {
      id: `TR-02${40 + manualRecordedRuns.length + 1}`,
      timestamp: new Date().toLocaleString('en-IN', { hour12: false }),
      title: `Manual ${(manualAppliedForceN / 1000).toFixed(1)} kN ${manualLoadType} on ${activePoint.label.split('(')[0]}`,
      componentId: activePoint.componentId,
      loadType: manualLoadType,
      loadN: manualAppliedForceN,
      dir: manualLoadVector,
      tempC: manualTemperatureC,
      strainBefore: baseStrain,
      strainPeak: Math.round(baseStrain + (manualAppliedForceN / (activePoint.kStiffnessNPerMm / 100)) * thermalFactor),
      strainAfter: baseStrain + residualOffsetMicrostrain,
      calculatedStressMpa,
      displacementMm: localDisplacementMm,
      residualMicrostrain: residualOffsetMicrostrain,
      outcome: healthOutcome,
      engineerDecision,
      reviewNote,
    };
    saveManualTestRun(newRun);
    setActiveTab('runs');
  };

  return (
    <div className="engineering-workbench-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 3D Scene Viewport */}
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
              background: 'linear-gradient(135deg, #d97706, #78350f)',
              border: '1px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fef3c7',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            WB
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', color: '#f8fafc' }}>
                MANUAL ENGINEERING WORKBENCH · INTERACTIVE VALIDATION
              </span>
              <span className="prov prov-sim">PHYSICS LAB MODE</span>
              <span className="prov prov-verified">HUMAN-IN-THE-LOOP</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Manual Load Application · Real-Time Vector Gizmo · Calculated Stress Contours · Residual Evaluation
            </div>
          </div>
        </div>

        {/* Phase Step Navigation (Before -> During -> After) */}
        <div className="row" style={{ background: 'rgba(0,0,0,0.4)', padding: 3, borderRadius: 6, border: '1px solid var(--line)', gap: 4 }}>
          <span className="tiny faint" style={{ padding: '0 4px', textTransform: 'uppercase' }}>Phase:</span>
          {(['BEFORE', 'DURING', 'AFTER'] as ManualTestPhase[]).map((phase) => {
            const active = manualTestPhase === phase;
            return (
              <button
                key={phase}
                className={`btn tiny ${active ? 'active' : ''}`}
                onClick={() => setManualTestPhase(phase)}
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  fontWeight: active ? 700 : 500,
                  background: active ? '#d97706' : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                  borderColor: active ? '#f59e0b' : 'transparent',
                }}
              >
                {phase === 'BEFORE' ? '1. BEFORE (Baseline)' : phase === 'DURING' ? '2. DURING (Peak Load)' : '3. AFTER (Recovery)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Left Panel — Manual Experiment Controls */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 14,
          bottom: 14,
          width: 420,
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
            background: 'rgba(12, 16, 21, 0.90)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Main Sub Tabs */}
          <div className="row" style={{ background: 'var(--bg2)', padding: 3, borderRadius: 6, gap: 4 }}>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'load_lab' ? '#d97706' : 'transparent',
                color: activeTab === 'load_lab' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('load_lab')}
            >
              Load Controls
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'strain_lab' ? '#d97706' : 'transparent',
                color: activeTab === 'strain_lab' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('strain_lab')}
            >
              Stress / Strain Lab
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'runs' ? '#d97706' : 'transparent',
                color: activeTab === 'runs' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('runs')}
            >
              Recorded Runs ({manualRecordedRuns.length})
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'review' ? '#d97706' : 'transparent',
                color: activeTab === 'review' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('review')}
            >
              Decision Review
            </button>
          </div>

          {/* TAB 1: MANUAL LOAD CONTROLS */}
          {activeTab === 'load_lab' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10, paddingRight: 4 }}>
              {/* Load Point Selector */}
              <div>
                <div className="spread">
                  <span className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    1. Select Application Hardpoint
                  </span>
                  <span className="tiny mono" style={{ color: '#f59e0b' }}>{activePoint.region}</span>
                </div>
                <select
                  value={activePoint.id}
                  onChange={(e) => {
                    setManualSelectedLoadPointId(e.target.value);
                    const pt = MANUAL_LOAD_POINTS.find((p) => p.id === e.target.value);
                    if (pt) select(pt.componentId);
                  }}
                  style={{ width: '100%', marginTop: 4, fontSize: 11.5 }}
                >
                  {MANUAL_LOAD_POINTS.map((lp) => (
                    <option key={lp.id} value={lp.id}>
                      {lp.label} — [{lp.region}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Load Type & Direction Vectors */}
              <div>
                <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  2. Load Type & Vector Direction
                </div>
                <div className="grid3" style={{ gap: 4 }}>
                  {(['vertical', 'longitudinal', 'lateral', 'torsional', 'point', 'cyclic'] as ManualLoadType[]).map((t) => (
                    <button
                      key={t}
                      className={`btn tiny ${manualLoadType === t ? 'active' : ''}`}
                      onClick={() => {
                        setManualLoadType(t);
                        if (t === 'vertical') setManualLoadVector([0, -1, 0]);
                        if (t === 'longitudinal') setManualLoadVector([0, 0, 1]);
                        if (t === 'lateral') setManualLoadVector([1, 0, 0]);
                        if (t === 'torsional') setManualLoadVector([0.7, -0.7, 0]);
                      }}
                      style={{ textTransform: 'capitalize', fontSize: 10.5 }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Direction Preset Quick Buttons */}
                <div className="row" style={{ marginTop: 6, gap: 4 }}>
                  <span className="tiny faint" style={{ width: 60 }}>Vector:</span>
                  <button className="btn tiny" onClick={() => setManualLoadVector([0, -1, 0])} title="Downward Vertical (-Y)">-Y (Down)</button>
                  <button className="btn tiny" onClick={() => setManualLoadVector([0, 1, 0])} title="Upward Jounce (+Y)">+Y (Up)</button>
                  <button className="btn tiny" onClick={() => setManualLoadVector([0, 0, 1])} title="Longitudinal (+Z)">+Z (Fore)</button>
                  <button className="btn tiny" onClick={() => setManualLoadVector([1, 0, 0])} title="Lateral (+X)">+X (Lat)</button>
                </div>
              </div>

              {/* Force Magnitude Slider */}
              <div className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
                <div className="spread">
                  <span className="small" style={{ fontWeight: 700, color: '#f59e0b' }}>Applied Force Magnitude</span>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: '#f87171' }}>
                    {(manualAppliedForceN / 1000).toFixed(1)} kN ({manualAppliedForceN.toLocaleString()} N)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={activePoint.maxForceN}
                  step="500"
                  value={manualAppliedForceN}
                  onChange={(e) => setManualAppliedForceN(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: 6 }}
                />
                <div className="spread tiny faint" style={{ marginTop: 2 }}>
                  <span>0 kN (Rest)</span>
                  <span>Limit: {(activePoint.maxForceN / 1000).toFixed(0)} kN</span>
                </div>
              </div>

              {/* Action Buttons: APPLY / HOLD / RELEASE / RESET */}
              <div className="col" style={{ gap: 6 }}>
                <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  3. Execution Controls
                </div>
                <div className="grid2" style={{ gap: 6 }}>
                  <button
                    className="btn"
                    onClick={handleApply}
                    style={{ background: '#d97706', color: '#fff', fontWeight: 700, border: 'none', padding: '9px 12px' }}
                  >
                    ▶ APPLY LOAD
                  </button>
                  <button
                    className={`btn ${manualLoadState === 'HOLDING' ? 'active' : ''}`}
                    onClick={handleHold}
                    style={{ fontWeight: 700, padding: '9px 12px' }}
                  >
                    ⏸ HOLD LOAD
                  </button>
                  <button
                    className="btn"
                    onClick={handleRelease}
                    style={{ background: '#374151', color: '#fff', fontWeight: 700, border: 'none', padding: '9px 12px' }}
                  >
                    ⏹ RELEASE LOAD
                  </button>
                  <button
                    className="btn"
                    onClick={resetManualInputs}
                    style={{ fontWeight: 600, padding: '9px 12px' }}
                  >
                    ↺ RESET INPUTS
                  </button>
                </div>
              </div>

              {/* Temperature & Material Parameters */}
              <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}>
                <div className="spread">
                  <span className="tiny faint">Environmental Temp: {manualTemperatureC.toFixed(1)} °C</span>
                  <span className="tiny faint">Modulus E: {manualMaterialE} GPa</span>
                </div>
                <div className="grid2" style={{ marginTop: 4, gap: 6 }}>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={manualTemperatureC}
                    onChange={(e) => setManualTemperatureC(parseFloat(e.target.value))}
                  />
                  <select
                    value={manualMaterialE}
                    onChange={(e) => setManualMaterialE(parseFloat(e.target.value))}
                    style={{ fontSize: 11 }}
                  >
                    <option value={210}>Boron Steel (210 GPa)</option>
                    <option value={70}>Structural Al (70 GPa)</option>
                    <option value={45}>CFRP Composite (45 GPa)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRESS / STRAIN LAB */}
          {activeTab === 'strain_lab' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              {/* Prominent Calculated Stress Banner */}
              <div
                style={{
                  padding: 10,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.12))',
                  border: '1px solid rgba(239,68,68,0.4)',
                }}
              >
                <div className="spread">
                  <span className="small" style={{ fontWeight: 800, color: '#f87171' }}>CALCULATED STRESS</span>
                  <span className="prov prov-derived">DERIVED (E · ε)</span>
                </div>
                <div className="spread" style={{ marginTop: 6, alignItems: 'baseline' }}>
                  <span className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                    {calculatedStressMpa} <span style={{ fontSize: 14, color: 'var(--muted)' }}>MPa</span>
                  </span>
                  <span className="tiny faint">Yield Limit: 480 MPa</span>
                </div>
                <div className="tiny faint" style={{ marginTop: 2 }}>
                  *Notice: Stress is CALCULATED using material constitutive matrix, not directly measured raw sensor data.
                </div>
              </div>

              {/* Strain Response Cards */}
              <div className="grid2" style={{ gap: 6 }}>
                <Stat label="Live Strain" value={`${liveMicrostrain} με`} sub="S01/S05 Station" accent="var(--cyan)" />
                <Stat label="Baseline EOL" value={`${baseStrain} με`} sub="Baseline B Fingerprint" />
                <Stat label="Displacement" value={`${localDisplacementMm} mm`} sub={`Scaled ${manualDeformationScale}x`} accent="var(--amber)" />
                <Stat label="Residual Offset" value={`${residualOffsetMicrostrain} με`} sub={residualOffsetMicrostrain > 15 ? 'WATCH State' : 'Elastic Recovery'} accent={residualOffsetMicrostrain > 15 ? 'var(--amber)' : 'var(--green)'} />
              </div>

              {/* Visual Deformation Scaler */}
              <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div className="spread">
                  <span className="tiny faint">Visual Deformation Multiplier:</span>
                  <span className="mono tiny" style={{ fontWeight: 700, color: '#f59e0b' }}>{manualDeformationScale}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={manualDeformationScale}
                  onChange={(e) => setManualDeformationScale(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </div>

              {/* Sensor Linkage Info */}
              <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div className="tiny" style={{ fontWeight: 600, color: 'var(--cyan)' }}>Primary Telemetry Sensor:</div>
                <div className="small mono" style={{ marginTop: 2 }}>{linkedSensor.id} — {linkedSensor.name}</div>
                <div className="tiny faint" style={{ marginTop: 1 }}>Location: {linkedSensor.componentId} ({linkedSensor.region})</div>
              </div>

              <button
                className="btn"
                onClick={handleSaveRun}
                style={{ background: '#059669', color: '#fff', fontWeight: 700, border: 'none', padding: '8px 10px' }}
              >
                💾 Save as Test Run ({manualRecordedRuns.length + 1})
              </button>
            </div>
          )}

          {/* TAB 3: RECORDED RUNS LEDGER */}
          {activeTab === 'runs' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 6 }}>
              <div className="spread">
                <span className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Manual Engineering Test Runs
                </span>
                <span className="tiny mono faint">{manualRecordedRuns.length} Runs</span>
              </div>

              {manualRecordedRuns.map((run) => (
                <div key={run.id} className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
                  <div className="spread">
                    <span className="mono small" style={{ fontWeight: 700, color: '#f59e0b' }}>{run.id}</span>
                    <StatusChip state={run.outcome} />
                  </div>
                  <div className="small" style={{ fontWeight: 600, marginTop: 2 }}>{run.title}</div>
                  <div className="spread" style={{ marginTop: 4, fontSize: 11 }}>
                    <span className="mono faint">F: {(run.loadN / 1000).toFixed(1)} kN</span>
                    <span className="mono" style={{ color: '#38bdf8' }}>Peak: {run.strainPeak} με</span>
                    <span className="mono" style={{ color: run.residualMicrostrain > 15 ? 'var(--amber)' : 'var(--green)' }}>
                      Residual: {run.residualMicrostrain} με
                    </span>
                  </div>
                  {run.reviewNote && (
                    <div className="tiny faint" style={{ marginTop: 4, fontStyle: 'italic', borderTop: '1px solid var(--line)', paddingTop: 4 }}>
                      Review: {run.reviewNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: HUMAN-IN-THE-LOOP REVIEW */}
          {activeTab === 'review' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="spread">
                <span className="small" style={{ fontWeight: 700, color: '#f59e0b' }}>Engineer Decision Review</span>
                <span className="prov prov-verified">HUMAN-IN-THE-LOOP</span>
              </div>
              <div className="tiny faint">Automotive engineers maintain sovereign decision authority over model estimates.</div>

              <div className="col" style={{ gap: 6 }}>
                <div>
                  <span className="tiny faint">Reviewer Action:</span>
                  <div className="grid2" style={{ gap: 4, marginTop: 4 }}>
                    {(['CONFIRM', 'OVERRIDE', 'RETEST_REQUIRED', 'INCONCLUSIVE'] as const).map((dec) => (
                      <button
                        key={dec}
                        className={`btn tiny ${engineerDecision === dec ? 'active' : ''}`}
                        onClick={() => setEngineerDecision(dec)}
                        style={{ fontSize: 10, padding: '6px 4px' }}
                      >
                        {dec.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="tiny faint">Engineering Triage Note:</span>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    style={{ width: '100%', marginTop: 4, fontSize: 11, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--line)', padding: 6, borderRadius: 4 }}
                  />
                </div>

                <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                  <div className="tiny" style={{ fontWeight: 600, color: 'var(--cyan)' }}>System State vs Engineer Review:</div>
                  <div className="spread" style={{ marginTop: 4 }}>
                    <span className="tiny faint">Model Suggested:</span>
                    <StatusChip state={healthOutcome} />
                  </div>
                  <div className="spread" style={{ marginTop: 2 }}>
                    <span className="tiny faint">Engineer Decision:</span>
                    <span className="mono tiny" style={{ fontWeight: 700, color: 'var(--green)' }}>{engineerDecision}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Right Detail Panel — Selected Component Engineering Summary */}
      {activeComp && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            right: 14,
            width: 320,
            zIndex: 3,
            pointerEvents: 'auto',
          }}
        >
          <div
            className="panel"
            style={{
              padding: 12,
              background: 'rgba(12, 16, 21, 0.90)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <div className="spread">
              <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b' }}>
                {activeComp.name}
              </span>
              <button className="btn tiny" onClick={() => clearSelection()}>✕</button>
            </div>
            <div className="tiny faint mono" style={{ marginTop: 2 }}>ID: {activeComp.id} · Region: {activePoint.region}</div>

            <div className="col" style={{ marginTop: 8, gap: 6 }}>
              <div className="panel" style={{ padding: 6, background: 'rgba(0,0,0,0.3)' }}>
                <span className="tiny faint">Active Load Hardpoint:</span>
                <div className="small mono" style={{ color: '#38bdf8', fontWeight: 600 }}>{activePoint.id}</div>
                <div className="tiny faint">Nominal Pos: [{activePoint.pos.join(', ')}] m</div>
              </div>

              <div className="grid2" style={{ gap: 4 }}>
                <div className="stat" style={{ padding: '4px 6px' }}>
                  <span className="tiny faint">Stiffness K</span>
                  <span className="mono tiny" style={{ fontWeight: 700 }}>{activePoint.kStiffnessNPerMm} N/mm</span>
                </div>
                <div className="stat" style={{ padding: '4px 6px' }}>
                  <span className="tiny faint">Max Test Force</span>
                  <span className="mono tiny" style={{ fontWeight: 700 }}>{(activePoint.maxForceN / 1000).toFixed(0)} kN</span>
                </div>
              </div>

              <div className="spread">
                <span className="tiny faint">Structural Health:</span>
                <StatusChip state={healthOutcome} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 448,
          right: 14,
          zIndex: 2,
          padding: '8px 14px',
          background: 'rgba(12, 16, 21, 0.90)',
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
          <button className="btn tiny" onClick={() => { setViewMode('skeletal'); setCadView(true); }}>BIW Skeleton</button>
          <button className="btn tiny" onClick={() => { setViewMode('transparent'); setCadView(false); }}>Ghost Body</button>
          <button className={`btn tiny ${xray ? 'active' : ''}`} onClick={() => setXray(!xray)}>X-Ray</button>
          <button className={`btn tiny ${wireframe ? 'active' : ''}`} onClick={() => setWireframe(!wireframe)}>FEA Wireframe</button>
          <button className="btn tiny" onClick={returnToBaseline} title="Return to EOL Baseline">↺ Reset Baseline</button>
        </div>

        <div className="row" style={{ gap: 12 }}>
          <span className="mono tiny faint">EXPERIMENT STATUS: {manualLoadState} · PHASE: {manualTestPhase}</span>
          <span className="chip" style={{ color: 'var(--green)' }}>● INTERACTIVE WORKBENCH READY</span>
        </div>
      </div>
    </div>
  );
}
