/* ============================================================
   SHIELD — Procedural EV skateboard chassis (EV-CH-007) v2
   Engineering body-in-white / battery-platform geometry shared
   by BOTH the Structural Twin and the Hardware Twin.

   All parts are tagged userData.regionId so a single region map
   drives highlighting, sensor mapping and twin overlays.
   ============================================================ */

import * as THREE from 'three';
import { CHASSIS, ANCHOR } from '../config/vehicle.js';
import { makeLabel } from './labels.js';
import { buildWheelAssembly } from './wheelAssembly.js';

/* ---------- premium material palette ---------- */
const STRUCT      = () => new THREE.MeshStandardMaterial({ color: 0x9fb2c8, metalness: 0.88, roughness: 0.32 });
const STRUCT_DARK = () => new THREE.MeshStandardMaterial({ color: 0x2e3744, metalness: 0.8, roughness: 0.46 });
const RAIL_DARK   = () => new THREE.MeshStandardMaterial({ color: 0x232b36, metalness: 0.85, roughness: 0.42 });
const CRASH_PANEL = () => new THREE.MeshStandardMaterial({ color: 0x7c8ea8, metalness: 0.92, roughness: 0.26 });
const SHELL_EDGE  = () => new THREE.MeshStandardMaterial({ color: 0x6e7f96, metalness: 0.9, roughness: 0.34 });

const BATTERY_BODY = () => new THREE.MeshPhysicalMaterial({
  color: 0x13202c, metalness: 0.6, roughness: 0.24,
  transparent: true, opacity: 0.42, side: THREE.DoubleSide,
  envMapIntensity: 1.1,
  clearcoat: 1.0, clearcoatRoughness: 0.18,
});
const CELL        = () => new THREE.MeshStandardMaterial({ color: 0x202a3a, metalness: 0.55, roughness: 0.4 });
const MODULE      = () => new THREE.MeshStandardMaterial({ color: 0x2b3a55, metalness: 0.7, roughness: 0.34 });
const MODULE_TOP  = () => new THREE.MeshStandardMaterial({ color: 0x8ea6c9, metalness: 0.92, roughness: 0.26 });
const BUS_BAR     = () => new THREE.MeshStandardMaterial({ color: 0xa86a2f, metalness: 0.95, roughness: 0.3 });
const BOLT        = () => new THREE.MeshStandardMaterial({ color: 0xe3ebf6, metalness: 0.98, roughness: 0.22 });
const TYRE        = () => new THREE.MeshStandardMaterial({ color: 0x10141b, roughness: 0.94, metalness: 0.05 });
const HUB         = () => new THREE.MeshStandardMaterial({ color: 0x9fb2c8, metalness: 0.95, roughness: 0.24 });
const BRAKE       = () => new THREE.MeshStandardMaterial({ color: 0x4d5a6e, metalness: 0.9, roughness: 0.32 });
const SPRING      = () => new THREE.MeshStandardMaterial({ color: 0xf2b94e, metalness: 0.55, roughness: 0.32 });
const HV_CABLE    = () => new THREE.MeshStandardMaterial({ color: 0xff7a1a, metalness: 0.15, roughness: 0.55 });
const FRAME_DARK  = () => new THREE.MeshStandardMaterial({ color: 0x2e3744, metalness: 0.8, roughness: 0.46 });
const PC_CLEAR    = () => new THREE.MeshPhysicalMaterial({
  color: 0xbfe9f4, metalness: 0, roughness: 0.08,
  transparent: true, opacity: 0.16, side: THREE.DoubleSide,
  clearcoat: 1.0, clearcoatRoughness: 0.06, envMapIntensity: 1.2,
});

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function box(parent, w, h, d, x, y, z, mat, regionId, name) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  if (regionId) m.userData.regionId = regionId;
  if (name) m.name = name;
  parent.add(m);
  return m;
}

function edges(parent, mesh, color = 0x2c3a52, opacity = 0.5) {
  const e = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  e.position.copy(mesh.position);
  parent.add(e);
  return e;
}

