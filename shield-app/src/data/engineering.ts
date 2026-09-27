/* ============================================================
   SHIELD — Master Automotive Engineering Dataset
   Encapsulates Digital Engineering revisions, CAE load cases,
   laser metrology datum grids, battery interface mechanics,
   controlled test rig profiles, and proving ground sectors.
   ============================================================ */

import type {
  DesignRevision,
  CaeLoadCase,
  TestRigType,
  RoadSectorId,
  MetrologyDatumPoint,
} from '../schema/types';

/* ------------------------------------------------------------
   01 DIGITAL ENGINEERING — REVISIONS
   ------------------------------------------------------------ */
export interface RevisionDef {
  id: DesignRevision;
  label: string;
  code: string;
  biwMassKg: number;
  totalVehicleMassKg: number;
  torsionalRigidityKnmPerDeg: number;
  bendingStiffnessKnPerMm: number;
  peakRailDisplacementMm: number;
  peakVonMisesMpa: number;
  boronSteelFractionPct: number;
  aluminumCastingsFractionPct: number;
  firstTorsionFreqHz: number;
  firstBendingFreqHz: number;
  changes: string[];
  releaseStatus: 'SUPERSEDED' | 'ARCHIVED' | 'APPROVED_FOR_BUILD';
}

export const DESIGN_REVISIONS: Record<DesignRevision, RevisionDef> = {
  'REV-A': {
    id: 'REV-A',
    label: 'Revision A (Concept Baseline)',
    code: 'REV-A-2025.Q3',
    biwMassKg: 354.2,
    totalVehicleMassKg: 1720,
    torsionalRigidityKnmPerDeg: 18.4,
    bendingStiffnessKnPerMm: 14.8,
    peakRailDisplacementMm: 3.82,
    peakVonMisesMpa: 485,
    boronSteelFractionPct: 18,
    aluminumCastingsFractionPct: 6,
    firstTorsionFreqHz: 26.2,
    firstBendingFreqHz: 33.5,
    changes: [
      'Initial baseline CAD geometry',
      'Dual continuous stamped steel longitudinal rails',
      'Standard 6-point bolted battery tray interface',
    ],
    releaseStatus: 'SUPERSEDED',
  },
  'REV-B': {
    id: 'REV-B',
    label: 'Revision B (Boron Reinforcement & Lightweighting)',
    code: 'REV-B-2026.Q1',
    biwMassKg: 338.6,
    totalVehicleMassKg: 1695,
    torsionalRigidityKnmPerDeg: 21.2,
    bendingStiffnessKnPerMm: 16.5,
    peakRailDisplacementMm: 3.15,
    peakVonMisesMpa: 420,
    boronSteelFractionPct: 32,
    aluminumCastingsFractionPct: 14,
    firstTorsionFreqHz: 28.4,
    firstBendingFreqHz: 36.2,
    changes: [
      'Hot-stamped boron steel (1500 MPa) B-pillar reinforcements',
      'Die-cast aluminum front subframe shock tower nodes',
      'Structural battery tub integrated as shear web (-15.6 kg)',
      'Optimized bead patterns on floor pan to suppress drumming',
    ],
    releaseStatus: 'APPROVED_FOR_BUILD',
  },
  'REV-C': {
    id: 'REV-C',
    label: 'Revision C (Next-Gen Integrated Megacasting)',
    code: 'REV-C-2027.EXP',
    biwMassKg: 321.0,
    totalVehicleMassKg: 1660,
    torsionalRigidityKnmPerDeg: 23.5,
    bendingStiffnessKnPerMm: 17.8,
    peakRailDisplacementMm: 2.74,
    peakVonMisesMpa: 395,
    boronSteelFractionPct: 28,
    aluminumCastingsFractionPct: 38,
    firstTorsionFreqHz: 30.8,
    firstBendingFreqHz: 38.9,
    changes: [
      'Single-piece high-pressure die-cast rear underbody assembly',
      'Direct cell-to-body (CTB) structural adhesive perimeter',
      'Composite crash cans with tailored fiber steering',
    ],
    releaseStatus: 'APPROVED_FOR_BUILD',
  },
};

/* ------------------------------------------------------------
   01 DIGITAL ENGINEERING — CAE LOAD CASES
   ------------------------------------------------------------ */
export interface CaeLoadCaseDef {
  id: CaeLoadCase;
  name: string;
  category: 'GLOBAL' | 'CHASSIS' | 'DYNAMIC' | 'IMPACT' | 'NVH';
  loadInput: string;
  criticalRegion: string;
  peakStressMpa: number;
  yieldLimitMpa: number;
  safetyFactor: number;
  maxDeflectionMm: number;
  loadPathDescription: string;
  provenance: 'REFERENCE';
}

