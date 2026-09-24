/* ============================================================
   SHIELD — Sensor Lab — IMUSensor family builder
   One physical architecture shared by IMU01 / IMU02 (front and
   rear stations): blue anodized base housing -> silicone damping
   layer -> IMU PCB (MEMS + conditioning) -> sealing gasket ->
   top cover (4 × M6 screws) + gland / shielded cable / M12-6pin
   + body-fixed XYZ triad (X red · Y green · Z blue).
   Driven entirely by sensorConfig. Built in metres; origin =
   base bottom centre.
   ============================================================ */

import * as THREE from 'three';
import { SENSOR_LAB } from '../../config/sensorDetail.js';
import {
  mesh, metal, M, roundedBox, boltM6, buildGland, buildCable,
  buildM12, buildPCB, makeDecal, buildTriad, makePart, tag,
} from './shared.js';

const mm = v => v * 0.001;

export function buildIMU(cfg) {
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

  /* ---------- base housing (blue anodized, 4 × Ø6 bores) ---------- */
  const base = addPart('baseHousing');
  {
    const mat = M.ANOD_BLUE();
    const body = mesh(roundedBox(mm(60), mm(8), mm(45), mm(1.8)), mat, 0, mm(4), 0, base, 'imu-base');
    body.castShadow = true;
    // machined mouth step for the gasket
    mesh(roundedBox(mm(52), mm(1.2), mm(38), mm(0.8)), M.ANOD_DEEP(), 0, mm(7.6), 0, base);
    // 4 × Ø6 mounting bores (corner studs)
    for (const sx of [-0.024, 0.024]) {
      for (const sz of [-0.015, 0.015]) {
        const hole = mesh(new THREE.CylinderGeometry(mm(3.1), mm(3.1), mm(9), 16), M.POLY(), sx, mm(4), sz, base);
        mesh(new THREE.TorusGeometry(mm(3.1), mm(0.45), 8, 20), metal(0x9fb8d8, 0.75, 0.35), sx, mm(8.1), sz, base)
          .rotation.x = Math.PI / 2;
      }
    }
    refs.baseMat = mat;
  }

  /* ---------- vibration-isolation damping layer ---------- */
  const damp = addPart('damping');
  {
    const pad = mesh(roundedBox(mm(53), mm(2), mm(39), mm(1)), M.SILICONE(), 0, mm(9), 0, damp, 'imu-damping');
    // studs over the mounting bores (cable route holes)
    for (const sx of [-0.024, 0.024]) for (const sz of [-0.015, 0.015]) {
      mesh(new THREE.CylinderGeometry(mm(3.4), mm(3.4), mm(2), 12), M.SILICONE(), sx, mm(9), sz, damp);
    }
    refs.dampingMat = pad.material;
  }

  /* ---------- IMU PCB with MEMS ---------- */
  const pcb = addPart('pcb');
  {
    const b = buildPCB(mm(50), mm(38), {
      memsSize: 0.008,
      memsPos: [0, 0],
      crystalPos: [0.012, 0.007],
      comps: [[0.018, -0.004], [-0.012, 0.009], [0.006, 0.013], [-0.006, 0.013], [0.018, 0.009], [-0.018, -0.008], [0, -0.014], [0.012, -0.013]],
    });
    b.position.set(0, mm(10.3), 0);
    pcb.add(b);
    refs.pcb = b;
    refs.pcbMems = b.children[2];   // flagged for selection highlight
  }

  /* ---------- perimeter sealing gasket ---------- */
  const gas = addPart('gasket');
  {
    const mat = M.GASKET_RB();
    const frame = mesh(roundedBox(mm(60), mm(1.6), mm(45), mm(1.3)), mat, 0, mm(15.8), 0, gas, 'imu-gasket');
    refs.gasketMat = mat;
  }

  /* ---------- top cover ---------- */
  const cover = addPart('cover');
  {
    const mat = M.ANOD_BLUE();
    const cov = mesh(roundedBox(mm(60), mm(9), mm(45), mm(2)), mat, 0, mm(20.5), 0, cover, 'imu-cover');
    cov.castShadow = true;
    // cover boss (gland mount) on +Z end
    const boss = mesh(new THREE.CylinderGeometry(mm(6), mm(6), mm(2.4), 20), M.ANOD_DEEP(), 0, mm(24.2), mm(21.5), cover);
    boss.rotation.x = Math.PI / 2;
    // engraved marking
    const dec = makeDecal(`${cfg.id} · SHIELD`, mm(34), mm(5), { c1: '#4f8cff', c2: '#d9ecff' });
    dec.position.set(0, mm(25.15), 0);
    cover.add(dec);
    const decSub = makeDecal(cfg.coverSub || '6-DOF INERTIAL MEASUREMENT UNIT', mm(40), mm(2.6), { c1: '#6d8bb8', c2: '#9fc0f0', scale: 0.62, opacity: 0.6 });
    decSub.position.set(0, mm(25.15), mm(9));
    cover.add(decSub);
    refs.coverMat = mat;
    refs.coverDecal = dec;
  }

  /* ---------- 4 × M6 corner screws ---------- */
  const bol = addPart('bolts');
  for (const sx of [-0.024, 0.024]) {
    for (const sz of [-0.015, 0.015]) {
      const b = boltM6();
      b.position.set(sx, mm(25), sz);
      bol.add(b);
    }
  }

  /* ---------- gland + cable + M12 connector ---------- */
  const cable = addPart('cable');
  {
    const gland = buildGland(mm(3.8), mm(9), mm(4.6));
    gland.position.set(0, mm(23.4), mm(23.6));
    gland.rotation.y = 0;
    cable.add(gland);
    const c = buildCable([
      [0, mm(23.2), mm(29)],
      [0, mm(20), mm(42)],
      [0, mm(22), mm(56)],
      [0, mm(26), mm(74)],
    ], mm(2.2));
    cable.add(c.tube);
    refs.cableTube = c.tube;
  }
  const conn = addPart('connector');
  {
    const c = buildM12(6);
    c.position.set(0, mm(22.5), mm(76));
    conn.add(c);
  }

  /* ---------- body-fixed XYZ triad ---------- */
  const axes = addPart('axes');
  {
    const tr = buildTriad(mm(34), new THREE.Vector3(0, 0, 0));
    tr.position.set(0, mm(30), 0);
    axes.add(tr);
    refs.triad = tr;
  }

  /* ---------- part tagging ---------- */
  for (const [key, part] of parts) {
    tag(part.group, key, cfg.parts.find(p => p.key === key).label);
  }

  /* ---------- anatomy anchors ---------- */
  const labels = cfg.labels.map(l => ({
    key: l.key,
    text: l.text,
    sub: l.sub,
    anchor: new THREE.Vector3(mm(l.anchor[0]), mm(l.anchor[1]), mm(l.anchor[2])),
  }));

  return { group, parts, refs, labels, cfg, id: cfg.id };
}

/* IMU01 / IMU02 are the same IMUSensor family — identical
   geometry, different config (station, id, telemetry). */
export const buildIMU01 = () => buildIMU(SENSOR_LAB.IMU01);
export const buildIMU02 = () => buildIMU(SENSOR_LAB.IMU02);