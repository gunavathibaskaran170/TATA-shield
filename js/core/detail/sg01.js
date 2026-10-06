/* ============================================================
   SHIELD — Sensor Lab — StrainGaugeSensor family builder
   One physical architecture shared by SG01 / SG02 (and later
   SG03 / SG04) — driven entirely by sensorConfig:
      base plate + M6 bolts -> aluminium housing -> signal PCB
      -> mounted 350 Ω serpentine foil gauge -> protective cover
      -> gland / shielded cable / M12-4pin.
   The foil gauge measures along the sensor +Z (longitudinal)
   axis. Built in metres; origin = base bottom centre.
   ============================================================ */

import * as THREE from 'three';
import { SENSOR_LAB } from '../../config/sensorDetail.js';
import {
  mesh, metal, M, roundedBox, boltM6, buildGland, buildCable,
  buildM12, buildStrainFoil, buildPCB, makeDecal, makePart, tag,
} from './shared.js';

const mm = v => v * 0.001;

export function buildStrainGauge(cfg) {
  const D = cfg.dims;                        // mm (conceptual prototype body)
  const MNT = cfg.mount || { span: 42 };     // mounting centre distance (mm)
  const span = mm(MNT.span);
  const boltX = [-span / 2, span / 2];

  const group = new THREE.Group();
  const parts = new Map();
  const refs = {};

  const addPart = (key) => {
    const g = new THREE.Group();
    g.userData.home = new THREE.Vector3();
    group.add(g);
    const def = cfg.parts.find(p => p.key === key);
    const part = { key, group: g, axis: new THREE.Vector3(0, 1, 0), offset: mm(def.expl) };
    parts.set(key, part);
    return g;
  };

  /* ---------- base mounting plate ---------- */
  const base = addPart('basePlate');
  {
    const mat = M.ALU_DARK();
    const plate = mesh(roundedBox(mm(D.l + 4), mm(2.5), mm(D.w + 4), mm(0.8)), mat, 0, mm(1.25), 0, base, 'base-plate');
    plate.castShadow = true;
    // 2 × Ø6 through bores @ mounting centre distance
    for (const sx of boltX) {
      const hole = mesh(new THREE.CylinderGeometry(mm(3.1), mm(3.1), mm(3), 16), M.POLY(), sx, mm(1.25), 0, base);
      hole.rotation.x = 0;
      // counterbore ring
      const ring = mesh(new THREE.TorusGeometry(mm(3.1), mm(0.5), 8, 20), metal(0x8fa0b5, 0.9, 0.3), sx, mm(2.52), 0, base);
      ring.rotation.x = Math.PI / 2;
    }
    // engraved base marking
    base.add(makeDecal(`${cfg.id} · SHIELD`, mm(D.l * 0.4), mm(3), { c1: '#5f7088', c2: '#aebdd6', opacity: 0.5 }));
  }

  /* ---------- mounting bolts (2 × M6) ---------- */
  const bol = addPart('bolts');
  for (const sx of boltX) {
    const b = boltM6();
    b.position.set(sx, mm(2.5) + mm(0.5), 0);
    bol.add(b);
  }

  /* ---------- housing (dims.l × (dims.h-6) × dims.w) ---------- */
  const housing = addPart('housing');
  {
    const mat = M.ALU();
    const body = mesh(roundedBox(mm(D.l), mm(D.h - 6), mm(D.w), mm(1.6)), mat, 0, mm((D.h - 1) / 2), 0, housing, 'sg-housing');
    body.castShadow = true;
    // machined mouth inset
    const inset = mesh(roundedBox(mm(D.l - 6), mm(0.8), mm(D.w - 6), mm(0.6)), M.ALU_DARK(), 0, mm(D.h - 3.3), 0, housing);
    // side breather grooves (cosmetic machining)
    for (const zz of [-0.008, 0.008]) {
      mesh(new THREE.BoxGeometry(mm(0.7), mm(6), mm(2)), M.ALU_DARK(), -mm(D.l / 2 + 0.8), mm((D.h - 1) / 2), zz, housing);
      mesh(new THREE.BoxGeometry(mm(0.7), mm(6), mm(2)), M.ALU_DARK(), mm(D.l / 2 + 0.8), mm((D.h - 1) / 2), zz, housing);
    }
    refs.housingMat = mat;
  }

  /* ---------- signal conditioning PCB ---------- */
  const pcb = addPart('pcb');
  {
    const b = buildPCB(mm(D.l * 0.6), mm(D.w * 0.63), {
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
    const subW = mm(D.l * 0.4), subL = mm(D.w * 0.4);
    const foil = buildStrainFoil(subW, subL, subW * 0.65, subL * 0.68);
    foil.position.set(0, mm(7.55), 0);
    gauge.add(foil);
    refs.foil = foil;
    refs.foilGrid = foil.userData.foilGrid;
    refs.foilMat = foil.children[0].material;
    // signal wire nubs (gold) from pads
    const wireMat = metal(0xd9a441, 0.8, 0.35);
    for (const px of [subW * -0.41, subW * 0.41]) {
      const w = mesh(new THREE.CylinderGeometry(mm(0.35), mm(0.35), mm(2.2), 8), wireMat, px, mm(7.5), 0, gauge);
    }
  }

  /* ---------- protective top cover ---------- */
  const cover = addPart('cover');
  {
    const mat = M.ALU();
    const cov = mesh(roundedBox(mm(D.l), mm(3.5), mm(D.w), mm(1.2)), mat, 0, mm(D.h - 1.75), 0, cover, 'sg-cover');
    cov.castShadow = true;
    const dec = makeDecal(`${cfg.id} · SHIELD`, mm(D.l * 0.6), mm(4.2), { c1: '#4fe0a0', c2: '#bff6ea' });
    dec.position.set(0, mm(D.h + 0.15), 0);
    cover.add(dec);
    refs.coverMat = mat;
    refs.coverDecal = dec;
  }

  /* ---------- gland + shielded cable + M12 connector ---------- */
  const cable = addPart('cable');
  {
    const gland = buildGland(mm(3.6), mm(9), mm(4.4));
    gland.position.set(0, mm(8.5), mm(D.w / 2 + 0.5));
    cable.add(gland);
    const c = buildCable([
      [0, mm(8.5), mm(D.w / 2 + 5)],
      [0, mm(6.2), mm(D.w / 2 + 17)],
      [0, mm(7.6), mm(D.w / 2 + 31)],
      [0, mm(12), mm(D.w / 2 + 49)],
    ], mm(2.1));
    cable.add(c.tube);
    refs.cableTube = c.tube;
  }
  const conn = addPart('connector');
  {
    const c = buildM12(4);
    c.position.set(0, mm(12), mm(D.w / 2 + 53));
    conn.add(c);
  }

  /* ---------- part tagging (pickable) + homes ---------- */
  for (const [key, part] of parts) {
    tag(part.group, key, cfg.parts.find(p => p.key === key).label);
  }

  /* ---------- anatomy anchors (config mm -> local vectors) ---------- */
  const labels = cfg.labels.map(l => ({
    key: l.key,
    text: l.text,
    sub: l.sub,
    anchor: new THREE.Vector3(mm(l.anchor[0]), mm(l.anchor[1]), mm(l.anchor[2])),
  }));

  return { group, parts, refs, labels, cfg, id: cfg.id };
}

/* SG01 / SG02 are the same StrainGaugeSensor family — identical
   geometry, different config (id, position, telemetry, status). */
export const buildSG01 = () => buildStrainGauge(SENSOR_LAB.SG01);
export const buildSG02 = () => buildStrainGauge(SENSOR_LAB.SG02);