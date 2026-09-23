/* ============================================================
   SHIELD — STRUCTURAL DIGITAL TWIN page
   "What is happening to the chassis?"
   Same EV-CH-007 geometry as the Hardware Twin; the focus here
   is the structural assessment (strain / stress / deformation /
   loading / anomaly / decision).
   ============================================================ */

import * as THREE from 'three';
import { createView } from '../core/scene.js';
import { buildChassis, flashRegion, regionMeshList } from '../core/chassis.js';
import { buildSensorRig, setSensorOpacity } from '../core/sensorMeshes.js';
import { SENSORS, sensorById } from '../config/sensors.js';
import { REGIONS, regionById } from '../config/vehicle.js';

const MODES = ['STRAIN', 'STRESS', 'DEFORMATION', 'LOAD', 'ANOMALY'];

/* Simulated structural state per region */
const STATE = {
  STRAIN:      { F1: { v: 44 }, B1: { v: 52 }, B2: { v: 50, s: 'off' }, C1: { v: 40 }, B3: { v: 57 }, B4: { v: 78, f: 1 }, R1: { v: 46 } },
  STRESS:      { F1: { v: 3.1 }, B1: { v: 3.6 }, B2: { v: 3.5, s: 'off' }, C1: { v: 2.8 }, B3: { v: 4.0 }, B4: { v: 5.5, f: 1 }, R1: { v: 3.2 } },
  DEFORMATION: { F1: { v: 0.42 }, B1: { v: 0.5 }, B2: { v: 0.47, s: 'off' }, C1: { v: 0.3 }, B3: { v: 0.62 }, B4: { v: 1.42, f: 1 }, R1: { v: 0.58 } },
  LOAD:        { F1: { v: 96 }, B1: { v: 88 }, B2: { v: 90, s: 'off' }, C1: { v: 147 }, B3: { v: 112 }, B4: { v: 128 }, R1: { v: 74 } },
};

const UNIT = { STRAIN: 'µε', STRESS: 'MPa', DEFORMATION: 'mm', LOAD: 'N', ANOMALY: '' };

