/* ============================================================
   SHIELD — Procedural EV skateboard chassis (EV-CH-007)
   Engineering body-in-white / battery-platform geometry used
   by BOTH the Structural Twin and the Hardware Twin.

   All parts are tagged with userData.regionId so a single
   region map drives highlighting, sensor mapping and digital
   twin overlays on both pages.
   ============================================================ */

import * as THREE from 'three';
import { CHASSIS, ANCHOR } from '../config/vehicle.js';

const STRUCT = () => new THREE.MeshStandardMaterial({ color: 0xb6c2d4, metalness: 0.82, roughness: 0.38 });
const STRUCT_DARK = () => new THREE.MeshStandardMaterial({ color: 0x39404e, metalness: 0.7, roughness: 0.5 });
const BATTERY_BODY = () => new THREE.MeshPhysicalMaterial({
  color: 0x111722, metalness: 0.55, roughness: 0.28,
  transparent: true, opacity: 0.52, side: THREE.DoubleSide, envMapIntensity: 0.9,
});
const CELL = () => new THREE.MeshStandardMaterial({ color: 0x0b0f16, metalness: 0.35, roughness: 0.55 });

function box(parent, w, h, d, x, y, z, mat, regionId, name) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (regionId) m.userData.regionId = regionId;
  m.castShadow = true;
  m.receiveShadow = true;
  if (name) m.name = name;
  parent.add(m);
  return m;
}

function edges(parent, mesh, color = 0x2c3a52) {
  const e = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
  );
  e.position.copy(mesh.position);
  parent.add(e);
  return e;
}

