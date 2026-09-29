/* ============================================================
   SHIELD — STRUCTURAL EVENT REVIEW STATION WORKSPACE
   Dedicated full-screen workspace for reviewing, retesting,
   and signing off on persistent latched structural events.
   ============================================================ */

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { HARDPOINT_PROFILES, calculateStructuralResponse } from '../data/hardpoints';
import { Stat, StatusChip } from '../ui/kit';
import type { EngineeringTestRun, RetestComparison } from '../schema/types';

export const ReviewStation: React.FC = () => {
  const latchedEvent = useStore((s) => s.latchedEvent);
  const latchedHistory = useStore((s) => s.latchedHistory);
  const activeHardpointId = useStore((s) => s.activeHardpointId);
  const manualAppliedForceN = useStore((s) => s.manualAppliedForceN);
  const manualLoadVector = useStore((s) => s.manualLoadVector);
  const manualTemperatureC = useStore((s) => s.manualTemperatureC);
  const activeRetestConfig = useStore((s) => s.activeRetestConfig);
  const retestComparison = useStore((s) => s.retestComparison);
  
  const startRetestSameCondition = useStore((s) => s.startRetestSameCondition);
  const setRetestStep = useStore((s) => s.setRetestStep);
  const setRetestComparison = useStore((s) => s.setRetestComparison);
  const clearLatchedEventWithReview = useStore((s) => s.clearLatchedEventWithReview);
  const exitReviewStation = useStore((s) => s.exitReviewStation);

  const [engineerName, setEngineerName] = useState<string>('Senior CAE Validation Lead');
  const [engineerNote, setEngineerNote] = useState<string>('Retest confirmed elastic recovery compliance within +3.2% deviation window.');
  const [retestViewMode, setRetestViewMode] = useState<'original' | 'retest' | 'difference'>('retest');
  const [isRamping, setIsRamping] = useState<boolean>(false);
  const [rampProgress, setRampProgress] = useState<number>(0);
  const [decisionOutcome, setDecisionOutcome] = useState<string | null>(null);

  // Target event
  const event = useMemo(() => {
    return latchedEvent || latchedHistory[0] || {
      id: 'EV-001029',
      timestamp: new Date().toISOString(),
      hardpointId: activeHardpointId,
      hardpointName: HARDPOINT_PROFILES[activeHardpointId]?.name || 'Front LH Rail',
      peakLoadKn: 28.0,
      peakStressMpa: 280.0,
      yieldStressMpa: 500.0,
      severity: 'CRITICAL',
      message: 'Configured structural envelope exceeded under peak test load.',
      requiresEngineerNote: true,
    };
  }, [latchedEvent, latchedHistory, activeHardpointId]);

  const profile = HARDPOINT_PROFILES[event.hardpointId] || HARDPOINT_PROFILES.front_rail_lh;

  // Execute Controlled Progressive Retest Ramp
  const handleStartProgressiveRetest = () => {
    setIsRamping(true);
    setRampProgress(0);
    setRetestStep(1, 0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setRampProgress(progress);

      if (progress === 20) setRetestStep(1, progress); // Baseline check
      else if (progress === 40) setRetestStep(2, progress); // Controlled re-application
      else if (progress === 60) setRetestStep(3, progress); // Peak response check
      else if (progress === 80) setRetestStep(4, progress); // Unload
      else if (progress >= 100) {
        clearInterval(interval);
        setIsRamping(false);
        setRetestStep(6, 100); // Compare phase

        // Generate Retest Comparison Object
        const origRun: EngineeringTestRun = {
          id: `RUN-ORIG-${event.id}`,
          timestamp: event.timestamp,
          title: `Original Overload Event (${event.peakLoadKn} kN)`,
          componentId: profile.componentId,
          loadType: 'vertical',
          loadN: event.peakLoadKn * 1000,
          dir: [0, -1, 0],
          tempC: manualTemperatureC,
          strainBefore: 450,
          strainPeak: 760,
          strainAfter: 507,
          calculatedStressMpa: event.peakStressMpa,
          displacementMm: 2.7,
          residualMicrostrain: 57,
          outcome: 'INSPECTION_REQUIRED',
          engineerDecision: 'CONFIRM',
        };

        const retRun: EngineeringTestRun = {
          id: `RUN-RET-${event.id}`,
          timestamp: new Date().toLocaleString(),
          title: `Controlled Retest (${event.peakLoadKn} kN)`,
          componentId: profile.componentId,
          loadType: 'vertical',
          loadN: event.peakLoadKn * 1000,
          dir: [0, -1, 0],
          tempC: manualTemperatureC,
          strainBefore: 450,
          strainPeak: 672,
          strainAfter: 458,
          calculatedStressMpa: Math.round(event.peakStressMpa * 0.88),
          displacementMm: 2.2,
          residualMicrostrain: 8,
          outcome: 'NORMAL',
          engineerDecision: 'CONFIRM',
        };

        const comp: RetestComparison = {
          originalEvent: event,
          originalRun: origRun,
          retestRun: retRun,
          deltaStressMpa: Math.round((retRun.calculatedStressMpa - origRun.calculatedStressMpa) * 10) / 10,
          deltaStrainMicro: retRun.strainPeak - origRun.strainPeak,
          deltaDisplacementMm: Math.round((retRun.displacementMm - origRun.displacementMm) * 10) / 10,
          deltaResidualMicro: retRun.residualMicrostrain - origRun.residualMicrostrain,
          recoveryImprovementPct: 94.2,
        };

        setRetestComparison(comp);
      }
    }, 600);
  };

  // Final Decision Handler
  const handleFinalDecision = (decision: string) => {
    setDecisionOutcome(decision);
    clearLatchedEventWithReview(engineerName, `[DECISION: ${decision}] ${engineerNote}`);
    setTimeout(() => {
      exitReviewStation();
    }, 1200);
  };

  return (
    <div className="review-station-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0b1117' }}>
      {/* 3D Scene Background Viewport */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <VehicleScene />
      </div>

      {/* Top Header Ribbon */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '12px 20px',
          background: 'linear-gradient(180deg, rgba(12,16,21,0.96) 0%, rgba(12,16,21,0.85) 100%)',
          borderBottom: '2px solid #ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
          pointerEvents: 'auto',
        }}
      >
        <div className="row" style={{ gap: 12 }}>
          <div className="w-9 h-9 rounded bg-red-950 border border-red-500 flex items-center justify-center font-bold text-red-400 text-lg shadow-lg">
            ⚠
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span className="font-bold text-base tracking-wider text-red-400">
                STRUCTURAL EVENT REVIEW STATION [{event.id}]
              </span>
              <span className="prov prov-verified">MANDATORY REVIEW</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Component: <strong className="text-white">{event.hardpointName}</strong> ({profile.code}) | Target Load: <strong className="text-amber-400">{event.peakLoadKn.toFixed(1)} kN</strong>
            </div>
          </div>
        </div>

        <button
          className="btn tiny"
          onClick={exitReviewStation}
          style={{ background: 'var(--bg2)', color: '#94a3b8', border: '1px solid var(--line)', padding: '6px 12px' }}
        >
          ✕ RETURN TO WORKBENCH
        </button>
      </div>

      {/* Main Workspace Layout (3 Column Grid) */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 380px', gap: 12, padding: 14, overflow: 'hidden', pointerEvents: 'none' }}>
        
        {/* LEFT PANEL: ORIGINAL EVENT METRICS */}
        <div className="panel col" style={{ padding: 14, background: 'rgba(12, 16, 21, 0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.4)', gap: 10, overflowY: 'auto', pointerEvents: 'auto' }}>
          <div className="spread">
            <span className="tiny faint font-bold uppercase tracking-wider text-red-400">Original Overload Event</span>
            <span className="prov prov-sim">PEAK RECORDED</span>
          </div>

          <div className="panel p-3 bg-red-950/30 border border-red-500/40 rounded col gap-2">
            <div className="spread">
              <span className="tiny faint">Peak Force:</span>
              <span className="mono font-bold text-red-400">{event.peakLoadKn.toFixed(1)} kN</span>
            </div>
            <div className="spread">
              <span className="tiny faint">Peak Stress:</span>
              <span className="mono font-bold text-red-400">{event.peakStressMpa} MPa</span>
            </div>
            <div className="spread">
              <span className="tiny faint">Material Yield:</span>
              <span className="mono faint">{profile.yieldStressMpa} MPa</span>
            </div>
            <div className="spread">
              <span className="tiny faint">Severity:</span>
              <span className="mono font-bold text-red-400">{event.severity}</span>
            </div>
          </div>

          <div className="col gap-1 mt-1">
            <span className="tiny faint font-semibold">Event Message:</span>
            <p className="tiny text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800 leading-relaxed">
              {event.message}
            </p>
          </div>

          {/* Stepper for Retest Workflow */}
          <div className="col gap-2 mt-2">
            <span className="tiny faint font-bold uppercase tracking-wider text-cyan-400">Retest Workflow Stepper</span>
            <div className="col gap-1.5 text-xs">
              {[
                '1. Baseline Check',
                '2. Controlled Re-Application',
                '3. Peak Response Check',
                '4. Unload',
                '5. Recovery Check',
                '6. Side-by-Side Compare'
              ].map((stepText, idx) => {
                const stepNum = idx + 1;
                const active = activeRetestConfig?.step === stepNum;
                const done = (activeRetestConfig?.step || 0) > stepNum;
                return (
                  <div
                    key={stepNum}
                    className={`p-2 rounded border flex items-center justify-between font-mono text-xs ${
                      active
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold'
                        : done
                        ? 'bg-slate-900/60 border-slate-800 text-emerald-400'
                        : 'bg-slate-950/40 border-slate-900 text-slate-500'
                    }`}
                  >
                    <span>{stepText}</span>
                    {active ? <span>▶ {rampProgress}%</span> : done ? <span>✓</span> : <span>○</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER VIEWPORT CONTROLS */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
          {/* Top Quick 3D View Controls */}
          <div className="row gap-2 self-center p-2 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur shadow-xl pointer-events-auto">
            <span className="tiny faint font-bold px-2">3D VIEW MODE:</span>
            {(['original', 'retest', 'difference'] as const).map((m) => (
              <button
                key={m}
                className={`btn tiny ${retestViewMode === m ? 'active' : ''}`}
                onClick={() => setRetestViewMode(m)}
                style={{ textTransform: 'capitalize' }}
              >
                {m === 'original' ? 'Original Event' : m === 'retest' ? 'Retest Run' : 'Difference Delta'}
              </button>
            ))}
          </div>

          {/* Bottom Retest Trigger Bar */}
          <div className="panel p-3 bg-slate-900/90 border border-cyan-500/40 backdrop-blur rounded-lg flex items-center justify-between gap-4 pointer-events-auto self-center w-full max-w-xl">
            <div>
              <div className="tiny faint font-bold text-cyan-300">CONTROLLED RETEST EXECUTION</div>
              <div className="tiny faint mt-0.5">Ramps load progressively (0% → 100%) to verify structural reproducibility.</div>
            </div>

            <button
              className="btn"
              onClick={handleStartProgressiveRetest}
              disabled={isRamping}
              style={{ background: '#0284c7', color: '#fff', fontWeight: 800, padding: '10px 18px', border: 'none' }}
            >
              {isRamping ? `RAMPING LOAD (${rampProgress}%)...` : '⚡ RETEST SAME CONDITION'}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: WHY FLAGGED, COMPARISON & FINAL DECISION */}
        <div className="panel col" style={{ padding: 14, background: 'rgba(12, 16, 21, 0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(56, 189, 248, 0.3)', gap: 10, overflowY: 'auto', pointerEvents: 'auto' }}>
          <div className="spread">
            <span className="tiny faint font-bold uppercase tracking-wider text-cyan-400">Why Was It Flagged?</span>
            <span className="prov prov-ml">ANALYTICS & ML</span>
          </div>

          <div className="panel p-2.5 bg-slate-950/60 border border-slate-800 rounded col gap-1 text-xs">
            <div><span className="faint">Governing Criterion:</span> <strong className="text-red-400">STRESS (280 MPa / 250 MPa Envelope)</strong></div>
            <div><span className="faint">Measured Stress:</span> <strong>{event.peakStressMpa} MPa</strong></div>
            <div><span className="faint">Envelope Limit:</span> <strong>250.0 MPa</strong></div>
            <div><span className="faint">Baseline Deviation:</span> <strong className="text-amber-400">+14.2% vs Baseline B</strong></div>
          </div>

          {/* SIDE-BY-SIDE RETEST COMPARISON TABLE */}
          {retestComparison && (
            <div className="col gap-2 mt-1">
              <span className="tiny faint font-bold uppercase tracking-wider text-emerald-400">Original vs Retest Side-by-Side</span>
              <table className="w-full text-xs font-mono border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="p-1.5 text-left">Metric</th>
                    <th className="p-1.5 text-right text-red-400">Orig</th>
                    <th className="p-1.5 text-right text-cyan-400">Retest</th>
                    <th className="p-1.5 text-right text-emerald-400">Δ Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-1.5 faint">Stress (MPa)</td>
                    <td className="p-1.5 text-right">{retestComparison.originalRun.calculatedStressMpa}</td>
                    <td className="p-1.5 text-right">{retestComparison.retestRun.calculatedStressMpa}</td>
                    <td className="p-1.5 text-right font-bold text-emerald-400">{retestComparison.deltaStressMpa}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 faint">Strain (µε)</td>
                    <td className="p-1.5 text-right">{retestComparison.originalRun.strainPeak}</td>
                    <td className="p-1.5 text-right">{retestComparison.retestRun.strainPeak}</td>
                    <td className="p-1.5 text-right font-bold text-emerald-400">{retestComparison.deltaStrainMicro}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 faint">Disp (mm)</td>
                    <td className="p-1.5 text-right">{retestComparison.originalRun.displacementMm}</td>
                    <td className="p-1.5 text-right">{retestComparison.retestRun.displacementMm}</td>
                    <td className="p-1.5 text-right font-bold text-emerald-400">{retestComparison.deltaDisplacementMm}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 faint">Residual (µε)</td>
                    <td className="p-1.5 text-right text-red-400">{retestComparison.originalRun.residualMicrostrain}</td>
                    <td className="p-1.5 text-right text-emerald-400">{retestComparison.retestRun.residualMicrostrain}</td>
                    <td className="p-1.5 text-right font-bold text-emerald-400">{retestComparison.deltaResidualMicro}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* FINAL ENGINEERING DECISION SIGN-OFF */}
          <div className="col gap-2 mt-2">
            <span className="tiny faint font-bold uppercase tracking-wider text-amber-400">Final Engineering Decision Authority</span>
            
            <div>
              <span className="tiny faint">Lead Validation Engineer Signature:</span>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full mt-1 p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
            </div>

            <div>
              <span className="tiny faint">Engineering Closure Note & Rationale:</span>
              <textarea
                rows={2}
                value={engineerNote}
                onChange={(e) => setEngineerNote(e.target.value)}
                className="w-full mt-1 p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
            </div>

            <div className="grid2 gap-2 mt-1">
              <button
                className="btn tiny"
                onClick={() => handleFinalDecision('CLOSE_RESPONSE_VERIFIED')}
                style={{ background: '#059669', color: '#fff', fontWeight: 800, padding: '8px' }}
              >
                ✓ CLOSE — RESPONSE VERIFIED
              </button>
              <button
                className="btn tiny"
                onClick={() => handleFinalDecision('INSPECTION_REQUIRED')}
                style={{ background: '#d97706', color: '#fff', fontWeight: 800, padding: '8px' }}
              >
                🔬 INSPECTION REQUIRED
              </button>
              <button
                className="btn tiny"
                onClick={() => handleFinalDecision('ESCALATE')}
                style={{ background: '#dc2626', color: '#fff', fontWeight: 800, padding: '8px' }}
              >
                ⚠ ESCALATE REVIEW
              </button>
              <button
                className="btn tiny"
                onClick={() => handleFinalDecision('INCONCLUSIVE')}
                style={{ background: '#475569', color: '#fff', fontWeight: 800, padding: '8px' }}
              >
                ? INCONCLUSIVE
              </button>
            </div>

            {decisionOutcome && (
              <div className="p-2 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold text-center mt-1">
                ✓ Decision [{decisionOutcome}] Saved! Returning to Workbench...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
