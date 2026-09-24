/* ============================================================
   SHIELD — Sensor Lab — SG01 strain gauge sensor assembly
   Real interactive 3D geometry (no image planes):
      base plate + M6 bolts -> aluminium housing -> signal PCB
      -> mounted 350 Ω serpentine foil gauge -> protective cover
      -> gland / shielded cable / M12-4pin.
   Built in metres; origin = base bottom centre; +Z = measured
   (longitudinal) axis.
   ============================================================ */

import * as THREE from 'three';
import { SENSOR_LAB } from '../../config/sensorDetail.js';
import {
  mesh, metal, M, roundedBox, boltM6, buildGland, buildCable,
  buildM12, buildStrainFoil, buildPCB, makeDecal, makePart, tag,
} from './shared.js';

const CFG = SENSOR_LAB.SG01;
const D = CFG.dims;                       // mm
const mm = v => v * 0.001;

export function buildSG01() {
  const group = new THREE.Group();
  const parts = new Map();
  const refs = {};

  const addPart = (key) => {
    const g = new THREE.Group();
    g.userData.home = new THREE.Vector3();
    group.add(g);
    const def = CFG.parts.find(p => p.key === key);
    const part = { key, group: g, axis: new THREE.Vector3(0, 1, 0), offset: mm(def.expl) };
    parts.set(key, part);
    return g;
  };

  /* ---------- base mounting plate ---------- */
  const base = addPart('basePlate');
  {
    const mat = M.ALU_DARK();
    const plate = mesh(roundedBox(mm(54), mm(2.5), mm(39), mm(0.8)), mat, 0, mm(1.25), 0, base, 'base-plate');
    plate.castShadow = true;
    // 2 × Ø6 through bores
    for (const sx of [-0.021, 0.021]) {
      const hole = mesh(new THREE.CylinderGeometry(mm(3.1), mm(3.1), mm(3), 16), M.POLY(), sx, mm(1.25), 0, base);
      hole.rotation.x = 0;
      // counterbore ring
      const ring = mesh(new THREE.TorusGeometry(mm(3.1), mm(0.5), 8, 20), metal(0x8fa0b5, 0.9, 0.3), sx, mm(2.52), 0, base);
      ring.rotation.x = Math.PI / 2;
    }
    // engraved base marking
    base.add(makeDecal('SG01 · SHIELD', mm(20), mm(3), { c1: '#5f7088', c2: '#aebdd6', opacity: 0.5 }));
  }

  /* ---------- mounting bolts (2 × M6) ---------- */
  const bol = addPart('bolts');
  for (const sx of [-0.021, 0.021]) {
    const b = boltM6();
    b.position.set(sx, mm(2.5) + mm(0.5), 0);
    bol.add(b);
  }

  /* ---------- housing ---------- */
  const housing = addPart('housing');
  {
    const mat = M.ALU();
    const body = mesh(roundedBox(mm(50), mm(14), mm(35), mm(1.6)), mat, 0, mm(9.5), 0, housing, 'sg-housing');
    body.castShadow = true;
    // machined mouth inset
    const inset = mesh(roundedBox(mm(44), mm(0.8), mm(29), mm(0.6)), M.ALU_DARK(), 0, mm(16.7), 0, housing);
    // side breather grooves (cosmetic machining)
    for (const zz of [-0.008, 0.008]) {
      mesh(new THREE.BoxGeometry(mm(0.7), mm(6), mm(2)), M.ALU_DARK(), -mm(25.8), mm(9.5), zz, housing);
      mesh(new THREE.BoxGeometry(mm(0.7), mm(6), mm(2)), M.ALU_DARK(), mm(25.8), mm(9.5), zz, housing);
    }
    refs.housingMat = mat;
  }

  /* ---------- signal conditioning PCB ---------- */
  const pcb = addPart('pcb');
  {
    const b = buildPCB(mm(30), mm(22), {
      memsSize: 0.0065,
      crystalPos: [-0.008, 0.004],
      comps: [[0.008, 0.005], [0.008, -0.005], [0.004, 0.01], [-0.006, 0.009], [0.004, -0.011], [-0.012, -0.006]],
    });
    b.position.set(0, mm(4), -0.0035);
    pcb.add(b);
    refs.pcb = b;
  }

  /* ---------- foil strain gauge (bonded on sensing surface) ---------- */
  const gauge = addPart('gauge');
  {
    const foil = buildStrainFoil(mm(20), mm(14), mm(13), mm(9.5));
    foil.position.set(0, mm(7.55), 0);
    gauge.add(foil);
    refs.foil = foil;
    refs.foilGrid = foil.userData.foilGrid;
    refs.foilMat = foil.children[0].material;
    // signal wire nubs (gold) from pads
    const wireMat = metal(0xd9a441, 0.8, 0.35);
    for (const px of [-0.0082, 0.0082]) {
      const w = mesh(new THREE.CylinderGeometry(mm(0.35), mm(0.35), mm(2.2), 8), wireMat, px, mm(7.5), 0, gauge);
    }
  }

  /* ---------- protective top cover ---------- */
  const cover = addPart('cover');
  {
    const mat = M.ALU();
    const cov = mesh(roundedBox(mm(50), mm(3.5), mm(35), mm(1.2)), mat, 0, mm(18.25), 0, cover, 'sg-cover');
    cov.castShadow = true;
    const dec = makeDecal('SG01 · SHIELD', mm(30), mm(4.2), { c1: '#4fe0a0', c2: '#bff6ea' });
    dec.position.set(0, mm(20.15), 0);
    cover.add(dec);
    refs.coverMat = mat;
    refs.coverDecal = dec;
  }

  /* ---------- gland + shielded cable + M12 connector ---------- */
  const cable = addPart('cable');
  {
    const gland = buildGland(mm(3.6), mm(9), mm(4.4));
    gland.position.set(0, mm(8.5), mm(17.5));
    cable.add(gland);
    const c = buildCable([
      [0, mm(8.5), mm(22)],
      [0, mm(6.2), mm(34)],
      [0, mm(7.6), mm(48)],
      [0, mm(12), mm(66)],
    ], mm(2.1));
    cable.add(c.tube);
    refs.cableTube = c.tube;
  }
  const conn = addPart('connector');
  {
    const c = buildM12(4);
    c.position.set(0, mm(12), mm(70));
    conn.add(c);
  }

  /* ---------- part tagging (pickable) + homes ---------- */
  for (const [key, part] of parts) {
    tag(part.group, key, CFG.parts.find(p => p.key === key).label);
  }

  /* ---------- anatomy anchors (config mm -> local vectors) ---------- */
  const labels = CFG.labels.map(l => ({
    key: l.key,
    text: l.text,
    sub: l.sub,
    anchor: new THREE.Vector3(mm(l.anchor[0]), mm(l.anchor[1]), mm(l.anchor[2])),
  }));

  return { group, parts, refs, labels, cfg: CFG, id: 'SG01' };
}