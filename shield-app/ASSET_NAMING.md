# SHIELD — Asset Naming Conventions

Every selectable mesh in the twin maps 1:1 to a `ComponentDef` id in
`src/data/catalog.ts`. The naming below is the contract between the data
layer, the 3D builders, the tree/inspector UI, and the analytics engine.
**Nothing works if these don't match.**

## Component ids

Format: `PartName_Side` or `PartName` (centered parts), optionally suffixed
with a functional role.

| Pattern | Example | Notes |
| --- | --- | --- |
| `FrontLongitudinal_L` / `_R` | rails | side suffix is always `_L` / `_R` |
| `A_Pillar_L`, `B_Pillar_L` | pillars | two-letter pillar prefix |
| `CrossMember_Front` / `_Center_1` / `_Center_2` / `_Rear` | floor beams | functional position, no side |
| `Mount_BFL` / `_BFR` / `_BRL` / `_BRR` | battery mounts | B=**B**attery, F/R=**F**ront/**R**ear, L/R side |
| `Door_FL` | closures | FL = front-left (door order) |
| `SuspensionTower_FL` | towers | note: FL here, not `_F_L` |
| `Rocker_L`, `RoofRail_L` | sills/rails | side suffix |
| `BatteryPack_Tray` / `_Cover` / `_SideL` | pack | functional part, optional side |
| `Module_01`…`Module_06` | cells | zero-padded |
| `STRG_*`, `HM_F*`, `LV_Harness` | steering/harness | functional prefixes |

Rules:

- Side suffixes: `_L`, `_R`, `_CENTER` (rare). `side` field should match.
- Region codes are **F1** (front), **C1** (centre), **R1** (rear), **B1–B4**
  (battery-mount corners). They are declared on the `region` field.
- System keys are the `SYSTEM_GROUPS` ids: `SYS_EXTERIOR`, `SYS_BIW`,
  `SYS_SKATEBOARD`, `SYS_SUSPENSION`, `SYS_STEERING`, `SYS_BRAKES`,
  `SYS_CABIN`, `SYS_THERMAL`, `SYS_ELECTRICAL`, `SYS_FASTENERS`,
  `SYS_SENSORS`.
- Group parents: `GRP_BIW_FRONT`, `GRP_BIW_CELL`, `GRP_BIW_FLOOR`,
  `GRP_BIW_REAR`, `GRP_BATTERY`, `GRP_DRIVE`, `GRP_PWR_ELEC`, `GRP_HV`.

## Sensors

`S01`–`S06` (strain), `IMU01`–`IMU03` (acceleration), `TEMP01`–`TEMP02`
(temperature). The sensor record's `componentId` must be an existing catalog
id — `engine.ts`'s `SENSOR_REGION_COMPONENTS` maps each sensor to the
component ids it informs.

## Fasteners / joints

Each fastener id has a functional prefix and is grouped by family:

| Prefix | Family | Group id |
| --- | --- | --- |
| `BOLT-BAT-*`, `BOLT-BAT-MID-*` | socket head / flange bolt | `FastenerGroup_BatteryMountBolts` |
| `BOLT-STR-*` | hex flange bolt | `FastenerGroup_StructuralBolts` |
| `BOLT-SUS-*` | hex flange bolt | `FastenerGroup_SuspensionBolts` |
| `BOLT-MM-*` | flange bolt | `FastenerGroup_MotorMountBolts` |
| `BOLT-XM-*` | flange bolt | `FastenerGroup_CrossMemberBolts` |
| `RIV-*` | rivet | `FastenerGroup_Rivets` |
| `SPR-*` | self-piercing rivet | `FastenerGroup_SPRs` |
| `WELD-*` | spot weld | `FastenerGroup_SpotWelds` |
| `ADH-*` | adhesive point | `FastenerGroup_Adhesive` |
| `CLIP-*` | spring clip | `FastenerGroup_Clips` |

`componentA`/`componentB` must be existing catalog ids — they drive the joint
card and are used by `Inspector` for cross-select.

## Files that must stay in sync

| Concern | Sources of truth |
| --- | --- |
| Component schema | `schema/types.ts` → `data/catalog.ts` |
| 3D presence | `three/systems/*.tsx` (ids must exist in catalog) |
| Tree/inspector labels | `ui/AssemblyTree.tsx`, `ui/Inspector.tsx` (read catalog) |
| Sensor influence map | `data/sensors.ts` + `dataflow/engine.ts` |
| Joint records | `data/fasteners.ts` + `three/systems/Fasteners.tsx` |
| Layer assignments | `data/layers.ts` (`def.layer` must be 0–21) |
| Analytics regions | `SENSOR_REGION_COMPONENTS` in `dataflow/engine.ts` |

## Adding a new component

1. Add a `ComponentDef` in `data/catalog.ts` (id, name, system, parent,
   layer, gf, explodeDir/explodeGroup, provenance).
2. Add its meshes wrapped in `<Sel cid="...">` in the matching system file.
3. The tree, inspector, search, context menu, layer manager and analytics pick
   it up automatically.
4. If a sensor or fastener references it, keep those references in sync.