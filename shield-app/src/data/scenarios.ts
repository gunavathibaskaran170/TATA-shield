/* ============================================================
   SHIELD — timeline events, baselines, fleet (synthetic demo)
   and investigations. Nothing here claims to be real Tata fleet
   data — the UI labels these as DEMO/SIMULATED.
   ============================================================ */

import type { TwinEvent, BaselineRecord, FleetVehicle, FleetCorrelation, Investigation, InvestigationState } from '../schema/types';

/* ---------------- Replay timeline ---------------- */
export const TIMELINE_DURATION = 30; // seconds

export const TIMELINE_PHASES = [
  { key: 'before', at: 0, label: 'Before event' },
  { key: 'event', at: 8, label: 'Event' },
  { key: 'immediately_after', at: 12, label: 'Immediately after' },
  { key: 'next_journey', at: 16, label: 'Next journey' },
  { key: 'current', at: 24, label: 'Current' },
] as const;

export const EVENTS: TwinEvent[] = [
  {
    id: 'EV-01', label: 'Baseline cruise (reference)',
    phase: 'before', time: 2, severity: 'NORMAL',
    description: 'Normal highway cruise run used as pre-event reference. Sensor values sit on their commissioning baselines.',
    sensors: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'IMU01', 'IMU02', 'IMU03'],
    delta: {}, contributors: [],
  },
  {
    id: 'EV-02', label: 'Pothole strike — front axis',
    phase: 'event', time: 8, severity: 'WATCH',
    description: 'High vertical impulse at the front axle. S01/S02 exceed single-window threshold; IMU01 shows elevated RMS. Persistence still low.',
    sensors: ['S01', 'S02', 'IMU01', 'IMU03'],
    delta: { S01: 1.55, S02: 1.32, IMU01: 2.4, IMU03: 1.15 },
    contributors: ['Road input', 'Front suspension', 'Front rail load path'],
  },
  {
    id: 'EV-03', label: 'Immediately after event',
    phase: 'immediately_after', time: 13, severity: 'WATCH',
    description: 'Residuals decay but S01 retains elevated persistence. Structural response returns toward expected within tolerance.',
    sensors: ['S01', 'S02', 'IMU01'],
    delta: { S01: 1.22, S02: 1.06, IMU01: 1.2 },
    contributors: ['Transient settling'],
  },
  {
    id: 'EV-04', label: 'Next journey — rear overload event',
    phase: 'next_journey', time: 18, severity: 'INSPECTION_REQUIRED',
    description: 'Loaded journey with repeated rear-cycle loading. S05/S06 drift persistently; TEMP02 rises. Persistence score climbs → rear region flagged for inspection.',
    sensors: ['S05', 'S06', 'TEMP02', 'IMU03'],
    delta: { S05: 1.6, S06: 1.45, TEMP02: +4.5, IMU03: 1.7 },
    contributors: ['Rear load path', 'Battery mount RL/RR', 'Rear cross-member', 'Payload'],
  },
  {
    id: 'EV-05', label: 'Current state',
    phase: 'current', time: 26, severity: 'NORMAL',
    description: 'Back to cruising state. S05/S06 remain above baseline but below action threshold; rear region stays WATCH with scheduled inspection.',
    sensors: ['S05', 'S06', 'TEMP02'],
    delta: { S05: 1.28, S06: 1.2, TEMP02: +2.1 },
    contributors: [],
  },
];

export function phaseAt(t: number): string {
  for (let i = TIMELINE_PHASES.length - 1; i >= 0; i--) {
    if (t >= TIMELINE_PHASES[i].at) return TIMELINE_PHASES[i].key;
  }
  return 'before';
}

/** The active incident event for a given time (largest severity at or before t). */
export function activeEventAt(t: number): TwinEvent | null {
  let found: TwinEvent | null = null;
  for (const e of EVENTS) {
    if (e.time <= t) found = e;
  }
  return found;
}

