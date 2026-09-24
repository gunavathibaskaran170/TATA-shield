/* ============================================================
   SHIELD — Telemetry Schemas (Zod)
   Runtime validation for all wire-format messages.
   ============================================================ */

import { z } from 'zod';

/* ---- Raw sensor reading (device → gateway → twin) ---- */
export const SensorReadingSchema = z.object({
  sensorId: z.string().min(1),
  timestamp: z.number().int().positive(),
  value: z.number(),
  channels: z.record(z.number()).optional(),
  unit: z.string().min(1),
  source: z.enum(['SIMULATED', 'HARDWARE']),
  quality: z.number().min(0).max(1),
  status: z.enum(['NORMAL', 'WATCH', 'INSPECTION_REQUIRED', 'FAULT']),
  seq: z.number().int().nonnegative().optional(),
});

/* ---- Derived metrics (computed in twin) ---- */
export const DerivedMetricsSchema = z.object({
  sensorId: z.string().min(1),
  timestamp: z.number().int().positive(),
  expected: z.number().nullable(),
  residual: z.number().nullable(),
  rms: z.number().nullable(),
  peak: z.number().nullable(),
  trend: z.number().nullable(),
  anomalyScore: z.number().nullable(),
  state: z.enum(['NORMAL', 'WATCH', 'INSPECTION_REQUIRED', 'FAULT']),
});

/* ---- Connection state ---- */
export const LinkStateSchema = z.enum(['SIMULATED', 'CONNECTING', 'CONNECTED', 'DISCONNECTED', 'RECONNECTING', 'ERROR']);

export const ConnectionStateSchema = z.object({
  link: LinkStateSchema,
  source: z.enum(['SIMULATED', 'HARDWARE']),
  lastPacketAt: z.number().int().nonnegative().nullable(),
  packetRateHz: z.number().nonnegative(),
  dropped: z.number().int().nonnegative(),
});

/* ---- Wire envelopes (WebSocket / MQTT) ---- */
export const TelemetryEnvelopeSchema = z.object({
  type: z.literal('telemetry'),
  data: SensorReadingSchema,
});

export const DeviceStatusEnvelopeSchema = z.object({
  type: z.literal('device_status'),
  data: z.object({
    deviceId: z.string(),
    status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED']),
    firmware: z.string().optional(),
    ip: z.string().optional(),
    heartbeat: z.number().optional(),
    packetsRx: z.number().optional(),
    packetsDropped: z.number().optional(),
    sampleRateHz: z.number().optional(),
  }),
});

export const SensorStatusEnvelopeSchema = z.object({
  type: z.literal('sensor_status'),
  data: z.object({
    sensorId: z.string(),
    status: z.enum(['NORMAL', 'WATCH', 'INSPECTION_REQUIRED', 'FAULT']),
    quality: z.number().min(0).max(1),
    lastSeen: z.number().int(),
  }),
});

export const AlertEnvelopeSchema = z.object({
  type: z.literal('alert'),
  data: z.object({
    id: z.string(),
    timestamp: z.number().int(),
    sensorId: z.string().optional(),
    region: z.string().optional(),
    condition: z.string(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    evidence: z.record(z.unknown()).optional(),
    acknowledged: z.boolean().default(false),
  }),
});

export const HeartbeatEnvelopeSchema = z.object({
  type: z.literal('heartbeat'),
  data: z.object({
    timestamp: z.number().int(),
    gatewayId: z.string().optional(),
  }),
});

export const VerdictEnvelopeSchema = z.object({
  type: z.literal('verdict'),
  data: z.object({
    verdict: z.enum(['PASS', 'WARNING', 'INSPECTION_REQUIRED', 'REWORK_REQUIRED', 'NOT_ASSESSED']),
    model: z.string(),
    confidence: z.number().nullable(),
    abnormalRegions: z.array(z.string()),
    contributingFeatures: z.array(z.object({
      name: z.string(),
      value: z.number(),
      baseline: z.number().nullable(),
      deviation: z.number().nullable(),
    })),
    recommendedInspection: z.string().nullable(),
    evidenceWindow: z.object({ from: z.number().int(), to: z.number().int() }),
    notes: z.array(z.string()),
  }),
});

/* Union of all envelope types */
export const AnyEnvelopeSchema = z.discriminatedUnion('type', [
  TelemetryEnvelopeSchema,
  DeviceStatusEnvelopeSchema,
  SensorStatusEnvelopeSchema,
  AlertEnvelopeSchema,
  HeartbeatEnvelopeSchema,
  VerdictEnvelopeSchema,
]);

/* ---- Validation helpers ---- */
export function validateEnvelope(obj) {
  return AnyEnvelopeSchema.safeParse(obj);
}

export function validateReading(obj) {
  return SensorReadingSchema.safeParse(obj);
}

export function validateDerived(obj) {
  return DerivedMetricsSchema.safeParse(obj);
}

export function validateConnectionState(obj) {
  return ConnectionStateSchema.safeParse(obj);
}

/* ---- Type inference for JSDoc ---- */
/**
 * @typedef {z.infer<typeof SensorReadingSchema>} SensorReading
 * @typedef {z.infer<typeof DerivedMetricsSchema>} DerivedMetrics
 * @typedef {z.infer<typeof ConnectionStateSchema>} ConnectionState
 * @typedef {z.infer<typeof AnyEnvelopeSchema>} AnyEnvelope
 */