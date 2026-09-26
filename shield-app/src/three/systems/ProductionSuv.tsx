import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { Sel } from '../Sel';
import { buildShellGeometry } from '../bodyShell';

/* ============================================================
   SHIELD — Standalone Production EV SUV (Complete Car Mode).
   Dedicated closed-body consumer vehicle model.
   - Metallic graphite silver paint with automotive clear-coat
   - Continuous closed body shell (hood, fenders, doors, roof, tailgate, bumpers)
   - Dark smoked automotive glass
   - Gloss black pillars, panoramic roof section, and roof rails
   - Machined 5-spoke alloy wheels with rubber tires
   - Modern EV continuous front LED bar and rear light strip
   ============================================================ */

/* Metallic Graphite Silver Paint */
const BODY_PAINT = {
  color: '#828e9e',
  emissive: '#101620',
  emissiveIntensity: 0.12,
  metalness: 0.82,
  roughness: 0.24,
  side: THREE.DoubleSide,
};

/* Smoked Dark Automotive Glass */
const GLASS_SMOKED = {
  color: '#0a0e14',
  emissive: '#04070a',
  emissiveIntensity: 0.1,
  metalness: 0.92,
  roughness: 0.06,
  transparent: true,
  opacity: 0.94,
  side: THREE.DoubleSide,
};

/* Gloss Black Trim & Pillars */
const TRIM_BLACK = {
  color: '#12161c',
  metalness: 0.45,
  roughness: 0.22,
};

/* Matte Lower Cladding & Tires */
const CLADDING_MATTE = {
  color: '#181c22',
  metalness: 0.1,
  roughness: 0.88,
};

/* Chrome / Machined Alloy Rims */
const ALLOY_CHROME = {
  color: '#d6deeb',
  metalness: 0.98,
  roughness: 0.14,
};

/* LED Front Bar & Headlamps */
const LED_FRONT = {
  color: '#ffffff',
  emissive: '#d6e8ff',
  emissiveIntensity: 1.4,
  metalness: 0.1,
  roughness: 0.1,
};

/* LED Rear Taillights */
const LED_REAR = {
  color: '#ff3b30',
  emissive: '#ff2d20',
  emissiveIntensity: 1.4,
  metalness: 0.1,
  roughness: 0.1,
};

/** Production Alloy Wheel Component */
function ProductionWheel({ position, side }: { position: [number, number, number]; side: 1 | -1 }) {
  const rotationY = side < 0 ? 0 : Math.PI;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Rubber Tire */}
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.39, 0.39, 0.24, 32]} />
        <meshStandardMaterial {...CLADDING_MATTE} />
      </mesh>

      {/* Outer Rim Lip */}
      <mesh castShadow position={[side * 0.11, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.35, 0.02, 16, 32]} />
        <meshStandardMaterial {...ALLOY_CHROME} />
      </mesh>

      {/* Inner Hub */}
      <mesh castShadow position={[side * 0.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.05, 20]} />
        <meshStandardMaterial {...ALLOY_CHROME} />
      </mesh>

      {/* 5 Dual Alloy Spokes */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / 5;
        return (
          <group key={i} rotation={[angle, 0, 0]}>
            <mesh castShadow position={[side * 0.1, 0.21, 0]}>
              <boxGeometry args={[0.035, 0.24, 0.045]} />
              <meshStandardMaterial {...ALLOY_CHROME} />
            </mesh>
          </group>
        );
      })}

      {/* Brake Disc & Caliper Behind Rim */}
      <mesh position={[side * 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.02, 24]} />
        <meshStandardMaterial color="#6a7482" metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh position={[side * 0.02, 0.18, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.12]} />
        <meshStandardMaterial color="#d1231b" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Complete Standalone Production SUV Body Model */
