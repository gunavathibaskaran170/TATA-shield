/* ============================================================
   SHIELD — ANSYS CAE-Style Numeric Structural Contour Legend
   Displays continuous color gradient (Dark Blue -> Cyan -> Green -> Yellow -> Orange -> Red)
   with dynamic calculated numeric scale bounds for Stress, Strain, or Displacement.
   ============================================================ */

import React from 'react';
import { useStore } from '../store/useStore';
import { HARDPOINT_PROFILES, calculateStructuralResponse } from '../data/hardpoints';

export const CaelineLegend: React.FC = () => {
  const activeHardpointId = useStore((s) => s.activeHardpointId);
  const manualAppliedForceN = useStore((s) => s.manualAppliedForceN);
  const manualTemperatureC = useStore((s) => s.manualTemperatureC);
  const manualTestPhase = useStore((s) => s.manualTestPhase);
  const contourMode = useStore((s) => s.contourMode);

  const profile = HARDPOINT_PROFILES[activeHardpointId] || HARDPOINT_PROFILES.front_rail_lh;
  const forceKn = manualAppliedForceN / 1000;
  const physics = calculateStructuralResponse(profile, forceKn, manualTemperatureC, manualTestPhase);

  // Dynamic Scale Bounds based on field
  let title = 'VON MISES EQUIVALENT STRESS';
  let unit = 'MPa';
  let maxVal = Math.max(50, Math.round(physics.calculatedStressMpa * 1.15));
  let minVal = 0;

  if (contourMode === 'strain') {
    title = 'ELASTIC STRAIN';
    unit = 'µε';
    maxVal = Math.max(100, Math.round(physics.calculatedStrainMicro * 1.15));
    minVal = 0;
  } else if (contourMode === 'displacement') {
    title = 'TOTAL DEFORMATION';
    unit = 'mm';
    maxVal = Math.max(1.0, Math.round(physics.displacementMm * 1.2 * 10) / 10);
    minVal = 0;
  } else if (contourMode === 'load_path') {
    title = 'LOAD PATH TRANSMISSION';
    unit = 'kN';
    maxVal = Math.max(5, Math.round(forceKn * 1.1 * 10) / 10);
    minVal = 0;
  }

  const stepVal = (maxVal - minVal) / 6;

  return (
    <div
      className="cae-legend-container"
      style={{
        position: 'absolute',
        left: 20,
        top: 80,
        zIndex: 5,
        padding: '12px 14px',
        background: 'rgba(12, 16, 21, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: 8,
        color: '#fff',
        fontFamily: 'var(--mono, monospace)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 190,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto',
      }}
    >
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: '#38bdf8' }}>
          {title}
        </div>
        <div style={{ fontSize: 9, color: '#94a3b8' }}>Units: [{unit}]</div>
      </div>

      {/* Vertical Continuous Gradient Legend Bar & Ticks */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {/* Continuous CAE Color Bar */}
        <div
          style={{
            width: 14,
            borderRadius: 4,
            background: 'linear-gradient(180deg, #ef4444 0%, #f97316 20%, #eab308 40%, #22c55e 60%, #06b6d4 80%, #1e3a8a 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />

        {/* Ticks & Values */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, height: 160 }}>
          <div style={{ color: '#ef4444' }}>{maxVal.toFixed(1)} <span style={{ fontSize: 9, opacity: 0.7 }}>MAX</span></div>
          <div style={{ color: '#f97316' }}>{(minVal + stepVal * 5).toFixed(1)}</div>
          <div style={{ color: '#eab308' }}>{(minVal + stepVal * 4).toFixed(1)}</div>
          <div style={{ color: '#22c55e' }}>{(minVal + stepVal * 3).toFixed(1)}</div>
          <div style={{ color: '#06b6d4' }}>{(minVal + stepVal * 2).toFixed(1)}</div>
          <div style={{ color: '#3b82f6' }}>{(minVal + stepVal * 1).toFixed(1)}</div>
          <div style={{ color: '#60a5fa' }}>{minVal.toFixed(1)} <span style={{ fontSize: 9, opacity: 0.7 }}>MIN</span></div>
        </div>
      </div>

      {/* Dynamic Peak Marker Info */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, fontSize: 9.5 }}>
        <span style={{ opacity: 0.7 }}>Max Region:</span>{' '}
        <strong style={{ color: '#f59e0b' }}>{profile.code}</strong>
      </div>
    </div>
  );
};
