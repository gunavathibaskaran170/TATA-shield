/* ============================================================
   SHIELD — Sensor / hardware mesh builder
   Reads the instrumentation config (js/config/sensors.js) and
   constructs recognizable, engineering-grade 3D placeholders:
   strain pads with direction arrows, IMU chips with axis triads,
   load cell, temperature probe, displacement head, and the
   SHIELD Edge Node enclosure.
   ============================================================ */

import * as THREE from 'three';
import { SENSORS, EDGE_NODE, HEALTH_COLOR } from '../config/sensors.js';
import { makeLabel } from './labels.js';

const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function metal(color, metalness = 0.85, roughness = 0.32) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function orientGroup(g, surfaceNormal, orient) {
  const n = new THREE.Vector3(...surfaceNormal).normalize();
  const o = new THREE.Vector3(...orient).normalize();
  const q1 = new THREE.Quaternion().setFromUnitVectors(Y, n);
  const o1 = o.clone().applyQuaternion(q1).normalize();
  const q2 = new THREE.Quaternion().setFromUnitVectors(Z, o1);
  g.quaternion.copy(q1.multiply(q2));
}

function addSelectionRing(g, radius = 0.022) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.0022, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0x38d9cf, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.004;
  ring.visible = false;
  g.add(ring);
  return ring;
}

function termination(g, x, y, z) {
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.002, 0.0045), metal(0xd9a441, 0.7, 0.4));
  t.position.set(x, y, z);
  g.add(t);
}

/* ---- Strain gauge: directional pad + double-arrow ---- */
function buildStrain(cfg) {
  const g = new THREE.Group();
  const health = HEALTH_COLOR[cfg.health] || HEALTH_COLOR.HEALTHY;

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.0016, 0.026),
    metal(0xdde5f0, 0.3, 0.4)
  );
  g.add(pad);
  // meander trace
  const trace = new THREE.Mesh(
    new THREE.BoxGeometry(0.0035, 0.0022, 0.018),
    metal(health, 0.4, 0.35)
  );
  g.add(trace);
  termination(g, 0, 0.002, 0.009);
  termination(g, 0, 0.002, -0.009);

  // double-headed measurement-direction arrow
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0011, 0.0011, 0.034, 8),
    metal(health, 0.2, 0.3)
  );
  shaft.rotation.x = Math.PI / 2;
  shaft.position.y = 0.007;
  g.add(shaft);
  for (const dir of [1, -1]) {
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.0034, 0.0065, 12),
      metal(health, 0.2, 0.3)
    );
    tip.rotation.x = dir === 1 ? -Math.PI / 2 : Math.PI / 2;
    tip.position.set(0, 0.007, dir * 0.018);
    g.add(tip);
  }

  orientGroup(g, cfg.surfaceNormal, cfg.orientation);
  g.position.set(...cfg.position);
  return g;
}

/* ---- IMU: chip with axis triad ---- */
function buildIMU(cfg) {
  const g = new THREE.Group();
  const health = HEALTH_COLOR[cfg.health] || HEALTH_COLOR.HEALTHY;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.004, 0.016), metal(0x2a3545, 0.6, 0.45));
  g.add(body);
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.0085, 0.005, 0.0085), metal(health, 0.3, 0.35));
  die.position.y = 0.004;
  g.add(die);

  const axis = (color, dir) => {
    const d = new THREE.Vector3(...dir).normalize();
    const a = new THREE.ArrowHelper(d, new THREE.Vector3(0, 0.005, 0), 0.014, color, 0.004, 0.0025);
    g.add(a);
  };
  axis(0xff5d5d, new THREE.Vector3(1, 0, 0));
  axis(0x4fe0a0, new THREE.Vector3(0, 1, 0));
  axis(0x4f8cff, new THREE.Vector3(0, 0, 1));

  orientGroup(g, cfg.surfaceNormal, cfg.orientation);
  g.position.set(...cfg.position);
  return g;
}

/* ---- Load cell: cylinder + ends + load arrow ---- */
function buildLoadCell(cfg) {
  const g = new THREE.Group();
  const health = HEALTH_COLOR[cfg.health] || HEALTH_COLOR.HEALTHY;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.026, 14), metal(0xcfd8e6, 0.9, 0.28));
  body.rotation.x = Math.PI / 2;
  g.add(body);
  for (const dir of [1, -1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.005, 14), metal(0x8fa0b5, 0.9, 0.3));
    cap.rotation.x = Math.PI / 2;
    cap.position.z = dir * 0.0155;
    g.add(cap);
  }
  // ribbon cable hint
  const cable = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.002, 0.02), metal(0x26c9bf, 0.2, 0.25));
  cable.position.set(0.012, 0.004, 0.0);
  g.add(cable);

  const a = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0.006, 0), 0.022, health, 0.005, 0.0035);
  g.add(a);

  orientGroup(g, cfg.surfaceNormal, cfg.orientation);
  g.position.set(...cfg.position);
  return g;
}

