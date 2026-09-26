import { Box, Cyl, Rod } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';

/* ============================================================
   Brakes & wheels — full corner assembly per wheel position.

   The wheels follow the reference's 18-inch-class turbine alloys:
   a deep-dish barrel, a dark inner pocket and ten radial
   turbine spokes that are rolled about their own radial axis to
   give the swept "fan" look.  Tyres are 18-inch-class tori
   (235-section), so the outer face sits just proud of the
   0.90 m half-width body for the wide, planted stance shown in
   the reference.

   Note the +90° yaw on every wheel group: a THREE.Torus lies
   in its local XY plane, so it must be rotated for the ring
   plane to end up in world ZY with the axle along world X.
   ============================================================ */

const SPOKES = 10;

function WheelAssembly(props: { s: number; z: number }) {
  const { s, z } = props;
  const side = s < 0 ? 'L' : 'R';
  const front = z > 0;
  const tag = `${front ? '' : 'R'}${side}`;

  const tireMajor = D.tireR - D.tireW / 2; // torus centreline radius
  const tireTube = D.tireW / 2;

  return (
    <group>
      {/* ---- tyre ---- */}
      <Sel cid={`Tire_${tag}`}>
        <group position={[s * D.wheelX, D.wheelY, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow>
            <torusGeometry args={[tireMajor, tireTube, 16, 34]} />
            <meshStandardMaterial {...M.tire} />
          </mesh>
          {/* shoulder ribs, so the sidewall does not read as a plain donut */}
          {[0.62, 0.78].map((k) => (
            <mesh key={k} rotation={[0, 0, 0]}>
              <torusGeometry args={[tireMajor + tireTube * k, 0.008, 6, 34]} />
              <meshStandardMaterial {...M.blackPlastic} />
            </mesh>
          ))}
        </group>
      </Sel>

      {/* ---- rim: deep-dish barrel + turbine spokes ---- */}
      <Sel cid={`Wheel_${tag}`}>
        <group position={[s * D.wheelX, D.wheelY, z]} rotation={[0, Math.PI / 2, 0]}>
          {/* outer lip */}
          <mesh castShadow>
            <cylinderGeometry args={[D.rimR, D.rimR, D.tireW - 0.02, 34]} />
            <meshStandardMaterial {...M.rim} envMapIntensity={1.25} />
          </mesh>
          {/* polished outer face ring */}
          <mesh position={[0, (D.tireW - 0.02) / 2 - 0.006, 0]}>
            <torusGeometry args={[D.rimR - 0.012, 0.014, 8, 34]} />
            <meshStandardMaterial {...M.chrome} envMapIntensity={1.4} />
          </mesh>
          {/* dark inner pocket, offset inboard for the deep-dish read */}
          <mesh position={[0, -0.055, 0]}>
            <cylinderGeometry args={[D.rimR - 0.03, D.rimR - 0.03, 0.09, 30]} />
            <meshStandardMaterial {...M.blackPlastic} />
          </mesh>
          {/* ten swept turbine spokes */}
          {Array.from({ length: SPOKES }).map((_, i) => {
            const a = (i / SPOKES) * Math.PI * 2;
            return (
              <group key={i} rotation={[0, a, 0]}>
                <mesh position={[0.112, 0.028, 0]} rotation={[0.34, 0, 0]} castShadow>
                  <boxGeometry args={[0.2, 0.042, 0.072]} />
                  <meshStandardMaterial {...M.rim} envMapIntensity={1.2} />
                </mesh>
                {/* machined highlight along each spoke */}
                <mesh position={[0.112, 0.052, 0]} rotation={[0.34, 0, 0]}>
                  <boxGeometry args={[0.17, 0.012, 0.026]} />
                  <meshStandardMaterial {...M.chrome} envMapIntensity={1.4} />
                </mesh>
              </group>
            );
          })}
          {/* centre cap */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.058, 0.028, 22]} />
            <meshStandardMaterial {...M.chrome} envMapIntensity={1.3} />
          </mesh>
          {/* lug bolts */}
          {Array.from({ length: 5 }).map((_, i) => {
            const a = (i / 5) * Math.PI * 2 + 0.3;
            return (
              <Cyl
                key={i}
                args={[0.013, 0.013, 0.022, 8]}
                position={[Math.cos(a) * 0.085, 0.062, Math.sin(a) * 0.085]}
              >
                <meshStandardMaterial {...M.bolt} />
              </Cyl>
            );
          })}
        </group>
      </Sel>

      {/* ---- hub / bearing: R90 x 60 per the spec ---- */}
      <Sel cid={`Hub_${tag}`}>
        <Cyl
          args={[D.hubR, D.hubR, D.hubW, 20]}
          position={[s * D.wheelX, D.wheelY, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <meshStandardMaterial {...M.steel} />
        </Cyl>
        {/* hub flange */}
        <Cyl
          args={[D.hubR + 0.018, D.hubR + 0.018, 0.014, 20]}
          position={[s * (D.wheelX + 0.03), D.wheelY, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <meshStandardMaterial {...M.steelDark} />
        </Cyl>
      </Sel>

      {/* ---- brake disc R160 x 12 + caliper, inboard of the rim ---- */}
      <Sel cid={`Disc_${tag}`}>
        <group position={[s * (D.wheelX - 0.115), D.wheelY, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[D.discR, D.discR, D.discThk, 30]} />
            <meshStandardMaterial {...M.disc} />
          </mesh>
          {/* vented vanes */}
          {[0.07, 0.115, 0.155].map((r) => (
            <mesh key={r}>
              <torusGeometry args={[r, 0.005, 5, 24]} />
              <meshStandardMaterial {...M.steelDark2} />
            </mesh>
          ))}
          {/* bell / hat */}
          <Cyl args={[0.085, 0.085, 0.07, 18]} position={[0, 0.045, 0]}>
            <meshStandardMaterial {...M.steelDark} />
          </Cyl>
        </group>
      </Sel>
      <Sel cid={`Caliper_${tag}`}>
        <group position={[s * (D.wheelX - 0.115), D.wheelY, z - 0.115]}>
          <Box args={[0.1, 0.22, 0.17]}>
            <meshStandardMaterial {...M.caliper} />
          </Box>
          <Box args={[0.11, 0.11, 0.07]} position={[0, 0.11, 0]}>
            <meshStandardMaterial {...M.dark} />
          </Box>
        </group>
      </Sel>

      {/* ---- wheel speed sensor ---- */}
      <Sel cid={`ABS_WSS_${tag}`}>
        <Cyl
          args={[0.014, 0.014, 0.05, 8]}
          position={[s * (D.wheelX - 0.1), D.wheelY - 0.09, z - 0.07]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <meshStandardMaterial {...M.blackPlastic} />
        </Cyl>
      </Sel>
    </group>
  );
}

/**
 * Wheels and brakes.
 *
 * `side` renders only one flank, which lets the CAD cutaway pull
 * each pair outward on its own axis. Omit it for all four corners.
 */
export function BrakesWheels({ side }: { side?: -1 | 1 }) {
  const all: { s: -1 | 1; z: number }[] = [
    { s: -1, z: D.axleFront },
    { s: 1, z: D.axleFront },
    { s: -1, z: D.axleRear },
    { s: 1, z: D.axleRear },
  ];
  const corners = side === undefined ? all : all.filter((c) => c.s === side);
  return (
    <group>
      {corners.map((c, i) => (
        <WheelAssembly key={i} s={c.s} z={c.z} />
      ))}

      {/* brake lines front → rear, both flanks */}
      <Sel cid="BrakeLines">
        <group>
          {([-1, 1] as const).map((s) => (
            <group key={s}>
              <Rod a={[0, 0.55, 1.5]} b={[s * 0.5, 0.4, 1.42]} r={0.005}>
                <meshStandardMaterial {...M.steelDark2} />
              </Rod>
              <Rod a={[0, 0.55, 1.5]} b={[0, 0.5, 0.3]} r={0.005}>
                <meshStandardMaterial {...M.steelDark2} />
              </Rod>
              <Rod a={[0, 0.5, 0.3]} b={[s * 0.52, 0.42, -1.25]} r={0.005}>
                <meshStandardMaterial {...M.steelDark2} />
              </Rod>
            </group>
          ))}
        </group>
      </Sel>
    </group>
  );
}
