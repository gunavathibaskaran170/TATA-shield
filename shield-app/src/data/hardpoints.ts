/* ============================================================
   SHIELD — EV Structural Engineering Hardpoint Limit Profiles
   Pertains to real automotive structural limits, load capacities,
   yield/ultimate thresholds, and physics calculations.
   ============================================================ */

export interface HardpointLimitProfile {
  id: string;
  name: string;
  code: string;
  componentId: string;
  region: string;
  materialName: string;
  youngModulusGpa: number;
  yieldStressMpa: number;
  ultimateStressMpa: number;
  maxElasticStrainMicro: number;
  maxAllowableDisplacementMm: number;
  safeForceLimitKn: number;
  yieldForceLimitKn: number;
  ultimateForceLimitKn: number;
  nominalPos: [number, number, number];
  defaultLoadDir: [number, number, number];
  description: string;
}

export const HARDPOINT_PROFILES: Record<string, HardpointLimitProfile> = {
  front_rail_lh: {
    id: 'front_rail_lh',
    name: 'Front Rail LH (Crash Beam Attachment)',
    code: 'HP-F01-L',
    componentId: 'subframe_front',
    region: 'Front Crash Structure',
    materialName: 'DP800 Dual Phase Steel',
    youngModulusGpa: 210,
    yieldStressMpa: 500,
    ultimateStressMpa: 800,
    maxElasticStrainMicro: 2380,
    maxAllowableDisplacementMm: 12.0,
    safeForceLimitKn: 25.0,
    yieldForceLimitKn: 45.0,
    ultimateForceLimitKn: 70.0,
    nominalPos: [-0.65, 0.45, 1.45],
    defaultLoadDir: [0, -1, 0],
    description: 'Primary energy absorbing crash rail for frontal collision and suspension strut tower tie-in.',
  },
  front_rail_rh: {
    id: 'front_rail_rh',
    name: 'Front Rail RH (Crash Beam Attachment)',
    code: 'HP-F01-R',
    componentId: 'subframe_front',
    region: 'Front Crash Structure',
    materialName: 'DP800 Dual Phase Steel',
    youngModulusGpa: 210,
    yieldStressMpa: 500,
    ultimateStressMpa: 800,
    maxElasticStrainMicro: 2380,
    maxAllowableDisplacementMm: 12.0,
    safeForceLimitKn: 25.0,
    yieldForceLimitKn: 45.0,
    ultimateForceLimitKn: 70.0,
    nominalPos: [0.65, 0.45, 1.45],
    defaultLoadDir: [0, -1, 0],
    description: 'Right-hand longitudinal chassis member managing front-impact load transfer.',
  },
  battery_enclosure: {
    id: 'battery_enclosure',
    name: 'Battery Frame Side Member (LH Center)',
    code: 'HP-B02-C',
    componentId: 'battery_pack',
    region: 'Underbody Skateboard Enclosure',
    materialName: '6005A-T6 Extruded Aluminum',
    youngModulusGpa: 69,
    yieldStressMpa: 270,
    ultimateStressMpa: 310,
    maxElasticStrainMicro: 3910,
    maxAllowableDisplacementMm: 6.0,
    safeForceLimitKn: 15.0,
    yieldForceLimitKn: 30.0,
    ultimateForceLimitKn: 48.0,
    nominalPos: [-0.85, 0.15, 0.0],
    defaultLoadDir: [0, -1, 0],
    description: 'Extruded aluminum side sill protecting high-voltage pack cells from lateral intrusion and bending.',
  },
  shock_tower_fl: {
    id: 'shock_tower_fl',
    name: 'Front Left Shock Tower Mount',
    code: 'HP-S01-FL',
    componentId: 'suspension_front',
    region: 'Front Suspension Support',
    materialName: 'Cast Aluminum AlSi10MnMg',
    youngModulusGpa: 71,
    yieldStressMpa: 220,
    ultimateStressMpa: 300,
    maxElasticStrainMicro: 3100,
    maxAllowableDisplacementMm: 8.0,
    safeForceLimitKn: 20.0,
    yieldForceLimitKn: 38.0,
    ultimateForceLimitKn: 55.0,
    nominalPos: [-0.72, 0.65, 1.25],
    defaultLoadDir: [0, -1, 0],
    description: 'High-pressure die-cast node reacting vertical strut damper dynamic jounce loads.',
  },
  crossmember_front: {
    id: 'crossmember_front',
    name: 'Floor Crossmember #1 (Firewall Bulkhead)',
    code: 'HP-X01-F',
    componentId: 'chassis_main',
    region: 'Cabin Floor Transverse Brace',
    materialName: 'Boron Steel 22MnB5 (Press Hardened)',
    youngModulusGpa: 210,
    yieldStressMpa: 1100,
    ultimateStressMpa: 1500,
    maxElasticStrainMicro: 5230,
    maxAllowableDisplacementMm: 7.5,
    safeForceLimitKn: 30.0,
    yieldForceLimitKn: 60.0,
    ultimateForceLimitKn: 95.0,
    nominalPos: [0.0, 0.25, 0.85],
    defaultLoadDir: [0, -1, 0],
    description: 'Ultra-high strength hot-stamped crossmember preventing footwell intrusion under crash load.',
  },
  rear_subframe: {
    id: 'rear_subframe',
    name: 'Rear Subframe Mount RH',
    code: 'HP-R03-R',
    componentId: 'subframe_rear',
    region: 'Rear Axle / Drive Unit Subframe',
    materialName: 'S355J2 Structural Steel',
    youngModulusGpa: 210,
    yieldStressMpa: 355,
    ultimateStressMpa: 510,
    maxElasticStrainMicro: 1690,
    maxAllowableDisplacementMm: 10.0,
    safeForceLimitKn: 22.0,
    yieldForceLimitKn: 42.0,
    ultimateForceLimitKn: 65.0,
    nominalPos: [0.68, 0.40, -1.35],
    defaultLoadDir: [0, -1, 0],
    description: 'Bush mount hardpoint transferring drive motor torque reaction and rear suspension lateral forces.',
  },
};

