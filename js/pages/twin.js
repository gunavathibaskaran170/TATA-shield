/* ============================================================
   SHIELD — STRUCTURAL DIGITAL TWIN (v2)
   "What is happening to the chassis?"
   Premium engineering console: view tabs · scenarios · load
   vectors · anomaly localisation · context-aware inspector ·
   KPI strip · replay timeline. Same EV-CH-007 geometry as the
   Hardware Twin.
   ============================================================ */

import * as THREE from 'three';
import { createView } from '../core/scene.js';
import { buildChassis, flashRegion, setRegionEmissive, clearRegionEmissive, regionMeshList } from '../core/chassis.js';
import { buildSensorRig, setSensorOpacity } from '../core/sensorMeshes.js';
import { makeLabel } from '../core/labels.js';
import { SENSORS, sensorById } from '../config/sensors.js';
import { REGIONS, regionById, ANCHOR } from '../config/vehicle.js';

/* ---------------- view tabs ---------------- */
const VIEWS = ['STRUCTURE', 'X-RAY', 'STRAIN', 'STRESS', 'DISPLACEMENT', 'LOAD PATH', 'SENSORS'];
const VIEW_IDS = {
  'STRUCTURE': 'structure', 'X-RAY': 'xray', 'STRAIN': 'strain', 'STRESS': 'stress',
  'DISPLACEMENT': 'displacement', 'LOAD PATH': 'loadpath', 'SENSORS': 'sensors',
};
const VIEW_UNIT = { strain: 'µε', stress: 'MPa', displacement: 'mm' };

/* ---------------- scenarios ---------------- */
const SCENARIOS = {
  NORMAL: {
    label: 'Normal Load', state: 'NOMINAL', cls: 'ok',
    load: 240, loadL: 122, loadR: 118, asym: 0,
    strain: { F1: 44, B1: 52, B2: 50, C1: 40, B3: 57, B4: 60, R1: 46 },
    stress: { F1: 3.1, B1: 3.6, B2: 3.5, C1: 2.8, B3: 4.0, B4: 4.2, R1: 3.2 },
    disp:   { F1: 0.42, B1: 0.5, B2: 0.47, C1: 0.3, B3: 0.62, B4: 0.66, R1: 0.58 },
    vib: { rms: '0.18 g', dom: '22.0 Hz' }, temp: '24.8 °C',
    decision: 'PASS — overall response within model expectation. Continue periodic monitoring.',
    anomaly: false, hot: 'B1', ev: [['Load Applied', 0.12]],
  },
  HIGH: {
    label: 'High Load', state: 'ELEVATED', cls: 'warn',
    load: 355, loadL: 178, loadR: 177, asym: 0,
    strain: { F1: 62, B1: 74, B2: 71, C1: 58, B3: 81, B4: 84, R1: 65 },
    stress: { F1: 4.5, B1: 5.2, B2: 5.0, C1: 4.0, B3: 5.7, B4: 5.9, R1: 4.7 },
    disp:   { F1: 0.61, B1: 0.71, B2: 0.68, C1: 0.44, B3: 0.88, B4: 0.93, R1: 0.82 },
    vib: { rms: '0.24 g', dom: '22.6 Hz' }, temp: '25.1 °C',
    decision: 'PASS — elevated but within design envelope. Review after next 5 load cycles.',
    anomaly: false, hot: 'B4', ev: [['Load Applied', 0.12], ['High Load Hold', 0.3]],
  },
  UNEVEN: {
    label: 'Uneven Load', state: 'WATCH', cls: 'warn',
    load: 320, loadL: 210, loadR: 110, asym: -1,
    strain: { F1: 58, B1: 92, B2: 36, C1: 46, B3: 96, B4: 41, R1: 52 },
    stress: { F1: 4.2, B1: 6.4, B2: 2.6, C1: 3.3, B3: 6.7, B4: 3.0, R1: 3.8 },
    disp:   { F1: 0.58, B1: 0.98, B2: 0.31, C1: 0.36, B3: 1.04, B4: 0.45, R1: 0.66 },
    vib: { rms: '0.27 g', dom: '21.4 Hz' }, temp: '24.9 °C',
    decision: 'WATCH — asymmetric loading producing torsional response on the left rail. Verify mount shimming before next run.',
    anomaly: false, hot: 'B3', ev: [['Load Applied', 0.12], ['Asymmetry', 0.35]],
  },
  VIBRATION: {
    label: 'Vibration', state: 'WATCH', cls: 'warn',
    load: 260, loadL: 131, loadR: 129, asym: 0,
    strain: { F1: 49, B1: 58, B2: 56, C1: 44, B3: 63, B4: 66, R1: 51 },
    stress: { F1: 3.4, B1: 4.0, B2: 3.9, C1: 3.1, B3: 4.5, B4: 4.7, R1: 3.6 },
    disp:   { F1: 0.47, B1: 0.55, B2: 0.52, C1: 0.33, B3: 0.69, B4: 0.72, R1: 0.63 },
    vib: { rms: '0.62 g', dom: '31.8 Hz' }, temp: '24.6 °C',
    decision: 'WATCH — elevated vibration transmission. Two-IMU ratio R/F = 0.61 remains inside the acceptance band.',
    anomaly: false, hot: 'B4', ev: [['Sweep Start', 0.1], ['Resonance', 0.42], ['Sweep End', 0.7]],
  },
  SHOCK: {
    label: 'Road Shock', state: 'WATCH', cls: 'warn',
    load: 480, loadL: 242, loadR: 238, asym: 0,
    strain: { F1: 74, B1: 88, B2: 86, C1: 66, B3: 96, B4: 102, R1: 78 },
    stress: { F1: 5.3, B1: 6.2, B2: 6.0, C1: 4.7, B3: 6.8, B4: 7.1, R1: 5.6 },
    disp:   { F1: 0.74, B1: 0.88, B2: 0.85, C1: 0.55, B3: 1.08, B4: 1.16, R1: 0.95 },
    vib: { rms: '0.90 g', dom: '38.4 Hz' }, temp: '24.7 °C',
    decision: 'WATCH — transient spike captured at 0:18. Post-event evaluation shows recovery toward baseline; schedule review.',
    anomaly: false, hot: 'B4', ev: [['Load Applied', 0.12], ['Shock Pulse', 0.45], ['Post-Eval', 0.62]],
  },
  CHANGE: {
    label: 'Structural Change', state: 'INSPECTION REQUIRED', cls: 'bad',
    load: 270, loadL: 108, loadR: 162, asym: 1,
    strain: { F1: 50, B1: 56, B2: 62, C1: 45, B3: 61, B4: 78, R1: 54 },
    stress: { F1: 3.5, B1: 3.9, B2: 4.4, C1: 3.2, B3: 4.4, B4: 5.5, R1: 3.8 },
    disp:   { F1: 0.5, B1: 0.56, B2: 0.62, C1: 0.35, B3: 0.68, B4: 1.42, R1: 0.6 },
    vib: { rms: '0.21 g', dom: '21.1 Hz' }, temp: '24.9 °C',
    decision: 'INSPECTION REQUIRED — B4 residual +26 µε repeated across 3 comparable windows; frequency shift −4.7%. Inspect rear-right battery mount torque / shimming.',
    anomaly: true, hot: 'B4',
    ev: [['Load Applied', 0.12], ['Change Introduced', 0.3], ['Watch', 0.55], ['Inspection', 0.78]],
  },
  FAULT: {
    label: 'Sensor Fault', state: 'REVIEW', cls: 'off',
    load: 245, loadL: 124, loadR: 121, asym: 0,
    strain: { F1: 44, B1: 52, B2: null, C1: 40, B3: 57, B4: 60, R1: 46 },
    stress: { F1: 3.1, B1: 3.6, B2: null, C1: 2.8, B3: 4.0, B4: 4.2, R1: 3.2 },
    disp:   { F1: 0.42, B1: 0.5, B2: null, C1: 0.3, B3: 0.62, B4: 0.66, R1: 0.58 },
    vib: { rms: '0.18 g', dom: '22.0 Hz' }, temp: '24.8 °C',
    decision: 'SG02 OFFLINE — channel fault, excluded from assessment. B2 is NOT flagged: structural zones are never failed by sensor loss.',
    anomaly: false, sensorFault: 'SG02', hot: 'B1',
    ev: [['Load Applied', 0.12], ['Sensor Fault', 0.25]],
  },
};
const SCENARIO_ORDER = ['NORMAL', 'HIGH', 'UNEVEN', 'VIBRATION', 'SHOCK', 'CHANGE', 'FAULT'];