export const CAE_LOAD_CASES: Record<CaeLoadCase, CaeLoadCaseDef> = {
  bending: {
    id: 'bending',
    name: 'Global Static Bending (1.5g Vertical Dynamic Payload)',
    category: 'GLOBAL',
    loadInput: '24.8 kN distributed vertical over seat & battery mounts',
    criticalRegion: 'Center Floor Pan & Mid-Rocker Rails',
    peakStressMpa: 268,
    yieldLimitMpa: 420,
    safetyFactor: 1.57,
    maxDeflectionMm: 2.14,
    loadPathDescription: 'Suspension Struts → Towers → Longitudinal Rails → Rocker Outer → Floor Crossmembers',
    provenance: 'REFERENCE',
  },
  torsion: {
    id: 'torsion',
    name: 'Global Pure Torsion (3000 Nm Symmetric Wheel Couple)',
    category: 'GLOBAL',
    loadInput: '±3000 Nm applied opposingly across front axle spindles',
    criticalRegion: 'A-Pillar Lower Joint & Front Subframe Rails',
    peakStressMpa: 342,
    yieldLimitMpa: 480,
    safetyFactor: 1.40,
    maxDeflectionMm: 3.12,
    loadPathDescription: 'Front Axle Spindles → Subframe Bushings → Front Rails → Dash Crossmember → Ring Frame',
    provenance: 'REFERENCE',
  },
  suspension_mount: {
    id: 'suspension_mount',
    name: 'Suspension Tower Peak Bump Load (3.0g Jounce Input)',
    category: 'CHASSIS',
    loadInput: '18.2 kN vertical jounce force per front corner',
    criticalRegion: 'Shock Tower Die-Cast Node (LH/RH)',
    peakStressMpa: 312,
    yieldLimitMpa: 520,
    safetyFactor: 1.67,
    maxDeflectionMm: 1.45,
    loadPathDescription: 'Damper Top Mount → Cast Tower Node → Upper Rail → Shotgun Reinforcement → A-Pillar',
    provenance: 'REFERENCE',
  },
  battery_mount: {
    id: 'battery_mount',
    name: 'Battery Pack 6-Point Shear & Fastener Pull-Out',
    category: 'CHASSIS',
    loadInput: '12.5 kN longitudinal + 8.2 kN lateral inertia',
    criticalRegion: 'Mount_BFL & Mount_BRR Fastener Collars',
    peakStressMpa: 285,
    yieldLimitMpa: 450,
    safetyFactor: 1.58,
    maxDeflectionMm: 0.88,
    loadPathDescription: 'Battery Under-Tray Extrusions → 6 Isolator Bushings → Rocker Inner Reinforcement',
    provenance: 'REFERENCE',
  },
  wheel_input: {
    id: 'wheel_input',
    name: 'Single-Wheel 4.0g Asymmetric Drop Impact',
    category: 'DYNAMIC',
    loadInput: '22.0 kN vertical impulse (15 ms rise time)',
    criticalRegion: 'Front LH Longitudinal & Lower Control Arm Mount',
    peakStressMpa: 388,
    yieldLimitMpa: 550,
    safetyFactor: 1.42,
    maxDeflectionMm: 3.85,
    loadPathDescription: 'Tire Contact Patch → Knuckle → Lower Arm → Front Subframe → Rail Crush Zone',
    provenance: 'REFERENCE',
  },
  braking_transfer: {
    id: 'braking_transfer',
    name: 'Maximum Emergency Deceleration Load Transfer (1.1g)',
    category: 'DYNAMIC',
    loadInput: '16.5 kN forward shear + 42% pitch load transfer to front',
    criticalRegion: 'Front Subframe Rear Torque Box & Dash Bulkhead',
    peakStressMpa: 295,
    yieldLimitMpa: 480,
    safetyFactor: 1.63,
    maxDeflectionMm: 1.76,
    loadPathDescription: 'Caliper Reactions → Subframe Rails → Torque Box → Longitudinal Floor Members',
    provenance: 'REFERENCE',
  },
  cornering_lateral: {
    id: 'cornering_lateral',
    name: 'High-G Steady-State Cornering (0.85g Lateral)',
    category: 'DYNAMIC',
    loadInput: '13.8 kN lateral tire lateral force couple',
    criticalRegion: 'Rear Subframe Mounts & C-Pillar Cross-Brace',
    peakStressMpa: 318,
    yieldLimitMpa: 480,
    safetyFactor: 1.51,
    maxDeflectionMm: 2.05,
    loadPathDescription: 'Lateral Tire Forces → Rear Subframe Bushings → Rear Crossmember → C-Pillars',
    provenance: 'REFERENCE',
  },
  pothole_impact: {
    id: 'pothole_impact',
    name: 'Severe Sharp Edge Pothole Strike (40 km/h Drop)',
    category: 'IMPACT',
    loadInput: '28.5 kN combined 60° vector impact',
    criticalRegion: 'Front-Right Rail Crush Zone & Shock Tower',
    peakStressMpa: 412,
    yieldLimitMpa: 580,
    safetyFactor: 1.41,
    maxDeflectionMm: 4.20,
    loadPathDescription: 'Rim Contact → Knuckle → Strut → Front Rail Forward Crash Tube → Bulkhead',
    provenance: 'REFERENCE',
  },
  kerb_strike: {
    id: 'kerb_strike',
    name: 'Side Lateral Kerb Strike at 15 km/h',
    category: 'IMPACT',
    loadInput: '32.0 kN lateral concentrated wheel impact',
    criticalRegion: 'Lower Control Arm Hardpoint & Subframe Side Rib',
    peakStressMpa: 440,
    yieldLimitMpa: 600,
    safetyFactor: 1.36,
    maxDeflectionMm: 4.80,
    loadPathDescription: 'Wheel Rim → Control Arm Bushing → Subframe Lateral Member → Battery Sill Shield',
    provenance: 'REFERENCE',
  },
  underbody_intrusion: {
    id: 'underbody_intrusion',
    name: 'Underbody Debris / Speed Bump Intrusion',
    category: 'IMPACT',
    loadInput: '45.0 kN concentrated 100 mm cone indenter',
    criticalRegion: 'Battery Ballistic Skid Plate & Center Floor',
    peakStressMpa: 365,
    yieldLimitMpa: 480,
    safetyFactor: 1.32,
    maxDeflectionMm: 8.20,
    loadPathDescription: 'High-Strength 6000-series Skid Plate → Energy Absorbing Honeycomb → Cross Extrusions',
    provenance: 'REFERENCE',
  },
  battery_enclosure: {
    id: 'battery_enclosure',
    name: 'UN ECE R100 Side Crush Enclosure Test (100 kN Quasi-Static)',
    category: 'IMPACT',
    loadInput: '100 kN quasi-static cylinder press on side rocker',
    criticalRegion: 'Extruded Rocker Sill Multi-Chamber Beam',
    peakStressMpa: 460,
    yieldLimitMpa: 620,
    safetyFactor: 1.35,
    maxDeflectionMm: 12.5,
    loadPathDescription: 'Multi-Chamber Aluminum Rocker Beam → Internal Battery Perimeter Rails → Transverse Ribs',
    provenance: 'REFERENCE',
  },
  modal_excitation: {
    id: 'modal_excitation',
    name: 'Body-In-White Free-Free Modal Vibration Analysis',
    category: 'NVH',
    loadInput: 'Harmonic 0–100 Hz sweep at suspension attachment points',
    criticalRegion: 'Roof Header & Rear Ring Torsion Nodes',
    peakStressMpa: 145,
    yieldLimitMpa: 420,
    safetyFactor: 2.90,
    maxDeflectionMm: 1.80,
    loadPathDescription: 'Global Unibody Structural Modes: Torsion Mode 1 @ 28.4 Hz, Bending Mode 1 @ 36.2 Hz',
    provenance: 'REFERENCE',
  },
};

