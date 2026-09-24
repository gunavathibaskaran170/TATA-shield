/* ============================================================
   SHIELD — Hardware Twin — Instrumentation Configuration (Legacy Wrapper)
   
   This file now re-exports from the unified sensorConfig.js
   to maintain backward compatibility with existing pages.
   New code should import directly from '../config/sensorConfig.js' or '../config/index.js'.
   
   Fixes applied from §3C:
   - Sensor count derived from single source
   - SG02 baseline HEALTHY (fault only in FAULT scenario)
   - Gauge resistance unified to 350 Ω
   - Strain response coefficients for consistent ε = k·F model
   ============================================================ */

import {
  SENSORS,
  sensorById,
  INSTALL_SUMMARY,
  HEALTH_COLOR,
  HEALTH_CLASS,
  LAYERS,
  EDGE_NODE,
  SCENARIO_STRAIN_OVERRIDES,
} from './sensorConfig.js';
import { REGIONS, ZONES, regionById, ANCHOR } from './assetConfig.js';

// Re-export everything from the new unified config
export {
  SENSORS,
  sensorById,
  INSTALL_SUMMARY,
  HEALTH_COLOR,
  HEALTH_CLASS,
  LAYERS,
  EDGE_NODE,
  SCENARIO_STRAIN_OVERRIDES,
  REGIONS,
  ZONES,
  regionById,
  ANCHOR,
};

// Legacy function name (was in sensors.js)
export function sensorByIdLegacy(id) {
  return sensorById(id);
}

// Note: The old SENSORS array with inline live() functions has been moved to sensorConfig.js.
// This wrapper maintains the exact same exports so existing pages (twin.js, hardwareTwin.js, etc.)
// continue to work without modification.