/* ------------------------------------------------------------------
   Technical stage — measurement plinth, rings, grid + axis ticks
------------------------------------------------------------------- */
function buildStage() {
  const g = new THREE.Group();

  // base plinth slab
  const slab = mesh(new THREE.BoxGeometry(0.9, 0.022, 0.66), new THREE.MeshStandardMaterial({ color: 0x0b111a, metalness: 0.5, roughness: 0.55 }), 0, -0.022, 0);
  g.add(slab);

  // turntable surface canvas — rings + radial ticks + crosshair
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 1024);
  ctx.strokeStyle = 'rgba(88,140,200,0.4)';
  ctx.lineWidth = 2;
  for (let r = 90; r <= 470; r += 76) { ctx.beginPath(); ctx.arc(512, 512, r, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(512 + Math.cos(a) * 470, 512 + Math.sin(a) * 470);
    ctx.lineTo(512 + Math.cos(a) * 482, 512 + Math.sin(a) * 482);
    ctx.stroke();
  }
  // cardinal ticks
  ctx.strokeStyle = 'rgba(56,217,207,0.7)';
  ctx.lineWidth = 3;
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    ctx.beginPath(); ctx.arc(512, 512, 400, a - 0.05, a + 0.05); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(79,140,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(512 - 340, 512); ctx.lineTo(512 + 340, 512); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(512, 512 - 340); ctx.lineTo(512, 512 + 340); ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const face = mesh(new THREE.CircleGeometry(0.5, 96), new THREE.MeshStandardMaterial({
    map: tex, color: 0x16202d, metalness: 0.55, roughness: 0.4, transparent: true, opacity: 0.95,
  }), 0, -0.0105, 0);
  face.rotation.x = -Math.PI / 2;
  face.receiveShadow = true;
  g.add(face);

  // rim light ring around the plinth
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.505, 0.0022, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x38d9cf, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.0088;
  g.add(ring);

  // floor
  const floor = mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x06090f, roughness: 0.92, metalness: 0 }), 0, -0.034, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // fine engineering grid on the floor around the plinth
  const gridPts = [];
  const G = 0.55, N = 10;
  for (let i = -N; i <= N; i++) {
    gridPts.push(new THREE.Vector3(-G, -0.032, i * (G / N)), new THREE.Vector3(G, -0.032, i * (G / N)));
    gridPts.push(new THREE.Vector3(i * (G / N), -0.032, -G), new THREE.Vector3(i * (G / N), -0.032, G));
  }
  const grid = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(gridPts),
    new THREE.LineBasicMaterial({ color: 0x2c3a52, transparent: true, opacity: 0.28 })
  );
  g.add(grid);

  return g;
}

