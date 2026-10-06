/* ============================================================
   SHIELD — EV CHASSIS 3D ANATOMY (poster page)
   Recreates the target engineering poster with LIVE 3-D:
     · hero 3/4 chassis with sensor callouts + dimensions
     · exploded chassis-layers stack (animated on entry)
     · top / front / side / rear orthographic views
     · sensor placement zones with glowing hot-spots
     · component / sensor legends + anatomy highlights
   All panels share one offscreen renderer (see multiView.js).
   ============================================================ */

import * as THREE from 'three';
import { createView, studyLights } from '../core/scene.js';
import { buildChassis, buildDimensions, buildAxisGizmo } from '../core/chassis.js';
import { buildSensorRig } from '../core/sensorMeshes.js';
import { createPosterStage, projectToPx, fitOrtho } from '../core/multiView.js';

/* ---------------- hero callout layout ---------------- */
const CALLOUTS = [
  { id: 'IMU01', sub: 'Front left',   color: '#4f8cff', kind: 'sensor', pos: { x: 0.045, y: 0.30 } },
  { id: 'SG01',  sub: 'Front left',   color: '#4fe0a0', kind: 'sensor', pos: { x: 0.055, y: 0.55 } },
  { id: 'SG02',  sub: 'Front right',  color: '#4fe0a0', kind: 'sensor', pos: { x: 0.30,  y: 0.845 } },
  { id: 'Battery Pack', sub: 'Transparent view', color: '#f2b94e', kind: 'point',
    world: [0, 0.032, -0.02], pos: { x: 0.47, y: 0.075 } },
  { id: 'SG03',  sub: 'Rear left',    color: '#4fe0a0', kind: 'sensor', pos: { x: 0.42,  y: 0.205 } },
  { id: 'IMU02', sub: 'Rear',         color: '#4f8cff', kind: 'sensor', pos: { x: 0.66,  y: 0.10 } },
  { id: 'SG04',  sub: 'Rear right',   color: '#4fe0a0', kind: 'sensor', pos: { x: 0.80,  y: 0.30 } },
  { id: 'SHIELD Controller', sub: 'External enclosure', color: '#38d9cf', kind: 'point',
    world: [0.24, 0.08, -0.16], pos: { x: 0.84, y: 0.70 } },
];

/* ---------------- exploded layer stack ---------------- */
const ALUM  = () => new THREE.MeshStandardMaterial({ color: 0x9fb2c8, metalness: 0.88, roughness: 0.32 });
const ALUM2 = () => new THREE.MeshStandardMaterial({ color: 0xb6c6da, metalness: 0.9, roughness: 0.26 });
const DARKM = () => new THREE.MeshStandardMaterial({ color: 0x2e3744, metalness: 0.8, roughness: 0.46 });
const CELLM = () => new THREE.MeshStandardMaterial({ color: 0x33466a, metalness: 0.7, roughness: 0.34 });
const ORANGM = () => new THREE.MeshStandardMaterial({ color: 0xff7a1a, metalness: 0.2, roughness: 0.5 });

