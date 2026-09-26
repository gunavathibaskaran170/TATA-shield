import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { Box, Rod } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { ARCH, buildShellGeometry, shellArc, shellPoint, type ShellSide } from '../bodyShell';

/* ============================================================
   SHIELD — exterior envelope, closures and glass.

   The visible body is a single continuous lofted surface (see
   bodyShell.ts) chopped into selectable components.  That keeps
   the silhouette smooth from every 360° angle while preserving
   the component-level interaction contract (click a fender, a
   door, the roof, the tailgate …).

   The skin is deliberately rendered as "body in white" ghost
   glass, matching the supplied CAD reference: the skateboard,
   battery modules, motors and coil-over suspension stay readable
   straight through the body.

   The envelope is sized to enclose the supplied parametric
   chassis (2.85 m wheelbase, R380 wheels, 1.70 m rail span), so
   the wheels tuck under the arches and the rails run inside the
   sills.  The surface itself is a DEMO surrogate, not OEM CAD.

   Styling cues taken from the reference: short front overhang,
   cab-forward volume, high beltline, tall greenhouse, flared
   and clad wheel arches, blacked-out roof with rails, shark-fin
   antenna, roof spoiler, full-width front light bar, connected
   rear light bar, dark lower intake and skid plates.
   ============================================================ */

/* Cross-section bands, expressed as `t` (see ringT):
     0 … 0.56   flank — bumpers, arches, sills, doors, quarters
     0.56 … 0.80 greenhouse — windshield, side glass, backlight
     0.80 … 1.0  upper surface — hood, roof, tailgate          */
const T_SIDE_TO = 0.56;
const T_GLASS_FROM = 0.5601;
const T_GLASS_TO = 0.795;
const T_TOP_FROM = 0.8;

type Mat = 'body' | 'glass';

interface ZoneProps {
  zFrom: number;
  zTo: number;
  tFrom?: number;
  tTo?: number;
  side?: ShellSide;
  capFront?: boolean;
  capRear?: boolean;
  mat?: Mat;
}

/** One piece of the lofted envelope. */
function Shell({ zFrom, zTo, tFrom = 0, tTo = 1, side = 'both', capFront, capRear, mat = 'body' }: ZoneProps) {
  const viewMode = useStore((s) => s.viewMode);
  const geo = useMemo(
    () => buildShellGeometry({ zFrom, zTo, tFrom, tTo, side, capFront, capRear }),
    [zFrom, zTo, tFrom, tTo, side, capFront, capRear],
  );

  const matProps = useMemo(() => {
    if (viewMode === 'complete') {
      return mat === 'glass'
        ? { color: '#0f131a', metalness: 0.9, roughness: 0.05, transparent: false, opacity: 1.0, side: THREE.DoubleSide }
        : { color: '#c5cbd3', metalness: 0.88, roughness: 0.18, transparent: false, opacity: 1.0, side: THREE.DoubleSide };
    }
    return mat === 'glass' ? M.glassGhost : M.bodyShell;
  }, [viewMode, mat]);

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial {...matProps} />
    </mesh>
  );
}

/** A trim tube that hugs the skin — used for the wrap-around light bars. */
function SurfaceBar(props: { points: THREE.Vector3[]; radius?: number; children: ReactNode }) {
  const { points, radius = 0.024, children } = props;
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, Math.max(24, points.length * 2), radius, 8, false);
  }, [points, radius]);
  return <mesh geometry={geo}>{children}</mesh>;
}

/* Surface anchors, resolved once against the loft. */
const SP = (z: number, t: number, s: 1 | -1 = 1) => shellPoint(z, t, s);

/* Front full-width DRL: sweeps across the nose cap, proud of it. */
const DRL_Z = 2.202;
const DRL_RIGHT = shellArc(DRL_Z, 0.5, 0.995, 1, 18);
const DRL_LEFT = shellArc(DRL_Z, 0.5, 0.995, -1, 18).reverse();
/* Rear connected light bar across the tail. */
const TAIL_Z = -2.252;
const TAIL_RIGHT = shellArc(TAIL_Z, 0.58, 0.995, 1, 16);
const TAIL_LEFT = shellArc(TAIL_Z, 0.58, 0.995, -1, 16).reverse();

