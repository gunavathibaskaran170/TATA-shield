/* ============================================================
   SHIELD — Sensor Lab — shared mechanical part builders
   Small engineering-grade primitives reused by SG01 / IMU01:
   chamfered CAD housing, M6 fasteners, PCB with components,
   serpentine strain foil, cable gland / shielded cable / M12
   connector, engraved decals, axis triads.
   All lengths in METRES (callers pass mm via *0.001).
   ============================================================ */

import * as THREE from 'three';
import { RoundedBoxGeometry } from '../../../vendor/geometries/RoundedBoxGeometry.js';

/* ---------- materials ---------- */
export function metal(color, metalness = 0.85, roughness = 0.32, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, ...opts });
}
export const M = {
  ALU:        () => metal(0xcdd6e2, 0.6, 0.48),            // machined aluminium (silvery, product-read)
  ALU_DARK:   () => metal(0x98a7b8, 0.62, 0.5),            // machined darker Al
  ANOD_BLUE:  () => metal(0x3d7fd0, 0.55, 0.4),            // IMU blue anodized
  ANOD_DEEP:  () => metal(0x2a5ea8, 0.55, 0.45),           // deeper anodized
  STEEL:      () => metal(0xdde4ee, 0.85, 0.32),           // SS fasteners
  POLY:       () => new THREE.MeshStandardMaterial({ color: 0x171d26, metalness: 0.35, roughness: 0.62 }),
  RUBBER:     () => new THREE.MeshStandardMaterial({ color: 0x0a0e14, metalness: 0.0, roughness: 0.92 }),
  PCB:        () => new THREE.MeshStandardMaterial({ color: 0x155a30, metalness: 0.08, roughness: 0.58 }),
  GOLD:       () => metal(0xd9a441, 0.9, 0.28),            // copper/gold foil
  GOLD_MAT:   () => metal(0xb8862b, 0.55, 0.45),           // solder pad gold
  IC_BLACK:   () => metal(0x10151d, 0.15, 0.6),
  CLEAR:      () => new THREE.MeshPhysicalMaterial({ color: 0xdfe8f2, metalness: 0.0, roughness: 0.06, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
  SILICONE:   () => new THREE.MeshStandardMaterial({ color: 0x2a2f3a, metalness: 0.0, roughness: 0.85 }),
  GASKET_RB:  () => new THREE.MeshStandardMaterial({ color: 0x171c24, metalness: 0.0, roughness: 0.9 }),
};

/* ---------- geometry helpers ---------- */
export function roundedBox(w, h, d, radius = 0.0012, seg = 2) {
  return new RoundedBoxGeometry(w, h, d, seg, radius);
}

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, name = '') {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (name) m.name = name;
  if (parent) parent.add(m);
  return m;
}

/* mark a mesh (or group subtree) as pickable for the inspector */
export function tag(obj, partKey, partName) {
  obj.userData.partKey = partKey;
  obj.userData.partName = partName;
  obj.userData.pickable = true;
  obj.traverse(o => {
    if (o.isMesh) {
      o.userData.partKey = partKey;
      o.userData.partName = partName;
      o.userData.pickable = true;
    }
  });
  return obj;
}

/* ---------- M6 socket-head cap screw ---------- */
let _boltGeo = null;   // geometry shared across instances (perf)
export function boltM6(headR = 0.0045, headH = 0.0026, shaftLen = 0.009) {
  if (!_boltGeo) {
    _boltGeo = {
      head: new THREE.CylinderGeometry(headR, headR, headH, 16),
      shaft: new THREE.CylinderGeometry(0.0031, 0.0031, shaftLen, 12),
      socket: new THREE.CylinderGeometry(0.002, 0.002, headH + 0.0002, 6),
    };
    Object.values(_boltGeo).forEach(g => { g.userData.shared = true; });
  }
  const g = new THREE.Group();
  const matSteel = M.STEEL();
  const head = new THREE.Mesh(_boltGeo.head, matSteel);
  head.position.y = shaftLen / 2 + headH / 2;
  g.add(head);
  const shaft = new THREE.Mesh(_boltGeo.shaft, matSteel);
  shaft.position.y = shaftLen / 2;
  g.add(shaft);
  const socketM = M.POLY();
  const socket = new THREE.Mesh(_boltGeo.socket, socketM);
  socket.position.y = shaftLen / 2 + headH * 0.7;
  g.add(socket);
  g.userData.matSteel = matSteel;
  return g;
}

/* ---------- cable gland (black, knurled) ---------- */
export function buildGland(bodyR, bodyL, flangeR, parent = null) {
  const g = new THREE.Group();
  const poly = M.POLY();
  const body = mesh(new THREE.CylinderGeometry(bodyR, bodyR, bodyL, 18), poly, 0, 0, 0, g);
  body.rotation.x = Math.PI / 2;
  const flange = mesh(new THREE.CylinderGeometry(flangeR, flangeR, 0.004, 18), poly, 0, 0, 0, g);
  flange.rotation.x = Math.PI / 2;
  flange.position.z = bodyL / 2 - 0.002;
  const nut = mesh(new THREE.CylinderGeometry(flangeR * 0.92, flangeR * 0.92, 0.005, 6), poly, 0, 0, -bodyL / 2 + 0.003, g);
  nut.rotation.x = Math.PI / 2;
  if (parent) parent.add(g);
  return g;
}

/* ---------- shielded cable tube ---------- */
export function buildCable(points, r = 0.0022, parent = null, color = 0x0a0e14) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, r, 8),
    new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.72 })
  );
  // braid hint stripes
  const stripe = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, r * 1.02, 8, false),
    new THREE.MeshStandardMaterial({ color: 0x1a222d, metalness: 0.6, roughness: 0.5 })
  );
  stripe.visible = false;
  if (parent) {
    parent.add(tube); parent.add(stripe);
  }
  stripe.userData.shared = true;
  tube.userData.shared = true;
  return { tube, stripe };
}

