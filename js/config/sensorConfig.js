/* ============================================================
   SHIELD — Sensor Configuration (Single Source of Truth)
   
   Every sensor definition lives here. All pages (Twin, Hardware,
   Sensor Lab, Command Center) import from this module.
   
   Fixes for §3C defects:
   1. Sensor count derived from this array (not hardcoded)
   2. SG02 baseline HEALTHY (fault only in FAULT scenario)
   3. Gauge resistance unified to 350 Ω (ASSUMPTION — REQUIRES VALIDATION)
   4. Strain response coefficients k_i for consistent ε = k·F model
   5. Proper strain gauge schematic (not bolted box)
   6. Scale/label from assetConfig
   7. Material E from assetConfig
   8. Seeded history tagged SEED · DEMO DATA
   ============================================================ */

import { ANCHOR, REGIONS, MATERIAL } from './assetConfig.js';

const A = ANCHOR;

/* ---- Gauge resistance: 350 Ω foil strain gauge (unified).
   ASSUMPTION — REQUIRES VALIDATION: Manufacturing shows 120 Ω, Sensor Lab 350 Ω.
   Defaulting to 350 Ω per Sensor Lab detail (precision structural testing). ---- */
const GAUGE_R = 350; // Ω
const GAUGE_GF = 2.1; // Gauge factor

/* ---- Per-sensor strain response coefficients (µε per N).
   ASSUMPTION — REQUIRES VALIDATION: Single calibrated model ε_i = k_i × F_eff.
   Derived from sensorDetail telemetry: SG01 response=4 (240N→~52µε), SG02=14, SG03≈1.2, SG04≈1.8
   Normalized so expected_i = k_i × F_nominal (240N baseline). ---- */
const STRAIN_K = {
  SG01: 4 / 240,   // 0.0167 µε/N → 240N × 0.0167 = 4 µε above baseline
  SG02: 14 / 240,  // 0.0583 µε/N → asymmetric, higher response
  SG03: 1.2 / 240, // 0.005 µε/N
  SG04: 1.8 / 240, // 0.0075 µε/N
};

/* ---- Baseline strain values (µε) at zero load ---- */
const STRAIN_BASELINE = {
  SG01: 48,
  SG02: 47,
  SG03: 51,
  SG04: 49,
};

/* ---- Expected strain at nominal 240 N load (µε) ---- */
const STRAIN_EXPECTED = {
  SG01: 52,
  SG02: 51,
  SG03: 55,
  SG04: 52,
};

