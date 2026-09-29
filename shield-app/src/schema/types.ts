/* ============================================================
   SHIELD — core data model (TypeScript interfaces)
   Every value in the twin carries a provenance so that nothing
   is ever presented as verified OEM data unless it is.
   ============================================================ */

export type Provenance =
  | 'MEASURED'        // direct hardware measurement
  | 'DERIVED'         // computed from measurements
  | 'MODEL_ESTIMATED' // engineering model estimate (simulation/derived)
  | 'SIMULATED'       // synthetic feed (mock generator)
  | 'DEMO'            // placeholder used for presentation only
  | 'REFERENCE'       // precomputed CAD/CAE benchmark baseline
  | 'VERIFIED';       // confirmed against supplied authoritative source

export type HealthState = 'NORMAL' | 'WATCH' | 'INSPECTION_REQUIRED';
export type SensorStatus = HealthState | 'OFFLINE';
export type Side = 'L' | 'R' | 'CENTER' | null;

export type GeometryFamily =
  | 'panel'
  | 'strut'
  | 'rail'
  | 'beam'
  | 'box'
  | 'cylinder'
  | 'pack'
  | 'wheel'
  | 'seat'
  | 'glass'
  | 'harness'
  | 'sensor'
  | 'fastener'
  | 'electronics'
  | 'thermal';

/* ------------------------------------------------------------
   Component record — every selectable mesh maps to one of these.
   ------------------------------------------------------------ */
export interface ComponentDef {
  id: string;
  name: string;
  system: string;             // top-level system key
  subsystem?: string;
  layer: number;              // 0..21 layer stack index
  region?: string;            // structural region id (F1/C1/R1/B1..B4…) or zone
  side?: Side;
  gf: GeometryFamily;         // drives tree icon + geometry hints
  material?: string;          // DEMO unless verified
  manufacturingProcess?: string; // DEMO unless verified
  description: string;
  parent: string;             // parent component or system group id
  massKg?: number;            // DEMO/approximate
  explodeDir: [number, number, number]; // assembly axis for explosion
  explodeGroup: number;       // 0 = core, higher = moves further out
  healthState: HealthState;   // default health mapping (rruntime overrides)
  baselineId?: string;
  dataConfidence?: number;    // 0..1
  lastInspection?: string;
  lastUpdated?: string;
  provenance?: Provenance;
}

/* ------------------------------------------------------------
   Layer stack (Layer 0 … 21) — for show/hide/opacity management.
   ------------------------------------------------------------ */
export interface LayerDef {
  index: number;
  label: string;
  hint: string;
}

/* ------------------------------------------------------------
   Sensor instrumentation
   ------------------------------------------------------------ */
export type SensorSignal =
  | 'strain'
  | 'acceleration'
  | 'vibration'
  | 'temperature'
  | 'displacement';

export interface SensorDef {
  id: string;                       // S01 …
  name: string;
  signal: SensorSignal;
  unit: string;
  componentId: string;              // inspected component
  region: string;
  side?: Side;                      // L/R/CENTER for symmetry/rendering
  position: [number, number, number];
  axis: [number, number, number];
  baseline: number;                 // commissioning fingerprint value
  status: SensorStatus;
  quality: number;                  // 0..1 packet/signal quality
  calibrationDate: string;
  samplingHz: number;
  provenance: Provenance;
  description?: string;               // mounting note / provenance detail
}

/* ------------------------------------------------------------
   Telemetry + derived analytics packets
   ------------------------------------------------------------ */
export interface TelemetryPacket {
  vehicleId: string;
  timestamp: string;                // ISO-8601
  sensorId: string;
  componentId: string;
  signal: string;
  value: number;
  unit: string;
  quality: number;
  provenance: Provenance;
}

export interface DerivedAnalytics {
  baselineExpected: number;
  residual: number;
  residualPercent: number;
  persistenceScore: number;         // 0..1 how long deviation persists
  anomalyScore: number;             // 0..1
  state: HealthState;
  confidence: number;               // data + model confidence 0..1
  source: Provenance;
  loadRedistribution: number;       // 0..1 indicator, MODEL_ESTIMATED
}

export interface SensorLive {
  sensor: SensorDef;
  packet: TelemetryPacket;
  analytics: DerivedAnalytics;
  ts: number;                       // epoch ms
  trend: number[];                  // rolling window
}

/* ------------------------------------------------------------
   Fasteners & joints — instanced but individually addressable.
   ------------------------------------------------------------ */
export type FastenerFamily =
  | 'hex_flange_bolt'
  | 'flange_bolt'
  | 'socket_head_bolt'
  | 'stud'
  | 'nut'
  | 'washer'
  | 'rivet'
  | 'self_piercing_rivet'
  | 'spring_clip'
  | 'spot_weld'
  | 'seam_weld_point'
  | 'adhesive_point';