/* ---- Temperature: DS18B20 can ---- */
function buildTemp(cfg) {
  const g = new THREE.Group();
  const health = HEALTH_COLOR[cfg.health] || HEALTH_COLOR.HEALTHY;
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.026, 16), metal(0x9aa8bd, 0.85, 0.3));
  can.position.y = 0.013;
  g.add(can);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.0053, 0.0053, 0.004, 16), metal(health, 0.3, 0.3));
  stripe.position.y = 0.020;
  g.add(stripe);
  for (let i = 0; i < 3; i++) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.008, 6), metal(0xd9a441, 0.7, 0.4));
    pin.position.set(-0.0025 + i * 0.0025, 0, 0);
    g.add(pin);
  }
  orientGroup(g, cfg.surfaceNormal, cfg.orientation);
  g.position.set(...cfg.position);
  return g;
}

/* ---- Displacement: bracket + downward measuring beam ---- */
function buildDisp(cfg) {
  const g = new THREE.Group();
  const health = HEALTH_COLOR[cfg.health] || HEALTH_COLOR.HEALTHY;
  const pos = cfg.position;

  // bracket rail clamp (placeholder contact)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), metal(0x39404e, 0.7, 0.5));
  g.add(head);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 0.006, 12), metal(health, 0.2, 0.25));
  lens.position.y = -0.009;
  g.add(lens);
  // measurement beam (dashed) down to member
  const mat = new THREE.LineDashedMaterial({
    color: health, dashSize: 0.006, gapSize: 0.004, transparent: true, opacity: 0.85,
  });
  const pts = [
    new THREE.Vector3(0, -0.004, 0),
    new THREE.Vector3(0, -0.026, 0),
  ];
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
  line.computeLineDistances();
  g.add(line);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.002, 10, 10), metal(health, 0.2, 0.2));
  dot.position.y = -0.027;
  g.add(dot);

  orientGroup(g, cfg.surfaceNormal, [0, -1, 0]);   // measures downward
  g.position.set(...pos);
  return g;
}

/* ---- SHIELD Edge Node enclosure ---- */
function buildEdgeNode() {
  const g = new THREE.Group();
  const pos = EDGE_NODE.position;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.036, 0.026),
    new THREE.MeshStandardMaterial({ color: 0x232b36, metalness: 0.82, roughness: 0.34 })
  );
  body.castShadow = true;
  g.add(body);

  // machined rim of the enclosure mouth
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.003, 0.030),
    metal(0x7c8ea8, 0.9, 0.3)
  );
  rim.position.y = 0.0175;
  g.add(rim);

  // hinged lid, shown open
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.018, -0.015);
  lidPivot.rotation.x = -2.0;
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.004, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x38d9cf, metalness: 0.85, roughness: 0.28 })
  );
  lid.position.set(0, 0.002, 0.015);
  lid.castShadow = true;
  lidPivot.add(lid);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.086, 8), metal(0x9aa8bd, 0.9, 0.3));
  hinge.rotation.z = Math.PI / 2;
  lidPivot.add(hinge);
  g.add(lidPivot);

  // ---- visible PCB inside the enclosure ----
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.0022, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x1c5c33, metalness: 0.1, roughness: 0.6 }));
  pcb.position.y = 0.004;
  g.add(pcb);
  const esp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.003, 0.014), metal(0x2a3545, 0.5, 0.5));
  esp.position.set(-0.018, 0.0065, 0);
  g.add(esp);
  const adc = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.004, 0.01), metal(0x11151c, 0.4, 0.6));
  adc.position.set(0.012, 0.007, -0.003);
  g.add(adc);
  const terminal = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, 0.008),
    new THREE.MeshStandardMaterial({ color: 0xff7a1a, metalness: 0.1, roughness: 0.6 }));
  terminal.position.set(0.026, 0.008, 0.007);
  g.add(terminal);
  for (let ci = 0; ci < 2; ci++) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.007, 10), metal(0xcfd8e6, 0.9, 0.3));
    cap.position.set(0.028 - ci * 0.012, 0.0085, -0.006);
    g.add(cap);
  }

  // vents
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.002, 0.022),
      metal(0x0a0e14, 0.4, 0.6)
    );
    vent.position.set(-0.032 + i * 0.018, 0.022, 0);
    g.add(vent);
  }

  // front facet with LED indicators
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.032, 0.002),
    metal(0x1a212b, 0.8, 0.4)
  );
  face.position.set(0, 0, 0.014);
  g.add(face);

  const ledColors = [0x4fe0a0, 0x38d9cf, 0xf2b94e]; // pwr / link / stat
  const ledNames = ['PWR', 'LINK', 'STAT'];
  ledColors.forEach((c, i) => {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.0024, 10, 10), new THREE.MeshBasicMaterial({ color: c }));
    led.position.set(-0.036 + i * 0.009, 0.0, 0.0162);
    g.add(led);
  });
  ledNames.forEach((n, i) => {
    const lb = makeLabel(n, { color: '#5f7088', spriteScale: 0.016 });
    lb.position.set(-0.036 + i * 0.009, 0.0085, 0.018);
    g.add(lb);
  });

  // cable glands + loom running into the chassis (orange HV + red/blue signal)
  const glandXs = [0.02, 0.03, 0.04];
  const cableSpecs = [
    { color: 0xff7a1a, r: 0.0038, end: new THREE.Vector3(0.02, -0.03, 0.14), sag: -0.028 },
    { color: 0xff5555, r: 0.002, end: new THREE.Vector3(-0.012, -0.02, 0.15), sag: -0.034 },
    { color: 0x4f8cff, r: 0.002, end: new THREE.Vector3(-0.03, -0.01, 0.145), sag: -0.03 },
  ];
  cableSpecs.forEach((c, i) => {
    const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0048, 0.01, 8), metal(0x0d1219, 0.6, 0.5));
    gland.rotation.x = Math.PI / 2;
    gland.position.set(glandXs[i] - 0.03, -0.004, 0.017);
    g.add(gland);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(glandXs[i] - 0.03, -0.004, 0.02),
      new THREE.Vector3(glandXs[i] - 0.03, c.sag, 0.07),
      c.end,
    ]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, c.r, 7),
      new THREE.MeshStandardMaterial({ color: c.color, metalness: 0.15, roughness: 0.55 })
    );
    g.add(tube);
  });

  // antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0026, 0.028, 10), metal(0x9aa8bd, 0.9, 0.3));
  ant.position.set(0.035, 0.034, 0);
  g.add(ant);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0018, 0.008, 8), metal(0x38d9cf, 0.7, 0.3));
  tip.position.set(0.035, 0.052, 0);
  g.add(tip);

  // label plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.0012), metal(0x0d1219, 0.5, 0.5));
  plate.position.set(0, -0.006, 0.0152);
  g.add(plate);
  const plateTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0d1219'; ctx.fillRect(0, 0, 256, 64);
    ctx.font = '600 30px "Segoe UI", sans-serif';
    ctx.fillStyle = '#38d9cf'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SHIELD EDGE NODE', 128, 34);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.048, 0.012), plateMat);
  decal.position.set(0, -0.006, 0.0159);
  g.add(decal);

  // mounting riser
  const riser = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.02, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x0a0f17, metalness: 0.5, roughness: 0.5 })
  );
  riser.position.y = -0.028;
  g.add(riser);

  g.position.set(...pos);
  g.rotation.y = -Math.PI / 2;   // face the vehicle
  return g;
}

