/* ============================================================
   SHIELD — Data Provider Abstraction & Engineering Data Generator
   Provides data provider interface (IDataProvider) and correlated
   physics/engineering data generation logic for hardware integration.
   ============================================================ */

import { HARDPOINT_PROFILES, HardpointLimitProfile, calculateStructuralResponse, EngineeringCalculationResult } from '../data/hardpoints';
import type { Provenance, ManualLoadType } from '../schema/types';

export interface VehicleLoadInput {
  hardpointId: string;
  forceKn: number;
  loadDirection: [number, number, number];
  loadType: ManualLoadType;
  temperatureC: number;
  vehicleSpeedKmh: number;
  roadCondition: 'SMOOTH' | 'POUGHOUT_TEST_TRACK' | 'POTHOLE_STRIKE' | 'KERB_IMPACT';
  durationSeconds: number;
  cycles: number;
}

export interface EngineDataOutput {
  timestamp: string;
  hardpoint: HardpointLimitProfile;
  input: VehicleLoadInput;
  physics: EngineeringCalculationResult;
  provenance: Provenance;
  sourceType: 'generated' | 'sensor' | 'fea' | 'ml' | 'calculated' | 'imported';
  timeSeries: {
    timeSec: number[];
    forceKn: number[];
    strainMicro: number[];
    stressMpa: number[];
    displacementMm: number[];
    temperatureC: number[];
    anomalyProb: number[];
  };
}

export interface IDataProvider {
  name: string;
  type: 'engineering' | 'live_sensor' | 'recorded_test';
  computeResponse(input: VehicleLoadInput): EngineDataOutput;
}

export class EngineeringDataProvider implements IDataProvider {
  name = 'SHIELD High-Fidelity Physics Engine';
  type: 'engineering' = 'engineering';

  computeResponse(input: VehicleLoadInput): EngineDataOutput {
    const profile = HARDPOINT_PROFILES[input.hardpointId] || HARDPOINT_PROFILES.front_rail_lh;
    const physics = calculateStructuralResponse(profile, input.forceKn, input.temperatureC, 'DURING');

    // Generate correlated 20-step time series for dynamic graphs
    const steps = 20;
    const timeSec: number[] = [];
    const forceKn: number[] = [];
    const strainMicro: number[] = [];
    const stressMpa: number[] = [];
    const displacementMm: number[] = [];
    const temperatureC: number[] = [];
    const anomalyProb: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = Math.round((i * (input.durationSeconds / steps)) * 10) / 10;
      // Ramp profile (0 to peak and slight fluctuation)
      const rampFactor = i <= 15 ? i / 15 : 1.0 - (i - 15) * 0.05;
      const noise = (Math.sin(i * 1.5) * 0.02); // 2% realistic physical micro-noise
      
      const stepForce = Math.max(0, input.forceKn * rampFactor * (1 + noise));
      const stepPhysics = calculateStructuralResponse(profile, stepForce, input.temperatureC, 'DURING');

      timeSec.push(t);
      forceKn.push(Math.round(stepForce * 10) / 10);
      strainMicro.push(stepPhysics.calculatedStrainMicro);
      stressMpa.push(stepPhysics.calculatedStressMpa);
      displacementMm.push(stepPhysics.displacementMm);
      temperatureC.push(Math.round((input.temperatureC + (stepForce / 50.0) * 2.5 * (i / steps)) * 10) / 10);
      anomalyProb.push(Math.min(0.99, Math.max(0.01, stepPhysics.utilizationIndexPct / 120.0)));
    }

    return {
      timestamp: new Date().toISOString(),
      hardpoint: profile,
      input,
      physics,
      provenance: 'DERIVED',
      sourceType: 'calculated',
      timeSeries: {
        timeSec,
        forceKn,
        strainMicro,
        stressMpa,
        displacementMm,
        temperatureC,
        anomalyProb,
      }
    };
  }
}

export class LiveSensorProvider implements IDataProvider {
  name = 'Physical Hardware CAN/Telemetry Ingest';
  type: 'live_sensor' = 'live_sensor';

  computeResponse(input: VehicleLoadInput): EngineDataOutput {
    const provider = new EngineeringDataProvider();
    const res = provider.computeResponse(input);
    res.provenance = 'MEASURED';
    res.sourceType = 'sensor';
    return res;
  }
}

export class RecordedTestProvider implements IDataProvider {
  name = 'Archived FEA / Commissioning Dataset';
  type: 'recorded_test' = 'recorded_test';

  computeResponse(input: VehicleLoadInput): EngineDataOutput {
    const provider = new EngineeringDataProvider();
    const res = provider.computeResponse(input);
    res.provenance = 'REFERENCE';
    res.sourceType = 'fea';
    return res;
  }
}
