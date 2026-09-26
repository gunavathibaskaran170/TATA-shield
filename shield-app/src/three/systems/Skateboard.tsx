import { Box, Cyl, Rod } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';
import { useTubeGeo } from '../geom';

/* ============================================================
   EV Skateboard — as specified by the supplied parametric
   assembly `EV_Chassis_SHIELD_Assembly`:

     · two hydroformed hollow rails 90 x 140 mm, 4 mm wall,
       overhanging 350 mm front / 400 mm rear of the axles
     · three 70 x 120 mm crossmembers — front subframe
       (+300 ahead of the front axle), centre, rear subframe
       (−300 behind the rear axle)
     · sealed battery enclosure 2000 x 1250 x 140 mm, 6 mm wall,
       15 mm base cooling plate, 8 internal module channels
     · transverse PMSM 150 x 360 mm + 170 x 220 mm reduction
       gearbox, 220 x 180 x 140 mm inverter, R22 half-shafts
     · auxiliary excitation motor and LC1 dummy-load fixture
     · orange HV bus

   Battery view modes are handled by store.applyBatteryMode().
   ============================================================ */

const RAIL_MID_Z = (D.railFront + D.railRear) / 2;

/* ------------------------------------------------------------
   Structural rails + crossmembers
   ------------------------------------------------------------ */
