/* ============================================================
   SHIELD — Detailed wheel / suspension corner assembly (v2)
   "Every nook and corner": treaded tyre (instanced blocks),
   5-spoke alloy rim, drilled brake disc, gold caliper, hub with
   studs, double-wishbone arms, coil-over strut, steering knuckle
   and tie rod.

   Local frame: origin = wheel hub centre, +x = OUTBOARD,
   +y = up, +z = forward.  Left-hand corners are placed with
   rotation.y = π so one build serves both sides.

   Shared by the chassis (4 corners) and the Wheel Assembly poster.
   ============================================================ */

import * as THREE from 'three';

/* ---- material palette ---- */
const TYRE_MAT   = () => new THREE.MeshStandardMaterial({ color: 0x0d1015, roughness: 0.95, metalness: 0.05 });
const TREAD_MAT  = () => new THREE.MeshStandardMaterial({ color: 0x080a0e, roughness: 0.9, metalness: 0.06 });
const SIDEWALL   = () => new THREE.MeshStandardMaterial({ color: 0x171c24, roughness: 0.72, metalness: 0.08 });
const ALLOY      = () => new THREE.MeshStandardMaterial({ color: 0xaebccb, metalness: 0.95, roughness: 0.22 });
const ALLOY_DARK = () => new THREE.MeshStandardMaterial({ color: 0x55616f, metalness: 0.9, roughness: 0.34 });
const STEEL      = () => new THREE.MeshStandardMaterial({ color: 0x8794a6, metalness: 0.92, roughness: 0.3 });
const DISC_MAT   = () => new THREE.MeshStandardMaterial({ color: 0x6b7787, metalness: 0.94, roughness: 0.36 });
const HOLE_MAT   = () => new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.8, metalness: 0.2 });
const GOLD       = () => new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.78, roughness: 0.3 });
const DARK_M     = () => new THREE.MeshStandardMaterial({ color: 0x2a3341, metalness: 0.8, roughness: 0.44 });
const SPRING_M   = () => new THREE.MeshStandardMaterial({ color: 0xf2b94e, metalness: 0.55, roughness: 0.3 });
const RUBBER_B   = () => new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.85, metalness: 0.1 });
const POLISH    = () => new THREE.MeshStandardMaterial({ color: 0xdfe8f6, metalness: 1.0, roughness: 0.12 });
const BOLT_M     = () => new THREE.MeshStandardMaterial({ color: 0xe3ebf6, metalness: 0.98, roughness: 0.22 });

