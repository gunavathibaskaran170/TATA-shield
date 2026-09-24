/* ============================================================
   SHIELD — SENSOR LAB — engineering data model
   (vanilla-analog of "sensorConfig.ts" in the vanilla zero-build
   stack).  Every number that shapes the SG01 / IMU01 detail
   models + specs + telemetry lives here — never hardcoded in
   the mesh code.

   Units:
     dims / positions  -> millimetres (builders convert × 0.001
                          so sensors mount 1:1 on EV-CH-007)
     explode offsets   -> millimetres
   ============================================================ */

export const SENSOR_LAB = {
  SG01: {
    id: 'SG01',
    type: 'strain',
    name: 'Strain Gauge Sensor',
    subtitle: 'Foil Strain Gauge · Front-Left Suspension Mounting Region',
    accent: '#4fe0a0',               // SHIELD green — strain accent
    region: 'B1',
    mountPos: [-0.105, 0.045, 0.16], // metres — on the front-left rail top flange
    mountHint: 'Front-left longitudinal rail top flange — the primary load path between the front suspension and the central battery floor.',
    modelFile: 'models/sensors/sg01.glb',
    dims: { l: 50, w: 35, h: 20 },

    gauge: {
      type: '350 Ω foil strain gauge',
      resistance: 350, gaugeFactor: 2.0,
      range: 2000, // ± µε
    },

    /* ---- exploded / internal / anatomy part tree ---- */
    parts: [
      { key: 'basePlate', label: 'Mounting Base Plate',
        fn: 'CNC aluminium base, 2 × Ø6 clearance bores. Bolts the sensor onto the rail flange surface.',
        expl: 0, internal: false },
      { key: 'bolts', label: 'Mounting Bolts',
        fn: '2 × stainless M6 socket-head cap screws through the base plate.',
        expl: 12, internal: false },
      { key: 'housing', label: 'Main Aluminium Housing',
        fn: 'CNC-machined aluminium body (IP67). Protects the foil sensing element and the signal-conditioning electronics.',
        expl: 48, internal: true },
      { key: 'pcb', label: 'Signal Conditioning PCB',
        fn: 'Wheatstone quarter-bridge conditioning + local amplification board.',
        expl: 86, internal: true },
      { key: 'gauge', label: 'Foil Strain Gauge',
        fn: '350 Ω metallic foil grid on polyimide substrate. Measuring axis = vehicle longitudinal.',
        expl: 122, internal: true },
      { key: 'cover', label: 'Protective Top Cover',
        fn: 'Sealed aluminium cover; the sensing area carries a clear protective coating.',
        expl: 158, internal: true },
      { key: 'cable', label: 'Cable Interface',
        fn: 'Shielded black cable through an IP67 gland to the M12 connector.',
        expl: 170, internal: false },
      { key: 'connector', label: 'Cable Connector',
        fn: 'M12 automotive connector · 4-pin (bridge excitation + signal).',
        expl: 184, internal: false },
    ],

    /* anatomy label defs -> { partKey, anchor(mm, local to part), text, sub } */
    labels: [
      { key: 'housing',    anchor: [0, 14, -17],  text: 'Sensor Housing',    sub: 'Aluminium · IP67' },
      { key: 'bolts',      anchor: [26, 8, 0],    text: 'Mounting Bolts',    sub: '2 × M6 · SS' },
      { key: 'connector',  anchor: [0, 9, 30],    text: 'Cable Connector',   sub: 'M12 · 4-pin' },
      { key: 'pcb',        anchor: [0, 6, -8],    text: 'Signal PCB',        sub: 'Wheatstone conditioning' },
      { key: 'gauge',      anchor: [0, 12, 0],    text: 'Strain Gauge',      sub: '350 Ω foil grid' },
      { key: 'basePlate',  anchor: [-27, 3, 0],   text: 'Base Plate',        sub: 'CNC aluminium' },
      { key: 'cable',      anchor: [0, 11, 22],   text: 'Cable Interface',   sub: 'Shielded · IP67 gland' },
    ],

    internalLabels: [
      { key: 'gauge',   text: 'Strain Gauge Foil',        sub: '350 Ω serpentine grid' },
      { key: 'pcb',     text: 'Signal Conditioning PCB',  sub: 'bridge + amplifier' },
      { key: 'cable',   text: 'Cable Termination',        sub: 'soldered · shielded' },
      { key: 'cover',   text: 'Protective Layer',         sub: 'clear coating' },
      { key: 'basePlate', text: 'Mounting Plate',         sub: 'M6 bores' },
    ],

    specs: [
      ['Sensor type', 'Foil strain gauge · 350 Ω'],
      ['Range', '±2000 µε (microstrain)'],
      ['Accuracy', '±1 % of reading (typ.)'],
      ['Bridge', 'Wheatstone quarter-bridge'],
      ['Material', 'Aluminium housing · IP67'],
      ['Mounting', '2 × M6 bolts · Ø6 mm bores'],
      ['Dimensions', '50 × 35 × 20 mm'],
      ['Cable', 'M12 connector · 4-pin'],
      ['Operating temp', '−40 … +125 °C'],
    ],

    telemetry: { unit: 'µε', expected: 50, baseline: 48 },
  },

  IMU01: {
    id: 'IMU01',
    type: 'imu',
    name: 'Inertial Measurement Unit',
    subtitle: '6-DOF MEMS IMU · Front Structural Region',
    accent: '#4f8cff',               // SHIELD engineering blue — IMU accent
    region: 'F1',
    mountPos: [0, 0.052, 0.18],      // metres — front cross member
    mountHint: 'Front cross-member / front structural zone — captures the input vibration spectrum where suspension loads enter the body.',
    modelFile: 'models/sensors/imu01.glb',
    dims: { l: 60, w: 45, h: 25 },

    sensor: { type: 'MPU-6050 class · 6-DOF MEMS', accelRange: 2, gyroRange: 2000 },

    parts: [
      { key: 'baseHousing', label: 'Base Housing',
        fn: 'CNC aluminium base, 4 × Ø6 mounting bores. Mounts via 4 × M6 bolts.',
        expl: 0, internal: true },
      { key: 'bolts', label: 'Mounting Screws',
        fn: '4 × stainless M6 socket-head cap screws at the enclosure corners.',
        expl: 14, internal: false },
      { key: 'damping', label: 'Vibration-Isolation Layer',
        fn: 'Silicone damping pad decoupling the MEMS cluster from chassis vibration.',
        expl: 34, internal: true },
      { key: 'pcb', label: 'IMU PCB · MEMS',
        fn: '3-axis accelerometer + 3-axis gyroscope (MEMS) with signal conditioning & communication ICs on matte-green board.',
        expl: 64, internal: true },
      { key: 'gasket', label: 'Sealing Gasket',
        fn: 'Perimeter IP67 gasket between base housing and top cover.',
        expl: 92, internal: true },
      { key: 'cover', label: 'Top Cover',
        fn: 'Blue anodized aluminium alloy cover with engraved IMU01 · SHIELD marking.',
        expl: 124, internal: true },
      { key: 'cable', label: 'Cable Interface',
        fn: 'Shielded black cable through an IP67 gland to the M12 connector.',
        expl: 136, internal: false },
      { key: 'connector', label: 'Cable Connector',
        fn: 'M12 automotive connector · 6-pin (I²C + power + sync).',
        expl: 150, internal: false },
      { key: 'axes', label: 'Coordinate Axes',
        fn: 'Body-fixed frame — X red · Y green · Z blue, originates at the IMU centre.',
        expl: 124, internal: false },
    ],

    labels: [
      { key: 'cover',      anchor: [0, 17, -15],  text: 'IMU Housing',      sub: 'Blue anodized Al' },
      { key: 'bolts',      anchor: [30, 14, 0],   text: 'Mounting Screws',  sub: '4 × M6 · SS' },
      { key: 'connector',  anchor: [0, 16, 34],   text: 'Cable Connector',  sub: 'M12 · 6-pin' },
      { key: 'pcb',        anchor: [0, 13, -10],  text: 'MEMS Sensor',      sub: 'accel + gyro' },
      { key: 'pcb',        anchor: [-16, 14, 8],  text: 'PCB',              sub: 'signal conditioning' },
      { key: 'damping',    anchor: [0, 10, 0],    text: 'Damping Layer',    sub: 'vibration isolation' },
      { key: 'baseHousing', anchor: [-31, 5, 0],  text: 'Base Housing',     sub: 'aluminium' },
      { key: 'axes',       anchor: [0, 30, 0],    text: 'XYZ Axes',         sub: 'X·Y·Z body frame' },
    ],

    internalLabels: [
      { key: 'pcb',     text: 'MEMS Sensor',      sub: 'accel + gyro die' },
      { key: 'pcb',     text: 'Conditioning ICs', sub: 'signal conditioning' },
      { key: 'pcb',     text: 'PCB Substrate',    sub: 'matte green FR4' },
      { key: 'damping', text: 'Vibration Damping', sub: 'silicone layer' },
      { key: 'gasket',  text: 'Sealing Gasket',   sub: 'IP67 perimeter' },
    ],

    specs: [
      ['Sensor type', '6-DOF IMU (MEMS accel + gyro)'],
      ['Acceleration range', '±2 g'],
      ['Gyroscope range', '±2000 °/s'],
      ['Accuracy', '±0.01 g (typ.)'],
      ['Outputs', 'Ax Ay Az · Gx Gy Gz'],
      ['Material', 'Aluminium housing · IP67'],
      ['Mounting', '4 × M6 bolts · Ø6 mm bores'],
      ['Dimensions', '60 × 45 × 25 mm'],
      ['Cable', 'M12 connector · 6-pin'],
      ['Operating temp', '−40 … +85 °C'],
    ],

    telemetry: { accelUnit: 'g', gyroUnit: '°/s' },
  },
};

/* Switcher order + which ids have a 3D model defined */
export const LAB_SWITCHER = ['SG01', 'SG02', 'SG03', 'SG04', 'IMU01', 'IMU02', 'LC01', 'DISP01'];
export const LAB_IMPLEMENTED = ['SG01', 'IMU01'];

export function detailById(id) {
  return SENSOR_LAB[id] || null;
}

/* Canned "model not yet defined" info — pulled from sensors.js live data */
export const LAB_PENDING_NOTE =
  'PROTOTYPE MODEL NOT YET DEFINED — drop a CAD export at /models/sensors/<ID>.glb and this lab will load it automatically (procedural fallback removed).';