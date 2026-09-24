/* ============================================================
   SHIELD — SENSOR LAB — engineering inspection viewer
   (SensorDetailViewer in the vanilla zero-build stack)

   · Large interactive 3D inspection of SG01 / IMU01 (switchable)
   · Camera presets ISO · FRONT · TOP · SIDE · BOTTOM · RESET
   · Smooth exploded / assembled slider
   · Internal (X-ray) mode with component labels
   · Anatomy callouts with live-projected SVG leaders
   · Part selection (raycast) + dim + component info panel
   · Simulated telemetry (µε / accel / gyro / vibration)
   · SG01 SHOW STRAIN demo (foil micro-deform + heat overlay)
   · IMU01 SHOW AXES demo (pitch/roll/yaw)
   · SHOW ON CHASSIS (front structural context of EV-CH-007)
   · GLB drop-in support: /models/sensors/<ID>.glb if present
   ============================================================ */

import * as THREE from 'three';
import { createView } from '../core/scene.js';
import { buildChassis, flashRegion } from '../core/chassis.js';
import { buildSG01 } from '../core/detail/sg01.js';
import { buildIMU01 } from '../core/detail/imu01.js';
import { disposeGroup } from '../core/detail/shared.js';
import { SENSOR_LAB, LAB_SWITCHER, LAB_IMPLEMENTED, detailById, LAB_PENDING_NOTE } from '../config/sensorDetail.js';
import { sensorById } from '../config/sensors.js';

const VIEW_PRESETS = {
  iso:     (d) => new THREE.Vector3(0.62, 0.55, 0.62).normalize().multiplyScalar(d),
  front:   (d) => new THREE.Vector3(0, 0.14, 1).normalize().multiplyScalar(d),
  top:     (d) => new THREE.Vector3(0, 1, 0.14).normalize().multiplyScalar(d),
  side:    (d) => new THREE.Vector3(1, 0.18, 0).normalize().multiplyScalar(d),
  bottom:  (d) => new THREE.Vector3(0, -1, 0.25).normalize().multiplyScalar(d),
};
const CHASSIS_REGIONS = ['B1', 'B2', 'C1', 'F1'];     // front structural context