function m(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}
/* cylinder whose axis lies along X */
function cylX(r, h, mat, x = 0, y = 0, z = 0, seg = 24) {
  const o = m(new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z);
  o.rotation.z = Math.PI / 2;
  return o;
}
/* structural tube between two points */
function tube(a, b, r, mat) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const o = m(new THREE.CylinderGeometry(r, r, len, 10), mat);
  o.position.copy(a).addScaledVector(dir, 0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return o;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ------------------------------------------------------------
   Tyre: lathed carcass + instanced directional tread blocks
------------------------------------------------------------ */
function buildTyre() {
  const g = new THREE.Group();
  g.name = 'tyre';

  const profile = [
    [0.0305, -0.019], [0.0375, -0.0187], [0.0432, -0.0166],
    [0.0454, -0.0138], [0.0446, -0.0112],
    [0.0446, 0.0112],
    [0.0454, 0.0138], [0.0432, 0.0166], [0.0375, 0.0187],
    [0.0305, 0.019],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const lathe = m(
    new THREE.LatheGeometry(profile, 48),
    TYRE_MAT());
  lathe.rotation.z = Math.PI / 2;               // lathe axis Y -> X
  g.add(lathe);

  /* bead rings + sidewall ridge (both sides) */
  for (const s of [-1, 1]) {
    const bead = m(new THREE.TorusGeometry(0.0318, 0.0016, 6, 40), SIDEWALL(), 0, 0, 0);
    bead.rotation.y = Math.PI / 2;
    bead.position.x = s * 0.0186;
    g.add(bead);
    const ridge = m(new THREE.TorusGeometry(0.0425, 0.0011, 6, 44), SIDEWALL(), 0, 0, 0);
    ridge.rotation.y = Math.PI / 2;
    ridge.position.x = s * 0.0148;
    g.add(ridge);
  }

  /* directional tread: 5 ribs x 40 staggered blocks (one InstancedMesh) */
  const N = 40, RIBS = [-0.0105, -0.0053, 0, 0.0053, 0.0105];
  // box axes: x = along wheel axis, y = radial, z = tangent (a = 0 => top)
  const geo = new THREE.BoxGeometry(0.0044, 0.0034, 0.005);
  const blocks = new THREE.InstancedMesh(geo, TREAD_MAT(), N * RIBS.length);
  const dummy = new THREE.Object3D();
  const R = 0.0458;                             // block seat radius
  let i = 0;
  RIBS.forEach((ribX, ri) => {
    const stagger = (ri % 2 ? Math.PI / N : 0) + ri * 0.11;  // spiral/directional look
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2 + stagger;
      dummy.position.set(ribX, R * Math.cos(a), R * Math.sin(a));
      dummy.rotation.set(a, 0, 0);
      dummy.updateMatrix();
      blocks.setMatrixAt(i++, dummy.matrix);
    }
  });
  blocks.instanceMatrix.needsUpdate = true;
  blocks.castShadow = true;
  blocks.name = 'treadBlocks';
  g.add(blocks);

  return g;
}

/* ------------------------------------------------------------
   5-spoke alloy rim (barrel + face + spokes + lug nuts)
------------------------------------------------------------ */
function buildRim() {
  const g = new THREE.Group();
  g.name = 'rim';

  // open barrel + outer/inner lips
  const barrel = m(new THREE.CylinderGeometry(0.0285, 0.0285, 0.036, 40, 1, true), ALLOY());
  barrel.rotation.z = Math.PI / 2;
  g.add(barrel);
  for (const s of [-1, 1]) {
    const lip = m(new THREE.TorusGeometry(0.0285, 0.0022, 8, 44), ALLOY(), s * 0.0175, 0, 0);
    lip.rotation.y = Math.PI / 2;
    g.add(lip);
  }
  // 5 spokes — open design (gaps show the disc behind); two stacked
  // boxes give each spoke a subtle taper from hub to rim
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Group();
    const s1 = m(new THREE.BoxGeometry(0.007, 0.017, 0.0068), ALLOY(), 0, 0.017, 0);
    const s2 = m(new THREE.BoxGeometry(0.007, 0.007, 0.0104), ALLOY(), 0, 0.0258, 0);
    spoke.add(s1, s2);
    spoke.position.x = 0.0132;
    spoke.rotation.x = a;
    g.add(spoke);
  }
  // hub seat + center bore + 4 lug nuts on PCD
  const seat = cylX(0.0125, 0.006, ALLOY_DARK(), 0.0125, 0, 0, 28);
  g.add(seat);
  const bore = cylX(0.0052, 0.0075, HOLE_MAT(), 0.015, 0, 0, 18);
  g.add(bore);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const nut = m(new THREE.CylinderGeometry(0.0024, 0.0024, 0.0035, 6), BOLT_M(),
      0.0165, 0.0118 * Math.cos(a), 0.0118 * Math.sin(a));
    nut.rotation.z = Math.PI / 2;
    nut.rotation.x = a;
    g.add(nut);
  }
  return g;
}

/* ------------------------------------------------------------
   Drilled brake disc + bell (hat)
------------------------------------------------------------ */
function buildDisc() {
  const g = new THREE.Group();
  g.name = 'disc';

  const plate = cylX(0.026, 0.0036, DISC_MAT(), 0, 0, 0, 40);
  g.add(plate);
  // inner bell connecting to the knuckle
  const bell = cylX(0.0115, 0.011, ALLOY_DARK(), -0.0062, 0, 0, 28);
  g.add(bell);
  // outer/inner friction edges
  for (const r of [0.0254, 0.0135]) {
    const ring = m(new THREE.TorusGeometry(r, 0.0011, 6, 44), DISC_MAT(), 0.0019, 0, 0);
    ring.rotation.y = Math.PI / 2;
    g.add(ring);
  }
  // cross-drilled holes: 3 rings x 14 (instanced, both faces)
  const holes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.00095, 0.00095, 0.0044, 8),
    HOLE_MAT(), 42);
  const dummy = new THREE.Object3D();
  let i = 0;
  for (const hr of [0.0165, 0.0203, 0.0238]) {
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + hr * 40;
      dummy.position.set(0, hr * Math.cos(a), hr * Math.sin(a));
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.updateMatrix();
      holes.setMatrixAt(i++, dummy.matrix);
    }
  }
  holes.instanceMatrix.needsUpdate = true;
  g.add(holes);
  return g;
}

