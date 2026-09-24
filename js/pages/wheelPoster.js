/* ============================================================
   SHIELD — EV CHASSIS WHEEL ASSEMBLY (poster page)
   Recreates the target wheel poster with LIVE 3-D:
      · hero 3/4 detailed corner assembly + 9 component callouts
      · front / side / rear views with dimension arrows
      · orthographic blueprint drawing (wireframe)
      · exploded view: tyre · rim · disc · caliper · hub · suspension
      · key-measurements table + prototype note
   Shares one offscreen renderer (multiView.js) with all panels.
   ============================================================ */

import * as THREE from 'three';
import { createView, studyLights } from '../core/scene.js';
import { buildWheelAssembly } from '../core/wheelAssembly.js';
import { createPosterStage, projectToPx, fitOrtho } from '../core/multiView.js';

/* ---------------- hero callouts (labels + projected anchors) ---------------- */
const CALLOUTS = [
  { a: 'rim',      id: 'Rim (Alloy)',          sub: '5-spoke',        color: '#4f8cff', pos: { x: 0.15, y: 0.34 } },
  { a: 'disc',     id: 'Brake Disc (Rotor)',   sub: 'Cross-drilled',  color: '#ff9a3d', pos: { x: 0.15, y: 0.52 } },
  { a: 'caliper',  id: 'Brake Caliper',        sub: 'Gold 4-pot',     color: '#f2b94e', pos: { x: 0.15, y: 0.70 } },
  { a: 'hub',      id: 'Wheel Hub',            sub: '4 studs',        color: '#38d9cf', pos: { x: 0.15, y: 0.87 } },
  { a: 'coil',     id: 'Coil Spring (Damper)', sub: 'Coil-over',       color: '#f2b94e', pos: { x: 0.82, y: 0.14 } },
  { a: 'tierod',   id: 'Tie Rod End',          sub: 'Steering',       color: '#4fe0a0', pos: { x: 0.82, y: 0.30 } },
  { a: 'upperArm', id: 'Upper Control Arm',    sub: 'A-arm',          color: '#e6eefc', pos: { x: 0.82, y: 0.46 } },
  { a: 'knuckle',  id: 'Steering Knuckle',     sub: 'Upright',        color: '#38d9cf', pos: { x: 0.82, y: 0.62 } },
  { a: 'lowerArm', id: 'Lower Control Arm',    sub: 'A-arm',          color: '#e6eefc', pos: { x: 0.82, y: 0.78 } },
];

/* ---------------- exploded view definition ---------------- */
const EX = [
  { key: 'tyre',    to: 0.095,  title: 'Tyre',          sub: '200 × 80 mm',          color: '#4f8cff', anchor: [0.095, 0.058, 0] },
  { key: 'rim',     to: 0.052,  title: 'Alloy Rim',     sub: 'Ø120 mm',              color: '#4fe0a0', anchor: [0.052, 0.042, 0] },
  { key: 'disc',    to: 0.012,  title: 'Brake Disc',    sub: 'Ø110 × 8 mm',          color: '#ff9a3d', anchor: [0.012, 0.036, 0] },
  { key: 'caliper', to: -0.028, title: 'Brake Caliper', sub: 'Gold, straddles disc',  color: '#f2b94e', anchor: [-0.028, 0.03, 0.004] },
  { key: 'hub',     to: -0.062, title: 'Wheel Hub',     sub: 'Ø60 · 4 studs',        color: '#38d9cf', anchor: [-0.062, 0.03, 0] },
  { key: 'susp',    to: -0.105, title: 'Suspension',    sub: 'Coil-over + A-arms',    color: '#e6eefc', anchor: [-0.105, 0.075, 0] },
];