function bx(parent, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function buildLowerFrame() {
  const g = new THREE.Group();
  bx(g, 0.4, 0.024, 0.02, -0.105, 0.012, 0, ALUM());
  bx(g, 0.4, 0.024, 0.02,  0.105, 0.012, 0, ALUM());
  for (const z of [-0.14, 0, 0.14]) bx(g, 0.19, 0.02, 0.016, 0, 0.012, z, ALUM2());
  return g;
}
function buildFloorPanel() {
  const g = new THREE.Group();
  bx(g, 0.4, 0.006, 0.24, 0, 0.003, 0, ALUM2());
  for (const z of [-0.07, 0.07]) bx(g, 0.38, 0.009, 0.014, 0, -0.002, z, DARKM());
  bx(g, 0.016, 0.009, 0.23, 0, -0.002, 0, DARKM());
  return g;
}
function buildModulePack() {
  const g = new THREE.Group();
  bx(g, 0.36, 0.004, 0.22, 0, 0.002, 0, DARKM());
  const rows = [-0.08, -0.04, 0, 0.04, 0.08];
  for (const x of [-0.11, 0, 0.11]) for (const z of rows) {
    bx(g, 0.086, 0.03, 0.034, x, 0.019, z, CELLM());
    bx(g, 0.08, 0.003, 0.03, x, 0.0355, z, ALUM2());
  }
  bx(g, 0.01, 0.004, 0.17, 0, 0.037, 0, ORANGM());          // HV spine
  for (const z of rows) bx(g, 0.24, 0.003, 0.007, 0, 0.037, z, ORANGM());
  return g;
}
function buildBatteryCover() {
  const g = new THREE.Group();
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.05, 0.23),
    new THREE.MeshPhysicalMaterial({
      color: 0x9fdcec, metalness: 0, roughness: 0.12,
      transparent: true, opacity: 0.24, side: THREE.DoubleSide,
      clearcoat: 1, clearcoatRoughness: 0.1,
    }));
  lid.position.y = 0.028;
  g.add(lid);
  bx(g, 0.37, 0.006, 0.23, 0, -0.0, 0, DARKM());            // flange rim
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.007, 8), ALUM2());
    b.position.set(sx * 0.17, 0.004, sz * 0.10);
    g.add(b);
  }
  return g;
}
function buildUpperShell() {
  const g = new THREE.Group();
  // perimeter tubes
  bx(g, 0.4, 0.02, 0.02, -0.105, 0.01, 0, ALUM());
  bx(g, 0.4, 0.02, 0.02,  0.105, 0.01, 0, ALUM());
  bx(g, 0.19, 0.02, 0.02, 0, 0.01, -0.13, ALUM());
  bx(g, 0.19, 0.02, 0.02, 0, 0.01,  0.13, ALUM());
  // shell walls
  bx(g, 0.4, 0.04, 0.01, -0.115, 0.04, 0, ALUM2());
  bx(g, 0.4, 0.04, 0.01,  0.115, 0.04, 0, ALUM2());
  bx(g, 0.01, 0.04, 0.24, 0, 0.04, -0.145, ALUM2());
  bx(g, 0.01, 0.04, 0.24, 0, 0.04,  0.145, ALUM2());
  return g;
}

const LAYER_DEFS = [
  { key: 'upper',   title: 'Upper frame / shell',            sub: 'Aluminium / Steel',        color: '#e6eefc', build: buildUpperShell,   c: 0.115, e: 0.36 },
  { key: 'cover',   title: 'Battery enclosure cover',        sub: 'Transparent PC',           color: '#38d9cf', build: buildBatteryCover, c: 0.088, e: 0.27 },
  { key: 'modules', title: 'Battery modules',                sub: 'Cells + BMS',              color: '#4fe0a0', build: buildModulePack,   c: 0.052, e: 0.18 },
  { key: 'floor',   title: 'Floor panel',                    sub: 'Structural',               color: '#4f7df2', build: buildFloorPanel,   c: 0.03,  e: 0.09 },
  { key: 'lower',   title: 'Lower frame / cross members',    sub: 'Aluminium / Steel',        color: '#e6eefc', build: buildLowerFrame,   c: 0.012, e: 0.0 },
];

