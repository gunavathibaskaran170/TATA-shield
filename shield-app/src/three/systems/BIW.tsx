import { RoundedBox } from '@react-three/drei';
import { Box, Cyl, Strut } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';

/* ============================================================
  Body-in-White — stamped monocoque structure.

  Sized to sit inside the exterior envelope in Exterior.tsx and to
  land on the specified chassis rails (x = ±0.805, y 0.16 … 0.30)
  and subframes at z = ±1.725.  Every part is a separate selectable
  component; sheet-metal cues are flanges, slots, stiffening ribs,
  boxed rails and spot welds (rendered by the fasteners system).
  ============================================================ */

/* structural references pulled off the supplied chassis */
const RAIL_X = D.railX; // 0.805
const RAIL_TOP = D.railY1; // 0.30
const FLOOR_Y = D.floorY; // 0.52
const SIDE_X = 0.95; // safety-cell plane
const ROOF_Y = 1.58; // inner roof rail
const BELT_Y = 1.06;

const RIBS = (colorIdx: 0 | 1) => (colorIdx ? M.steelDark : M.steel);

function RailWithRibs(props: {
  x: number; y: number; z: number; w: number; h: number; d: number;
  ribs?: number; ribColor?: 0 | 1;
}) {
  const { x, y, z, w, h, d, ribs = 4, ribColor = 0 } = props;
  const step = d / (ribs + 1);
  return (
    <group position={[x, y, z]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...RIBS(ribColor)} />
      </mesh>
      {/* top flange + stiffeners */}
      <mesh position={[0, h / 2 + 0.008, 0]}>
        <boxGeometry args={[w + 0.05, 0.012, d - 0.02]} />
        <meshStandardMaterial {...RIBS(ribColor)} />
      </mesh>
      {Array.from({ length: ribs }).map((_, i) => (
        <mesh key={i} position={[0, 0, -d / 2 + step * (i + 1)]}>
          <boxGeometry args={[w - 0.01, h + 0.015, 0.02]} />
          <meshStandardMaterial {...M.steelDark2} />
        </mesh>
      ))}
    </group>
  );
}

