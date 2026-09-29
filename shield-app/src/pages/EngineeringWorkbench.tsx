/* ============================================================
   SHIELD — MANUAL ENGINEERING WORKBENCH
   Interactive EV Structural Twin Test Workstation
   - Clean UI when closed (90-100% 3D Car Viewport)
   - Full Engineering Workbench inside Left Test Control Drawer (380px)
   - Live Engineering Response: Stress, Strain, Displacement, Utilization, Factor of Safety
   - Detailed Calculation Accordion: Equations, Area, Modulus, Yield Limits, FEA Source
   - Authoritative Load Configuration: Force, Torque, Pressure, Cyclic
   - Synchronized Engineering State across UI, 3D Mesh, FEA Contours, and Condition Status
   ============================================================ */

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { CaelineLegend } from '../three/CaelineLegend';
import { HARDPOINT_PROFILES, calculateStructuralResponse } from '../data/hardpoints';
import { ReviewStation } from './ReviewStation';
import type { ManualLoadType, LatchedStructuralEvent } from '../schema/types';

export function EngineeringWorkbench() {
  const workbenchMode = useStore((s) => s.workbenchMode);
  const setWorkbenchMode = useStore((s) => s.setWorkbenchMode);
  const select = useStore((s) => s.select);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const setCadView = useStore((s) => s.setCadView);
  const xray = useStore((s) => s.xray);
  const setXray = useStore((s) => s.setXray);
  const wireframe = useStore((s) => s.wireframe);
  const setWireframe = useStore((s) => s.setWireframe);
  const requestResetCamera = useStore((s) => s.requestResetCamera);

  // Store Drawer State
  const leftDrawerOpen = useStore((s) => s.leftDrawerOpen);
  const rightDrawerOpen = useStore((s) => s.rightDrawerOpen);
  const toggleLeftDrawer = useStore((s) => s.toggleLeftDrawer);
  const toggleRightDrawer = useStore((s) => s.toggleRightDrawer);
  const closeDrawers = useStore((s) => s.closeDrawers);

  // Structural Overlay State
  const structuralOverlayEnabled = useStore((s) => s.structuralOverlayEnabled);
  const toggleStructuralOverlay = useStore((s) => s.toggleStructuralOverlay);

  // Workbench State
  const activeHardpointId = useStore((s) => s.activeHardpointId);
  const setActiveHardpointId = useStore((s) => s.setActiveHardpointId);
  const manualAppliedForceN = useStore((s) => s.manualAppliedForceN);
  const setManualAppliedForceN = useStore((s) => s.setManualAppliedForceN);
  const manualLoadType = useStore((s) => s.manualLoadType);
  const setManualLoadType = useStore((s) => s.setManualLoadType);
  const manualLoadVector = useStore((s) => s.manualLoadVector);
  const setManualLoadVector = useStore((s) => s.setManualLoadVector);
  const manualLoadState = useStore((s) => s.manualLoadState);
  const setManualLoadState = useStore((s) => s.setManualLoadState);
  const manualDeformationScale = useStore((s) => s.manualDeformationScale);
  const setManualDeformationScale = useStore((s) => s.setManualDeformationScale);
  const isDeformationAmplified = useStore((s) => s.isDeformationAmplified);
  const setIsDeformationAmplified = useStore((s) => s.setIsDeformationAmplified);
  const manualTemperatureC = useStore((s) => s.manualTemperatureC);
  const setManualTemperatureC = useStore((s) => s.setManualTemperatureC);
  const manualTestPhase = useStore((s) => s.manualTestPhase);
  const setManualTestPhase = useStore((s) => s.setManualTestPhase);
  const loadMode = useStore((s) => s.loadMode);
  const setLoadMode = useStore((s) => s.setLoadMode);
  const contourMode = useStore((s) => s.contourMode);
  const setContourMode = useStore((s) => s.setContourMode);
  const showAdvancedConditions = useStore((s) => s.showAdvancedConditions);
  const setShowAdvancedConditions = useStore((s) => s.setShowAdvancedConditions);

  // Accordion state
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);

  // Events & ML
  const latchedEvent = useStore((s) => s.latchedEvent);
  const triggerLatchedEvent = useStore((s) => s.triggerLatchedEvent);
  const mlStatus = useStore((s) => s.mlStatus);
  const mlPrediction = useStore((s) => s.mlPrediction);
  const setMlStatus = useStore((s) => s.setMlStatus);
  const setMlPrediction = useStore((s) => s.setMlPrediction);
  const startRetestSameCondition = useStore((s) => s.startRetestSameCondition);

  // Close drawers on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDrawers]);

  // Default View Mode: COMPLETE CAR
  useEffect(() => {
    setViewMode('complete');
  }, [setViewMode]);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Hardpoint profile
  const profile = HARDPOINT_PROFILES[activeHardpointId] || HARDPOINT_PROFILES.front_rail_lh;
  const forceKn = manualAppliedForceN / 1000;

  // Real-time Physics Engine calculation (30-60 FPS continuous update)
  const physics = useMemo(() => {
    return calculateStructuralResponse(profile, forceKn, manualTemperatureC, manualTestPhase);
  }, [profile, forceKn, manualTemperatureC, manualTestPhase]);

  // Calculated Factor of Safety & Nominal Area
  const factorOfSafety = useMemo(() => {
    if (physics.calculatedStressMpa <= 0) return 99.9;
    return profile.yieldStressMpa / physics.calculatedStressMpa;
  }, [physics.calculatedStressMpa, profile.yieldStressMpa]);

  const nominalAreaMm2 = useMemo(() => {
    return (profile.safeForceLimitKn * 1000) / Math.max(10, 0.5 * profile.yieldStressMpa);
  }, [profile.safeForceLimitKn, profile.yieldStressMpa]);

  // Latch structural event on Yield / Red condition
  useEffect(() => {
    if (physics.conditionState === 'RED' && !latchedEvent) {
      const newEv: LatchedStructuralEvent = {
        id: `EV-00${100 + Math.floor(Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        hardpointId: profile.id,
        hardpointName: profile.name,
        peakLoadKn: forceKn,
        peakStressMpa: physics.calculatedStressMpa,
        yieldStressMpa: profile.yieldStressMpa,
        severity: physics.isUltimateExceeded ? 'CRITICAL' : 'WARNING',
        message: `Configured structural envelope exceeded at ${profile.name}. Peak load: ${forceKn.toFixed(1)} kN, Stress: ${physics.calculatedStressMpa} MPa.`,
        requiresEngineerNote: true,
      };
      triggerLatchedEvent(newEv);
    }
  }, [physics.conditionState, latchedEvent, profile, forceKn, triggerLatchedEvent]);

  // Fetch ML Prediction from Backend API
  const handleFetchMlPredict = async () => {
    setMlStatus('PREDICTING');
    try {
      const res = await fetch('http://localhost:8000/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force_kn: forceKn,
          stress_mpa: physics.calculatedStressMpa,
          hardpoint_id: profile.id,
          temp_c: manualTemperatureC,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMlPrediction(data);
        setMlStatus('CONNECTED');
      } else {
        setMlStatus('ERROR');
      }
    } catch (e) {
      setMlStatus('DISCONNECTED');
    }
  };

  // Fetch Gemini AI Reasoning from Backend API
  const handleFetchAiAnalyze = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hardpoint: profile.code,
          force_kn: forceKn,
          stress_mpa: physics.calculatedStressMpa,
          strain_ue: physics.calculatedStrainMicro,
          utilization_pct: physics.utilizationIndexPct,
          ml_prediction: mlPrediction,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      }
    } catch (e) {
      console.error('AI Analysis error:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Primary Test Button Handler
  const handlePrimaryTestButton = () => {
    if (manualTestPhase === 'BEFORE') {
      setManualTestPhase('DURING');
      setManualLoadState('APPLYING');
      setTimeout(() => setManualLoadState('HOLDING'), 300);
      handleFetchMlPredict();
    } else if (manualTestPhase === 'DURING') {
      setManualTestPhase('AFTER');
      setManualAppliedForceN(0);
      setManualLoadState('RELEASING');
      setTimeout(() => setManualLoadState('IDLE'), 300);
    } else {
      setManualTestPhase('BEFORE');
      setManualAppliedForceN(0);
      setManualLoadState('IDLE');
    }
  };

  // If in Review Station Workstation Mode, render ReviewStation
  if (workbenchMode === 'review_station') {
    return <ReviewStation />;
  }

  return (
    <div className="engineering-workbench-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#090d12' }}>
      
      {/* 3D Scene Viewport (Fills 90-100% of workspace) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <VehicleScene />
      </div>

      {/* Persistent Latched Event Warning Banner */}
      {latchedEvent && (
        <div
          style={{
            position: 'relative',
            zIndex: 60,
            background: 'linear-gradient(90deg, rgba(185,28,28,0.96), rgba(153,27,27,0.92))',
            borderBottom: '2px solid #ef4444',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            pointerEvents: 'auto',
          }}
        >
          <div className="row" style={{ gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.04em' }}>
                PERSISTENT STRUCTURAL EVENT RECORDED [{latchedEvent.id}] — REWORK REQUIRED
              </div>
              <div className="tiny" style={{ opacity: 0.9 }}>
                {latchedEvent.message}
              </div>
            </div>
          </div>
          <div className="row gap-2">
            <button
              className="btn tiny"
              style={{ background: '#fff', color: '#991b1b', fontWeight: 800, border: 'none', padding: '6px 12px', cursor: 'pointer' }}
              onClick={() => startRetestSameCondition(latchedEvent.id)}
            >
              ⚡ RETEST SAME CONDITION
            </button>
            <button
              className="btn tiny"
              style={{ background: '#0284c7', color: '#fff', fontWeight: 800, border: 'none', padding: '6px 12px', cursor: 'pointer' }}
              onClick={toggleRightDrawer}
            >
              VIEW ANALYSIS
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          TOP FLOATING NAVIGATION & TOOLBAR (ALWAYS VISIBLE - zIndex: 50)
          ============================================================ */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto' }}>
        
        {/* UPPER-LEFT 40x40 HAMBURGER BUTTON (☰) */}
        <button
          title="Test Controls"
          onClick={(e) => {
            e.stopPropagation();
            toggleLeftDrawer();
          }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            background: leftDrawerOpen ? '#0284c7' : 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid ' + (leftDrawerOpen ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)'),
            color: '#38bdf8',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          ☰
        </button>

        {/* COMPACT FLOATING VIEWPORT TOOLBAR */}
        <div
          className="row gap-2 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur shadow-2xl pointer-events-auto"
          style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
        >
          {/* Vehicle Mode Dropdown */}
          <div className="row gap-1 border-r border-slate-800 pr-2">
            <span className="tiny faint font-bold text-cyan-400">Vehicle:</span>
            <select
              value={xray ? 'xray' : wireframe ? 'wireframe' : viewMode}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'xray') {
                  setXray(true);
                  setWireframe(false);
                } else if (val === 'wireframe') {
                  setWireframe(true);
                  setXray(false);
                } else {
                  setXray(false);
                  setWireframe(false);
                  setViewMode(val as any);
                  if (val === 'skeletal') setCadView(true);
                }
              }}
              className="text-xs px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-bold cursor-pointer"
            >
              <option value="complete">Complete Car</option>
              <option value="transparent">Transparent Body</option>
              <option value="chassis">Chassis Only</option>
              <option value="skeletal">BIW Frame</option>
              <option value="xray">X-Ray</option>
              <option value="wireframe">FEA Wireframe</option>
            </select>
          </div>

          {/* Structural Overlay Toggle */}
          <button
            className={`btn tiny ${structuralOverlayEnabled ? 'active' : ''}`}
            onClick={toggleStructuralOverlay}
            title="Toggle Structural Overlay"
            style={{
              fontSize: 10,
              padding: '4px 8px',
              background: structuralOverlayEnabled ? '#0284c7' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
            }}
          >
            Overlay: {structuralOverlayEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Result Contour Dropdown */}
          <div className="row gap-1 border-r border-slate-800 pr-2">
            <span className="tiny faint font-bold text-slate-300">Result:</span>
            <select
              value={contourMode}
              onChange={(e) => setContourMode(e.target.value as any)}
              className="text-xs px-2 py-1 bg-slate-950 border border-slate-800 rounded text-cyan-400 font-bold cursor-pointer"
            >
              <option value="stress">Stress (MPa)</option>
              <option value="strain">Strain (µε)</option>
              <option value="displacement">Displacement (mm)</option>
              <option value="load_path">Load Path</option>
            </select>
          </div>

          {/* Deformation Scale Dropdown */}
          <div className="row gap-1 border-r border-slate-800 pr-2">
            <span className="tiny faint font-bold text-amber-400">Scale:</span>
            <select
              value={manualDeformationScale}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setManualDeformationScale(val);
                setIsDeformationAmplified(val > 1);
              }}
              className="text-xs px-2 py-1 bg-slate-950 border border-slate-800 rounded text-amber-300 font-mono font-bold cursor-pointer"
            >
              <option value={1}>1× True Scale</option>
              <option value={5}>5× Scale</option>
              <option value={10}>10× Scale</option>
              <option value={20}>20× Scale</option>
            </select>
          </div>

          {/* Camera Reset View Button */}
          <button
            className="btn tiny"
            onClick={requestResetCamera}
            title="Reset View"
            style={{
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⟳ Reset View
          </button>
        </div>

        {/* UPPER-RIGHT FLOATING CONDITION BADGE (Pill button) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRightDrawer();
          }}
          className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur shadow-xl cursor-pointer hover:border-cyan-500/50 transition-all"
          style={{ pointerEvents: 'auto' }}
        >
          <div className={`w-3 h-3 rounded-full ${
            physics.conditionState === 'RED' ? 'bg-red-500 shadow-lg shadow-red-500/90 animate-pulse' :
            physics.conditionState === 'AMBER' ? 'bg-amber-500 shadow-lg shadow-amber-500/90 animate-pulse' :
            'bg-emerald-500 shadow-lg shadow-emerald-500/90'
          }`} />
          <div className="flex flex-col items-start leading-tight">
            <span className={`font-bold text-xs ${
              physics.conditionState === 'RED' ? 'text-red-400' : physics.conditionState === 'AMBER' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              ● {physics.conditionLabel}
            </span>
            <span className="tiny mono faint text-slate-400">
              {physics.utilizationIndexPct}% UTIL
            </span>
          </div>
          <span className="text-slate-400 text-xs ml-1 font-bold">›</span>
        </button>
      </div>

      {/* ANSYS Continuous CAE Structural Contour Legend Bar (Top-Left under hamburger) */}
      <CaelineLegend />

      {/* Synchronized Stress Badge in Viewport */}
      <div
        className="panel p-2.5 bg-slate-900/90 border border-cyan-500/40 backdrop-blur rounded-lg flex items-center justify-between gap-4 pointer-events-auto self-center"
        style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}
      >
        <div className="row gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="tiny mono font-bold text-cyan-300">SELECTED REGION ({profile.code}): {physics.calculatedStressMpa} MPa</span>
          <span className="tiny mono text-amber-400 font-bold">| GLOBAL MAX: {Math.round(physics.calculatedStressMpa * 1.15)} MPa</span>
        </div>

        <div className="row gap-2 text-xs font-mono">
          <span className="text-slate-400">Deform:</span>
          <span className="text-amber-400 font-bold">{physics.displacementMm} mm ({manualDeformationScale}x)</span>
        </div>
      </div>

      {/* Backdrop overlay for closing drawers on click outside (zIndex: 55) */}
      {(leftDrawerOpen || rightDrawerOpen) && (
        <div
          onClick={() => closeDrawers()}
          style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0, 0, 0, 0.60)', backdropFilter: 'blur(4px)', cursor: 'pointer' }}
        />
      )}

      {/* ============================================================
          LEFT SPACIOUS ENGINEERING DRAWER: STRUCTURAL TEST CONTROL (380px, zIndex: 60)
          ============================================================ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: 380,
          zIndex: 60,
          background: '#0b0f16',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '10px 0 30px rgba(0, 0, 0, 0.85)',
          transform: leftDrawerOpen ? 'translateX(0)' : 'translateX(-400px)',
          transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
          gap: 14,
          overflowY: 'auto',
          pointerEvents: 'auto',
        }}
      >
        {/* HEADER */}
        <div className="spread border-b border-slate-800 pb-2">
          <div className="row gap-2">
            <span className="text-cyan-400 text-base font-bold">☰</span>
            <span className="font-bold text-xs uppercase tracking-wider text-cyan-400">STRUCTURAL TEST CONTROL</span>
          </div>
          <button
            className="btn tiny"
            onClick={() => closeDrawers()}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'none', padding: '4px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* SECTION 1 — TARGET */}
        <div className="col gap-2">
          <span className="tiny faint font-bold uppercase tracking-wider text-slate-400">SECTION 1 — TARGET</span>

          <div>
            <span className="tiny faint">Component:</span>
            <select
              value={profile.componentId}
              onChange={(e) => {
                const comp = e.target.value;
                select(comp);
                if (comp === 'subframe_front') setActiveHardpointId('front_rail_lh');
                else if (comp === 'battery_pack') setActiveHardpointId('battery_enclosure');
                else if (comp === 'suspension_front') setActiveHardpointId('shock_tower_fl');
                else if (comp === 'chassis_main') setActiveHardpointId('crossmember_front');
                else if (comp === 'subframe_rear') setActiveHardpointId('rear_subframe');
              }}
              className="w-full mt-1 text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-bold cursor-pointer"
            >
              <option value="subframe_front">Front Rail / Subframe</option>
              <option value="battery_pack">Battery Pack Enclosure</option>
              <option value="suspension_front">Front Suspension Strut</option>
              <option value="chassis_main">Floor Crossmember #1</option>
              <option value="subframe_rear">Rear Subframe Mount</option>
            </select>
          </div>

          <div>
            <span className="tiny faint">Hardpoint:</span>
            <select
              value={activeHardpointId}
              onChange={(e) => {
                setActiveHardpointId(e.target.value);
                const hp = HARDPOINT_PROFILES[e.target.value];
                if (hp) select(hp.componentId);
              }}
              className="w-full mt-1 text-xs p-2 bg-slate-950 border border-slate-800 rounded text-cyan-400 font-mono font-bold cursor-pointer"
            >
              {Object.values(HARDPOINT_PROFILES).map((hp) => (
                <option key={hp.id} value={hp.id}>
                  {hp.code} — {hp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Compact Target Metadata */}
          <div className="panel p-2 bg-slate-950/80 border border-slate-800/80 rounded grid2 gap-2 text-xs font-mono">
            <div>
              <span className="tiny faint block">Material:</span>
              <span className="text-cyan-300 font-bold">{profile.materialName}</span>
            </div>
            <div>
              <span className="tiny faint block">Region:</span>
              <span className="text-slate-300">{profile.region}</span>
            </div>
          </div>
        </div>

        <hr className="border-slate-800/80 my-0.5" />

        {/* SECTION 2 — LOAD CONFIGURATION */}
        <div className="col gap-2">
          <span className="tiny faint font-bold uppercase tracking-wider text-slate-400">SECTION 2 — LOAD CONFIGURATION</span>

          <div className="grid2 gap-2">
            <div>
              <span className="tiny faint">Load Type:</span>
              <select
                value={manualLoadType}
                onChange={(e) => {
                  const t = e.target.value as ManualLoadType;
                  setManualLoadType(t);
                  if (t === 'vertical') setManualLoadVector([0, -1, 0]);
                  if (t === 'longitudinal') setManualLoadVector([0, 0, 1]);
                  if (t === 'lateral') setManualLoadVector([1, 0, 0]);
                  if (t === 'torsional') setManualLoadVector([0.7, -0.7, 0]);
                }}
                className="w-full mt-1 text-xs p-2 bg-slate-950 border border-slate-800 rounded text-amber-400 font-bold cursor-pointer"
              >
                <option value="vertical">Vertical</option>
                <option value="longitudinal">Longitudinal</option>
                <option value="lateral">Lateral</option>
                <option value="torsional">Torsional</option>
                <option value="point">Point Load</option>
                <option value="cyclic">Cyclic Load</option>
              </select>
            </div>

            <div>
              <span className="tiny faint">Direction:</span>
              <select
                value={
                  manualLoadVector[1] === -1 ? 'down' :
                  manualLoadVector[1] === 1 ? 'up' :
                  manualLoadVector[2] === 1 ? 'fore' : 'lat'
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'down') setManualLoadVector([0, -1, 0]);
                  if (v === 'up') setManualLoadVector([0, 1, 0]);
                  if (v === 'fore') setManualLoadVector([0, 0, 1]);
                  if (v === 'lat') setManualLoadVector([1, 0, 0]);
                }}
                className="w-full mt-1 text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono font-bold cursor-pointer"
              >
                <option value="down">-Y Down</option>
                <option value="up">+Y Up</option>
                <option value="fore">+Z Fore</option>
                <option value="lat">+X Lateral</option>
              </select>
            </div>
          </div>

          <div>
            <span className="tiny faint">Authoritative Input Mode:</span>
            <select
              value={loadMode}
              onChange={(e) => setLoadMode(e.target.value as any)}
              className="w-full mt-1 text-xs p-2 bg-slate-950 border border-slate-800 rounded text-sky-300 font-bold cursor-pointer"
            >
              <option value="force">FORCE (kN)</option>
              <option value="torque">TORQUE (kN·m)</option>
              <option value="pressure">PRESSURE (kPa)</option>
              <option value="cyclic">CYCLIC (amplitude)</option>
            </select>
          </div>
        </div>

        <hr className="border-slate-800/80 my-0.5" />

        {/* SECTION 3 — APPLIED FORCE SLIDER */}
        <div className="panel p-3 bg-slate-950/90 border border-cyan-500/40 rounded col gap-2">
          <div className="spread">
            <span className="tiny faint font-bold uppercase text-cyan-300">
              APPLIED {loadMode.toUpperCase()}
            </span>
            <div className="row gap-2 font-mono">
              <span className="font-bold text-base text-cyan-400">{forceKn.toFixed(1)} kN</span>
              <span className="tiny text-slate-400">({(forceKn * 1000).toLocaleString()} N)</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max={profile.ultimateForceLimitKn * 1000}
            step="500"
            value={manualAppliedForceN}
            onChange={(e) => setManualAppliedForceN(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="spread tiny font-mono text-slate-400">
            <span>0 kN</span>
            <span>Oper: {profile.safeForceLimitKn} kN</span>
            <span>Warn: {profile.yieldForceLimitKn} kN</span>
            <span>Crit: {profile.ultimateForceLimitKn} kN</span>
          </div>
        </div>

        {/* SECTION 4 — LIVE CALCULATED RESPONSE (2-Column Compact Grid) */}
        <div className="panel p-3 bg-slate-950/90 border border-slate-800 rounded col gap-2">
          <span className="tiny faint font-bold uppercase tracking-wider text-cyan-300">LIVE CALCULATED RESPONSE</span>

          <div className="grid2 gap-2 text-xs font-mono">
            <div className="stat p-2 bg-slate-900/80 rounded border border-slate-800">
              <span className="tiny faint block">STRESS</span>
              <span className="mono font-bold text-amber-400 text-sm">{physics.calculatedStressMpa} MPa</span>
              <span className="tiny text-slate-500 block">CALCULATED</span>
            </div>
            <div className="stat p-2 bg-slate-900/80 rounded border border-slate-800">
              <span className="tiny faint block">STRAIN</span>
              <span className="mono font-bold text-sky-400 text-sm">{physics.calculatedStrainMicro} µε</span>
              <span className="tiny text-slate-500 block">CALCULATED</span>
            </div>
            <div className="stat p-2 bg-slate-900/80 rounded border border-slate-800">
              <span className="tiny faint block">DISPLACEMENT</span>
              <span className="mono font-bold text-amber-300 text-sm">{physics.displacementMm} mm</span>
              <span className="tiny text-slate-500 block">CALCULATED</span>
            </div>
            <div className="stat p-2 bg-slate-900/80 rounded border border-slate-800">
              <span className="tiny faint block">UTILIZATION</span>
              <span className="mono font-bold text-cyan-400 text-sm">{physics.utilizationIndexPct}%</span>
              <span className="tiny text-slate-500 block">GOVERNING ({physics.governingCriterion})</span>
            </div>
          </div>

          <div className="grid3 gap-1.5 text-xs font-mono mt-1 p-2 bg-slate-900 rounded border border-slate-800/80">
            <div>
              <span className="tiny faint block">FACTOR OF SAFETY</span>
              <span className="font-bold text-emerald-400">{factorOfSafety > 20 ? '> 20.0' : factorOfSafety.toFixed(2)}</span>
            </div>
            <div>
              <span className="tiny faint block">RESIDUAL STRAIN</span>
              <span className={physics.residualStrainMicro > 0 ? 'font-bold text-red-400' : 'text-slate-300'}>{physics.residualStrainMicro} µε</span>
            </div>
            <div>
              <span className="tiny faint block">RECOVERY</span>
              <span className="font-bold text-emerald-300">{physics.percentRecovery}%</span>
            </div>
          </div>
        </div>

        {/* SECTION 5 — STRUCTURAL UTILIZATION BAR & BREAKDOWN */}
        <div className="panel p-3 bg-slate-950/90 border border-slate-800 rounded col gap-2">
          <div className="spread tiny font-mono font-bold">
            <span className="faint">STRUCTURAL UTILIZATION</span>
            <span className="text-cyan-400">{physics.utilizationIndexPct}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{
                width: `${Math.min(100, physics.utilizationIndexPct)}%`,
                height: '100%',
                background: physics.conditionState === 'RED' ? '#ef4444' : physics.conditionState === 'AMBER' ? '#eab308' : '#22c55e',
                transition: 'width 0.2s ease, background 0.2s ease',
              }}
            />
          </div>

          <div className="spread tiny text-slate-400 font-mono">
            <span>Governing: <strong className="text-white">{physics.governingCriterion}</strong></span>
            <span>Yield: {profile.yieldStressMpa} MPa</span>
          </div>

          {/* Individual Breakdowns */}
          <div className="grid2 gap-2 text-xs font-mono mt-1 pt-1 border-t border-slate-800/60">
            <div className="spread"><span className="faint">Stress:</span><span>{physics.stressUtilizationPct}%</span></div>
            <div className="spread"><span className="faint">Strain:</span><span>{physics.strainUtilizationPct}%</span></div>
            <div className="spread"><span className="faint">Disp:</span><span>{physics.dispUtilizationPct}%</span></div>
            <div className="spread"><span className="faint">Load:</span><span>{physics.loadUtilizationPct}%</span></div>
          </div>
        </div>

        {/* SECTION 6 — STRUCTURAL CONDITION */}
        <div className="panel p-3 bg-slate-950/90 border border-slate-800 rounded col gap-2">
          <div className="spread">
            <span className="tiny faint font-bold uppercase tracking-wider text-slate-400">STRUCTURAL CONDITION</span>
            <span className={`font-bold text-xs ${
              physics.conditionState === 'RED' ? 'text-red-400' : physics.conditionState === 'AMBER' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              ● {physics.conditionState}
            </span>
          </div>

          <div className={`p-2 rounded text-xs leading-relaxed font-mono ${
            physics.conditionState === 'RED' ? 'bg-red-950/40 text-red-300 border border-red-800/50' :
            physics.conditionState === 'AMBER' ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50' :
            'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
          }`}>
            <strong>{physics.conditionLabel}</strong>
            <div className="tiny mt-0.5 opacity-90">
              {physics.conditionState === 'RED' ? 'Configured structural envelope exceeded. Plastic yield or severe deformation occurring.' :
               physics.conditionState === 'AMBER' ? 'High load detected approaching component yield threshold limit.' :
               'All monitored structural responses remain inside normal operating envelope.'}
            </div>
          </div>
        </div>

        {/* SECTION 7 — COLLAPSIBLE CALCULATION DETAILS */}
        <div className="col gap-1">
          <button
            className="btn tiny flex items-center justify-between w-full"
            onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', padding: '6px 10px', cursor: 'pointer' }}
          >
            <span className="font-bold text-xs">CALCULATION DETAILS</span>
            <span>{showCalculationDetails ? '▲' : '▼'}</span>
          </button>

          {showCalculationDetails && (
            <div className="panel p-2.5 bg-slate-950/80 border border-slate-800 rounded col gap-1.5 text-xs font-mono text-slate-300">
              <div className="spread"><span className="faint">Applied Force:</span><span>{(forceKn * 1000).toLocaleString()} N</span></div>
              <div className="spread"><span className="faint">Effective Area (A):</span><span>{nominalAreaMm2.toFixed(1)} mm²</span></div>
              <div className="spread"><span className="faint">Young's Modulus (E):</span><span>{profile.youngModulusGpa} GPa</span></div>
              <div className="spread"><span className="faint">Calculated Normal Stress (F/A):</span><span>{physics.calculatedStressMpa} MPa</span></div>
              <div className="spread"><span className="faint">Equivalent Von Mises Stress:</span><span>{physics.calculatedStressMpa} MPa</span></div>
              <div className="spread"><span className="faint">Calculated Strain (σ/E):</span><span>{physics.calculatedStrainMicro} µε</span></div>
              <div className="spread"><span className="faint">Calculated Displacement:</span><span>{physics.displacementMm} mm</span></div>
              <div className="spread"><span className="faint">Allowable Yield Stress:</span><span>{profile.yieldStressMpa} MPa</span></div>
              <div className="spread"><span className="faint">Utilization Index:</span><span>{physics.utilizationIndexPct}%</span></div>
              <div className="spread"><span className="faint">Factor of Safety:</span><span>{factorOfSafety.toFixed(2)}</span></div>
              <div className="spread pt-1 border-t border-slate-800 text-cyan-400">
                <span className="faint text-slate-400">Response Source:</span>
                <span>REDUCED-ORDER FEA CALCULATION</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 8 — 3-PHASE TEST STEPPER */}
        <div className="col gap-1.5 mt-1">
          <span className="tiny faint font-bold uppercase tracking-wider text-slate-400">TEST PHASE STEPPER</span>
          <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono">
            <span className={manualTestPhase === 'BEFORE' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              {manualTestPhase === 'BEFORE' ? '● 1. BASELINE' : '✓ 1. BASELINE'}
            </span>
            <span className="text-slate-600">→</span>
            <span className={manualTestPhase === 'DURING' ? 'text-amber-400 font-bold' : 'text-slate-500'}>
              {manualTestPhase === 'DURING' ? '● 2. LOAD' : manualTestPhase === 'AFTER' ? '✓ 2. LOAD' : '○ 2. LOAD'}
            </span>
            <span className="text-slate-600">→</span>
            <span className={manualTestPhase === 'AFTER' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {manualTestPhase === 'AFTER' ? '● 3. RECOVERY' : '○ 3. RECOVERY'}
            </span>
          </div>
        </div>

        {/* SECTION 9 — PRIMARY TEST ACTION BUTTON */}
        <button
          className="btn w-full mt-1"
          onClick={handlePrimaryTestButton}
          style={{
            background: manualTestPhase === 'BEFORE' ? '#0284c7' : manualTestPhase === 'DURING' ? '#d97706' : '#059669',
            color: '#fff',
            fontWeight: 800,
            padding: '12px',
            fontSize: 13,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {manualTestPhase === 'BEFORE' ? '▶ START / APPLY LOAD' : manualTestPhase === 'DURING' ? '■ HOLD LOAD' : '↓ UNLOAD & CHECK RECOVERY'}
        </button>

        {/* SECTION 10 — COLLAPSIBLE ADVANCED TEST CONDITIONS */}
        <div className="col gap-1 mt-1">
          <button
            className="btn tiny flex items-center justify-between w-full"
            onClick={() => setShowAdvancedConditions(!showAdvancedConditions)}
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', padding: '6px 10px', cursor: 'pointer' }}
          >
            <span className="font-bold text-xs">ADVANCED TEST CONDITIONS</span>
            <span>{showAdvancedConditions ? '▲' : '▼'}</span>
          </button>

          {showAdvancedConditions && (
            <div className="panel p-2.5 bg-slate-950/70 border border-slate-800 rounded col gap-2 mt-1">
              <div>
                <span className="tiny faint">Environmental Temp: {manualTemperatureC.toFixed(1)} °C</span>
                <input
                  type="range"
                  min="-40"
                  max="120"
                  step="1"
                  value={manualTemperatureC}
                  onChange={(e) => setManualTemperatureC(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 mt-1 cursor-pointer"
                />
              </div>

              <div>
                <span className="tiny faint">Deformation Scale: {manualDeformationScale}x</span>
                <div className="row gap-1 mt-1">
                  {[1, 5, 10, 20].map((s) => (
                    <button
                      key={s}
                      className={`btn tiny ${manualDeformationScale === s ? 'active' : ''}`}
                      onClick={() => {
                        setManualDeformationScale(s);
                        setIsDeformationAmplified(s > 1);
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          RIGHT COMPACT DRAWER: STRUCTURAL CONDITION & ANALYSIS (zIndex: 60)
          ============================================================ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          width: 360,
          zIndex: 60,
          background: '#0b0f16',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.85)',
          transform: rightDrawerOpen ? 'translateX(0)' : 'translateX(380px)',
          transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
          gap: 14,
          overflowY: 'auto',
          pointerEvents: 'auto',
        }}
      >
        <div className="spread border-b border-slate-800 pb-2.5">
          <div className="row gap-2">
            <span className="text-cyan-400 text-sm font-bold">📊</span>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">STRUCTURAL CONDITION & RESPONSE</span>
          </div>
          <button
            className="btn tiny"
            onClick={() => closeDrawers()}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* 3-LIGHT TRAFFIC SIGNAL CARD */}
        <div className="panel p-3 bg-slate-950/90 border border-slate-800 rounded col gap-2">
          <div className="spread">
            <span className="tiny faint font-bold uppercase tracking-wider text-slate-400">Current Status</span>
            <span className="mono tiny text-cyan-400 font-bold">{physics.utilizationIndexPct}% UTIL</span>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="flex flex-col gap-1.5 p-1.5 rounded-full bg-slate-950 border border-slate-800">
              <div className={`w-5 h-5 rounded-full ${physics.conditionState === 'RED' ? 'bg-red-500 shadow-lg shadow-red-500/90 animate-pulse' : 'bg-red-950/40 opacity-30'}`} />
              <div className={`w-5 h-5 rounded-full ${physics.conditionState === 'AMBER' ? 'bg-amber-500 shadow-lg shadow-amber-500/90 animate-pulse' : 'bg-amber-950/40 opacity-30'}`} />
              <div className={`w-5 h-5 rounded-full ${physics.conditionState === 'GREEN' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/90' : 'bg-emerald-950/40 opacity-30'}`} />
            </div>

            <div>
              <div className="tiny faint uppercase tracking-wider">Condition</div>
              <div className={`font-bold text-base ${
                physics.conditionState === 'RED' ? 'text-red-400' : physics.conditionState === 'AMBER' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {physics.conditionLabel}
              </div>
              <div className="tiny faint mt-0.5">
                Governing: <strong className="text-white">{physics.governingCriterion}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE STRUCTURAL RESPONSE METRICS */}
        <div className="panel p-3 bg-slate-950/80 border border-slate-800 rounded col gap-2">
          <span className="tiny faint font-bold uppercase tracking-wider text-cyan-300">LIVE STRUCTURAL METRICS</span>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="stat p-2.5 bg-slate-900/70 rounded border border-slate-800/80 flex flex-col justify-between gap-1">
              <span className="tiny faint text-slate-400 block">Applied Load</span>
              <span className="mono font-bold text-white text-sm block">{forceKn.toFixed(1)} kN</span>
            </div>
            <div className="stat p-2.5 bg-slate-900/70 rounded border border-slate-800/80 flex flex-col justify-between gap-1">
              <span className="tiny faint text-slate-400 block">Stress</span>
              <span className="mono font-bold text-amber-400 text-sm block">{physics.calculatedStressMpa} MPa</span>
            </div>
            <div className="stat p-2.5 bg-slate-900/70 rounded border border-slate-800/80 flex flex-col justify-between gap-1">
              <span className="tiny faint text-slate-400 block">Strain</span>
              <span className="mono font-bold text-sky-400 text-sm block">{physics.calculatedStrainMicro} µε</span>
            </div>
            <div className="stat p-2.5 bg-slate-900/70 rounded border border-slate-800/80 flex flex-col justify-between gap-1">
              <span className="tiny faint text-slate-400 block">Displacement</span>
              <span className="mono font-bold text-amber-300 text-sm block">{physics.displacementMm} mm</span>
            </div>
          </div>

          <div className="spread tiny font-mono bg-slate-900 p-2 rounded border border-slate-800/60">
            <span className="faint">Residual Plastic Strain:</span>
            <span className={physics.residualStrainMicro > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {physics.residualStrainMicro} µε
            </span>
          </div>
        </div>

        {/* ML & GEMINI AI ASSESSMENT */}
        <div className="panel p-3 bg-slate-950/80 border border-slate-800 rounded col gap-2">
          <div className="spread">
            <span className="tiny faint font-bold uppercase tracking-wider text-purple-300">ML & GEMINI AI ASSESSMENT</span>
            <span className="prov prov-ml">{mlStatus}</span>
          </div>

          {mlPrediction && (
            <div className="col gap-1 text-xs">
              <div className="spread">
                <span className="faint">ML Condition:</span>
                <span className="mono font-bold text-amber-400">{mlPrediction.severity}</span>
              </div>
              <div className="spread">
                <span className="faint">Confidence:</span>
                <span className="mono font-bold text-emerald-400">{(mlPrediction.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          <button
            className="btn tiny w-full mt-1"
            onClick={handleFetchAiAnalyze}
            disabled={isAiLoading}
            style={{ background: '#7e22ce', color: '#fff', fontWeight: 700, padding: '8px', cursor: 'pointer' }}
          >
            {isAiLoading ? 'GENERATING REASONING...' : '✨ GENERATE GEMINI AI ANALYSIS'}
          </button>

          {aiAnalysis && (
            <div className="tiny text-slate-200 bg-slate-900 p-2 rounded border border-purple-500/30 mt-1 leading-relaxed">
              <strong>AI Reasoning:</strong> {aiAnalysis.summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
