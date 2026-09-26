# SHIELD — Replacing DEMO Geometry with Real CAD/BOM

The twin is built from **procedural surrogate geometry** and **DEMO metadata**.
This document is the contract for swapping in real engineering data without
rewriting the app.

> Nothing becomes "real" just by loading a file — every value must arrive with
> a provenance. SHIELD refuses to display fabricated joint torques; they stay
> `—` until a verified BOM record exists.

---

## 1. Porting real geometry (CAD → twin)

Two options, both supported by the current architecture:

**Option A — bake into the same builders.** Replace the primitive meshes in
`src/three/systems/*.tsx` with `.glb`/`.gltf` loaded at runtime (see
`useGLTF` from `@react-three/drei`). Keep the **component ids** as `group`
names (`<Sel cid="FrontLongitudinal_L">`) so the whole interaction contract,
layer manager, search and analytics keep working unchanged. Convert CAD
coordinates to the twin convention:

- Right-handed, +x right, +y up, +z forward.
- Ground plane `y = 0`; `z = 0` at mid-wheelbase.
- Units: metres (convert mm on import — `schema/dims.ts` `D` holds the
  current anchors).

**Option B — keep procedural geometry as a "view proxy"** and attach real
measurement data on top. Useful when the goal is analytics truthfulness rather
than visual fidelity.

In both cases remove the DEMO disclaimer strings and flip `provenance` lazily
per record as verification completes (see §3).

### Loading real assets

Make assets **local** (the app currently has a strict no-network-assets rule):
put GLBs under `src/assets/` or `public/models/` and reference them relative.

```tsx
import { useGLTF } from '@react-three/drei';
const { scene } = useGLTF('/models/frontLongitudinal_L.glb');
// wrap: <Sel cid="FrontLongitudinal_L"><primitive object={scene} /></Sel>
```

---

## 2. Real sensor/hardware data (mock → live)

The telemetry pipeline is adapter-driven (`src/dataflow/mock.ts`):

```ts
interface DataSourceAdapter {
  kind: 'mock' | 'mqtt' | 'websocket';
  connect(): void;
  disconnect(): void;
  onPacket(cb: (pkt: TelemetryPacket) => void): void;
  status(): 'idle' | 'connecting' | 'live' | 'error';
}
```

Write an `MqttAdapter` (or hardware gateway adapter) implementing the same
interface, then swap the `MockStream` constructor call in
`src/dataflow/engine.ts` (`startShieldStream`) for your adapter. **No page or
UI change is required** — Settings already explains this contract.

Packet fields (`schema/types.ts` → `TelemetryPacket`):
`vehicleId, timestamp, sensorId, componentId, signal, value, unit, quality,
provenance`. Set `provenance: 'MEASURED'` for hardware readings; the analytics
engine and UI handle it identically.

## 3. Verified BOM / joint torques

`FastenerDef.torqueSpecNm` is `number | null`. The UI shows `—` for `null`.
To publish real values:

1. Load a verified BOM (JSON/CSV or a DB query) mapping fastener id →
   `{ torqueSpecNm, preloadN, grade, coating, nominalSize }`.
2. Populate the fields and set `confidence: 'VERIFIED'`,
   `status: 'inspected'`.
3. Optionally flip `inspectionDate`.

The passport report and manufacturing thread read these fields directly.

```ts
// example import
fastener.torqueSpecNm = 28.5;      // VERIFIED value
fastener.preloadN   = 14200;
fastener.confidence = 'VERIFIED';
```

## 4. Provenance policy

| Tag | Meaning | When to use |
| --- | --- | --- |
| `VERIFIED` | confirmed against an authoritative supplied source | BOM, QA database |
| `MEASURED` | direct hardware measurement | live strain/IMU/temp feeds |
| `DERIVED` | computed from measurements | analytics outputs |
| `MODEL_ESTIMATED` | engineering model / in-app heuristic | heatmaps, region states |
| `SIMULATED` | synthetic feed (mock generator) | the demo stream |
| `DEMO` | placeholder for presentation only | all surrogate geometry for now |

Do **not** retroactively flip a whole catalog to `VERIFIED` — verify record by
record and watch the passport ledger update.

## 5. Checklist for a production hand-over

- [ ] GLB models in repo, ids match `catalog.ts`, coordinates converted.
- [ ] `D` anchors in `schema/dims.ts` updated to measured vehicle dimensions.
- [ ] Real `DataSourceAdapter` connected; mock kept as fallback.
- [ ] Verified BOM loaded; torque/preload/grade fields populated; torques no
      longer render `—` only where actually verified.
- [ ] Sensor sampling rates / calibration dates reflect hardware.
- [ ] DISCLAIMER strings updated or removed per release policy.
- [ ] `npm run build` clean; re-run full QA (all 12 pages).