export function createSensorLabPage(host) {
  const page = document.createElement('div');
  page.className = 'sl-page';
  host.appendChild(page);

  page.innerHTML = `
    <div class="sl-view" id="sl-view">
      <svg class="sl-svg" id="sl-svg"></svg>
      <div class="sl-co" id="sl-co"></div>
      <div class="sl-hint">drag · orbit &nbsp; scroll · zoom &nbsp; right-drag · pan &nbsp; double-click · focus part</div>
    </div>

    <div class="sl-sw" id="sl-sw"></div>

    <div class="sl-panel" id="sl-panel">
      <div class="sl-phead">
        <span class="sl-id" id="sl-id">SG01</span>
        <div class="sl-who">
          <h2 id="sl-name">Strain Gauge Sensor</h2>
          <div class="sl-sub" id="sl-sub">—</div>
        </div>
        <span class="sl-simchip" id="sl-simchip">SIM · PROTOTYPE</span>
      </div>
      <div class="sl-parts-det" id="sl-parts-det" style="display:none"></div>
      <div class="sl-tabs" id="sl-tabs">
        <button class="on" data-t="spec">SPECIFICATIONS</button>
        <button data-t="live">LIVE DATA</button>
        <button data-t="parts">PARTS</button>
      </div>
      <div class="sl-body" id="sl-body"></div>
      <div class="sl-foot">PROTOTYPE SENSOR DESIGN · SIMULATED DATA · NOT CERTIFIED HARDWARE</div>
    </div>

    <div class="sl-controls" id="sl-controls">
      <div class="sl-rows">
        <div class="row">
          <span class="sl-lbl">CAMERA</span>
          <button class="btn small on" data-view="iso">ISO</button>
          <button class="btn small" data-view="front">FRONT</button>
          <button class="btn small" data-view="top">TOP</button>
          <button class="btn small" data-view="side">SIDE</button>
          <button class="btn small" data-view="bottom">BOTTOM</button>
          <button class="btn small" id="sl-reset">RESET</button>
          <span class="sep"></span>
          <button class="btn" id="sl-internal">◇ INTERNAL</button>
          <button class="btn" id="sl-anatomy">⌖ ANATOMY</button>
          <button class="btn" id="sl-chassis">⇳ ON CHASSIS</button>
        </div>
        <div class="row">
          <span class="sl-lbl">ASSEMBLY</span>
          <button class="btn small" id="sl-as-on">ASSEMBLED</button>
          <input id="sl-expl-range" type="range" min="0" max="100" value="0">
          <button class="btn small" id="sl-as-off">EXPLODED</button>
          <span class="sep"></span>
          <span id="sl-demo"></span>
        </div>
      </div>
    </div>

    <div class="sl-note" id="sl-note">SG01 → FRONT-LEFT RAIL (B1) · IMU01 → FRONT CROSS-MEMBER (F1)</div>

    <div class="sl-pending" id="sl-pending" style="display:none">
      <div class="sl-pcard">
        <div class="sl-pg">MODEL PENDING</div>
        <h3 id="sl-pn">—</h3>
        <p id="sl-pp"></p>
        <div class="sl-drop" id="sl-pdrop"></div>
      </div>
    </div>
  `;

  /* ============================ 3D view ============================ */
  const viewEl = page.querySelector('#sl-view');
  const V = createView(viewEl, {
    camHome: {
      pos: new THREE.Vector3(0.10, 0.08, 0.10),
      target: new THREE.Vector3(0, 0.012, 0),
    },
    onFrame: frameLoop,
  });
  V.controls.minDistance = 0.03;
  V.controls.maxDistance = 3.2;
  V.controls.maxPolarAngle = Math.PI;
  V.controls.update();

  /* dock bench (product-studio pedestal) */
  const bench = new THREE.Group();
  bench.name = 'bench';
  {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.082, 0.012, 40),
      new THREE.MeshStandardMaterial({ color: 0x0a0f16, metalness: 0.12, roughness: 0.85 })
    );
    disc.position.y = -0.006;
    disc.receiveShadow = true;
    bench.add(disc);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.076, 0.0012, 6, 48),
      new THREE.MeshBasicMaterial({ color: 0x38d9cf, transparent: true, opacity: 0.35 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.0002;
    bench.add(rim);
    // soft under-glow ring only during dock (faint)
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.062, 40),
      new THREE.MeshBasicMaterial({ color: 0x38d9cf, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.0004;
    bench.add(glow);
  }
  V.scene.add(bench);

  /* neutral product-studio environment for the lab (metals read
     silvery instead of mirroring the dark teal studio strips) */
  {
    const size = 1024;
    const cvs = document.createElement('canvas');
    cvs.width = size; cvs.height = size;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.0, '#f2f6fc');
    grad.addColorStop(0.16, '#bccadf');
    grad.addColorStop(0.5, '#2a3546');
    grad.addColorStop(1.0, '#080c14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';          // top softbox
    ctx.fillRect(size * 0.08, size * 0.03, size * 0.84, size * 0.13);
    ctx.fillStyle = 'rgba(214,232,255,0.45)';          // side soft panels
    ctx.fillRect(size * 0.03, size * 0.5, size * 0.16, size * 0.22);
    ctx.fillRect(size * 0.81, size * 0.48, size * 0.16, size * 0.24);
    const env = new THREE.CanvasTexture(cvs);
    env.colorSpace = THREE.SRGBColorSpace;
    V.scene.environment = env;
    V.scene.environmentIntensity = 0.55;
  }

  /* ============================ chassis context ============================ */
  const { group: chassisGroup, regionGroups } = buildChassis(V.scene);
  chassisGroup.visible = false;
  V.scene.add(chassisGroup);

  /* ============================ state ============================ */
  const state = {
    sensorId: 'SG01',
    view: 'iso',
    tab: 'spec',
    explodeT: 0, explodeTarget: 0,
    internal: false, anatomy: false,
    strain: false, strainMode: 'TENSION',
    axes: false, rotMode: 'PITCH',
    chassisOn: false,
    load: 0.55,
    selPart: null,
    glb: { SG01: false, IMU01: false },
  };

  let model = null;        // current sensor model { group, parts, refs, labels, cfg, id }
  const sensorRoot = new THREE.Group();
  sensorRoot.name = 'sensor-root';
  V.scene.add(sensorRoot);

  /* ============================ QA / procedural GLB support ============================ */
  async function checkGLBs() {
    // Presence of a CAD export is tracked via models/sensors/manifest.json
    // (an existing, always-200 file) so a missing .glb does NOT emit a
    // 404 console error. When a real CAD file lands, add it to the manifest.
    let avail = [];
    try {
      const res = await fetch('models/sensors/manifest.json');
      if (res.ok) {
        const j = await res.json();
        if (j && Array.isArray(j.available)) avail = j.available.map(f => String(f).toLowerCase());
      }
    } catch { /* manifest missing → no GLBs */ }
    for (const id of LAB_IMPLEMENTED) {
      state.glb[id] = avail.some(f => f.startsWith(id.toLowerCase()));
    }
  }
  checkGLBs();

  async function maybeLoadGLB(id) {
    if (!state.glb[id]) return null;
    try {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(detailById(id).modelFile);
      return gltf.scene;
    } catch (e) { console.warn('GLB load failed → procedural fallback', e); return null; }
  }

  /* ============================ sensor mounting ============================ */
  async function mountSensor(id) {
    // tear down
    if (model) {
      sensorRoot.remove(model.group);
      disposeGroup(model.group);
      model = null;
    }
    // reset transient states
    state.explodeT = 0; state.explodeTarget = 0;
    state.internal = false; state.anatomy = false;
    state.strain = false; state.axes = false;
    state.selPart = null;
    sensorRoot.rotation.set(0, 0, 0);
    sensorRoot.position.set(0, 0, 0);
    sensorRoot.visible = true;
    clearLabels();
    page.querySelector('#sl-internal').classList.remove('on');
    page.querySelector('#sl-anatomy').classList.remove('on');
    page.querySelector('#sl-expl-range').value = 0;

    const builder = id === 'SG01' ? buildSG01 : id === 'IMU01' ? buildIMU01 : null;
    if (!builder) return;                       // pending sensor — no model
    model = builder();
    sensorRoot.add(model.group);

    // GLB override (future CAD drop-in)
    const glb = await maybeLoadGLB(id);
    if (glb) {
      sensorRoot.remove(model.group);
      disposeGroup(model.group);
      sensorRoot.add(glb);
      model.glbMode = true;
    }

    // link to panel + canned UI
    renderHeader();
    renderTab();
    buildDemoArea();
    resetExplodeRange();
    reframe();
  }

  /* ============================ camera ============================ */
  function explodeBounds(t) {
    const saved = new Map();
    model.parts.forEach(p => saved.set(p.key, p.group.position.clone()));
    model.parts.forEach(p => {
      p.group.position.set(0, p.axis.y * p.offset * t, p.axis.z * p.offset * t);
    });
    const box = new THREE.Box3().setFromObject(model.group);
    model.parts.forEach(p => p.group.position.copy(saved.get(p.key)));
    return box;
  }

  function currentFraming() {
    const target = new THREE.Vector3();
    let dist;
    if (state.chassisOn && model) {
      const cfg = model.cfg;
      target.set(...cfg.mountPos.map((v, i) => i === 1 ? v + 0.03 : v));
      dist = 0.42;
    } else if (model) {
      const tEff = Math.max(state.explodeT, state.explodeTarget);
      const box = tEff > 0.02 ? explodeBounds(tEff) : new THREE.Box3().setFromObject(model.group);
      const size = box.getSize(new THREE.Vector3());
      target.set(0, box.getCenter(new THREE.Vector3()).y, 0);
      dist = Math.max(size.x, size.y * 1.5, size.z) * 1.15;
      // widen if the exploded ladder is taller than the angle-of-view covers
      const halfV = (size.y / 2) / Math.tan((V.camera.fov * Math.PI) / 360);
      dist = Math.max(dist, halfV * 1.15);
      dist = Math.max(dist, 0.06);
    } else {
      target.set(0, 0.01, 0);
      dist = 0.24;
    }
    return { target, dist };
  }

  function reframe() {
    const { target, dist } = currentFraming();
    const off = VIEW_PRESETS[state.view] ? VIEW_PRESETS[state.view](dist) : VIEW_PRESETS.iso(dist);
    V.flyTo(target.clone().add(off), target, state.chassisOn ? 0.85 : 0.6);
  }

  function applyChassisState() {
    chassisGroup.visible = state.chassisOn;
    if (state.chassisOn) {
      chassisGroup.traverse(o => {
        if (o.isMesh && o.userData.regionId) {
          o.visible = CHASSIS_REGIONS.includes(o.userData.regionId);
        } else if (o.isMesh) {
          o.visible = false;
        }
      });
      // region groups themselves are empty of geometry — toggle group + flash mount region
      Object.values(regionGroups).forEach(g => {
        g.visible = CHASSIS_REGIONS.includes(g.userData.regionId || '');
      });
      const reg = model && model.cfg ? model.cfg.region : 'F1';
      const regColor = model && model.cfg ? parseInt(model.cfg.accent.replace('#', ''), 16) : 0x38d9cf;
      Object.values(regionGroups).forEach(g => flashRegion(g, false));
      flashRegion(regionGroups[reg], true, regColor, 0.5);
    } else {
      Object.values(regionGroups).forEach(g => flashRegion(g, false));
    }
    bench.visible = !state.chassisOn;
    if (model) {
      sensorRoot.position.set(...(state.chassisOn ? model.cfg.mountPos : [0, 0, 0]));
    }
    reframe();
  }

  /* ============================ explode / internal ============================ */
  function applyExplode() {
    if (!model) return;
    const t = state.explodeT;
    model.parts.forEach(p => {
      p.group.position.set(0, p.axis.y * p.offset * t, p.axis.z * p.offset * t);
    });
  }

  function applyInternal() {
    if (!model) return;
    model.parts.forEach(p => {
      const def = model.cfg.parts.find(x => x.key === p.key) || {};
      const faded = state.internal && def.internal;
      p.group.traverse(o => {
        if (o.isMesh && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(m => {
            if (!faded) {
              if (m.userData.decal) { m.opacity = 1; m.transparent = true; }
              else if (m.userData._wasTransparent) { m.opacity = m.userData._wasTransparent; m.transparent = true; }
              else { m.opacity = 1; m.transparent = false; }
            } else {
              m.transparent = true;
              if (m.userData.decal) m.opacity = 0;
              else m.opacity = def.key === 'cover' ? 0.05 : 0.13;
            }
            m.needsUpdate = true;
          });
        }
      });
    });
    if (state.internal) drawInternalLabels();
    else if (state.anatomy) drawLabels();
  }

  /* ============================ selection + dim ============================ */
  let drag = { downX: 0, downY: 0, downT: 0, moved: false };

  function onPointerDown(ev) {
    drag.downX = ev.clientX; drag.downY = ev.clientY; drag.downT = Date.now(); drag.moved = false;
  }
  function onPointerMove(ev) {
    if (Math.abs(ev.clientX - drag.downX) + Math.abs(ev.clientY - drag.downY) > 6) drag.moved = true;
  }
  function onPointerUp(ev) {
    if (drag.moved || Date.now() - drag.downT > 600) return;
    pickPart(ev);
  }
  function onDblClick(ev) {
    const hit = raycast(ev);
    if (hit) focusPart(hit.partKey);
  }
  function raycast(ev) {
    if (!model) return null;
    V.setPointer(ev);
    V.raycaster.setFromCamera(V.pointer, V.camera);
    const targets = [];
    model.parts.forEach(p => p.group.traverse(o => { if (o.isMesh && o.userData.pickable) targets.push(o); }));
    const hits = V.raycaster.intersectObjects(targets, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.partKey) o = o.parent;
    return o ? { partKey: o.userData.partKey } : null;
  }
  function pickPart(ev) {
    const hit = raycast(ev);
    state.selPart = hit ? hit.partKey : null;
    renderPartDetail();
    renderPartsTab();
  }
  function focusPart(key) {
    const part = model && model.parts.get(key);
    if (!part) return;
    const box = new THREE.Box3().setFromObject(part.group);
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() * 1.15 + 0.02;
    c.applyMatrix4(sensorRoot.matrixWorld);
    V.flyTo(c.clone().add(new THREE.Vector3(0.6, 0.4, 0.6).normalize().multiplyScalar(r)), c, 0.7);
  }

  function updateSelection() {
    if (!model) return;
    const accent = new THREE.Color(model.cfg.accent);
    model.parts.forEach(p => {
      p.group.traverse(o => {
        if (!o.isMesh || !o.material || (!Array.isArray(o.material) && o.material.userData.decal)) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => {
          if (!m.userData.baseColor) m.userData.baseColor = m.color ? m.color.getHex() : 0xffffff;
          if (state.selPart === p.key) {
            m.color.set(m.userData.baseColor);
            if (m.emissive) { m.emissive.setHex(accent.getHex()); m.emissiveIntensity = 0.5; }
          } else if (state.selPart) {
            m.color.set(m.userData.baseColor).multiplyScalar(0.32);
            if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
          } else {
            m.color.set(m.userData.baseColor);
            if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
          }
        });
      });
    });
  }

  /* ============================ SG01 strain demo ============================ */
  const strainArrows = new THREE.Group();
  strainArrows.name = 'strain-arrows';
  sensorRoot.add(strainArrows);
  let strainTipL = null, strainTipR = null, strainShaft = null;
  {
    const mk = (dir, x, z) => {
      const a = new THREE.ArrowHelper(new THREE.Vector3(...dir), new THREE.Vector3(x, 0.016, z), 0.016, 0xf2b94e, 0.005, 0.0035);
      a.children.forEach(c => { c.material.transparent = true; c.material.depthTest = false; });
      strainArrows.add(a);
      return a;
    };
    strainTipL = mk([0, 0, -1], 0, -0.022);
    strainTipR = mk([0, 0, 1], 0, 0.022);
  }
  strainArrows.visible = false;

  function tickStrain(t) {
    if (!model) return;
    const amp = clampStrainAmp();
    const dir = state.strainMode === 'COMPRESSION' ? -1 : 1;
    // foil micro-deformation (exaggerated visualisation)
    const grid = model.refs.foilGrid;
    if (grid) grid.scale.z = 1 + dir * amp * 0.045 * Math.sin(t * 2.6);
    // heat overlay on foil
    const fm = model.refs.foilMat;
    if (fm && fm.emissive) {
      const heat = Math.min(1, amp * 1.15 + 0.06);
      fm.emissive.setRGB(1 * heat * 0.55, 0.55 * heat, 0.1 * heat);
      fm.emissiveIntensity = heat;
    }
    // pulsing arrows
    const pulse = 0.55 + 0.35 * Math.sin(t * 3.2);
    [strainTipL, strainTipR].forEach(a => {
      const l = a.line.material, c = a.cone.material;
      l.opacity = pulse; c.opacity = pulse;
      l.color.setHex(dir === 1 ? 0xf2b94e : 0xff6b5e);
      c.color.setHex(dir === 1 ? 0xf2b94e : 0xff6b5e);
    });
  }

  function clampStrainAmp() {
    const live = readStrainValue();
    return Math.max(0, Math.min(1.4, (live - 52) / 120));
  }

  /* ============================ IMU01 axes demo ============================ */
  function tickAxes(t) {
    if (!model) return;
    const a = Math.sin(t * 0.9) * 0.34;
    if (state.rotMode === 'PITCH') sensorRoot.rotation.x = a;
    else if (state.rotMode === 'ROLL') sensorRoot.rotation.z = a;
    else sensorRoot.rotation.y = a;
    const deg = Math.round(a * 180 / Math.PI);
    const el = page.querySelector('#sl-attitude');
    if (el) el.textContent = `${state.rotMode} ${deg > 0 ? '+' : ''}${deg}°  (${state.rotMode === 'PITCH' ? 'nose up/down' : state.rotMode === 'ROLL' ? 'left/right roll' : 'heading swing'})`;
  }
  function easeBackAxes(dt) {
    sensorRoot.rotation.x *= 1 - Math.min(1, dt * 6);
    sensorRoot.rotation.y *= 1 - Math.min(1, dt * 6);
    sensorRoot.rotation.z *= 1 - Math.min(1, dt * 6);
  }

  /* ============================ labels / callouts ============================ */
  const MAX_CHIPS = 10;
  const chips = [];
  const chipLayer = page.querySelector('#sl-co');
  const svgLayer = page.querySelector('#sl-svg');
  for (let i = 0; i < MAX_CHIPS; i++) {
    const chip = document.createElement('div');
    chip.className = 'sl-chip';
    chip.innerHTML = `<b></b><i></i>`;
    chipLayer.appendChild(chip);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', '#4f8cff');
    line.setAttribute('stroke-width', '1');
    svgLayer.appendChild(line);
    chips.push({ chip, line, el: chip.querySelector('b'), sub: chip.querySelector('i'), visible: false });
  }

  function clearLabels() {
    chips.forEach(c => { c.chip.style.display = 'none'; c.line.setAttribute('display', 'none'); c.visible = false; });
  }

  function projectToPx(world) {
    const v = world.clone().project(V.camera);
    if (v.z > 1 || v.z < -1) return null;
    const w = viewEl.clientWidth, h = viewEl.clientHeight;
    return { x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h };
  }

  function drawLabels() {
    if (!model) { clearLabels(); return; }
    if (state.internal) return drawInternalLabels();   // internal labels replace anatomy in X-ray
    const defs = model.labels;
    const color = model.cfg.accent;
    clearLabels();
    defs.slice(0, MAX_CHIPS).forEach((def, i) => {
      const part = model.parts.get(def.key);
      if (!part) return;
      const wp = part.group.localToWorld(def.anchor.clone());
      const p = projectToPx(wp);
      if (!p) return;
      const c = chips[i];
      c.visible = true;
      c.chip.style.display = 'flex';
      c.line.setAttribute('display', '');
      c.line.setAttribute('stroke', color);
      c.el.textContent = def.text;
      c.el.style.color = color;
      c.sub.textContent = def.sub;
      // offset label, clamp to canvas
      const w = viewEl.clientWidth, h = viewEl.clientHeight;
      let lx = Math.min(Math.max(p.x + 16, 8), w - 190);
      let ly = Math.min(Math.max(p.y - 20, 8), h - 34);
      c.chip.style.left = lx + 'px';
      c.chip.style.top = ly + 'px';
      c.line.setAttribute('x1', lx + 4); c.line.setAttribute('y1', ly + 10);
      c.line.setAttribute('x2', p.x.toFixed(1)); c.line.setAttribute('y2', p.y.toFixed(1));
    });
  }

  function drawInternalLabels() {
    if (!model) { clearLabels(); return; }
    const defs = model.cfg.internalLabels;
    clearLabels();
    defs.slice(0, MAX_CHIPS).forEach((def, i) => {
      const part = model.parts.get(def.key);
      if (!part) return;
      const box = new THREE.Box3().setFromObject(part.group);
      const ctr = box.getCenter(new THREE.Vector3());
      ctr.applyMatrix4(sensorRoot.matrixWorld);
      const p = projectToPx(ctr);
      if (!p) return;
      const c = chips[i];
      c.visible = true;
      c.chip.style.display = 'flex';
      c.line.setAttribute('display', '');
      c.line.setAttribute('stroke', model.cfg.accent);
      c.el.textContent = def.text;
      c.el.style.color = model.cfg.accent;
      c.sub.textContent = def.sub;
      const w = viewEl.clientWidth, h = viewEl.clientHeight;
      let lx = Math.min(Math.max(p.x + 16, 8), w - 190);
      let ly = Math.min(Math.max(p.y - 20, 8), h - 34);
      c.chip.style.left = lx + 'px';
      c.chip.style.top = ly + 'px';
      c.line.setAttribute('x1', lx + 4); c.line.setAttribute('y1', ly + 10);
      c.line.setAttribute('x2', p.x.toFixed(1)); c.line.setAttribute('y2', p.y.toFixed(1));
    });
  }

  /* ============================ telemetry ============================ */
  let liveAcc = 0;
  function readStrainValue() {
    const now = Date.now();
    return 50 + state.load * 96 + Math.sin(now / 2200) * 2.4;
  }
  function tickTelemetry(t) {
    liveAcc += t;
    if (liveAcc < 0.22) return;
    liveAcc = 0;
    refreshLive();
  }
  function refreshLive() {
    if (!model) return;
    const id = state.sensorId;
    const el = page.querySelector('#sl-body');
    if (state.tab !== 'live' || !el) return;
    if (id === 'SG01') {
      const cur = Math.max(0, readStrainValue());
      const exp = 50, base = 48;
      const res = cur - exp;
      const ratio = cur / exp;
      const status = ratio > 2.0 ? 'CRITICAL' : ratio > 1.5 ? 'ELEVATED' : 'NORMAL';
      const stClass = status === 'NORMAL' ? 'ok' : status === 'ELEVATED' ? 'warn' : 'crit';
      el.innerHTML = `
        <div class="sl-rows2">
          <div class="sl-kv"><span>Measurement</span><b>Local longitudinal strain</b></div>
          <div class="sl-kv"><span>Unit</span><b>µε (microstrain)</b></div>
        </div>
        <div class="sl-gauge">
          <div class="sl-gbar"><i style="width:${Math.min(100, (cur / 250) * 100)}%"></i></div>
          <div class="sl-gnum">${cur.toFixed(1)} <u>µε</u></div>
        </div>
        <div class="sl-rows2">
          <div class="sl-kv"><span>Current</span><b>${cur.toFixed(1)} µε</b></div>
          <div class="sl-kv"><span>Expected</span><b>${exp} µε</b></div>
          <div class="sl-kv"><span>Baseline</span><b>${base} µε</b></div>
          <div class="sl-kv"><span>Residual</span><b class="${res > 0 ? 'warn' : 'ok'}">${res > 0 ? '+' : ''}${res.toFixed(1)} µε</b></div>
        </div>
        <div class="sl-status ${stClass}"><span class="dot"></span>${status} — ${stClass === 'NORMAL' ? 'within design envelope' : stClass === 'ELEVATED' ? 'above expected envelope — review' : 'design envelope exceeded — inspect structure'}</div>
        <div class="sl-rows2">
          <div class="sl-kv"><span>Load / Baseline</span><b>${Math.round(state.load * 100)} %</b></div>
          <div class="sl-kv"><span>Heat overlay</span><b>${(Math.min(1, clampStrainAmp() * 1.15 + 0.06) * 100).toFixed(0)} %</b></div>
        </div>
        <div class="sl-sim">SIMULATED DATA — foil heat overlay tied to structural load</div>`;
    } else if (id === 'IMU01') {
      const l = state.load;
      const n = Date.now();
      const Ax = 0.14 * l + Math.sin(n / 1800) * 0.05;
      const Ay = -0.03 + Math.cos(n / 1500) * 0.04;
      const Az = 1.01 + Math.sin(n / 2600) * 0.03;
      const Gx = 3.2 * l + Math.sin(n / 1400) * 1.1;
      const Gy = -1.8 * l + Math.cos(n / 1700) * 0.8;
      const Gz = 0.9 * l + Math.sin(n / 2000) * 0.6;
      const vib = 0.13 + 0.19 * l + (Math.random() * 0.02);
      const axis = (arr, u) => `<div class="sl-axis" style="--ac:${model.cfg.accent}">${arr.map(v => `<div><span>${v.l}</span><i style="width:${Math.min(100, Math.abs(v.v) * 52)}%"></i><b>${v.v >= 0 ? '+' : ''}${v.v.toFixed(2)} ${u}</b></div>`).join('')}</div>`;
      el.innerHTML = `
        <div class="sl-rows2">
          <div class="sl-kv"><span>Sensor</span><b>6-DOF MEMS (accel + gyro)</b></div>
          <div class="sl-kv"><span>Status</span><b class="ok">NORMAL</b></div>
        </div>
        <div class="sl-live-sec">ACCELERATION <i>(g)</i></div>
        ${axis([{ l: 'Ax', v: Ax }, { l: 'Ay', v: Ay }, { l: 'Az', v: Az }], 'g')}
        <div class="sl-live-sec">ANGULAR VELOCITY <i>(°/s)</i></div>
        ${axis([{ l: 'Gx', v: Gx }, { l: 'Gy', v: Gy }, { l: 'Gz', v: Gz }], '°/s')}
        <div class="sl-rows2">
          <div class="sl-kv"><span>Vibration RMS</span><b>${vib.toFixed(2)} g</b></div>
          <div class="sl-kv"><span>Axes</span><b>X·Y·Z</b></div>
        </div>
        <div class="sl-sim">SIMULATED DATA — MEMS model driven by the front-structure load case</div>`;
    }
  }

  /* ============================ panel renders ============================ */
  function renderHeader() {
    const d = detailById(state.sensorId);
    const c = model ? model.cfg : d;
    page.querySelector('#sl-id').textContent = state.sensorId;
    page.querySelector('#sl-id').style.color = c ? c.accent : 'var(--text-dim)';
    page.querySelector('#sl-name').textContent = c ? c.name : '—';
    page.querySelector('#sl-sub').textContent = c ? c.subtitle : '—';
  }

  function renderSpec() {
    const el = page.querySelector('#sl-body');
    if (!model) {
      const s = sensorById(state.sensorId);
      el.innerHTML = `<div class="sl-empty">No 3D model defined for ${state.sensorId}.<br>Drop a CAD export at <b>/models/sensors/${state.sensorId.toLowerCase()}.glb</b>.</div>`;
      return;
    }
    const c = model.cfg;
    const lr = regionName(c.region);
    el.innerHTML = `
      <table class="sl-spec">
        ${c.specs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
      </table>
      <div class="sl-mount">
        <div class="sl-live-sec">MOUNTING LOCATION</div>
        <p><b class="acct">${lr}</b> — ${c.mountHint}</p>
        <div class="sl-pos mono">POS ${c.mountPos.map(v => v.toFixed(3)).join(' , ')} m</div>
      </div>
      <div class="sl-sim">SIMULATED DATA — conceptual prototype geometry, not certified hardware</div>`;
  }

  function regionName(id) {
    const r = { B1: 'Front-Left Rail', B2: 'Front-Right Rail', F1: 'Front Structural Zone', C1: 'Central Floor / Battery' }[id];
    return r || id;
  }

  function renderLive() {
    refreshLive();
  }

  function renderPartsTab() {
    const el = page.querySelector('#sl-body');
    if (!model) { renderSpec(); return; }
    el.innerHTML = `<div class="sl-partlist">${model.cfg.parts.map(p => `
      <button class="sl-part ${state.selPart === p.key ? 'sel' : ''}" data-k="${p.key}">
        <span class="dk">${p.key}</span><span class="nm"><b>${p.label}</b><i>${p.fn}</i></span>
      </button>`).join('')}</div>`;
    el.querySelectorAll('.sl-part').forEach(b => b.addEventListener('click', () => {
      state.selPart = b.dataset.k;
      renderPartDetail();
      renderPartsTab();
    }));
  }

  function renderPartDetail() {
    const det = page.querySelector('#sl-parts-det');
    if (!state.selPart || !model) { det.style.display = 'none'; return; }
    const p = model.cfg.parts.find(x => x.key === state.selPart);
    if (!p) { det.style.display = 'none'; return; }
    det.style.display = 'block';
    det.innerHTML = `
      <div class="sl-det-h"><span>COMPONENT</span><b>${p.label}</b></div>
      <div class="sl-det-rows">
        <div class="sl-kv"><span>Sensor</span><b>${state.sensorId}</b></div>
        <div class="sl-kv"><span>Function</span><b>${p.fn}</b></div>
        <div class="sl-kv"><span>Status</span><b class="ok">SIMULATED</b></div>
      </div>`;
  }

  function renderTab() {
    page.querySelectorAll('#sl-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === state.tab));
    const el = page.querySelector('#sl-body');
    if (state.tab === 'spec') renderSpec();
    else if (state.tab === 'live') renderLive();
    else renderPartsTab();
    if (state.tab === 'live' && !model) renderSpec();
  }

  /* ============================ demo area (per sensor type) ============================ */
  function buildDemoArea() {
    const host = page.querySelector('#sl-demo');
    host.innerHTML = '';
    if (!model) return;
    if (state.sensorId === 'SG01') {
      host.innerHTML = `
        <button class="btn" id="sl-strain">⇆ SHOW STRAIN</button>
        <button class="btn small" id="sl-strain-mode">TENSION</button>
        <span class="sl-lbl" style="margin-left:8px">LOAD</span>
        <input id="sl-load" type="range" min="0" max="100" value="${Math.round(state.load * 100)}" style="width:120px">
        <span class="sl-loadv mono" id="sl-loadv">${Math.round(state.load * 100)}%</span>`;
      host.querySelector('#sl-strain').addEventListener('click', e => {
        state.strain = !state.strain;
        e.currentTarget.classList.toggle('on', state.strain);
        strainArrows.visible = state.strain;
      });
      host.querySelector('#sl-strain-mode').addEventListener('click', e => {
        state.strainMode = state.strainMode === 'TENSION' ? 'COMPRESSION' : 'TENSION';
        e.currentTarget.textContent = state.strainMode;
        e.currentTarget.classList.toggle('on', state.strainMode === 'COMPRESSION');
      });
      host.querySelector('#sl-load').addEventListener('input', e => setLoad(+e.target.value / 100));
    } else if (state.sensorId === 'IMU01') {
      host.innerHTML = `
        <button class="btn" id="sl-axes">◆ SHOW AXES</button>
        <button class="btn small mx on" data-m="PITCH">PITCH</button>
        <button class="btn small mx" data-m="ROLL">ROLL</button>
        <button class="btn small mx" data-m="YAW">YAW</button>
        <span class="sl-lbl" style="margin-left:8px">LOAD</span>
        <input id="sl-load" type="range" min="0" max="100" value="${Math.round(state.load * 100)}" style="width:120px">
        <span class="sl-loadv mono" id="sl-loadv">${Math.round(state.load * 100)}%</span>
        <span class="sl-att" id="sl-attitude"></span>`;
      host.querySelector('#sl-axes').addEventListener('click', e => {
        state.axes = !state.axes;
        e.currentTarget.classList.toggle('on', state.axes);
      });
      host.querySelectorAll('.mx').forEach(b => b.addEventListener('click', () => {
        state.rotMode = b.dataset.m;
        host.querySelectorAll('.mx').forEach(x => x.classList.toggle('on', x === b));
      }));
      host.querySelector('#sl-load').addEventListener('input', e => setLoad(+e.target.value / 100));
    }
  }

  function setLoad(v) {
    state.load = Math.max(0, Math.min(1, v));
    const el = page.querySelector('#sl-loadv');
    if (el) el.textContent = Math.round(state.load * 100) + '%';
    if (state.tab === 'live') refreshLive();
  }

  /* ============================ frame loop ============================ */
  function frameLoop(t, dt) {
    state.explodeT += (state.explodeTarget - state.explodeT) * Math.min(1, dt * 4.5);
    // reframe once per explosion so the animated ladder stays framed
    if (state.explodeTarget > 0.02 && !state._explodeReframed) {
      state._explodeReframed = true;
      reframe();
    } else if (state.explodeTarget < 0.02) {
      state._explodeReframed = false;
    }
    applyExplode();
    applyInternal();
    updateSelection();
    if (state.strain && state.sensorId === 'SG01') tickStrain(t);
    if (state.axes && state.sensorId === 'IMU01') tickAxes(t);
    else if (!state.axes && state.sensorId === 'IMU01') easeBackAxes(dt);
    if (model && state.chassisOn && model.cfg) {
      // gentle periodic dwell highlight on the mount region (QA-friendly, cheap)
    }
    if (state.internal) drawInternalLabels();
    else if (state.anatomy) drawLabels();
    V.updateTween(dt);
    tickTelemetry(t);
  }

  /* ============================ switcher ============================ */
  function buildSwitcher() {
    const host = page.querySelector('#sl-sw');
    const groups = [
      { label: 'STRAIN', ids: ['SG01', 'SG02', 'SG03', 'SG04'] },
      { label: 'IMU', ids: ['IMU01', 'IMU02'] },
      { label: 'LOAD · DISP', ids: ['LC01', 'DISP01'] },
    ];
    host.innerHTML = `<span class="sl-sw-lbl">SENSORS</span>` + groups.map(g => `
      <span class="sl-sw-group">${g.label}</span>` + g.ids.map(id => `
      <button class="sl-sw-chip" data-id="${id}">${id}</button>`).join('')).join('');
    host.querySelectorAll('.sl-sw-chip').forEach(b => {
      b.classList.toggle('on', b.dataset.id === state.sensorId);
      const impl = LAB_IMPLEMENTED.includes(b.dataset.id);
      b.title = impl ? 'open engineering inspection' : 'model not yet defined';
      if (!impl) b.classList.add('pend');
      b.addEventListener('click', () => selectSensor(b.dataset.id));
    });
  }

  async function selectSensor(id) {
    state.sensorId = id;
    buildSwitcher();
    const pending = page.querySelector('#sl-pending');
    const isImpl = LAB_IMPLEMENTED.includes(id);
    pending.style.display = isImpl ? 'none' : 'flex';
    page.querySelector('#sl-demo').innerHTML = '';
    if (!isImpl) {
      const d = detailById(id) || { name: id, subtitle: '' };
      const s = sensorById(id);
      page.querySelector('#sl-pn').textContent = `${id} — ${d.name || ''}`.trim();
      page.querySelector('#sl-pp').textContent = s && s.name ? s.name : LAB_PENDING_NOTE;
      page.querySelector('#sl-pdrop').textContent = `→ /models/sensors/${id.toLowerCase()}.glb`;
      sensorRoot.visible = false;
      bench.visible = false;
      chassisGroup.visible = false;
      state.chassisOn = false;
      page.querySelector('#sl-chassis').classList.remove('on');
      renderHeader();
      renderTab();
      if (state.tab === 'live') renderLive();
      reframe();
      return;
    }
    sensorRoot.visible = true;
    bench.visible = !state.chassisOn;
    await mountSensor(id);
  }

  /* ============================ controls ============================ */
  function bindControls() {
    page.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      state.view = b.dataset.view;
      page.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('on', x === b));
      reframe();
    }));
    page.querySelector('#sl-reset').addEventListener('click', () => {
      state.view = 'iso';
      page.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('on', x.dataset.view === 'iso'));
      reframe();
    });
    const range = page.querySelector('#sl-expl-range');
    range.addEventListener('input', () => {
      state.explodeTarget = +range.value / 100;
      page.querySelector('#sl-as-on').classList.toggle('on', state.explodeTarget < 0.02);
      page.querySelector('#sl-as-off').classList.toggle('on', state.explodeTarget > 0.98);
    });
    page.querySelector('#sl-as-on').addEventListener('click', () => { range.value = 0; state.explodeTarget = 0; page.querySelector('#sl-as-on').classList.add('on'); page.querySelector('#sl-as-off').classList.remove('on'); });
    page.querySelector('#sl-as-off').addEventListener('click', () => { range.value = 100; state.explodeTarget = 1; page.querySelector('#sl-as-on').classList.remove('on'); page.querySelector('#sl-as-off').classList.add('on'); });
    page.querySelector('#sl-internal').addEventListener('click', e => {
      state.internal = !state.internal;
      e.currentTarget.classList.toggle('on', state.internal);
      if (state.internal) { state.anatomy = false; page.querySelector('#sl-anatomy').classList.remove('on'); }
    });
    page.querySelector('#sl-anatomy').addEventListener('click', e => {
      state.anatomy = !state.anatomy;
      e.currentTarget.classList.toggle('on', state.anatomy);
      if (state.anatomy) { state.internal = false; page.querySelector('#sl-internal').classList.remove('on'); }
      if (!state.anatomy) clearLabels();
    });
    page.querySelector('#sl-chassis').addEventListener('click', e => {
      if (!model) return;
      state.chassisOn = !state.chassisOn;
      e.currentTarget.classList.toggle('on', state.chassisOn);
      applyChassisState();
    });
    page.querySelectorAll('#sl-tabs button').forEach(b => b.addEventListener('click', () => {
      state.tab = b.dataset.t;
      renderTab();
    }));
  }

  function resetExplodeRange() {
    state.explodeTarget = 0;
    const range = page.querySelector('#sl-expl-range');
    range.value = 0;
    page.querySelector('#sl-as-on').classList.add('on');
    page.querySelector('#sl-as-off').classList.remove('on');
  }

  /* ============================ init ============================ */
  viewEl.addEventListener('pointerdown', onPointerDown);
  viewEl.addEventListener('pointermove', onPointerMove);
  viewEl.addEventListener('pointerup', onPointerUp);
  viewEl.addEventListener('dblclick', onDblClick);
  bindControls();
  buildSwitcher();

  (async () => {
    await mountSensor(state.sensorId);
    reframe();
  })();

  /* ============================ debug / headerless hooks ============================ */
  window.__SL = {
    select: selectSensor,
    setView: v => { state.view = v; reframe(); },
    setExplode: v => { state.explodeTarget = Math.max(0, Math.min(1, v)); },
    setInternal: b => { state.internal = !!b; },
    setAnatomy: b => { state.anatomy = !!b; },
    setStrain: b => { state.strain = !!b; strainArrows.visible = !!b; },
    setStrainMode: m => { state.strainMode = m; },
    setLoad: setLoad,
    setAxes: b => { state.axes = !!b; },
    setRotation: m => { state.rotMode = m; },
    setChassis: b => { state.chassisOn = !!b; applyChassisState(); },
    selectPart: k => { state.selPart = k; renderPartDetail(); renderPartsTab(); },
    resetView: () => { state.view = 'iso'; reframe(); },
    probe: () => probe(),
  };

  function probe() {
    const rect = viewEl.getBoundingClientRect();
    const out = {
      sensor: state.sensorId,
      glb: state.glb,
      modelLoaded: !!model,
      partKeys: model ? [...model.parts.keys()] : [],
      meshCount: model ? (() => { let n = 0; model.group.traverse(o => { if (o.isMesh) n++; }); return n; })() : 0,
      state: {
        view: state.view, explodeT: +state.explodeT.toFixed(2), internal: state.internal,
        anatomy: state.anatomy, strain: state.strain, axes: state.axes,
        rotMode: state.rotMode, chassis: state.chassisOn, load: +state.load.toFixed(2), selPart: state.selPart,
      },
      view: { w: Math.round(rect.width), h: Math.round(rect.height) },
      chipsVisible: chips.filter(c => c.visible).length,
      labels: model ? model.labels.length : 0,
      internalLabels: model ? model.cfg.internalLabels.length : 0,
      panel: { phead: !!page.querySelector('#sl-phead'), tabs: page.querySelectorAll('#sl-tabs button').length, body: !!page.querySelector('#sl-body') },
      sw: { chips: page.querySelectorAll('.sl-sw-chip').length, active: state.sensorId },
      camera: { dist: +V.camera.position.distanceTo(V.controls.target).toFixed(3) },
      nav: [...document.querySelectorAll('.nav-item')].map(b => b.textContent.trim()),
    };
    return out;
  }

  return page;
}