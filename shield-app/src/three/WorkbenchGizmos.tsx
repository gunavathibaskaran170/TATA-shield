/* ============================================================
   SHIELD — 3D Engineering Workbench Gizmos & FEA Post-Processing
   - Real-time 3D Force Vectors (↓ F = 25.0 kN) & Load Path Line Routing
   - Pressure Surface Distributed Arrows (↓↓↓↓) in Pressure Mode
   - Peak Response MAX Marker Tag
   - Boundary Condition Fixed Ground Supports (▲)
   - Dynamic FEA Hotspot Pulse Halos
   ============================================================ */

import React, { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { HARDPOINT_PROFILES, calculateStructuralResponse } from '../data/hardpoints';

export const WorkbenchGizmos: React.FC = () => {
  const activeHardpointId = useStore((s) => s.activeHardpointId);
  const forceN = useStore((s) => s.manualAppliedForceN);
  const loadVector = useStore((s) => s.manualLoadVector);
  const tempC = useStore((s) => s.manualTemperatureC);
  const scale = useStore((s) => s.manualDeformationScale);
  const isAmplified = useStore((s) => s.isDeformationAmplified);
  const loadMode = useStore((s) => s.loadMode);
  const contourMode = useStore((s) => s.contourMode);
  const caeStep = useStore((s) => s.caeStep);
  const caeState = useStore((s) => s.caeState);

  const profile = HARDPOINT_PROFILES[activeHardpointId] || HARDPOINT_PROFILES.front_rail_lh;
  const forceKn = forceN / 1000;
  const physics = useMemo(() => calculateStructuralResponse(profile, forceKn, tempC, 'DURING'), [profile, forceKn, tempC]);

  // Nominal position of load point
  const pos = profile.nominalPos;

  // Direction vector normalized
  const dir = useMemo(() => {
    const v = new THREE.Vector3(...loadVector);
    if (v.lengthSq() < 0.001) v.set(0, -1, 0);
    return v.normalize();
  }, [loadVector]);

  // Arrow length scaled by force
  const arrowLength = Math.max(0.6, Math.min(2.5, 0.6 + (forceKn / 50) * 1.5));

  // Arrow start & end position
  const arrowStart = useMemo(() => {
    return [
      pos[0] - dir.x * arrowLength,
      pos[1] - dir.y * arrowLength,
      pos[2] - dir.z * arrowLength,
    ] as [number, number, number];
  }, [pos, dir, arrowLength]);

  // Color according to condition state
  const hotspotColor = physics.conditionState === 'RED' ? '#ef4444' : physics.conditionState === 'AMBER' ? '#f59e0b' : '#06b6d4';

  // Load path points propagating through connected members
  const loadPathPoints = useMemo(() => {
    const p1 = new THREE.Vector3(...pos);
    const p2 = new THREE.Vector3(pos[0] * 0.7, pos[1] - 0.2, pos[2] * 0.5); // Rail joint
    const p3 = new THREE.Vector3(0, pos[1] - 0.25, pos[2] * 0.3);          // Crossmember
    const p4 = new THREE.Vector3(pos[0] > 0 ? 0.8 : -0.8, 0.1, 0.0);        // Rocker sill
    const p5 = new THREE.Vector3(pos[0] > 0 ? 0.6 : -0.6, 0.05, -0.5);      // Battery mount
    return [p1, p2, p3, p4, p5];
  }, [pos]);

  // Grid of surface pressure vectors for Pressure Mode
  const pressureVectors = useMemo(() => {
    if (loadMode !== 'pressure') return [];
    const pts: Array<[number, number, number]> = [];
    const spanX = 0.6;
    const spanZ = 0.8;
    for (let x = -spanX; x <= spanX; x += 0.3) {
      for (let z = -spanZ; z <= spanZ; z += 0.4) {
        pts.push([pos[0] + x * 0.5, pos[1] + 0.35, pos[2] + z * 0.5]);
      }
    }
    return pts;
  }, [loadMode, pos]);

  if (forceKn <= 0.01) return null;

  return (
    <group>
      {/* 3D Force Arrow Vector (Point Load Mode) */}
      {loadMode !== 'pressure' && (
        <>
          <arrowHelper
            args={[
              dir,
              new THREE.Vector3(...arrowStart),
              arrowLength,
              hotspotColor,
              0.3,
              0.15
            ]}
          />
          <Html position={[arrowStart[0], arrowStart[1] + 0.25, arrowStart[2]]} center>
            <div className="px-2.5 py-1 rounded bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg backdrop-blur flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-red-400 font-bold">↓ F</span>
              <span className="font-semibold text-white">{forceKn.toFixed(1)} kN</span>
              <span className="text-[10px] text-slate-400">({profile.code})</span>
            </div>
          </Html>
        </>
      )}

      {/* Surface Pressure Array Vectors (Pressure Mode) */}
      {loadMode === 'pressure' && (
        <group name="surface-pressure-grid">
          {pressureVectors.map((pt, idx) => (
            <arrowHelper
              key={idx}
              args={[
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(pt[0], pt[1] + 0.4, pt[2]),
                0.38,
                '#f59e0b',
                0.12,
                0.06
              ]}
            />
          ))}
          <Html position={[pos[0], pos[1] + 0.8, pos[2]]} center>
            <div className="px-3 py-1 rounded bg-amber-950/90 border border-amber-500 text-amber-300 font-mono text-xs shadow-xl backdrop-blur flex items-center gap-1.5">
              <span className="font-bold">↓↓ Surface Pressure</span>
              <span className="text-white font-semibold">{(forceKn * 18.5).toFixed(0)} kPa</span>
              <span className="text-[10px] text-slate-400">(0.42 m²)</span>
            </div>
          </Html>
        </group>
      )}

      {/* Load Path Propagation Lines */}
      <Line
        points={loadPathPoints}
        color={hotspotColor}
        lineWidth={3}
        dashed
        dashScale={2}
        dashSize={0.2}
        gapSize={0.1}
      />

      {/* Dynamic Stress Hotspot Pulse Halo at Hardpoint */}
      <mesh position={pos}>
        <sphereGeometry args={[0.08 + (physics.stressUtilizationPct / 100) * 0.07, 16, 16]} />
        <meshBasicMaterial color={hotspotColor} transparent opacity={0.8} />
      </mesh>
      <mesh position={pos}>
        <sphereGeometry args={[0.18 + (physics.stressUtilizationPct / 100) * 0.12, 16, 16]} />
        <meshBasicMaterial color={hotspotColor} transparent opacity={0.25} wireframe />
      </mesh>

      {/* PEAK RESPONSE MAX MARKER TAG (ONLY SHOWN IN STEP 8 RESULTS / RESULT STATE) */}
      {(caeStep === 8 || caeState === 'RESULT') && (
        <Html position={[pos[0], pos[1] + 0.35, pos[2]]} center>
          <div className="px-2 py-0.5 rounded bg-red-950/95 border-2 border-red-500 text-red-100 font-mono text-[11px] font-extrabold shadow-2xl flex items-center gap-1.5 animate-bounce">
            <span className="bg-red-600 text-white px-1 rounded text-[9px]">MAX</span>
            <span>
              {contourMode === 'strain'
                ? `${physics.calculatedStrainMicro} µε`
                : contourMode === 'displacement'
                ? `${physics.displacementMm} mm`
                : `${physics.calculatedStressMpa} MPa`}
            </span>
          </div>
        </Html>
      )}

      {/* Reaction Ground Support Boundary Fixed Icons (▲) */}
      {[-0.68, 0.68].map((rx, i) => (
        <group key={i} position={[rx, 0.12, -1.35]}>
          <mesh rotation={[0, 0, 0]}>
            <coneGeometry args={[0.08, 0.16, 4]} />
            <meshStandardMaterial color="#10b981" metalness={0.8} roughness={0.2} />
          </mesh>
          <Html position={[0, -0.15, 0]} center>
            <span className="tiny font-mono font-bold text-emerald-400 bg-slate-950/80 px-1 rounded border border-emerald-800">
              ▲ FIXED SUPP
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
};