function ChassisFrame() {
  return (
    <group>
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'ChassisRail_L' : 'ChassisRail_R'}>
          <group>
            <Box
              args={[D.railW, D.railH, D.railLen]}
              position={[s * D.railX, (D.railY0 + D.railY1) / 2, RAIL_MID_Z]}
            >
              <meshStandardMaterial {...M.railGreen} />
            </Box>
            {/* hydroformed flanges, top and bottom */}
            {[D.railY0, D.railY1].map((y) => (
              <Box
                key={y}
                args={[D.railW + 0.03, 0.012, D.railLen - 0.02]}
                position={[s * D.railX, y, RAIL_MID_Z]}
              >
                <meshStandardMaterial {...M.railGreenDark} />
              </Box>
            ))}
            {/* internal cavity hint, visible in X-ray */}
            <Box
              args={[D.railW - 2 * D.railWall, D.railH - 2 * D.railWall, D.railLen - 0.01]}
              position={[s * D.railX, (D.railY0 + D.railY1) / 2, RAIL_MID_Z]}
            >
              <meshStandardMaterial {...M.blackPlastic} />
            </Box>
          </group>
        </Sel>
      ))}

      {/* crossmembers / subframes */}
      {D.xmemberZ.map((z, i) => (
        <Sel key={z} cid={i === 0 ? 'FrontSubframe' : i === 1 ? 'Crossmember_Centre' : 'RearSubframe'}>
          <group>
            <Box
              args={[D.chassisWidth, D.xmemberH, D.xmemberD]}
              position={[0, D.railY0 + D.xmemberH / 2, z]}
            >
              <meshStandardMaterial {...M.steel} />
            </Box>
            {/* lightening holes */}
            {[-0.5, -0.17, 0.17, 0.5].map((x) => (
              <Cyl
                key={x}
                args={[0.045, 0.045, D.xmemberH + 0.01, 12]}
                position={[x, D.railY0 + D.xmemberH / 2, z]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <meshStandardMaterial {...M.blackPlastic} />
              </Cyl>
            ))}
          </group>
        </Sel>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------
   Battery pack
   ------------------------------------------------------------ */
const MODULE_LAYOUT: [string, number, number][] = [
  ['Module_01', -0.3, 0.78],
  ['Module_02', 0.3, 0.78],
  ['Module_03', -0.3, 0.26],
  ['Module_04', 0.3, 0.26],
  ['Module_05', -0.3, -0.26],
  ['Module_06', 0.3, -0.26],
  ['Module_07', -0.3, -0.78],
  ['Module_08', 0.3, -0.78],
];

function BatteryPack() {
  const w = D.packWidth;
  const d = D.packDepth;
  const h = D.packHeight;
  const midY = (D.batY0 + D.batY1) / 2;
  const plateY = D.batY0 + D.batteryWall + D.coolingPlateThk / 2;
  /* 8 channels ⇒ 7 internal partition ribs */
  const innerD = d - 2 * D.batteryWall;
  const ribStep = innerD / D.moduleChannels;

  return (
    <group>
      <Sel cid="BatteryPack_Tray">
        <group>
          <Box args={[w, h, d]} position={[0, midY, 0]}>
            <meshStandardMaterial {...M.tray} />
          </Box>
          {/* floor ribs */}
          {[-0.35, 0, 0.35].map((x) => (
            <Box key={x} args={[0.03, 0.02, d - 0.1]} position={[x, D.batY0 + 0.012, 0]}>
              <meshStandardMaterial {...M.steelDark2} />
            </Box>
          ))}
        </group>
      </Sel>

      <Sel cid="BatteryPack_Cover">
        <Box args={[w + 0.02, 0.012, d + 0.02]} position={[0, D.batY1 + 0.006, 0]}>
          <meshStandardMaterial {...M.battery} envMapIntensity={0.7} />
        </Box>
      </Sel>

      <Sel cid="BatteryPack_SideL">
        <Box args={[0.01, h, d]} position={[-D.batX - 0.005, midY, 0]}>
          <meshStandardMaterial {...M.tray} />
        </Box>
      </Sel>
      <Sel cid="BatteryPack_SideR">
        <Box args={[0.01, h, d]} position={[D.batX + 0.005, midY, 0]}>
          <meshStandardMaterial {...M.tray} />
        </Box>
      </Sel>
      <Sel cid="BatteryPack_XF">
        <Box args={[w, h, 0.01]} position={[0, midY, D.batFront + 0.005]}>
          <meshStandardMaterial {...M.tray} />
        </Box>
      </Sel>
      <Sel cid="BatteryPack_XR">
        <Box args={[w, h, 0.01]} position={[0, midY, D.batRear - 0.005]}>
          <meshStandardMaterial {...M.tray} />
        </Box>
      </Sel>

      <Sel cid="CoolingPlate">
        <Box
          args={[w - 2 * D.batteryWall, D.coolingPlateThk, innerD]}
          position={[0, plateY, 0]}
        >
          <meshStandardMaterial {...M.aluminum} />
        </Box>
      </Sel>

      <Sel cid="CoolantInlet">
        <Cyl
          args={[0.016, 0.016, 0.1, 10]}
          position={[-0.12, D.batY1 + 0.01, D.batFront - 0.05]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <meshStandardMaterial {...M.blackPlastic} />
        </Cyl>
      </Sel>
      <Sel cid="CoolantOutlet">
        <Cyl
          args={[0.016, 0.016, 0.1, 10]}
          position={[0.12, D.batY1 + 0.01, D.batFront - 0.05]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <meshStandardMaterial {...M.blackPlastic} />
        </Cyl>
      </Sel>
      <Sel cid="PackVent">
        <Box args={[0.16, 0.04, 0.14]} position={[0.42, D.batY1 - 0.01, 0.4]}>
          <meshStandardMaterial {...M.blackPlastic} />
        </Box>
      </Sel>

      {/* internal partition ribs — one fewer than the channel count */}
      <Sel cid="BatteryModuleRail_L">
        <group>
          {Array.from({ length: D.moduleChannels - 1 }).map((_, i) => (
            <Box
              key={i}
              args={[D.moduleChannelWall, h - 2 * D.batteryWall - D.coolingPlateThk, innerD - 0.004]}
              position={[
                0,
                plateY + (h - 2 * D.batteryWall - D.coolingPlateThk) / 2 + D.coolingPlateThk / 2,
                -d / 2 + D.batteryWall + ribStep * (i + 1),
              ]}
            >
              <meshStandardMaterial {...M.steelDark} />
            </Box>
          ))}
        </group>
      </Sel>
      <Sel cid="BatteryModuleRail_R">
        <Box args={[0.012, 0.02, d - 0.06]} position={[D.batX - 0.03, D.batY1 + 0.012, 0]}>
          <meshStandardMaterial {...M.orangeDim} />
        </Box>
      </Sel>

      {/* eight module bays */}
      {MODULE_LAYOUT.map(([cid, x, z]) => (
        <Sel key={cid} cid={cid}>
          <group position={[x, D.batY1 - 0.05, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.075, 0.44]} />
              <meshStandardMaterial {...M.module} />
            </mesh>
            {[-0.15, 0, 0.15].map((cx) => (
              <mesh key={cx} position={[cx, 0.042, 0]}>
                <boxGeometry args={[0.09, 0.008, 0.4]} />
                <meshStandardMaterial {...M.steelDark} />
              </mesh>
            ))}
          </group>
        </Sel>
      ))}

      {/* blue / red busbar wiring along the pack, per the reference render */}
      <Sel cid="HVBus_Pack">
        <group>
          <Box args={[0.016, 0.007, d - 0.08]} position={[0.01, D.batY1 - 0.012, 0]}>
            <meshStandardMaterial {...M.busPositive} />
          </Box>
          <Box args={[0.016, 0.007, d - 0.08]} position={[-0.01, D.batY1 - 0.012, 0]}>
            <meshStandardMaterial {...M.busNegative} />
          </Box>
        </group>
      </Sel>

      {/* pack electronics */}
      <Sel cid="BMS">
        <Box args={[0.15, 0.05, 0.18]} position={[0.4, D.batY1 + 0.02, 0.82]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="HVJunctionBox">
        <group position={[-0.4, D.batY1 + 0.02, 0.82]}>
          <Box args={[0.18, 0.06, 0.22]}>
            <meshStandardMaterial {...M.ecu} />
          </Box>
          <Cyl args={[0.018, 0.018, 0.04, 8]} position={[-0.05, 0.04, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial {...M.orange} />
          </Cyl>
        </group>
      </Sel>
      <Sel cid="ServiceDisconnect">
        <Cyl args={[0.032, 0.032, 0.055, 10]} position={[-0.45, D.batY1 + 0.05, 0.9]}>
          <meshStandardMaterial {...M.orangeDim} />
        </Cyl>
      </Sel>

      {/* mounting brackets onto the rails */}
      {([
        { cid: 'Mount_BFL', x: -D.batX, z: D.batFront - 0.06 },
        { cid: 'Mount_BFR', x: D.batX, z: D.batFront - 0.06 },
        { cid: 'Mount_BRL', x: -D.batX, z: D.batRear + 0.06 },
        { cid: 'Mount_BRR', x: D.batX, z: D.batRear + 0.06 },
        { cid: 'Mount_ML', x: -D.batX, z: 0 },
        { cid: 'Mount_MR', x: D.batX, z: 0 },
      ] as const).map((mt) => (
        <Sel key={mt.cid} cid={mt.cid}>
          <group position={[mt.x, D.batY1 + 0.03, mt.z]}>
            <Box args={[0.16, 0.04, 0.12]}>
              <meshStandardMaterial {...M.aluminum} />
            </Box>
            {[-0.045, 0.045].map((bx) => (
              <Cyl key={bx} args={[0.014, 0.014, 0.05, 8]} position={[bx, 0.016, 0]}>
                <meshStandardMaterial {...M.bolt} />
              </Cyl>
            ))}
          </group>
        </Sel>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------
   Front drive unit
   ------------------------------------------------------------ */
function DriveUnit() {
  const mz = D.motorZ;
  const my = D.motorY;

  return (
    <group>
      {/* transverse PMSM */}
      <Sel cid="TractionMotor">
        <group position={[0, my, mz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[D.motorR, D.motorR, D.motorLen, 24]} />
            <meshStandardMaterial {...M.aluminum} />
          </mesh>
          {/* stator cooling ribs */}
          {[-0.12, -0.04, 0.04, 0.12].map((oz) => (
            <Cyl key={oz} args={[D.motorR + 0.012, D.motorR + 0.012, 0.01, 24]} position={[0, oz, 0]}>
              <meshStandardMaterial {...M.steelDark} />
            </Cyl>
          ))}
          <Cyl args={[0.028, 0.028, 0.05, 12]} position={[D.motorLen / 2 + 0.02, 0, 0]}>
            <meshStandardMaterial {...M.steelDark} />
          </Cyl>
        </group>
      </Sel>

      {/* planetary reduction gearbox */}
      <Sel cid="GearReduction">
        <group position={[D.gearX, my, mz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[D.gearR, D.gearR, D.gearLen, 24]} />
            <meshStandardMaterial {...M.dark} />
          </mesh>
          <Cyl args={[0.05, 0.05, 0.06, 12]} position={[0, D.gearLen / 2 + 0.02, 0]}>
            <meshStandardMaterial {...M.aluminum} />
          </Cyl>
        </group>
      </Sel>

      <Sel cid="Differential">
        <Cyl args={[0.07, 0.07, 0.3, 16]} position={[0, my, mz]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial {...M.steelDark} />
        </Cyl>
      </Sel>

      {/* inverter, offset to the inboard side and above the axle line */}
      <Sel cid="DriveInverter">
        <group position={[-0.28, my - 0.03, mz + 0.06]}>
          <Box args={[D.inverterW, D.inverterH, D.inverterL]}>
            <meshStandardMaterial {...M.ecu} />
          </Box>
          <Box args={[D.inverterW * 0.5, 0.025, D.inverterL * 0.8]} position={[0, D.inverterH / 2 + 0.012, 0]}>
            <meshStandardMaterial {...M.orangeDim} />
          </Box>
          {[-0.06, 0.06].map((y) => (
            <Cyl
              key={y}
              args={[0.011, 0.011, 0.05, 8]}
              position={[D.inverterW / 2 + 0.02, y, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <meshStandardMaterial {...M.orange} />
            </Cyl>
          ))}
        </group>
      </Sel>

      {/* half-shafts out to the hubs */}
      <Sel cid="Halfshaft_L">
        <Rod a={[-0.14, my, mz]} b={[-D.wheelX, D.wheelY, mz]} r={D.halfshaftR}>
          <meshStandardMaterial {...M.steel} />
        </Rod>
      </Sel>
      <Sel cid="Halfshaft_R">
        <Rod a={[0.14, my, mz]} b={[D.wheelX, D.wheelY, mz]} r={D.halfshaftR}>
          <meshStandardMaterial {...M.steel} />
        </Rod>
      </Sel>

      {/* motor / gearbox mounts */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'MotorMount_L' : 'MotorMount_R'}>
          <group position={[s * 0.26, my - 0.2, mz - 0.14]}>
            <Box args={[0.12, 0.1, 0.14]}>
              <meshStandardMaterial {...M.aluminum} />
            </Box>
            <Cyl args={[0.018, 0.018, 0.09, 8]} position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial {...M.bolt} />
            </Cyl>
          </group>
        </Sel>
      ))}

      {/* auxiliary excitation motor */}
      <Sel cid="AuxMotor">
        <group position={[0, my, D.auxMotorZ]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[D.auxMotorR, D.auxMotorR, D.auxMotorLen, 18]} />
            <meshStandardMaterial {...M.steelDark} />
          </mesh>
        </group>
      </Sel>

      {/* LC1 dummy-load test fixture */}
      <Sel cid="LC1_Fixture">
        <group position={[0, D.railY0 + D.lc1H / 2, D.lc1Z]}>
          <Box args={[D.lc1W, D.lc1H, D.lc1L]}>
            <meshStandardMaterial {...M.dark} />
          </Box>
          <Box args={[D.lc1W + 0.02, 0.012, D.lc1L + 0.02]} position={[0, D.lc1H / 2, 0]}>
            <meshStandardMaterial {...M.steelDark2} />
          </Box>
        </group>
      </Sel>
    </group>
  );
}

/* ------------------------------------------------------------
   On-board power electronics
   ------------------------------------------------------------ */
function PowerElectronics() {
  return (
    <group>
      <Sel cid="OnBoardCharger">
        <group position={[0, D.railY0 + 0.08, D.batRear - 0.3]}>
          <Box args={[0.42, 0.13, 0.3]}>
            <meshStandardMaterial {...M.ecu} />
          </Box>
          <Box args={[0.1, 0.05, 0.18]} position={[0.14, 0.09, 0]}>
            <meshStandardMaterial {...M.orangeDim} />
          </Box>
        </group>
      </Sel>
      <Sel cid="DCDCConverter">
        <Box args={[0.22, 0.11, 0.18]} position={[0.32, D.railY0 + 0.07, D.batRear - 0.18]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>
      <Sel cid="ChargePort">
        <group position={[-0.95, 0.78, 1.5]}>
          <Box args={[0.1, 0.22, 0.14]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          <Cyl args={[0.04, 0.04, 0.03, 12]} position={[0, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial {...M.orange} />
          </Cyl>
        </group>
      </Sel>
    </group>
  );
}

/* ------------------------------------------------------------
   Orange HV bus
   ------------------------------------------------------------ */
function HVBus() {
  const m1 = useTubeGeo([
    [-0.3, D.batY1, D.batFront - 0.15],
    [-0.26, 0.42, 1.1],
    [-0.16, 0.5, 1.16],
    [0.02, 0.52, 1.2],
  ]);
  const m2 = useTubeGeo([
    [0.36, D.batY1, D.batFront - 0.2],
    [0.44, D.railY0 + 0.1, 0.6],
    [0.42, D.railY0 + 0.08, -0.3],
    [0.28, D.railY0 + 0.09, -0.7],
    [0.14, D.railY0 + 0.1, -0.9],
  ]);
  const d1 = useTubeGeo([
    [0.28, D.batY1, D.batFront - 0.18],
    [0.4, D.railY0 + 0.12, -0.5],
    [0.4, D.railY0 + 0.1, -0.82],
  ]);
  const c1 = useTubeGeo([
    [-0.9, 0.72, 1.48],
    [-0.6, 0.55, 1.2],
    [-0.3, 0.42, 0.7],
    [-0.1, 0.38, 0.1],
    [0.02, 0.36, -0.6],
  ]);
  const Tube = ({ g, id, r = 0.009 }: { g: ReturnType<typeof useTubeGeo>; id: string; r?: number }) => (
    <Sel cid={id}>
      <mesh geometry={g.geo}>
        <meshStandardMaterial {...M.orange} envMapIntensity={0.9} />
      </mesh>
    </Sel>
  );
  return (
    <group>
      <Tube g={m1} id="HVBus_Motor" />
      <Tube g={m2} id="HVBus_Charger" />
      <Tube g={d1} id="HVBus_DCDC" r={0.007} />
      <Tube g={c1} id="HVBus_ChargePort" r={0.007} />
    </group>
  );
}

/* ------------------------------------------------------------
   Rear e-drive module — mirrors the front unit at the rear axle
   and explodes aft in the CAD presentation.  Per the supplied
   exploded-assembly definition the rear motor / gearbox are
   scaled slightly down (0.9 / 0.85) relative to the front.
   ------------------------------------------------------------ */
function RearDriveUnit() {
  const mz = D.axleRear + 0.06;
  const my = D.wheelY;
  const mR = D.motorR * 0.9;
  const gR = D.gearR * 0.85;
  const gL = D.gearLen * 0.8;

  return (
    <group>
      <Sel cid="RearTractionMotor">
        <group position={[0, my, mz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[mR, mR, D.motorLen, 24]} />
            <meshStandardMaterial {...M.aluminum} />
          </mesh>
          {[-0.12, -0.04, 0.04, 0.12].map((oz) => (
            <Cyl key={oz} args={[mR + 0.012, mR + 0.012, 0.01, 24]} position={[0, oz, 0]}>
              <meshStandardMaterial {...M.steelDark} />
            </Cyl>
          ))}
        </group>
      </Sel>

      <Sel cid="RearGearReduction">
        <group position={[-D.gearX, my, mz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[gR, gR, gL, 24]} />
            <meshStandardMaterial {...M.dark} />
          </mesh>
          <Cyl args={[0.05, 0.05, 0.06, 12]} position={[0, gL / 2 + 0.02, 0]}>
            <meshStandardMaterial {...M.aluminum} />
          </Cyl>
        </group>
      </Sel>

      <Sel cid="RearDriveInverter">
        <Box args={[D.inverterW, D.inverterH, D.inverterL]} position={[0.3, my - 0.02, mz - 0.05]}>
          <meshStandardMaterial {...M.ecu} />
        </Box>
      </Sel>

      <Sel cid="RearHalfshaft_L">
        <Rod a={[-0.14, my, mz]} b={[-D.wheelX, D.wheelY, mz]} r={D.halfshaftR}>
          <meshStandardMaterial {...M.steel} />
        </Rod>
      </Sel>
      <Sel cid="RearHalfshaft_R">
        <Rod a={[0.14, my, mz]} b={[D.wheelX, D.wheelY, mz]} r={D.halfshaftR}>
          <meshStandardMaterial {...M.steel} />
        </Rod>
      </Sel>
    </group>
  );
}

/* ------------------------------------------------------------
   Front cooling module — radiator slab plus fan shroud, floating
   ahead of the nose in the CAD presentation.
   RAD_L 30 x RAD_W 480 x RAD_H 380, fan R170 x 60 deep.
   ------------------------------------------------------------ */
function CoolingModule() {
  const RAD_L = 0.03;
  const RAD_W = 0.48;
  const RAD_H = 0.38;
  const FAN_R = 0.17;
  const FAN_D = 0.06;
  /* sits just ahead of the front subframe */
  const z = D.railFront - 0.05;
  const y = D.wheelY;

  return (
    <group>
      <Sel cid="RadiatorModule">
        <group>
          <Box args={[RAD_W, RAD_H, RAD_L]} position={[0, y, z]}>
            <meshStandardMaterial {...M.steelDark2} />
          </Box>
          {/* core fins */}
          {[-0.16, -0.08, 0, 0.08, 0.16].map((x) => (
            <Box key={x} args={[0.02, RAD_H - 0.03, RAD_L + 0.012]} position={[x, y, z]}>
              <meshStandardMaterial {...M.aluminum} />
            </Box>
          ))}
        </group>
      </Sel>
      <Sel cid="CoolingFan">
        <group position={[0, y, z - RAD_L / 2 - FAN_D / 2]} rotation={[0, 0, Math.PI / 2]}>
          {/* shroud */}
          <mesh castShadow>
            <cylinderGeometry args={[FAN_R + 0.02, FAN_R + 0.02, FAN_D, 26, 1, true]} />
            <meshStandardMaterial {...M.blackPlastic} side={2} />
          </mesh>
          {/* hub */}
          <Cyl args={[0.045, 0.045, FAN_D, 14]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Cyl>
          {/* blades */}
          {Array.from({ length: 7 }).map((_, i) => {
            const a = (i / 7) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0]}
                rotation={[0, 0, a + 0.5]}
              >
                <boxGeometry args={[0.12, 0.055, 0.012]} />
                <meshStandardMaterial {...M.dark} />
              </mesh>
            );
          })}
        </group>
      </Sel>
    </group>
  );
}

export {
  ChassisFrame,
  BatteryPack,
  DriveUnit,
  RearDriveUnit,
  CoolingModule,
  PowerElectronics,
  HVBus,
};

export function Skateboard() {
  return (
    <group>
      <ChassisFrame />
      <BatteryPack />
      <DriveUnit />
      <RearDriveUnit />
      <CoolingModule />
      <PowerElectronics />
      <HVBus />
    </group>
  );
}

/* Re-exported for the battery-mode manager */
export const BATTERY_COMPONENT_IDS = [
  'BatteryPack_Tray', 'BatteryPack_Cover', 'BatteryPack_SideL', 'BatteryPack_SideR',
  'BatteryPack_XF', 'BatteryPack_XR', 'BatteryModuleRail_L', 'BatteryModuleRail_R', 'HVBus_Pack',
  'Module_01', 'Module_02', 'Module_03', 'Module_04', 'Module_05', 'Module_06', 'Module_07', 'Module_08',
  'BMS', 'HVJunctionBox', 'ServiceDisconnect', 'CoolingPlate', 'CoolantInlet', 'CoolantOutlet',
  'PackVent', 'Mount_BFL', 'Mount_BFR', 'Mount_BRL', 'Mount_BRR', 'Mount_ML', 'Mount_MR',
];