export interface FastenerDef {
  id: string;
  family: FastenerFamily;
  label: string;
  componentA: string;
  componentB: string;
  jointType: string;                // e.g. 'rail-to-crossmember', 'battery mount'
  position: [number, number, number];
  axis: [number, number, number];   // insertion / assembly axis (unit-ish)
  nominalSize?: string;             // 'DEMO M10 × 1.5 mm' style
  torqueSpecNm: number | null;      // null = unverified → UI shows "—"
  preloadN: number | null;
  grade?: string;                   // DEMO only unless verified
  coating?: string;
  status: 'installed' | 'inspected' | 'flagged';
  confidence: Provenance;
  inspectionDate?: string;
}

/* ------------------------------------------------------------
   Timeline / events / forensics
   ------------------------------------------------------------ */
export interface TwinEvent {
  id: string;
  label: string;
  phase: 'before' | 'event' | 'immediately_after' | 'next_journey' | 'current';
  time: number;                     // seconds on the replay timeline
  description: string;
  severity: HealthState;
  sensors: string[];                // affected sensor ids
  delta: Record<string, number>;    // sensorId -> deviation multiplier
  contributors: string[];           // possible contributing systems (hypotheses)
}

/* ------------------------------------------------------------
   Baselines (manufacturing A / commissioning B)
   ------------------------------------------------------------ */
export interface BaselineItem {
  label: string;
  value: string;
  verified: boolean;               // false → shown as DEMO/placeholder
  provenance: Provenance;
}

export interface BaselineRecord {
  id: 'A' | 'B';
  name: string;
  category: 'manufacturing' | 'commissioning';
  timestamp: string;
  items: BaselineItem[];
}

/* ------------------------------------------------------------
   Fleet (synthetic/demo)
   ------------------------------------------------------------ */
export type FleetFilterKey =
  | 'model' | 'variant' | 'modelYear' | 'plant' | 'batch'
  | 'mileageBand' | 'region' | 'component' | 'healthState';

export interface FleetVehicle {
  vin: string;
  model: string;
  variant: string;
  year: number;
  plant: string;
  batch: string;
  mileageKm: number;
  region: string;
  health: HealthState;
  anomalyScore: number;
  componentHealth: Record<string, HealthState>;
}

export interface FleetCorrelation {
  factor: string;
  label: string;
  strength: number;      // 0..1 (correlation ≠ causation — UI must say so)
  note: string;
}

/* ------------------------------------------------------------
   Investigations
   ------------------------------------------------------------ */
export type InvestigationState =
  | 'DETECTED' | 'TRIAGED' | 'INSPECTION' | 'ROOT_CAUSE' | 'ACTION' | 'CLOSED';

export interface InvestigationNote {
  at: string;
  author: string;
  text: string;
}

export interface Investigation {
  id: string;
  title: string;
  vehicleIds: string[];
  linkedEventId?: string;
  state: InvestigationState;
  openedAt: string;
  updatedAt: string;
  owner: string;
  hypothesis: string;
  notes: InvestigationNote[];
}

/* ------------------------------------------------------------
   Analytics / structural intelligence
   ------------------------------------------------------------ */
export interface FingerprintVector {
  sensorId: string;
  baseline: number;
  current: number;
  residual: number;
  weight: number;                  // confidence weight 0..1
}

export interface RegionState {
  componentId: string;
  state: HealthState;
  anomaly: number;                 // 0..1
  residualPct: number;
  persistence: number;
  confidence: number;
  source: Provenance;
}

/* ------------------------------------------------------------
   Engineering Lifecycle & Validation Types
   ------------------------------------------------------------ */
export type LifecycleStage =
  | 'DESIGN'
  | 'CAE'
  | 'BUILD'
  | 'QUALITY'
  | 'COMMISSION'
  | 'VALIDATION'
  | 'ROAD'
  | 'FIELD';

export type DesignRevision = 'REV-A' | 'REV-B' | 'REV-C';

export type CaeLoadCase =
  | 'bending'
  | 'torsion'
  | 'suspension_mount'
  | 'battery_mount'
  | 'wheel_input'
  | 'braking_transfer'
  | 'cornering_lateral'
  | 'pothole_impact'
  | 'kerb_strike'
  | 'underbody_intrusion'
  | 'battery_enclosure'
  | 'modal_excitation';

export type TestRigType =
  | 'four_post'
  | 'torsion'
  | 'bending'
  | 'modal'
  | 'battery_mount';

export type RoadSectorId =
  | 'PG-01'
  | 'PG-02'
  | 'PG-03'
  | 'PG-04'
  | 'PG-05'
  | 'PG-06'
  | 'PG-07'
  | 'PG-08'
  | 'PG-09'
  | 'PG-10';

export interface MetrologyDatumPoint {
  id: string;
  name: string;
  nominal: [number, number, number];
  measured: [number, number, number];
  deviationMm: number;
  toleranceMm: number;
  status: 'ACCEPT' | 'REWORK' | 'REJECT';
  region: string;
}