/* ---------------- legends ---------------- */
const KEY_COMPONENTS = [
  ['#8fa3bd', 'Chassis shell', 'Aluminium / steel BIW'],
  ['#f2b94e', 'Suspension', 'Coil-over spring + damper'],
  ['#38d9cf', 'Battery enclosure', 'Transparent PC cover'],
  ['#ff7a1a', 'Battery cells', 'Modules + copper busbar'],
  ['#4f8cff', 'Controller', 'SHIELD external enclosure'],
];
const SENSOR_LEGEND = [
  ['#4fe0a0', 'Strain gauge', 'SG01 – SG04 (green)'],
  ['#38d9cf', 'IMU', 'IMU01, IMU02 (cyan)'],
  ['#f2b94e', 'Load point', 'LC01 applied load (yellow)'],
  ['#ff5d3d', 'Battery pack', 'with BMS (red-orange)'],
  ['#4f8cff', 'SHIELD controller', 'external enclosure (blue)'],
];
const HIGHLIGHTS = [
  'Monocoque-style lightweight chassis',
  '400 × 200 mm prototype shell (scaled)',
  'Central structural battery pack',
  'Independent coil-over suspension (front & rear)',
  'Sensors placed at high-stress zones',
  'Modular external SHIELD controller',
  'Rated for structural & dynamic analysis',
];

/* ============================================================ */

