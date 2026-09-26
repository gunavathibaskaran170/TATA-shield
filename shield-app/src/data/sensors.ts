import type { SensorDef } from '../schema/types';
import { D } from '../schema/dims';

/* SHIELD instrumentation topology.

   The IMU and strain-gauge housings sit where the supplied
   parametric assembly places them: IMU A1/A2 on the left chassis
   rail 40 mm inboard of each axle, strain enclosures SG1/SG2 on
   the right rail at 35 % and 68 % of the wheelbase.  Readings are
   SIMULATED; the mounting positions come from the supplied
   definition. */
const rail = D.railX;
const railTop = D.railY1;
const batY = D.batY1 - 0.02;

export const SENSORS: SensorDef[] = [
  {
    id: 'S01', name: 'Strain — front rail (SG1 station)', signal: 'strain', unit: 'με',
    componentId: 'ChassisRail_R', region: 'F1', side: 'R' as const,
    position: [rail, railTop + 0.02, D.sg1Z], axis: [1, 0, 0],
    baseline: 452, status: 'NORMAL', quality: 0.99, calibrationDate: '2026-05-12',
    samplingHz: 200, provenance: 'SIMULATED',
  },
  {
    id: 'S02', name: 'Strain — front rail, inboard (SG2 station)', signal: 'strain', unit: 'με',
    componentId: 'ChassisRail_R', region: 'F1', side: 'R' as const,
    position: [rail, railTop + 0.02, D.sg2Z], axis: [1, 0, 0],
    baseline: 455, status: 'NORMAL', quality: 0.98, calibrationDate: '2026-05-12',
    samplingHz: 200, provenance: 'SIMULATED',
  },
  {
    id: 'S03', name: 'Strain — battery mount FL', signal: 'strain', unit: 'με',
    componentId: 'Mount_BFL', region: 'B1', side: 'L' as const,
    position: [-D.batX - 0.02, batY, D.batFront - 0.1], axis: [0, 0, -1],
    baseline: 218, status: 'NORMAL', quality: 0.97, calibrationDate: '2026-05-12',
    samplingHz: 100, provenance: 'SIMULATED',
  },
  {
    id: 'S04', name: 'Strain — battery mount FR', signal: 'strain', unit: 'με',
    componentId: 'Mount_BFR', region: 'B2', side: 'R' as const,
    position: [D.batX + 0.02, batY, D.batFront - 0.1], axis: [0, 0, -1],
    baseline: 221, status: 'NORMAL', quality: 0.97, calibrationDate: '2026-05-12',
    samplingHz: 100, provenance: 'SIMULATED',
  },
  {
    id: 'S05', name: 'Strain — battery mount RL', signal: 'strain', unit: 'με',
    componentId: 'Mount_BRL', region: 'B3', side: 'L' as const,
    position: [-D.batX - 0.02, batY, D.batRear + 0.1], axis: [0, 0, 1],
    baseline: 205, status: 'NORMAL', quality: 0.96, calibrationDate: '2026-05-12',
    samplingHz: 100, provenance: 'SIMULATED',
  },
  {
    id: 'S06', name: 'Strain — battery mount RR', signal: 'strain', unit: 'με',
    componentId: 'Mount_BRR', region: 'B4', side: 'R' as const,
    position: [D.batX + 0.02, batY, D.batRear + 0.1], axis: [0, 0, 1],
    baseline: 209, status: 'NORMAL', quality: 0.98, calibrationDate: '2026-05-12',
    samplingHz: 100, provenance: 'SIMULATED',
  },
  {
    id: 'IMU01', name: 'IMU A1 — front rail', signal: 'acceleration', unit: 'm/s²',
    componentId: 'IMU_Housing_A1', region: 'F1', side: 'L' as const,
    position: [-rail - D.imuW / 2, railTop, D.imuAZ], axis: [0, 1, 0],
    baseline: 0.42, status: 'NORMAL', quality: 0.99, calibrationDate: '2026-05-11',
    samplingHz: 500, provenance: 'SIMULATED',
    description: 'Mounted per the supplied definition: left chassis rail, 40 mm inboard of the front axle, housing seated on the rail top face.',
  },
  {
    id: 'IMU02', name: 'IMU — cabin / floor centre', signal: 'acceleration', unit: 'm/s²',
    componentId: 'CrossMember_Center_1', region: 'C1', side: 'CENTER' as const,
    position: [0, D.floorY + 0.05, 0.35], axis: [0, 1, 0],
    baseline: 0.31, status: 'NORMAL', quality: 0.99, calibrationDate: '2026-05-11',
    samplingHz: 500, provenance: 'SIMULATED',
  },
  {
    id: 'IMU03', name: 'IMU A2 — rear rail', signal: 'acceleration', unit: 'm/s²',
    componentId: 'IMU_Housing_A2', region: 'R1', side: 'L' as const,
    position: [-rail - D.imuW / 2, railTop, D.imuBZ], axis: [0, 1, 0],
    baseline: 0.35, status: 'NORMAL', quality: 0.98, calibrationDate: '2026-05-11',
    samplingHz: 500, provenance: 'SIMULATED',
    description: 'Mounted per the supplied definition: left chassis rail, 40 mm inboard of the rear axle, housing seated on the rail top face.',
  },
  {
    id: 'TEMP01', name: 'Thermistor — battery enclosure', signal: 'temperature', unit: '°C',
    componentId: 'BatteryPack_Tray', region: 'C1', side: 'CENTER' as const,
    position: [0, D.batY0 + 0.02, -0.2], axis: [0, -1, 0],
    baseline: 31.4, status: 'NORMAL', quality: 0.95, calibrationDate: '2026-05-10',
    samplingHz: 1, provenance: 'SIMULATED',
  },
  {
    id: 'TEMP02', name: 'Thermistor — rear cross-member', signal: 'temperature', unit: '°C',
    componentId: 'CrossMember_Rear', region: 'R1', side: 'CENTER' as const,
    position: [0.4, D.railY0 + 0.06, -1.0], axis: [0, 0, 1],
    baseline: 29.8, status: 'NORMAL', quality: 0.94, calibrationDate: '2026-05-10',
    samplingHz: 1, provenance: 'SIMULATED',
  },
];

export const SENSOR_BY_ID: Record<string, SensorDef> = Object.fromEntries(
  SENSORS.map((s) => [s.id, s]),
);

export const SENSOR_COMPONENT_MAP: Record<string, string> = Object.fromEntries(
  SENSORS.map((s) => [s.id, s.componentId]),
);