# SHIELD — EV Structural & Hardware Digital Twin

Four interactive digital-twin pages for the **EV-CH-007** prototype skateboard
chassis, built with procedural Three.js (r160), ES modules and a zero-build
Node static server.

| Page | What it does |
| --- | --- |
| **Twin** (Structural) | Premium engineering console: STRAIN / STRESS / DISPLACEMENT / LOAD PATH / X-RAY / STRUCTURE / SENSORS views, 7 load scenarios, load vectors, replay timeline, context-aware inspector, KPI strip + anomaly localisation. |
| **Hardware Twin** | The instrumentation architecture on the same chassis: strain gauges, IMUs, load cell, temperature, optional displacement sensor and the SHIELD Edge Node, with signal-path / digital-mapping / exploded views and a per-sensor inspector. |
| **Anatomy** | Live engineering poster: hero 3/4 chassis with sensor callouts, 400/200 mm dimension arrows and XYZ gizmo, animated exploded chassis-layers stack, top/front/side/rear orthographic views, sensor-placement zones with glowing hot-spots, and material/sensor legends. |
| **Wheel Assembly** | Detailed wheel-corner poster: hero 3/4 tyre·rim·disc·caliper·hub·suspension with 9 component callouts, front/side/rear views with dimension arrows, wireframe orthographic blueprint, animated exploded view with part chips, key-measurements table. |

Both pages render the **same EV-CH-007 chassis** from one shared config, so
structural regions (B1–B4 battery mounts, F1 front, C1 centre, R1 rear) and
sensor placements stay consistent across twins.

---

## Run

```bash
npm start        # = node server.js  → http://localhost:8123
```

Open http://localhost:8123/ in a WebGL-capable browser (Chrome/Edge/Firefox).
No build step, no dependencies to install beyond `npm install` for the QA
scripts (puppeteer-core for headless verification).

---

## Hardware Twin — what to look at

- **3D chassis fills ~65–75 % of the view**; sensors are mounted with
  mechanical intent, not floating (rims/surfaces matched to rails, battery
  mounts and cross-members).
- **Instruments**: 4 directional strain gauges (SG01–SG04, double-headed
  arrows), 2 IMUs (IMU01 front/reference + IMU02 rear/response → two-IMU
  transfer function), LC01 load cell in the battery load fixture, TEMP01
  DS18B20 (context only), optional DISP01 vertical displacement sensor, and a
  professional **SHIELD Edge Node** enclosure (ESP32 + HX711 + ADS1115) — no
  breadboards.
- **Toggles** (top bar):
  - *Signal Path* — clean logical lines, sensor → Edge Node.
  - *Digital Mapping* — animated data pulses from sensor → structural region → twin.
  - *Exploded Instrumentation* — camera pull-out, battery becomes more
    transparent (reveals mount hardware), sensors scale up.
- **Filters** (fade, never delete):
  - *Layer*: ALL / STRAIN / IMU / LOAD / TEMP / DISP / EDGE.
  - *Zone*: FRONT / CENTRE / REAR / BATTERY_MOUNTS / LEFT / RIGHT.
- **Inspector**: click any sensor → **LIVE DATA** (live-simulated values,
  baseline/current/residual) and **COMPONENT INFO** tab. SG02 is **OFFLINE**
  (health 7/8, excluded from region assessment — its zone is *not* failed).
- **Instrumentation Summary** (left panel): Installed sensors 8 · strain 4 ·
  IMU 2 · load 1 · temp 1 · disp 1 (optional) · **7/8 Healthy**, plus “why four
  gauges” notes.
- **Bottom strip** is a compact **signal chain** (sensor → conditioner/ADC →
  ESP32 → twin) — not test buttons.
- **Placement disclaimer**: layout is vehicle-specific; the whole sensor
  arrangement is **config-driven** so another platform can swap the layout
  without touching page code.

## Config-driven sensors

```
js/config/vehicle.js   → ANCHOR, REGIONS, ZONES, CHASSIS (shared by both twins)
js/config/sensors.js   → SENSORS [...], EDGE_NODE, INSTALL_SUMMARY, LAYERS
```

Each sensor entry carries `id`, `type`, `region`, `zone`, `position`,
`orientation`, `surfaceNormal`, `mechanicalReason`, live-data seed values,
component/hardware info and health. The Hardware Twin builds all meshes,
anchors, signal paths and the inspector from these arrays — add a sensor to
the config and it appears everywhere (mesh, map, chains, summary).

**Caveat**: positions are engineering estimates for the EV-CH-007 prototype
(1:4 scale model, coordinates in metres; +x right, +y up, +z forward) and are
marked in-app as vehicle-specific; final numbers require OEM validation.

---

## Structural Twin (Twin)

A workstation-grade structural console. Top tabs control the 3D view:

- **STRUCTURE** — neutral engineering base (no clutter).
- **X-RAY** — battery becomes a ghost volume; load-bearing rails/members
  highlight.
- **STRAIN / STRESS / DISPLACEMENT** — region heat maps
  (teal→yellow→red), default inspector shows the highest-response region with
  current vs expected vs baseline vs residual vs deviation + sparkline.
- **LOAD PATH** — load vectors from the battery load fixture; arrows scale
  with magnitude and go asymmetric in Uneven Load / Structural Change.
- **SENSORS** — full instrumentation roster; click any sensor for detail.

**Scenarios** (bottom bar): Normal Load · High Load · Uneven Load · Vibration ·
Road Shock · Structural Change · Sensor Fault. Each drives load vectors, heat
maps, KPIs and the verdict.

