# SHIELD — Vehicle Structural Intelligence Command Center

**Tata EV engineering use-case prototype / Tata-inspired EV digital twin.**

An interactive, layer-based digital twin of a compact electric SUV. Built with
React 18 + TypeScript + Three.js (react-three-fiber) + Zustand + Recharts.

> ⚠️ **Truthfulness contract** — the vehicle geometry is a **procedural
> surrogate**, not OEM Tata CAD/BOM. Every value in the app carries a
> provenance tag (`MEASURED` / `DERIVED` / `MODEL_ESTIMATED` / `SIMULATED` /
> `DEMO` / `VERIFIED`). Fastener torques are **null by design** and the UI
> renders `—` — a torque number only appears once a verified BOM supplies it.
> Fleet features report correlations, never defect claims.

---

## Geometry provenance

The chassis, running gear, battery, drive unit and instrumentation are built to
the **supplied parametric assembly definition** `EV_Chassis_SHIELD_Assembly`
(a FreeCAD macro plus the equivalent OpenSCAD model, authored by "P. Engineer",
project `EV SUV PLATFORM DRV-SK-001`). Figures are converted from millimetres
in `src/schema/dims.ts`, which holds the full `CAD` block:

| Item | Supplied value |
| --- | --- |
| Wheelbase | 2850 mm |
| Chassis / rail span | 1700 mm |
| Rail overhangs | 350 mm front, 400 mm rear |
| Rails | 90 × 140 mm, 4 mm wall (hydroformed hollow) |
| Crossmembers | 70 × 120 mm, subframes ±300 mm from each axle |
| Battery enclosure | 2000 × 1250 × 140 mm, 6 mm wall, 15 mm cooling plate, **8** module channels |
| Wheels | R380 × W245, hub R90 × 60, disc R320 dia × 12 |
| Strut towers | 350 mm tall, R28 envelope |
| Coil springs | R65, wire R9, 6 turns |
| Front drive | PMSM R150 × L360, gearbox R170 × L220, inverter 220 × 180 × 140, half-shafts R22 |
| Instrumentation | IMU 30 × 22 × 12, strain enclosure 40 × 26 × 16 (tab 18 × 10 × 3), harness R6 |
| SHIELD enclosure | 300 × 200 × 120 mm, 35 mm lid, 4 mm wall, 800 mm standoff, OLED 34 × 18, buzzer R8, bulkhead R12 × 22 |

Two things are **not** from that definition and are labelled accordingly:

- **Ride height (160 mm) is `DERIVED`.** The supplied model places its rails on
  its own `z = 0` datum with no ground clearance, so a ride height has to be
  assumed to put the chassis above the road.
- **The outer body envelope is a `DEMO` surrogate** sized to enclose the
  specified chassis. It is generated as a lofted surface (see below), not
  imported OEM surface data.

That supplied definition is itself described by its author as a *layout /
packaging* model, explicitly **not validated for fabrication, structural or
crash-worthiness**. It is not a Tata BOM and no OEM claim is made.

### Body shell

`src/three/bodyShell.ts` builds the outer envelope as a **lofted surface**: a
series of rounded cross-sections along the longitudinal axis, spline-smoothed
and lofted into a `BufferGeometry`. This gives one continuous, watertight skin
that reads correctly from every angle (front, rear, side, three-quarter, top,
bottom) — which is what a 360° twin needs — rather than a stack of primitives.
The wheel arches are *baked into the loft* by lifting each section's lower edge
over the axle, so openings and fender crowns are part of the same surface with
no boolean cuts and no seams.

The skin is split into selectable components (bumper, bonnet, wings, screen,
doors, glass, roof, tailgate) by chopping the same loft on station and
cross-section bands, so component-level selection still works and adjacent
pieces share their boundary rows exactly — no gaps.

`node tools/check-shell.js` validates the loft offline (vertex/index counts,
NaN check, bounding box, per-zone coverage) without a browser.

### Exploded-isometric CAD cutaway

The **CAD cutaway** toggle in the Vehicle Twin toolbar switches to the
presentation convention of the supplied exploded-assembly definition
(`EV_SUV_Exploded_Assembly`, `EXPLODE_FACTOR = 1`):

| Sub-assembly | Explode vector |
| --- | --- |
| Body shell + cabin | up 1.30 m |
| Battery pack | down 0.45 m |
| Front e-drive | forward 0.50 m |
| Rear e-drive | aft 0.50 m |
| Cooling module | forward 0.90 m |
| Wheels / tyres / discs | outboard 0.26 m per side |
| Chassis instrumentation | up 0.22 m |
| SHIELD controller box | outboard 0.70 m |

On top of that it renders a light-gray studio field with a soft shadow
catcher, green-painted structural rails, blue/red pack busbars, thin
dimension leader-lines running out to the six uppercase callouts
(FRONT E-MOTOR, REAR E-DRIVE MODULE, 100 kWh BATTERY PACK, CHASSIS RAILS,
MULTI-LINK SUSPENSION, COOLING MODULE), a title block, an axis gizmo and the
footer disclaimer. Component selection, layer control and the rest of the
interaction contract keep working while exploded — the offsets are applied by
wrapping the same `Sel` groups, not by duplicating geometry.

### Camera

- **360° orbit is fully live.** The rig hands the camera back to
  `OrbitControls` as soon as a scripted move finishes *and* immediately on
  pointer-down, so dragging is never fought by an animation still asserting
  its goal.
- **Fit to full screen** (`⤢`) measures the live scene bounds and solves the
  distance that fills the viewport, with extra margin in CAD mode so the title
  block, gizmo and callouts never fall off-frame.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc --noEmit && vite build → dist/
