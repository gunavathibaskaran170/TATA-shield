import { Box, Cyl, Rod, Spring, Strut } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';

/* ============================================================
   Suspension (MacPherson front, multi-link rear) + steering.

   Geometry follows the supplied parametric assembly: strut
   towers 350 mm tall at the rail line, coil springs of R65 /
   wire R9 / 6 turns, hubs R90 x 60, discs R320 dia x 12.
   ============================================================ */

const AX_F = D.axleFront;
const AX_R = D.axleRear;
const HUB_Y = D.wheelY;
const RAIL_TOP = D.railY1;
const RAIL_X = D.railX;
/* top of the strut / spring, per the 350 mm tower height */
const TOWER_TOP = RAIL_TOP + D.towerHeight;

function WheelCorner(props: { cid: string; position: [number, number, number] }) {
  const { cid, position } = props;
  return (
    <Sel cid={cid}>
      <group position={position}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.22, 0.13]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
        <Cyl args={[0.038, 0.038, 0.14, 12]} position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial {...M.steel} />
        </Cyl>
      </group>
    </Sel>
  );
}

function Bushing(props: { position: [number, number, number]; cid: string }) {
  return (
    <Sel cid={props.cid}>
      <mesh position={props.position} castShadow>
        <torusGeometry args={[0.034, 0.015, 8, 14]} />
        <meshStandardMaterial {...M.rubber} />
      </mesh>
    </Sel>
  );
}

export function Suspension() {
  return (
    <group>
      {/* ---------- FRONT (MacPherson) ---------- */}
      {([-1, 1] as const).map((s) => {
        const side = s < 0 ? 'L' : 'R';
        const rx = s * RAIL_X;
        return (
          <group key={s}>
            <WheelCorner cid={s < 0 ? 'Knuckle_FL' : 'Knuckle_FR'} position={[s * (D.wheelX - 0.1), HUB_Y, AX_F]} />
            {/* lower control arm */}
            <Sel cid={s < 0 ? 'LowerControlArm_FL' : 'LowerControlArm_FR'}>
              <Strut
                a={[s * (RAIL_X - 0.45), RAIL_TOP + 0.04, AX_F - 0.16]}
                b={[s * (D.wheelX - 0.1), HUB_Y - 0.02, AX_F]}
                w={0.08}
                d={0.07}
              >
                <meshStandardMaterial {...M.steel} />
              </Strut>
            </Sel>
            {/* strut / damper */}
            <Sel cid={s < 0 ? 'Strut_FL' : 'Strut_FR'}>
              <Rod a={[rx, TOWER_TOP, AX_F - 0.05]} b={[s * (D.wheelX - 0.08), HUB_Y + 0.12, AX_F]} r={0.028}>
                <meshStandardMaterial {...M.aluminum} />
              </Rod>
            </Sel>
            {/* coil spring — R65 / wire R9 / 6 turns per the spec */}
            <Sel cid={s < 0 ? 'CoilSpring_FL' : 'CoilSpring_FR'}>
              <Spring
                a={[rx, HUB_Y + 0.16, AX_F - 0.02]}
                b={[rx, TOWER_TOP - 0.02, AX_F - 0.05]}
                r={D.springCoilR}
                coils={D.springTurns}
                tube={D.springWireR}
              >
                <meshStandardMaterial {...M.steel} />
              </Spring>
            </Sel>
            {/* top mount */}
            <Sel cid={s < 0 ? 'StrutTopMount_FL' : 'StrutTopMount_FR'}>
              <Cyl args={[0.075, 0.075, 0.05, 16]} position={[rx, TOWER_TOP + 0.02, AX_F - 0.05]}>
                <meshStandardMaterial {...M.dark} />
              </Cyl>
            </Sel>
            <Sel cid={s < 0 ? 'StabilizerLink_FL' : 'StabilizerLink_FR'}>
              <Rod
                a={[s * (RAIL_X - 0.34), RAIL_TOP - 0.05, AX_F - 0.1]}
                b={[s * (D.wheelX - 0.22), HUB_Y - 0.06, AX_F - 0.04]}
                r={0.013}
              >
                <meshStandardMaterial {...M.steel} />
              </Rod>
            </Sel>
            <Bushing
              cid={s < 0 ? 'Bushing_FL' : 'Bushing_FR'}
              position={[s * (RAIL_X - 0.45), RAIL_TOP + 0.04, AX_F - 0.16]}
            />
          </group>
        );
      })}

      {/* ---------- REAR (multi-link + coil) ---------- */}
      {([-1, 1] as const).map((s) => {
        const side = s < 0 ? 'L' : 'R';
        const rx = s * RAIL_X;
        return (
          <group key={s}>
            <WheelCorner cid={s < 0 ? 'Knuckle_RL' : 'Knuckle_RR'} position={[s * (D.wheelX - 0.1), HUB_Y, AX_R]} />
            {/* lower link */}
            <Sel cid={s < 0 ? 'LowerLink_RL' : 'LowerLink_RR'}>
              <Strut
                a={[s * (RAIL_X - 0.42), RAIL_TOP + 0.03, AX_R + 0.12]}
                b={[s * (D.wheelX - 0.1), HUB_Y - 0.03, AX_R]}
                w={0.085}
                d={0.07}
              >
                <meshStandardMaterial {...M.steel} />
              </Strut>
            </Sel>
            {/* upper link */}
            <Sel cid={s < 0 ? 'UpperLink_RL' : 'UpperLink_RR'}>
              <Strut
                a={[s * (RAIL_X - 0.3), RAIL_TOP + 0.16, AX_R + 0.08]}
                b={[s * (D.wheelX - 0.13), HUB_Y + 0.1, AX_R - 0.02]}
                w={0.07}
                d={0.06}
              >
                <meshStandardMaterial {...M.steelDark} />
              </Strut>
            </Sel>
            {/* trailing arm */}
            <Sel cid={s < 0 ? 'TrailingArm_RL' : 'TrailingArm_RR'}>
              <Strut
                a={[s * (RAIL_X - 0.1), RAIL_TOP + 0.02, AX_R + 0.42]}
                b={[s * (D.wheelX - 0.09), HUB_Y, AX_R - 0.04]}
                w={0.09}
                d={0.065}
              >
                <meshStandardMaterial {...M.steel} />
              </Strut>
            </Sel>
            {/* coil spring */}
            <Sel cid={s < 0 ? 'CoilSpring_RL' : 'CoilSpring_RR'}>
              <Spring
                a={[rx, HUB_Y + 0.14, AX_R + 0.02]}
                b={[rx, TOWER_TOP - 0.02, AX_R + 0.05]}
                r={D.springCoilR}
                coils={D.springTurns}
                tube={D.springWireR}
              >
                <meshStandardMaterial {...M.steel} />
              </Spring>
            </Sel>
            {/* damper */}
            <Sel cid={s < 0 ? 'Damper_RL' : 'Damper_RR'}>
              <Rod a={[rx, TOWER_TOP, AX_R + 0.05]} b={[rx, HUB_Y + 0.12, AX_R + 0.01]} r={0.024}>
                <meshStandardMaterial {...M.aluminum} />
              </Rod>
            </Sel>
            <Sel cid={s < 0 ? 'StrutTopMount_RL' : 'StrutTopMount_RR'}>
              <Cyl args={[0.075, 0.075, 0.05, 16]} position={[rx, TOWER_TOP + 0.02, AX_R + 0.05]}>
                <meshStandardMaterial {...M.dark} />
              </Cyl>
            </Sel>
            <Bushing
              cid={s < 0 ? 'Bushing_RL' : 'Bushing_RR'}
              position={[s * (RAIL_X - 0.42), RAIL_TOP + 0.03, AX_R + 0.12]}
            />
          </group>
        );
      })}
    </group>
  );
}