export function createAnatomyPage(container) {
  const page = document.createElement('div');
  page.className = 'page anatomy active';
  page.innerHTML = `
    <div class="po-grid">

      <section class="po-hero" id="an-hero">
        <div class="po-title">
          <div class="po-brand">SHIELD</div>
          <div class="po-name">EV CHASSIS 3D ANATOMY</div>
          <div class="po-sub">Monocoque-style prototype • 400 × 200 mm shell (scaled)</div>
        </div>
        <div class="po-tags">
          <span>MODULAR</span><span>MEASURABLE</span><span>STRUCTURAL</span><span>SCALABLE</span>
        </div>
        <svg class="co-svg" id="an-svg"></svg>
        <div class="co-layer" id="an-co"></div>
        <div class="po-hint">drag to orbit · scroll to zoom</div>
      </section>

      <aside class="po-side">
        <section class="po-panel">
          <header>CHASSIS LAYERS <i>(EXPLODED VIEW)</i></header>
          <div class="mv"><canvas></canvas><svg class="mv-svg"></svg><div class="ov"></div></div>
        </section>
        <section class="po-panel">
          <header>TOP VIEW <i>(LAYOUT)</i></header>
          <div class="mv"><canvas></canvas>
            <div class="ov">
              <div class="pd-h"><span class="t">400 mm</span></div>
              <div class="pd-v"><span class="t">200 mm</span></div>
            </div>
          </div>
        </section>
        <section class="po-panel">
          <header>SENSOR PLACEMENT ZONES <i>(SIDE VIEW)</i></header>
          <div class="mv"><canvas></canvas><svg class="mv-svg"></svg><div class="ov zone-lbls"></div></div>
        </section>
      </aside>

      <div class="po-views">
        <section class="po-panel">
          <header>FRONT VIEW</header>
          <div class="mv"><canvas></canvas><div class="ov"><div class="pd-h"><span class="t">200 mm</span></div></div></div>
        </section>
        <section class="po-panel">
          <header>SIDE VIEW</header>
          <div class="mv"><canvas></canvas><div class="ov"><div class="pd-h"><span class="t">400 mm</span></div></div></div>
        </section>
        <section class="po-panel">
          <header>REAR VIEW</header>
          <div class="mv"><canvas></canvas><div class="ov"><div class="pd-h"><span class="t">200 mm</span></div></div></div>
        </section>
      </div>

      <div class="po-legend">
        <section class="po-panel po-card">
          <header>KEY COMPONENTS <i>(MATERIALS)</i></header>
          <ul class="lg">${KEY_COMPONENTS.map(([c, n, s]) =>
            `<li><span class="d" style="background:${c}"></span><b>${n}</b><i>${s}</i></li>`).join('')}</ul>
        </section>
        <section class="po-panel po-card">
          <header>SENSORS &amp; COMPONENTS</header>
          <ul class="lg">${SENSOR_LEGEND.map(([c, n, s]) =>
            `<li><span class="d" style="background:${c}"></span><b>${n}</b><i>${s}</i></li>`).join('')}</ul>
        </section>
        <section class="po-panel po-card">
          <header>ANATOMY HIGHLIGHTS</header>
          <ul class="hl">${HIGHLIGHTS.map(h => `<li>${h}</li>`).join('')}</ul>
        </section>
      </div>

    </div>`;
  container.appendChild(page);

  const heroEl = page.querySelector('#an-hero');

  /* ================= HERO 3/4 ================= */
  const V = createView(heroEl, {
    camHome: {
      pos: new THREE.Vector3(0.46, 0.3, 0.48),
      target: new THREE.Vector3(0, 0.03, 0),
    },
    onFrame: () => updateCallouts(),
  });

  const { group: chassis, } = buildChassis(V.scene);
  V.scene.add(chassis);
  const batteryHousing = chassis.getObjectByName('battery-housing');
  if (batteryHousing) batteryHousing.material.opacity = 0.3;   // reveal module grid

  const { group: rig, sensors: sensorMap } = buildSensorRig();
  V.scene.add(rig);
  sensorMap.forEach(root => {                                 // callouts replace sprite labels
    if (root.userData.label) root.userData.label.visible = false;
  });

  V.scene.add(buildDimensions());
  V.scene.add(buildAxisGizmo(new THREE.Vector3(-0.33, -0.004, 0.25)));

  /* callout chips + SVG leaders */
  const coLayer = page.querySelector('#an-co');
  const coSvg = page.querySelector('#an-svg');
  const coItems = CALLOUTS.map(d => {
    const chip = document.createElement('div');
    chip.className = 'co';
    chip.style.setProperty('--c', d.color);
    chip.style.left = (d.pos.x * 100) + '%';
    chip.style.top = (d.pos.y * 100) + '%';
    chip.innerHTML = `<b>${d.id}</b><i>${d.sub}</i>`;
    coLayer.appendChild(chip);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', d.color);
    line.setAttribute('stroke-width', '1.2');
    line.setAttribute('opacity', '0.75');
    coSvg.appendChild(line);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', d.color);
    coSvg.appendChild(dot);

    return { d, chip, line, dot, world: d.world ? new THREE.Vector3(...d.world) : null };
  });

  let heroRect = { w: 1, h: 1 };
  const tmpV = new THREE.Vector3();
  function updateCallouts() {
    V.camera.updateMatrixWorld();
    const { w, h } = heroRect;
    for (const it of coItems) {
      let world = it.world;
      if (!world) {
        const root = sensorMap.get(it.d.id);
        if (!root) continue;
        world = root.getWorldPosition(tmpV);
      }
      const p = projectToPx(V.camera, world, w, h);
      it.dot.setAttribute('cx', p.x.toFixed(1));
      it.dot.setAttribute('cy', p.y.toFixed(1));
      it.line.setAttribute('x1', (it.d.pos.x * w).toFixed(1));
      it.line.setAttribute('y1', (it.d.pos.y * h).toFixed(1));
      it.line.setAttribute('x2', p.x.toFixed(1));
      it.line.setAttribute('y2', p.y.toFixed(1));
    }
  }
  function measureHero() {
    const r = heroEl.getBoundingClientRect();
    heroRect = { w: r.width, h: r.height };
    coSvg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  }
  measureHero();

  /* ================= STATIC POSTER STAGE ================= */
  const stage = createPosterStage(0x0a1017);

  /* helper: build a chassis mini-scene (no plinth) */
  function miniScene({ sensors = true } = {}) {
    const scene = new THREE.Scene();
    studyLights(scene, { shadow: 1024 });
    const { group: ch } = buildChassis(scene);
    const st = ch.getObjectByName('stage');
    if (st) ch.remove(st);
    scene.add(ch);
    let sm = null;
    if (sensors) {
      const r = buildSensorRig();
      scene.add(r.group);
      sm = r.sensors;
      sm.forEach(root => { if (root.userData.label) root.userData.label.visible = false; });
    }
    return { scene, chassis: ch, sensorMap: sm };
  }

  function orthoCam(px, py, pz, tx = 0, ty = 0, tz = 0) {
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 6);
    cam.position.set(px, py, pz);
    if (py > 0.5) cam.up.set(1, 0, 0);                    // top view: +x screen-up
    cam.lookAt(tx, ty, tz);
    return cam;
  }

  /* ---- exploded layers panel ---- */
  const layersScene = new THREE.Scene();
  studyLights(layersScene, { shadow: 1024 });
  const layerGroups = LAYER_DEFS.map(def => {
    const g = def.build();
    layersScene.add(g);
    return { def, g };
  });
  const layersCam = new THREE.PerspectiveCamera(40, 1, 0.01, 6);
  layersCam.position.set(0.68, 0.38, 0.6);
  layersCam.lookAt(0.17, 0.19, 0);   // shifted right so labels get a clean column

  const layersWrap = page.querySelectorAll('.po-side .po-panel')[0];
  const layersSvg = layersWrap.querySelector('.mv-svg');
  const layersOv = layersWrap.querySelector('.ov');
  const layerLabels = LAYER_DEFS.map(def => {
    const chip = document.createElement('div');
    chip.className = 'lyl';
    chip.innerHTML = `<span class="d" style="background:${def.color}"></span>
      <span class="tx"><b>${def.title}</b><i>${def.sub}</i></span>`;
    layersOv.appendChild(chip);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', def.color);
    line.setAttribute('stroke-width', '1.1');
    line.setAttribute('opacity', '0.7');
    layersSvg.appendChild(line);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', def.color);
    layersSvg.appendChild(dot);
    return { chip, line, dot };
  });

  function setLayerProgress(t) {
    layerGroups.forEach(({ def, g }) => {
      g.position.y = def.c + (def.e - def.c) * t;
    });
  }
  setLayerProgress(0);

  stage.add('layers', {
    canvas: layersWrap.querySelector('canvas'),
    scene: layersScene,
    camera: layersCam,
    after: (w, h) => {
      const box = w - 152;                       // label column
      layerGroups.forEach(({ def, g }, i) => {
        const anchor = new THREE.Vector3(0.14, g.position.y + 0.01, 0.1);
        const p = projectToPx(layersCam, anchor, w, h);
        const y = Math.min(Math.max(p.y, 16), h - 16);
        const it = layerLabels[i];
        it.dot.setAttribute('cx', p.x.toFixed(1));
        it.dot.setAttribute('cy', y.toFixed(1));
        it.line.setAttribute('x1', (p.x + 5).toFixed(1));
        it.line.setAttribute('y1', y.toFixed(1));
        it.line.setAttribute('x2', (box - 5).toFixed(1));
        it.line.setAttribute('y2', y.toFixed(1));
        it.chip.style.left = box + 'px';
        it.chip.style.top = (y - 15) + 'px';
      });
    },
  });

  /* ---- top view ---- */
  const topM = miniScene();
  // hide edge node so the full footprint fits the frame
  topM.scene.traverse(o => { if (o.userData && o.userData.edgeNode) o.visible = false; });
  const topCam = orthoCam(0, 0.8, 0);
  stage.add('top', {
    canvas: page.querySelectorAll('.po-side .po-panel')[1].querySelector('canvas'),
    scene: topM.scene,
    camera: topCam,
    fit: (c, w, h) => fitOrtho(c, w, h, 0.19, 0.36),
  });

  /* ---- side view + zones (shared scene) ---- */
  const sideM = miniScene();
  const sideCam = orthoCam(-0.9, 0.05, 0, 0, 0.05, 0);

  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,196,100,0.95)');
    g.addColorStop(0.35, 'rgba(255,130,50,0.5)');
    g.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const ZONES = [
    { label: 'Front suspension & mounting',  world: [0, 0.055, 0.205], dy: 66 },
    { label: 'Battery mounting region',      world: [0, 0.03, -0.02],  dy: 44 },
    { label: 'Rear suspension & mounting',   world: [0, 0.055, -0.205], dy: 66 },
  ];
  const glowGroup = new THREE.Group();
  ZONES.forEach(z => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, depthWrite: false, depthTest: false,
    }));
    s.scale.setScalar(0.15);
    s.position.set(...z.world);
    glowGroup.add(s);
  });
  sideM.scene.add(glowGroup);

  const zonesWrap = page.querySelectorAll('.po-side .po-panel')[2];
  const zonesSvg = zonesWrap.querySelector('.mv-svg');
  const zonesOv = zonesWrap.querySelector('.zone-lbls');
  const zoneItems = ZONES.map(z => {
    const chip = document.createElement('div');
    chip.className = 'zyl';
    chip.textContent = z.label;
    zonesOv.appendChild(chip);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', '#ff9a3d');
    line.setAttribute('stroke-width', '1.1');
    line.setAttribute('opacity', '0.75');
    zonesSvg.appendChild(line);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', '#ff9a3d');
    zonesSvg.appendChild(dot);
    return { z, chip, line, dot, world: new THREE.Vector3(...z.world) };
  });
  const zoneDy = z => z.dy || 66;

  stage.add('side', {
    canvas: page.querySelectorAll('.po-views .po-panel')[1].querySelector('canvas'),
    scene: sideM.scene,
    camera: sideCam,
    prepare: () => { glowGroup.visible = false; },
    fit: (c, w, h) => fitOrtho(c, w, h, 0.115, 0.325),
  });
  stage.add('zones', {
    canvas: zonesWrap.querySelector('canvas'),
    scene: sideM.scene,
    camera: sideCam,
    prepare: () => { glowGroup.visible = true; },
    fit: (c, w, h) => fitOrtho(c, w, h, 0.115, 0.325),
    after: (w, h) => {
      zoneItems.forEach(it => {
        const p = projectToPx(sideCam, it.world, w, h);
        it.dot.setAttribute('cx', p.x.toFixed(1));
        it.dot.setAttribute('cy', p.y.toFixed(1));
        it.line.setAttribute('x1', p.x.toFixed(1));
        it.line.setAttribute('y1', (p.y - 7).toFixed(1));
        it.line.setAttribute('x2', p.x.toFixed(1));
        it.line.setAttribute('y2', (p.y - 36).toFixed(1));
        it.chip.style.left = p.x + 'px';
        it.chip.style.top = (p.y - zoneDy(it.z)) + 'px';
      });
    },
  });

  /* ---- front / rear views ---- */
  const frontM = miniScene();
  const frontCam = orthoCam(0, 0.05, 0.9, 0, 0.05, 0);
  stage.add('front', {
    canvas: page.querySelectorAll('.po-views .po-panel')[0].querySelector('canvas'),
    scene: frontM.scene,
    camera: frontCam,
    fit: (c, w, h) => fitOrtho(c, w, h, 0.115, 0.30),
  });

  const rearM = miniScene();
  const rearCam = orthoCam(0, 0.05, -0.9, 0, 0.05, 0);
  stage.add('rear', {
    canvas: page.querySelectorAll('.po-views .po-panel')[2].querySelector('canvas'),
    scene: rearM.scene,
    camera: rearCam,
    fit: (c, w, h) => fitOrtho(c, w, h, 0.115, 0.30),
  });

  /* ================= lifecycle ================= */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    measureHero();
    stage.renderAll();
    // exploded-view reveal animation
    const t0 = performance.now();
    const anim = now => {
      const t = Math.min(1, (now - t0) / 1100);
      const e = 1 - Math.pow(1 - t, 3);
      setLayerProgress(e);
      stage.draw('layers');
      if (t < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(start);

  const ro = new ResizeObserver(() => {
    measureHero();
    stage.renderAll();
  });
  ro.observe(page);

  /* QA / render hooks */
  window.__AN = {
    redraw: () => { measureHero(); stage.renderAll(); },
    explode: t => { setLayerProgress(t); stage.draw('layers'); },
    layers: () => layerGroups.map(l => +l.g.position.y.toFixed(3)),
    callouts: () => coItems.length,
  };

  return page;
}