/* ============================================================ */

export function buildSensorRig() {
  const group = new THREE.Group();
  const sensors = new Map();
  const anchors = new Map();

  for (const cfg of SENSORS) {
    let root;
    switch (cfg.type) {
      case 'strain': root = buildStrain(cfg); break;
      case 'imu': root = buildIMU(cfg); break;
      case 'load': root = buildLoadCell(cfg); break;
      case 'temp': root = buildTemp(cfg); break;
      case 'disp': root = buildDisp(cfg); break;
      default: continue;
    }
    root.userData.sensorId = cfg.id;
    root.userData.clickable = true;
    root.userData.pickable = true;

    // label
    const label = makeLabel(cfg.id, {
      color: cfg.health === 'OFFLINE' ? '#aeb8c8' : '#eef5ff',
      bg: 'rgba(6, 11, 18, 0.62)',
      spriteScale: 0.02,
    });
    const bb = new THREE.Box3().setFromObject(root);
    const top = bb.max.y + 0.016;
    label.position.set(0, top, 0);
    root.add(label);
    root.userData.label = label;

    const ring = addSelectionRing(root, cfg.type === 'disp' ? 0.026 : 0.02);
    root.userData.ring = ring;

    group.add(root);
    sensors.set(cfg.id, root);
    anchors.set(cfg.id, new THREE.Vector3(...cfg.position).setY(bb.max.y + 0.016));
  }

  const edge = buildEdgeNode();
  edge.userData.edgeNode = true;
  edge.userData.pickable = true;
  sensors.set(EDGE_NODE.id, edge);
  anchors.set(EDGE_NODE.id, new THREE.Vector3(...EDGE_NODE.position).setY(EDGE_NODE.position[1] + 0.03));
  group.add(edge);

  return { group, sensors, anchors, edgeNode: edge };
}

/* Opacity helper for sensor fading during filters */
export function setSensorOpacity(root, opacity) {
  root.traverse(o => {
    if (o.isMesh || o.isSprite) {
      o.material.transparent = true;
      o.material.opacity = opacity;
      o.material.needsUpdate = true;
    }
  });
  if (root.userData.label) root.userData.label.material.opacity = opacity;
  if (root.userData.ring && !root.userData.ring.visible) {
    // keep ring invisible; only fade ring when it is shown
    root.userData.ring.material.opacity = opacity;
  }
}

export function resetAllSensorOpacity(sensors) {
  for (const [id, root] of sensors) {
    setSensorOpacity(root, 1);
  }
}