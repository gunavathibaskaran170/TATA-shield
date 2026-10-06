/* ============================================================
   SHIELD — Vehicle definition — EV-CH-007
   Single source of truth for chassis geometry, structural
   regions and zones. Shared by the Structural Twin and the
   Hardware Digital Twin so both pages render the SAME model.
   ============================================================ */

export const ASSET = {
  id: 'EV-CH-007',
  name: 'EV Skateboard Chassis — Prototype Model',
  scaleLabel: '1 : 4 Instrumented Build Model',
  mode: 'Manufacturing',
  units: 'm (model space)',
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

/* Chassis model-space dimensions (metres, miniature build 1:4) */
export const CHASSIS = {
  length: 0.55,          // front bumper -> rear bumper (z)
  wheelbase: 0.40,       // axle spacing
  track: 0.30,           // wheel centre spacing (x)
  railX: 0.105,          // longitudinal rail centreline x
  floorY: 0.0,           // floor plate top surface
  frontZ: 0.275,         // front end
  rearZ: -0.275,         // rear end
};

/* Geometry anchors used by the sensor config (kept in sync with chassis.js) */
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