export function Steering() {
  return (
    <group>
      <Sel cid="SteeringWheel">
        <group position={[-0.36, 1.04, 1.12]} rotation={[0.62, 0, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.17, 0.022, 10, 26]} />
            <meshStandardMaterial {...M.dark} />
          </mesh>
          {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.095, 0, Math.cos(a) * 0.095]}>
              <boxGeometry args={[0.028, 0.17, 0.032]} />
              <meshStandardMaterial {...M.steelDark2} />
            </mesh>
          ))}
          <Cyl args={[0.032, 0.032, 0.05, 12]}>
            <meshStandardMaterial {...M.steel} />
          </Cyl>
        </group>
      </Sel>
      <Sel cid="SteeringColumn">
        <Rod a={[-0.36, 1.02, 1.08]} b={[-0.24, 0.66, 1.62]} r={0.014}>
          <meshStandardMaterial {...M.steel} />
        </Rod>
      </Sel>
      <Sel cid="EPSMotor">
        <Cyl args={[0.055, 0.055, 0.18, 14]} position={[-0.3, 0.78, 1.44]} rotation={[0.35, 0, 0]}>
          <meshStandardMaterial {...M.dark} />
        </Cyl>
      </Sel>
      <Sel cid="SteeringRack">
        <Box args={[1.5, 0.11, 0.12]} position={[0, 0.56, 1.66]}>
          <meshStandardMaterial {...M.steelDark} />
        </Box>
      </Sel>
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'TieRod_L' : 'TieRod_R'}>
          <Rod
            a={[s * 0.72, 0.56, 1.66]}
            b={[s * (D.wheelX - 0.12), HUB_Y + 0.06, 1.6]}
            r={0.011}
          >
            <meshStandardMaterial {...M.steel} />
          </Rod>
        </Sel>
      ))}
    </group>
  );
}