/* ---------- main chassis build ---------- */
export function buildChassis(scene) {
  const root = new THREE.Group();
  const C = CHASSIS;
  const A = ANCHOR;

  const regionGroups = {};
  function regionGroup(id) {
    if (!regionGroups[id]) {
      const g = new THREE.Group();
      g.userData.regionId = id;
      root.add(g);
      regionGroups[id] = g;
    }
    return regionGroups[id];
  }

  /* ============================================================
     MONOCOQUE-STYLE SHELL (matches "EV Chassis 3D Model" poster)
     Low aluminium tub: structural floor + full-length side sills
     (chassis shell), front/rear bulkheads, nose/tail bumper beams,
     an upper frame over the battery bay, and a transparent PC
     battery enclosure with visible modules + BMS.  The longitudinal
     rails at ±railX stay the suspension mounting line (wishbone
     pivots + coil-over towers ride on the flange top).
     ============================================================ */

  /* --- Central floor plate (400 x 200 mm shell) --- */
  const floor = box(regionGroup('C1'), 0.2, 0.006, 0.4, 0, 0.004, 0, STRUCT(), 'C1', 'floor');
  edges(regionGroup('C1'), floor, 0x35445c, 0.55);
  // floor panel stiffening ribs (visible from below / X-ray)
  for (const rz of [-0.15, -0.09, 0, 0.09, 0.15]) {
    box(regionGroup('C1'), 0.188, 0.004, 0.011, 0, 0.001, rz, STRUCT_DARK(), 'C1', 'floor-rib');
  }

  /* --- Longitudinal rails (left / right) — suspension mounting
         rails with top flange at railTopY (wishbone pivots + coil-
         over towers seat here).  The rails are the outer sill line
         the monocoque shell closes around. --- */
  const railLen = 0.47;
  function rail(side, z0) {
    const g = regionGroup(side === -1 ? 'B1' : 'B2');
    const x = side * C.railX;
    const web = box(g, 0.014, 0.038, railLen, x, 0.0275, z0, RAIL_DARK(), side === -1 ? 'B1' : 'B2', 'rail-web');
    edges(g, web, 0x3d4d68, 0.5);
    const flange = box(g, 0.05, 0.006, railLen, x, A.railTopY, z0, STRUCT(), side === -1 ? 'B1' : 'B2', 'rail-flange');
    edges(g, flange, 0x35445c, 0.55);
    box(g, 0.028, 0.006, railLen, x, 0.008, z0, STRUCT_DARK(), side === -1 ? 'B1' : 'B2', 'rail-base');
  }
  rail(-1, 0);
  rail(1, 0);

  /* --- Monocoque side sills (chassis shell walls) inside the rails:
         full-length aluminium tub walls + edge caps.  Stays below the
         rail flange so suspension hardware above the rail stays clear. --- */
  for (const side of [-1, 1]) {
    const g = regionGroup(side === -1 ? 'B1' : 'B2');
    const x = side * 0.088;
    const wall = box(g, 0.006, 0.034, 0.42, x, 0.025, 0, STRUCT(), side === -1 ? 'B1' : 'B2', 'shell-wall');
    edges(g, wall, 0x35445c, 0.55);
    box(g, 0.006, 0.004, 0.42, x, 0.0435, 0, SHELL_EDGE(), side === -1 ? 'B1' : 'B2', 'shell-cap');
    // sill brackets tying the wall to the rail base
    for (const zz of [-0.2, -0.1, 0, 0.1, 0.2]) {
      box(g, 0.008, 0.008, 0.01, x, 0.011, zz, RAIL_DARK(), side === -1 ? 'B1' : 'B2', 'sill-bracket');
    }
  }

  /* --- Cross-members (lower frame lattice) --- */
  const cmC = 0.21;
  function crossMember(z, regionId) {
    const g = regionGroup(regionId);
    const m = box(g, cmC, 0.03, 0.016, 0, 0.037, z, STRUCT(), regionId, 'cross');
    edges(g, m, 0x35445c, 0.55);
    box(g, cmC, 0.014, 0.008, 0, 0.014, z, STRUCT_DARK(), regionId, 'cross-gusset');
  }
  crossMember(A.frontCrossZ, 'F1');   // front cross member (aluminium)
  crossMember(0.0, 'C1');
  crossMember(A.rearCrossZ, 'B3');
  // under-battery mid braces close the lower frame
  for (const zz of [-0.09, 0.09]) {
    const g = regionGroup('C1');
    const brace = box(g, 0.2, 0.018, 0.01, 0, 0.02, zz, STRUCT_DARK(), 'C1', 'mid-brace');
    edges(g, brace, 0x35445c, 0.5);
  }

  /* --- Monocoque nose / tail: bulkhead cross-walls + deck panels
         + bumper beams with crush pods (front crash structure). --- */
  function endZone(dir, regionId) {
    const g = regionGroup(regionId);
    const z = dir * 0.245;
    // bulkhead cross-wall closing the tub
    const bulk = box(g, 0.176, 0.048, 0.009, 0, 0.033, dir * 0.198, RAIL_DARK(), regionId, 'bulkhead');
    edges(g, bulk, 0x3d4d68, 0.5);
    // deck / bonnet panel over the end bay
    const deck = box(g, 0.17, 0.005, 0.05, 0, 0.052, dir * 0.232, STRUCT(), regionId, 'deck');
    edges(g, deck, 0x35445c, 0.55);
    // bumper beam across the nose / tail
    const bumper = box(g, 0.19, 0.036, 0.016, 0, 0.035, dir * 0.268, CRASH_PANEL(), regionId, 'bumper');
    edges(g, bumper, 0x4a5a76, 0.55);
    // crush pods between bulkhead and bumper
    for (const sx of [-1, 1]) for (const py of [0.024, 0.05]) {
      const pod = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.026, 12), CRASH_PANEL(), sx * 0.062, py, dir * 0.252);
      pod.rotation.x = Math.PI / 2;
      pod.userData.regionId = regionId;
      g.add(pod);
    }
  }
  endZone(1, 'F1');
  endZone(-1, 'R1');

  /* --- Suspension context: detailed wheel assemblies (tread, alloy,
         disc, caliper, hub, wishbones, coil-over) at all four corners.
         Outboard = local +x; left corners are mirrored with Y-rotation. --- */
  for (const side of [-1, 1]) {
    for (const z of [0.205, -0.205]) {
      const wa = buildWheelAssembly();
      wa.group.position.set(side * 0.152, 0.047, z);
      if (side === -1) wa.group.rotation.y = Math.PI;
      root.add(wa.group);
    }
  }

  /* --- Battery pack: transparent PC enclosure over a 3 x 5 module
         grid — translucent walls + clear cover lid + visible cells,
         BMS board and HV bus (matches "Battery enclosure (Transparent
         PC)" layer of the exploded view). --- */
  const batW = 0.164, batL = 0.33;
  const batZ = (A.batteryFrontZ + A.batteryRearZ) / 2;
  const bat = box(regionGroup('C1'), batW, 0.04, batL, 0, 0.028, batZ, BATTERY_BODY(), 'C1', 'battery-housing');
  edges(regionGroup('C1'), bat, 0x3d5a88, 0.65);

  // aluminium bezel rim around the cover mouth
  const bezel = box(regionGroup('C1'), batW + 0.008, 0.008, batL + 0.008, 0, 0.052, batZ, SHELL_EDGE(), 'C1', 'battery-bezel');
  edges(regionGroup('C1'), bezel, 0x3d5a88, 0.6);
  // clear PC lid sheet (high-clearcoat, low opacity)
  const lid = mesh(new THREE.BoxGeometry(batW - 0.004, 0.004, batL - 0.004), PC_CLEAR(), 0, 0.056, batZ);
  lid.userData.regionId = 'C1';
  regionGroup('C1').add(lid);

  const cellMat = MODULE();
  const topMat = MODULE_TOP();
  const busMat = BUS_BAR();
  const grid = regionGroup('C1');
  // prismatic modules: 3 across (x) x 5 along (z) — seated on the
  // housing floor (y 0.008), silver terminal caps on top, HV spine
  // + row bus bars above the caps, all inside the transparent shell
  const colX = [-0.053, 0, 0.053];
  const rowZ = [-0.148, -0.086, -0.024, 0.038, 0.1];
  for (const mx of colX) for (const mz of rowZ) {
    const mod = mesh(new THREE.BoxGeometry(0.048, 0.03, 0.058), cellMat, mx, 0.024, mz);
    mod.userData.regionId = 'C1';
    grid.add(mod);
    const cap = mesh(new THREE.BoxGeometry(0.044, 0.003, 0.054), topMat, mx, 0.0405, mz);
    cap.userData.regionId = 'C1';
    grid.add(cap);
  }
  // orange HV spine bus bar + per-row links
  const spine = mesh(new THREE.BoxGeometry(0.006, 0.003, 0.3), busMat, 0, 0.044, -0.024);
  grid.add(spine);
  for (const mz of rowZ) {
    grid.add(mesh(new THREE.BoxGeometry(0.11, 0.0025, 0.005), busMat, 0, 0.044, mz));
  }

  /* --- BMS board (cells + BMS) + HV connector at the pack rear --- */
  const bmsMat = new THREE.MeshStandardMaterial({ color: 0x1c5c33, metalness: 0.12, roughness: 0.6 });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x11151c, metalness: 0.4, roughness: 0.6 });
  for (const sx of [-1, 1]) {
    grid.add(mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.008, 8), STRUCT_DARK(), sx * 0.03, 0.041, -0.15));
  }
  const bms = mesh(new THREE.BoxGeometry(0.09, 0.004, 0.05), bmsMat, 0, 0.0445, -0.15);
  bms.userData.regionId = 'C1';
  grid.add(bms);
  const bmsChip = mesh(new THREE.BoxGeometry(0.024, 0.004, 0.024), chipMat, -0.018, 0.046, -0.15);
  bmsChip.userData.regionId = 'C1';
  grid.add(bmsChip);
  const bmsTerm = mesh(new THREE.BoxGeometry(0.02, 0.004, 0.01), BUS_BAR(), 0.025, 0.0455, -0.145);
  bmsTerm.userData.regionId = 'C1';
  grid.add(bmsTerm);
  // HV outlet block on the pack rear wall
  const hvOut = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.009, 14), BUS_BAR(), 0, 0.03, A.batteryRearZ + 0.008);
  hvOut.rotation.x = Math.PI / 2;
  hvOut.userData.regionId = 'C1';
  grid.add(hvOut);

  // HV cable: pack front -> up over the front bulkhead -> power bay
  // (routes through a bulkhead grommet line, then drops beside the
  //  right upper frame rail to the front bay)
  const hvCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, 0.03, 0.14),
    new THREE.Vector3(0.078, 0.062, 0.185),
    new THREE.Vector3(0.082, 0.05, 0.21),
    new THREE.Vector3(0.084, 0.03, 0.24),
  ]);
  const hv = mesh(new THREE.TubeGeometry(hvCurve, 24, 0.004, 8), HV_CABLE());
  hv.userData.regionId = 'C1';
  grid.add(hv);

  // end plates
  const endMat = new THREE.MeshStandardMaterial({ color: 0x54657e, metalness: 0.85, roughness: 0.32 });
  const epF = mesh(new THREE.BoxGeometry(batW + 0.008, 0.048, 0.007), endMat, 0, 0.009, A.batteryFrontZ);
  regionGroup('C1').add(epF);
  const epR = mesh(new THREE.BoxGeometry(batW + 0.008, 0.048, 0.007), endMat, 0, 0.009, A.batteryRearZ);
  regionGroup('C1').add(epR);
  // cover flange corner bolts (lid fasteners on the bezel)
  const batCz = batZ;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const flBolt = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.007, 8), BOLT(), sx * 0.078, 0.056, batCz + sz * 0.156);
    regionGroup('C1').add(flBolt);
  }

  /* --- Upper frame / shell: perimeter rails over the battery bay
         (the top "upper frame / shell" layer of the exploded view).
         Centre stays open so the transparent pack reads through. --- */
  for (const side of [-1, 1]) {
    const g = regionGroup('C1');
    const x = side * 0.062;
    const ur = box(g, 0.012, 0.02, 0.4, x, 0.068, 0, FRAME_DARK(), 'C1', 'upper-rail');
    edges(g, ur, 0x35445c, 0.55);
  }
  for (const zz of [0.185, -0.185]) {
    const g = regionGroup('C1');
    const uh = box(g, 0.148, 0.02, 0.012, 0, 0.068, zz, FRAME_DARK(), 'C1', 'upper-head');
    edges(g, uh, 0x35445c, 0.55);
  }

  /* --- Battery mounting points (brackets + bolts) --- */
  const mtMat = STRUCT();
  function mount(x, z, regionId) {
    const g = regionGroup(regionId);
    const br = box(g, 0.024, 0.02, 0.022, x, 0.045, z, mtMat, regionId, 'mount-bracket');
    edges(g, br, 0x35445c, 0.55);
    const bolt = mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.014, 14), BOLT(), x, 0.051, z);
    g.add(bolt);
    const nut = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.005, 8), BOLT(), x, 0.0395, z);
    g.add(nut);
  }
  mount(-0.09, A.batteryFrontZ + 0.015, 'B1');
  mount(0.09, A.batteryFrontZ + 0.015, 'B2');
  mount(-0.09, A.batteryRearZ - 0.015, 'B3');
  mount(0.09, A.batteryRearZ - 0.015, 'B4');

  /* --- Load-application frame (LC01 measures applied load here) --- */
  const lg = regionGroup('C1');
  const frame = box(lg, 0.18, 0.032, 0.014, 0, 0.046, 0.1, STRUCT(), 'C1', 'load-frame');
  edges(lg, frame, 0x35445c, 0.55);
  // load pins at the frame ends
  for (const sx of [-1, 1]) {
    const pin = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 12), BOLT(), sx * 0.075, 0.046, 0.095);
    lg.add(pin);
  }

  const stage = buildStage();
  stage.name = 'stage';
  root.add(stage);

  /* QA hook: keep last built chassis reachable from headless probes */
  if (typeof window !== 'undefined') window.__LAST_CHASSIS__ = { group: root, regionGroups };

  return { group: root, regionGroups };
}