/* ------------------------------------------------------------
   02 MANUFACTURING QUALITY — METROLOGY DATUM GRID (B01..B24)
   ------------------------------------------------------------ */
export const METROLOGY_DATUM_POINTS: MetrologyDatumPoint[] = [
  { id: 'B01', name: 'Front Datum Pin LH (Subframe Index)', nominal: [-0.62, 0.38, 1.48], measured: [-0.6202, 0.3804, 1.4801], deviationMm: 0.45, toleranceMm: 0.80, status: 'ACCEPT', region: 'Front BIW' },
  { id: 'B02', name: 'Front Datum Pin RH (Subframe Index)', nominal: [0.62, 0.38, 1.48], measured: [0.6198, 0.3803, 1.4802], deviationMm: 0.38, toleranceMm: 0.80, status: 'ACCEPT', region: 'Front BIW' },
  { id: 'B03', name: 'Shock Tower LH Center Datum', nominal: [-0.68, 0.92, 1.25], measured: [-0.6803, 0.9205, 1.2498], deviationMm: 0.58, toleranceMm: 0.75, status: 'ACCEPT', region: 'Front Suspension' },
  { id: 'B04', name: 'Shock Tower RH Center Datum', nominal: [0.68, 0.92, 1.25], measured: [0.6797, 0.9204, 1.2501], deviationMm: 0.42, toleranceMm: 0.75, status: 'ACCEPT', region: 'Front Suspension' },
  { id: 'B05', name: 'A-Pillar Lower Hinge Point LH', nominal: [-0.82, 0.65, 0.82], measured: [-0.8201, 0.6502, 0.8201], deviationMm: 0.24, toleranceMm: 0.60, status: 'ACCEPT', region: 'Cabin Cell' },
  { id: 'B06', name: 'A-Pillar Lower Hinge Point RH', nominal: [0.82, 0.65, 0.82], measured: [0.8199, 0.6503, 0.8198], deviationMm: 0.31, toleranceMm: 0.60, status: 'ACCEPT', region: 'Cabin Cell' },
  { id: 'B07', name: 'A-Pillar Upper Header LH', nominal: [-0.64, 1.42, 0.42], measured: [-0.6402, 1.4203, 0.4199], deviationMm: 0.36, toleranceMm: 0.70, status: 'ACCEPT', region: 'Roof Frame' },
  { id: 'B08', name: 'A-Pillar Upper Header RH', nominal: [0.64, 1.42, 0.42], measured: [0.6398, 1.4204, 0.4202], deviationMm: 0.44, toleranceMm: 0.70, status: 'ACCEPT', region: 'Roof Frame' },
  { id: 'B09', name: 'B-Pillar Striker Node LH', nominal: [-0.84, 0.88, -0.15], measured: [-0.8403, 0.8804, -0.1502], deviationMm: 0.52, toleranceMm: 0.60, status: 'ACCEPT', region: 'Side Ring' },
  { id: 'B10', name: 'B-Pillar Striker Node RH', nominal: [0.84, 0.88, -0.15], measured: [0.8396, 0.8805, -0.1498], deviationMm: 0.61, toleranceMm: 0.60, status: 'ACCEPT', region: 'Side Ring' },
  { id: 'B11', name: 'Rocker Sill Midpoint LH', nominal: [-0.81, 0.32, -0.10], measured: [-0.8102, 0.3202, -0.1001], deviationMm: 0.28, toleranceMm: 0.80, status: 'ACCEPT', region: 'Underbody' },
  { id: 'B12', name: 'Rocker Sill Midpoint RH', nominal: [0.81, 0.32, -0.10], measured: [0.8098, 0.3203, -0.0999], deviationMm: 0.32, toleranceMm: 0.80, status: 'ACCEPT', region: 'Underbody' },
  { id: 'B13', name: 'Battery Mount FL Locating Bushing', nominal: [-0.56, 0.28, 0.85], measured: [-0.5601, 0.2802, 0.8501], deviationMm: 0.22, toleranceMm: 0.50, status: 'ACCEPT', region: 'Battery Interface' },
  { id: 'B14', name: 'Battery Mount FR Locating Bushing', nominal: [0.56, 0.28, 0.85], measured: [0.5599, 0.2801, 0.8499], deviationMm: 0.18, toleranceMm: 0.50, status: 'ACCEPT', region: 'Battery Interface' },
  { id: 'B15', name: 'Battery Mount ML Mid-Rail LH', nominal: [-0.56, 0.28, 0.00], measured: [-0.5603, 0.2804, 0.0001], deviationMm: 0.48, toleranceMm: 0.50, status: 'ACCEPT', region: 'Battery Interface' },
  { id: 'B16', name: 'Battery Mount MR Mid-Rail RH', nominal: [0.56, 0.28, 0.00], measured: [0.5597, 0.2803, -0.0002], deviationMm: 0.39, toleranceMm: 0.50, status: 'ACCEPT', region: 'Battery Interface' },
  { id: 'B17', name: 'Battery Mount RL Rear Carrier LH', nominal: [-0.56, 0.28, -0.85], measured: [-0.5604, 0.2804, -0.8498], deviationMm: 0.42, toleranceMm: 0.80, status: 'ACCEPT', region: 'Battery Interface' },
  { id: 'B18', name: 'Battery Mount RR Rear Carrier RH', nominal: [0.56, 0.28, -0.85], measured: [0.5594, 0.2805, -0.8496], deviationMm: 0.65, toleranceMm: 0.80, status: 'ACCEPT', region: 'Battery Interface' },
  { id: 'B19', name: 'Rear Subframe Hardpoint LH', nominal: [-0.58, 0.42, -1.35], measured: [-0.5802, 0.4203, -1.3499], deviationMm: 0.34, toleranceMm: 0.70, status: 'ACCEPT', region: 'Rear Chassis' },
  { id: 'B20', name: 'Rear Subframe Hardpoint RH', nominal: [0.58, 0.42, -1.35], measured: [0.5798, 0.4202, -1.3501], deviationMm: 0.29, toleranceMm: 0.70, status: 'ACCEPT', region: 'Rear Chassis' },
  { id: 'B21', name: 'C-Pillar Upper Tailgate Node LH', nominal: [-0.58, 1.38, -1.25], measured: [-0.5803, 1.3804, -1.2498], deviationMm: 0.49, toleranceMm: 0.80, status: 'ACCEPT', region: 'Rear Ring' },
  { id: 'B22', name: 'C-Pillar Upper Tailgate Node RH', nominal: [0.58, 1.38, -1.25], measured: [0.5796, 0.3805, -1.2503], deviationMm: 0.55, toleranceMm: 0.80, status: 'ACCEPT', region: 'Rear Ring' },
  { id: 'B23', name: 'Spare Wheel Well Center Pan', nominal: [0.00, 0.45, -1.55], measured: [0.0002, 0.4503, -1.5498], deviationMm: 0.36, toleranceMm: 1.00, status: 'ACCEPT', region: 'Rear Floor' },
  { id: 'B24', name: 'Front Bumper Crash Beam Index LH', nominal: [-0.65, 0.52, 1.82], measured: [-0.6504, 0.5205, 1.8197], deviationMm: 0.62, toleranceMm: 0.90, status: 'ACCEPT', region: 'Crash Structure' },
];

