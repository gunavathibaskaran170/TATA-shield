/* ============================================================
   SHIELD — analytics pipeline.
   packet → feature → baseline comparison → residual →
   persistence → state → region signals.
   Everything derived is labeled MODEL_ESTIMATED / DERIVED.
   ============================================================ */

import type { DerivedAnalytics, HealthState, RegionState, SensorLive, TelemetryPacket } from '../schema/types';
import { SENSOR_BY_ID } from '../data/sensors';
import { useStore } from '../store/useStore';

/* Which structural components each sensor informs (model estimate). */
export const SENSOR_REGION_COMPONENTS: Record<string, string[]> = {
  S01: ['FrontLongitudinal_L', 'CrashBeam', 'SuspensionTower_FL'],
  S02: ['FrontLongitudinal_R', 'CrashBeam', 'SuspensionTower_FR'],
  S03: ['Mount_BFL', 'CrossMember_Front', 'BatteryPack_SideL'],
  S04: ['Mount_BFR', 'CrossMember_Front', 'BatteryPack_SideR'],
  S05: ['Mount_BRL', 'CrossMember_Rear', 'BatteryPack_XR', 'RearLongitudinal_L', 'CrossMember_Center_2'],
  S06: ['Mount_BRR', 'CrossMember_Rear', 'BatteryPack_XR', 'RearLongitudinal_R', 'CrossMember_Center_2'],
  IMU01: ['DashCrossMember'],
  IMU02: ['CrossMember_Center_1', 'FrontFloor', 'BatteryPack_Tray'],
  IMU03: ['RearFloorCrossMember', 'RearFloor', 'RearLongitudinal_L', 'RearLongitudinal_R'],
  TEMP01: ['BatteryPack_Tray'],
  TEMP02: ['CrossMember_Rear', 'RearFloorCrossMember'],
};

const TREND_LEN = 48;

function stateOf(a: number): HealthState {
  if (a < 0.35) return 'NORMAL';
  if (a < 0.7) return 'WATCH';
  return 'INSPECTION_REQUIRED';
}

export class AnalyticsEngine {
  private trends: Record<string, number[]> = {};
  private ema: Record<string, number> = {};
  private active: Record<string, SensorLive> = {};

  ingest(pkt: TelemetryPacket) {
    const sensor = SENSOR_BY_ID[pkt.sensorId];
    if (!sensor) return;

    const trend = this.trends[pkt.sensorId] ?? [];
    trend.push(pkt.value);
    if (trend.length > TREND_LEN) trend.shift();
    this.trends[pkt.sensorId] = trend;

    const w = Math.min(1, trend.length / 8);
    const movable = trend.slice(-8);
    const measured = movable.reduce((a, b) => a + b, 0) / Math.max(1, movable.length);

    const expected = sensor.baseline; // Baseline B commissioning fingerprint
    const residual = measured - expected;
    const residualPercent = (residual / Math.max(1, Math.abs(expected))) * 100;

    // persistence: exponential moving average of |residual| normalised
    const rawP = Math.abs(residual) / Math.max(1, Math.abs(expected));
    const prevEma = this.ema[pkt.sensorId] ?? 0;
    const persistence = 0.82 * prevEma + 0.18 * rawP;
    this.ema[pkt.sensorId] = persistence;

    const residualNorm = Math.min(1, Math.abs(residualPercent) / 15);
    const anomaly = Math.min(
      1,
      0.42 * residualNorm + 0.4 * persistence + 0.18 * (1 - Math.min(1, pkt.quality / 0.9)),
    );

    const analytics: DerivedAnalytics = {
      baselineExpected: expected,
      residual,
      residualPercent: round(residualPercent, 2),
      persistenceScore: round(persistence, 3),
      anomalyScore: round(anomaly, 3),
      state: stateOf(anomaly),
      confidence: round(0.86 + 0.14 * pkt.quality, 3),
      source: 'MODEL_ESTIMATED',
      loadRedistribution: 0,
    };

    const live: SensorLive = {
      sensor,
      packet: { ...pkt, value: measured },
      analytics,
      ts: Date.now(),
      trend: [...trend],
    };
    this.active[pkt.sensorId] = live;
  }

  flush() {
    const st = useStore.getState();
    st.setSensorLive(Object.fromEntries(Object.entries(this.active)));

    // region states: worst-of across informing sensors
    const regions: Record<string, RegionState> = {};
    const heat: Record<string, number> = {};
    for (const [sid, comps] of Object.entries(SENSOR_REGION_COMPONENTS)) {
      const live = this.active[sid];
      if (!live) continue;
      const a = live.analytics;
      for (const cid of comps) {
        const cur = regions[cid];
        const severity = a.state === 'INSPECTION_REQUIRED' ? 3 : a.state === 'WATCH' ? 2 : 1;
        const curSev = cur ? (cur.state === 'INSPECTION_REQUIRED' ? 3 : cur.state === 'WATCH' ? 2 : 1) : 0;
        if (severity >= curSev) {
          regions[cid] = {
            componentId: cid, state: a.state, anomaly: a.anomalyScore,
            residualPct: a.residualPercent, persistence: a.persistenceScore,
            confidence: a.confidence, source: 'MODEL_ESTIMATED',
          };
        }
        heat[cid] = Math.max(heat[cid] ?? 0, a.anomalyScore);
      }
    }
    st.setRegionStates(regions);
    st.setHeatValues(heat);
  }
}

function round(n: number, d: number) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

/* Auto-starts telemetry streams: connects HardwareStream + fallback MockStream. */
import { MockStream } from './mock';
import { hardwareStream, HardwareStream } from './hardwareStream';

let activeStreamType: 'hardware' | 'mock' = 'hardware';
let mockStreamInstance: MockStream | null = null;
let engineInstance: AnalyticsEngine | null = null;
let started = false;
let lastHardwarePacketTs = 0;

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!engineInstance) {
    engineInstance = new AnalyticsEngine();
  }
  return engineInstance;
}

export function getHardwareStream(): HardwareStream {
  return hardwareStream;
}

export function getActiveStreamType(): 'hardware' | 'mock' {
  return activeStreamType;
}

export function setStreamAdapter(type: 'hardware' | 'mock') {
  activeStreamType = type;
  if (!engineInstance) return;

  if (type === 'hardware') {
    hardwareStream.connect();
  } else {
    if (!mockStreamInstance) {
      mockStreamInstance = new MockStream();
      mockStreamInstance.onPacket((pkt) => engineInstance!.ingest(pkt));
    }
    mockStreamInstance.connect();
  }
}

export function startShieldStream() {
  if (started) return;
  started = true;
  const engine = getAnalyticsEngine();

  // Initialize both streams with ingestion callbacks
  hardwareStream.onPacket((pkt) => {
    lastHardwarePacketTs = Date.now();
    if (activeStreamType === 'hardware') {
      engine.ingest(pkt);
    }
  });

  mockStreamInstance = new MockStream();
  mockStreamInstance.onPacket((pkt) => {
    // If user explicitly chose mock OR if hardware has not sent a packet in the last 2.5s
    if (activeStreamType === 'mock' || Date.now() - lastHardwarePacketTs > 2500) {
      engine.ingest(pkt);
    }
  });

  // Start with hardware stream active (connects to ws://localhost:8765)
  // Also start mock stream if hardware is offline so user has instant feedback
  hardwareStream.connect();
  mockStreamInstance.connect();

  setInterval(() => engine.flush(), 200);
}