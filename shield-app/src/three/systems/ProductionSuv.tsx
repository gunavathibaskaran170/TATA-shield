import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { HARDPOINT_PROFILES } from '../../data/hardpoints';
import { Sel } from '../Sel';
import { buildShellGeometry } from '../bodyShell';
import { Cabin } from './Cabin';

/* ============================================================
   SHIELD — Standalone Production EV SUV (Complete Car Mode).
   Dedicated closed-body consumer vehicle model.
   - Metallic graphite silver paint with automotive clear-coat
   - Continuous closed body shell (hood, fenders, doors, roof, tailgate, bumpers)
   - Dark smoked automotive glass with visible high-fidelity interior structure
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

/* Transparent Pearl White Body Glass Shell */
const BODY_PAINT_TRANSPARENT = {
  color: '#e2e8f0',
  emissive: '#1a2436',
  emissiveIntensity: 0.15,
  metalness: 0.2,
  roughness: 0.1,
  transparent: true,
  opacity: 0.22,
  side: THREE.DoubleSide,
};

/* High-Strength Unibody Structural Frame Steel */
const UNIBODY_STEEL = {
  color: '#c2cbd8',
  metalness: 0.9,
  roughness: 0.25,
};

/* Smoked Tinted Automotive Glass (Allows interior visibility) */
const GLASS_SMOKED = {
  color: '#161e28',
  emissive: '#04070a',
  emissiveIntensity: 0.08,
  metalness: 0.75,
  roughness: 0.08,
  transparent: true,
  opacity: 0.52,
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

function getContinuousFeaMaterial(normalizedScalar: number) {
  const t = Math.max(0, Math.min(1.0, normalizedScalar));

  let hex = '1e3a8a';
  let emissiveHex = '#0f172a';
  let emissiveIntensity = 0.15;

  if (t < 0.15) {
    const k = t / 0.15;
    hex = new THREE.Color('#1e3a8a').lerp(new THREE.Color('#3b82f6'), k).getHexString();
    emissiveHex = '#1e3a8a';
    emissiveIntensity = 0.15 + k * 0.1;
  } else if (t < 0.30) {
    const k = (t - 0.15) / 0.15;
    hex = new THREE.Color('#3b82f6').lerp(new THREE.Color('#06b6d4'), k).getHexString();
    emissiveHex = '#0284c7';
    emissiveIntensity = 0.2 + k * 0.1;
  } else if (t < 0.45) {
    const k = (t - 0.30) / 0.15;
    hex = new THREE.Color('#06b6d4').lerp(new THREE.Color('#22c55e'), k).getHexString();
    emissiveHex = '#042f2e';
    emissiveIntensity = 0.25;
  } else if (t < 0.65) {
    const k = (t - 0.45) / 0.20;
    hex = new THREE.Color('#22c55e').lerp(new THREE.Color('#eab308'), k).getHexString();
    emissiveHex = '#451a03';
    emissiveIntensity = 0.3 + k * 0.15;
  } else if (t < 0.82) {
    const k = (t - 0.65) / 0.17;
    hex = new THREE.Color('#eab308').lerp(new THREE.Color('#f97316'), k).getHexString();
    emissiveHex = '#7c2d12';
    emissiveIntensity = 0.45 + k * 0.15;
  } else {
    const k = (t - 0.82) / 0.18;
    hex = new THREE.Color('#f97316').lerp(new THREE.Color('#ef4444'), k).getHexString();
    emissiveHex = '#991b1b';
    emissiveIntensity = 0.6 + k * 0.4;
  }

  return {
    color: '#' + hex,
    emissive: emissiveHex,
    emissiveIntensity,
    metalness: 0.65,
    roughness: 0.2,
  };
}

/** Unibody Structural Frame & Battery Enclosure (Chassis & Transparent Modes) */
function UnibodyFrame() {
  const activeHardpointId = useStore((s) => s.activeHardpointId);
  const manualAppliedForceN = useStore((s) => s.manualAppliedForceN);
  const manualLoadVector = useStore((s) => s.manualLoadVector);
  const manualDeformationScale = useStore((s) => s.manualDeformationScale);
  const isDeformationAmplified = useStore((s) => s.isDeformationAmplified);

  const profile = HARDPOINT_PROFILES[activeHardpointId] || HARDPOINT_PROFILES.front_rail_lh;
  const forceKn = manualAppliedForceN / 1000;
  const scaleK = isDeformationAmplified ? manualDeformationScale : 1;

  // Calculate FEA spatial stress propagation for each chassis member
  const isFrontRail = activeHardpointId === 'front_rail_lh' || activeHardpointId === 'front_rail_rh';
  const isBattery = activeHardpointId === 'battery_enclosure';
  const isStrut = activeHardpointId === 'shock_tower_fl';
  const isCrossmember = activeHardpointId === 'floor_crossmember_1' || activeHardpointId === 'crossmember_front';

  // Reduced-Order FEA Spatial Response Model (0.0 = Dark Blue, 1.0 = Peak Red Hotspot)
  const normLoad = Math.min(1.0, forceKn / (profile.yieldForceLimitKn || 45));
  const frontRailScalar = isFrontRail ? 1.0 * normLoad : isStrut ? 0.7 * normLoad : 0.22 * normLoad;
  const batteryScalar = isBattery ? 1.0 * normLoad : isCrossmember ? 0.65 * normLoad : 0.2 * normLoad;
  const sillScalar = isBattery ? 0.8 * normLoad : isCrossmember ? 0.75 * normLoad : isFrontRail ? 0.5 * normLoad : 0.28 * normLoad;
  const crossmemberScalar = isCrossmember ? 1.0 * normLoad : isBattery ? 0.7 * normLoad : isFrontRail ? 0.45 * normLoad : 0.25 * normLoad;

  const matFrontRail = getContinuousFeaMaterial(frontRailScalar);
  const matBattery = getContinuousFeaMaterial(batteryScalar);
  const matSideSills = getContinuousFeaMaterial(sillScalar);
  const matCrossmembers = getContinuousFeaMaterial(crossmemberScalar);

  const dX = (manualLoadVector[0] * (forceKn / 45) * 0.1 * scaleK);
  const dY = (manualLoadVector[1] * (forceKn / 45) * 0.1 * scaleK);
  const dZ = (manualLoadVector[2] * (forceKn / 45) * 0.1 * scaleK);

  const frontRailOffset: [number, number, number] = isFrontRail ? [dX, dY, dZ] : [0, 0, 0];

  return (
    <group name="unibody-frame">
      {/* Side Sills (Left & Right Longitudinal Extrusions with Perforated Lightening Holes) */}
      {([-1, 1] as const).map((s) => (
        <Sel key={s} cid={s < 0 ? 'SideSills_L' : 'SideSills_R'}>
          <group position={[s * 0.86 + (isBattery ? dX * 0.5 : 0), 0.38 + (isBattery ? dY * 0.5 : 0), (isBattery ? dZ * 0.5 : 0)]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.14, 0.18, 3.42]} />
              <meshStandardMaterial {...matSideSills} />
            </mesh>
            {/* Machined Perforated Lightening Holes along side sills */}
            {[-1.4, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0, 1.4].map((hz) => (
              <mesh key={hz} position={[s * 0.071, 0, hz]} rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
                <meshStandardMaterial color="#1a202c" metalness={0.9} roughness={0.1} />
              </mesh>
            ))}
          </group>
        </Sel>
      ))}

      {/* Floor Crossmembers (Transverse Underfloor Load-Bearing Beams) */}
      {[-1.2, -0.4, 0.4, 1.2].map((z, idx) => (
        <Sel key={z} cid={`FloorCrossmember_${idx + 1}`}>
          <group position={[0, 0.38, z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.62, 0.12, 0.12]} />
              <meshStandardMaterial {...matCrossmembers} />
            </mesh>
            {/* Bolted Flange Brackets connecting to Side Sills */}
            {([-1, 1] as const).map((s) => (
              <mesh key={s} position={[s * 0.78, 0, 0]} castShadow>
                <boxGeometry args={[0.06, 0.16, 0.16]} />
                <meshStandardMaterial color="#4a5568" metalness={0.88} roughness={0.2} />
              </mesh>
            ))}
          </group>
        </Sel>
      ))}

      {/* Battery Enclosure & Pack (Segmented Cell Modules + HV Busbars) */}
      <Sel cid="BatteryEnclosure">
        {/* Main Tray */}
        <mesh position={[0, 0.32, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[1.38, 0.16, 2.25]} />
          <meshStandardMaterial {...matBattery} />
        </mesh>
        {/* Battery Top Sealed Cover */}
        <mesh position={[0, 0.41, -0.1]} castShadow>
          <boxGeometry args={[1.34, 0.02, 2.21]} />
          <meshStandardMaterial color="#68768a" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Segmented Rectangular Battery Modules with Cell Matrix Lines */}
        {[-0.8, -0.3, 0.3, 0.8].map((bz) =>
          ([-0.35, 0.35] as const).map((bx) => (
            <group key={`mod_${bz}_${bx}`} position={[bx, 0.428, bz - 0.1]}>
              <mesh castShadow>
                <boxGeometry args={[0.56, 0.03, 0.42]} />
                <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Module Top Busbar Terminals */}
              <mesh position={[0, 0.018, 0]}>
                <boxGeometry args={[0.48, 0.005, 0.08]} />
                <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.8} />
              </mesh>
            </group>
          ))
        )}
        {/* Battery Mounting Brackets to Unibody Sills */}
        {[-0.9, 0, 0.9].map((bz) =>
          ([-1, 1] as const).map((s) => (
            <mesh key={`${bz}_${s}`} position={[s * 0.74, 0.38, bz - 0.1]} castShadow>
              <boxGeometry args={[0.12, 0.08, 0.14]} />
              <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.25} />
            </mesh>
          ))
        )}
      </Sel>

      {/* Heavy High-Detail Front Subframe Cradle & Suspension Towers */}
      <Sel cid="FrontSubframe">
        <group position={frontRailOffset}>
          {/* Lower Subframe Cradle Box Structure */}
        <mesh position={[0, 0.36, 1.45]} castShadow receiveShadow>
          <boxGeometry args={[1.22, 0.14, 0.75]} />
          <meshStandardMaterial {...matFrontRail} />
        </mesh>

        {/* Heavy Front Bumper Transverse Impact Beam with Perforated Lightening Windows */}
        <group position={[0, 0.42, 2.05]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.68, 0.16, 0.12]} />
            <meshStandardMaterial {...matFrontRail} />
          </mesh>
          {/* CNC Machined Perforated Circular Pockets along Front Bumper */}
          {[-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7].map((bx) => (
            <mesh key={bx} position={[bx, 0, 0.051]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.02, 16]} />
              <meshStandardMaterial color="#141820" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* Dual Progressive Crash Boxes & Mounting Flanges */}
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.58, 0.38, 1.75]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.18, 0.16, 0.48]} />
              <meshStandardMaterial {...matFrontRail} />
            </mesh>
            {/* Crash Box Corrugation Pockets */}
            {[-0.15, 0, 0.15].map((pz) => (
              <mesh key={pz} position={[0, 0, pz]}>
                <boxGeometry args={[0.19, 0.17, 0.04]} />
                <meshStandardMaterial color="#2d3748" metalness={0.85} roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Transverse Subframe Cross Braces */}
        <mesh position={[0, 0.48, 1.55]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.18, 0.06, 0.08]} />
          <meshStandardMaterial {...matFrontRail} />
        </mesh>
        <mesh position={[0, 0.34, 1.25]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.28, 0.08, 0.1]} />
          <meshStandardMaterial {...matFrontRail} />
        </mesh>

        {/* Front Steering Gear Housing & Tie Rods */}
        <mesh position={[0, 0.32, 1.425]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 1.25, 16]} />
          <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.2} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <mesh key={s} position={[s * 0.72, 0.32, 1.425]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.28, 12]} />
            <meshStandardMaterial color="#d6deeb" metalness={0.95} roughness={0.15} />
          </mesh>
        ))}

        {/* ---------------- ELECTRIC DRIVE MOTOR POWERTRAIN ASSEMBLY ---------------- */}
        <Sel cid="DriveUnit_Front">
          <group position={[0, 0.44, 1.45]}>
            {/* PMSM Electric Motor Cylindrical Casing */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.18, 0.18, 0.44, 24]} />
              <meshStandardMaterial color="#2a3240" metalness={0.88} roughness={0.2} />
            </mesh>
            {/* Motor Metallic Radiating Cooling Fins */}
            {[-0.18, -0.12, -0.06, 0, 0.06, 0.12, 0.18].map((fx) => (
              <mesh key={fx} position={[fx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.185, 0.008, 8, 24]} />
                <meshStandardMaterial color="#4a5568" metalness={0.92} roughness={0.15} />
              </mesh>
            ))}
            {/* Single-Speed Reduction Gearbox Housing */}
            <mesh position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
              <meshStandardMaterial color="#3a4454" metalness={0.9} roughness={0.25} />
            </mesh>
            {/* Power Electronics Inverter Box Unit */}
            <mesh position={[0, 0.18, -0.04]} castShadow receiveShadow>
              <boxGeometry args={[0.38, 0.14, 0.28]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Inverter Top High-Voltage Busbar Connectors */}
            {[-0.12, 0, 0.12].map((bx) => (
              <mesh key={bx} position={[bx, 0.26, -0.04]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.022, 0.022, 0.04, 12]} />
                <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.8} />
              </mesh>
            ))}
          </group>
          {/* Left & Right Front Drive CV Axle Shafts */}
          {([-1, 1] as const).map((s) => (
            <mesh key={s} position={[s * 0.52, 0.42, 1.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.52, 16]} />
              <meshStandardMaterial color="#1a202c" metalness={0.92} roughness={0.18} />
            </mesh>
          ))}
        </Sel>

        {/* High-Detail Front Suspension Shock Towers & Strut Assemblies */}
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.68, 0.62, 1.425]}>
            {/* Strut Tower Cast Lattice Housing */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.13, 0.18, 0.52, 16]} />
              <meshStandardMaterial {...UNIBODY_STEEL} />
            </mesh>

            {/* Machined Weight-Reduction Circular Cutouts on Shock Tower Shell */}
            {[ -0.14, 0, 0.14 ].map((ty) => (
              <mesh key={ty} position={[s * 0.135, ty, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
                <meshStandardMaterial color="#1a202c" metalness={0.9} roughness={0.1} />
              </mesh>
            ))}

            {/* Top Mounting Plate & Perimeter Bolt Heads */}
            <mesh position={[0, 0.26, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
              <meshStandardMaterial color="#3a4454" metalness={0.9} roughness={0.2} />
            </mesh>
            {Array.from({ length: 6 }).map((_, bi) => {
              const ba = (bi * Math.PI) / 3;
              return (
                <mesh key={bi} position={[Math.cos(ba) * 0.11, 0.28, Math.sin(ba) * 0.11]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.02, 8]} />
                  <meshStandardMaterial color="#d6deeb" metalness={0.95} roughness={0.1} />
                </mesh>
              );
            })}

            {/* Inner Hydraulic Damper Piston Shaft (Chrome) */}
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.44, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.08} />
            </mesh>

            {/* Stacked Concentric Coil Springs */}
            {[-0.18, -0.1, -0.02, 0.06, 0.14].map((cy) => (
              <mesh key={cy} position={[0, cy, 0]}>
                <torusGeometry args={[0.118, 0.018, 10, 24]} />
                <meshStandardMaterial color="#1a202c" metalness={0.85} roughness={0.2} />
              </mesh>
            ))}

            {/* Diagonal Lattice Gusset Reinforcement Plates */}
            <mesh position={[s * -0.08, -0.12, 0.12]} rotation={[0.3, s * 0.2, -0.4]}>
              <boxGeometry args={[0.04, 0.28, 0.14]} />
              <meshStandardMaterial {...UNIBODY_STEEL} />
            </mesh>
          </group>
        ))}
        </group>
      </Sel>

      {/* Rear Subframe Cradle & Suspension Towers */}
      <Sel cid="RearSubframe">
        <mesh position={[0, 0.36, -1.45]} castShadow receiveShadow>
          <boxGeometry args={[1.22, 0.14, 0.75]} />
          <meshStandardMaterial {...UNIBODY_STEEL} />
        </mesh>
        {/* Rear Suspension Strut Towers & Coil Springs */}
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.68, 0.62, -1.425]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.11, 0.15, 0.48, 16]} />
              <meshStandardMaterial {...UNIBODY_STEEL} />
            </mesh>
            {[ -0.16, -0.08, 0, 0.08, 0.16 ].map((cy) => (
              <mesh key={cy} position={[0, cy, 0]}>
                <torusGeometry args={[0.115, 0.015, 8, 20]} />
                <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}
      </Sel>

      {/* Multi-Branch Orange High-Voltage & Sensor Cable Routing Harness */}
      <group name="orange-load-paths">
        {/* Longitudinal Sill Main Bus Harnesses */}
        {([-1, 1] as const).map((s) => (
          <group key={s}>
            <mesh position={[s * 0.82, 0.49, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 3.2, 8]} />
              <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.6} />
            </mesh>
            {/* Front Strut Tower Routing Feeds */}
            <mesh position={[s * 0.75, 0.58, 1.425]} rotation={[0.4, 0, s * -0.3]}>
              <cylinderGeometry args={[0.012, 0.012, 0.45, 8]} />
              <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.6} />
            </mesh>
            {/* Rear Strut Tower Routing Feeds */}
            <mesh position={[s * 0.75, 0.58, -1.425]} rotation={[-0.4, 0, s * -0.3]}>
              <cylinderGeometry args={[0.012, 0.012, 0.45, 8]} />
              <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.6} />
            </mesh>
          </group>
        ))}
        {/* Transverse Cross-Member Telemetry Connections */}
        {[-1.2, -0.4, 0.4, 1.2].map((z) => (
          <mesh key={z} position={[0, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 1.6, 8]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.6} />
          </mesh>
        ))}
      </group>

      {/* Structural Telemetry Sensor Nodes (S01 to S08) */}
      {[
        { id: 'S01', name: 'FL_Rail', pos: [-0.68, 0.78, 1.425] },
        { id: 'S02', name: 'FR_Rail', pos: [0.68, 0.78, 1.425] },
        { id: 'S03', name: 'MID_L_Sill', pos: [-0.86, 0.49, 0.4] },
        { id: 'S04', name: 'MID_R_Sill', pos: [0.86, 0.49, 0.4] },
        { id: 'S05', name: 'BATT_MID_L', pos: [-0.86, 0.49, -0.4] },
        { id: 'S06', name: 'BATT_MID_R', pos: [0.86, 0.49, -0.4] },
        { id: 'S07', name: 'RL_Rail', pos: [-0.68, 0.78, -1.425] },
        { id: 'S08', name: 'RR_Rail', pos: [0.68, 0.78, -1.425] },
      ].map((node) => (
        <group key={node.id} position={node.pos as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.048, 16, 16]} />
            <meshStandardMaterial color="#ff7700" emissive="#ff5500" emissiveIntensity={2.0} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08, 0.01, 8, 24]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={0.88} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Complete Standalone Production SUV Body Model */
export function ProductionSuv() {
  const viewMode = useStore((s) => s.viewMode);
  const explode = useStore((s) => s.explode);
  const wireframe = useStore((s) => s.wireframe);
  const wireframeOpacity = useStore((s) => s.wireframeOpacity);

  const isTransparent = viewMode === 'transparent';
  const isChassisOnly = viewMode === 'chassis';
  const isExplodedMode = viewMode === 'exploded' || explode > 0.05;
  const isWireframeActive = isChassisOnly || wireframe;
  const opacityVal = wireframeOpacity;

  const currentPaint = isTransparent ? BODY_PAINT_TRANSPARENT : BODY_PAINT;
  const currentGlass = isTransparent ? { ...GLASS_SMOKED, opacity: 0.18 } : GLASS_SMOKED;
  const expK = isExplodedMode ? (explode > 0 ? explode : 0.45) : 0;

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
      {/* Render structural unibody frame when in transparent, chassis, exploded, or wireframe mode */}
      {(isTransparent || isChassisOnly || isExplodedMode || wireframe) && <UnibodyFrame />}

      {/* Transparent Electric Blue SUV Wireframe Outer Shell Overlay with Dynamic Opacity Control */}
      {isWireframeActive && opacityVal > 0.01 && (
        <group name="chassis-wireframe-overlay">
          {/* Front Bumper & Fascia Wire Net */}
          <mesh geometry={geoBumperFront} position={[0, 0, expK * 0.35]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.9} />
          </mesh>

          {/* Front Hood Wire Net */}
          <mesh geometry={geoHood} position={[0, expK * 0.28, expK * 0.2]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal} />
          </mesh>

          {/* Front Fenders L & R Wire Net */}
          <mesh geometry={geoFenderL} position={[-expK * 0.4, 0, expK * 0.15]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.9} />
          </mesh>
          <mesh geometry={geoFenderR} position={[expK * 0.4, 0, expK * 0.15]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.9} />
          </mesh>

          {/* Windshield Wire Net */}
          <mesh geometry={geoWindshield}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.8} />
          </mesh>

          {/* Front Doors L & R Wire Net */}
          <mesh geometry={geoDoorFL} position={[-expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.88} />
          </mesh>
          <mesh geometry={geoDoorFR} position={[expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.88} />
          </mesh>

          {/* Rear Doors L & R Wire Net */}
          <mesh geometry={geoDoorRL} position={[-expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.88} />
          </mesh>
          <mesh geometry={geoDoorRR} position={[expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.88} />
          </mesh>

          {/* Side Windows L & R Wire Net */}
          <mesh geometry={geoGlassL} position={[-expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.75} />
          </mesh>
          <mesh geometry={geoGlassR} position={[expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.75} />
          </mesh>

          {/* Roof & Pillars Wire Net */}
          <mesh geometry={geoRoof} position={[0, expK * 0.55, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal} />
          </mesh>

          {/* Rear Quarter Panels L & R Wire Net */}
          <mesh geometry={geoQuarterL} position={[-expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.9} />
          </mesh>
          <mesh geometry={geoQuarterR} position={[expK * 0.5, 0, 0]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.9} />
          </mesh>

          {/* Rear Windscreen & Tailgate Wire Net */}
          <mesh geometry={geoGlassRear} position={[0, 0, -expK * 0.45]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.78} />
          </mesh>
          <mesh geometry={geoTailgate} position={[0, 0, -expK * 0.45]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.9} />
          </mesh>

          {/* Rear Bumper Wire Net */}
          <mesh geometry={geoBumperRearUpper} position={[0, 0, -expK * 0.45]}>
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={opacityVal * 0.9} />
          </mesh>
        </group>
      )}

      {/* Complete High-Fidelity SUV Interior Architecture */}
      {!isChassisOnly && (
        <group position={[0, expK * 0.15, 0]}>
          <Cabin />
        </group>
      )}

      {/* Hide outer panels in chassis-only mode */}
      {!isChassisOnly && (
        <group position={[0, expK * 0.42, 0]}>
          {/* ---------------- FRONT FASCIA & HOOD ---------------- */}
          <group position={[0, 0, expK * 0.35]}>
            <Sel cid="FrontBumper">
              <mesh geometry={geoBumperFront} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
              <mesh position={[0, 0.62, 2.12]} castShadow>
                <boxGeometry args={[1.26, 0.22, 0.06]} />
                <meshStandardMaterial {...CLADDING_MATTE} />
              </mesh>
              <mesh position={[0, 0.38, 2.14]} rotation={[0.2, 0, 0]} castShadow>
                <boxGeometry args={[1.04, 0.06, 0.24]} />
                <meshStandardMaterial color="#a0abb8" metalness={0.9} roughness={0.3} />
              </mesh>
            </Sel>
          </group>

          <group position={[0, expK * 0.28, expK * 0.2]}>
            <Sel cid="Hood">
              <mesh geometry={geoHood} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
          </group>

          {/* Front Fenders */}
          <group position={[-expK * 0.4, 0, expK * 0.15]}>
            <Sel cid="FrontFender_L">
              <mesh geometry={geoFenderL} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
          </group>
          <group position={[expK * 0.4, 0, expK * 0.15]}>
            <Sel cid="FrontFender_R">
              <mesh geometry={geoFenderR} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
          </group>

          {/* Windshield */}
          <Sel cid="Windshield">
            <mesh geometry={geoWindshield} castShadow receiveShadow>
              <meshStandardMaterial {...currentGlass} />
            </mesh>
          </Sel>

          {/* ---------------- DOORS & FLANKS ---------------- */}
          <group position={[-expK * 0.5, 0, 0]}>
            <Sel cid="Door_FL">
              <mesh geometry={geoDoorFL} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
            <Sel cid="Door_RL">
              <mesh geometry={geoDoorRL} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
            <Sel cid="SideGlass_L">
              <mesh geometry={geoGlassL} castShadow receiveShadow>
                <meshStandardMaterial {...currentGlass} />
              </mesh>
            </Sel>
            <Sel cid="QuarterPanel_L">
              <mesh geometry={geoQuarterL} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
          </group>

          <group position={[expK * 0.5, 0, 0]}>
            <Sel cid="Door_FR">
              <mesh geometry={geoDoorFR} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
            <Sel cid="Door_RR">
              <mesh geometry={geoDoorRR} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
            <Sel cid="SideGlass_R">
              <mesh geometry={geoGlassR} castShadow receiveShadow>
                <meshStandardMaterial {...currentGlass} />
              </mesh>
            </Sel>
            <Sel cid="QuarterPanel_R">
              <mesh geometry={geoQuarterR} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>
          </group>

          {/* ---------------- ROOF & PILLARS ---------------- */}
          <group position={[0, expK * 0.55, 0]}>
            <Sel cid="RoofPanel">
              <mesh geometry={geoRoof} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
              <mesh position={[0, 1.62, -0.45]} castShadow>
                <boxGeometry args={[1.16, 0.02, 1.65]} />
                <meshStandardMaterial {...currentGlass} />
              </mesh>
              {([-1, 1] as const).map((s) => (
                <group key={s} position={[s * 0.54, 1.65, -0.45]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.04, 0.035, 1.55]} />
                    <meshStandardMaterial {...TRIM_BLACK} />
                  </mesh>
                </group>
              ))}
              <mesh position={[0, 1.65, -1.34]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
                <coneGeometry args={[0.05, 0.14, 3]} />
                <meshStandardMaterial {...TRIM_BLACK} />
              </mesh>
              <mesh position={[0, 1.59, -1.54]} rotation={[-0.22, 0, 0]} castShadow>
                <boxGeometry args={[1.32, 0.045, 0.28]} />
                <meshStandardMaterial {...TRIM_BLACK} />
              </mesh>
            </Sel>
          </group>

          {/* Black A / B / C Pillars */}
          {([-1, 1] as const).map((s) => (
            <group key={s}>
              <mesh position={[s * 0.95, 1.35, -0.07]} rotation={[0, 0, s * -0.08]} castShadow>
                <boxGeometry args={[0.03, 0.44, 0.08]} />
                <meshStandardMaterial {...TRIM_BLACK} />
              </mesh>
              <mesh position={[s * 0.94, 1.35, -0.88]} rotation={[0, 0, s * -0.08]} castShadow>
                <boxGeometry args={[0.03, 0.44, 0.08]} />
                <meshStandardMaterial {...TRIM_BLACK} />
              </mesh>
            </group>
          ))}

          {/* ---------------- TAILGATE & REAR BUMPER ---------------- */}
          <group position={[0, 0, -expK * 0.45]}>
            <Sel cid="RearGlass">
              <mesh geometry={geoGlassRear} castShadow receiveShadow>
                <meshStandardMaterial {...currentGlass} />
              </mesh>
              <mesh position={[0, 1.55, -1.52]} rotation={[-0.35, 0, 0]}>
                <boxGeometry args={[0.44, 0.025, 0.02]} />
                <meshStandardMaterial {...LED_REAR} />
              </mesh>
            </Sel>

            <Sel cid="Tailgate">
              <mesh geometry={geoTailgate} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
            </Sel>

            <Sel cid="RearBumper">
              <mesh geometry={geoBumperRearUpper} castShadow receiveShadow>
                <meshStandardMaterial {...currentPaint} />
              </mesh>
              {([-1, 1] as const).map((s) => (
                <group key={s}>
                  <mesh position={[s * 0.88, 0.72, -2.12]} rotation={[0, s * -0.15, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.24, 0.28, 0.32]} />
                    <meshStandardMaterial {...currentPaint} />
                  </mesh>
                  <mesh position={[s * 0.94, 0.52, -1.88]} castShadow receiveShadow>
                    <boxGeometry args={[0.16, 0.32, 0.65]} />
                    <meshStandardMaterial {...CLADDING_MATTE} />
                  </mesh>
                </group>
              ))}
              <mesh position={[0, 0.52, -2.14]} castShadow receiveShadow>
                <boxGeometry args={[1.82, 0.32, 0.26]} />
                <meshStandardMaterial {...CLADDING_MATTE} />
              </mesh>
              <mesh position={[0, 0.38, -2.15]} rotation={[-0.14, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.12, 0.14, 0.28]} />
                <meshStandardMaterial color="#a0abb8" metalness={0.88} roughness={0.28} />
              </mesh>
            </Sel>
          </group>

          {/* ---------------- EXTERIOR TRIM & LIGHTING ---------------- */}
          {/* Continuous Front LED Light Bar */}
          <Sel cid="Headlamp_L">
            <mesh position={[0, 0.97, 2.16]} castShadow>
              <boxGeometry args={[1.62, 0.035, 0.04]} />
              <meshStandardMaterial {...LED_FRONT} />
            </mesh>
            <mesh position={[-0.72, 0.92, 2.12]} castShadow>
              <boxGeometry args={[0.26, 0.1, 0.06]} />
              <meshStandardMaterial {...LED_FRONT} />
            </mesh>
          </Sel>
          <Sel cid="Headlamp_R">
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
                  <meshStandardMaterial {...currentPaint} />
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
        </group>
      )}

      {/* ---------------- FULL SEALED UNDERBODY TRAY ---------------- */}
      <Sel cid="UnderbodyAero_Mid">
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.74, 0.05, 4.15]} />
          <meshStandardMaterial {...CLADDING_MATTE} />
        </mesh>
      </Sel>

      {/* ---------------- 4 PRODUCTION ALLOY WHEELS ---------------- */}
      <group position={[-expK * 0.3, 0, expK * 0.2]}>
        <ProductionWheel position={[-0.82, 0.38, 1.425]} side={-1} />
      </group>
      <group position={[expK * 0.3, 0, expK * 0.2]}>
        <ProductionWheel position={[0.82, 0.38, 1.425]} side={1} />
      </group>
      <group position={[-expK * 0.3, 0, -expK * 0.2]}>
        <ProductionWheel position={[-0.82, 0.38, -1.425]} side={-1} />
      </group>
      <group position={[expK * 0.3, 0, -expK * 0.2]}>
        <ProductionWheel position={[0.82, 0.38, -1.425]} side={1} />
      </group>
    </group>
  );
}