/* ------------------------------------------------------------
   03 BATTERY STRUCTURAL INTEGRATION — 6 MOUNTS
   ------------------------------------------------------------ */
export interface BatteryMountDef {
  id: string;
  name: string;
  location: 'FL' | 'FR' | 'ML' | 'MR' | 'RL' | 'RR';
  fastenerSpec: string;
  targetTorqueNm: number;
  measuredTorqueNm: number;
  torqueToleranceNm: number;
  preloadKn: number;
  refStrainMicrostrain: number;
  currentStrainMicrostrain: number;
  relativeDisplacementMm: number;
  status: 'ACCEPT' | 'WATCH' | 'FLAGGED';
  ultrasonicIntegrityPct: number;
}

export const BATTERY_MOUNTS: BatteryMountDef[] = [
  { id: 'Mount_BFL', name: 'Front-Left Structural Battery Mount', location: 'FL', fastenerSpec: 'M12 × 1.75 Grade 10.9 Flanged Bolt', targetTorqueNm: 95.0, measuredTorqueNm: 95.4, torqueToleranceNm: 4.0, preloadKn: 48.2, refStrainMicrostrain: 218, currentStrainMicrostrain: 221, relativeDisplacementMm: 0.04, status: 'ACCEPT', ultrasonicIntegrityPct: 99.4 },
  { id: 'Mount_BFR', name: 'Front-Right Structural Battery Mount', location: 'FR', fastenerSpec: 'M12 × 1.75 Grade 10.9 Flanged Bolt', targetTorqueNm: 95.0, measuredTorqueNm: 94.8, torqueToleranceNm: 4.0, preloadKn: 47.9, refStrainMicrostrain: 221, currentStrainMicrostrain: 224, relativeDisplacementMm: 0.03, status: 'ACCEPT', ultrasonicIntegrityPct: 99.1 },
  { id: 'Mount_BML', name: 'Mid-Left Structural Battery Mount', location: 'ML', fastenerSpec: 'M12 × 1.75 Grade 10.9 Flanged Bolt', targetTorqueNm: 95.0, measuredTorqueNm: 95.1, torqueToleranceNm: 4.0, preloadKn: 48.0, refStrainMicrostrain: 195, currentStrainMicrostrain: 198, relativeDisplacementMm: 0.02, status: 'ACCEPT', ultrasonicIntegrityPct: 99.6 },
  { id: 'Mount_BMR', name: 'Mid-Right Structural Battery Mount', location: 'MR', fastenerSpec: 'M12 × 1.75 Grade 10.9 Flanged Bolt', targetTorqueNm: 95.0, measuredTorqueNm: 95.3, torqueToleranceNm: 4.0, preloadKn: 48.1, refStrainMicrostrain: 198, currentStrainMicrostrain: 202, relativeDisplacementMm: 0.02, status: 'ACCEPT', ultrasonicIntegrityPct: 99.5 },
  { id: 'Mount_BRL', name: 'Rear-Left Structural Battery Mount', location: 'RL', fastenerSpec: 'M12 × 1.75 Grade 10.9 Flanged Bolt', targetTorqueNm: 95.0, measuredTorqueNm: 94.2, torqueToleranceNm: 4.0, preloadKn: 47.5, refStrainMicrostrain: 205, currentStrainMicrostrain: 262, relativeDisplacementMm: 0.18, status: 'WATCH', ultrasonicIntegrityPct: 96.8 },
  { id: 'Mount_BRR', name: 'Rear-Right Structural Battery Mount', location: 'RR', fastenerSpec: 'M12 × 1.75 Grade 10.9 Flanged Bolt', targetTorqueNm: 95.0, measuredTorqueNm: 94.6, torqueToleranceNm: 4.0, preloadKn: 47.7, refStrainMicrostrain: 209, currentStrainMicrostrain: 251, relativeDisplacementMm: 0.14, status: 'WATCH', ultrasonicIntegrityPct: 97.2 },
];

