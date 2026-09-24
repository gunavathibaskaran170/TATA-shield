/* ============================================================
   SHIELD — Unified Config Export
   Single entry point for all configuration modules.
   ============================================================ */

export * from './assetConfig.js';
export * from './sensorConfig.js';
export * from './thresholdConfig.js';
export * from './loadCases.js';
export * from './layerPresets.js';
export * from './viewPresets.js';
export * from './tourStops.js';
export * from './explodeConfig.js';

// Re-export commonly used utilities
export { regionById, sensorById } from './assetConfig.js';
export { sensorById as sensorById2 } from './sensorConfig.js';