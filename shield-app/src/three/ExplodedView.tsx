/* ============================================================
   Exploded-isometric CAD cutaway presentation.

   Reproduces the convention of the supplied exploded-assembly
   render: a light studio field, the ghosted body shell lifted
   clear of a fully fanned-out rolling chassis, thin dimension
   leader lines running out to small uppercase callouts, a title
   block, an axis gizmo and a footer disclaimer.

   Explode offsets are the ones in the supplied definition
   (`EV_SUV_Exploded_Assembly`, EXPLODE_FACTOR = 1), converted
   from its CAD axes (+X aft, +Y left, +Z up) into the app's
   convention (+x right, +y up, +z forward):

     body shell        +Z 1300  ->  +y 1.30
     battery pack      -Z  450  ->  -y 0.45
     front e-drive     -X  500  ->  +z 0.50
     rear e-drive      +X  500  ->  -z 0.50
     cooling module    -X  900  ->  +z 0.90
     wheels            ±Y  260  ->  ±x 0.26
     instruments       +Z  220  ->  +y 0.22
     controller box    +Y  700  ->  +x 0.70
   ============================================================ */

import * as THREE from 'three';
import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { D } from '../schema/dims';

export const EXPLODE = {
  bodyY: 1.3,
  batteryY: -0.45,
  frontDriveZ: 0.5,
  rearDriveZ: -0.5,
  coolingZ: 0.9,
  wheelX: 0.26,
  sensorY: 0.22,
  boxX: 0.7,
  boxLidY: 0.26,
  boxElectronicsY: 0.13,
} as const;

/* ------------------------------------------------------------
   Leader line + uppercase callout.

   A thin two-segment line runs from the component anchor out to
   a label, exactly like a dimension leader on a drawing.
   ------------------------------------------------------------ */
function Leader(props: {
  at: [number, number, number];
  to: [number, number, number];
  label: string;
  color?: string;
}) {
  const { at, to, label, color = '#16232d' } = props;
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...at);
    const b = new THREE.Vector3(...to);
    /* elbow: run out along the dominant axis, then straight to the label */
    const elbow = new THREE.Vector3(b.x, a.y, a.z);
    const curve = new THREE.CatmullRomCurve3([a, elbow, b], false, 'catmullrom', 0.0);
    return new THREE.TubeGeometry(curve, 16, 0.005, 6, false);
  }, [at, to]);

  return (
    <group>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={0.8} depthTest={false} />
      </mesh>
      {/* anchor dot on the component */}
      <mesh position={at}>
        <sphereGeometry args={[0.016, 10, 8]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <Html
        position={to}
        center
        zIndexRange={[40, 10]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            whiteSpace: 'nowrap',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color,
            textTransform: 'uppercase',
            userSelect: 'none',
            /* light chip so the callout stays legible over geometry */
            background: 'rgba(247,249,250,0.92)',
            border: '1px solid rgba(120,134,144,0.55)',
            borderRadius: 2,
            padding: '2px 6px',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

/* The six callouts named in the reference render. Targets are kept
   well inside the frame so long labels are never clipped. */
const CALLOUTS: { at: [number, number, number]; to: [number, number, number]; label: string }[] = [
  {
    at: [0, 0.38, 1.365 + EXPLODE.frontDriveZ],
    to: [1.02, 1.42, 2.02 + EXPLODE.frontDriveZ],
    label: 'FRONT E-MOTOR',
  },
  {
    at: [0, 0.38, -1.365 + EXPLODE.rearDriveZ],
    to: [-1.05, 1.42, -2.02 + EXPLODE.rearDriveZ],
    label: 'REAR E-DRIVE MODULE',
  },
  {
    at: [0, 0.23 + EXPLODE.batteryY, 0],
    to: [-1.3, -0.82 + EXPLODE.batteryY, 0.4],
    label: '100 kWh BATTERY PACK',
  },
  {
    at: [D.railX, 0.23, 0.1],
    to: [1.28, -0.16, 0.85],
    label: 'CHASSIS RAILS',
  },
  {
    at: [D.railX, 0.5, -1.425],
    to: [1.4, 1.42, -1.3],
    label: 'MULTI-LINK SUSPENSION',
  },
  {
    at: [0, D.wheelY, D.railFront - 0.05 + EXPLODE.coolingZ],
    to: [0.9, 1.72, D.railFront + EXPLODE.coolingZ - 0.2],
    label: 'COOLING MODULE',
  },
];

export function ExplodedCallouts() {
  return (
    <group>
      {CALLOUTS.map((c) => (
        <Leader key={c.label} at={c.at} to={c.to} label={c.label} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------
   Axis gizmo.

   Drawn as an SVG DOM overlay pinned to the top-right of the
   viewport rather than as scene geometry, so it always lands in
   the corner and never gets occluded or lost off-frame.
   ------------------------------------------------------------ */
function AxisGizmo() {
  const AXES: { x2: number; y2: number; color: string; label: string }[] = [
    { x2: 44, y2: 0, color: '#c0392b', label: 'X' },
    { x2: 0, y2: -44, color: '#27863a', label: 'Y' },
    { x2: -32, y2: 26, color: '#2f5fbf', label: 'Z' },
  ];
  const O = 30; // gizmo origin inside the 64x64 box
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 14,
        zIndex: 20,
        pointerEvents: 'none',
        width: 64,
        height: 64,
      }}
    >
      <svg width="64" height="64" viewBox="0 0 64 64">
        {AXES.map((a) => (
          <g key={a.label}>
            <line x1={O} y1={O} x2={O + a.x2} y2={O + a.y2} stroke={a.color} strokeWidth="1.6" />
            <circle cx={O + a.x2} cy={O + a.y2} r="2" fill={a.color} />
            <text
              x={O + a.x2 * 1.28}
              y={O + a.y2 * 1.28 + 3.5}
              fill={a.color}
              fontSize="9.5"
              fontWeight="700"
              fontFamily="ui-monospace, Menlo, Consolas, monospace"
              textAnchor="middle"
            >
              {a.label}
            </text>
          </g>
        ))}
        <circle cx={O} cy={O} r="2.2" fill="#5a6b78" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------
   Full overlay: title block, gizmo, footer.
   Rendered as a DOM overlay above the canvas so the type stays
   crisp at any resolution.
   ------------------------------------------------------------ */
export function CadOverlay() {
  return (
    <>
      {/* title block — top left */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          zIndex: 20,
          pointerEvents: 'none',
          border: '1px solid #aeb8bf',
          background: 'rgba(250,251,252,0.9)',
          padding: '8px 12px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          color: '#16222b',
          lineHeight: 1.45,
        }}
      >
        <div style={{ fontWeight: 800, letterSpacing: '0.04em', fontSize: 12.5 }}>
          PROJECT: EV SUV PLATFORM
        </div>
        <div style={{ fontSize: 11.5 }}>DRV-SK-001</div>
        <div style={{ fontSize: 11.5 }}>SCALE 1:15</div>
      </div>

      <AxisGizmo />

      {/* footer disclaimer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          textAlign: 'center',
          pointerEvents: 'none',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 9.5,
          letterSpacing: '0.05em',
          color: '#e6edf2',
          background: 'rgba(28,40,50,0.82)',
          padding: '4px 8px',
        }}
      >
        SHIELD EV STRUCTURAL PLATFORM • FULL COMPONENT CAD ARCHITECTURE & SYSTEM INTEGRATION
      </div>
    </>
  );
}

export function ExplodedOverlays() {
  return <ExplodedCallouts />;
}