/* ------------------------------------------------------------
   Gold brake caliper straddling the disc (lower-rear quadrant)
------------------------------------------------------------ */
function buildCaliper() {
  const g = new THREE.Group();
  g.name = 'caliper';

  // two bodies straddling the disc + bridge over the top
  g.add(m(new THREE.BoxGeometry(0.0042, 0.015, 0.021), GOLD(), -0.0047, 0.007, 0));
  g.add(m(new THREE.BoxGeometry(0.0042, 0.015, 0.021), GOLD(), 0.0047, 0.007, 0));
  g.add(m(new THREE.BoxGeometry(0.0136, 0.0075, 0.021), GOLD(), 0, 0.0155, 0));
  // pads peeking between the bodies
  g.add(m(new THREE.BoxGeometry(0.0018, 0.011, 0.017), RUBBER_B(), -0.0021, 0.006, 0));
  g.add(m(new THREE.BoxGeometry(0.0018, 0.011, 0.017), RUBBER_B(), 0.0021, 0.006, 0));
  // piston bosses + bleed nipple
  for (const z of [-0.0055, 0.0055]) {
    g.add(cylX(0.0034, 0.0026, ALLOY_DARK(), -0.0072, 0.006, z, 14));
  }
  const nipple = m(new THREE.CylinderGeometry(0.0009, 0.0012, 0.005, 8), BOLT_M(), 0, 0.019, -0.008);
  g.add(nipple);

  /* radial placement: lower-front quadrant of the disc.
     Group origin sits at radius 0.0075 on the radial ray; the local
     +y span (-0.0005 .. 0.0193) then covers radius 0.007 .. 0.0268,
     straddling the disc edge (r = 0.026).  Bodies at local x ±0.0047
     bracket the disc plate (x ±0.0018).  */
  const dir = new THREE.Vector3(0, -0.014, 0.0152).normalize();
  g.position.set(0, dir.y * 0.0075, dir.z * 0.0075);
  g.rotation.x = Math.atan2(dir.z, dir.y);      // local +y -> radially outward
  return g;
}

/* ------------------------------------------------------------
   Wheel hub: flange, stub, 4 studs (PCD 50 equivalent)
------------------------------------------------------------ */
function buildHub() {
  const g = new THREE.Group();
  g.name = 'hub';
  g.add(cylX(0.014, 0.005, STEEL(), 0.0075, 0, 0, 28));       // flange
  g.add(cylX(0.0062, 0.030, STEEL(), 0.004, 0, 0, 20));       // shaft: rim bore -> knuckle bearing
  g.add(cylX(0.0075, 0.003, DARK_M(), 0.0205, 0, 0, 20));     // cap
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const stud = cylX(0.0017, 0.013, BOLT_M(), 0.0135,
      0.0118 * Math.cos(a), 0.0118 * Math.sin(a), 8);
    g.add(stud);
  }
  return g;
}

