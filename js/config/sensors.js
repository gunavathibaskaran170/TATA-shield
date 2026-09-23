/* ============================================================
   SHIELD — Hardware Twin — Instrumentation configuration

   Every sensor is driven from THIS data. Another EV platform
   can load a different layout (positions, orientations, region
   mapping) without touching the Hardware Twin code.

   Coordinate convention:
     +x = right (lateral), +y = up, +z = forward (longitudinal)
   Orientation = unit vector of the measured direction.
   SurfaceNormal = unit vector of the mounting surface.
   ============================================================ */

import { ANCHOR } from './vehicle.js';

const A = ANCHOR;

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
  lastPacket: '-', // updated live
  edgeProcessing: 'RMS · peak · dominant frequency · baseline compare',
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
    gauge: { type: '120 Ω foil resistance strain gauge', resistance: 120, gaugeFactor: 2.1, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_1', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-12', signalQuality: 96,
    health: 'HEALTHY', baseline: 48, expected: 52, current: 54,
    residual: '+2', live: () => ({ current: 53.6 + Math.sin(Date.now() / 2200) * 1.4, delta: '+1.8' }),
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
    gauge: { type: '120 Ω foil resistance strain gauge', resistance: 120, gaugeFactor: 2.1, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_2', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-12', signalQuality: 0,
    health: 'OFFLINE', baseline: 47, expected: 51, current: null,
    residual: '—',
    live: () => ({ current: null, delta: 'NO DATA' }),
    note: 'Sensor excluded from current region assessment until re-validated. Structural interpretation of B2 is suspended — the zone is NOT flagged as failed, only its sensor channel.',
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
    gauge: { type: '120 Ω foil resistance strain gauge', resistance: 120, gaugeFactor: 2.1, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_3', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-11', signalQuality: 95,
    health: 'HEALTHY', baseline: 51, expected: 55, current: 57,
    residual: '+3',
    live: () => ({ current: 56.8 + Math.sin(Date.now() / 2600) * 1.1, delta: '+2.2' }),
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
    gauge: { type: '120 Ω foil resistance strain gauge', resistance: 120, gaugeFactor: 2.1, bridge: 'Wheatstone quarter-bridge' },
    channel: 'strain_4', adc: 'HX711 / ADS1115 (conditioned)',
    calibration: 'Valid', calibrationDate: '2026-09-11', signalQuality: 97,
    health: 'HEALTHY', baseline: 49, expected: 52, current: 78,
    residual: '+26',
    live: () => ({ current: 77.5 + Math.sin(Date.now() / 900) * 2.2, delta: '+25.8' }),
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
    force: () => 147.1 + Math.sin(Date.now() / 3000) * 1.4, // ≈ 15 kg * g
    live: () => ({ force: (147.1 + Math.sin(Date.now() / 3000) * 1.4).toFixed(1), mass: '15.0 kg', dir: '+Z (braking) → -Z (accel)' }),
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
  },
];

export function sensorById(id) {
  return SENSORS.find(s => s.id === id) || null;
}

/* Quick-installed counts for the summary panel.
   Convention: 8 core channels (+ DISP01 optional displacement). */
const CORE = SENSORS.filter(s => s.type !== 'disp');
export const INSTALL_SUMMARY = {
  installed: CORE.length,                                    // 8 core
  strain: CORE.filter(s => s.type === 'strain').length,      // 4
  imu: CORE.filter(s => s.type === 'imu').length,            // 2
  load: CORE.filter(s => s.type === 'load').length,          // 1
  temp: CORE.filter(s => s.type === 'temp').length,          // 1
  disp: SENSORS.filter(s => s.type === 'disp').length,       // 1 (optional)
  healthy: CORE.filter(s => s.health === 'HEALTHY').length,  // 7/8
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