export type DataSourceClassification =
  | 'MEASURED'
  | 'CALCULATED'
  | 'ESTIMATED'
  | 'REFERENCE'
  | 'DEMO';

/* ------------------------------------------------------------
   Manual Engineering Workbench Types
   ------------------------------------------------------------ */
export type ManualLoadType =
  | 'vertical'
  | 'longitudinal'
  | 'lateral'
  | 'torsional'
  | 'point'
  | 'distributed'
  | 'cyclic';

export type ManualLoadState = 'IDLE' | 'APPLYING' | 'HOLDING' | 'RELEASING';

export type ManualTestPhase = 'BEFORE' | 'DURING' | 'AFTER';

export interface ManualLoadPointDef {
  id: string;
  label: string;
  componentId: string;
  region: string;
  pos: [number, number, number];
  nominalDir: [number, number, number];
  maxForceN: number;
  kStiffnessNPerMm: number;
}

export interface EngineeringTestRun {
  id: string;
  timestamp: string;
  title: string;
  componentId: string;
  loadType: ManualLoadType;
  loadN: number;
  dir: [number, number, number];
  tempC: number;
  strainBefore: number;
  strainPeak: number;
  strainAfter: number;
  calculatedStressMpa: number;
  displacementMm: number;
  residualMicrostrain: number;
  outcome: HealthState;
  engineerDecision: 'CONFIRM' | 'OVERRIDE' | 'RETEST_REQUIRED' | 'INCONCLUSIVE';
  reviewNote?: string;
}

/* ------------------------------------------------------------
   App routing
   ------------------------------------------------------------ */
export type PageKey =
  | 'command'
  | 'workbench'
  | 'digital_eng'
  | 'mfg_quality'
  | 'controlled_val'
  | 'road_corr'
  | 'live_twin'
  | 'eng_analytics'
  | 'passport'
  | 'twin'
  | 'intelligence'
  | 'manufacturing'
  | 'telemetry'
  | 'hardware'
  | 'fleet'
  | 'forensics'
  | 'diagnostics'
  | 'investigations'
  | 'reports'
  | 'settings';

export interface LatchedStructuralEvent {
  id: string;
  timestamp: string;
  hardpointId: string;
  hardpointName: string;
  peakLoadKn: number;
  peakStressMpa: number;
  yieldStressMpa: number;
  severity: 'WARNING' | 'CRITICAL' | 'RECOVERY_WARNING' | 'ML_ANOMALY';
  message: string;
  requiresEngineerNote: boolean;
  reviewedBy?: string;
  reviewNote?: string;
  clearedAt?: string;
}

export interface FeaDataset {
  filename: string;
  solver: 'ANSYS Mechanical v2024.R1' | 'Abaqus/Explicit' | 'NASTRAN';
  meshNodesCount: number;
  meshElementsCount: number;
  peakVonMisesStressMpa: number;
  maxDisplacementMm: number;
  modalFrequenciesHz: number[];
  contourLegendMinMpa: number;
  contourLegendMaxMpa: number;
  importedAt: string;
}

export interface MlPrediction {
  anomalyScore: number;
  confidence: number;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  contributingFactors: string[];
  yieldRiskPct: number;
  fatigueLifeCyclesEst: number;
  timestamp: string;
  modelName: string;
}

export interface PhaseMetrics {
  phase: ManualTestPhase;
  loadKn: number;
  stressMpa: number;
  strainMicro: number;
  dispMm: number;
  timestamp: string;
}

export interface RetestRunConfig {
  eventId: string;
  hardpointId: string;
  loadMode: 'force' | 'torque' | 'pressure' | 'cyclic';
  loadType: ManualLoadType;
  loadVector: [number, number, number];
  targetLoad: number;
  tempC: number;
  step: 1 | 2 | 3 | 4 | 5 | 6;
  rampPct: number;
  status: 'IDLE' | 'RAMPING' | 'COMPLETED' | 'ABORTED';
}

export interface RetestComparison {
  originalEvent: LatchedStructuralEvent;
  originalRun: EngineeringTestRun;
  retestRun: EngineeringTestRun;
  deltaStressMpa: number;
  deltaStrainMicro: number;
  deltaDisplacementMm: number;
  deltaResidualMicro: number;
  recoveryImprovementPct: number;
}

/* ------------------------------------------------------------
   Data-source abstraction — the UI must not care whether data
   comes from the mock generator or physical hardware.
   ------------------------------------------------------------ */
export interface DataSourceAdapter {
  kind: 'mock' | 'mqtt' | 'websocket';
  label: string;
  connect(): void;
  disconnect(): void;
  onPacket(cb: (pkt: TelemetryPacket) => void): void;
  status(): 'idle' | 'connecting' | 'live' | 'error';
}