/* ---------- M12 connector ---------- */
export function buildM12(slots, bodyR = 0.007, bodyL = 0.02, parent = null) {
  const g = new THREE.Group();
  const poly = M.POLY();
  const body = mesh(new THREE.CylinderGeometry(bodyR * 0.94, bodyR, bodyL * 0.55, 20), poly, 0, 0, 0, g);
  body.rotation.x = Math.PI / 2;
  // thread hex coupling
  const ring = mesh(new THREE.CylinderGeometry(bodyR * 1.10, bodyR * 1.10, 0.006, 6), metal(0x9aa8bd, 0.9, 0.34), 0, 0, bodyL * 0.55 / 2, g);
  ring.rotation.x = Math.PI / 2;
  // rear strain relief
  const relief = mesh(new THREE.CylinderGeometry(bodyR * 0.62, bodyR * 0.72, bodyL * 0.30, 14), poly, 0, 0, -bodyL * 0.55 / 2 - bodyL * 0.15, g);
  relief.rotation.x = Math.PI / 2;
  // pin face
  for (let i = 0; i < slots; i++) {
    const a = (i / slots) * Math.PI * 2 + 0.4;
    const pin = mesh(
      new THREE.CylinderGeometry(0.0007, 0.0007, 0.003, 8),
      metal(0xd9a441, 0.9, 0.3),
      Math.cos(a) * bodyR * 0.45, Math.sin(a) * bodyR * 0.45, bodyL * 0.55 / 2 + 0.0015, g
    );
    pin.rotation.x = Math.PI / 2;
  }
  if (parent) parent.add(g);
  return g;
}

/* ---------- serpentine foil strain gauge ----------
   Returns a group: substrate + gold serpentine grid + solder
   pads + lead wires. userData.foilGrid -> the grid group so the
   page can micro-deform it for the "SHOW STRAIN" demo. */
export function buildStrainFoil(subW, subL, gridW, gridL) {
  const g = new THREE.Group();
  const sub = mesh(
    new THREE.BoxGeometry(subW, 0.00045, subL),
    new THREE.MeshStandardMaterial({ color: 0x8c6a33, metalness: 0.2, roughness: 0.5 }),
    0, 0, 0, g
  );
  const grid = new THREE.Group();
  grid.position.y = 0.00045;
  // serpentine: vertical traces connected alternately at the ends
  const traceW = 0.00055, traceGap = gridW / 12;
  const foilMatX = metal(0xd9a441, 0.95, 0.24);
  const rows = 6;
  const segL = gridL / (rows * 2);
  let x = -gridW / 2 + traceW / 2;
  while (x <= gridW / 2 - traceW / 2) {
    let z = -gridL / 2 + segL / 2;
    for (let i = 0; i < rows; i++) {
      const t = mesh(new THREE.BoxGeometry(traceW, 0.00028, segL * 1.05), foilMatX, x, 0, z, grid);
      z += segL * 2;
    }
    x += traceW + traceGap;
  }
  // connecting ends
  const endMat = metal(0xd9a441, 0.95, 0.24);
  for (const zEnd of [-gridL / 2, gridL / 2]) {
    const link = mesh(new THREE.BoxGeometry(gridW, 0.00028, 0.0008), endMat, 0, 0, zEnd, grid);
    link.visible = false;
  }
  g.add(grid);
  // solder pads (gold squares) at each grid end column
  const padMat = metal(0xffcf6e, 0.85, 0.3);
  for (const px of [-(gridW / 2 + 0.0012), gridW / 2 + 0.0012]) {
    mesh(new THREE.BoxGeometry(0.0026, 0.0006, 0.0026), padMat, px, 0.0003, 0, g);
  }
  g.userData.foilGrid = grid;
  return g;
}