/* ------------------------------------------------------------
   04 CONTROLLED VALIDATION — TEST RIGS
   ------------------------------------------------------------ */
export interface TestRigDef {
  id: TestRigType;
  name: string;
  facility: string;
  description: string;
  actuatorChannels: string[];
  parameters: { name: string; value: string; unit: string }[];
  measuredOutputs: string[];
  caeCorrelationScorePct: number;
}

export const TEST_RIGS: Record<TestRigType, TestRigDef> = {
  four_post: {
    id: 'four_post',
    name: 'Rig A — 4-Post Servo-Hydraulic Road Simulator',
    facility: 'Tata Structural Validation Lab 4',
    description: 'Independent vertical actuator excitation at all 4 tire contact patches to simulate full vehicle durability schedules.',
    actuatorChannels: ['Actuator FL', 'Actuator FR', 'Actuator RL', 'Actuator RR'],
    parameters: [
      { name: 'Actuator Stroke Limit', value: '±125', unit: 'mm' },
      { name: 'Peak Dynamic Force', value: '35', unit: 'kN' },
      { name: 'Frequency Bandwidth', value: '0.1 – 50.0', unit: 'Hz' },
      { name: 'Test Vehicle Ballast', value: '1695 (Curb + Driver + 100 kg Luggage)', unit: 'kg' },
    ],
    measuredOutputs: ['FL Wheel Acceleration', 'Chassis Rail Strain SG1/SG2', 'Battery Mount Reactions', 'Suspension Jounce Travel'],
    caeCorrelationScorePct: 98.4,
  },
  torsion: {
    id: 'torsion',
    name: 'Rig B — Quasi-Static BIW Torsional Stiffness Test Rig',
    facility: 'Chassis Metrology & Rigidity Rig 2',
    description: 'Rear axle locked rigidly while opposing vertical displacement forces are applied to front suspension hardpoints to measure kNm/deg.',
    actuatorChannels: ['Front-Left Up Actuator', 'Front-Right Down Actuator'],
    parameters: [
      { name: 'Target Torque Couple', value: '3000', unit: 'Nm' },
      { name: 'Loading Rate', value: '50', unit: 'Nm/s' },
      { name: 'Angular Gauge Precision', value: '0.001', unit: 'deg' },
      { name: 'Visual Deformation Scaler', value: '25x (Lab Exaggerated Visualization)', unit: 'ratio' },
    ],
    measuredOutputs: ['Applied Torque Couple (Nm)', 'Angular Torsion Angle θ (deg)', 'Torsional Stiffness K (kNm/deg)', 'A-Pillar Aperture Distortion (mm)'],
    caeCorrelationScorePct: 99.1,
  },
  bending: {
    id: 'bending',
    name: 'Rig C — Static 3-Point Center Floor Bending Rig',
    facility: 'BIW Bending & Fatigue Center 1',
    description: 'Symmetric support at front and rear axle centers with hydraulic ram applying 20 kN downward load on central floor crossmember.',
    actuatorChannels: ['Central Ram C1', 'Central Ram C2'],
    parameters: [
      { name: 'Maximum Downward Force', value: '25', unit: 'kN' },
      { name: 'LVDT Transducer Stations', value: '12', unit: 'points' },
      { name: 'Floor Deflection Limit', value: '4.5', unit: 'mm' },
    ],
    measuredOutputs: ['Center Floor Deflection (mm)', 'Rocker Sag (mm)', 'Battery Floor Strain (με)'],
    caeCorrelationScorePct: 97.8,
  },
  modal: {
    id: 'modal',
    name: 'Rig D — Multichannel Modal NVH & Shaker Test Station',
    facility: 'Acoustic & Vibration Chamber NVH-3',
    description: 'Electrodynamic modal shaker driving swept-sine and white-noise excitation to extract modal shapes and damping ratios.',
    actuatorChannels: ['Electrodynamic Shaker S1 (Front LH)', 'Electrodynamic Shaker S2 (Rear RH)'],
    parameters: [
      { name: 'Excitation Range', value: '5 – 120', unit: 'Hz' },
      { name: 'Resolution', value: '0.1', unit: 'Hz' },
      { name: 'Modal Damping Target', value: '3.5 – 4.2', unit: '%' },
    ],
    measuredOutputs: ['FRF Accelerance (m/s²/N)', 'Natural Frequencies f1/f2/f3 (Hz)', 'Modal Assurance Criterion (MAC)'],
    caeCorrelationScorePct: 98.9,
  },
  battery_mount: {
    id: 'battery_mount',
    name: 'Rig E — 6-Axis Battery Enclosure & Mount Load Rig',
    facility: 'HV Battery Structural Verification Bay',
    description: 'Multi-axis dynamic load test on all 6 chassis-to-battery pack mounting brackets under high shear and tensile fatigue cycles.',
    actuatorChannels: ['Mount BFL Actuator', 'Mount BFR Actuator', 'Mount BML Actuator', 'Mount BMR Actuator', 'Mount BRL Actuator', 'Mount BRR Actuator'],
    parameters: [
      { name: 'Shear Fatigue Cycles', value: '100,000', unit: 'cycles' },
      { name: 'Dynamic Force Amplitude', value: '±15', unit: 'kN' },
      { name: 'Thermal Chamber Range', value: '-20 to +65', unit: '°C' },
    ],
    measuredOutputs: ['Mount Joint Strain (με)', 'Bolt Preload Loss (kN)', 'Fastener Slip Displacement (μm)'],
    caeCorrelationScorePct: 97.2,
  },
};