export function ProductionSuv() {
  /* Lofted body shell sections */
  const geoBumperFront = useMemo(() => buildShellGeometry({ zFrom: 1.98, zTo: 2.22, capFront: true }), []);
  const geoBumperRearUpper = useMemo(() => buildShellGeometry({ zFrom: -2.25, zTo: -1.95, tFrom: 0.0, tTo: 0.58, capRear: true }), []);
  const geoHood = useMemo(() => buildShellGeometry({ zFrom: 1.05, zTo: 1.98, tFrom: 0.56 }), []);
  const geoFenderL = useMemo(() => buildShellGeometry({ zFrom: 0.51, zTo: 1.98, tTo: 0.56, side: 'L' }), []);
  const geoFenderR = useMemo(() => buildShellGeometry({ zFrom: 0.51, zTo: 1.98, tTo: 0.56, side: 'R' }), []);
  const geoWindshield = useMemo(() => buildShellGeometry({ zFrom: 0.51, zTo: 1.05, tFrom: 0.56 }), []);
  const geoDoorFL = useMemo(() => buildShellGeometry({ zFrom: -0.07, zTo: 0.51, tTo: 0.56, side: 'L' }), []);
  const geoDoorFR = useMemo(() => buildShellGeometry({ zFrom: -0.07, zTo: 0.51, tTo: 0.56, side: 'R' }), []);
  const geoRoof = useMemo(() => buildShellGeometry({ zFrom: -1.44, zTo: 0.51, tFrom: 0.79 }), []);
  const geoGlassL = useMemo(() => buildShellGeometry({ zFrom: -1.44, zTo: -0.07, tFrom: 0.56, tTo: 0.79, side: 'L' }), []);
  const geoGlassR = useMemo(() => buildShellGeometry({ zFrom: -1.44, zTo: -0.07, tFrom: 0.56, tTo: 0.79, side: 'R' }), []);
  const geoDoorRL = useMemo(() => buildShellGeometry({ zFrom: -0.88, zTo: -0.07, tTo: 0.56, side: 'L' }), []);
  const geoDoorRR = useMemo(() => buildShellGeometry({ zFrom: -0.88, zTo: -0.07, tTo: 0.56, side: 'R' }), []);
  const geoQuarterL = useMemo(() => buildShellGeometry({ zFrom: -2.25, zTo: -0.88, tTo: 0.56, side: 'L' }), []);
  const geoQuarterR = useMemo(() => buildShellGeometry({ zFrom: -2.25, zTo: -0.88, tTo: 0.56, side: 'R' }), []);
  const geoGlassRear = useMemo(() => buildShellGeometry({ zFrom: -2.05, zTo: -1.44, tFrom: 0.56 }), []);
  const geoTailgate = useMemo(() => buildShellGeometry({ zFrom: -2.25, zTo: -1.44, tFrom: 0.56, capRear: true }), []);

  return (
    <group name="production-suv-model">
      {/* ---------------- FRONT FASCIA & HOOD ---------------- */}
      <Sel cid="FrontBumper">
        <mesh geometry={geoBumperFront} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
        {/* EV Lower Grille Intake */}
        <mesh position={[0, 0.62, 2.12]} castShadow>
          <boxGeometry args={[1.26, 0.22, 0.06]} />
          <meshStandardMaterial {...CLADDING_MATTE} />
        </mesh>
        {/* Front Underbody Skid Plate */}
        <mesh position={[0, 0.38, 2.14]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.04, 0.06, 0.24]} />
          <meshStandardMaterial color="#a0abb8" metalness={0.9} roughness={0.3} />
        </mesh>
      </Sel>

      <Sel cid="Hood">
        <mesh geometry={geoHood} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>

      {/* Front Fenders */}
      <Sel cid="FrontFender_L">
        <mesh geometry={geoFenderL} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>
      <Sel cid="FrontFender_R">
        <mesh geometry={geoFenderR} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>

      {/* Windshield */}
      <Sel cid="Windshield">
        <mesh geometry={geoWindshield} castShadow receiveShadow>
          <meshStandardMaterial {...GLASS_SMOKED} />
        </mesh>
      </Sel>

      {/* ---------------- DOORS & FLANKS ---------------- */}
      <Sel cid="Door_FL">
        <mesh geometry={geoDoorFL} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>
      <Sel cid="Door_FR">
        <mesh geometry={geoDoorFR} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>
      <Sel cid="Door_RL">
        <mesh geometry={geoDoorRL} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>
      <Sel cid="Door_RR">
        <mesh geometry={geoDoorRR} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>

      {/* Side Glass Windows */}
      <Sel cid="SideGlass_L">
        <mesh geometry={geoGlassL} castShadow receiveShadow>
          <meshStandardMaterial {...GLASS_SMOKED} />
        </mesh>
      </Sel>
      <Sel cid="SideGlass_R">
        <mesh geometry={geoGlassR} castShadow receiveShadow>
          <meshStandardMaterial {...GLASS_SMOKED} />
        </mesh>
      </Sel>

      {/* Rear Quarters */}
      <Sel cid="QuarterPanel_L">
        <mesh geometry={geoQuarterL} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>
      <Sel cid="QuarterPanel_R">
        <mesh geometry={geoQuarterR} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>

      {/* ---------------- ROOF & PILLARS ---------------- */}
      <Sel cid="RoofPanel">
        <mesh geometry={geoRoof} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
        {/* Panoramic Glass Roof Section */}
        <mesh position={[0, 1.62, -0.45]} castShadow>
          <boxGeometry args={[1.16, 0.02, 1.65]} />
          <meshStandardMaterial {...GLASS_SMOKED} />
        </mesh>
        {/* Gloss Black Roof Rails */}
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.54, 1.65, -0.45]}>
            <mesh castShadow>
              <boxGeometry args={[0.04, 0.035, 1.55]} />
              <meshStandardMaterial {...TRIM_BLACK} />
            </mesh>
            {[0.1, -1.0].map((z) => (
              <mesh key={z} position={[0, -0.02, z]} castShadow>
                <boxGeometry args={[0.06, 0.05, 0.12]} />
                <meshStandardMaterial {...TRIM_BLACK} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Shark-Fin Antenna */}
        <mesh position={[0, 1.65, -1.34]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.05, 0.14, 3]} />
          <meshStandardMaterial {...TRIM_BLACK} />
        </mesh>
        {/* Rear Integrated Roof Spoiler */}
        <mesh position={[0, 1.59, -1.54]} rotation={[-0.22, 0, 0]} castShadow>
          <boxGeometry args={[1.32, 0.045, 0.28]} />
          <meshStandardMaterial {...TRIM_BLACK} />
        </mesh>
      </Sel>

      {/* Black A / B / C Pillar Satin Trims */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          {/* B Pillar Cover */}
          <mesh position={[s * 0.95, 1.35, -0.07]} rotation={[0, 0, s * -0.08]} castShadow>
            <boxGeometry args={[0.03, 0.44, 0.08]} />
            <meshStandardMaterial {...TRIM_BLACK} />
          </mesh>
          {/* C Pillar Trim */}
          <mesh position={[s * 0.94, 1.35, -0.88]} rotation={[0, 0, s * -0.08]} castShadow>
            <boxGeometry args={[0.03, 0.44, 0.08]} />
            <meshStandardMaterial {...TRIM_BLACK} />
          </mesh>
        </group>
      ))}

      {/* ---------------- TAILGATE & REAR ---------------- */}
      <Sel cid="RearGlass">
        <mesh geometry={geoGlassRear} castShadow receiveShadow>
          <meshStandardMaterial {...GLASS_SMOKED} />
        </mesh>
        {/* High-Mounted Center Stop Light */}
        <mesh position={[0, 1.55, -1.52]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.44, 0.025, 0.02]} />
          <meshStandardMaterial {...LED_REAR} />
        </mesh>
      </Sel>

      <Sel cid="Tailgate">
        <mesh geometry={geoTailgate} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>
      </Sel>

      <Sel cid="RearBumper">
        {/* Upper Body-Color Rear Bumper Fascia (Matches Metallic Silver Body Paint) */}
        <mesh geometry={geoBumperRearUpper} castShadow receiveShadow>
          <meshStandardMaterial {...BODY_PAINT} />
        </mesh>

        {/* Outer Rear Corner Bumper Covers (Seamless transition to Quarter Panels & Rear Wheel Arches) */}
        {([-1, 1] as const).map((s) => (
          <group key={s}>
            <mesh position={[s * 0.88, 0.72, -2.12]} rotation={[0, s * -0.15, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.24, 0.28, 0.32]} />
              <meshStandardMaterial {...BODY_PAINT} />
            </mesh>
            <mesh position={[s * 0.94, 0.52, -1.88]} castShadow receiveShadow>
              <boxGeometry args={[0.16, 0.32, 0.65]} />
              <meshStandardMaterial {...CLADDING_MATTE} />
            </mesh>
          </group>
        ))}

        {/* Main Lower Satin Black Bumper Apron (Full Side-to-Side Underbody & Chassis Coverage) */}
        <mesh position={[0, 0.52, -2.14]} castShadow receiveShadow>
          <boxGeometry args={[1.82, 0.32, 0.26]} />
          <meshStandardMaterial {...CLADDING_MATTE} />
        </mesh>
        <mesh position={[0, 0.68, -2.22]} castShadow receiveShadow>
          <boxGeometry args={[1.68, 0.16, 0.08]} />
          <meshStandardMaterial {...CLADDING_MATTE} />
        </mesh>

        {/* Central Metallic Silver EV Skid-Plate / Aerodynamic Underbody Shield */}
        <mesh position={[0, 0.38, -2.15]} rotation={[-0.14, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.14, 0.28]} />
          <meshStandardMaterial color="#a0abb8" metalness={0.88} roughness={0.28} />
        </mesh>
        {/* Aerodynamic Lower Diffuser Strakes (EV Aero) */}
        {[-0.36, -0.12, 0.12, 0.36].map((dx) => (
          <mesh key={dx} position={[dx, 0.34, -2.22]} rotation={[-0.14, 0, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.16]} />
            <meshStandardMaterial {...CLADDING_MATTE} />
          </mesh>
        ))}

        {/* Integrated Red Rear Reflectors (Left & Right Lower Bumper) */}
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.68, 0.74, -2.25]}>
            <mesh castShadow>
              <boxGeometry args={[0.24, 0.042, 0.03]} />
              <meshStandardMaterial {...LED_REAR} />
            </mesh>
            <mesh position={[0, 0, -0.01]}>
              <boxGeometry args={[0.26, 0.055, 0.02]} />
              <meshStandardMaterial {...TRIM_BLACK} />
            </mesh>
          </group>
        ))}

        {/* Integrated Ultrasonic Parking Sensors (4 Recessed Markers) */}
        {[-0.65, -0.22, 0.22, 0.65].map((sx) => (
          <group key={sx} position={[sx, 0.66, -2.26]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.01, 16]} />
              <meshStandardMaterial color="#2a3038" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.002]}>
              <cylinderGeometry args={[0.008, 0.008, 0.012, 16]} />
              <meshStandardMaterial color="#606c7a" metalness={0.4} roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Central Tow-Hook Access Cover Hatch */}
        <mesh position={[0, 0.52, -2.26]}>
          <boxGeometry args={[0.13, 0.11, 0.012]} />
          <meshStandardMaterial color="#20252c" metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Rear License Plate Recess & Dual Overhead LED Lights */}
        <group position={[0, 0.92, -2.22]}>
          <mesh castShadow>
            <boxGeometry args={[0.48, 0.18, 0.04]} />
            <meshStandardMaterial {...CLADDING_MATTE} />
          </mesh>
          {[-0.14, 0.14].map((lx) => (
            <mesh key={lx} position={[lx, 0.08, -0.01]}>
              <boxGeometry args={[0.06, 0.015, 0.02]} />
              <meshStandardMaterial color="#e0f0ff" emissive="#d0e4ff" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      </Sel>

      {/* ---------------- EXTERIOR TRIM & LIGHTING ---------------- */}

      {/* Black Wheel Arch Cladding (4 Corners) */}
      {[
        { cid: 'ArchCladding_FL', s: -1 as const, z: 1.425 },
        { cid: 'ArchCladding_FR', s: 1 as const, z: 1.425 },
        { cid: 'ArchCladding_RL', s: -1 as const, z: -1.425 },
        { cid: 'ArchCladding_RR', s: 1 as const, z: -1.425 },
      ].map((c) => (
        <Sel key={c.cid} cid={c.cid}>
          <mesh position={[c.s * 0.99, 0.38, c.z]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.45, 0.045, 8, 28, Math.PI]} />
            <meshStandardMaterial {...CLADDING_MATTE} />
          </mesh>
        </Sel>
      ))}

      {/* Rocker Sill Cladding Side Skirts */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'RockerCladding_L' : 'RockerCladding_R'}>
          <mesh position={[s * 0.985, 0.48, 0]} castShadow>
            <boxGeometry args={[0.06, 0.16, 1.84]} />
            <meshStandardMaterial {...CLADDING_MATTE} />
          </mesh>
        </Sel>
      ))}

      {/* Continuous Front LED Light Bar */}
      <Sel cid="Headlamp_L">
        <mesh position={[0, 0.97, 2.16]} castShadow>
          <boxGeometry args={[1.62, 0.035, 0.04]} />
          <meshStandardMaterial {...LED_FRONT} />
        </mesh>
        {/* Left LED Headlight Pod */}
        <mesh position={[-0.72, 0.92, 2.12]} castShadow>
          <boxGeometry args={[0.26, 0.1, 0.06]} />
          <meshStandardMaterial {...LED_FRONT} />
        </mesh>
      </Sel>
      <Sel cid="Headlamp_R">
        {/* Right LED Headlight Pod */}
        <mesh position={[0.72, 0.92, 2.12]} castShadow>
          <boxGeometry args={[0.26, 0.1, 0.06]} />
          <meshStandardMaterial {...LED_FRONT} />
        </mesh>
      </Sel>

      {/* Continuous Rear LED Light Bar */}
      <Sel cid="Taillamp_L">
        <mesh position={[0, 1.14, -2.18]} castShadow>
          <boxGeometry args={[1.56, 0.045, 0.04]} />
          <meshStandardMaterial {...LED_REAR} />
        </mesh>
      </Sel>
      <Sel cid="Taillamp_R">
        {/* Dual Rear Lower Reflectors */}
        {([-0.45, 0.45] as const).map((rx) => (
          <mesh key={rx} position={[rx, 0.74, -2.18]}>
            <boxGeometry args={[0.18, 0.035, 0.02]} />
            <meshStandardMaterial {...LED_REAR} />
          </mesh>
        ))}
      </Sel>

      {/* Side Mirrors */}
      <Sel cid="Mirrors">
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 1.02, 1.18, 0.58]}>
            <mesh position={[s * -0.05, 0, -0.02]} castShadow>
              <boxGeometry args={[0.08, 0.035, 0.05]} />
              <meshStandardMaterial {...TRIM_BLACK} />
            </mesh>
            <mesh position={[s * 0.06, 0.02, 0]} castShadow>
              <capsuleGeometry args={[0.065, 0.065, 4, 12]} />
              <meshStandardMaterial {...BODY_PAINT} />
            </mesh>

            <mesh position={[s * 0.07, 0.02, 0.04]}>
              <boxGeometry args={[0.08, 0.015, 0.01]} />
              <meshStandardMaterial {...LED_FRONT} />
            </mesh>
          </group>
        ))}
      </Sel>

      {/* Flush Door Handles */}
      {[
        ['DoorHandle_FL', -1, 0.45],
        ['DoorHandle_FR', 1, 0.45],
        ['DoorHandle_RL', -1, -0.45],
        ['DoorHandle_RR', 1, -0.45],
      ].map(([cid, s, z]) => (
        <Sel key={cid as string} cid={cid as string}>
          <mesh position={[(s as number) * 1.005, 1.03, z as number]}>
            <boxGeometry args={[0.02, 0.04, 0.18]} />
            <meshStandardMaterial color="#c5cbd6" metalness={0.95} roughness={0.18} />
          </mesh>
        </Sel>
      ))}

      {/* ---------------- FULL SEALED UNDERBODY TRAY ---------------- */}
      <Sel cid="UnderbodyAero_Mid">
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.74, 0.05, 4.15]} />
          <meshStandardMaterial {...CLADDING_MATTE} />
        </mesh>
      </Sel>

      {/* ---------------- 4 PRODUCTION ALLOY WHEELS ---------------- */}
      <ProductionWheel position={[-0.82, 0.38, 1.425]} side={-1} />
      <ProductionWheel position={[0.82, 0.38, 1.425]} side={1} />
      <ProductionWheel position={[-0.82, 0.38, -1.425]} side={-1} />
      <ProductionWheel position={[0.82, 0.38, -1.425]} side={1} />
    </group>
  );
}
