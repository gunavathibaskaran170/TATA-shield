import { Box, Cyl, Rod } from '../geom';
import { useTubeGeo } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';

/* ============================================================
   Thermal loops + LV/ECU network + combined HV harness markers.
   ============================================================ */

function FinStack(props: { cid: string; position: [number, number, number]; size: [number, number, number] }) {
  const { cid, position, size } = props;
  const [w, h, d] = size;
  return (
    <Sel cid={cid}>
      <group position={position}>
        <mesh castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial {...M.aluminum} />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[0, h / 2 + 0.004 + 0.01 * i, 0]}>
            <boxGeometry args={[w - 0.03, 0.006, d - 0.02]} />
            <meshStandardMaterial {...M.steelDark} />
          </mesh>
        ))}
      </group>
    </Sel>
  );
}

function Tube({ id, pts, r = 0.012, mat = M.steelDark2, closed = false }: { id: string; pts: [number, number, number][]; r?: number; mat?: object; closed?: boolean }) {
  const { geo } = useTubeGeo(pts, closed);
  return (
    <Sel cid={id}>
      <mesh geometry={geo}>
        <meshStandardMaterial {...(mat as object)} />
      </mesh>
    </Sel>
  );
}

export function Thermal() {
  return (
    <group>
      <FinStack cid="Radiator" position={[0, 0.56, 1.7]} size={[0.72, 0.44, 0.07]} />
      <FinStack cid="Condenser" position={[0, 0.54, 1.78]} size={[0.66, 0.4, 0.045]} />
      <Sel cid="CoolantPump_Motor">
        <Cyl args={[0.045, 0.045, 0.1, 12]} position={[0.35, 0.46, 1.45]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial {...M.dark} />
        </Cyl>
      </Sel>
      <Sel cid="CoolantPump_Battery">
        <Cyl args={[0.045, 0.045, 0.1, 12]} position={[-0.38, 0.44, 1.05]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial {...M.dark} />
        </Cyl>
      </Sel>
      <Sel cid="Chiller">
        <Box args={[0.22, 0.14, 0.16]} position={[0.4, 0.44, -0.4]}>
          <meshStandardMaterial {...M.aluminum} />
        </Box>
      </Sel>
      <Sel cid="CoolantHeater">
        <Box args={[0.24, 0.13, 0.15]} position={[-0.36, 0.44, -0.35]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>
      <Sel cid="CoolantReservoir">
        <Box args={[0.2, 0.26, 0.14]} position={[0.58, 0.95, 1.3]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>
      <Tube id="BatteryCoolantLoop" r={0.013} mat={M.blackPlastic} pts={[
        [0.18, 0.5, 1.6], [0.22, 0.44, 1.3], [0.18, 0.34, 0.6], [0.18, 0.25, 0.2], [0.18, 0.24, -0.8], [0.2, 0.24, -1.0],
      ]} />
      <Tube id="MotorCoolantLoop" r={0.011} mat={M.blackPlastic} pts={[
        [0.32, 0.55, 1.5], [0.33, 0.5, 1.3], [0.42, 0.44, 0.2], [0.4, 0.44, -0.3],
      ]} />
      <Tube id="HVACLoop" r={0.01} mat={M.steelDark2} pts={[
        [0, 0.5, 1.76], [0, 0.46, 1.45], [0, 0.5, 1.25], [0, 0.6, 1.15], [0, 0.6, 0.95],
      ]} />
    </group>
  );
}

export function Electrical() {
  return (
    <group>
      {/* HV orange harness — combined set: battery taps, motor/inverter connectors */}
      <Sel cid="HV_OrangeHarness">
        <group>
          {[-0.2, 0.05].map((x) => (
            <Cyl key={x} args={[0.018, 0.018, 0.14, 8]} position={[x, 0.44, D.batFront - 0.15]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial {...M.orange} />
            </Cyl>
          ))}
          <Cyl args={[0.02, 0.02, 0.1, 8]} position={[0.3, 0.52, 1.28]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial {...M.orange} />
          </Cyl>
          <Box args={[0.08, 0.05, 0.06]} position={[0.36, 0.5, 1.3]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
        </group>
      </Sel>

      {/* LV harness */}
      <Tube id="LV_Harness" r={0.007} mat={M.dark} pts={[
        [0.4, 0.78, 1.1], [0.0, 0.8, 1.06], [-0.3, 0.78, 1.08], [-0.35, 0.66, 1.0], [-0.2, 0.62, 0.6],
        [-0.25, 0.56, 0.0], [-0.24, 0.5, -0.7], [-0.2, 0.46, -1.05],
      ]} />
      <Tube id="LV_Harness2" r={0.0055} mat={M.dark} pts={[
        [0.4, 0.78, 1.1], [0.42, 0.68, 1.0], [0.42, 0.56, 0.2], [0.4, 0.5, -0.5],
      ]} />

      {/* ECUs */}
      <Sel cid="FuseBox">
        <Box args={[0.16, 0.09, 0.14]} position={[-0.52, 0.56, 1.0]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="VehicleControlUnit">
        <Box args={[0.2, 0.06, 0.14]} position={[0.3, 0.56, 1.02]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="Gateway">
        <Box args={[0.16, 0.05, 0.12]} position={[0.12, 0.56, 0.98]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="BodyControlModule">
        <Box args={[0.18, 0.06, 0.13]} position={[0.48, 0.56, 1.02]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="ABS_ESC_Module">
        <Box args={[0.22, 0.16, 0.16]} position={[0, 0.42, 1.42]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="EPS_Controller">
        <Box args={[0.14, 0.07, 0.14]} position={[-0.3, 0.64, 1.36]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="BMS_Controller">
        <Box args={[0.16, 0.06, 0.12]} position={[0.42, 0.44, -0.85]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="ADAS_ECU">
        <Box args={[0.2, 0.07, 0.14]} position={[0.56, 0.98, 1.12]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
    </group>
  );
}