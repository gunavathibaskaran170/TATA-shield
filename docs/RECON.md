# SHIELD — Reconnaissance Report (P0)

**Date:** 2026-09-24
**Branch:** `feat/command-center`
**Baseline commit:** `HEAD` (before any implementation)

---

## 1. Repository Overview

**Project:** SHIELD — Structural Health Intelligence and Lifecycle Evaluation for EVs
**Asset:** EV-CH-007 (instrumented scaled EV chassis prototype)
**Stack:** Vanilla Three.js (r160) via importmap, zero-build, ES modules
**Server:** Minimal Node.js static file server (`server.js`, port 8123)
**Architecture:** Multi-page SPA with simple router in `js/app.js`

---

## 2. Current Pages (9 total)

| Page | Route | File | Purpose |
|------|-------|------|---------|
| Twin | `twin` | `js/pages/twin.js` | Structural Digital Twin — 7 views, 7 scenarios, KPI strip, timeline |
| Hardware Twin | `hardware` | `js/pages/hardwareTwin.js` | Instrumentation architecture — sensor rig, signal paths, filters |
| Anatomy | `anatomy` | `js/pages/anatomy.js` | Engineering poster — hero 3/4, exploded layers, ortho views |
| Sensor Lab | `sensors` | `js/pages/sensorLab.js` | Sensor detail viewer — SG01/02, IMU01/02, exploded, internal, chassis context |
| Manufacturing | `manufacturing` | `js/pages/placeholders.js` | Placeholder |
| Experiments | `experiments` | `js/pages/placeholders.js` | Placeholder |
| Analytics | `analytics` | `js/pages/placeholders.js` | Placeholder |
| Passport | `passport` | `js/pages/placeholders.js` | Placeholder |
| Alerts | `alerts` | `js/pages/placeholders.js` | Placeholder |

**Navigation:** Left rail (208px), header bar (50px), content area.

---

## 3. Core Three.js Modules (Shared)

| Module | Responsibility |
|--------|----------------|
| `js/core/scene.js` | Renderer, camera, OrbitControls, environment map, study lights, camera tweening (`flyTo`) |
| `js/core/chassis.js` | Procedural EV-CH-007 monocoque chassis (floor, rails, cross-members, battery, suspension, wheels) |
| `js/core/sensorMeshes.js` | Hardware Twin sensor primitives (strain, IMU, load, temp, disp, edge node) |
| `js/core/signalPaths.js` | Animated signal/digital mapping lines with pulse sprites |
| `js/core/labels.js` | Canvas sprite labels (always face camera) |
| `js/core/wheelAssembly.js` | Detailed wheel corner (tyre, rim, disc, caliper, hub, wishbones, coil-over) |
| `js/core/multiView.js` | Offscreen renderer for Anatomy poster panels |
| `js/core/detail/shared.js` | Sensor Lab detail part primitives + materials |
| `js/core/detail/sg01.js` | `buildStrainGauge(cfg)` — SG01/SG02 family builder |
| `js/core/detail/imu01.js` | `buildIMU(cfg)` — IMU01/IMU02 family builder |

---

## 4. Configuration (Single Source of Truth — Partial)

| File | Content |
|------|---------|
| `js/config/vehicle.js` | Chassis dimensions, regions (B1–B4, F1, C1, R1), zones, geometry anchors (ANCHOR) |
| `js/config/sensors.js` | **9 sensors** (SG01–04, IMU01–02, LC01, TEMP01, DISP01) with positions, orientations, live telemetry functions, health, calibration, signal chain |
| `js/config/sensorDetail.js` | Sensor Lab detail models (SG01, SG02, IMU01, IMU02) — parts trees, specs, telemetry, explode offsets |

---

## 5. Simulation Engine

**Location:** Embedded in `js/config/sensors.js` — each sensor has a `live()` function returning simulated readings with sinusoidal variation.
- Strain gauges: µε with baseline/expected/residual
- IMUs: RMS, peak, dominant frequency (g, Hz)
- Load cell: Force (N) + mass equivalent (kg)
- Temperature: °C with drift
- Displacement: mm with reference/diff

