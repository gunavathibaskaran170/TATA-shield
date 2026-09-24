/* ============================================================
   SHIELD — Decision Thresholds Configuration
   All verdict thresholds in one place with rationale comments.
   ============================================================ */

export const THRESHOLDS = {
  /* --- Per-sensor residual thresholds (µε for strain) ---
     Status progression: NORMAL → WATCH → INSPECTION_REQUIRED → FAULT
     Persistence: requires N consecutive windows (avoid single-sample alarms) */
  strain: {
    watch: 5,           // µε residual > 5 → WATCH
    inspection: 12,     // µε residual > 12 → INSPECTION_REQUIRED
    faultQuality: 0.5,  // quality < 0.5 → FAULT (sensor issue, not structural)
    persistenceWindows: 3, // consecutive windows before escalating
  },

  /* --- IMU vibration thresholds (g RMS) --- */
  imu: {
    watchRms: 0.35,     // g RMS > 0.35 → WATCH
    inspectionRms: 0.6, // g RMS > 0.6 → INSPECTION_REQUIRED
    freqShiftWatch: 0.05,   // 5% dominant frequency shift → WATCH
    freqShiftInspect: 0.10, // 10% shift → INSPECTION_REQUIRED
    persistenceWindows: 3,
  },

  /* --- Load cell thresholds (N) --- */
  load: {
    watch: 300,         // N > 300 → WATCH
    inspection: 400,    // N > 400 → INSPECTION_REQUIRED
  },

  /* --- Displacement thresholds (mm) --- */
  disp: {
    watch: 0.5,         // mm > 0.5 → WATCH
    inspection: 1.0,    // mm > 1.0 → INSPECTION_REQUIRED
  },

  /* --- Asymmetry thresholds (left/right) --- */
  asymmetry: {
    watch: 0.15,        // 15% L/R difference → WATCH
    inspection: 0.30,   // 30% → INSPECTION_REQUIRED
  },

  /* --- Front/Rear vibration transmission ratio --- */
  transmission: {
    watch: 0.8,         // Rear/Front > 0.8 → WATCH (rear amplifying)
    inspection: 1.2,    // Rear/Front > 1.2 → INSPECTION_REQUIRED
  },

  /* --- Quality gate ---
     Below this quality, sensor status = FAULT, region = NOT_ASSESSED */
  qualityGate: 0.5,

  /* --- Verdict aggregation rules ---
     Region state from its sensors; verdict from region states:
     - All regions NORMAL → PASS
     - Any region WATCH → WARNING
     - Any region INSPECTION or strong asymmetry/freq shift → INSPECTION_REQUIRED
     - Persistent INSPECTION in load-bearing mount zone (B1–B4) with
       corroboration from 2nd sensor → REWORK_REQUIRED
     - Insufficient healthy sensors → NOT_ASSESSED */
  verdict: {
    loadBearingZones: ['B1', 'B2', 'B3', 'B4'],
    corroborationRequired: true,
    minHealthyForAssess: 5, // minimum healthy sensors to issue verdict
  },
};

/* Rationale comments for each threshold (for docs/engineering review) */
export const THRESHOLD_RATIONALE = {
  strain: {
    watch: '5 µε ≈ 10% of typical expected range; early deviation flag',
    inspection: '12 µε ≈ 25% of expected; exceeds normal manufacturing variance',
    faultQuality: 'Below 50% signal quality, readings unreliable — sensor fault, not structural',
  },
  imu: {
    watchRms: '0.35 g RMS ≈ 2× normal operating vibration',
    inspectionRms: '0.6 g RMS ≈ 3.5× normal; potential resonance or loose mount',
    freqShiftWatch: '5% frequency shift at constant mass suggests stiffness change',
    freqShiftInspect: '10% shift sustained → structural stiffness loss likely',
  },
  asymmetry: {
    watch: '15% L/R difference detectable above noise floor',
    inspection: '30% asymmetry indicates significant load path imbalance',
  },
  transmission: {
    watch: 'Rear/Front > 0.8 means rear transmission approaching front',
    inspection: 'Rear/Front > 1.2 means rear amplifying — unusual, inspect mounts',
  },
};