export function BIW() {
  return (
    <group>
      {/* ------------------ FRONT STRUCTURE ------------------ */}
      <Sel cid="CrashBeam">
        <Box args={[1.7, 0.1, 0.11]} position={[0, 0.68, 2.12]}>
          <meshStandardMaterial {...M.steel} />
        </Box>
      </Sel>
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'CrushCan_L' : 'CrushCan_R'}>
          <group position={[s * 0.72, 0.68, 1.95]}>
            <mesh castShadow>
              <boxGeometry args={[0.14, 0.14, 0.34]} />
              <meshStandardMaterial {...M.aluminum} />
            </mesh>
            {[0.08, 0.18].map((oz) => (
              <mesh key={oz} position={[0, 0, oz]}>
                <boxGeometry args={[0.15, 0.022, 0.034]} />
                <meshStandardMaterial {...M.steelDark2} />
              </mesh>
            ))}
          </group>
        </Sel>
      ))}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'FrontLongitudinal_L' : 'FrontLongitudinal_R'}>
          <group position={[s * 0.58, 0, 0]}>
            <RailWithRibs x={0} y={0.62} z={1.5} w={0.12} h={0.16} d={0.95} ribs={3} />
            {/* wheelhouse inner + suspension load tie */}
            <Box args={[0.1, 0.18, 0.26]} position={[0, 0.7, 1.08]}>
              <meshStandardMaterial {...M.steelDark} />
            </Box>
          </group>
        </Sel>
      ))}
      <Sel cid="RadiatorSupport">
        <group>
          {[-0.72, 0.72].map((x) => (
            <Box key={x} args={[0.09, 0.54, 0.07]} position={[x, 0.66, 1.78]}>
              <meshStandardMaterial {...M.steel} />
            </Box>
          ))}
          <Box args={[1.54, 0.08, 0.055]} position={[0, 0.48, 1.78]}>
            <meshStandardMaterial {...M.steel} />
          </Box>
          <Box args={[1.54, 0.07, 0.055]} position={[0, 0.85, 1.78]}>
            <meshStandardMaterial {...M.steel} />
          </Box>
        </group>
      </Sel>
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'FrontUpperRail_L' : 'FrontUpperRail_R'}>
          <Strut a={[s * 0.74, 0.9, 1.86]} b={[s * 0.9, 1.12, 1.3]} w={0.11} d={0.1}>
            <meshStandardMaterial {...M.steel} />
          </Strut>
        </Sel>
      ))}

      {/* ------------------ SAFETY CELL ------------------ */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'A_Pillar_L' : 'A_Pillar_R'}>
          <Strut a={[s * 0.9, 1.08, 1.04]} b={[s * 0.93, 1.57, 0.57]} w={0.045} d={0.042}>
            <meshStandardMaterial {...M.steel} />
          </Strut>
        </Sel>
      ))}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'B_Pillar_L' : 'B_Pillar_R'}>
          <Strut a={[s * 0.96, 0.54, 0.16]} b={[s * 0.95, 1.59, -0.06]} w={0.048} d={0.042}>
            <meshStandardMaterial {...M.steel} />
          </Strut>
        </Sel>
      ))}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'C_Pillar_L' : 'C_Pillar_R'}>
          <Strut a={[s * 0.99, 0.56, -0.72]} b={[s * 0.94, 1.56, -1.08]} w={0.045} d={0.04}>
            <meshStandardMaterial {...M.steel} />
          </Strut>
        </Sel>
      ))}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'RoofRail_L' : 'RoofRail_R'}>
          <RailWithRibs x={s * 0.92} y={ROOF_Y} z={-0.45} w={0.045} h={0.045} d={1.92} ribs={5} />
        </Sel>
      ))}
      {[
        { cid: 'RoofCrossMember_1', z: 0.44 },
        { cid: 'RoofCrossMember_2', z: -0.1 },
        { cid: 'RoofCrossMember_3', z: -0.7 },
      ].map((m) => (
        <Sel key={m.cid} cid={m.cid}>
          <Box args={[1.82, 0.038, 0.038]} position={[0, 1.53, m.z]}>
            <meshStandardMaterial {...M.steel} />
          </Box>
        </Sel>
      ))}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'Rocker_L' : 'Rocker_R'}>
          <group position={[s * 0.93, 0, 0]}>
            <RailWithRibs x={0} y={0.52} z={0.0} w={0.06} h={0.08} d={2.94} ribs={8} ribColor={1} />
          </group>
        </Sel>
      ))}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'DoorRing_L' : 'DoorRing_R'}>
          <group>
            {/* Front A-pillar incline section */}
            <Strut a={[s * 0.94, 1.06, 1.02]} b={[s * 0.94, 1.56, 0.54]} w={0.032} d={0.032}>
              <meshStandardMaterial {...M.steelDark} />
            </Strut>
            {/* Roof aperture top rail section */}
            <Strut a={[s * 0.94, 1.56, 0.54]} b={[s * 0.94, 1.56, -0.68]} w={0.032} d={0.032}>
              <meshStandardMaterial {...M.steelDark} />
            </Strut>
            {/* B-pillar center pillar vertical reinforcement */}
            <Strut a={[s * 0.94, 1.56, -0.05]} b={[s * 0.94, 0.54, -0.05]} w={0.032} d={0.032}>
              <meshStandardMaterial {...M.steelDark} />
            </Strut>
            {/* Rear C-pillar rear pillar section */}
            <Strut a={[s * 0.94, 1.56, -0.68]} b={[s * 0.94, 0.54, -0.68]} w={0.032} d={0.032}>
              <meshStandardMaterial {...M.steelDark} />
            </Strut>
            {/* Bottom sill rocker panel tie */}
            <Strut a={[s * 0.94, 0.54, 1.02]} b={[s * 0.94, 0.54, -0.68]} w={0.032} d={0.032}>
              <meshStandardMaterial {...M.steelDark} />
            </Strut>
          </group>
        </Sel>
      ))}
      <Sel cid="DashCrossMember">
        <Box args={[1.82, 0.1, 0.08]} position={[0, 1.02, 1.06]}>
          <meshStandardMaterial {...M.steel} />
        </Box>
      </Sel>
      {[
        { cid: 'SeatCrossMember_Front', z: 0.28 },
        { cid: 'SeatCrossMember_Rear', z: -0.4 },
      ].map((m) => (
        <Sel key={m.cid} cid={m.cid}>
          <Box args={[1.7, 0.09, 0.08]} position={[0, 0.565, m.z]}>
            <meshStandardMaterial {...M.steelDark} />
          </Box>
        </Sel>
      ))}

      {/* ------------------ FLOOR STRUCTURE ------------------ */}
      <Sel cid="FrontFloor">
        <group position={[0, FLOOR_Y, 0.32]}>
          <mesh receiveShadow>
            <boxGeometry args={[1.86, 0.028, 1.9]} />
            <meshStandardMaterial {...M.steel} />
          </mesh>
          {[-0.5, 0, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.016, 0]}>
              <boxGeometry args={[0.06, 0.014, 1.76]} />
              <meshStandardMaterial {...M.steelDark} />
            </mesh>
          ))}
        </group>
      </Sel>
      <Sel cid="RearFloor">
        <group position={[0, FLOOR_Y, -1.16]}>
          <mesh receiveShadow>
            <boxGeometry args={[1.86, 0.028, 1.42]} />
            <meshStandardMaterial {...M.steel} />
          </mesh>
          {[-0.5, 0, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.016, 0]}>
              <boxGeometry args={[0.06, 0.014, 1.28]} />
              <meshStandardMaterial {...M.steelDark} />
            </mesh>
          ))}
        </group>
      </Sel>
      <Sel cid="CenterTunnel">
        <Box args={[0.3, 0.04, 1.94]} position={[0, FLOOR_Y + 0.02, -0.05]}>
          <meshStandardMaterial {...M.steel} />
        </Box>
      </Sel>
      {/* battery protection rails, just outboard of the pack and above it */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'BatteryProtectionRail_L' : 'BatteryProtectionRail_R'}>
          <group position={[s * 0.68, 0, 0]}>
            <RailWithRibs x={0} y={0.38} z={0} w={0.1} h={0.14} d={2.62} ribs={7} />
            {[-1.05, 0, 1.05].map((oz) => (
              <mesh key={oz} position={[s * 0.005, 0.33, oz]}>
                <boxGeometry args={[0.09, 0.022, 0.07]} />
                <meshStandardMaterial {...M.steelDark2} />
              </mesh>
            ))}
          </group>
        </Sel>
      ))}
      {[
        { cid: 'CrossMember_Front', z: 0.95 },
        { cid: 'CrossMember_Center_1', z: 0.35 },
        { cid: 'CrossMember_Center_2', z: -0.3 },
        { cid: 'CrossMember_Rear', z: -1.0 },
      ].map((m) => (
        <Sel key={m.cid} cid={m.cid}>
          <group position={[0, 0.35, m.z]}>
            <mesh castShadow>
              <boxGeometry args={[1.7, 0.11, 0.1]} />
              <meshStandardMaterial {...M.steel} />
            </mesh>
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[1.7, 0.034, 0.12]} />
              <meshStandardMaterial {...M.steelDark} />
            </mesh>
          </group>
        </Sel>
      ))}

      {/* ------------------ REAR STRUCTURE ------------------ */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'RearLongitudinal_L' : 'RearLongitudinal_R'}>
          <RailWithRibs x={s * 0.58} y={0.62} z={-1.6} w={0.12} h={0.15} d={0.95} ribs={3} />
        </Sel>
      ))}
      <Sel cid="RearCrashBeam">
        <Box args={[1.74, 0.1, 0.11]} position={[0, 0.68, -2.18]}>
          <meshStandardMaterial {...M.steel} />
        </Box>
      </Sel>
      <Sel cid="RearFloorCrossMember">
        <Box args={[1.7, 0.1, 0.09]} position={[0, 0.36, -1.25]}>
          <meshStandardMaterial {...M.steel} />
        </Box>
      </Sel>
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'Wheelhouse_L' : 'Wheelhouse_R'}>
          <RoundedBox args={[0.2, 0.46, 0.72]} radius={0.09} smoothness={2} position={[s * 0.88, 0.8, -1.32]}>
            <meshStandardMaterial {...M.steel} />
          </RoundedBox>
        </Sel>
      ))}
      {/* suspension towers land on the specified rails at the specified axles */}
      {([
        { cid: 'SuspensionTower_FL', x: -RAIL_X, z: D.axleFront },
        { cid: 'SuspensionTower_FR', x: RAIL_X, z: D.axleFront },
        { cid: 'SuspensionTower_RL', x: -RAIL_X, z: D.axleRear },
        { cid: 'SuspensionTower_RR', x: RAIL_X, z: D.axleRear },
      ] as const).map((t) => (
        <Sel key={t.cid} cid={t.cid}>
          <group position={[t.x, RAIL_TOP + 0.03, t.z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.14, 0.14, 0.06, 22]} />
              <meshStandardMaterial {...M.steel} />
            </mesh>
            <Cyl args={[0.1, 0.1, 0.06, 14]} position={[0, 0.025, 0]}>
              <meshStandardMaterial {...M.steelDark} />
            </Cyl>
          </group>
        </Sel>
      ))}
    </group>
  );
}