/* Apply emissive flash / heat-map tint to a region group */
export function flashRegion(regionGroup, on, color = 0x38d9cf, intensity = 0.55) {
  if (!regionGroup) return;
  regionGroup.traverse(o => {
    if (o.isMesh) {
      const base = o.userData.baseColor || (o.material && o.material.color && o.material.color.getHex());
      if (on) {
        o.userData.baseColor = base;
        if (o.material && o.material.emissive) {
          o.material.emissive.setHex(color);
          o.material.emissiveIntensity = intensity;
        }
      } else if (o.material && o.material.emissive && o.userData.baseColor !== undefined) {
        o.material.emissive.setHex(0x000000);
        o.material.emissiveIntensity = 0;
        delete o.userData.baseColor;
      }
    }
  });
}

/* CRITICAL-flash one region with a pulsing emissive driven externally */
export function setRegionEmissive(regionGroup, colorHex, intensity) {
  if (!regionGroup) return;
  regionGroup.traverse(o => {
    if (o.isMesh && o.material && o.material.emissive) {
      o.material.emissive.setHex(colorHex);
      o.material.emissiveIntensity = intensity;
    }
  });
}

export function clearRegionEmissive(regionGroup) {
  setRegionEmissive(regionGroup, 0x000000, 0);
}

export function regionMeshList(root) {
  const out = [];
  root.traverse(o => {
    if (o.isMesh && o.userData.regionId) out.push(o);
  });
  return out;
}