/* Rounded slab plinth — the "lab bench" the model sits on */
function buildPlinth() {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.03, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x0a0f17, metalness: 0.4, roughness: 0.6 })
  );
  slab.position.y = -0.03;
  g.add(slab);

  // turntable pattern: concentric rings + radial ticks
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(88,140,200,0.35)';
  ctx.lineWidth = 1.2;
  for (let r = 40; r <= 250; r += 42) {
    ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke();
  }
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 252, 256 + Math.sin(a) * 252);
    ctx.lineTo(256 + Math.cos(a) * 262, 256 + Math.sin(a) * 262);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(56,217,207,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(256, 256, 240, 0, Math.PI * 2); ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  const top = new THREE.Mesh(
    new THREE.CircleGeometry(0.30, 64),
    new THREE.MeshStandardMaterial({ map: tex, color: 0x10161f, metalness: 0.5, roughness: 0.45, transparent: true, opacity: 0.85 })
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = -0.0145;
  top.receiveShadow = true;
  g.add(top);

  // floor shadow catcher beyond plinth
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0x070b12, roughness: 0.9, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.035;
  floor.receiveShadow = true;
  g.add(floor);

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

  /* --- Central floor plate --- */
  const floor = box(regionGroup('C1'), 0.20, 0.008, 0.46, 0, 0.004, 0, STRUCT(), 'C1', 'floor');
  edges(regionGroup('C1'), floor);

  /* --- Longitudinal rails (left / right) --- */
  const railLen = 0.47;
  function rail(side, z0) {
    const g = regionGroup(side === -1 ? 'B1' : 'B2');
    const x = side * C.railX;
    const web = box(g, 0.014, 0.035, railLen, x, 0.0275, z0, STRUCT_DARK(), side === -1 ? 'B1' : 'B2', 'rail-web');
    edges(g, web);
    const flange = box(g, 0.05, 0.006, railLen, x, A.railTopY, z0, STRUCT(), side === -1 ? 'B1' : 'B2', 'rail-flange');
    edges(g, flange);
    // lower return flange
    box(g, 0.028, 0.006, railLen, x, 0.01, z0, STRUCT_DARK(), side === -1 ? 'B1' : 'B2', 'rail-base');
  }
  rail(-1, 0);
  rail(1, 0);

  /* --- Cross-members --- */
  const cmC = 0.21;
  function crossMember(z, regionId) {
    const g = regionGroup(regionId);
    const m = box(g, cmC, 0.03, 0.016, 0, 0.037, z, STRUCT(), regionId, 'cross');
    edges(g, m);
    // gussets
    box(g, cmC, 0.014, 0.008, 0, 0.014, z, STRUCT_DARK(), regionId, 'cross-gusset');
  }
  crossMember(A.frontCrossZ, 'F1');
  crossMember(0.0, 'C1');
  crossMember(A.rearCrossZ, 'B3'); // rear cross belongs to battery-mount zone

  /* --- Front / rear structural zones (bulkheads + crash cans) --- */
  function endZone(dir, regionId) {
    const g = regionGroup(regionId);
    const z = dir * 0.245;
    const bulk = box(g, 0.20, 0.075, 0.014, 0, 0.0375, z - dir * 0.004, STRUCT_DARK(), regionId, 'bulkhead');
    edges(g, bulk);
    for (const sx of [-1, 1]) {
      const can = box(g, 0.05, 0.045, 0.05, sx * 0.115, 0.0225, z + dir * 0.025, STRUCT(), regionId, 'crash-can');
      edges(g, can);
    }
  }
  endZone(1, 'F1');
  endZone(-1, 'R1');

  /* --- Suspension context --- */
  function wheel(side, z) {
    const g = new THREE.Group();
    const tyre = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.034, 28),
      new THREE.MeshStandardMaterial({ color: 0x12161d, roughness: 0.92, metalness: 0.1 })
    );
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = true;
    g.add(tyre);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.036, 16),
      new THREE.MeshStandardMaterial({ color: 0x8fa0b5, metalness: 0.9, roughness: 0.3 })
    );
    hub.rotation.z = Math.PI / 2;
    g.add(hub);
    const rimRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.003, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x8fa0b5, metalness: 0.85, roughness: 0.35 })
    );
    rimRing.rotation.y = Math.PI / 2;
    g.add(rimRing);
    g.position.set(side * 0.155, 0.045, z);
    return g;
  }
  for (const s of [-1, 1]) for (const z of [0.205, -0.205]) root.add(wheel(s, z));

  // control arm + spring hints at each corner
  function corner(side, z) {
    const g = new THREE.Group();
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.008, 0.012),
      STRUCT_DARK()
    );
    arm.position.y = 0.022;
    g.add(arm);
    const strut = new THREE.CylinderGeometry(0.006, 0.006, 0.05, 10);
    const spring = new THREE.Mesh(strut, new THREE.MeshStandardMaterial({ color: 0x55617a, metalness: 0.8, roughness: 0.45 }));
    spring.position.set(side * -0.01, 0.062, 0);
    g.add(spring);
    root.add(g);
  }
  for (const s of [-1, 1]) for (const z of [0.205, -0.205]) corner(s, z);

  /* --- Battery pack (semi-transparent) with cell modules --- */
  const batW = 0.164, batL = 0.33;
  const bat = box(regionGroup('C1'), batW, 0.04, batL, 0, 0.008, (A.batteryFrontZ + A.batteryRearZ) / 2, BATTERY_BODY(), 'C1', 'battery-housing');
  edges(regionGroup('C1'), bat, 0x3d5a88);

  const cellMat = CELL();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const cell = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.022, 0.096),
      cellMat
    );
    cell.position.set(-0.055 + i * 0.055, 0.008, A.batteryRearZ + 0.03 + j * 0.13);
    cell.userData.regionId = 'C1';
    regionGroup('C1').add(cell);
  }
  // end plates
  const endMat = new THREE.MeshStandardMaterial({ color: 0x4c5a72, metalness: 0.8, roughness: 0.4 });
  const epF = new THREE.Mesh(new THREE.BoxGeometry(batW + 0.008, 0.046, 0.006), endMat);
  epF.position.set(0, 0.009, A.batteryFrontZ);
  regionGroup('C1').add(epF);
  const epR = epF.clone();
  epR.position.set(0, 0.009, A.batteryRearZ);
  regionGroup('C1').add(epR);

  /* --- Battery mounting points (brackets + bolts) --- */
  const mtMat = STRUCT();
  const boltMat = new THREE.MeshStandardMaterial({ color: 0xd8e2f0, metalness: 0.95, roughness: 0.25 });
  function mount(x, z, regionId) {
    const g = regionGroup(regionId);
    const br = box(g, 0.022, 0.02, 0.02, x, 0.045, z, mtMat, regionId, 'mount-bracket');
    edges(g, br);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.012, 12), boltMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(x, 0.05, z);
    g.add(bolt);
  }
  mount(-0.09, A.batteryFrontZ + 0.015, 'B1');
  mount(0.09, A.batteryFrontZ + 0.015, 'B2');
  mount(-0.09, A.batteryRearZ - 0.015, 'B3');
  mount(0.09, A.batteryRearZ - 0.015, 'B4');

  /* --- Load-application frame (where LC01 measures applied load) --- */
  const lg = regionGroup('C1');
  const frame = box(lg, 0.18, 0.03, 0.014, 0, 0.045, 0.1, STRUCT(), 'C1', 'load-frame');
  edges(lg, frame);

  root.add(buildPlinth());

  return { group: root, regionGroups };
}

/* Apply a pulse (emissive flash) to a region group */
export function flashRegion(regionGroup, on, color = 0x38d9cf) {
  if (!regionGroup) return;
  regionGroup.traverse(o => {
    if (o.isMesh) {
      const base = o.userData.baseColor || (o.material && o.material.color && o.material.color.getHex());
      if (on) {
        o.userData.baseColor = base;
        if (o.material && o.material.emissive) {
          o.material.emissive.setHex(color);
          o.material.emissiveIntensity = 0.55;
        }
      } else if (o.material && o.material.emissive && o.userData.baseColor !== undefined) {
        o.material.emissive.setHex(0x000000);
        o.material.emissiveIntensity = 0;
        delete o.userData.baseColor;
      }
    }
  });
}

export function regionMeshList(root) {
  const out = [];
  root.traverse(o => {
    if (o.isMesh && o.userData.regionId) out.push(o);
  });
  return out;
}