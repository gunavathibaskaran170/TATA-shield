import { Box, Cyl, Rod } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';
import { useTubeGeo } from '../geom';

/* ============================================================
   SHIELD external IP67 instrumentation enclosure.

   Per the supplied parametric assembly this is a *detached* test
   instrument, not part of the car: a 300 x 200 x 120 mm IP67
   enclosure with a 35 mm hinged lid and 4 mm wall, standing
   800 mm outboard of the chassis edge, linked to the SG2 rail
   strain-gauge enclosure by an R6 mm low-voltage harness.

   Envelope, wall, standoff, OLED bezel, buzzer and bulkhead
   connector are from the supplied definition.  The internal
   electronics stack (breadboard / ESP32 / HX711 / bridge /
   ADS1115 / USB) is DEMO.
   ============================================================ */

const BX = D.boxX;
const BY = D.boxY;
const BZ = D.boxZ;
const W = D.boxL;   // along z
const Dp = D.boxW;  // along x
const H = D.boxH;   // along y
const WALL = D.boxWall;

function ShieldBox() {
  return (
    <group>
      {/* ---- shell: open-topped enclosure ---- */}
      <Sel cid="ShieldBox_Shell">
        <group position={[BX, BY + H / 2, BZ]}>
          {/* four walls + floor, so the interior stays readable */}
          <Box args={[Dp, WALL, W]} position={[0, -H / 2 + WALL / 2, 0]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          <Box args={[WALL, H, W]} position={[-Dp / 2 + WALL / 2, 0, 0]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          <Box args={[WALL, H, W]} position={[Dp / 2 - WALL / 2, 0, 0]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          <Box args={[Dp, H, WALL]} position={[0, 0, W / 2 - WALL / 2]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          <Box args={[Dp, H, WALL]} position={[0, 0, -W / 2 + WALL / 2]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          {/* corner posts for a ruggedised look */}
          {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz]) => (
            <Box
              key={`${sx}${sz}`}
              args={[0.012, H - 2 * WALL, 0.012]}
              position={[sx * (Dp / 2 - 0.012), 0, sz * (W / 2 - 0.012)]}
            >
              <meshStandardMaterial {...M.steelDark2} />
            </Box>
          ))}
        </group>
      </Sel>

      {/* ---- hinged lid ---- */}
      <Sel cid="ShieldBox_Lid">
        <group position={[BX, BY + H + D.boxLidH / 2, BZ]}>
          <Box args={[Dp, D.boxLidH, W]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Box>
          {/* hinge knuckles along the outboard edge */}
          {[-0.36, 0, 0.36].map((z) => (
            <Cyl key={z} args={[0.008, 0.008, 0.03, 8]} position={[-Dp / 2, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial {...M.steelDark2} />
            </Cyl>
          ))}
        </group>
      </Sel>

      {/* ---- control panel on the outboard face ---- */}
      <Sel cid="ShieldBox_Panel">
        <group position={[BX + Dp / 2, BY + H / 2, BZ]}>
          {/* OLED 34 x 18 bezel */}
          <Box args={[0.006, D.oledW + 0.012, D.oledL + 0.012]} position={[0.003, 0.02, -0.05]}>
            <meshStandardMaterial {...M.dark} />
          </Box>
          <Box args={[0.004, D.oledW, D.oledL]} position={[0.007, 0.02, -0.05]}>
            <meshStandardMaterial color="#0b1a22" emissive="#38d9cf" emissiveIntensity={0.85} />
          </Box>
          {/* three status LEDs */}
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0.008, 0.02, 0.03 + i * 0.02]}>
              <cylinderGeometry args={[D.ledR, D.ledR, 0.006, 10]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive={i === 0 ? '#4fe0a0' : i === 1 ? '#f2b94e' : '#ff6b5e'}
                emissiveIntensity={1.4}
              />
            </mesh>
          ))}
          {/* buzzer */}
          <Cyl args={[D.buzzerR, D.buzzerR, 0.008, 14]} position={[0.008, 0.02, 0.12]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial {...M.blackPlastic} />
          </Cyl>
        </group>
      </Sel>

      {/* ---- bulkhead connector on the inboard face ---- */}
      <Sel cid="ShieldBox_Bulkhead">
        <group position={[BX - Dp / 2, BY + H * 0.5, BZ - 0.045]}>
          <Cyl
            args={[D.bulkheadR, D.bulkheadR, D.bulkheadLen, 16]}
            position={[-D.bulkheadLen / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <meshStandardMaterial {...M.steelDark2} />
          </Cyl>
          <Cyl
            args={[D.bulkheadR * 0.55, D.bulkheadR * 0.55, 0.01, 14]}
            position={[-D.bulkheadLen - 0.004, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <meshStandardMaterial color="#141a1f" emissive="#4fe0a0" emissiveIntensity={0.25} />
          </Cyl>
        </group>
      </Sel>

      {/* ---- internal electronics stack (DEMO) ---- */}
      <Sel cid="ShieldBox_Electronics">
        <group position={[BX, BY + WALL, BZ]}>
          {/* breadboard 165 x 55 mm */}
          <Box args={[0.055, 0.009, 0.165]} position={[0, 0.0045, -0.04]}>
            <meshStandardMaterial color="#1d5c4e" metalness={0.1} roughness={0.7} />
          </Box>
          {/* ESP32 51 x 28 mm */}
          <Box args={[0.028, 0.012, 0.051]} position={[0, 0.015, -0.04]}>
            <meshStandardMaterial color="#10161c" metalness={0.2} roughness={0.6} />
          </Box>
          {/* 3 x HX711 load-cell amp */}
          {[0, 1, 2].map((i) => (
            <Box key={i} args={[0.017, 0.006, 0.022]} position={[-0.012, 0.012, 0.045 + i * 0.03]}>
              <meshStandardMaterial color="#1c2a34" metalness={0.2} roughness={0.6} />
            </Box>
          ))}
          {/* 2 x bridge modules */}
          {[0, 1].map((i) => (
            <Box key={i} args={[0.022, 0.008, 0.028]} position={[0.01, 0.013, 0.05 + i * 0.038]}>
              <meshStandardMaterial color="#24303a" metalness={0.2} roughness={0.6} />
            </Box>
          ))}
          {/* ADS1115 ADC */}
          <Box args={[0.015, 0.005, 0.018]} position={[0.005, 0.0115, 0.1]}>
            <meshStandardMaterial color="#1c2a34" metalness={0.2} roughness={0.6} />
          </Box>
          {/* USB module */}
          <Box args={[0.025, 0.02, 0.095]} position={[0, 0.019, 0.13]}>
            <meshStandardMaterial {...M.aluminum} />
          </Box>
        </group>
      </Sel>

      {/* ---- low-voltage harness back to the SG2 rail enclosure ---- */}
      <SensorHarnessRun />
    </group>
  );
}

function SensorHarnessRun() {
  const r = D.harnessR;
  const { geo } = useTubeGeo([
    [BX - Dp / 2, BY + H * 0.5, BZ - 0.045 - D.bulkheadLen],
    [BX - Dp / 2 - 0.22, BY + 0.1, BZ - 0.12],
    [D.railX + 0.34, D.railY1 + 0.12, D.sg2Z + 0.2],
    [D.railX + D.sgW, D.railY1 + D.sgH / 2, D.sg2Z],
  ]);
  return (
    <Sel cid="SensorHarness">
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#2f6fd0" metalness={0.15} roughness={0.7} />
      </mesh>
      {/* cable tie-downs along the run */}
      <Rod
        a={[BX - Dp / 2 - 0.22, BY + 0.1, BZ - 0.12]}
        b={[D.railX + 0.34, D.railY1 + 0.12, D.sg2Z + 0.2]}
        r={r * 0.7}
      >
        <meshStandardMaterial color="#1b2634" metalness={0.1} roughness={0.8} />
      </Rod>
    </Sel>
  );
}

export function ShieldInstrumentBox() {
  return <ShieldBox />;
}