/* color ramp: nominal teal -> elevated yellow -> critical red */
function ramp(f) {
  const stops = [
    [0, 56, 217, 207],
    [0.55, 242, 185, 78],
    [0.85, 255, 107, 94],
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (f >= stops[i][0] && f <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const t = (f - a[0]) / Math.max(1e-6, b[0] - a[0]);
  return (Math.round(a[1] + (b[1] - a[1]) * t) << 16)
       | (Math.round(a[2] + (b[2] - a[2]) * t) << 8)
       | Math.round(a[3] + (b[3] - a[3]) * t);
}

function krow(k, v, cls = '') {
  return `<div class="krow"><div class="k">${k}</div><div class="v ${cls}">${v}</div></div>`;
}

export function createTwinPage(host, nav) {
  const page = document.createElement('div');
  page.className = 'hw-page';
  host.appendChild(page);

  page.innerHTML = `
    <div class="hw-view"></div>
    <div class="hw-controls">
      <div class="row" id="tw-modes"></div>
      <div class="row" style="opacity:.85">
        <button class="btn small" id="tw-reset">Reset View</button>
        <button class="btn small" id="tw-to-hw">→ Open Hardware Twin</button>
      </div>
    </div>
    <div class="tw-legend" id="tw-legend"></div>
    <div class="hw-panel">
      <div class="inspect-head">
        <div class="who"><h2 id="tw-h2">Structural Assessment</h2><div class="sub" id="tw-sub">EV-CH-007 · Monitoring B1–B4 + F1/C1/R1</div></div>
        <span id="tw-health"></span>
      </div>
      <div class="inspect-body" id="tw-body"></div>
    </div>
    <div class="hw-strip">
      <div class="tag">STRUCTURAL DECISION</div>
      <div id="tw-decision" style="flex:1; font-size:11px; color:var(--text-dim); line-height:1.5"></div>
      <div class="live" id="tw-live"></div>
    </div>
    <div class="footnote">STRUCTURAL DIGITAL TWIN · SAME ASSET &amp; SENSOR GEOMETRY AS HARDWARE TWIN · REGION IDS SHARED</div>
  `;

  const viewEl = page.querySelector('.hw-view');
  const V = createView(viewEl, {
    camHome: {
      pos: new THREE.Vector3(0.66, 0.50, 0.64),
      target: new THREE.Vector3(0.0, 0.02, 0.0),
    },
  });

  const { group: chassis, regionGroups } = buildChassis(V.scene);
  V.scene.add(chassis);

  const { group: sensorGroup, sensors: sensorMap } = buildSensorRig();
  V.scene.add(sensorGroup);
  sensorMap.forEach((root, id) => setSensorOpacity(root, 0.32)); // dimmed instrumentation context

  let mode = 'STRAIN';
  let selectedRegion = null;

  /* modes UI */
  const modeEl = page.querySelector('#tw-modes');
  MODES.forEach(m => {
    const b = document.createElement('button');
    b.className = 'btn mode' + (m === mode ? ' on' : '');
    b.textContent = m;
    b.addEventListener('click', () => {
      mode = m;
      modeEl.querySelectorAll('.btn').forEach(x => x.classList.toggle('on', x.textContent === m));
      applyMode();
      renderDecision();
    });
    modeEl.appendChild(b);
  });

  page.querySelector('#tw-reset').addEventListener('click', () => {
    V.flyTo(V.defaults.homePos.clone(), V.defaults.homeTarget.clone(), 0.7);
  });
  page.querySelector('#tw-to-hw').addEventListener('click', () => {
    if (nav) nav('hardware', selectedRegion);
  });

  function rowOf(rId) { return (STATE[mode] || {})[rId] || { v: 0 }; }
  function regionFactor(rId) {
    const row = rowOf(rId);
    if (row.f !== undefined) return row.f;
    const units = { STRAIN: [40, 80], STRESS: [2.8, 5.5], DEFORMATION: [0.3, 1.4], LOAD: [60, 150] }[mode];
    if (!units) return 0.5;
    return Math.min(1, Math.max(0.05, (row.v - units[0]) / (units[1] - units[0])));
  }

  function applyMode() {
    Object.values(regionGroups).forEach(g => flashRegion(g, false));
    if (mode === 'ANOMALY') {
      flashRegion(regionGroups['B4'], true, 0xff5d4a);
      flashRegion(regionGroups['B2'], true, 0x6b7686); // sensor offline — zone grey, NOT failed
      REGIONS.forEach(r => {
        if (r.id !== 'B4' && r.id !== 'B2') flashRegion(regionGroups[r.id], true, 0x38d9cf);
      });
    } else {
      REGIONS.forEach(r => {
        flashRegion(regionGroups[r.id], true, rowOf(r.id).s === 'off' ? 0x6b7686 : ramp(regionFactor(r.id)));
      });
    }
    renderLegend();
    renderBody();
    renderLive();
  }

  function renderLegend() {
    const el = page.querySelector('#tw-legend');
    const ramps = mode === 'ANOMALY'
      ? [['ANOMALY', '#ff5d4a'], ['NOMINAL', '#38d9cf'], ['SENSOR OFFLINE', '#6b7686']]
      : [['NOMINAL', '#38d9cf'], ['ELEVATED', '#f2b94e'], ['CRITICAL', '#ff6b5e']];
    el.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:9px;letter-spacing:2px;color:var(--text-faint)">${mode} MAP</span><span style="font-size:10px;color:var(--text-faint);font-family:var(--mono)">${UNIT[mode]}</span></div>` +
      ramps.map(([l, c]) => `<div class="row"><span class="sw" style="background:${c};box-shadow:0 0 8px ${c}66"></span><span>${l}</span></div>`).join('') +
      `<div class="row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line)"><span style="color:var(--text-faint)">Click a region for detail</span></div>`;
  }

  function interpretation() {
    if (mode === 'ANOMALY') {
      return '<b>B4 (Rear-Right Battery Mount)</b> — elevated strain residual detected. <b>SG02 is OFFLINE</b>: excluded from assessment; B2 is <b>not</b> flagged as failed — only its channel needs re-validation. Recommendation: inspect B4 mount torque / shimming and re-run the baseline cycle.';
    }
    const worstId = Object.entries(STATE[mode]).reduce((a, b) => (b[1].v > a[1].v ? b : a))[0];
    const w = regionById(worstId);
    return `Overall response nominal. Highest ${mode.toLowerCase()} at <b>${worstId} — ${w ? w.name : ''}</b>. No action required; continue periodic monitoring.`;
  }

  function renderBody() {
    const rows = REGIONS.map(r => {
      const row = rowOf(r.id);
      const f = regionFactor(r.id);
      const color = mode === 'ANOMALY'
        ? (r.id === 'B4' ? '#ff5d4a' : r.id === 'B2' ? '#6b7686' : '#38d9cf')
        : (row.s === 'off' ? '#6b7686' : f >= 0.85 ? '#ff6b5e' : f >= 0.6 ? '#f2b94e' : '#4fe0a0');
      const monitored = SENSORS.filter(s => s.region === r.id).map(s => s.id).join(', ');
      return `<div class="krow"><div class="k"><span style="color:${color};font-weight:700">${r.id}</span> · ${r.name}</div><div class="v">${row.v} ${UNIT[mode]}</div></div>
        <div style="font-size:9.5px;color:var(--text-faint);padding:1px 0 6px 2px">measured by ${monitored || '—'}</div>`;
    }).join('');
    page.querySelector('#tw-body').innerHTML = `
      <div class="sec-t">REGION RESPONSE — ${mode}</div>
      ${rows}
      <div class="sec-t">INTERPRETATION</div>
      <div class="note" style="margin-top:0">${interpretation()}</div>
    `;
  }

  function renderLive() {
    const rows = REGIONS.map(r => `${r.id}:${rowOf(r.id).v}${UNIT[mode]}`).join('   ');
    page.querySelector('#tw-live').innerHTML = `<b>${mode}</b> ${rows}`;
  }

  function renderDecision() {
    page.querySelector('#tw-decision').innerHTML = interpretation();
    page.querySelector('#tw-sub').textContent = `EV-CH-007 · ${mode} assessment · regions B1–B4 + F1/C1/R1`;
  }

  /* click region -> detail, click sensor -> measurement source */
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
        selectedRegion = o.id;
        const r = regionById(o.id);
        const monitored = SENSORS.filter(s => s.region === o.id);
        page.querySelector('#tw-h2').textContent = `${r.id} — ${r.name}`;
        page.querySelector('#tw-body').innerHTML = `
          <div class="sec-t">REGION ASSESSMENT (${mode})</div>
          ${krow('Response', `${rowOf(o.id).v} ${UNIT[mode]}`, rowOf(o.id).s === 'off' ? 'crit' : '')}
          ${krow('Zone', r.zone.replace(/_/g, ' '))}
          <div class="sec-t">MEASUREMENT SOURCES</div>
          ${monitored.map(s => `<div style="font-size:11px;padding:3px 0">${s.id} — ${s.name} <span style="color:${s.health === 'HEALTHY' ? 'var(--ok)' : 'var(--offline)'}">(${s.health})</span></div>`).join('')}
          <div class="note">This region is physically measured by these sensors. Open the <b>Hardware Twin</b> to inspect the mounting, orientation and acquisition path.</div>
        `;
      } else if (o.kind === 'sensor') {
        const cfg = sensorById(o.id);
        const r = regionById(cfg.region);
        page.querySelector('#tw-h2').textContent = cfg.id + ' — measurement source';
        page.querySelector('#tw-body').innerHTML = `
          ${krow('Measures', `${r.id} (${r.name})`)}
          ${krow('Physical quantity', cfg.measurement)}
          ${krow('Unit', cfg.unit)}
          ${krow('Health', cfg.health, cfg.health === 'HEALTHY' ? 'good' : 'crit')}
          <div class="note">Hardware detail, mounting philosophy and signal path live on the <b>Hardware Twin</b> page — same asset, same coordinates.</div>
        `;
      }
      return;
    }
    page.querySelector('#tw-h2').textContent = 'Structural Assessment';
    renderBody();
  });

  applyMode();
  renderDecision();

  /* debug / headless-render hooks */
  window.__TW = {
    setMode: m => { mode = m; modeEl.querySelectorAll('.btn').forEach(x => x.classList.toggle('on', x.textContent === m)); applyMode(); renderDecision(); },
    resetView: () => V.flyTo(V.defaults.homePos.clone(), V.defaults.homeTarget.clone(), 0.7),
  };

  return page;
}