/* ------------------------------------------------------------
   05 PROVING GROUND SECTORS (INDIAN ROAD CONDITIONS)
   ------------------------------------------------------------ */
export interface RoadSectorDef {
  id: RoadSectorId;
  name: string;
  surfaceType: string;
  typicalSpeedKmh: number;
  dominantFrequencyHz: number;
  peakAccelerationG: number;
  profileDescription: string;
  indianRoadSpecifics: string;
}

export const PROVING_GROUND_SECTORS: Record<RoadSectorId, RoadSectorDef> = {
  'PG-01': {
    id: 'PG-01',
    name: 'Sector 01 — Smooth Highway Asphalt',
    surfaceType: 'High-friction dense asphalt',
    typicalSpeedKmh: 90,
    dominantFrequencyHz: 2.2,
    peakAccelerationG: 0.35,
    profileDescription: 'High-speed expressway reference baseline. Establishes healthy aerodynamic and rolling baseline.',
    indianRoadSpecifics: 'Modern expressway surface (e.g. Pune-Mumbai / Samruddhi Mahamarg standard).',
  },
  'PG-02': {
    id: 'PG-02',
    name: 'Sector 02 — Urban Variable Surface',
    surfaceType: 'City bituminous pavement with patches',
    typicalSpeedKmh: 45,
    dominantFrequencyHz: 6.8,
    peakAccelerationG: 0.72,
    profileDescription: 'Continuous mild surface irregularities, utility trench patches, and manhole level shifts.',
    indianRoadSpecifics: 'Frequent bitumen patch joints and concrete-to-asphalt transitions.',
  },
  'PG-03': {
    id: 'PG-03',
    name: 'Sector 03 — Indian Standard Speed Breakers',
    surfaceType: 'Rubber & Concrete speed humps (IRC:99)',
    typicalSpeedKmh: 20,
    dominantFrequencyHz: 1.5,
    peakAccelerationG: 1.85,
    profileDescription: 'High-amplitude rounded parabolic humps and sharp tabletop elevated pedestrian crossings.',
    indianRoadSpecifics: 'IRC-compliant 100 mm height and non-standard steep municipal speed bumps.',
  },
  'PG-04': {
    id: 'PG-04',
    name: 'Sector 04 — Severe Sharp Edge Potholes',
    surfaceType: 'Milled road with 60–90 mm depth drop-offs',
    typicalSpeedKmh: 35,
    dominantFrequencyHz: 18.5,
    peakAccelerationG: 2.85,
    profileDescription: 'Steep-walled potholes creating high-energy vertical impact into front and rear suspension.',
    indianRoadSpecifics: 'Monsoon-eroded sharp pothole edges and exposed aggregate sub-base.',
  },
  'PG-05': {
    id: 'PG-05',
    name: 'Sector 05 — Rough Belgian Cobblestones',
    surfaceType: 'Granite setts & stone pavings',
    typicalSpeedKmh: 30,
    dominantFrequencyHz: 24.0,
    peakAccelerationG: 1.45,
    profileDescription: 'High-frequency structural chatter testing fastener torque retention and interior clip fatigue.',
    indianRoadSpecifics: 'Old city stone paving and rural paver-block access roads.',
  },
  'PG-06': {
    id: 'PG-06',
    name: 'Sector 06 — Diagonal Twist Ditch Section',
    surfaceType: 'Alternating 150 mm opposite articulation ruts',
    typicalSpeedKmh: 15,
    dominantFrequencyHz: 0.8,
    peakAccelerationG: 0.95,
    profileDescription: 'Severe diagonal chassis articulation inducing maximum torsional distortion across the BIW.',
    indianRoadSpecifics: 'Unpaved rural shoulder drop-offs and uneven construction bypasses.',
  },
  'PG-07': {
    id: 'PG-07',
    name: 'Sector 07 — Accelerated Durability Corrugations',
    surfaceType: 'Washboard corrugated concrete washboard',
    typicalSpeedKmh: 50,
    dominantFrequencyHz: 32.0,
    peakAccelerationG: 2.10,
    profileDescription: 'Accelerated structural life test simulating 100,000 km of rough road usage in 500 km.',
    indianRoadSpecifics: 'Heavy vehicle brake-ripple corrugation on highway toll approach roads.',
  },
  'PG-08': {
    id: 'PG-08',
    name: 'Sector 08 — High-Deceleration Emergency Braking',
    surfaceType: 'High-Mu concrete dry braking lane',
    typicalSpeedKmh: 80,
    dominantFrequencyHz: 1.2,
    peakAccelerationG: 1.15,
    profileDescription: 'Maximum ABS braking stop inducing extreme pitch load transfer to front longitudinal crash cans.',
    indianRoadSpecifics: 'Sudden emergency braking scenario from highway cruising speed.',
  },
  'PG-09': {
    id: 'PG-09',
    name: 'Sector 09 — High-G Slalom & Dynamic Cornering',
    surfaceType: 'Banked skid pad and constant radius loop',
    typicalSpeedKmh: 65,
    dominantFrequencyHz: 0.9,
    peakAccelerationG: 0.88,
    profileDescription: 'Lateral steady-state and transient roll couple testing subframe bushing stiffness.',
    indianRoadSpecifics: 'High-speed ghat/hill-climb continuous switchbacks (e.g. Lonavala/Western Ghats).',
  },
  'PG-10': {
    id: 'PG-10',
    name: 'Sector 10 — 25% Gradient Climb & Kerb Roll-Off',
    surfaceType: 'Steep incline ramp with asymmetric kerb step',
    typicalSpeedKmh: 12,
    dominantFrequencyHz: 0.5,
    peakAccelerationG: 0.75,
    profileDescription: 'Underbody ramp breakover angle verification and climbing torque structural reaction.',
    indianRoadSpecifics: 'Basement parking steep access ramps and high roadside drainage kerbs.',
  },
};