/* static model expectation per region (µε) */
const BASELINE = { F1: 40, B1: 47, B2: 46, C1: 34, B3: 50, B4: 49, R1: 42 };
const EXPECTED = { F1: 44, B1: 52, B2: 51, C1: 38, B3: 55, B4: 52, R1: 46 };

const HEAT_RANGE = { strain: [35, 100], stress: [2.4, 7.2], displacement: [0.2, 1.4] };
const CAM_FOCUS = {
  B4: { pos: new THREE.Vector3(0.52, 0.34, 0.4), target: new THREE.Vector3(0.05, 0.04, -0.16) },
  B3: { pos: new THREE.Vector3(-0.52, 0.34, 0.4), target: new THREE.Vector3(-0.05, 0.04, -0.16) },
  F1: { pos: new THREE.Vector3(0.3, 0.4, 0.72), target: new THREE.Vector3(0, 0.04, 0.22) },
  R1: { pos: new THREE.Vector3(0.3, 0.4, -0.72), target: new THREE.Vector3(0, 0.04, -0.22) },
};

/* color ramp: nominal teal -> elevated yellow -> critical red */
function ramp(f) {
  const stops = [[0, 56, 217, 207], [0.55, 242, 185, 78], [0.85, 255, 107, 94]];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (f >= stops[i][0] && f <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const t = (f - a[0]) / Math.max(1e-6, b[0] - a[0]);
  return (Math.round(a[1] + (b[1] - a[1]) * t) << 16)
       | (Math.round(a[2] + (b[2] - a[2]) * t) << 8)
       | Math.round(a[3] + (b[3] - a[3]) * t);
}

function healthCls(s) {
  return s === 'ok' ? 'ok' : s === 'warn' ? 'warn' : s === 'bad' ? 'bad' : 'off';
}

/* seeded pseudo-random walk for the sparkline */
function walk(n, base, spread, seed) {
  let v = base * 0.92; const out = [];
  for (let i = 0; i < n; i++) {
    v += (Math.sin(i * 1.7 + seed) * 0.5 + (Math.random() - 0.5) * 0.6) * spread;
    out.push(Math.max(0, v));
  }
  out[n - 1] = base;
  return out;
}
function sparkSvg(values, color, unit) {
  const W = 316, H = 42;
  const mn = Math.min(...values), mx = Math.max(...values);
  const span = (mx - mn) || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - 4 - ((v - mn) / span) * (H - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<div class="spark">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" opacity="0.95"/>
      <line x1="0" y1="${H - 4 - ((values[values.length - 1] - mn) / span) * (H - 10)}" x2="${W}" y2="${H - 4 - ((values[values.length - 1] - mn) / span) * (H - 10)}" stroke="${color}" stroke-dasharray="3 5" stroke-width="1" opacity="0.5" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="sl"><span>PAST 24 WINDOWS</span><span>${unit}</span></div>
  </div>`;
}
const recent = () => walk(24, 60, 12, Math.random() * 10);

function krow(k, v, cls = '') {
  return `<div class="krow"><div class="k">${k}</div><div class="v ${cls}">${v}</div></div>`;
}
const fmt = (val, unit, digits = 0) => (val === null || val === undefined) ? '—' : `${Number(val).toFixed(digits)}${unit ? ' ' + unit : ''}`;

/* ============================================================ */
export function createTwinPage(host, nav) {
  const page = document.createElement('div');
  page.className = 'tw-page';
  host.appendChild(page);

  page.innerHTML = `
    <div class="tw-stage" id="tw-stage"></div>
    <div class="tw-tabs" id="tw-tabs"></div>
    <div class="tw-badges">
      <div class="badge" id="tw-scen"></div>
      <div class="badge" id="tw-anom" style="display:none"></div>
    </div>
    <div class="tw-hint"><span>CLICK A REGION TO INSPECT</span><span id="tw-hint-secondary"></span></div>
    <div class="tw-legend" id="tw-legend"></div>
    <div class="tw-inspector">
      <div class="in-head">
        <div class="who"><h2 id="tw-h2">Structural Assessment</h2><div class="sub" id="tw-sub">EV-CH-007 · REAR-RIGHT BATTERY MOUNT · SG04</div></div>
        <span class="health" id="tw-health">NOMINAL</span>
      </div>
      <div class="in-body" id="tw-body"></div>
    </div>
    <div class="tw-bottom">
      <div class="brow scen-row">
        <span class="scen-label">SCENARIO</span>
        <div id="tw-scenarios" style="display:flex;gap:6px;overflow:hidden"></div>
        <button class="btn small" id="tw-reset" style="margin-left:auto">Reset View</button>
        <button class="btn small" id="tw-to-hw">Hardware Twin →</button>
      </div>
      <div class="brow"><div class="kpi-strip" id="tw-kpis"></div></div>
      <div class="brow tl-row">
        <button class="tl-play" id="tl-play" title="Play / pause replay">▶</button>
        <div class="tl-wrap" id="tl-wrap">
          <div class="tl-track"></div>
          <div class="tl-track-fill" id="tl-fill"></div>
          <div id="tl-markers"></div>
          <div class="tl-scrub" id="tl-scrub"></div>
          <div class="tl-ticks"><span>BASELINE</span><span>LOAD</span><span>RESPONSE</span><span>EVALUATION</span><span>T+40s</span></div>
        </div>
        <div class="tl-time"><b id="tl-now">00:18</b> / 00:40</div>
        <div class="tl-evt" id="tw-decision">…</div>
      </div>
    </div>
  `;

  /* ---------------- 3D view ---------------- */
  const viewEl = page.querySelector('#tw-stage');
  const V = createView(viewEl, {
    camHome: {
      pos: new THREE.Vector3(0.58, 0.42, 0.56),
      target: new THREE.Vector3(0.0, 0.02, 0.0),
    },
    onFrame: frameLoop,
  });
  V.camera.fov = 40;
  V.camera.updateProjectionMatrix();

  /* model wrapper — enlarge the chassis presence */
  const model = new THREE.Group();
  model.scale.setScalar(1.18);
  V.scene.add(model);

  const { group: chassis, regionGroups } = buildChassis(V.scene);
  model.add(chassis);

  const { group: sensorGroup, sensors: sensorMap } = buildSensorRig();
  model.add(sensorGroup);

  /* ---------------- state ---------------- */
  const state = {
    tab: 'strain',
    scenario: 'NORMAL',
    sel: null,           // { kind:'region'|'sensor', id }
    playing: false,
    t: 18,               // seconds into replay
    T: 40,
    ramp: 1,
    anomalyOn: false,
    batteryMat: null,
  };

  /* battery material ref (for X-RAY transparency) */
  regionGroups['C1'].traverse(o => {
    if (o.isMesh && o.name === 'battery-housing' && o.material) state.batteryMat = o.material;
  });
  const batteryDefaultOpacity = state.batteryMat ? state.batteryMat.opacity : 0.42;

  /* find battery cell / module meshes for X-RAY (keep cells visible) */
  const batteryCells = [];
  regionGroups['C1'].traverse(o => {
    if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.name === '' && o.position.y === 0.008) batteryCells.push(o);
  });

  /* ---------------- load-path arrows ---------------- */
  const arrowGroup = new THREE.Group();
  model.add(arrowGroup);
  const arrows = { L: null, R: null, C: null };
  function rebuildArrows() {
    while (arrowGroup.children.length) {
      const a = arrowGroup.children.pop();
      if (a && a.line) { a.line.geometry && a.line.geometry.dispose(); a.line.material && a.line.material.dispose(); }
      if (a && a.cone) { a.cone.geometry && a.cone.geometry.dispose(); a.cone.material && a.cone.material.dispose(); }
    }
    const s = SCENARIOS[state.scenario];
    const baseX = 0.105, y = 0.052, z0 = 0.09;
    function mk(x, len, color) {
      const dir = new THREE.Vector3(0, 0.12, 1).normalize();
      const a = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z0), len, color, 0.014, 0.009);
      a.line.material.transparent = true;
      a.cone.material.transparent = true;
      arrowGroup.add(a);
      return a;
    }
    const L = s.loadL || (s.load / 2), R = s.loadR || (s.load / 2);
    const scale = state.ramp * 0.00072;   // N -> metres on the 1:4 model
    arrows.L = mk(-baseX, Math.max(0.045, L * scale), s.asym === -1 ? 0xf2a13e : 0x38d9cf);
    arrows.R = mk(baseX, Math.max(0.045, R * scale), s.asym === 1 ? 0xff6b5e : 0x4f8cff);
    arrows.C = mk(0, Math.max(0.055, s.load * scale * 0.6), 0x8fb0ff);
  }

  /* region wire select box */
  let selBox = null;
  function updateSelectBox() {
    if (selBox) { model.remove(selBox); selBox.geometry.dispose(); selBox.material.dispose(); selBox = null; }
    if (!state.sel || state.sel.kind !== 'region') return;
    const dim = REGION_BOX[state.sel.id];
    if (!dim) return;
    const g = new THREE.Box3(new THREE.Vector3(...dim[0]), new THREE.Vector3(...dim[1]));
    const geo = new THREE.BoxGeometry(...g.getSize(new THREE.Vector3()).toArray());
    const mat = new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 });
    selBox = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
    selBox.position.copy(g.getCenter(new THREE.Vector3()));
    selBox.position.y = 0.002;
    model.add(selBox);
  }
  const REGION_BOX = {
    B1: [[-0.15, -0.01, -0.235], [-0.05, 0.05, 0.235]],
    B2: [[0.05, -0.01, -0.235], [0.15, 0.05, 0.235]],
    B3: [[-0.155, -0.01, -0.2], [-0.055, 0.055, -0.15]],
    B4: [[0.055, -0.01, -0.2], [0.155, 0.055, -0.15]],
    F1: [[-0.1, -0.01, 0.18], [0.1, 0.085, 0.28]],
    R1: [[-0.1, -0.01, -0.28], [0.1, 0.085, -0.18]],
    C1: [[-0.094, -0.012, -0.19], [0.094, 0.035, 0.145]],
  };

  /* anomaly callout (3D) */
  const calloutRoot = new THREE.Group();
  model.add(calloutRoot);
  const calloutLabel = makeLabel('B4', { color: '#ffb7b0', bg: 'rgba(70,10,8,0.75)', spriteScale: 0.026 });
  calloutLabel.position.set(0.13, 0.16, -0.2);
  calloutRoot.add(calloutLabel);
  const calloutRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.028, 0.003, 10, 48),
    new THREE.MeshBasicMaterial({ color: 0xff5d4a, transparent: true, opacity: 0.95 })
  );
  calloutRing.rotation.x = Math.PI / 2;
  calloutRing.position.set(0.09, 0.058, -0.185);
  calloutRoot.add(calloutRing);
  calloutRoot.visible = false;

  /* ---------------- tab UI ---------------- */
  const tabsEl = page.querySelector('#tw-tabs');
  VIEWS.forEach(v => {
    const b = document.createElement('button');
    b.className = 'tab';
    b.textContent = v;
    b.dataset.view = v;
    b.addEventListener('click', () => setTab(VIEW_IDS[v]));
    tabsEl.appendChild(b);
  });
  function paintTabs() {
    tabsEl.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', VIEW_IDS[b.dataset.view] === state.tab));
  }

  /* ---------------- scenario UI ---------------- */
  const scenEl = page.querySelector('#tw-scenarios');
  SCENARIO_ORDER.forEach(id => {
    const b = document.createElement('button');
    b.className = 'scen';
    b.dataset.scen = id;
    b.innerHTML = `<span class="sdot"></span>${SCENARIOS[id].label.toUpperCase()}`;
    b.addEventListener('click', () => setScenario(id));
    scenEl.appendChild(b);
  });
  function paintScen() {
    scenEl.querySelectorAll('.scen').forEach(b => b.classList.toggle('active', b.dataset.scen === state.scenario));
    const s = SCENARIOS[state.scenario];
    const b = page.querySelector('#tw-scen');
    b.innerHTML = `<span class="dot ${healthCls(s.cls)}"></span>SCENARIO&nbsp;<b>${s.label.toUpperCase()}</b>`;
    const anom = page.querySelector('#tw-anom');
    const on = s.anomaly && state.ramp >= 1;
    anom.style.display = on ? 'inline-flex' : 'none';
    if (on) anom.innerHTML = `<span class="dot bad pulse"></span>ANOMALY&nbsp;<b>B4 · REAR-RIGHT MOUNT</b>`;
  }

  /* ---------------- derived data ---------------- */
  const ROW_UNIT = { strain: 'µε', stress: 'MPa', displacement: 'mm' };
  function rowOf(metric, rId) {
    const s = SCENARIOS[state.scenario];
    const v = (s[metric] || {})[rId];
    return v === null || v === undefined ? { v: null } : { v };
  }
  function heatFactor(metric, rId) {
    const v = rowOf(metric, rId).v;
    if (v === null) return -1;
    const [lo, hi] = HEAT_RANGE[metric];
    return Math.min(1, Math.max(0.04, (v - lo) / (hi - lo)));
  }
  function maxRegion(metric) {
    const s = SCENARIOS[state.scenario];
    const rows = REGIONS.filter(r => s[metric][r.id] !== null);
    return rows.reduce((a, b) => (s[metric][b.id] > s[metric][a.id] ? b : a)).id;
  }
  function currentUnit() {
    if (state.tab === 'strain') return 'strain';
    if (state.tab === 'stress') return 'stress';
    if (state.tab === 'displacement') return 'displacement';
    return null;
  }

  /* ---------------- view rendering (3D) ---------------- */
  const HINTS = {
    structure: 'NEUTRAL BASE · NO CLUTTER',
    xray: 'BATTERY GHOST · LOAD-BEARING MEMBERS HIGHLIGHTED',
    strain: 'SG01–SG04 · B1–B4 REGION HEAT',
    stress: 'STRESS FIELD · DESIGN ENVELOPE 6.5 MPa',
    displacement: 'SG01–SG04 + IMU01/02 DERIVED DEFORMATION',
    loadpath: 'LOAD APPLIED THROUGH BATTERY FIXTURE (LC01)',
    sensors: 'CLICK A SENSOR FOR ITS DETAIL',
  };
  function applyView() {
    const metric = currentUnit();
    Object.values(regionGroups).forEach(g => flashRegion(g, false));
    page.querySelector('#tw-hint-secondary').textContent = HINTS[state.tab] || '';

    if (state.tab === 'structure') {
      if (state.batteryMat) state.batteryMat.opacity = batteryDefaultOpacity;
      setSensorOpacityForTab(true);
    } else if (state.tab === 'xray') {
      if (state.batteryMat) state.batteryMat.opacity = 0.14;
      ['B1', 'B2', 'B3', 'B4', 'F1', 'C1', 'R1'].forEach(id => flashRegion(regionGroups[id], true, 0x4f8cff, 0.1 + (id === 'C1' ? 0 : 0.02)));
      setSensorOpacityForTab(true);
    } else if (metric) {
      if (state.batteryMat) state.batteryMat.opacity = batteryDefaultOpacity;
      REGIONS.forEach(r => {
        const f = heatFactor(metric, r.id);
        const color = f === -1 ? 0x6b7686 : ramp(f);
        flashRegion(regionGroups[r.id], f === -1 ? true : true, color, f === -1 ? 0.35 : 0.32 + f * 0.5);
        if (f === -1) {
          const g = regionGroups[r.id];
          g.traverse(o => { if (o.isMesh && o.material && o.material.emissive) o.material.emissiveIntensity = 0.18; });
        }
      });
      // battery housing stays slightly emissive in heat views so volume reads
      setSensorOpacityForTab(true);
    } else if (state.tab === 'loadpath') {
      if (state.batteryMat) state.batteryMat.opacity = batteryDefaultOpacity;
      flashRegion(regionGroups['C1'], true, 0x4f8cff, 0.12);
      setSensorOpacityForTab(true);
    } else if (state.tab === 'sensors') {
      if (state.batteryMat) state.batteryMat.opacity = batteryDefaultOpacity;
      REGIONS.forEach(r => flashRegion(regionGroups[r.id], true, 0x38d9cf, 0.07));
      setSensorOpacityForTab(false);
    }
    updateAnomaly3D();
    rebuildArrows();
    renderLegend();
    renderInspector();
  }

  function setSensorOpacityForTab(dim) {
    sensorMap.forEach((root, id) => {
      if (state.tab === 'sensors') setSensorOpacity(root, 1);
      else if (dim) setSensorOpacity(root, 0.34);
    });
  }

  function updateAnomaly3D() {
    const anom = SCENARIOS[state.scenario].anomaly && state.ramp >= 1 && state.tab !== 'structure';
    state.anomalyOn = anom;
    calloutRoot.visible = anom;
  }

  /* per-frame pulse for anomaly + subtle arrow breathing */
  function frameLoop(t, dt) {
    if (state.anomalyOn) {
      const pulse = 0.5 + 0.35 * Math.sin(t * 5);
      setRegionEmissive(regionGroups['B4'], 0xff3b30, pulse);
      calloutRing.scale.setScalar(1 + 0.16 * Math.sin(t * 5));
      calloutRing.material.opacity = 0.7 + 0.3 * Math.sin(t * 5);
      calloutLabel.visible = Math.sin(t * 5) > -0.6;
    } else {
      clearRegionEmissive(regionGroups['B4']);
      calloutRing.scale.setScalar(1);
      calloutRing.material.opacity = 0.95;
      calloutLabel.visible = true;
    }
    // timeline replay drive
    if (state.playing) {
      state.t = (state.t + dt) % state.T;
      drawTimeline();
      applyRamp(true);
    }
    V.updateTween(dt);
  }

  /* ramp: replay position -> applied fraction + anomaly gate */
  function applyRamp(fromReplay = false) {
    const f = Math.min(1, Math.max(0, (state.t / state.T - 0.14) / 0.3)); // 0 at 14%, full at 44%
    state.ramp = state.t >= state.T * 0.14 ? f : 0;
    rebuildArrows();
    updateAnomaly3D();
    renderKpis();
    if (fromReplay || true) { /* KPI/intensity sync */ }
  }

  /* ---------------- legend ---------------- */
  function renderLegend() {
    const el = page.querySelector('#tw-legend');
    let html = '';
    if (state.tab === 'strain' || state.tab === 'stress' || state.tab === 'displacement') {
      const u = VIEW_UNIT[state.tab];
      html = `<div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:9px;letter-spacing:2px;color:var(--text-faint)">${state.tab.toUpperCase()} HEAT MAP</span>
        <span style="font-size:10px;color:var(--text-faint);font-family:var(--mono)">${u}</span></div>
        <div class="row"><div class="lg-half"><i style="background:#38d9cf"></i><i style="background:#4fe0a0"></i><i style="background:#f2b94e"></i><i style="background:#ff6b5e"></i></div><span>nominal → critical</span></div>
        <div class="row"><span class="sw" style="background:#6b7686"></span><span>sensor offline / no data</span></div>
        <div class="row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line)"><span style="color:var(--text-faint)">Click a region for detail</span></div>`;
    } else if (state.tab === 'loadpath') {
      html = `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:9px;letter-spacing:2px;color:var(--text-faint)">LOAD PATH</span></div>
        <div class="row"><span class="sw" style="background:#38d9cf"></span><span>left rail · forward</span></div>
        <div class="row"><span class="sw" style="background:#4f8cff"></span><span>right rail · forward</span></div>
        <div class="row"><span class="sw" style="background:#8fb0ff"></span><span>applied resultant</span></div>
        <div class="row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line)"><span style="color:var(--text-faint)">arrow length ∝ applied load</span></div>`;
    } else if (state.tab === 'sensors') {
      html = `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:9px;letter-spacing:2px;color:var(--text-faint)">INSTRUMENTATION</span></div>
        <div class="row"><span class="sw" style="background:#38d9cf"></span><span>strain · IMU · load</span></div>
        <div class="row"><span class="sw" style="background:#6b7686"></span><span>offline / fault</span></div>
        <div class="row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line)"><span style="color:var(--text-faint)">Click a sensor for detail</span></div>`;
    } else if (state.tab === 'xray') {
      html = `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:9px;letter-spacing:2px;color:var(--text-faint)">X-RAY STRUCTURE</span></div>
        <div class="row"><span class="sw" style="background:#4f8cff"></span><span>load-bearing rails / members</span></div>
        <div class="row"><span class="sw" style="background:rgba(56,217,207,0.35)"></span><span>battery volume (ghost)</span></div>
        <div class="row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line)"><span style="color:var(--text-faint)">battery opacity reduced</span></div>`;
    } else {
      html = `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:9px;letter-spacing:2px;color:var(--text-faint)">STRUCTURE</span></div>
        <div class="row"><span class="sw" style="background:#9fb2c8"></span><span>structural members</span></div>
        <div class="row"><span class="sw" style="background:rgba(56,217,207,0.4)"></span><span>battery volume</span></div>
        <div class="row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line)"><span style="color:var(--text-faint)">neutral engineering base</span></div>`;
    }
    el.innerHTML = html;
  }

  /* ---------------- KPIs ---------------- */
  function renderKpis() {
    const s = SCENARIOS[state.scenario];
    const mStrain = maxRegion('strain'), mStress = maxRegion('stress'), mDisp = maxRegion('disp');
    const rampTxt = state.ramp >= 1 ? '' : ` <small>· ${Math.round(state.ramp * 100)}%</small>`;
    const stateCls = state.anomalyOn ? 'crit' : healthCls(s.cls);
    const cell = (k, v, cls = '', extra = '') =>
      `<div class="kpi state-${stateCls}"><div class="kpk">${k}</div><div class="kpv ${cls}">${v}${extra}</div></div>`;
    page.querySelector('#tw-kpis').innerHTML =
      cell('Applied Load', fmt(Math.round(s.load * state.ramp), 'N'), '', rampTxt) +
      cell('Max Strain', fmt(s.strain[mStrain], 'µε'), state.anomalyOn ? 'crit' : '') +
      cell('Max Stress', fmt(s.stress[mStress], 'MPa', 1), '') +
      cell('Max Disp.', fmt(s.disp[mDisp], 'mm', 2), '') +
      cell('Vib RMS', s.vib.rms, '') +
      cell('Dominant Freq', s.vib.dom, '') +
      cell('Temperature', s.temp, '') +
      cell('Structural State', s.state, stateCls);
  }

  /* ---------------- inspector ---------------- */
  function renderInspector() {
    const s = SCENARIOS[state.scenario];
    const head = page.querySelector('#tw-h2');
    const sub = page.querySelector('#tw-sub');
    const health = page.querySelector('#tw-health');
    const body = page.querySelector('#tw-body');

    health.className = 'health ' + (state.anomalyOn ? 'bad' : healthCls(s.cls));
    health.textContent = state.anomalyOn ? 'INSPECTION REQUIRED' : s.state;

    /* context priority: selected item > sensor > region > tab default */
    if (state.sel && state.sel.kind === 'sensor' && state.tab === 'sensors') {
      return renderSensorDetail(state.sel.id, head, sub, body);
    }
    if (state.sel && state.sel.kind === 'region') {
      return renderRegionDetail(state.sel.id, head, sub, body);
    }

    if (state.tab === 'strain') {
      const hot = maxRegion('strain');
      head.textContent = regionTitle(hot);
      sub.textContent = `EV-CH-007 · STRAIN · REGION ${hot} · MONITORED BY ${monitoredOf(hot)}`;
      renderStrainPanel(hot, body);
    } else if (state.tab === 'stress') {
      const hot = maxRegion('stress');
      head.textContent = regionTitle(hot);
      sub.textContent = `EV-CH-007 · STRESS · REGION ${hot}`;
      renderStressPanel(hot, body);
    } else if (state.tab === 'displacement') {
      const hot = maxRegion('disp');
      head.textContent = regionTitle(hot);
      sub.textContent = `EV-CH-007 · DISPLACEMENT · REGION ${hot}`;
      renderDispPanel(hot, body);
    } else if (state.tab === 'sensors') {
      head.textContent = 'Sensor Attachment';
      sub.textContent = 'EV-CH-007 · instrumented build 1:4';
      renderSensorSummary(body);
    } else {
      head.textContent = 'Structural Summary';
      sub.textContent = `${s.label} · ${s.state}`;
      renderSummary(s, body);
    }
  }

  function regionTitle(id) {
    const r = regionById(id);
    return `${r.id} — ${r.name}`;
  }
  function monitoredOf(id) {
    return SENSORS.filter(x => x.region === id).map(x => x.id).join(', ') || '—';
  }
  function signalQuality(sensorId) {
    const cfg = sensorById(sensorId);
    return cfg && cfg.signalQuality ? `${cfg.signalQuality}%` : '97%';
  }

  function renderStrainPanel(rid, body) {
    const s = SCENARIOS[state.scenario];
    const cur = s.strain[rid];
    const exp = EXPECTED[rid];
    const base = BASELINE[rid];
    const res = cur - exp;
    const dev = ((res) / exp) * 100;
    const cl = cur === null ? 'dim' : res > 12 ? 'crit' : res > 5 ? 'up' : 'good';
    const sensor = SENSORS.find(x => x.region === rid && x.type === 'strain') || SENSORS[0];
    const sensorId = (sensor && sensor.id) || 'SG04';
    const anom = s.anomaly && rid === s.hot && state.ramp >= 1;
    body.innerHTML = `
      <div class="sec-t">CURRENT vs MODEL EXPECTATION</div>
      ${krow('Current strain', fmt(cur, 'µε'), cl)}
      ${krow('Expected (model)', fmt(exp, 'µε'), 'dim')}
      ${krow('Residual', `${res > 0 ? '+' : ''}${fmt(res, 'µε')}`, res > 12 ? 'crit' : res > 5 ? 'up' : 'good')}
      ${krow('Baseline (stored)', fmt(base, 'µε'), 'dim')}
      ${krow('Deviation', `${dev > 0 ? '+' : ''}${dev.toFixed(1)}%`, dev > 30 ? 'crit' : dev > 15 ? 'up' : 'good')}
      <div class="sec-t">MEASUREMENT QUALITY</div>
      ${krow('Source sensor', sensorId)}
      ${krow('Signal quality', signalQuality(sensorId), 'good')}
      ${krow('Persistence', anom ? '3 comparable windows' : 'steady', anom ? 'up' : 'dim')}
      ${krow('Assessment', anom ? 'INSPECTION REQUIRED' : s.state, anom ? 'crit' : healthCls(s.cls))}
      ${sparkSvg(recent(), anom ? '#ff6b5e' : '#4fe0a0', 'µε')}
      ${anom ? evidenceHtml(rid, res) : defaultNote(rid)}
    `;
  }

  function evidenceHtml(rid, residual) {
    return `<div class="evidence">
      <div class="ev-h">ANOMALY EVIDENCE · ${rid}</div>
      <div class="ev-row"><span>Residual</span><b class="crit">+${residual} µε</b></div>
      <div class="ev-row"><span>Frequency shift</span><b class="crit">−4.7%</b></div>
      <div class="ev-row"><span>Repeated in</span><b>3 windows</b></div>
      <div class="ev-row"><span>Assessment</span><b class="crit">INSPECTION REQUIRED</b></div>
      <button class="btn small" id="focus-anom" style="width:100%;justify-content:center;margin-top:8px;border-color:rgba(255,107,94,0.5);color:#ff8a7e">◎ Focus B4</button>
    </div>`;
  }
  function defaultNote(rid) {
    return `<div class="note">Region <b>${rid}</b> is physically measured by ${monitoredOf(rid)}. Full mounting and signal-path detail lives on the <b>Hardware Twin</b> page.</div>`;
  }

  function renderStressPanel(rid, body) {
    const s = SCENARIOS[state.scenario];
    const v = s.stress[rid];
    const cl = v === null ? 'dim' : v >= 6.8 ? 'crit' : v >= 5.2 ? 'up' : 'good';
    body.innerHTML = `
      <div class="sec-t">STRESS STATE</div>
      ${krow('Selected region', rid === null ? '—' : regionById(rid).name)}
      ${krow('Current stress', fmt(v, 'MPa'), cl)}
      ${krow('Model expected range', '3.2 – 4.8 MPa', 'dim')}
      ${krow('Design envelope', '≤ 6.5 MPa', 'dim')}
      ${krow('State', v === null ? 'NO DATA' : v >= 6.8 ? 'EXCEEDED' : v >= 5.2 ? 'ELEVATED' : 'WITHIN', cl)}
      <div class="sec-t">HIGHEST STRESS REGIONS</div>
      ${REGIONS
        .map(r => { const f = heatFactor('stress', r.id); return `<div class="krow"><div class="k"><span style="color:${f === -1 ? '#6b7686' : '#' + rampColor(f)};font-weight:700">${r.id}</span> · ${r.name}</div><div class="v">${fmt(s.stress[r.id], 'MPa')}</div></div>`; })
        .join('')}
      ${defaultNote(rid)}
    `;
  }

  function renderDispPanel(rid, body) {
    const s = SCENARIOS[state.scenario];
    const v = s.disp[rid];
    const cl = v === null ? 'dim' : v >= 1.2 ? 'crit' : v >= 0.8 ? 'up' : 'good';
    const scale = v === null ? '—' : `${(v * 1.6).toFixed(1)}×`;
    body.innerHTML = `
      <div class="sec-t">DISPLACEMENT RESPONSE</div>
      ${krow('Current displacement', fmt(v, 'mm'), cl)}
      ${krow('Max displacement', fmt(v, 'mm'), cl)}
      ${krow('Location', rid === null ? '—' : `${rid} · ${regionById(rid).name}`)}
      ${krow('Deformation scale', scale, 'dim')}
      ${krow('Method', 'strain-derived · SG01–SG04 + IMU01/02', 'dim')}
      <div class="sec-t">REGION DISPLACEMENT MAP</div>
      ${REGIONS
        .map(r => { const f = heatFactor('displacement', r.id); const d = s.disp[r.id]; return `<div class="krow"><div class="k"><span style="color:${f === -1 ? '#6b7686' : '#' + rampColor(f)};font-weight:700">${r.id}</span> · ${r.name}</div><div class="v">${fmt(d, 'mm')}</div></div>`; })
        .join('')}
      ${defaultNote(rid)}
    `;
  }

  function rampColor(f) {
    return ramp(f).toString(16).padStart(6, '0');
  }

  function renderRegionDetail(rid, head, sub, body) {
    const r = regionById(rid);
    const s = SCENARIOS[state.scenario];
    head.textContent = `${r.id} — ${r.name}`;
    sub.textContent = `REGION ${r.id} · ZONE ${r.zone.replace(/_/g, ' ')}`;
    const md = monitoredOf(rid);
    const metric = currentUnit();
    const val = metric ? s[metric][rid] : null;
    const devPct = (metric === 'strain' && val !== null) ? (val - EXPECTED[rid]) / EXPECTED[rid] * 100 : 0;
    const cl = val === null ? 'dim' : (metric === 'strain' ? (devPct > 12 ? 'crit' : devPct > 5 ? 'up' : 'good') : 'good');
    body.innerHTML = `
      <div class="sec-t">REGION ASSESSMENT${metric ? ` · ${metric.toUpperCase()}` : ''}</div>
      ${metric ? krow('Response', fmt(val, VIEW_UNIT[metric]), cl) : ''}
      ${krow('Zone', r.zone.replace(/_/g, ' '))}
      ${krow('Measured by', md)}
      <div class="sec-t">STRUCTURAL ROLE</div>
      <div class="note" style="margin-top:0">${r.detail ? `${r.detail}. ` : ''}This region is on the shared EV-CH-007 asset — identical coordinates on the structural twin and the hardware twin.</div>
      ${state.tab === 'strain' ? krow('Expected (model)', fmt(EXPECTED[rid], 'µε'), 'dim') : ''}
    `;
  }

  function renderSensorDetail(id, head, sub, body) {
    const cfg = sensorById(id);
    const r = regionById(cfg.region);
    const s = SCENARIOS[state.scenario];
    const isOff = cfg.health === 'OFFLINE';
    head.textContent = `${cfg.id} · ${cfg.name}`;
    sub.textContent = `REGION ${cfg.region} · ${r.name}`;
    body.innerHTML = `
      <div class="sec-t">MEASUREMENT</div>
      ${krow('Physical quantity', cfg.measurement)}
      ${krow('Unit', cfg.unit)}
      ${krow('Mounting region', `${cfg.region} (${r.zone.replace(/_/g, ' ')})`)}
      <div class="sec-t">SIGNAL</div>
      ${krow('Channel', cfg.channel || '—')}
      ${krow('Acquisition', cfg.adc || '—')}
      ${krow('Health', cfg.health, isOff ? 'crit' : 'good')}
      ${isOff ? `<div class="note" style="border-color:rgba(107,118,134,0.4)"><b>SG02 OFFLINE</b> — excluded from the structure assessment. The B2 zone is <b>not</b> flagged as failed.</div>` : ''}
      ${state.tab === 'strain' ? krow(`Current strain (${cfg.region})`, fmt(s.strain[cfg.region], 'µε')) : ''}
      ${sparkSvg(recent(), '#4fe0a0', cfg.unit)}
      <div class="note">Full mounting philosophy and signal path are on the <b>Hardware Twin</b> page — same asset, same coordinates.</div>
    `;
  }

  function renderSensorSummary(body) {
    const hs = (h) => h === 'HEALTHY' ? 'ok' : h === 'OFFLINE' ? 'off' : 'ok';
    const rows = SENSORS.map(s => {
      const r = regionById(s.region);
      return `<div class="krow"><div class="k"><span style="color:${s.health === 'HEALTHY' ? '#4fe0a0' : '#6b7686'};font-weight:700">${s.id}</span> · ${s.type.toUpperCase()} · ${r.id}</div><div class="v ${hs(s.health)}" style="font-size:9.5px">${s.health}</div></div>`;
    }).join('');
    body.innerHTML = `
      <div class="sec-t">INSTRUMENTED CHASSIS</div>
      <div style="font-size:10.5px;color:var(--text-dim);line-height:1.55;padding-bottom:6px">4 strain gauges (SG01–SG04) · 2 IMUs (front reference / rear response) · LC01 load cell in the battery load fixture · TEMP01 · DISP01 optional · SHIELD Edge Node.</div>
      <div class="sec-t">SENSOR ROSTER</div>
      ${rows}
      <div class="sec-t">EDGE ANALYSIS</div>
      <div class="note" style="margin-top:0">ESP32 · HX711 / ADS1115 · 1 Hz twin sync · RMS / peak / dominant-frequency on the edge. Click any sensor marker in the 3D view for detail.</div>
    `;
  }

  function renderSummary(s, body) {
    const hotStrain = maxRegion('strain');
    const hotStress = maxRegion('stress');
    const hotDisp = maxRegion('disp');
    const cls = state.anomalyOn ? 'crit' : healthCls(s.cls);
    body.innerHTML = `
      <div class="sec-t">STRUCTURAL SUMMARY</div>
      ${krow('Current Scenario', s.label)}
      ${krow('Overall Structural State', s.state, cls)}
      ${krow('Highest Response Region', `${s.hot} · ${regionById(s.hot).name}`)}
      <div class="metric-grid">
        <div class="metric"><span class="mk">APPLIED LOAD</span><span class="mv">${Math.round(s.load * state.ramp)}<small>N</small></span></div>
        <div class="metric"><span class="mk">MAX STRAIN</span><span class="mv ${state.anomalyOn ? 'crit' : ''}">${s.strain[hotStrain]}<small>µε</small></span></div>
        <div class="metric"><span class="mk">MAX STRESS</span><span class="mv">${s.stress[hotStress]}<small>MPa</small></span></div>
        <div class="metric"><span class="mk">MAX DISPLACEMENT</span><span class="mv">${s.disp[hotDisp]}<small>mm</small></span></div>
        <div class="metric"><span class="mk">VIBRATION RMS</span><span class="mv">${s.vib.rms}</span></div>
        <div class="metric"><span class="mk">DOMINANT FREQ</span><span class="mv">${s.vib.dom}</span></div>
      </div>
      <div class="sec-t">DECISION</div>
      <div class="note" style="margin-top:0"><b>${s.decision}</b></div>
      <div class="note" style="border-color:var(--line-strong)">Sequence: <b>CHASSIS → LOAD → RESPONSE → EXPECTED → RESIDUAL → LOCATION → DECISION</b>. Click a region in the 3D view to drill in.</div>
    `;
  }

  /* ---------------- decision / badges ---------------- */
  function renderDecision() {
    const s = SCENARIOS[state.scenario];
    const el = page.querySelector('#tw-decision');
    el.innerHTML = state.anomalyOn
      ? `VERDICT <b style="color:var(--danger)">INSPECTION REQUIRED</b> · B4 evidence in inspector`
      : `VERDICT <b style="color:${healthCls(s.cls) === 'ok' ? 'var(--ok)' : healthCls(s.cls) === 'warn' ? 'var(--warn)' : 'var(--offline)'}">${s.state}</b>`;
  }

  /* ---------------- timeline ---------------- */
  const tlWrap = page.querySelector('#tl-wrap');
  const tlScrub = page.querySelector('#tl-scrub');
  const tlFill = page.querySelector('#tl-fill');
  const tlMarkers = page.querySelector('#tl-markers');
  const tlNow = page.querySelector('#tl-now');
  const tlPlay = page.querySelector('#tl-play');

  function drawTimeline() {
    const p = state.t / state.T;
    tlFill.style.width = (p * 100) + '%';
    tlScrub.style.left = (p * 100) + '%';
    const secs = Math.round(state.t);
    tlNow.textContent = `00:${String(secs).padStart(2, '0')}`;
    const s = SCENARIOS[state.scenario];
    tlMarkers.innerHTML = (s.ev || []).map(([label, pos]) =>
      `<div class="tl-marker" data-pos="${pos}" style="left:${pos * 100}%;background:${label.includes('Inspection') || label.includes('Change') ? '#ff6b5e' : label.includes('Shock') || label.includes('Fault') ? '#f2a13e' : '#4fe0a0'}"><span class="tl-lab">${label.toUpperCase()}</span></div>`
    ).join('');
  }
  function setT(v, silent = false) {
    state.t = Math.max(0, Math.min(state.T, v));
    drawTimeline();
    applyRamp();
    if (!silent) { renderKpis(); renderInspector(); }
  }
  tlPlay.addEventListener('click', () => {
    state.playing = !state.playing;
    tlPlay.textContent = state.playing ? '❚❚' : '▶';
  });
  tlWrap.addEventListener('pointerdown', ev => {
    const r = tlWrap.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
    setT(p * state.T);
    tlWrap.setPointerCapture(ev.pointerId);
    const move = e => {
      const rect = tlWrap.getBoundingClientRect();
      const pp = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setT(pp * state.T);
    };
    tlWrap.addEventListener('pointermove', move);
    tlWrap.addEventListener('pointerup', () => tlWrap.removeEventListener('pointermove', move), { once: true });
  });

  /* focus button delegation (anomaly evidence) */
  page.querySelector('#tw-body').addEventListener('click', ev => {
    if (ev.target && ev.target.id === 'focus-anom') {
      const f = CAM_FOCUS['B4'];
      V.flyTo(f.pos, f.target, 1.1);
    }
    if (ev.target && ev.target.id === 'focus-reg') {
      const f = CAM_FOCUS[state.sel && state.sel.kind === 'region' ? state.sel.id : 'B1'];
      if (f) V.flyTo(f.pos, f.target, 1.0);
    }
  });

  /* ---------------- 3D interaction ---------------- */
  const pickables = regionMeshList(chassis);
  sensorMap.forEach(r => pickables.push(r));

  function ownerOf(obj) {
    let n = obj;
    while (n) {
      if (n.userData && n.userData.sensorId) return { kind: 'sensor', id: n.userData.sensorId };
      if (n.userData && n.userData.regionId) return { kind: 'region', id: n.userData.regionId };
      n = n.parent;
    }
    return null;
  }

  viewEl.addEventListener('pointerdown', ev => {
    V.setPointer(ev);
    V.raycaster.setFromCamera(V.pointer, V.camera);
    const hits = V.raycaster.intersectObjects(pickables, true);
    for (const h of hits) {
      const o = ownerOf(h.object);
      if (!o) continue;
      if (o.kind === 'region') {
        state.sel = { kind: 'region', id: o.id };
        updateSelectBox();
        renderInspector();
      } else if (o.kind === 'sensor') {
        state.sel = { kind: 'sensor', id: o.id };
        state.tab = 'sensors';
        paintTabs();
        renderLegend();
        renderInspector();
        applyView();
      }
      return;
    }
    state.sel = null;
    updateSelectBox();
    renderInspector();
  });

  /* ---------------- actions ---------------- */
  function setTab(id) {
    state.tab = id;
    paintTabs();
    applyView();
    renderInspector();
  }
  function setScenario(id) {
    state.scenario = id;
    state.t = state.T * 0.45; // pre-loaded state
    state.sel = null;
    drawTimeline();
    paintScen();
    applyRamp();
    applyView();
    renderDecision();
  }

  page.querySelector('#tw-reset').addEventListener('click', () => {
    V.flyTo(V.defaults.homePos.clone(), V.defaults.homeTarget.clone(), 0.7);
  });
  page.querySelector('#tw-to-hw').addEventListener('click', () => {
    if (nav) nav('hardware', state.sel && state.sel.kind === 'region' ? state.sel.id : null);
  });

  /* ---------------- init ---------------- */
  paintTabs();
  paintScen();
  drawTimeline();
  applyRamp();
  applyView();
  renderDecision();
  setT(state.t, true);
  renderKpis();

  /* ---------------- debug / headless hooks ---------------- */
  const LEGACY = { STRAIN: 'strain', STRESS: 'stress', DEFORMATION: 'displacement', LOAD: 'loadpath' };
  window.__TW = {
    setMode: m => {
      if (LEGACY[m]) setTab(LEGACY[m]);
      else if (Object.values(VIEW_IDS).includes(m)) setTab(m);
      else if (m === 'ANOMALY') { setScenario('CHANGE'); setTab('strain'); }
      return true;
    },
    setTab: id => { setTab(id); return true; },
    setScenario: id => { setScenario(id); return true; },
    resetView: () => { V.flyTo(V.defaults.homePos.clone(), V.defaults.homeTarget.clone(), 0.7); return true; },
  };

  return page;
}