/* ---------- PCB with MEMS / passives ---------- */
export function buildPCB(w, l, opts = {}) {
  const g = new THREE.Group();
  const board = mesh(new THREE.BoxGeometry(w, 0.0016, l), M.PCB(), 0, 0, 0, g);
  board.name = 'pcb-board';
  // copper edge + mounting holes
  const edge = mesh(new THREE.BoxGeometry(w + 0.0004, 0.0004, l - 0.002), metal(0xcaa04a, 0.7, 0.45), 0, 0.001, 0, g);
  // main MEMS IC (QFN) — never one giant chip
  const memS = opts.memsSize || 0.007;
  const mem = mesh(new THREE.BoxGeometry(memS, 0.0011, memS), new THREE.MeshStandardMaterial({ color: 0x0d1118, metalness: 0.2, roughness: 0.55 }), opts.memsPos?.[0] ?? 0, 0.0011, opts.memsPos?.[1] ?? 0, g);
  mesh(new THREE.BoxGeometry(memS * 0.55, 0.0002, memS * 0.55), metal(0x9aa8bd, 0.5, 0.3), mem.position.x, 0.00165, mem.position.z + memS * 0.12, g); // die marking
  // crystal
  mesh(new THREE.BoxGeometry(0.0032, 0.0009, 0.0025), M.ALU(), opts.crystalPos?.[0] ?? -0.014, 0.0013, opts.crystalPos?.[1] ?? 0.005, g);
  // caps + passives (small black/blue bodies, 0402/0603 style)
  const compPos = opts.comps || [[0.016, 0.004], [0.016, -0.004], [0.011, 0.01], [-0.008, 0.01], [0.006, -0.012], [-0.02, -0.006]];
  const compMats = [M.IC_BLACK(), M.IC_BLACK(), M.IC_BLACK(), new THREE.MeshStandardMaterial({ color: 0x2a4d6e, metalness: 0.2, roughness: 0.5 }), M.IC_BLACK(), new THREE.MeshStandardMaterial({ color: 0x3a2f1e, metalness: 0.3, roughness: 0.5 })];
  compPos.forEach((p, i) => {
    const s = 0.0009;
    mesh(new THREE.BoxGeometry(s, 0.0006, s * 1.6), compMats[i % compMats.length], p[0], 0.0011, p[1], g);
  });
  // header / pad row on one edge
  const padM = metal(0xcaa04a, 0.75, 0.4);
  for (let i = 0; i < 6; i++) {
    mesh(new THREE.BoxGeometry(0.0007, 0.0003, 0.0016), padM, -0.012 + i * 0.0024, 0.0009, -l / 2 + 0.0012, g);
  }
  return g;
}

/* ---------- engraved decal (canvas texture on a thin plate) ---------- */
export function makeDecal(text, w, h, opts = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#00000000';
  ctx.clearRect(0, 0, c.width, c.height);
  const font = `600 ${Math.round(64 * (opts.scale || 1))}px "Segoe UI", sans-serif`;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(0, 0, c.width, 0);
  grad.addColorStop(0, opts.c1 || '#9fb2c8');
  grad.addColorStop(0.5, opts.c2 || '#dbe6f4');
  grad.addColorStop(1, opts.c1 || '#9fb2c8');
  ctx.fillStyle = grad;
  ctx.fillText(text, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const meshObj = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: opts.opacity ?? 0.92, depthWrite: false })
  );
  meshObj.name = 'decal';
  meshObj.material.userData.decal = true;
  return meshObj;
}

/* ---------- coordinate axis triad ---------- */
export function buildTriad(len = 0.03, origin = new THREE.Vector3(0, 0, 0)) {
  const g = new THREE.Group();
  const add = (c, dir) => {
    const a = new THREE.ArrowHelper(new THREE.Vector3(...dir), origin, len, c, len * 0.22, len * 0.12);
    a.line.material.depthTest = false;
    a.cone.material.depthTest = false;
    g.add(a);
  };
  add(0xff5d5d, [1, 0, 0]);
  add(0x4fe0a0, [0, 1, 0]);
  add(0x4f8cff, [0, 0, 1]);
  return g;
}

/* ---------- exploded-part bookkeeping ---------- */
export function makePart(key, home) {
  return { key, group: home, axis: new THREE.Vector3(0, 1, 0), offset: 0, home: home.position.clone() };
}

/* dispose geometry/material of a group subtree (sensor switching).
   Shared geometries (userData.shared) are kept for reuse. */
export function disposeGroup(group) {
  group.traverse(o => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
      else {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    }
  });
}