/* ------------------------------------------------------------
   Suspension corner: knuckle, UCA/LCA wishbones, coil-over
   strut with tower bracket, tie rod + bushings
------------------------------------------------------------ */
function buildSuspension() {
  const g = new THREE.Group();
  g.name = 'susp';

  /* --- steering knuckle / upright --- */
  const knuckle = new THREE.Group();
  knuckle.name = 'knuckle';
  knuckle.add(m(new THREE.BoxGeometry(0.010, 0.056, 0.030), DARK_M(), -0.020, 0.004, 0));
  // bearing boss + ball joints
  knuckle.add(cylX(0.0105, 0.013, STEEL(), -0.017, 0, 0, 20));
  knuckle.add(m(new THREE.SphereGeometry(0.005, 14, 12), STEEL(), -0.022, 0.032, 0));   // upper ball joint
  knuckle.add(m(new THREE.SphereGeometry(0.0055, 14, 12), STEEL(), -0.022, -0.026, 0)); // lower ball joint
  knuckle.add(m(new THREE.BoxGeometry(0.012, 0.010, 0.012), DARK_M(), -0.024, 0.011, 0.017)); // tie-rod ear
  g.add(knuckle);

  /* --- upper control arm (A-arm wishbone) --- */
  const uca = new THREE.Group();
  uca.name = 'upperArm';
  const uEye = V(-0.024, 0.030, 0);
  for (const s of [-1, 1]) {
    uca.add(tube(uEye, V(-0.047, -0.004, s * 0.016), 0.0034, ALLOY_DARK()));
    // pivot bushing, axis along z (fore-aft hinge line)
    const bush = m(new THREE.CylinderGeometry(0.0048, 0.0048, 0.010, 12), RUBBER_B(),
      -0.047, -0.004, s * 0.016);
    bush.rotation.x = Math.PI / 2;
    uca.add(bush);
  }
  uca.add(tube(V(-0.047, -0.004, -0.016), V(-0.047, -0.004, 0.016), 0.004, ALLOY_DARK()));
  g.add(uca);

  /* --- lower control arm --- */
  const lca = new THREE.Group();
  lca.name = 'lowerArm';
  const lEye = V(-0.024, -0.026, 0);
  const lPivot = V(-0.047, -0.036, 0);
  for (const s of [-1, 1]) {
    lca.add(tube(lEye, lPivot.clone().setZ(s * 0.018), 0.0042, ALLOY_DARK()));
    const bush = m(new THREE.CylinderGeometry(0.0055, 0.0055, 0.011, 12), RUBBER_B(),
      lPivot.x, lPivot.y, s * 0.018);
    bush.rotation.x = Math.PI / 2;
    lca.add(bush);
  }
  lca.add(tube(lPivot.clone().setZ(-0.018), lPivot.clone().setZ(0.018), 0.0046, ALLOY_DARK()));
  g.add(lca);

  /* --- coil-over strut: mounts between lower arm and tower --- */
  const coil = new THREE.Group();
  coil.name = 'coil';

  // tower bracket: from the rail line up to the top mount
  coil.add(m(new THREE.BoxGeometry(0.008, 0.058, 0.017), ALLOY_DARK(), -0.050, 0.029, 0));
  coil.add(m(new THREE.CylinderGeometry(0.009, 0.011, 0.007, 14), DARK_M(), -0.050, 0.060, 0));

  // damper body (lower half) + polished rod (upper half)
  coil.add(m(new THREE.CylinderGeometry(0.0062, 0.0062, 0.052, 14), ALLOY_DARK(), -0.041, 0.014, 0));
  coil.add(m(new THREE.CylinderGeometry(0.003, 0.003, 0.030, 10), POLISH(), -0.044, 0.049, 0));

  // lower eye + clevis reaching down to the lower control arm
  const eyeY = -0.032;                             // on the LCA line at x = -0.038
  const lowerEye = m(new THREE.TorusGeometry(0.0055, 0.0026, 8, 18), STEEL(), -0.038, eyeY, 0);
  lowerEye.rotation.y = Math.PI / 2;
  coil.add(lowerEye);
  coil.add(m(new THREE.CylinderGeometry(0.0042, 0.005, 0.022, 10), ALLOY_DARK(),
    -0.039, eyeY + 0.012, 0));                     // clevis stem into the damper body

  // yellow coil spring (helix tube) around the damper
  const pts = [];
  const coils = 6.5, H = 0.056, rSpring = 0.0125;
  for (let i = 0; i <= 110; i++) {
    const t = i / 110;
    const a = t * coils * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * rSpring, t * H, Math.sin(a) * rSpring));
  }
  const spring = m(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 110, 0.0031, 7),
    SPRING_M(), -0.042, -0.008, 0);
  coil.add(spring);

  // spring seats (discs perpendicular to the strut axis)
  for (const sy of [-0.010, 0.050]) {
    const seat = cylX(0.0155, 0.003, DARK_M(), -0.042, sy, 0, 16);
    seat.rotation.set(Math.PI / 2, 0, 0);          // axis ~y
    coil.add(seat);
  }
  g.add(coil);

  /* --- tie rod + ball joints --- */
  const tierod = new THREE.Group();
  tierod.name = 'tierod';
  const tA = V(-0.026, 0.011, 0.017), tB = V(-0.056, 0.007, 0.031);
  tierod.add(tube(tA, tB, 0.0026, STEEL()));
  tierod.add(m(new THREE.SphereGeometry(0.0042, 12, 10), ALLOY_DARK(), tA.x, tA.y, tA.z));
  tierod.add(m(new THREE.SphereGeometry(0.0046, 12, 10), ALLOY_DARK(), tB.x, tB.y, tB.z));
  const jam = m(new THREE.CylinderGeometry(0.0038, 0.0038, 0.005, 6), BOLT_M(), -0.042, 0.009, 0.025);
  jam.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), tB.clone().sub(tA).normalize());
  tierod.add(jam);
  g.add(tierod);

  return g;
}

/* ============================================================
   Public builder
============================================================ */
export function buildWheelAssembly() {
  const root = new THREE.Group();
  root.name = 'wheelAssembly';

  const tyre = buildTyre();
  const rim = buildRim();
  const disc = buildDisc();
  const caliper = buildCaliper();
  const hub = buildHub();
  const susp = buildSuspension();

  root.add(tyre, rim, disc, caliper, hub, susp);

  const parts = { tyre, rim, disc, caliper, hub, susp };

  /* suggested callout anchors (local coordinates) */
  const anchors = {
    upperArm: V(-0.040, 0.006, 0.014),
    coil: V(-0.044, 0.026, 0.0),
    knuckle: V(-0.020, -0.004, -0.015),
    rim: V(0.015, 0.021, 0.007),
    caliper: V(0, -0.0135, 0.0146),
    disc: V(0, 0.019, 0.008),
    lowerArm: V(-0.040, -0.033, 0.014),
    hub: V(0.018, 0.0, 0.0),
    tierod: V(-0.046, 0.008, 0.027),
  };

  return { group: root, parts, anchors };
}