export interface EngineeringCalculationResult {
  hardpointId: string;
  appliedForceKn: number;
  calculatedStressMpa: number;
  calculatedStrainMicro: number;
  displacementMm: number;
  stressUtilizationPct: number;
  strainUtilizationPct: number;
  dispUtilizationPct: number;
  loadUtilizationPct: number;
  utilizationIndexPct: number;
  governingCriterion: 'STRESS' | 'STRAIN' | 'DISPLACEMENT' | 'LOAD_CAPACITY';
  conditionState: 'GREEN' | 'AMBER' | 'RED';
  conditionLabel: string;
  residualStrainMicro: number;
  residualDisplacementMm: number;
  baselineDeviationPct: number;
  percentRecovery: number;
  isYieldExceeded: boolean;
  isUltimateExceeded: boolean;
}

export function calculateStructuralResponse(
  profile: HardpointLimitProfile,
  forceKn: number,
  tempC: number = 23,
  phase: 'BEFORE' | 'DURING' | 'AFTER' = 'DURING'
): EngineeringCalculationResult {
  // Thermal derating factor (0.1% per deg C above 23C)
  const tempDelta = Math.max(0, tempC - 23);
  const thermalDerateFactor = Math.max(0.7, 1.0 - tempDelta * 0.001);

  const effectiveYieldStress = profile.yieldStressMpa * thermalDerateFactor;
  const effectiveYieldForce = profile.yieldForceLimitKn * thermalDerateFactor;

  // Phase logic
  let activeForceKn = forceKn;
  if (phase === 'BEFORE') {
    activeForceKn = 0;
  } else if (phase === 'AFTER') {
    activeForceKn = 0; // Unloaded for recovery check
  }

  // Cross-sectional stress approximation (Area calculated from safe limit @ 50% yield)
  // Safe force (Kn) -> Nominal Area in mm2 = (safeForce * 1000) / (0.5 * yieldStress)
  const nominalAreaMm2 = (profile.safeForceLimitKn * 1000) / Math.max(10, 0.5 * profile.yieldStressMpa);
  
  const calculatedStressMpa = activeForceKn > 0
    ? (activeForceKn * 1000) / nominalAreaMm2
    : 0;

  // Hooke's Law strain in microstrain: strain = (stress / E) * 1e6
  const calculatedStrainMicro = activeForceKn > 0
    ? (calculatedStressMpa / (profile.youngModulusGpa * 1000)) * 1e6
    : 0;

  // Displacement linear-elastic approximation + non-linear post-yield displacement
  let displacementMm = 0;
  if (activeForceKn > 0) {
    const elasticDisp = (activeForceKn / profile.safeForceLimitKn) * (profile.maxAllowableDisplacementMm * 0.5);
    if (activeForceKn > effectiveYieldForce) {
      // Plastic amplification
      const plasticRatio = (activeForceKn - effectiveYieldForce) / (profile.ultimateForceLimitKn - effectiveYieldForce);
      displacementMm = elasticDisp + plasticRatio * profile.maxAllowableDisplacementMm * 1.5;
    } else {
      displacementMm = elasticDisp;
    }
  }

  // Calculate Utilizations
  const stressUtilizationPct = Math.min(150, (calculatedStressMpa / effectiveYieldStress) * 100);
  const strainUtilizationPct = Math.min(150, (calculatedStrainMicro / profile.maxElasticStrainMicro) * 100);
  const dispUtilizationPct = Math.min(150, (displacementMm / profile.maxAllowableDisplacementMm) * 100);
  const loadUtilizationPct = Math.min(150, (activeForceKn / profile.safeForceLimitKn) * 100);

  // Governing criterion is max of metrics
  const metrics = [
    { label: 'STRESS' as const, val: stressUtilizationPct },
    { label: 'STRAIN' as const, val: strainUtilizationPct },
    { label: 'DISPLACEMENT' as const, val: dispUtilizationPct },
    { label: 'LOAD_CAPACITY' as const, val: loadUtilizationPct },
  ];
  metrics.sort((a, b) => b.val - a.val);

  const governing = metrics[0];
  const utilizationIndexPct = Math.round(governing.val * 10) / 10;

  // Yield and ultimate conditions based on peak force parameter
  const isYieldExceeded = forceKn >= effectiveYieldForce;
  const isUltimateExceeded = forceKn >= profile.ultimateForceLimitKn;

  // 3-Light Structural Condition
  let conditionState: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';
  let conditionLabel = 'NORMAL OPERATING RANGE';

  if (isYieldExceeded || utilizationIndexPct >= 100) {
    conditionState = 'RED';
    conditionLabel = isUltimateExceeded
      ? 'ULTIMATE STRUCTURAL FAILURE RISK'
      : 'PLASTIC YIELD / PERMANENT DEFORMATION';
  } else if (utilizationIndexPct >= 70 || forceKn >= profile.safeForceLimitKn) {
    conditionState = 'AMBER';
    conditionLabel = 'HIGH LOAD / YIELD THRESHOLD APPROACHING';
  }

  // Permanent Plastic Residual calculation for AFTER phase
  let residualStrainMicro = 0;
  let residualDisplacementMm = 0;
  let percentRecovery = 100;
  let baselineDeviationPct = 0;

  if (forceKn > effectiveYieldForce) {
    const plasticOverload = (forceKn - effectiveYieldForce) / (profile.ultimateForceLimitKn - effectiveYieldForce);
    residualStrainMicro = Math.round(plasticOverload * profile.maxElasticStrainMicro * 1.8);
    residualDisplacementMm = Math.round(plasticOverload * profile.maxAllowableDisplacementMm * 0.8 * 10) / 10;
    percentRecovery = Math.max(0, Math.round((1 - plasticOverload * 0.75) * 1000) / 10);
    baselineDeviationPct = Math.round(plasticOverload * 35.0 * 10) / 10;
  } else {
    residualStrainMicro = 0;
    residualDisplacementMm = 0;
    percentRecovery = 100;
    baselineDeviationPct = Math.round((forceKn / profile.safeForceLimitKn) * 2.5 * 10) / 10;
  }

  return {
    hardpointId: profile.id,
    appliedForceKn: activeForceKn,
    calculatedStressMpa: Math.round(calculatedStressMpa * 10) / 10,
    calculatedStrainMicro: Math.round(calculatedStrainMicro),
    displacementMm: Math.round(displacementMm * 100) / 100,
    stressUtilizationPct: Math.round(stressUtilizationPct * 10) / 10,
    strainUtilizationPct: Math.round(strainUtilizationPct * 10) / 10,
    dispUtilizationPct: Math.round(dispUtilizationPct * 10) / 10,
    loadUtilizationPct: Math.round(loadUtilizationPct * 10) / 10,
    utilizationIndexPct,
    governingCriterion: governing.label,
    conditionState,
    conditionLabel,
    residualStrainMicro,
    residualDisplacementMm,
    baselineDeviationPct,
    percentRecovery,
    isYieldExceeded,
    isUltimateExceeded,
  };
}
