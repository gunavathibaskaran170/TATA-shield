/* ============================================================
   SHIELD — Exploded View Configuration
   Professional CAD-assembly explosion along constrained axes.
   Chassis stays as fixed reference. Explosion lines optional.
   ============================================================ */

export const EXPLODE_CONFIG = {
  /* Part groups with explosion vectors (metres at 100%) */
  groups: [
    /* --- Body shell (CONCEPT_CONTEXT) --- */
    { key: 'bodyShell',      label: 'Body Shell',      axis: { x: 0, y: 1, z: 0 }, offset: 0.12 },
    { key: 'bodyDoors',      label: 'Doors',           axis: { x: 1, y: 0.2, z: 0 }, offset: 0.15 },
    { key: 'bodyRoof',       label: 'Roof',            axis: { x: 0, y: 1, z: 0 }, offset: 0.10 },
    { key: 'bodyGlass',      label: 'Glass',           axis: { x: 0, y: 1, z: 0 }, offset: 0.10 },
    { key: 'bodyBumpers',    label: 'Bumpers',         axis: { x: 0, y: 0, z: 1 }, offset: 0.12 },

    /* --- Battery --- */
    { key: 'batteryCover',   label: 'Battery Cover',   axis: { x: 0, y: 1, z: 0 }, offset: 0.08 },
    { key: 'batteryModules', label: 'Battery Modules', axis: { x: 0, y: -0.5, z: 0 }, offset: 0.05 },
    { key: 'batteryTray',    label: 'Battery Tray',    axis: { x: 0, y: -0.3, z: 0 }, offset: 0.03 },

    /* --- Powertrain (CONCEPT_CONTEXT) --- */
    { key: 'motor',          label: 'Motor',           axis: { x: 0, y: 0, z: -1 }, offset: 0.10 },
    { key: 'inverter',       label: 'Inverter',        axis: { x: 0, y: 0, z: -1 }, offset: 0.10 },
    { key: 'reduction',      label: 'Reduction Drive', axis: { x: 0, y: 0, z: -1 }, offset: 0.10 },
    { key: 'driveshafts',    label: 'Driveshafts',     axis: { x: 1, y: 0, z: 0 }, offset: 0.12 },

    /* --- Suspension & Wheels --- */
    { key: 'wheels',         label: 'Wheels',          axis: { x: 1, y: 0.3, z: 0 }, offset: 0.15 },
    { key: 'suspension',     label: 'Suspension',      axis: { x: 0.5, y: 0.5, z: 0 }, offset: 0.12 },

    /* --- Chassis (FIXED REFERENCE - no explosion) --- */
    { key: 'chassis',        label: 'Chassis',         axis: { x: 0, y: 0, z: 0 }, offset: 0 },
  ],

  /* Explosion lines: thin dotted lines from parts to home positions */
  showExplosionLines: true,
  lineMaterial: {
    color: 0x38d9cf,
    dashSize: 0.008,
    gapSize: 0.006,
    transparent: true,
    opacity: 0.4,
  },

  /* Slider range */
  min: 0,
  max: 1,
  default: 0,

  /* Easing */
  easing: 'cubicOut', // t => 1 - (1-t)^3
};

/* Mapping from chassis region groups to explode groups */
export const REGION_EXPLODE_MAP = {
  B1: ['chassis'],
  B2: ['chassis'],
  B3: ['chassis'],
  B4: ['chassis'],
  F1: ['chassis'],
  C1: ['chassis', 'batteryCover', 'batteryModules', 'batteryTray'],
  R1: ['chassis'],
  body: ['bodyShell', 'bodyDoors', 'bodyRoof', 'bodyGlass', 'bodyBumpers'],
  powertrain: ['motor', 'inverter', 'reduction', 'driveshafts'],
  battery: ['batteryCover', 'batteryModules', 'batteryTray'],
  suspension: ['suspension'],
  wheels: ['wheels'],
};