/* ------------------------------------------------------------------
   Dimension annotations (400 mm shell length / 200 mm shell width)
   White engineering arrows drawn on the plinth, poster style.
------------------------------------------------------------------- */

export function buildDimensions() {
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xe6eefc, transparent: true, opacity: 0.9 });
  const y = -0.0055;
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xe6eefc });

  function arrowLine(from, to) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([from, to]), mat);
    g.add(line);
    const dir = to.clone().sub(from).normalize();
    for (const [p, d] of [[from, dir.clone().negate()], [to, dir]]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.018, 10), coneMat);
      cone.position.copy(p);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      g.add(cone);
    }
  }
  function tick(p, axis) {
    const a = axis.clone().multiplyScalar(0.012);
    g.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([p.clone().sub(a), p.clone().add(a)]), mat));
  }

  // length: 400 mm along the left of the shell
  const L = new THREE.Vector3(-0.17, y, 0);
  arrowLine(new THREE.Vector3(L.x, y, -0.2), new THREE.Vector3(L.x, y, 0.2));
  tick(new THREE.Vector3(L.x, y, -0.2), new THREE.Vector3(1, 0, 0));
  tick(new THREE.Vector3(L.x, y, 0.2), new THREE.Vector3(1, 0, 0));
  const lblL = makeLabel('400 mm', { color: '#eef5ff', bg: 'rgba(6,11,18,0.72)', spriteScale: 0.032 });
  lblL.position.set(L.x - 0.015, 0.03, 0);
  g.add(lblL);

  // width: 200 mm across the front of the shell
  arrowLine(new THREE.Vector3(-0.1, y, 0.245), new THREE.Vector3(0.1, y, 0.245));
  tick(new THREE.Vector3(-0.1, y, 0.245), new THREE.Vector3(0, 0, 1));
  tick(new THREE.Vector3(0.1, y, 0.245), new THREE.Vector3(0, 0, 1));
  const lblW = makeLabel('200 mm', { color: '#eef5ff', bg: 'rgba(6,11,18,0.72)', spriteScale: 0.032 });
  lblW.position.set(0, 0.03, 0.262);
  g.add(lblW);

  return g;
}

/* XYZ engineering gizmo (x red / y green / z blue) for the poster corner */
export function buildAxisGizmo(origin = new THREE.Vector3(-0.36, -0.004, 0.28)) {
  const g = new THREE.Group();
  g.position.copy(origin);
  const axes = [
    [new THREE.Vector3(1, 0, 0), 0xff5d5d, 'X'],
    [new THREE.Vector3(0, 1, 0), 0x4fe0a0, 'Y'],
    [new THREE.Vector3(0, 0, 1), 0x4f8cff, 'Z'],
  ];
  for (const [dir, color, name] of axes) {
    g.add(new THREE.ArrowHelper(dir, new THREE.Vector3(), 0.05, color, 0.014, 0.008));
    const lbl = makeLabel(name, { color: '#' + color.toString(16).padStart(6, '0'), spriteScale: 0.024 });
    lbl.position.copy(dir).multiplyScalar(0.065);
    g.add(lbl);
  }
  return g;
}