/* ============================================================
   SHIELD — Interactive 3D Workbench Gizmos & Load Vector Arrow
   Renders:
   - 3D Applied Force Arrow (magnitude-scaled, vector-oriented)
   - Interactive Load Point Target Rings
   - Dynamic Load Application Waveforms / Contact Stress Rings
   - Real-Time Point Picking & Cursor Probing
   ============================================================ */

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import { MANUAL_LOAD_POINTS } from '../../data/engineering';

export function WorkbenchGizmos() {
  const page = useStore((s) => s.page);
  const manualSelectedLoadPointId = useStore((s) => s.manualSelectedLoadPointId);
  const setManualSelectedLoadPointId = useStore((s) => s.setManualSelectedLoadPointId);
  const manualAppliedForceN = useStore((s) => s.manualAppliedForceN);
  const manualLoadVector = useStore((s) => s.manualLoadVector);
  const manualLoadState = useStore((s) => s.manualLoadState);
  const manualTestPhase = useStore((s) => s.manualTestPhase);
  const select = useStore((s) => s.select);

  const activePoint = MANUAL_LOAD_POINTS.find((p) => p.id === manualSelectedLoadPointId) ?? MANUAL_LOAD_POINTS[0];

  // Calculate direction quaternion for the 3D arrow
  const arrowQuat = useMemo(() => {
    const dir = new THREE.Vector3(...manualLoadVector).normalize();
    const defaultDir = new THREE.Vector3(0, -1, 0);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(defaultDir, dir);
    return q;
  }, [manualLoadVector]);

  // Arrow scale according to force
  const forceRatio = Math.min(1, Math.max(0.1, manualAppliedForceN / 40000));
  const arrowLength = 0.45 + forceRatio * 0.75;
  const isForceActive = manualLoadState !== 'IDLE' && manualAppliedForceN > 0 && manualTestPhase !== 'BEFORE';

  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (rippleRef.current && isForceActive) {
      const t = clock.getElapsedTime() * 4;
      const s = 1 + (t % 1) * 1.5;
      rippleRef.current.scale.set(s, s, s);
      const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, 1 - (t % 1));
    }
  });

  // Only render on workbench or twin pages
  if (page !== 'workbench' && page !== 'digital_eng' && page !== 'twin') return null;

  return (
    <group name="workbench-load-gizmos">
      {/* 1. All Selectable Load Points on Chassis */}
      {MANUAL_LOAD_POINTS.map((lp) => {
        const isSelected = lp.id === activePoint.id;
        return (
          <group key={lp.id} position={lp.pos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                setManualSelectedLoadPointId(lp.id);
                select(lp.componentId);
              }}
              scale={isSelected ? [1.4, 1.4, 1.4] : [1, 1, 1]}
            >
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#f59e0b' : '#06b6d4'}
                emissive={isSelected ? '#d97706' : '#0891b2'}
                emissiveIntensity={isSelected ? 0.9 : 0.4}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>

            {/* Pulsing Target Ring for Active Load Point */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.08, 0.11, 32]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.7} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* 2. Dynamic 3D Load Vector Arrow at Active Load Point */}
      {activePoint && (
        <group position={activePoint.pos}>
          {/* Force Vector Arrow Group */}
          <group quaternion={arrowQuat}>
            {/* Arrow Stem Cylinder (Originating from above point and pointing into the contact surface) */}
            <mesh position={[0, arrowLength / 2 + 0.15, 0]}>
              <cylinderGeometry args={[0.022, 0.022, arrowLength, 16]} />
              <meshStandardMaterial
                color={isForceActive ? '#ef4444' : '#f59e0b'}
                emissive={isForceActive ? '#dc2626' : '#d97706'}
                emissiveIntensity={isForceActive ? 0.8 : 0.3}
                metalness={0.5}
                roughness={0.2}
              />
            </mesh>

            {/* Arrow Head Cone */}
            <mesh position={[0, 0.08, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.075, 0.16, 16]} />
              <meshStandardMaterial
                color={isForceActive ? '#ef4444' : '#f59e0b'}
                emissive={isForceActive ? '#dc2626' : '#d97706'}
                emissiveIntensity={isForceActive ? 0.9 : 0.4}
                metalness={0.5}
                roughness={0.2}
              />
            </mesh>
          </group>

          {/* Dynamic Force Contact Ripple Ring */}
          {isForceActive && (
            <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <ringGeometry args={[0.06, 0.18, 32]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Floating 3D Vector Label */}
          <Html position={[0, arrowLength + 0.3, 0]} center distanceFactor={8}>
            <div
              style={{
                background: 'rgba(12, 16, 21, 0.92)',
                border: `1px solid ${isForceActive ? '#ef4444' : '#f59e0b'}`,
                padding: '4px 8px',
                borderRadius: 5,
                color: '#fff',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}
            >
              <span style={{ color: isForceActive ? '#f87171' : '#fde68a' }}>
                F = {(manualAppliedForceN / 1000).toFixed(1)} kN
              </span>
              <div style={{ fontSize: 9, color: 'var(--faint)', fontWeight: 500 }}>
                {activePoint.id} · {activePoint.region}
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
