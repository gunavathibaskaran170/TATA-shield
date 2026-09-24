/* ============================================================
   SHIELD — Asset & Material Configuration
   Single source of truth for EV-CH-007 physical properties.
   ============================================================ */

export const ASSET = {
  id: 'EV-CH-007',
  name: 'EV Skateboard Chassis — Prototype Model',
  // ASSUMPTION — REQUIRES VALIDATION: "1:4" claim implausible for 400×200 mm frame.
  // Real compact EV wheelbase ~2.5 m → 625 mm at 1:4. Current model has 400 mm wheelbase.
  scaleLabel: 'Scaled test frame · 400 × 200 mm',
  mode: 'Manufacturing',
  units: 'm (model space)',
  provenance: 'PHYSICAL_PROTOTYPE',
};

/* Material properties for stress/strain conversion.
   ASSUMPTION — REQUIRES VALIDATION: 60 µε ↔ 4.2 MPa implies E ≈ 70 GPa (aluminium). */
export const MATERIAL = {
  name: 'Aluminium Alloy 6061-T6 (assumed)',
  E: 70e9,        // Pa — Young's modulus
  nu: 0.33,       // Poisson's ratio
  density: 2700,  // kg/m³
  yieldStrength: 276e6, // Pa
};

export const CHASSIS = {
  length: 0.55,          // front bumper → rear bumper (z)
  wheelbase: 0.40,       // axle spacing
  track: 0.30,           // wheel centre spacing (x)
  railX: 0.105,          // longitudinal rail centreline x
  floorY: 0.0,           // floor plate top surface
  frontZ: 0.275,         // front end
  rearZ: -0.275,         // rear end
};

/* Structural regions — ID shared by every layer (geometry, sensors,
   digital-twin region, decision engine). */
export const REGIONS = [
  { id: 'F1', name: 'Front Structural Zone',            zone: 'FRONT',  color: 0x4f7df2 },
  { id: 'B1', name: 'Front-Left Structural Rail',       zone: 'LEFT',
    detail: 'Battery Support Zone',                       color: 0x38d9cf },
  { id: 'B2', name: 'Front-Right Structural Rail',      zone: 'RIGHT',
    detail: 'Battery Support Zone',                       color: 0x38d9cf },
  { id: 'C1', name: 'Central Floor / Battery Region',   zone: 'CENTRE', color: 0x5f7ad8 },
  { id: 'B3', name: 'Rear-Left Battery Mount',          zone: 'BATTERY_MOUNTS',
    detail: 'Cross-Member Region',                        color: 0x38d9cf },
  { id: 'B4', name: 'Rear-Right Battery Mount',         zone: 'BATTERY_MOUNTS',
    detail: 'Cross-Member Region',                        color: 0x38d9cf },
  { id: 'R1', name: 'Rear Structural Zone',             zone: 'REAR',   color: 0x4f7df2 },
];

export const ZONES = ['FRONT', 'CENTRE', 'REAR', 'BATTERY_MOUNTS', 'LEFT', 'RIGHT'];

export function regionById(id) {
  return REGIONS.find(r => r.id === id) || null;
}

/* Geometry anchors used by sensor config and chassis builder (kept in sync) */
export const ANCHOR = {
  railX: 0.105,          // longitudinal rail centreline x (same as CHASSIS.railX)
  railTopY: 0.045,
  frontCrossY: 0.052,
  rearCrossY: 0.052,
  batteryTopY: 0.030,
  batteryFrontZ: 0.145,
  batteryRearZ: -0.185,
  batteryX: 0.082,
  rearMountZ: -0.175,
  frontCrossZ: 0.18,
  rearCrossZ: -0.18,
  edgeNodePos: [0.24, 0.045, -0.16],   // external controller enclosure, rear-right
};