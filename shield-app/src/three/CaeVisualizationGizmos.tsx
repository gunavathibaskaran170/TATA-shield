/* ============================================================
   SHIELD — 3D Mechanical CAE Preprocessing & Post-Processing Gizmos
   - Step 1-5 Preprocessing: Neutral grey structure + Clean Engineering Support Symbols (▲) + Load Arrows (100 kN →→→)
   - Step 6 Mesh: FEA Wireframe Mesh Visualization
   - Step 8 Post-Processing: ANSYS Spatial Scalar Stress Contour & Interactive Result Probe
   ============================================================ */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { CAE_LOAD_CASES } from '../data/engineering';

interface CaeVisualizationProps {
  caeState: 'SETUP' | 'RUNNING' | 'RESPONSE' | 'RESULT';
  animationProgress: number;
  caeMetric: 'stress' | 'strain' | 'displacement' | 'loadpath';
  deformationScale: number;
}

export const CaeVisualizationGizmos: React.FC<CaeVisualizationProps> = ({
  caeState,
  animationProgress,
  caeMetric,
  deformationScale,
}) => {
  const activeCaeLoadCase = useStore((s) => s.activeCaeLoadCase);
  const caeStep = useStore((s) => s.caeStep);
  const caeProbeActive = useStore((s) => s.caeProbeActive);
  const caeProbeData = useStore((s) => s.caeProbeData);
  const setCaeProbeData = useStore((s) => s.setCaeProbeData);
  const wireframeOpacity = useStore((s) => s.wireframeOpacity);
  const activeCae = CAE_LOAD_CASES[activeCaeLoadCase] || CAE_LOAD_CASES.battery_enclosure;

  const pulseRef = useRef<number>(0);
  const plateMeshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    pulseRef.current += delta;
    if (plateMeshRef.current && caeState === 'RUNNING') {
      const offset = (1 - animationProgress) * 0.25;
      if (activeCaeLoadCase === 'battery_enclosure' || activeCaeLoadCase === 'kerb_strike') {
        plateMeshRef.current.position.x = -1.25 + offset;
      }
    }
  });

  const config = useMemo(() => {
    switch (activeCaeLoadCase) {
      case 'battery_enclosure':
        return {
          targetPos: [-0.92, 0.32, 0.0] as [number, number, number],
          highlightBox: { size: [0.3, 0.45, 2.2] as [number, number, number], pos: [-0.85, 0.3, 0.0] as [number, number, number] },
          loadType: 'plate',
          magnitude: '100 kN',
          direction: '+Y (Transverse Inward)',
          region: 'LH Rocker / Battery Enclosure',
          fixedSupports: [[0.88, 0.3, 0.8], [0.88, 0.3, -0.8]] as [number, number, number][],
          loadPath: [[-0.92, 0.32, 0], [-0.5, 0.3, 0], [0, 0.3, 0], [0.5, 0.3, 0], [0.88, 0.3, 0]],
        };
      case 'kerb_strike':
        return {
          targetPos: [-0.88, 0.32, 1.25] as [number, number, number],
          highlightBox: { size: [0.35, 0.4, 0.6] as [number, number, number], pos: [-0.82, 0.32, 1.25] as [number, number, number] },
          loadType: 'point_lateral',
          magnitude: '32.0 kN',
          direction: 'Lateral +X',
          region: 'Front LH Lower Control Arm Hardpoint',
          fixedSupports: [[0.88, 0.3, 1.25], [0.88, 0.3, -1.25]] as [number, number, number][],
          loadPath: [[-0.88, 0.32, 1.25], [-0.4, 0.3, 1.1], [0, 0.3, 0.8], [0.4, 0.3, 1.1], [0.88, 0.3, 1.25]],
        };
      case 'underbody_intrusion':
        return {
          targetPos: [0.0, 0.05, 0.1] as [number, number, number],
          highlightBox: { size: [1.1, 0.15, 1.8] as [number, number, number], pos: [0.0, 0.08, 0.1] as [number, number, number] },
          loadType: 'cone_underbody',
          magnitude: '45.0 kN',
          direction: 'Vertical +Y',
          region: 'Center Floor Battery Skid Plate',
          fixedSupports: [[-0.8, 0.3, 1.2], [0.8, 0.3, 1.2], [-0.8, 0.3, -1.2], [0.8, 0.3, -1.2]] as [number, number, number][],
          loadPath: [[0, 0.05, 0.1], [0, 0.25, 0.1], [-0.55, 0.28, 0.1], [0.55, 0.28, 0.1]],
        };
      case 'bending':
        return {
          targetPos: [0.0, 0.35, 0.0] as [number, number, number],
          highlightBox: { size: [1.2, 0.2, 2.4] as [number, number, number], pos: [0.0, 0.35, 0.0] as [number, number, number] },
          loadType: 'distributed_down',
          magnitude: '24.8 kN',
          direction: 'Vertical -Y',
          region: 'Center Floor Pan & Mid-Rocker Rails',
          fixedSupports: [[-0.68, 0.35, 1.45], [0.68, 0.35, 1.45], [-0.68, 0.35, -1.45], [0.68, 0.35, -1.45]] as [number, number, number][],
          loadPath: [[0, 0.35, 0], [0, 0.35, 1.2], [0, 0.35, -1.2], [-0.7, 0.35, 0], [0.7, 0.35, 0]],
        };
      case 'torsion':
        return {
          targetPos: [0.0, 0.45, 1.35] as [number, number, number],
          highlightBox: { size: [1.5, 0.5, 0.8] as [number, number, number], pos: [0.0, 0.5, 1.35] as [number, number, number] },
          loadType: 'torsion_couple',
          magnitude: '±3000 Nm',
          direction: 'Opposing Wheel Couple',
          region: 'Front Axle Spindles / A-Pillar Joint',
          fixedSupports: [[-0.65, 0.45, -1.45], [0.65, 0.45, -1.45]] as [number, number, number][],
          loadPath: [[-0.68, 0.45, 1.35], [-0.4, 0.6, 1.0], [0, 0.7, 0.5], [0.4, 0.6, 1.0], [0.68, 0.45, 1.35]],
        };
      default:
        return {
          targetPos: [-0.92, 0.32, 0.0] as [number, number, number],
          highlightBox: { size: [0.3, 0.45, 2.2] as [number, number, number], pos: [-0.85, 0.3, 0.0] as [number, number, number] },
          loadType: 'plate',
          magnitude: '100 kN',
          direction: '+Y',
          region: 'LH Rocker',
          fixedSupports: [[0.88, 0.3, 0.8], [0.88, 0.3, -0.8]] as [number, number, number][],
          loadPath: [[-0.92, 0.32, 0], [0, 0.3, 0], [0.88, 0.3, 0]],
        };
    }
  }, [activeCaeLoadCase]);

  const peakColor = activeCae.peakStressMpa > 400 ? '#ef4444' : activeCae.peakStressMpa > 300 ? '#f59e0b' : '#06b6d4';

  // Result Probe Click Handler
  const handleProbeClick = (e: any) => {
    if (!caeProbeActive && caeStep !== 8) return;
    e.stopPropagation();
    const pt = e.point as THREE.Vector3;
    const distToPeak = pt.distanceTo(new THREE.Vector3(...config.targetPos));
    const factor = Math.max(0.2, 1 - distToPeak / 2.5);
    const stress = Math.round(activeCae.peakStressMpa * factor);
    const strain = Math.round(stress * 4.8);
    const disp = Math.round(activeCae.maxDeflectionMm * factor * 10) / 10;

    setCaeProbeData({
      location: activeCae.criticalRegion,
      stressMpa: stress,
      strainMicro: strain,
      dispMm: disp,
      coords: [Math.round(pt.x * 1000), Math.round(pt.y * 1000), Math.round(pt.z * 1000)],
    });
  };

  return (
    <group name="cae-visualization-gizmos">

      {/* ------------------------------------------------------------
          1. PREPROCESSING STEPS 1-5: GEOMETRY / LOADS / SUPPORTS
          ------------------------------------------------------------ */}
      {(caeStep <= 5 || caeState === 'SETUP' || caeState === 'RUNNING') && (
        <group>
          {/* Target Structural Region Highlight Wireframe */}
          <group position={config.highlightBox.pos}>
            <mesh>
              <boxGeometry args={config.highlightBox.size} />
              <meshBasicMaterial color="#0284c7" transparent opacity={Math.min(0.8, 0.25 * wireframeOpacity * 2.5)} depthWrite={false} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(...config.highlightBox.size)]} />
              <lineBasicMaterial color="#38bdf8" transparent opacity={Math.min(1.0, 0.8 * wireframeOpacity * 1.25)} linewidth={2} />
            </lineSegments>
          </group>

          {/* Clean Engineering Support Symbols (▲ FIXED SUPP) */}
          {(caeStep === 4 || caeStep === 5 || caeStep === 7) &&
            config.fixedSupports.map((suppPos, idx) => (
              <group key={idx} position={suppPos}>
                <mesh>
                  <coneGeometry args={[0.08, 0.16, 4]} />
                  <meshStandardMaterial color="#10b981" metalness={0.8} roughness={0.2} />
                </mesh>
                <Html position={[0, -0.16, 0]} center>
                  <span className="tiny font-mono font-bold text-emerald-400 bg-slate-950/90 px-1.5 py-0.5 rounded border border-emerald-800 shadow">
                    ▲ FIXED SUPP
                  </span>
                </Html>
              </group>
            ))}

          {/* Clean Engineering Load Arrows (100 kN →→→) */}
          {(caeStep === 5 || caeStep === 7 || caeState === 'RUNNING') && (
            <group>
              {config.loadType === 'plate' && (
                <group>
                  <mesh ref={plateMeshRef} position={[-1.25, 0.32, 0.0]}>
                    <boxGeometry args={[0.08, 0.5, 2.0]} />
                    <meshStandardMaterial color="#dc2626" metalness={0.9} roughness={0.2} />
                  </mesh>
                  {[-0.6, 0.0, 0.6].map((z, idx) => (
                    <arrowHelper
                      key={idx}
                      args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1.75, 0.32, z), 0.48, '#ef4444', 0.16, 0.08]}
                    />
                  ))}
                  <Html position={[-1.4, 0.65, 0]} center>
                    <div className="px-2.5 py-1 rounded bg-slate-950/95 border-2 border-red-500 text-red-200 font-mono text-xs font-bold shadow-2xl">
                      {config.magnitude} →→→
                    </div>
                  </Html>
                </group>
              )}

              {config.loadType === 'distributed_down' && (
                <group>
                  {[-0.4, 0.0, 0.4].map((x, i) =>
                    [-0.8, -0.2, 0.4, 0.8].map((z, j) => (
                      <arrowHelper key={`${i}-${j}`} args={[new THREE.Vector3(0, -1, 0), new THREE.Vector3(x, 0.85, z), 0.45, '#f59e0b', 0.14, 0.07]} />
                    ))
                  )}
                  <Html position={[0, 0.95, 0]} center>
                    <div className="px-2.5 py-1 rounded bg-slate-950/95 border border-amber-500 text-amber-200 font-mono text-xs font-bold shadow-2xl">
                      ↓↓↓↓ {config.magnitude} DISTRIBUTED
                    </div>
                  </Html>
                </group>
              )}
            </group>
          )}
        </group>
      )}

      {/* ------------------------------------------------------------
          2. STEP 8: POST-PROCESSING RESULTS & SPATIAL STRESS CONTOUR
          ------------------------------------------------------------ */}
      {(caeStep === 8 || caeState === 'RESULT') && (
        <group onClick={handleProbeClick}>
          {caeMetric !== 'loadpath' && (
            <group>
              {/* Spatial Peak Hotspot */}
              <mesh position={config.targetPos}>
                <sphereGeometry args={[0.12, 24, 24]} />
                <meshBasicMaterial color={peakColor} transparent opacity={0.85} />
              </mesh>
              <mesh position={config.targetPos}>
                <sphereGeometry args={[0.26, 24, 24]} />
                <meshBasicMaterial color={peakColor} transparent opacity={0.3} wireframe />
              </mesh>

              {/* Peak MAX Tag */}
              <Html position={[config.targetPos[0], config.targetPos[1] + 0.38, config.targetPos[2]]} center>
                <div className="px-2 py-0.5 rounded bg-red-950/95 border-2 border-red-500 text-red-100 font-mono text-xs font-extrabold shadow-2xl flex items-center gap-1.5">
                  <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px]">MAX</span>
                  <span>
                    {caeMetric === 'strain'
                      ? `${Math.round(activeCae.peakStressMpa * 4.8)} µε`
                      : caeMetric === 'displacement'
                      ? `${activeCae.maxDeflectionMm.toFixed(1)} mm`
                      : `${activeCae.peakStressMpa} MPa`}
                  </span>
                </div>
              </Html>

              {/* Minimum Response MIN Tag */}
              <Html position={[0.88, 0.35, -1.2]} center>
                <div className="px-2 py-0.5 rounded bg-blue-950/90 border border-blue-500 text-blue-200 font-mono text-[10px] font-bold shadow">
                  MIN 0 MPa
                </div>
              </Html>
            </group>
          )}

          {/* Load Path Transfer Routing */}
          {caeMetric === 'loadpath' && (
            <Line
              points={config.loadPath.map((p) => new THREE.Vector3(...p))}
              color="#06b6d4"
              lineWidth={4}
              dashed
              dashScale={2}
              dashSize={0.25}
              gapSize={0.12}
            />
          )}

          {/* Interactive Probe Marker if Clicked */}
          {caeProbeData && (
            <group position={[caeProbeData.coords[0] / 1000, caeProbeData.coords[1] / 1000, caeProbeData.coords[2] / 1000]}>
              <mesh>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial color="#00e5ff" />
              </mesh>
              <Html position={[0, 0.25, 0]} center>
                <div className="panel p-2.5 bg-slate-950/95 border border-cyan-400 rounded-lg text-xs font-mono col gap-1 shadow-2xl min-w-[160px]">
                  <div className="spread font-bold text-cyan-300">
                    <span>PROBE READOUT</span>
                    <button className="text-slate-400 hover:text-white" onClick={() => setCaeProbeData(null)}>✕</button>
                  </div>
                  <div className="spread text-[11px]"><span className="faint">Region:</span><span>{caeProbeData.location}</span></div>
                  <div className="spread text-[11px]"><span className="faint">Stress:</span><span className="text-amber-400 font-bold">{caeProbeData.stressMpa} MPa</span></div>
                  <div className="spread text-[11px]"><span className="faint">Strain:</span><span className="text-sky-300">{caeProbeData.strainMicro} µε</span></div>
                  <div className="spread text-[11px]"><span className="faint">Disp:</span><span className="text-amber-300">{caeProbeData.dispMm} mm</span></div>
                  <div className="tiny faint pt-1 border-t border-slate-800">
                    Coords: [{caeProbeData.coords.join(', ')}] mm
                  </div>
                </div>
              </Html>
            </group>
          )}
        </group>
      )}

    </group>
  );
};