/* ---------------- key measurements (derived from the model at 200 mm scale) -- */
const MEASURES = [
  ['Overall wheel diameter (Tyre)', '200'],
  ['Tyre width', '80'],
  ['Rim outer diameter', '120'],
  ['Rim width', '76'],
  ['Hub outer diameter', '60'],
  ['Brake disc diameter', '110'],
  ['Brake disc thickness', '8'],
  ['Wheel bolt circle (PCD)', '50'],
  ['No. of wheel bolts', '4'],
  ['Coil spring free length', '120'],
  ['Damper length (eye to eye)', '195'],
  ['Upper control arm length', '85'],
  ['Lower control arm length', '55'],
  ['Tie rod length', '70'],
  ['Total wheel assembly width', '160'],
];

const dim = (cls, val, sub) =>
  `<div class="pd-h ${cls}"><span class="t">${val}<i>(${sub})</i></span></div>`;

/* ============================================================ */

export function createWheelPage(container) {
  const page = document.createElement('div');
  page.className = 'page wheel active';
  page.innerHTML = `
    <div class="wa-grid">

      <section class="wa-hero" id="wh-hero">
        <div class="po-title">
          <div class="po-brand">SHIELD</div>
          <div class="po-name">EV CHASSIS WHEEL ASSEMBLY</div>
          <div class="po-sub">Detailed Dimensions (Prototype Model)</div>
        </div>
        <svg class="co-svg" id="wh-svg"></svg>
        <div class="co-layer" id="wh-co"></div>
        <div class="po-hint">drag to orbit · scroll to zoom</div>
      </section>

      <section class="po-panel wa-front">
        <header>FRONT VIEW <i>(WHEEL FACE)</i></header>
        <div class="mv"><canvas></canvas>
          <div class="ov">
            ${dim('at-top has-sub', 'Ø200 mm', 'Overall wheel diameter')}
            ${dim('at-mid has-sub', 'Ø120 mm', 'Rim outer diameter')}
            ${dim('has-sub', '160 mm', 'Overall assembly width')}
          </div>
        </div>
      </section>

      <section class="po-panel wa-side">
        <header>SIDE VIEW <i>(TREAD)</i></header>
        <div class="mv"><canvas></canvas>
          <div class="ov">
            ${dim('at-top has-sub', '200 mm', 'Overall wheel diameter')}
            ${dim('has-sub', '80 mm', 'Tyre width')}
          </div>
        </div>
      </section>

      <section class="po-panel wa-rear">
        <header>REAR VIEW <i>(SUSPENSION)</i></header>
        <div class="mv"><canvas></canvas>
          <div class="ov">
            ${dim('has-sub', '160 mm', 'Overall assembly width')}
          </div>
        </div>
      </section>

      <section class="po-panel wa-bp">
        <header>DIMENSIONAL DRAWING <i>(ORTHOGRAPHIC)</i></header>
        <div class="bp-pair">
          <div class="bp">
            <canvas></canvas>
            <div class="ov">
              ${dim('at-top has-sub', 'Ø200 mm', 'Overall wheel diameter')}
              ${dim('has-sub', 'Ø120 mm', 'Rim outer diameter')}
            </div>
            <div class="bp-cap">FRONT VIEW</div>
          </div>
          <div class="bp">
            <canvas></canvas>
            <div class="ov">
              ${dim('at-top has-sub', '80 mm', 'Tyre width')}
              <div class="pd-v right"><span class="t">Ø200 mm<i>(Wheel dia.)</i></span></div>
            </div>
            <div class="bp-cap">SIDE VIEW</div>
          </div>
        </div>
      </section>

      <section class="po-panel wa-ex">
        <header>EXPLODED VIEW <i>(WHEEL + SUSPENSION)</i></header>
        <div class="mv"><canvas></canvas><svg class="mv-svg"></svg><div class="ov ex-lbls"></div></div>
      </section>

      <section class="po-panel wa-km">
        <header>KEY MEASUREMENTS <i>(mm)</i></header>
        <ul class="km">${MEASURES.map(([k, v]) =>
          `<li><b>${k}</b><s></s><i>${v}</i></li>`).join('')}</ul>
      </section>

      <div class="wa-note">
        Note: All dimensions are for the 400 mm × 200 mm prototype chassis model.
        Dimensions are in millimetres (mm).
      </div>

    </div>`;
  container.appendChild(page);

  const heroEl = page.querySelector('#wh-hero');

  /* ================= HERO 3/4 ================= */
  const V = createView(heroEl, {
    camHome: {
      pos: new THREE.Vector3(0.21, 0.1, -0.18),
      target: new THREE.Vector3(0.01, 0.03, 0),
    },
    onFrame: () => updateCallouts(),
  });

  const wa = buildWheelAssembly();
  V.scene.add(wa.group);

  // studio floor for contact shadow
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x0a0e13, roughness: 0.5, metalness: 0.45 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.0477;
  floor.receiveShadow = true;
  V.scene.add(floor);

  /* callout chips + SVG leaders */
  const coLayer = page.querySelector('#wh-co');
  const coSvg = page.querySelector('#wh-svg');
  const coItems = CALLOUTS.map(d => {
    const chip = document.createElement('div');
    chip.className = 'co co2';
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

    return { d, chip, line, dot, world: wa.anchors[d.a] };
  });

  let heroRect = { w: 1, h: 1 };
  function updateCallouts() {
    V.camera.updateMatrixWorld();
    const { w, h } = heroRect;
    for (const it of coItems) {
      const p = projectToPx(V.camera, it.world, w, h);
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

  function orthoCam(px, py, pz, tx, ty, tz) {
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 6);
    cam.position.set(px, py, pz);
    cam.lookAt(tx, ty, tz);
    return cam;
  }

  /* corner scene helper (full materials) */
  function cornerScene({ floor: withFloor = false } = {}) {
    const scene = new THREE.Scene();
    studyLights(scene, { shadow: 1024 });
    const a = buildWheelAssembly();
    scene.add(a.group);
    if (withFloor) {
      const f = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x0a0e13, roughness: 0.5, metalness: 0.45 }));
      f.rotation.x = -Math.PI / 2;
      f.position.y = -0.0477;
      f.receiveShadow = true;
      scene.add(f);
    }
    return { scene, wa: a };
  }

  /* ---- front / side / rear ortho views ---- */
  const frontM = cornerScene();
  const frontCam = orthoCam(1, 0.008, 0, 0, 0.008, 0);
  stage.add('front', {
    canvas: page.querySelector('.wa-front canvas'),
    scene: frontM.scene,
    camera: frontCam,
    fit: (c, w, h) => fitOrtho(c, w, h, 0.075, 0.042),
  });

  const sideM = cornerScene();
  const sideCam = orthoCam(-0.0185, 0.008, -1, -0.0185, 0.008, 0);
  stage.add('side', {
    canvas: page.querySelector('.wa-side canvas'),
    scene: sideM.scene,
    camera: sideCam,
    fit: (c, w, h) => fitOrtho(c, w, h, 0.075, 0.046),
  });

  const rearM = cornerScene();
  const rearCam = orthoCam(-0.0185, 0.008, 1, -0.0185, 0.008, 0);
  stage.add('rear', {
    canvas: page.querySelector('.wa-rear canvas'),
    scene: rearM.scene,
    camera: rearCam,
    fit: (c, w, h) => fitOrtho(c, w, h, 0.075, 0.046),
  });

  /* ---- orthographic blueprint (wireframe override) ---- */
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x5ad2ff, wireframe: true, transparent: true, opacity: 0.5,
  });
  function blueprintScene() {
    const scene = new THREE.Scene();
    const a = buildWheelAssembly();
    const blocks = a.parts.tyre.getObjectByName('treadBlocks');
    if (blocks) blocks.visible = false;          // keep the line drawing clean
    scene.add(a.group);
    scene.overrideMaterial = wireMat;
    return scene;
  }

  const bpFront = blueprintScene();
  stage.add('bpFront', {
    canvas: page.querySelector('.wa-bp .bp:nth-child(1) canvas'),
    scene: bpFront,
    camera: orthoCam(1, 0.008, 0, 0, 0.008, 0),
    fit: (c, w, h) => fitOrtho(c, w, h, 0.072, 0.042),
  });
  const bpSide = blueprintScene();
  stage.add('bpSide', {
    canvas: page.querySelector('.wa-bp .bp:nth-child(2) canvas'),
    scene: bpSide,
    camera: orthoCam(-0.0185, 0.008, -1, -0.0185, 0.008, 0),
    fit: (c, w, h) => fitOrtho(c, w, h, 0.072, 0.05),
  });

  /* ---- exploded view ---- */
  const exM = cornerScene({ floor: true });
  const exWa = exM.wa;
  const exBase = {};
  EX.forEach(d => { exBase[d.key] = exWa.parts[d.key].position.x; });

  function setExplode(t) {
    EX.forEach(d => {
      exWa.parts[d.key].position.x = exBase[d.key] + (d.to - exBase[d.key]) * t;
    });
  }
  setExplode(1);

  const exCam = new THREE.PerspectiveCamera(30, 2, 0.05, 4);
  exCam.position.set(0.06, 0.14, -0.53);
  exCam.lookAt(-0.02, 0.01, 0);

  const exWrap = page.querySelector('.wa-ex');
  const exSvg = exWrap.querySelector('.mv-svg');
  const exOv = exWrap.querySelector('.ex-lbls');
  const exItems = EX.map((d, i) => {
    const chip = document.createElement('div');
    chip.className = 'wxl';
    chip.innerHTML = `<span class="d" style="background:${d.color}"></span>
      <span class="tx"><b>${d.title}</b><i>${d.sub}</i></span>`;
    exOv.appendChild(chip);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', d.color);
    line.setAttribute('stroke-width', '1.1');
    line.setAttribute('opacity', '0.7');
    exSvg.appendChild(line);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', d.color);
    exSvg.appendChild(dot);
    return { d, i, chip, line, dot, world: new THREE.Vector3(...d.anchor) };
  });

  stage.add('ex', {
    canvas: exWrap.querySelector('canvas'),
    scene: exM.scene,
    camera: exCam,
    fit: (c, w, h) => {
      const aspect = w / h;
      const hh = Math.max(0.088, 0.178 / aspect);
      c.fov = 2 * Math.atan(hh / 0.55) * 180 / Math.PI;
      c.aspect = aspect;
      c.updateProjectionMatrix();
    },
    after: (w, h) => {
      exItems.forEach(it => {
        const p = projectToPx(exCam, it.world, w, h);
        const dy = it.i % 2 ? 92 : 46;                 // stagger rows
        const top = Math.max(p.y - dy, 6);
        const chipH = it.chip.offsetHeight || 34;
        it.dot.setAttribute('cx', p.x.toFixed(1));
        it.dot.setAttribute('cy', p.y.toFixed(1));
        it.line.setAttribute('x1', p.x.toFixed(1));
        it.line.setAttribute('y1', (p.y - 5).toFixed(1));
        it.line.setAttribute('x2', p.x.toFixed(1));
        it.line.setAttribute('y2', (top + chipH + 2).toFixed(1));
        it.chip.style.left = p.x + 'px';
        it.chip.style.top = top + 'px';
      });
    },
  });

  /* ================= lifecycle ================= */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    measureHero();
    stage.renderAll();
    // exploded parts glide into place on entry
    setExplode(0);
    const t0 = performance.now();
    const anim = now => {
      const t = Math.min(1, (now - t0) / 1100);
      const e = 1 - Math.pow(1 - t, 3);
      setExplode(e);
      stage.draw('ex');
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
  window.__WH = {
    redraw: () => { measureHero(); stage.renderAll(); },
    explode: t => { setExplode(t); stage.draw('ex'); },
    exploded: () => EX.map(d => +exWa.parts[d.key].position.x.toFixed(3)),
    callouts: () => coItems.length,
    measures: () => MEASURES.length,
  };

  return page;
}