/* ------------------------------------------------------------
   06 ROOT CAUSE TRACE MODEL
   ------------------------------------------------------------ */
export interface RootCauseTraceNode {
  stage: 'CURRENT_FIELD' | 'ROAD_EVENT' | 'COMMISSIONING' | 'MANUFACTURING' | 'DESIGN_CAD';
  stageLabel: string;
  title: string;
  timestamp: string;
  recordId: string;
  evidence: string;
  metric: string;
  state: 'NORMAL' | 'WATCH' | 'INSPECTION_REQUIRED' | 'VERIFIED';
  verifiedSource: string;
}

export const SAMPLE_ROOT_CAUSE_TRACE: RootCauseTraceNode[] = [
  {
    stage: 'CURRENT_FIELD',
    stageLabel: 'Stage 5 — Field Digital Twin',
    title: 'Persistent Rear Chassis Mount Strain Residual',
    timestamp: '2026-06-24 16:45 IST',
    recordId: 'TWIN-OBS-4821',
    evidence: 'Strain gauge S05 on Mount_BRL reads 262 με (+57 με above Commissioning Baseline B). Residual persists across 8 consecutive ignition cycles.',
    metric: 'Residual = +27.8% | Persistence = 0.84 | Anomaly = 0.76',
    state: 'WATCH',
    verifiedSource: 'MEASURED (Hardware S05 Telemetry Stream)',
  },
  {
    stage: 'ROAD_EVENT',
    stageLabel: 'Stage 4 — Proving Ground Event',
    title: 'Severe Pothole & Rear Step Impact Event R-1042',
    timestamp: '2026-06-18 11:24 IST',
    recordId: 'EVENT R-1042',
    evidence: 'Vehicle struck a 85 mm deep sharp-edge pothole on Sector PG-04 at 34 km/h. Rear axle experienced 2.85g vertical spike inducing 742 με peak strain.',
    metric: 'Peak G = 2.85g | Transient Strain = 742 με | Residual Shift = +48 με',
    state: 'WATCH',
    verifiedSource: 'MEASURED (Event Forensics Ingest)',
  },
  {
    stage: 'COMMISSIONING',
    stageLabel: 'Stage 3 — EOL Structural Commissioning',
    title: 'Baseline B Structural Fingerprint Frozen',
    timestamp: '2026-05-15 14:30 IST',
    recordId: 'BASE-B-0287',
    evidence: 'Controlled 4-post excitation baseline recorded. Mount_BRL healthy baseline strain established at 205 με under 1.0g reference static ballast.',
    metric: 'Baseline B Strain = 205 με ± 8 με | First Torsion Freq = 28.4 Hz',
    state: 'VERIFIED',
    verifiedSource: 'REFERENCE (EOL Lab Commissioning Rig)',
  },
  {
    stage: 'MANUFACTURING',
    stageLabel: 'Stage 2 — Battery Integration & Quality Cell',
    title: 'Mount_BRL Fastener Torque & Metrology Datum Check',
    timestamp: '2026-04-22 10:15 IST',
    recordId: 'MFG-GATE-B17',
    evidence: 'Mount BRL bolted at Station 04 with 94.2 Nm (target 95.0 ± 4.0 Nm). Metrology datum B17 showed +0.42 mm tolerance offset (within ±0.80 mm tolerance).',
    metric: 'Torque = 94.2 Nm | Datum B17 Offset = +0.42 mm (ACCEPT)',
    state: 'NORMAL',
    verifiedSource: 'MEASURED (Nutrunner Telemetry & CMM Laser Cell)',
  },
  {
    stage: 'DESIGN_CAD',
    stageLabel: 'Stage 1 — Digital Engineering Release',
    title: 'Engineering Release Gate REV-B Approved for Build',
    timestamp: '2026-02-10 17:00 IST',
    recordId: 'REL-GATE-REV-B',
    evidence: 'CAE load case "battery_mount" validated safety factor of 1.58 under combined 12.5 kN longitudinal + 8.2 kN lateral inertia. Yield limit 450 MPa.',
    metric: 'Safety Factor = 1.58 | Yield Stress = 450 MPa | Status = RELEASED',
    state: 'VERIFIED',
    verifiedSource: 'REFERENCE (CAE Master Validation Report)',
  },
];

/* ------------------------------------------------------------
   07 MANUAL WORKBENCH LOAD POINTS & TEST RUNS
   ------------------------------------------------------------ */
import type { ManualLoadPointDef, EngineeringTestRun } from '../schema/types';

