import { RoundedBox } from '@react-three/drei';
import { Box, Cyl, Rod } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';

/* ============================================================
   Cabin / interior — trim, dashboard, seats, controls.
   Laid out inside the safety cell defined in BIW.tsx.
   ============================================================ */

const FLOOR = D.floorY; // 0.52
const SEAT_X = 0.5;

function ErgonomicSeat(props: { cid: string; x: number; z: number; rotateY?: number }) {
  const { cid, x, z, rotateY = 0 } = props;
  return (
    <Sel cid={cid}>
      <group position={[x, FLOOR + 0.04, z]} rotation={[0, rotateY, 0]}>
        {/* Chrome seat mounting slider rails */}
        {[-0.18, 0.18].map((rx) => (
          <Rod key={rx} a={[rx, 0.01, -0.24]} b={[rx, 0.01, 0.24]} r={0.009}>
            <meshStandardMaterial {...M.chrome} />
          </Rod>
        ))}
        {/* Lower seat base frame */}
        <Box args={[0.44, 0.05, 0.44]} position={[0, 0.04, 0]}>
          <meshStandardMaterial {...M.dark} />
        </Box>
        {/* Contoured seat cushion with side bolsters */}
        <group position={[0, 0.09, 0]}>
          <RoundedBox args={[0.42, 0.07, 0.44]} radius={0.025} smoothness={3}>
            <meshStandardMaterial {...M.seat} />
          </RoundedBox>
          {/* Left & Right thigh support bolsters */}
          {[-0.19, 0.19].map((bx) => (
            <RoundedBox key={bx} args={[0.06, 0.09, 0.42]} radius={0.02} smoothness={3} position={[bx, 0.02, 0]}>
              <meshStandardMaterial {...M.seatTrim} />
            </RoundedBox>
          ))}
        </group>
        {/* Ergonomic angled backrest with torso bolsters */}
        <group position={[0, 0.35, -0.18]} rotation={[-0.18, 0, 0]}>
          <RoundedBox args={[0.4, 0.48, 0.07]} radius={0.025} smoothness={3}>
            <meshStandardMaterial {...M.seat} />
          </RoundedBox>
          {/* Torso side bolsters */}
          {[-0.18, 0.18].map((bx) => (
            <RoundedBox key={bx} args={[0.055, 0.44, 0.08]} radius={0.02} smoothness={3} position={[bx, 0, 0.01]}>
              <meshStandardMaterial {...M.seatTrim} />
            </RoundedBox>
          ))}
          {/* Headrest chrome mounting posts */}
          {[-0.07, 0.07].map((px) => (
            <Rod key={px} a={[px, 0.24, 0]} b={[px, 0.32, 0]} r={0.006}>
              <meshStandardMaterial {...M.chrome} />
            </Rod>
          ))}
          {/* Contoured headrest pillow */}
          <RoundedBox args={[0.22, 0.13, 0.08]} radius={0.025} smoothness={3} position={[0, 0.37, 0]}>
            <meshStandardMaterial {...M.seatTrim} />
          </RoundedBox>
        </group>
      </group>
    </Sel>
  );
}

export function Cabin() {
  return (
    <group>
      <Sel cid="InteriorTrim_Floor">
        <Box args={[1.8, 0.025, 3.1]} position={[0, FLOOR + 0.012, -0.15]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>
      <Sel cid="InteriorTrim_Headliner">
        <Box args={[1.78, 0.02, 2.2]} position={[0, 1.552, -0.42]}>
          <meshStandardMaterial {...M.dark} />
        </Box>
      </Sel>

      <Sel cid="DashboardCarrier">
        <group position={[0, 0.98, 1.12]} rotation={[0.14, 0, 0]}>
          <Box args={[1.76, 0.15, 0.32]}>
            <meshStandardMaterial {...M.dark} />
          </Box>
          <Box args={[1.76, 0.06, 0.1]} position={[0, -0.12, -0.05]}>
            <meshStandardMaterial {...M.steelDark} />
          </Box>
        </group>
      </Sel>
      <Sel cid="InstrumentCluster">
        <group position={[0.42, 1.08, 1.21]} rotation={[0.1, 0, 0]}>
          <Box args={[0.26, 0.14, 0.05]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          <Box args={[0.22, 0.11, 0.01]} position={[0, 0, -0.028]}>
            <meshStandardMaterial color="#0d2530" emissive="#38d9cf" emissiveIntensity={0.5} />
          </Box>
        </group>
      </Sel>
      <Sel cid="CenterDisplay">
        <group position={[0, 1.0, 1.26]} rotation={[0.06, 0, 0]}>
          <Box args={[0.32, 0.17, 0.04]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          <Box args={[0.28, 0.13, 0.01]} position={[0, 0, -0.022]}>
            <meshStandardMaterial color="#0d2530" emissive="#4f8cff" emissiveIntensity={0.45} />
          </Box>
        </group>
      </Sel>
      <Sel cid="HVACModule_Cabin">
        <Box args={[0.44, 0.32, 0.32]} position={[0, 0.64, 1.16]}>
          <meshStandardMaterial {...M.dark} />
        </Box>
      </Sel>

      {/* Front Row Seats */}
      <ErgonomicSeat cid="Seat_FL" x={-SEAT_X} z={0.3} />
      <ErgonomicSeat cid="Seat_FR" x={SEAT_X} z={0.3} />

      {/* 3 Individual Rear Passenger Seats in the Back */}
      <ErgonomicSeat cid="Seat_RL" x={-0.52} z={-0.82} rotateY={0} />
      <ErgonomicSeat cid="Seat_RC" x={0} z={-0.82} rotateY={0} />
      <ErgonomicSeat cid="Seat_RR" x={0.52} z={-0.82} rotateY={0} />

      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'SeatRail_FL' : 'SeatRail_FR'}>
          <Rod
            a={[s * SEAT_X, FLOOR + 0.03, 0.54]}
            b={[s * SEAT_X, FLOOR + 0.03, 0.04]}
            r={0.012}
          >
            <meshStandardMaterial {...M.chrome} />
          </Rod>
        </Sel>
      ))}
      <Sel cid="SeatbeltAnchor_FL">
        <Box args={[0.05, 0.14, 0.05]} position={[-0.68, 1.18, 0.14]}>
          <meshStandardMaterial {...M.steel} />
        </Box>
      </Sel>
    </group>
  );
}
