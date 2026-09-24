# SHIELD — Assumptions Log

**Created:** 2026-09-24
**Updated:** As implementation progresses
**Source:** Master Prompt §3C + recon findings

---

## A1. Gauge Resistance — **REQUIRES VALIDATION**

**Conflict:** Manufacturing page (from placeholder context / common practice) implies 120 Ω foil gauges; Sensor Lab detail model (`sensorDetail.js`) specifies 350 Ω.

**Assumption:** Default to **350 Ω** (common in precision structural testing, matches Sensor Lab detail which is more engineering-specific). 120 Ω is common in load cells but less so in discrete strain gauges for structural monitoring.

**Used in:**
- `js/config/sensorDetail.js` SG01/02: `gauge.resistance: 350`
- `js/config/sensors.js` all SG01–04: `gauge.resistance: 120` ← **CONFLICT**

**Resolution:** Update `sensors.js` to 350 Ω for consistency with Sensor Lab detail. Add comment `// ASSUMPTION — REQUIRES VALIDATION`.

---

## A2. Material Young's Modulus — **REQUIRES VALIDATION**

**Observation:** 60 µε ↔ 4.2 MPa stress implies E = 4.2e6 / 60e-6 = 70 GPa (aluminium).

**Assumption:** Chassis material is **aluminium alloy (E ≈ 70 GPa, ν ≈ 0.33)**. Store in config.

**Used in:** `js/config/vehicle.js` → new `material` object.

---

## A3. Scale Label — **REQUIRES VALIDATION**

**Conflict:** "1:4 Instrumented Build Model" with 400×200 mm chassis. Real compact EV wheelbase ~2.5 m → 625 mm at 1:4. Current model has 400 mm wheelbase.

**Assumption:** This is a **scaled test frame (400×200 mm)**, not a precise 1:4 vehicle. Label: `"Scaled test frame · 400 × 200 mm"`. Flag the 1:4 claim.

**Used in:** `js/config/vehicle.js` ASSET.scaleLabel

---

## A4. Strain Response Model — **REQUIRES VALIDATION**

**Conflict:** Normal Load 240 N → max 60 µε; EX-014 (147 N) → 78 µε. Inconsistent unless different location/dynamic factor.

**Assumption:** Single calibrated response model per sensor:
```
ε_i = k_i × F_effective + dynamic_term
```
Per-sensor `k_i` in config. `expected_i = k_i × F_nominal`. Drive all displays from this model.

**Used in:** New `thresholdConfig`, `sensorConfig` response coefficients.

---

## A5. SG02 Fault Semantics

**Observation:** SG02 is `OFFLINE` in `sensors.js` (signalQuality: 0, health: OFFLINE, current: null). In Normal scenario it should be healthy — fault only appears in FAULT scenario or real telemetry.

**Assumption:** Baseline config = all sensors HEALTHY. Scenario overrides only for FAULT scenario. SG02 OFFLINE is a **demo seed condition**, not baseline.

**Resolution:** In `sensors.js`, set SG02 health: 'HEALTHY', signalQuality: 95, live() returns valid data. FAULT scenario overrides to OFFLINE.

---

## A6. Edge Node Connection State

**Observation:** Header shows "Edge Node · Connected" (green pulse) while data is SIMULATED.

**Assumption:** Two independent chips in header:
- **MODE chip:** `SIMULATION` | `LIVE HARDWARE`
- **LINK chip:** SIMULATION → `SIMULATED EDGE` (grey); LIVE → `CONNECTING/CONNECTED/RECONNECTING/DISCONNECTED/ERROR`

Never show green "Connected" for simulated data.

---

## A7. Strain Gauge Physical Form

**Observation:** Sensor Lab draws strain gauge as "bolted 50×35×20 mm IP67 aluminium box with M12 connector". Real foil strain gauge = mm-scale foil with solder pads + lead wires; bridge electronics in separate module.

**Assumption:** Sensor Lab detail model is a **conceptual prototype enclosure** (the *housing* for the gauge + conditioning). In Hardware Twin inspector, show **correct schematic**: bonded foil gauge + lead wires → HX711 bridge/conditioning → ESP32.

**Resolution:** Keep Sensor Lab as-is (prototype housing). In Hardware Twin / Command Center inspector, show schematic diagram.

---

## A8. Stress = E × ε (Uniaxial)

**Assumption:** Stress shown is **uniaxial estimate** σ = E·ε (not von Mises). State this in tooltip. E from material config.

---

## A9. Sensor Fault ≠ Structural Fault

**Assumption:** A FAULT sensor makes its region `NOT_ASSESSED`, never a structural alarm. Zone is not flagged as failed.

---

## A10. Zone-Based Estimates (Not FEA)

**Assumption:** Strain/stress/displacement heat visualisations are **zone-based estimates from 4 strain gauges**, not full-field FEA. Label: `ZONE-BASED · INDICATIVE`. Only show "FEA" overlay if real precomputed FEA file loaded → label `SIMULATION (FEA)`.

---

## A11. Raw vs Derived Separation

**Assumption:** Raw measurements (`SensorReading`) never mixed with derived metrics (`DerivedMetrics`). Separate types, separate UI sections.

---

## A12. No Predicted Risk Without Trained Model

**Assumption:** "Predicted risk %" only if trained model exists AND trained on temporal/degradation data. Otherwise show "Deviation from baseline". ML slot defined but empty.

---

## A13. Seeded History = Demo Data

**Assumption:** Baseline 2026-09-12, EX-014, re-torque, re-baseline, SG02 offline alert are **seed data**. Tag `SEED · DEMO DATA` in UI.

---

## A14. Sampling Rates

**Assumption:** HX711 native 10/80 SPS. Strain raw ≤10 Hz to browser, features at 1 Hz. Ring buffer capacity = 5 min × max rate.

---

## A15. No OEM CAD

**Assumption:** No part described as OEM CAD. Provenance tags: `PHYSICAL_PROTOTYPE` (built/instrumented) or `CONCEPT_CONTEXT` (illustrative). Concept parts show `CONCEPT` badge.

---

## A16. Offline-First — No Runtime CDN

**Assumption:** All fonts, HDRI, models, icons bundled locally. Importmap points to local `vendor/`. Server serves static files only.

---

## A17. Legacy Routes

**Assumption:** Old pages moved to `/legacy/*` (or hidden from nav), kept intact. New Command Center at `/`.

---

*Each assumption marked `// ASSUMPTION — REQUIRES VALIDATION` in code where applied.*