/* ------------------------------------------------------------
   Wheel-arch cladding — the chunky black arch the reference
   wears over every corner.  Centred just outboard of the body
   surface at the arch lip so it straddles the flare.
   ------------------------------------------------------------ */
function ArchTrim({ s, z }: { s: 1 | -1; z: number }) {
  return (
    <mesh position={[s * 1.07, ARCH.wheelY, z]} rotation={[0, Math.PI / 2, 0]} castShadow>
      <torusGeometry args={[ARCH.radius, 0.055, 8, 28, Math.PI]} />
      <meshStandardMaterial {...M.cladding} />
    </mesh>
  );
}

const CORNERS = [
  { cid: 'ArchCladding_FL', s: -1 as const, z: ARCH.frontZ },
  { cid: 'ArchCladding_FR', s: 1 as const, z: ARCH.frontZ },
  { cid: 'ArchCladding_RL', s: -1 as const, z: ARCH.rearZ },
  { cid: 'ArchCladding_RR', s: 1 as const, z: ARCH.rearZ },
];

export function Exterior() {
  return (
    <group>
      {/* ============ lofted envelope, split into components ============ */}

      {/* front fascia — the only piece with a nose cap */}
      <Sel cid="FrontBumper">
        <Shell zFrom={1.98} zTo={2.2} capFront />
        {/* lower intake */}
        <Box args={[1.22, 0.2, 0.08]} position={[0, 0.68, 2.1]}>
          <meshStandardMaterial {...M.cladding} />
        </Box>
        {[-0.38, -0.19, 0, 0.19, 0.38].map((x) => (
          <Box key={x} args={[0.04, 0.16, 0.03]} position={[x, 0.68, 2.135]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
        ))}
        {/* skid plate */}
        <Box args={[1.0, 0.05, 0.22]} position={[0, 0.4, 2.13]} rotation={[0.2, 0, 0]}>
          <meshStandardMaterial {...M.skidPlate} />
        </Box>
        {/* corner air curtains */}
        {([-1, 1] as const).map((s) => (
          <Box key={s} args={[0.12, 0.18, 0.14]} position={[s * 0.88, 0.63, 2.02]}>
            <meshStandardMaterial {...M.cladding} />
          </Box>
        ))}
      </Sel>

      {/* bonnet */}
      <Sel cid="Hood">
        <Shell zFrom={1.05} zTo={1.98} tFrom={T_GLASS_FROM} />
        <Box args={[1.5, 0.012, 0.02]} position={[0, 1.21, 1.08]} rotation={[0.28, 0, 0]}>
          <meshStandardMaterial {...M.steelDark2} />
        </Box>
      </Sel>

      {/* front wings / arches */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'FrontFender_L' : 'FrontFender_R'}>
          <Shell zFrom={0.51} zTo={1.98} tTo={T_SIDE_TO} side={s < 0 ? 'L' : 'R'} />
        </Sel>
      ))}

      {/* windscreen + A-pillar band */}
      <Sel cid="Windshield">
        <Shell zFrom={0.51} zTo={1.05} tFrom={T_GLASS_FROM} mat="glass" />
        {/* cowl / wiper trough */}
        <Box args={[1.48, 0.03, 0.12]} position={[0, 1.23, 1.06]} rotation={[0.3, 0, 0]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>

      {/* front doors */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'Door_FL' : 'Door_FR'}>
          <Shell zFrom={-0.07} zTo={0.51} tTo={T_SIDE_TO} side={s < 0 ? 'L' : 'R'} />
        </Sel>
      ))}

      {/* roof */}
      <Sel cid="RoofPanel">
        <Shell zFrom={-1.44} zTo={0.51} tFrom={T_TOP_FROM} />
        {/* roof rails */}
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.57, 0, 0]}>
            <Box args={[0.05, 0.035, 1.5]} position={[0, 1.652, -0.45]}>
              <meshStandardMaterial {...M.roofBlack} />
            </Box>
            {[0.08, -0.98].map((z) => (
              <Box key={z} args={[0.07, 0.05, 0.13]} position={[0, 1.625, z]}>
                <meshStandardMaterial {...M.roofBlack} />
              </Box>
            ))}
          </group>
        ))}
        {/* shark-fin antenna */}
        <mesh position={[0, 1.655, -1.32]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.06, 0.14, 3]} />
          <meshStandardMaterial {...M.roofBlack} />
        </mesh>
        {/* roof spoiler over the backlight */}
        <Box args={[1.34, 0.045, 0.28]} position={[0, 1.6, -1.53]} rotation={[-0.22, 0, 0]}>
          <meshStandardMaterial {...M.roofBlack} />
        </Box>
      </Sel>

      {/* side glass */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'SideGlass_L' : 'SideGlass_R'}>
          <Shell zFrom={-1.44} zTo={-0.07} tFrom={T_GLASS_FROM} tTo={T_GLASS_TO} side={s < 0 ? 'L' : 'R'} mat="glass" />
        </Sel>
      ))}

      {/* rear doors */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'Door_RL' : 'Door_RR'}>
          <Shell zFrom={-0.88} zTo={-0.07} tTo={T_SIDE_TO} side={s < 0 ? 'L' : 'R'} />
        </Sel>
      ))}

      {/* rear quarters — continuous to tail (-2.25 m) */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'QuarterPanel_L' : 'QuarterPanel_R'}>
          <Shell zFrom={-2.25} zTo={-0.88} tTo={T_SIDE_TO} side={s < 0 ? 'L' : 'R'} />
        </Sel>
      ))}

      {/* backlight / rear window glass */}
      <Sel cid="RearGlass">
        <Shell zFrom={-2.05} zTo={-1.44} tFrom={T_GLASS_FROM} mat="glass" />
        {/* high-mounted brake light */}
        <Box args={[0.46, 0.03, 0.02]} position={[0, 1.56, -1.5]} rotation={[-0.35, 0, 0]}>
          <meshStandardMaterial {...M.lampRed} />
        </Box>
        {/* rear wiper */}
        <Rod a={[0.02, 1.4, -1.63]} b={[-0.32, 1.24, -1.79]} r={0.012}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Rod>
      </Sel>

      {/* tailgate — seamless rear hatch envelope */}
      <Sel cid="Tailgate">
        <Shell zFrom={-2.25} zTo={-1.44} tFrom={T_SIDE_TO} capRear />
        <Box args={[1.32, 0.012, 0.02]} position={[0, 1.32, -1.78]} rotation={[0.55, 0, 0]}>
          <meshStandardMaterial {...M.steelDark2} />
        </Box>
      </Sel>

      {/* rear bumper fascia — integrated flush diffuser & skid plate */}
      <Sel cid="RearBumper">
        {/* Rear lower aerodynamic skid plate diffuser */}
        <Box args={[1.08, 0.08, 0.24]} position={[0, 0.44, -2.14]} rotation={[-0.18, 0, 0]}>
          <meshStandardMaterial {...M.skidPlate} />
        </Box>
        {/* Rear lower valance bumper trim */}
        <Box args={[1.22, 0.16, 0.1]} position={[0, 0.68, -2.16]}>
          <meshStandardMaterial {...M.cladding} />
        </Box>
        {/* Integrated dual rear reflectors */}
        {[-0.45, 0.45].map((rx) => (
          <Box key={rx} args={[0.18, 0.04, 0.02]} position={[rx, 0.76, -2.19]}>
            <meshStandardMaterial {...M.lampRed} />
          </Box>
        ))}
        {/* Rear aerodynamic roof spoiler overhang */}
        <Box args={[1.32, 0.045, 0.24]} position={[0, 1.58, -1.96]} rotation={[0.08, 0, 0]}>
          <meshStandardMaterial {...M.roofBlack} />
        </Box>
        {/* Tailgate license plate recess */}
        <Box args={[0.44, 0.16, 0.03]} position={[0, 0.92, -2.18]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>

      {/* ============ surface trim & lighting ============ */}

      {/* wheel-arch cladding */}
      {CORNERS.map((c) => (
        <Sel key={c.cid} cid={c.cid}>
          <ArchTrim s={c.s} z={c.z} />
        </Sel>
      ))}

      {/* rocker / sill cladding between the arches */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'RockerCladding_L' : 'RockerCladding_R'}>
          <Box args={[0.07, 0.17, 1.85]} position={[s * 1.065, 0.5, 0]}>
            <meshStandardMaterial {...M.cladding} />
          </Box>
        </Sel>
      ))}

      {/* front lighting: full-width DRL bar + lower projector pods */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'Headlamp_L' : 'Headlamp_R'}>
          <SurfaceBar points={s < 0 ? DRL_LEFT : DRL_RIGHT} radius={0.028}>
            <meshStandardMaterial {...M.drl} />
          </SurfaceBar>
          <group position={SP(2.12, 0.4, s).toArray() as [number, number, number]}>
            <Box args={[0.36, 0.11, 0.07]}>
              <meshStandardMaterial {...M.blackPlastic} />
            </Box>
            <Box args={[0.28, 0.075, 0.045]} position={[0, 0, 0.035]}>
              <meshStandardMaterial {...M.lamp} />
            </Box>
          </group>
        </Sel>
      ))}

      {/* rear lighting: connected bar across the tail */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'Taillamp_L' : 'Taillamp_R'}>
          <SurfaceBar points={s < 0 ? TAIL_LEFT : TAIL_RIGHT} radius={0.03}>
            <meshStandardMaterial {...M.lampRed} />
          </SurfaceBar>
        </Sel>
      ))}

      {/* mirrors on the door shoulder */}
      <Sel cid="Mirrors">
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 1.12, 1.2, 0.6]}>
            <Box args={[0.1, 0.04, 0.06]} position={[s * -0.06, 0, -0.02]}>
              <meshStandardMaterial {...M.roofBlack} />
            </Box>
            <mesh position={[0.07, 0.03, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.07, 4, 12]} />
              <meshStandardMaterial {...M.roofBlack} />
            </mesh>
          </group>
        ))}
      </Sel>

      {/* door handles */}
      {([
        ['DoorHandle_FL', -1, 0.45],
        ['DoorHandle_FR', 1, 0.45],
        ['DoorHandle_RL', -1, -0.45],
        ['DoorHandle_RR', 1, -0.45],
      ] as const).map(([cid, s, z]) => (
        <Sel key={cid} cid={cid}>
          <Box args={[0.04, 0.05, 0.19]} position={[s * 1.095, 1.05, z]}>
            <meshStandardMaterial {...M.chrome} />
          </Box>
        </Sel>
      ))}

      {/* charge-port flap */}
      <Sel cid="ChargeFlap">
        <Box args={[0.02, 0.18, 0.18]} position={[1.0, 1.06, 1.45]}>
          <meshStandardMaterial {...M.paint} />
        </Box>
      </Sel>

      {/* ============ underbody aero ============ */}
      <Sel cid="UnderbodyAero_Mid">
        <Box args={[1.3, 0.03, 2.9]} position={[0, 0.13, 0]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>
      <Sel cid="UnderbodyAero_L">
        <Box args={[0.22, 0.025, 2.8]} position={[-0.82, 0.145, -0.15]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>
      <Sel cid="UnderbodyAero_R">
        <Box args={[0.22, 0.025, 2.8]} position={[0.82, 0.145, -0.15]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>
    </group>
  );
}