export const SENSORS = [
  /* ---------- STRAIN (4) ---------- */
  {
    id: 'SG01', type: 'strain', region: 'B1', zone: 'LEFT',
    name: 'Front-Left Structural Rail Strain Gauge',
    position: [-A.railX, A.railTopY, 0.16],
    orientation: [0, 0, 1],           // longitudinal
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Placed on the front-left longitudinal rail top flange — the primary load path between front suspension and the central battery floor. Monitors longitudinal rail strain + local battery-support interface load transfer.',
    measurement: 'Local longitudinal strain', unit: 'µε',
    gauge: { type: '350 Ω foil resistance strain gauge', resistance: GAUGE_R, gaugeFactor: GAUGE_GF, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_1', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-12', signalQuality: 96,
    // §3C-2: baseline HEALTHY; FAULT scenario overrides
    health: 'HEALTHY', baseline: STRAIN_BASELINE.SG01, expected: STRAIN_EXPECTED.SG01,
    k: STRAIN_K.SG01, // µε/N response coefficient
    live: () => {
      const base = STRAIN_BASELINE.SG01;
      const expected = STRAIN_EXPECTED.SG01;
      const k = STRAIN_K.SG01;
      const load = 240; // N (nominal)
      const dyn = Math.sin(Date.now() / 2200) * 1.4;
      const current = base + k * load + dyn;
      const residual = current - expected;
      return { current: Number(current.toFixed(1)), delta: (residual >= 0 ? '+' : '') + residual.toFixed(1) };
    },
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Bonded foil gauge on rail top flange; lead wires → HX711 bridge/conditioning module → ESP32',
  },
  {
    id: 'SG02', type: 'strain', region: 'B2', zone: 'RIGHT',
    name: 'Front-Right Structural Rail Strain Gauge',
    position: [A.railX, A.railTopY, 0.16],
    orientation: [0, 0, 1],
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Right-side counterpart of SG01. Enables left/right load-asymmetry comparison across the front battery support rails.',
    measurement: 'Local longitudinal strain', unit: 'µε',
    gauge: { type: '350 Ω foil resistance strain gauge', resistance: GAUGE_R, gaugeFactor: GAUGE_GF, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_2', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-12', signalQuality: 95,
    // §3C-2: baseline HEALTHY (fault only in FAULT scenario)
    health: 'HEALTHY', baseline: STRAIN_BASELINE.SG02, expected: STRAIN_EXPECTED.SG02,
    k: STRAIN_K.SG02,
    live: () => {
      const base = STRAIN_BASELINE.SG02;
      const expected = STRAIN_EXPECTED.SG02;
      const k = STRAIN_K.SG02;
      const load = 240;
      const dyn = Math.sin(Date.now() / 2600) * 1.1;
      const current = base + k * load + dyn;
      const residual = current - expected;
      return { current: Number(current.toFixed(1)), delta: (residual >= 0 ? '+' : '') + residual.toFixed(1) };
    },
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Bonded foil gauge on rail top flange; lead wires → HX711 bridge/conditioning module → ESP32',
  },
  {
    id: 'SG03', type: 'strain', region: 'B3', zone: 'BATTERY_MOUNTS',
    name: 'Rear-Left Battery Mount Strain Gauge',
    position: [-A.railX, 0.033, A.rearMountZ],
    orientation: [0, 0, 1],
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Mounted on the rear-left battery mount / cross-member junction — the region transferring battery mass and dynamic load into the rear structure during braking and pothole events.',
    measurement: 'Local longitudinal strain', unit: 'µε',
    gauge: { type: '350 Ω foil resistance strain gauge', resistance: GAUGE_R, gaugeFactor: GAUGE_GF, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_3', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-11', signalQuality: 95,
    health: 'HEALTHY', baseline: STRAIN_BASELINE.SG03, expected: STRAIN_EXPECTED.SG03,
    k: STRAIN_K.SG03,
    live: () => {
      const base = STRAIN_BASELINE.SG03;
      const expected = STRAIN_EXPECTED.SG03;
      const k = STRAIN_K.SG03;
      const load = 240;
      const dyn = Math.sin(Date.now() / 2600) * 1.1;
      const current = base + k * load + dyn;
      const residual = current - expected;
      return { current: Number(current.toFixed(1)), delta: (residual >= 0 ? '+' : '') + residual.toFixed(1) };
    },
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Bonded foil gauge on cross-member; lead wires → HX711 → ESP32',
  },
  {
    id: 'SG04', type: 'strain', region: 'B4', zone: 'BATTERY_MOUNTS',
    name: 'Rear-Right Battery Mount Strain Gauge',
    position: [A.railX, 0.033, A.rearMountZ],
    orientation: [0, 0, 1],
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Rear-right battery mount / cross-member junction. Selected from FEA sensitivity analysis — this corner shows the highest strain-energy density under combined braking + lateral loading.',
    measurement: 'Local longitudinal strain', unit: 'µε',
    gauge: { type: '350 Ω foil resistance strain gauge', resistance: GAUGE_R, gaugeFactor: GAUGE_GF, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_4', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-11', signalQuality: 97,
    health: 'HEALTHY', baseline: STRAIN_BASELINE.SG04, expected: STRAIN_EXPECTED.SG04,
    k: STRAIN_K.SG04,
    live: () => {
      const base = STRAIN_BASELINE.SG04;
      const expected = STRAIN_EXPECTED.SG04;
      const k = STRAIN_K.SG04;
      const load = 240;
      const dyn = Math.sin(Date.now() / 900) * 2.2;
      const current = base + k * load + dyn;
      const residual = current - expected;
      return { current: Number(current.toFixed(1)), delta: (residual >= 0 ? '+' : '') + residual.toFixed(1) };
    },
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Bonded foil gauge on cross-member; lead wires → HX711 → ESP32',
  },

  /* ---------- IMU (2) ---------- */
  {
    id: 'IMU01', type: 'imu', region: 'F1', zone: 'FRONT',
    name: 'Front / Reference IMU',
    position: [0.0, 0.062, A.frontCrossZ],
    orientation: [0, 0, 1],
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Reference station on the front cross-member. Captures the input vibration / shock spectrum at the load path entry (suspension → body) before it propagates aft.',
    measurement: 'Acceleration · angular rate', unit: 'g · °/s',
    sensor: { type: 'MPU-6050 MEMS IMU', outputs: 'Ax Ay Az · Gx Gy Gz', axes: 6 },
    channel: 'imu_1', adc: 'I2C (400 kHz)',
    calibration: 'Valid', calibrationDate: '2026-09-10', signalQuality: 98,
    health: 'HEALTHY',
    live: () => ({
      rms: (0.18 + Math.random() * 0.06).toFixed(2),      // g
      peak: (0.52 + Math.random() * 0.1).toFixed(2),      // g
      domFreq: (22 + Math.random() * 3).toFixed(1),       // Hz
    }),
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Bolted to front cross-member; I²C → ESP32',
  },
  {
    id: 'IMU02', type: 'imu', region: 'R1', zone: 'REAR',
    name: 'Rear / Response IMU',
    position: [0.0, 0.062, A.rearCrossZ],
    orientation: [0, 0, 1],
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Response station on the rear cross-member — separated from IMU01 along the load path so the transfer function across the battery region can be observed (vibration transmission, frequency shift).',
    measurement: 'Acceleration · angular rate', unit: 'g · °/s',
    sensor: { type: 'MPU-6050 MEMS IMU', outputs: 'Ax Ay Az · Gx Gy Gz', axes: 6 },
    channel: 'imu_2', adc: 'I2C (400 kHz)',
    calibration: 'Valid', calibrationDate: '2026-09-10', signalQuality: 97,
    health: 'HEALTHY',
    live: () => ({
      rms: (0.11 + Math.random() * 0.05).toFixed(2),
      peak: (0.31 + Math.random() * 0.08).toFixed(2),
      domFreq: (17.5 + Math.random() * 2.5).toFixed(1),
    }),
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Bolted to rear cross-member; I²C → ESP32',
  },

  /* ---------- LOAD (1) ---------- */
  {
    id: 'LC01', type: 'load', region: 'C1', zone: 'CENTRE',
    name: 'Applied Battery Load Sensor',
    position: [0.0, 0.05, 0.125],
    orientation: [0, 0, 1],
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Located in the battery load fixture (between the front load frame and the battery pack front edge) — this is where the prototype applies its known structural/battery load. It measures the commanded load, not a random rail value.',
    measurement: 'Applied axial force', unit: 'N',
    sensor: { type: 'Strain-gauge bridge load cell', capacity: '200 N', class: '±0.05 %FS' },
    signalChain: 'Load Cell → HX711 (24-bit) → ESP32 → Digital Twin',
    channel: 'load_1', adc: 'HX711',
    calibration: 'Valid', calibrationDate: '2026-09-08', signalQuality: 99,
    health: 'HEALTHY', massEq: '15.0 kg',
    live: () => {
      const force = 147.1 + Math.sin(Date.now() / 3000) * 1.4; // ≈ 15 kg * g
      return { force: force.toFixed(1), mass: '15.0 kg', dir: '+Z (braking) → -Z (accel)' };
    },
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Load cell in battery load fixture; HX711 → ESP32',
  },

  /* ---------- TEMPERATURE (1) ---------- */
  {
    id: 'TEMP01', type: 'temp', region: 'B3', zone: 'BATTERY_MOUNTS',
    name: 'Environmental Temperature Probe',
    position: [-A.railX - 0.012, 0.038, -0.06],
    orientation: [0, 1, 0],
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Mounted beside the rear monitored structure / strain environment so strain readings can be temperature-compensated. TEMP01 is NOT a damage sensor — it provides context and normalization.',
    measurement: 'Ambient surface temperature', unit: '°C',
    sensor: { type: 'DS18B20', resolution: '12-bit', accuracy: '±0.5 °C' },
    channel: 'temp_1', adc: '1-Wire (GPIO)',
    calibration: 'Valid', calibrationDate: '2026-09-12', signalQuality: 98,
    health: 'HEALTHY',
    live: () => ({ temp: (24.6 + Math.sin(Date.now() / 5000) * 0.4).toFixed(1), drift: '+0.1 °C / h' }),
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'DS18B20 1-Wire probe on rear structure; 1-Wire → ESP32 GPIO',
  },

  /* ---------- OPTIONAL DISPLACEMENT (1) ---------- */
  {
    id: 'DISP01', type: 'disp', region: 'R1', zone: 'REAR',
    name: 'Displacement Reference Sensor',
    position: [A.railX, 0.15, -0.02],
    orientation: [0, -1, 0],           // pointing down at the member
    surfaceNormal: [0, 1, 0],
    mechanicalReason:
      'Bracket-mounted above the rear-right structural member. Directly observes the member vertical deflection under load — used to physically validate the Digital Twin deformation model.',
    measurement: 'Gap distance to member surface', unit: 'mm',
    sensor: { type: 'Laser displacement sensor (VL53L1X class)', range: '40–400 mm' },
    channel: 'disp_1', adc: 'I2C',
    calibration: 'Valid', calibrationDate: '2026-09-12', signalQuality: 97,
    health: 'HEALTHY', reference: 97.0,
    live: () => {
      const d = 97.0 - 0.35 - Math.sin(Date.now() / 1600) * 0.12;
      return { current: d.toFixed(2), reference: '97.00', diff: (d - 97.0).toFixed(2) };
    },
    provenance: 'PHYSICAL_PROTOTYPE',
    mountingNote: 'Laser ToF sensor on bracket above rear member; I²C → ESP32',
  },
];

export function sensorById(id) {
  return SENSORS.find(s => s.id === id) || null;
}

/* ---- Derived counts (single source of truth) ---- */
const CORE = SENSORS.filter(s => s.type !== 'disp');
export const INSTALL_SUMMARY = {
  installed: CORE.length,                                    // 8 core
  strain: CORE.filter(s => s.type === 'strain').length,      // 4
  imu: CORE.filter(s => s.type === 'imu').length,            // 2
  load: CORE.filter(s => s.type === 'load').length,          // 1
  temp: CORE.filter(s => s.type === 'temp').length,          // 1
  disp: SENSORS.filter(s => s.type === 'disp').length,       // 1 (optional)
  healthy: CORE.filter(s => s.health === 'HEALTHY').length,  // 8/8 baseline
};

export const HEALTH_COLOR = {
  HEALTHY: '#4fe0a0',
  NOISY: '#f2b94e',
  UNCALIBRATED: '#f2b94e',
  DRIFT_SUSPECTED: '#ff9a3d',
  OFFLINE: '#6b7686',
};

export const HEALTH_CLASS = {
  HEALTHY: 'ok',
  NOISY: 'warn',
  UNCALIBRATED: 'warn',
  DRIFT_SUSPECTED: 'warn',
  OFFLINE: 'off',
};

export const LAYERS = [
  { id: 'ALL', label: 'ALL HARDWARE' },
  { id: 'strain', label: 'STRAIN' },
  { id: 'imu', label: 'IMU' },
  { id: 'load', label: 'LOAD' },
  { id: 'temp', label: 'TEMPERATURE' },
  { id: 'disp', label: 'DISPLACEMENT' },
  { id: 'edge', label: 'EDGE NODE' },
];

/* Edge Node definition */
export const EDGE_NODE = {
  id: 'EDGE1',
  label: 'SHIELD Edge Node',
  type: 'edge',
  position: A.edgeNodePos,
  controller: 'ESP32',
  fw: 'shield-edge v0.9.2',
  connectedSensors: ['SG01','SG02','SG03','SG04','IMU01','IMU02','LC01','TEMP01','DISP01'],
  dataLink: 'Wi-Fi / MQTT / WebSocket',
  sampleRate: 'config pending (pre-production)',
  acquisition: 'RUNNING',
  lastPacket: '-',
  edgeProcessing: 'RMS · peak · dominant frequency · baseline compare',
};

/* ---- Scenario-driven strain overrides (used by Twin page) ----
   These are scenario-specific overrides on top of the base live() model.
   The live() functions above provide the BASE simulated stream.
   Twin page applies scenario multipliers on top. ---- */
export const SCENARIO_STRAIN_OVERRIDES = {
  NORMAL:   { load: 240, asym: 0,  strain: { F1: 44, B1: 52, B2: 50, C1: 40, B3: 57, B4: 60, R1: 46 } },
  HIGH:     { load: 355, asym: 0,  strain: { F1: 62, B1: 74, B2: 71, C1: 58, B3: 81, B4: 84, R1: 65 } },
  UNEVEN:   { load: 320, asym: -1, strain: { F1: 58, B1: 92, B2: 36, C1: 46, B3: 96, B4: 41, R1: 52 } },
  VIBRATION:{ load: 260, asym: 0,  strain: { F1: 49, B1: 58, B2: 56, C1: 44, B3: 63, B4: 66, R1: 51 } },
  SHOCK:    { load: 480, asym: 0,  strain: { F1: 74, B1: 88, B2: 86, C1: 66, B3: 96, B4: 102, R1: 78 } },
  CHANGE:   { load: 270, asym: 1,  strain: { F1: 50, B1: 56, B2: 62, C1: 45, B3: 61, B4: 78, R1: 54 } },
  FAULT:    { load: 245, asym: 0,  strain: { F1: 44, B1: 52, B2: null, C1: 40, B3: 57, B4: 60, R1: 46 } },
};