/* ---------------- Baselines ---------------- */
export const BASELINES: BaselineRecord[] = [
  {
    id: 'A',
    name: 'Baseline A — Manufacturing Quality',
    category: 'manufacturing',
    timestamp: '2026-04-22T09:00:00Z',
    items: [
      { label: 'Body alignment — datum check', value: 'Within DEMO tolerance envelope', verified: false, provenance: 'DEMO' },
      { label: 'Weld inspection — audit zone', value: 'Representative spot-weld audit passed (DEMO)', verified: false, provenance: 'DEMO' },
      { label: 'Assembly gap / tolerance survey', value: '4.5 mm mean gap target (DEMO)', verified: false, provenance: 'DEMO' },
      { label: 'Fastener verification', value: 'Critical joint torque sampled (DEMO)', verified: false, provenance: 'DEMO' },
      { label: 'Leak / sealing test', value: 'Passed (DEMO)', verified: false, provenance: 'DEMO' },
    ],
  },
  {
    id: 'B',
    name: 'Baseline B — Structural Commissioning',
    category: 'commissioning',
    timestamp: '2026-05-15T14:30:00Z',
    items: [
      { label: 'Reference strain — S01', value: '452 με at reference load (DEMO)', verified: false, provenance: 'SIMULATED' },
      { label: 'Reference strain — S05', value: '205 με at reference load (DEMO)', verified: false, provenance: 'SIMULATED' },
      { label: 'Reference vibration — IMU RMS', value: '0.42 / 0.31 / 0.35 m/s² (DEMO)', verified: false, provenance: 'SIMULATED' },
      { label: 'Temperature reference', value: '31.4 °C pack · 29.8 °C rear XM (DEMO)', verified: false, provenance: 'SIMULATED' },
      { label: 'Calibration', value: 'All sensors calibrated (DEMO)', verified: false, provenance: 'SIMULATED' },
      { label: 'Known excitation / load fingerprint', value: 'Reference drive cycle recorded', verified: false, provenance: 'SIMULATED' },
    ],
  },
];