**Scenarios (7):** Defined in `js/pages/twin.js` — NORMAL, HIGH, UNEVEN, VIBRATION, SHOCK, CHANGE, FAULT. Each has per-region strain/stress/displacement, vibration, temperature, decision text, timeline events.

**Timeline:** 40s replay (baseline → load → response → evaluation) with scrubber.

---

## 6. QA / Test Infrastructure

| Script | Purpose |
|--------|---------|
| `verify.js` | Hardware Twin behavioural assertions (48 checks) |
| `probe-anatomy.js` | Anatomy poster geometry, callouts, layers, dimensions |
| `probe-sensorLab.js` | Sensor Lab models, parts, explode, internal, anatomy, strain/axes demos, chassis |
| `probe-chassis.js` | Chassis geometry, region groups, wheel positions |
| `render.js` | Headless screenshot capture (73 shots) via Puppeteer |

**Baseline results (all green):**
- `verify.js`: 48/48 ✓
- `probe-anatomy.js`: all checks ✓, 0 errors
- `probe-sensorLab.js`: 68/68 ✓
- `probe-chassis.js`: 20/20 ✓
- `render.js`: 73 shots, 0 browser errors

---

## 7. Data-Consistency Defects (from Master Prompt §3C)

| # | Defect | Location | Status |
|---|--------|----------|--------|
| 1 | Sensor count mismatch: header 7/8 vs 9 channels | `sensors.js` INSTALL_SUMMARY | Open |
| 2 | Permanent SG02 fault in Normal scenario | `twin.js` SCENARIOS.NORMAL | Open |
| 3 | "Edge Node: Connected" (green) while simulated | `app.js` header chip | Open |
| 4 | Gauge resistance: 120Ω (Manufacturing) vs 350Ω (Sensor Lab) | `sensors.js` vs `sensorDetail.js` | Open |
| 5 | Sensor Lab strain gauge drawn as bolted box, not foil | `sg01.js` / `sensorDetail.js` | Open |
| 6 | Load vs strain inconsistency (240N→60µε vs 147N→78µε) | `twin.js` vs `sensorDetail.js` | Open |
| 7 | "1:4" scale claim implausible for 400×200mm | `vehicle.js` ASSET.scaleLabel | Open |
| 8 | Stress/strain: 60µε↔4.2MPa ⇒ E≈70GPa hardcoded | `twin.js` stress calc | Open |
| 9 | Seeded history not tagged as demo data | `twin.js` scenarios | Open |

---

## 8. Reusable Assets for Command Center

**Will keep intact (per Removal Policy):**
- All 9 existing pages under `/legacy/*` routes
- All core Three.js modules
- All config files (extend, don't replace)
- Simulation engine (wrap with TelemetryProvider adapter)

**Key reusable 3D assets:**
- Procedural EV-CH-007 chassis (`chassis.js`) — monocoque, battery, suspension, wheels
- Sensor rig builder (`sensorMeshes.js`) — 9 sensor types
- Signal paths (`signalPaths.js`) — animated lines + pulses
- Wheel assembly (`wheelAssembly.js`) — detailed corner
- Sensor Lab detail builders (`sg01.js`, `imu01.js`) — family-driven, GLB-ready

---

## 9. Risks / Blockers

| Risk | Mitigation |
|------|------------|
| Zero-build vanilla JS vs. React/@r3f recommendation | Stay with vanilla Three.js + modular pattern; use CSS variables for theming; no build step needed |
| No existing WebSocket/backend for live telemetry | Implement minimal `server/gateway.js` in P11; mock ESP32 for E2E |
| No GLB assets — procedural only | Procedural is high-quality; GLB drop-in supported via `sensorDetail.js` manifest |
| Large CSS file (3000+ lines) | Keep; extend with design tokens for Studio Light theme |

---

## 10. Baseline Commit

```
git commit -am "P0: recon baseline — all QA green, 73 renders clean"
```