- **KPI strip**: Applied Load · Max Strain · Max Stress · Max Disp ·
  Vibration RMS · Dominant Freq · Temperature · Structural State.
- **Timeline**: play/pause + scrubber + event markers (Load Applied, Change
  Introduced, Watch, Inspection). Twin state syncs with replay position.
- **Right inspector** is context-aware: strain view → highest-strain region
  story; stress/displacement → region panels; selected region/sensor → drill
  down; neutral views → Structural Summary (scenario → load → response →
  expected → residual → location → decision).
- **Anomaly localisation** (Structural Change): B4 pulses red with a callout
  ring + floating label, inspector shows residual / frequency shift /
  repeated-window evidence, and a **Focus B4** button flies the camera in.
- **Sensor Fault**: SG02 excluded; B2 is *not* flagged — structure is never
  failed by sensor loss.

---

## Header & navigation

- **Header**: SHIELD · Hardware Digital Twin / Structural Twin · **EV-CH-007** ·
  Manufacturing · Edge Node Connected · **7/8 Healthy**.
- **Left nav**: Twin · Hardware Twin · Anatomy · Wheel Assembly · Manufacturing ·
  Experiments · Analytics · Passport · Alerts — *Twin* and *Hardware Twin* are
  clearly distinct pages; *Anatomy* adds the full-chassis poster view and
  *Wheel Assembly* the detailed corner-assembly poster.

---

## Acceptance mapping (9-point checklist)

| # | Criterion | Where / evidence |
| --- | --- | --- |
| 1 | 3D chassis fills ~65–75 % of screen | `createView` camera + ×1.18 model wrapper; `analyze.js` reports center density 0.95–1.0 across all twin frames |
| 2 | Sensors mechanically mounted; shared B1–B4/F1/C1/R1 | `sensorMeshes.js` + `chassis.js`; every sensor has `mechanicalReason` + `region` |
| 3 | SG01–SG04 (directional), IMU01/02 (two-IMU transfer), LC01, TEMP01, DISP01, Edge Node enclosure | `sensors.js` + `sensorMeshes.js`; inspector tabs for each |
| 4 | Toggles: Signal Path / Digital Mapping / Exploded | `hardwareTwin.js` toggles; `check-mechanics.js` verifies bounce, opacity 0.52→0.18, scale 1→1.3, camera pull-out, animated pulses |
| 5 | Layer + zone filters fade (not remove) | `applyFilters()`; verified in `verify.js` + screenshots 29/30 |
| 6 | Inspector LIVE DATA / COMPONENT INFO; SG02 OFFLINE, 7/8, no zone fail | `verify.js` (SG02 excluded, zone not failed) + UI |
| 7 | Header + left nav; Twin vs Hardware Twin distinct | `app.js` router; `verify.js` nav assertions |
| 8 | Config-driven layout, disclaimer, compact signal-chain strip | `js/config/*` + bottom chain; verified in `verify.js` |
| 9 | Renders at 1920×1080, no console errors | `render.js` (33 shots in `shots/`, incl. Anatomy poster 40/41 and Wheel poster 50/51) — all frames `vehicle-ok`, zero browser errors |

## QA scripts

| Script | Purpose |
| --- | --- |
| `node render.js` | Headless Chrome at 1920×1080 → `shots/` (33 screenshots: twin views + scenarios, HW inspector + filters + toggles, anatomy poster, wheel poster) |
| `node analyze.js` | Pixel-metric review of every shot (vehicle density, inspector/strip occupancy) |
| `node verify.js` | 36 DOM/runtime assertions (summary, inspector, filters, twin modes, SG02 health, scenarios) |
| `node check-mechanics.js` | Runtime-mechanics proof: digital-mapping pulse animation, exploded opacity/scale/camera |
| `node check-labels.js` | Label legibility proof: every sensor label projects on-canvas with readable glyph pixels |
| `node probe-anatomy.js` | Anatomy poster probe: panel sizes, callout leaders, layer/zone labels, legend clipping |
| `node probe-wheel.js` | Wheel poster probe: 9 callouts/leaders, exploded chips inside panel, measurements fit, dims, nav order |

Requires the server running on :8123, a local Chrome at
`C:\Program Files\Google\Chrome\Application\chrome.exe` (edit `CHROME` in each
script for another path), and `puppeteer-core`.

## Project layout

```
index.html              shell + importmap
css/app.css             theme
js/app.js               shell, router, header/nav lifecycle
js/pages/twin.js        Structural Twin
js/pages/hardwareTwin.js  Hardware Twin
js/pages/anatomy.js      EV Chassis 3D Anatomy poster (hero + static views)
js/pages/wheelPoster.js  EV Chassis Wheel Assembly poster (hero + blueprint + exploded)
js/core/wheelAssembly.js detailed corner assembly (tyre, rim, disc, caliper, hub, suspension)
js/pages/placeholders.js  Manufacturing / Experiments / Analytics / Passport / Alerts
js/config/vehicle.js    EV-CH-007 chassis anchors + regions
js/config/sensors.js    sensor layout (config-driven)
js/core/scene.js        renderer, camera, OrbitControls, flyTo, frame hooks, study lights
js/core/multiView.js    shared offscreen renderer for poster panels
js/core/chassis.js      procedural skateboard chassis + region meshes + dimensions/axis
js/core/sensorMeshes.js sensor + Edge Node mesh builders
js/core/signalPaths.js  logical signal lines + animated digital-mapping pulses
js/core/labels.js       canvas sprite labels
vendor/                 three.module.js, OrbitControls (local copies)
server.js               static server (Node built-in http, port 8123)
```"# TATA-shield" 
