/* ============================================================
   SHIELD — Load Cases & Scenario Definitions
   Used by scenarios, Judge Demo, and decision engine.
   ============================================================ */

export const LOAD_CASES = [
  {
    id: 'NORMAL',
    name: 'Normal Load',
    description: 'Nominal 240 N (≈24.5 kg) symmetric load at battery fixture. Baseline validation.',
    loadVector: { x: 0, y: 0, z: -240 }, // N, applied at LC01
    symmetric: true,
    expectedVerdict: 'PASS',
  },
  {
    id: 'HIGH',
    name: 'High Load',
    description: 'Elevated 355 N symmetric load. Tests design envelope margin.',
    loadVector: { x: 0, y: 0, z: -355 },
    symmetric: true,
    expectedVerdict: 'PASS',
  },
  {
    id: 'UNEVEN',
    name: 'Uneven Load',
    description: 'Asymmetric load (210 N left / 110 N right). Induces torsional response.',
    loadVector: { x: 0, y: 0, z: -320 },
    loadLeft: 210,
    loadRight: 110,
    symmetric: false,
    expectedVerdict: 'WARNING',
  },
  {
    id: 'VIBRATION',
    name: 'Vibration Sweep',
    description: 'Frequency sweep 10–50 Hz at 260 N. Excites structural modes.',
    loadVector: { x: 0, y: 0, z: -260 },
    sweep: { fStart: 10, fEnd: 50, duration: 30 },
    symmetric: true,
    expectedVerdict: 'WARNING',
  },
  {
    id: 'SHOCK',
    name: 'Road Shock',
    description: 'Transient 480 N impulse (pothole simulation). Captures peak response.',
    loadVector: { x: 0, y: 0, z: -480 },
    pulse: { riseMs: 50, holdMs: 100, fallMs: 200 },
    symmetric: true,
    expectedVerdict: 'WARNING',
  },
  {
    id: 'CHANGE',
    name: 'Structural Change',
    description: 'Simulated stiffness loss at B4 (loose mount). Asymmetric 270 N with rear-right degradation.',
    loadVector: { x: 0, y: 0, z: -270 },
    loadLeft: 108,
    loadRight: 162,
    symmetric: false,
    stiffnessLoss: { region: 'B4', factor: 0.6 }, // 40% stiffness reduction
    expectedVerdict: 'INSPECTION_REQUIRED',
  },
  {
    id: 'FAULT',
    name: 'Sensor Fault',
    description: 'SG02 channel fault (OFFLINE). Tests fault exclusion logic — zone NOT failed.',
    loadVector: { x: 0, y: 0, z: -245 },
    symmetric: true,
    sensorFault: 'SG02',
    expectedVerdict: 'REVIEW',
  },
];

export const SCENARIO_ORDER = LOAD_CASES.map(c => c.id);

/* Default timeline (40 s) — phases for replay */
export const TIMELINE_PHASES = [
  { id: 'baseline', label: 'BASELINE', start: 0,   end: 0.14, color: '#4fe0a0' },
  { id: 'load',    label: 'LOAD',     start: 0.14, end: 0.44, color: '#4f8cff' },
  { id: 'response',label: 'RESPONSE', start: 0.44, end: 0.72, color: '#f2b94e' },
  { id: 'eval',    label: 'EVALUATION',start: 0.72, end: 1.0,  color: '#38d9cf' },
];

export const TIMELINE_DURATION = 40; // seconds