export const MANUAL_LOAD_POINTS: ManualLoadPointDef[] = [
  { id: 'LP-FRONT-RAIL-L', label: 'Front LH Longitudinal Rail (Crush Tube)', componentId: 'FrontLongitudinal_L', region: 'Front BIW', pos: [-0.48, 0.45, 1.35], nominalDir: [0, -1, 0], maxForceN: 45000, kStiffnessNPerMm: 12500 },
  { id: 'LP-FRONT-RAIL-R', label: 'Front RH Longitudinal Rail (Crush Tube)', componentId: 'FrontLongitudinal_R', region: 'Front BIW', pos: [0.48, 0.45, 1.35], nominalDir: [0, -1, 0], maxForceN: 45000, kStiffnessNPerMm: 12500 },
  { id: 'LP-SHOCK-TOWER-FL', label: 'Front-Left Shock Tower Node', componentId: 'SuspensionTower_FL', region: 'Front Suspension', pos: [-0.68, 0.92, 1.25], nominalDir: [0, -1, 0], maxForceN: 35000, kStiffnessNPerMm: 16200 },
  { id: 'LP-SHOCK-TOWER-FR', label: 'Front-Right Shock Tower Node', componentId: 'SuspensionTower_FR', region: 'Front Suspension', pos: [0.68, 0.92, 1.25], nominalDir: [0, -1, 0], maxForceN: 35000, kStiffnessNPerMm: 16200 },
  { id: 'LP-CROSS-FRONT', label: 'Front Subframe Crossmember', componentId: 'CrossMember_Front', region: 'Chassis Frame', pos: [0.00, 0.42, 1.10], nominalDir: [0, -1, 0], maxForceN: 40000, kStiffnessNPerMm: 18000 },
  { id: 'LP-MID-FLOOR', label: 'Center Structural Floor Pan', componentId: 'FrontFloor', region: 'Underbody', pos: [0.00, 0.32, 0.00], nominalDir: [0, -1, 0], maxForceN: 25000, kStiffnessNPerMm: 9800 },
  { id: 'LP-ROCKER-L', label: 'Left Rocker Reinforcement Beam', componentId: 'Rocker_L', region: 'Side Sill', pos: [-0.81, 0.30, 0.00], nominalDir: [1, 0, 0], maxForceN: 50000, kStiffnessNPerMm: 22000 },
  { id: 'LP-ROCKER-R', label: 'Right Rocker Reinforcement Beam', componentId: 'Rocker_R', region: 'Side Sill', pos: [0.81, 0.30, 0.00], nominalDir: [-1, 0, 0], maxForceN: 50000, kStiffnessNPerMm: 22000 },
  { id: 'LP-BAT-MOUNT-FL', label: 'Battery Mount Front-Left (Mount_BFL)', componentId: 'Mount_BFL', region: 'Battery Interface', pos: [-0.56, 0.28, 0.85], nominalDir: [0, -1, 0], maxForceN: 30000, kStiffnessNPerMm: 14500 },
  { id: 'LP-BAT-MOUNT-RL', label: 'Battery Mount Rear-Left (Mount_BRL)', componentId: 'Mount_BRL', region: 'Battery Interface', pos: [-0.56, 0.28, -0.85], nominalDir: [0, -1, 0], maxForceN: 30000, kStiffnessNPerMm: 14500 },
  { id: 'LP-BAT-MOUNT-RR', label: 'Battery Mount Rear-Right (Mount_BRR)', componentId: 'Mount_BRR', region: 'Battery Interface', pos: [0.56, 0.28, -0.85], nominalDir: [0, -1, 0], maxForceN: 30000, kStiffnessNPerMm: 14500 },
  { id: 'LP-REAR-RAIL-L', label: 'Rear LH Longitudinal Rail', componentId: 'RearLongitudinal_L', region: 'Rear BIW', pos: [-0.48, 0.48, -1.35], nominalDir: [0, -1, 0], maxForceN: 42000, kStiffnessNPerMm: 13000 },
  { id: 'LP-REAR-RAIL-R', label: 'Rear RH Longitudinal Rail', componentId: 'RearLongitudinal_R', region: 'Rear BIW', pos: [0.48, 0.48, -1.35], nominalDir: [0, -1, 0], maxForceN: 42000, kStiffnessNPerMm: 13000 },
  { id: 'LP-REAR-CROSS', label: 'Rear Subframe Hardpoint Crossmember', componentId: 'CrossMember_Rear', region: 'Rear Chassis', pos: [0.00, 0.46, -1.40], nominalDir: [0, -1, 0], maxForceN: 38000, kStiffnessNPerMm: 17500 },
];

export const INITIAL_TEST_RUNS: EngineeringTestRun[] = [
  {
    id: 'TR-0241',
    timestamp: '2026-06-24 14:10 IST',
    title: 'Manual 15 kN Vertical Bump on Front-Left Rail',
    componentId: 'FrontLongitudinal_L',
    loadType: 'vertical',
    loadN: 15000,
    dir: [0, -1, 0],
    tempC: 28.0,
    strainBefore: 452,
    strainPeak: 685,
    strainAfter: 453,
    calculatedStressMpa: 143.8,
    displacementMm: 1.20,
    residualMicrostrain: 1,
    outcome: 'NORMAL',
    engineerDecision: 'CONFIRM',
    reviewNote: 'Elastic recovery confirmed. Microstrain returned within ±2 με of Baseline B.',
  },
  {
    id: 'TR-0242',
    timestamp: '2026-06-24 14:45 IST',
    title: 'Manual 22 kN Vertical Load on Battery Mount RL',
    componentId: 'Mount_BRL',
    loadType: 'vertical',
    loadN: 22000,
    dir: [0, -1, 0],
    tempC: 31.4,
    strainBefore: 205,
    strainPeak: 498,
    strainAfter: 262,
    calculatedStressMpa: 104.5,
    displacementMm: 1.52,
    residualMicrostrain: 57,
    outcome: 'WATCH',
    engineerDecision: 'CONFIRM',
    reviewNote: 'Non-linear plastic settling detected at mounting collar. Residual exceeds 15% threshold.',
  },
];