npm run preview      # serve the production build
node tools/check-shell.js   # offline body-shell geometry check
```

QA helpers live at the repo root: `qa-shield-app.js` (12-page smoke test),
`qa-shield-360.js` (camera-preset capture) and `qa-shield-interact.js`
(orbit / fit / CAD-mode interaction test).

No network assets are used: the 3D environment is procedural (drei
`Lightformer` children), fonts are system UI/monospace, and telemetry comes
from an in-app mock generator.

---

## Workspaces (12)

| Page key | Workspace | Highlights |
| --- | --- | --- |
| `command` | Command Center | Live status, system health bars, alert feed, navigation |
| `twin` | Vehicle Twin | Full 3D interaction contract, layer manager, inspector, battery modes, timeline replay |
| `intelligence` | Structural Intelligence | Region states, model-estimated heatmaps, sensor → structure map |
| `manufacturing` | Manufacturing Digital Thread | Build stations, quality gates, joint verification status, component thread |
| `telemetry` | Live Telemetry | Recharts signal/anomaly charts, derived analytics, swappable source |
| `fleet` | Fleet Analytics | Synthetic 36-unit fleet, filters, mileage-band & scatter charts, correlations |
| `forensics` | Event Forensics | 30 s replay timeline, event deltas, live response window |
| `diagnostics` | AI Diagnostics | Explainable rule-based findings + decision trace |
| `investigations` | Investigations | Case list, state pipeline, evidence trail, notes |
| `passport` | Structural Passport | Baselines A/B, provenance ledger, sensor calibration, JSON export |
| `reports` | Reports | JSON / CSV / Markdown engineering summaries |
| `settings` | Settings & Data Sources | Data-source adapter concept, stream tuning, truthfulness statement |

---

## Architecture

```
src/
  schema/types.ts        core TypeScript interfaces (provenance model)
  schema/dims.ts         D dimensions for the procedural twin
  data/
    catalog.ts           ~250 component definitions, hierarchy, symmetry
    layers.ts            layer stack L0–L21
    sensors.ts           S01–S06 / IMU01–03 / TEMP01–02 instrumentation plan
    fasteners.ts         10 joint groups (bolts, rivets, SPRs, welds…)
    scenarios.ts         timeline events, baselines A/B, fleet, investigations
  store/useStore.ts      zustand central state (selection, explode, clip, …)
  dataflow/
    engine.ts            packet → residual → persistence → anomaly → regions
    mock.ts              MockStream + MqttStub (DataSourceAdapter)
  three/                 R3F scene: Sel (fx), systems, Fasteners, Sensors, …
  ui/                    kit, SideNav, TopBar, AssemblyTree, Inspector, …
  pages/                 the 12 workspaces
  App.tsx / main.tsx     shell + entry (starts the telemetry stream)
```

### Data flow

`MockStream` (or any `DataSourceAdapter`: MQTT, hardware gateway) →
`AnalyticsEngine.ingest()` → rolling window, residual vs Baseline B →
persistence EMA → heuristic anomaly → `regionStates` / `heatValues` /
`sensorLive` in the store → every page + the 3D twin.

Swapping mock for real hardware requires **only** a new adapter implementing
`connect() / disconnect() / onPacket(cb) / status()` — no UI changes.

### Interaction contract (Vehicle Twin)

- Orbit / pan / zoom (touch gestures included), click to select, hover reads,
  double-click isolate/solo.
- Multi-select (shift/ctrl), component search, show/hide, ghost, X-ray,
  opacity, wireframe.
- Section cut: clip planes + box (drag gizmos, double-click to remove).
- Explosion (variable amount, per-system, per-selection boost).
- Camera presets (iso/front/rear/L/R/top/bottom), focus-on-component,
  time-travel replay (30 s).
- Battery presentation modes: CLOSED → TRANSPARENT COVER → OPEN → EXPLODED →
  MODULE → MOUNT view.
- Selectable instanced fasteners (joint cards, torque `—` until verified) and
  sensors (live readouts).

### Layers L0–L21

Exterior skin → closures → trim → seats/dash → BIW cage → floor → battery
enclosure → modules → cross-members → rails/rockers → suspension → steering →
brakes/wheels → drive unit → power electronics → cooling → HV → LV/ECUs →
fasteners/joints → SHIELD sensors → analytical heatmaps.

---

## Decision log (why things look like this)

- **State-based routing** (zustand `page`) keeps the app snappy and lets any
  page deep-link by setting the page key.
- **`Sel` wrapper** applies selection/heat/ghost/x-ray via material snapshots
  (WeakMap) with narrow subscriptions — 60 fps target, 30 fps floor on
  instanced fastener groups.
- **Fasteners are instanced** (one `InstancedMesh` per joint family) so ~300
  joints render trivially, but each instance is individually clickable
  (`instanceId`) and carries a real joint record.
- **Torques are null** in the data layer; `Inspector` renders `—`. This is a
  deliberate anti-fabrication measure.
- **Correlation copy**: `FLEET_CORRELATIONS[0].note` reads *"Fleet-level
  correlation detected — engineering investigation recommended"* and is
  surfaced verbatim in Fleet Analytics.
- **No external assets**: drei `Html` labels (with `zIndexRange`) replace text
  sprites; `Environment` uses `Lightformer` children only.

---

## Known limitations

- All geometry/materials/processes are DEMO placeholders.
- The "AI Diagnostics" page is a deterministic, transparent heuristic — not a
  trained model, and not an FEA solver.
- Load redistribution is reported as 0 until a physical model is fitted.
- Fleet data is synthetic and seeded deterministically.