/* ---------------- Fleet (synthetic demo) ---------------- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FLEET_VEHICLES: FleetVehicle[] = (() => {
  const rand = mulberry32(20260601);
  const models = ['Twin (compact SUV)', 'TwinPlus (compact SUV)'];
  const plants = ['Plant-Pune-1', 'Plant-Sanand-2'];
  const regions = ['West-IN', 'South-IN', 'North-IN', 'East-IN', 'Export-APAC'];
  const out: FleetVehicle[] = [];
  const critical = ['FrontLongitudinal_L', 'FrontLongitudinal_R', 'CrossMember_Front', 'CrossMember_Rear', 'Mount_BFL', 'Mount_BRR', 'Rocker_L', 'Rocker_R'];
  for (let i = 0; i < 36; i++) {
    const mileageKm = Math.round(2000 + rand() * 72000);
    const model = models[Math.floor(rand() * models.length)];
    const year = 2024 + Math.floor(rand() * 3);
    const plant = plants[Math.floor(rand() * plants.length)];
    const batch = 'B' + (Math.floor(rand() * 4) + 1);
    const region = regions[Math.floor(rand() * regions.length)];
    // define a deterministic base "anomaly tendency"
    const tend = rand();
    const comp: Record<string, 'NORMAL' | 'WATCH' | 'INSPECTION_REQUIRED'> = {};
    let worst: 'NORMAL' | 'WATCH' | 'INSPECTION_REQUIRED' = 'NORMAL';
    for (const cid of critical) {
      let s: 'NORMAL' | 'WATCH' | 'INSPECTION_REQUIRED' = 'NORMAL';
      const r = rand();
      if (tend > 0.82 && r > 0.78 && mileageKm > 40000 && batch === 'B2') s = 'INSPECTION_REQUIRED';
      else if ((tend > 0.65 && r > 0.72) || (mileageKm > 55000 && r > 0.8)) s = 'WATCH';
      comp[cid] = s;
      if (s === 'INSPECTION_REQUIRED') worst = 'INSPECTION_REQUIRED';
      else if (s === 'WATCH' && worst === 'NORMAL') worst = 'WATCH';
    }
    out.push({
      vin: `SHIELD-DEMO-${String(1000 + i)}`,
      model, variant: model === 'Twin' ? (rand() > 0.5 ? 'XZ' : 'XM') : 'XT',
      year, plant, batch, mileageKm, region,
      health: worst,
      anomalyScore: Math.min(0.98, Math.round((tend * 0.55 + (worst !== 'NORMAL' ? 0.3 : 0)) * 100) / 100),
      componentHealth: comp,
    });
  }
  return out;
})();

export const FLEET_CORRELATIONS: FleetCorrelation[] = [
  {
    factor: 'batch B2 × mileage > 40k km × rear strain',
    label: 'Rear battery-mount residual clusters in batch B2 high-mileage units',
    strength: 0.71,
    note: 'Fleet-level correlation detected — engineering investigation recommended. Correlation alone does not establish a manufacturing defect.',
  },
  {
    factor: 'South-IN region × front-left rail',
    label: 'Front-left rail WATCH rate elevated in South-IN samples',
    strength: 0.44,
    note: 'Weak association; route/payload mix differs across regions. Not treated as causal.',
  },
];

export const MILEAGE_BANDS = ['0-10k', '10-25k', '25-40k', '40-60k', '60k+'];

export function mileageBandOf(km: number): string {
  if (km < 10000) return '0-10k';
  if (km < 25000) return '10-25k';
  if (km < 40000) return '25-40k';
  if (km < 60000) return '40-60k';
  return '60k+';
}

/* ---------------- Investigations ---------------- */
export const INVESTIGATIONS: Investigation[] = [
  {
    id: 'INV-2026-014', title: 'Rear battery-mount residual drift — EV-DEMO-0287',
    vehicleIds: ['EV-DEMO-0287'], linkedEventId: 'EV-04',
    state: 'TRIAGED', openedAt: '2026-06-03T10:12:00Z', updatedAt: '2026-06-05T08:40:00Z',
    owner: 'S. Rao (Body Structures)',
    hypothesis: 'Persistent S05/S06 residual suggests rear mount pre-load loss or interface settlement, not a body crack.',
    notes: [
      { at: '2026-06-03T10:12:00Z', author: 'SHIELD (auto)', text: 'Case created from EV-04 sensor evidence. Persistence 0.74, residual +6.9%.' },
      { at: '2026-06-04T14:20:00Z', author: 'S. Rao', text: 'Triaged to INSPECTION after reviewing mount joint BOLT-BAT-RL-02 flagged status.' },
    ],
  },
  {
    id: 'INV-2026-009', title: 'Front rail transient spike after pothole event',
    vehicleIds: ['EV-DEMO-0287'], linkedEventId: 'EV-02',
    state: 'CLOSED', openedAt: '2026-05-20T09:00:00Z', updatedAt: '2026-05-28T16:00:00Z',
    owner: 'A. Kumar (Chassis)',
    hypothesis: 'Single-window threshold exceedance from road impulse; no persistent residual after settling. No structural action required.',
    notes: [
      { at: '2026-05-28T16:00:00Z', author: 'A. Kumar', text: 'Closed after inspection: front rail integrity confirmed, no anomaly propagation.' },
    ],
  },
  {
    id: 'INV-2026-021', title: 'Fleet correlation: batch B2 rear strain cluster',
    vehicleIds: [...Array(5)].map((_, i) => `SHIELD-DEMO-${1000 + i * 3}`), linkedEventId: 'EV-04',
    state: 'DETECTED', openedAt: '2026-06-08T11:30:00Z', updatedAt: '2026-06-08T11:30:00Z',
    owner: 'Fleet Analytics (auto)',
    hypothesis: 'Correlation flagged across 5 batch-B2 units. Root cause unconfirmed — engineering inspection of one high-mileage unit recommended.',
    notes: [
      { at: '2026-06-08T11:30:00Z', author: 'SHIELD (auto)', text: 'Fleet-level correlation detected — engineering investigation recommended (not a defect claim).' },
    ],
  },
];

export const INVESTIGATION_STATES: InvestigationState[] = ['DETECTED', 'TRIAGED', 'INSPECTION', 'ROOT_CAUSE', 'ACTION', 'CLOSED'];