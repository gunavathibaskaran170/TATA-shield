/* ============================================================
   SHIELD — HARDWARE DIGITAL TWIN page
   "How are we measuring it?" — the physical instrumentation
   architecture mapped onto the EV-CH-007 chassis.
   ============================================================ */

import * as THREE from 'three';
import { createView } from '../core/scene.js';
import { buildChassis, flashRegion, regionMeshList } from '../core/chassis.js';
import { buildSensorRig, setSensorOpacity, resetAllSensorOpacity } from '../core/sensorMeshes.js';
import { PathSystem } from '../core/signalPaths.js';
import { SENSORS, EDGE_NODE, INSTALL_SUMMARY, HEALTH_COLOR, HEALTH_CLASS, LAYERS, sensorById } from '../config/sensors.js';
import { REGIONS, ZONES, regionById, ANCHOR } from '../config/vehicle.js';

const ADC_LABEL = {
  strain: 'HX711 / ADS1115',
  imu: 'MPU-6050 · I2C',
  load: 'HX711 (24-bit)',
  temp: '1-Wire (DS18B20)',
  disp: 'I2C (VL53L1X)',
};

function hw() {
  return {
    sel: null,            // selected sensor id (or 'EDGE1')
    tab: 'live',
    toggles: { signal: false, map: false, explode: false },
    layer: 'ALL',
    zone: null,
    explodeT: 0,
    lastPacketT: 0,
  };
}

export function createHardwareTwinPage(host) {
  const page = document.createElement('div');
  page.className = 'hw-page';
  host.appendChild(page);

  /* ---------------- DOM scaffold ---------------- */
  page.innerHTML = `
    <div class="hw-view"></div>
    <div class="hw-controls">
      <div class="row">
        <button class="btn" data-tg="signal">◈ Signal Path</button>
        <button class="btn" data-tg="map">◎ Digital Mapping</button>
        <button class="btn" data-tg="explode">⤢ Exploded Instrumentation</button>
      </div>
      <div class="row" style="opacity:.85">
        <button class="btn small" id="hw-home">Reset View</button>
      </div>
    </div>
    <div class="hw-filters">
      <div class="fpanel">
        <div class="fhead"><span>HARDWARE LAYER</span><span id="fl-count"></span></div>
        <div id="layer-chips"></div>
      </div>
      <div class="fpanel">
        <div class="fhead"><span>STRUCTURAL ZONE</span></div>
        <div id="zone-chips"></div>
      </div>
    </div>
    <div class="hw-panel">
      <div class="inspect-head">
        <div class="who"><h2 id="in-h2">Instrumentation Summary</h2><div class="sub" id="in-sub">EV-CH-007 · Manufacturing Mode</div></div>
        <span id="in-health"></span>
      </div>
      <div class="inspect-tabs" id="in-tabs" style="display:none">
        <button data-tab="live" class="active">LIVE DATA</button>
        <button data-tab="info">COMPONENT INFO</button>
      </div>
      <div class="inspect-body" id="in-body"></div>
    </div>
    <div class="hw-strip">
      <div class="tag">SIGNAL CHAIN</div>
      <div class="chain" id="hw-chain"></div>
      <div class="live" id="hw-live"></div>
    </div>
    <div class="footnote">INSTRUMENTED PROTOTYPE · SENSOR LAYOUT IS VEHICLE-SPECIFIC · PRODUCTION LAYOUT VIA FEA / LOAD-PATH / STRAIN-ENERGY ANALYSIS</div>
  `;

  /* ---------------- 3D view ---------------- */
  const viewEl = page.querySelector('.hw-view');
  /* ---------------- frame loop ---------------- */
  function frameLoop(t, dt) {
    // explode damping
    const targetT = state.toggles.explode ? 1 : 0;
    state.explodeT += (targetT - state.explodeT) * Math.min(1, dt * 4);
    const e = state.explodeT;
    if (batteryBodyMat) batteryBodyMat.opacity = 0.52 - 0.34 * e;
    sensorMap.forEach((root, id) => {
      const s = 1 + 0.3 * e;
      if (id !== 'EDGE1') root.scale.setScalar(s);
    });
    paths.tick(t);
    V.updateTween(dt);
    refreshLive(dt);
  }

  const V = createView(viewEl, {
    camHome: {
      pos: new THREE.Vector3(0.66, 0.50, 0.64),
      target: new THREE.Vector3(0.0, 0.02, 0.0),
    },
    onFrame: frameLoop,
  });
  const state = hw();

  /* ---------------- Chassis + sensors + paths ---------------- */
  const { group: chassis, regionGroups } = buildChassis(V.scene);
  V.scene.add(chassis);

  const { group: sensorGroup, sensors: sensorMap, anchors, edgeNode } = buildSensorRig();
  V.scene.add(sensorGroup);

  const paths = new PathSystem(V.scene);
  const signalLines = new Map();
  const mapLines = new Map();

  sensorMap.forEach((root, id) => {
    if (id === 'EDGE1') return;
    const cfg = sensorById(id);
    const aus = anchors.get(id);
    const ePos = anchors.get('EDGE1');
    signalLines.set(id, paths.addSignalLine(id, aus, ePos));
    // region centroid for digital mapping (fallback to sensor pos if group is empty)
    const rg = regionGroups[cfg.region];
    const box = new THREE.Box3().setFromObject(rg);
    const centroid = box.isEmpty()
      ? new THREE.Vector3(...cfg.position)
      : box.getCenter(new THREE.Vector3());
    mapLines.set(id, paths.addMapLine(id, aus, centroid));
  });

  /* battery material refs for transparency in exploded mode */
  let batteryBodyMat = null;
  let batteryEndMats = [];
  regionGroups['C1'].traverse(o => {
    if (o.isMesh && o.name === 'battery-housing' && o.material) batteryBodyMat = o.material;
    if (o.isMesh && o.name === '' && o.geometry && o.geometry.type === 'BoxGeometry' && o.position.z === ANCHOR.batteryFrontZ && o.material) batteryEndMats.push(o.material);
  });

  const pickables = regionMeshList(chassis);
  sensorMap.forEach(r => pickables.push(r));

  /* ---------------- filter chips ---------------- */
  const layerEl = page.querySelector('#layer-chips');
  LAYERS.forEach(L => {
    const c = document.createElement('button');
    c.className = 'fchip' + (L.id === 'ALL' ? ' on' : '');
    c.textContent = L.label;
    c.dataset.layer = L.id;
    c.addEventListener('click', () => {
      state.layer = L.id;
      paintFilterChips();
      applyFilters();
    });
    layerEl.appendChild(c);
  });
  const zoneEl = page.querySelector('#zone-chips');
  function clearSensorSelection() {
    state.sel = null;
    sensorMap.forEach((r) => { if (r.userData.ring) r.userData.ring.visible = false; });
    if (edgeNode && edgeNode.userData.ring) edgeNode.userData.ring.visible = false;
  }
  function setZoneActive(z) {
    state.zone = z;
    if (z) clearSensorSelection();
    paintFilterChips();
    applyFilters();
    renderInspector();
  }
  ZONES.forEach(z => {
    const c = document.createElement('button');
    c.className = 'fchip';
    c.textContent = z.replace(/_/g, ' ');
    c.dataset.zone = z;
    c.addEventListener('click', () => setZoneActive(state.zone === z ? null : z));
    zoneEl.appendChild(c);
  });

  function paintFilterChips() {
    layerEl.querySelectorAll('.fchip').forEach(c =>
      c.classList.toggle('on', c.dataset.layer === state.layer));
    zoneEl.querySelectorAll('.fchip').forEach(c =>
      c.classList.toggle('on', c.dataset.zone === state.zone));
  }
  function zoneOf(cfg) {
    const r = regionById(cfg.region);
    return r ? r.zone : null;
  }
  function applyFilters() {
    resetAllSensorOpacity(sensorMap);
    // reset region flashes
    Object.values(regionGroups).forEach(g => flashRegion(g, false));
    sensorMap.forEach((root, id) => {
      if (id === 'EDGE1') return;
      const cfg = sensorById(id);
      const layerActive = state.layer === 'ALL' || (state.layer === 'edge' ? false : cfg.type === state.layer);
      const zoneActive = !state.zone || zoneOf(cfg) === state.zone;
      if (!layerActive || !zoneActive) setSensorOpacity(root, 0.12);
    });
    if (state.layer === 'edge' && state.zone) {
      // edge node behaves independently
      setSensorOpacity(edgeNode, 0.25);
    }
    if (state.zone) {
      const rg = regionGroupsForZone(state.zone);
      rg.forEach(g => flashRegion(g, true, 0x3f6df0));
    }
    if (state.layer === 'edge') {
      // fade all sensors, keep edge node
      sensorMap.forEach((root, id) => { if (id !== 'EDGE1') setSensorOpacity(root, 0.12); });
      setSensorOpacity(edgeNode, 1);
    }
    if (state.layer !== 'ALL' && state.layer !== 'edge' && !state.zone) {
      setSensorOpacity(edgeNode, 0.4); // keep context
    }
    const cnt = state.zone
      ? SENSORS.filter(s => zoneOf(s) === state.zone).length
      : SENSORS.filter(s => state.layer === 'ALL' || s.type === state.layer).length;
    page.querySelector('#fl-count').textContent = state.layer === 'ALL' && !state.zone ? '' : `${cnt}`;
  }
  function regionGroupsForZone(zone) {
    const ids = REGIONS.filter(r => r.zone === zone).map(r => r.id);
    return ids.map(id => regionGroups[id]).filter(Boolean);
  }

  /* ---------------- toggles ---------------- */
  page.querySelectorAll('[data-tg]').forEach(b => {
    b.addEventListener('click', () => {
      const k = b.dataset.tg;
      state.toggles[k] = !state.toggles[k];
      b.classList.toggle('on', state.toggles[k]);
      paths.showSignal(state.toggles.signal || state.toggles.explode);
      paths.showMap(state.toggles.map);
      if (k === 'explode') setExplode(state.toggles.explode);
    });
  });
  page.querySelector('#hw-home').addEventListener('click', () => {
    V.flyTo(V.defaults.homePos.clone(), V.defaults.homeTarget.clone(), 0.7);
  });

  /* ---------------- exploded view ---------------- */
  const explodeCam = { pos: new THREE.Vector3(0.74, 0.58, 0.72) };
  function setExplode(on) {
    if (on) {
      state.explodeT = 0;
      V.flyTo(explodeCam.pos, V.defaults.homeTarget.clone(), 0.9);
    } else {
      V.flyTo(V.defaults.homePos.clone(), V.defaults.homeTarget.clone(), 0.9);
    }
  }

  /* headless QA diagnostic: expose damped explode params + path visibility */
  function probeState() {
    const sg = sensorMap.get('SG04');
    return {
      explodeT: Math.round(state.explodeT * 100) / 100,
      batteryOpacity: batteryBodyMat ? Math.round(batteryBodyMat.opacity * 100) / 100 : null,
      sensorScale: sg ? Math.round(sg.scale.x * 100) / 100 : null,
      camPos: [V.camera.position.x, V.camera.position.y, V.camera.position.z].map(v => Math.round(v * 100) / 100),
      signalVisible: signalLines.size > 0 ? Array.from(signalLines.values()).every(l => l.line && l.line.visible) : false,
      mapVisible: mapLines.size > 0 ? Array.from(mapLines.values()).every(l => l.line && l.line.visible) : false,
      diag: {
        mapGroupVisible: paths.mapGroup.visible,
        signalGroupVisible: paths.signalGroup.visible,
        mapLineCount: mapLines.size,
        mapLineV: Array.from(mapLines.values()).slice(0, 3).map(l => l.line ? l.line.visible : null),
        mapLineBySensor: Array.from(mapLines.entries()).map(([id, l]) => [id, !!l.line]),
        mapLineGeo: (['SG01', 'SG03', 'TEMP01']).map(id => {
          const cfg = sensorById(id);
          const rg = regionGroups[cfg.region];
          const box = new THREE.Box3().setFromObject(rg);
          const cent = box.isEmpty() ? new THREE.Vector3(...cfg.position) : box.getCenter(new THREE.Vector3());
          const aus = anchors.get(id);
          return {
            id, region: cfg.region,
            rawPos: cfg.position,
            aus: aus ? [+aus.x.toFixed(3), +aus.y.toFixed(3), +aus.z.toFixed(3)] : null,
            cent: [cent.x, cent.y, cent.z].map(v => Number.isFinite(v) ? +v.toFixed(3) : v),
            boxEmpty: box.isEmpty(),
          };
        }),
        mapPulseGroupVisible: (paths.mapPulses[0] || {}).group.visible,
        toggles: { ...state.toggles },
      },
      mapPulse: paths.pulseSnapshot('map', 0),
      signalPulse: paths.pulseSnapshot('signal', 0),
      labels: (() => {
        const v = new THREE.Vector3();
        const out = [];
        const rect = viewEl.getBoundingClientRect();
        sensorMap.forEach((root, id) => {
          const lab = root.userData.label;
          if (!lab) return;
          lab.getWorldPosition(v);
          const sv = v.clone().project(V.camera);
          const cx = (sv.x * 0.5 + 0.5) * rect.width;
          const cy = (-sv.y * 0.5 + 0.5) * rect.height;
          out.push({
            id,
            sx: Math.round(rect.left + cx),
            sy: Math.round(rect.top + cy),
            wx: +v.x.toFixed(3), wy: +v.y.toFixed(3), wz: +v.z.toFixed(3),
            bbTop: +(new THREE.Box3().setFromObject(root).max.y).toFixed(3),
            labelY: +(lab.position.y).toFixed(3),
          });
        });
        return { labels: out, viewTop: rect.top, viewLeft: rect.left, viewW: rect.width, viewH: rect.height };
      })(),
    };
  }

  /* ---------------- raycast interaction ---------------- */
  let hovered = null;
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  document.body.appendChild(tooltip);

  function ownerOf(obj) {
    let n = obj;
    while (n) {
      if (n.userData && n.userData.sensorId) return { kind: 'sensor', id: n.userData.sensorId };
      if (n.userData && n.userData.edgeNode) return { kind: 'edge', id: 'EDGE1' };
      if (n.userData && n.userData.regionId) return { kind: 'region', id: n.userData.regionId };
      n = n.parent;
    }
    return null;
  }

  function firstHit(ev) {
    V.setPointer(ev);
    V.raycaster.setFromCamera(V.pointer, V.camera);
    const hits = V.raycaster.intersectObjects(pickables, true);
    for (const h of hits) {
      // ignore pure labels of other objects
      const owner = ownerOf(h.object);
      if (owner) return owner;
    }
    return null;
  }

  function onPointerMove(ev) {
    const owner = firstHit(ev);
    let info = null;
    if (owner) {
      info = owner.kind === 'sensor' ? sensorById(owner.id)
        : owner.kind === 'edge' ? { __edge: true }
        : { __region: regionById(owner.id) };
    }
    if (info && !(info.id === undefined && !info.__edge && !info.__region)) {
      viewEl.style.cursor = 'pointer';
      let html = '';
      if (info.id) html = `<span class="tt-id">${info.id}</span> · ${info.name}<div class="tt-sub">Click for instrumentation detail</div>`;
      else if (info.__edge) html = `<span class="tt-id">SHIELD EDGE NODE</span><div class="tt-sub">ESP32 acquisition · click for detail</div>`;
      else if (info.__region) html = `<span class="tt-id">${info.__region.id}</span> · ${info.__region.name}<div class="tt-sub">Click to view region instrumentation</div>`;
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
      tooltip.style.left = (ev.clientX + 14) + 'px';
      tooltip.style.top = (ev.clientY + 12) + 'px';
    } else {
      viewEl.style.cursor = 'grab';
      tooltip.style.display = 'none';
    }
    hovered = info;
  }

  function onClick(ev) {
    const owner = firstHit(ev);
    if (!owner) { select(null); return; }
    if (owner.kind === 'sensor') select(owner.id);
    else if (owner.kind === 'edge') select('EDGE1');
    else selectRegion(owner.id);
  }

  viewEl.addEventListener('pointermove', onPointerMove);
  viewEl.addEventListener('pointerdown', onClick);

  /* ---------------- selection ---------------- */
  function select(id) {
    state.sel = id;
    state.tab = 'live';
    // rings
    sensorMap.forEach((r, rid) => {
      if (r.userData.ring) r.userData.ring.visible = rid === id;
    });
    edgeNode.userData.ring && (edgeNode.userData.ring.visible = id === 'EDGE1');
    renderInspector();
    renderChain();
  }

  function selectRegion(regionId) {
    state.sel = null;
    const chips = [...zoneEl.querySelectorAll('.fchip')];
    state.zone = regionById(regionId).zone;
    paintFilterChips();
    resetAllSensorOpacity(sensorMap);
    applyFilters();
    renderInspector();
  }

  /* ---------------- right panel ---------------- */
  const inH2 = page.querySelector('#in-h2');
  const inSub = page.querySelector('#in-sub');
  const inHealth = page.querySelector('#in-health');
  const inTabs = page.querySelector('#in-tabs');
  const inBody = page.querySelector('#in-body');

  inTabs.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      state.tab = b.dataset.tab;
      if (!state.sel || state.sel === 'EDGE1' || state.zone) return;
      renderInspector();
    });
  });

  function healthChip(cfg, extra = '') {
    if (!cfg) return '';
    return `<span class="health ${HEALTH_CLASS[cfg.health] || 'ok'}">● ${cfg.health}${extra}</span>`;
  }

  function liveRows(cfg) {
    let out = '';
    if (cfg.type === 'strain') {
      const cur = cfg.live().current;
      const delta = cfg.live().delta;
      const dnum = parseFloat(delta);
      out += krow('Current', cur === null ? '—' : `${cur.toFixed(1)} µε`, cur === null ? 'crit' : 'live');
      out += krow('Baseline', `${cfg.baseline} µε`, 'dim');
      out += krow('Expected (model)', `${cfg.expected} µε`);
      out += krow('Residual', delta, cur === null ? 'crit' : (Math.abs(dnum) > 8 ? 'crit' : (Math.abs(dnum) > 5 ? 'up' : 'good')));
    } else if (cfg.type === 'imu') {
      const l = cfg.live();
      out += krow('Vibration RMS', `${l.rms} g`);
      out += krow('Peak', `${l.peak} g`);
      out += krow('Dominant Frequency', `${l.domFreq} Hz`);
    } else if (cfg.type === 'load') {
      const l = cfg.live();
      out += krow('Force', `${l.force} N`, 'good');
      out += krow('Mass Equivalent', l.mass);
      out += krow('Load Direction', l.dir);
    } else if (cfg.type === 'temp') {
      const l = cfg.live();
      out += krow('Temperature', `${l.temp} °C`);
      out += krow('Drift', l.drift, 'dim');
    } else if (cfg.type === 'disp') {
      const l = cfg.live();
      out += krow('Current Displacement', `${l.current} mm`);
      out += krow('Reference', `${l.reference} mm`, 'dim');
      out += krow('Difference', `${l.diff} mm`, Math.abs(parseFloat(l.diff)) > 0.3 ? 'up' : 'good');
    }
    out += krow('Signal Quality', `${cfg.signalQuality}%`, cfg.signalQuality < 80 ? 'up' : 'good');
    out += krow('Calibration', cfg.calibration, cfg.calibration === 'Valid' ? 'good' : 'up');
    if (cfg.health !== 'HEALTHY') {
      out += krow('Sensor Status', cfg.health, 'crit');
      out += krow('Last Valid Update', cfg.health === 'OFFLINE' ? '14:32:07 — T-2h' : '—', 'dim');
    }
    return out;
  }

  function krow(k, v, cls = '') {
    return `<div class="krow"><div class="k">${k}</div><div class="v ${cls}">${v}</div></div>`;
  }

  function infoRows(cfg) {
    let out = '';
    if (cfg.type === 'strain') {
      out += krow('Sensor', cfg.gauge.type);
      out += krow('Nominal Resistance', `${cfg.gauge.resistance} Ω`);
      out += krow('Gauge Factor', cfg.gauge.gaugeFactor);
      out += krow('Bridge', cfg.gauge.bridge);
      out += krow('Conditioning', 'Instrumentation amp + low-pass', '');
      out += krow('Orientation', 'Longitudinal (levelled to rail)', '');
      out += krow('Mount', `Top flange · normal ${fmtVec(cfg.surfaceNormal)}`, '');
    } else if (cfg.type === 'imu') {
      out += krow('Sensor', cfg.sensor.type);
      out += krow('Outputs', cfg.sensor.outputs);
      out += krow('Interface', cfg.adc);
      out += '';

      out += `<div class="sec-t">MAIN ENGINEERING USE</div>`;
      out += `<div class="chain"><span class="node">RMS</span><span class="arr">·</span><span class="node">Peak</span><span class="arr">·</span><span class="node">Dominant Freq</span><span class="arr">·</span><span class="node">Frequency Shift</span></div>`;
      out += twoImuPair();
    } else if (cfg.type === 'load') {
      out += krow('Sensor', cfg.sensor.type);
      out += krow('Capacity', cfg.sensor.capacity);
      out += krow('Accuracy', cfg.sensor.class);
      out += `<div class="sec-t">SIGNAL CHAIN</div>`;
      out += `<div class="chain">${chainNodes(['Load Cell', 'HX711', 'ESP32', 'Digital Twin'])}</div>`;
    } else if (cfg.type === 'temp') {
      out += krow('Sensor', cfg.sensor.type);
      out += krow('Resolution', cfg.sensor.resolution);
      out += krow('Accuracy', cfg.sensor.accuracy);
      out += krow('Role', 'Environmental context & strain compensation', '');
      out += `<div class="note">TEMP01 is <b>not</b> a structural damage sensor — it normalises strain readings against thermal drift.</div>`;
    } else if (cfg.type === 'disp') {
      out += krow('Sensor', cfg.sensor.type);
      out += krow('Range', cfg.sensor.range);
      out += krow('Role', 'Physical validation of DT deformation model', '');
    }
    out += krow('Channel', cfg.channel);
    out += krow('Calibration', cfg.calibration);
    out += krow('ADC Path', cfg.adc);
    return out;
  }

  function twoImuPair() {
    const a = sensorById('IMU01');
    const b = sensorById('IMU02');
    const la = a.live(), lb = b.live();
    const rmsA = parseFloat(la.rms), rmsB = parseFloat(lb.rms);
    const fA = parseFloat(la.domFreq), fB = parseFloat(lb.domFreq);
    return `
      <div class="sec-t">TWO-IMU TRANSFER</div>
      <div class="chain">
        <span class="node hot">IMU01 REFERENCE</span><span class="arr">↓ path ↓</span><span class="node">IMU02 RESPONSE</span>
      </div>
      ${krow('Vibration RMS ratio (R/F)', (rmsB / rmsA).toFixed(2))}
      ${krow('Dominant-frequency shift', (fA - fB).toFixed(1) + ' Hz')}
      ${krow('Transmission ratio', ((rmsB * 100) / rmsA).toFixed(0) + ' %')}
      ${krow('Response delay (phase)', '≈ 12 ms')}
      <div class="note">Sensors are separated along the load path (front reference → rear response) so transfer measurements are meaningful. X/Y/Z channels are shown only on request.</div>
    `;
  }

  function fmtVec(v) { return `[${v.map(x => x.toFixed(2)).join(', ')}]`; }

  function signalChainNodes(cfg) {
    const adc = ADC_LABEL[cfg.type] || 'ADC';
    const region = regionById(cfg.region);
    return [
      'PHYSICAL', cfg.id, adc, 'ESP32', 'MQTT', 'DIGITAL TWIN', region ? `${region.id} REGION` : 'REGION',
    ];
  }

  function chainNodes(list, hotIdx = -1) {
    return list.map((n, i) => {
      const cls = i === hotIdx ? 'hot' : '';
      const sep = i === 0 ? '' : '<span class="arr">→</span>';
      return sep + `<span class="node ${cls}">${n}</span>`;
    }).join('');
  }

  function renderChain() {
    const chain = page.querySelector('#hw-chain');
    const liveEl = page.querySelector('#hw-live');
    if (state.sel === 'EDGE1') {
      chain.innerHTML = chainNodes(['SENSORS ×9', 'ESP32', 'EDGE FEATURE EXTRACTION', 'MQTT / WS', 'DIGITAL TWIN']);
      liveEl.innerHTML = `<b>EDGE1</b> acquisition running`;
      return;
    }
    const cfg = state.sel ? sensorById(state.sel) : null;
    if (!cfg) {
      chain.innerHTML = chainNodes(['PHYSICAL', 'SENSOR', 'BRIDGE / ADC', 'ESP32', 'MQTT', 'DIGITAL TWIN', 'REGION'], 5);
      liveEl.innerHTML = `select a device`;
      return;
    }
    const nodes = signalChainNodes(cfg);
    chain.innerHTML = chainNodes(nodes, 5);
    const l = cfg.live();
    const sample = cfg.type === 'strain' && l.current !== null ? `${l.current.toFixed(1)} µε`
      : cfg.type === 'strain' && l.current === null ? 'NO DATA'
      : cfg.type === 'load' ? `${l.force} N`
      : cfg.type === 'temp' ? `${l.temp} °C`
      : cfg.type === 'disp' ? `${l.current} mm` : `${l.rms} g RMS`;
    liveEl.innerHTML = `<b>${cfg.id}</b> ${sample} · streaming`;
  }

  function summaryHTML() {
    return `
      <div class="sec-t">INSTRUMENTATION SUMMARY</div>
      ${krow('Installed sensors', INSTALL_SUMMARY.installed)}
      ${krow('Strain channels', INSTALL_SUMMARY.strain)}
      ${krow('IMUs', INSTALL_SUMMARY.imu)}
      ${krow('Load channels', INSTALL_SUMMARY.load)}
      ${krow('Temperature', INSTALL_SUMMARY.temp)}
      ${krow('Optional displacement', INSTALL_SUMMARY.disp + ' (installed)')}
      ${krow('Edge Node', 'Online', 'good')}
      ${krow('Sensor health', `${INSTALL_SUMMARY.healthy}/${INSTALL_SUMMARY.installed} Healthy`, INSTALL_SUMMARY.healthy === INSTALL_SUMMARY.installed ? 'good' : 'up')}
      ${krow('Monitored coverage', '4 strain zones · B1–B4')}
      <div class="sec-t">SENSOR HEALTH</div>
      <div class="health-grid">
        ${SENSORS.map(s => `<span class="hdot ${s.health === 'HEALTHY' ? '' : 'off'}"><span class="mini" style="background:${HEALTH_COLOR[s.health]}"></span>${s.id}</span>`).join('')}
      </div>
      <div class="sec-t">WHY FOUR STRAIN GAUGES</div>
      <div class="note">Four gauges provide <b>monitored-zone</b> structural response information — left/right and front/rear comparison, load-asymmetry detection and zone-based localisation. They do <b>not</b> provide continuous full-vehicle deformation mapping.</div>
      <div class="note">Sensor positions are <b>vehicle specific</b>. Production placement is selected through load-path analysis, FEA, strain-energy/sensitivity analysis, modal analysis and battery-mount design. This prototype demonstrates the <b>methodology</b>.</div>
      <div class="sec-t">SELECTED COVERAGE</div>
      <div class="chain">${chainNodes(['B1 FL-RAIL', 'B2 FR-RAIL', 'B3 RL-MOUNT', 'B4 RR-MOUNT'], -1)}</div>
    `;
  }

  function regionHTML(region) {
    const monitored = SENSORS.filter(s => s.region === region.id);
    return `
      <div class="krow"><div class="k">Region</div><div class="v">${region.id} — ${region.name}</div></div>
      ${krow('Zone', region.zone.replace(/_/g, ' '))}
      ${krow('Monitored by', monitored.map(s => s.id).join(' ') || '—')}
      <div class="sec-t">REGION INSTRUMENTATION</div>
      <div class="chain">${chainNodes(monitored.map(s => s.id), -1)}</div>
      <div class="note">This structural region is mapped into the Digital Twin via the <b>${monitored.map(s => s.id).join(', ') || '—'}</b> sensor layer → Strain/IMU layer → Anomaly Engine → Twin highlight.</div>
    `;
  }

  function edgeHTML() {
    return `
      ${krow('Controller', EDGE_NODE.controller)}
      ${krow('Firmware', EDGE_NODE.fw)}
      ${krow('Data Link', EDGE_NODE.dataLink)}
      ${krow('Acquisition', EDGE_NODE.acquisition, 'good')}
      ${krow('Last Packet', `t-${state.lastPacketT} ms`)}
      ${krow('Sample Rate', EDGE_NODE.sampleRate, 'dim')}
      <div class="sec-t">CONNECTED SENSORS</div>
      <div class="health-grid">
        ${EDGE_NODE.connectedSensors.map(id => `<span class="hdot"><span class="mini" style="background:${HEALTH_COLOR[sensorById(id)?.health || 'HEALTHY']}"></span>${id}</span>`).join('')}
      </div>
      <div class="sec-t">EDGE PROCESSING STATE</div>
      <div class="note">${EDGE_NODE.edgeProcessing}</div>
      <div class="sec-t">INSIDE THE ENCLOSURE</div>
      <div class="chain">${chainNodes(['ESP32', 'HX711', 'ADS1115', 'Signal Conditioning', 'Power I/F'], -1)}</div>
      <div class="note">Final engineering product — no exposed breadboard. ADS1115 alone is <b>not</b> a complete strain amplifier; it samples conditioned bridge signals.</div>
    `;
  }

  function sensorLiveHTML(cfg) {
    const region = regionById(cfg.region);
    return `
      ${cfg.type === 'strain' ? `<div class="sec-t">STRAIN / MECHANICAL</div>` : ''}
      ${krow('Measurement', cfg.measurement)}
      ${krow('Unit', cfg.unit)}
      ${krow('Structural Region', `${region.id} — ${region.name}`, '')}
      ${cfg.type === 'strain' ? krow('Orientation', 'Longitudinal (shown as arrows)') : ''}
      ${liveRows(cfg)}
      ${cfg.type === 'imu' ? twoImuPair() : ''}
      <div class="sec-t">MECHANICAL PURPOSE</div>
      <div class="note">${cfg.mechanicalReason}</div>
      ${cfg.health !== 'HEALTHY' ? `<div class="sec-t">STRUCTURAL INTERPRETATION</div><div class="note">${cfg.note || 'Sensor excluded from current region assessment — the zone itself is NOT flagged as failed.'}</div>` : ''}
      <div class="sec-t">DIGITAL MAPPING</div>
      <div class="chain">${chainNodes([cfg.id, `${region.id}`, region.name, 'Strain Layer', 'Anomaly Engine', 'Twin Highlight'], -1)}</div>
    `;
  }

  function renderInspector() {
    const isEdge = state.sel === 'EDGE1';
    const cfg = state.sel && !isEdge ? sensorById(state.sel) : null;

    if (!state.sel && !state.zone) {
      inTabs.style.display = 'none';
      inHealth.innerHTML = '';
      inH2.textContent = 'Instrumentation Summary';
      inSub.textContent = 'EV-CH-007 · Manufacturing Mode';
      inBody.innerHTML = summaryHTML();
      return;
    }
    if (state.zone && !cfg) {
      inTabs.style.display = 'none';
      inHealth.innerHTML = '';
      const r = REGIONS.find(r => r.zone === state.zone) || REGIONS.find(r => r.zone === state.zone);
      inH2.textContent = `Zone — ${state.zone.replace(/_/g, ' ')}`;
      inSub.textContent = 'Structural zone instrumentation';
      inBody.innerHTML = REGIONS.filter(x => x.zone === state.zone)
        .map(x => regionHTML(x)).join('<div style="height:8px"></div>');
      return;
    }

    if (isEdge) {
      inTabs.style.display = 'none';
      inHealth.innerHTML = '<span class="health ok">● ONLINE</span>';
      inH2.textContent = 'SHIELD Edge Node';
      inSub.textContent = 'Structural Acquisition Node · ESP32';
      inBody.innerHTML = edgeHTML();
      return;
    }

    inTabs.style.display = 'flex';
    inHealth.innerHTML = healthChip(cfg);
    inH2.textContent = cfg.id;
    inSub.textContent = cfg.name;

    inTabs.querySelectorAll('button').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === state.tab));
    if (state.tab === 'live') inBody.innerHTML = sensorLiveHTML(cfg);
    else inBody.innerHTML = `
      <div class="sec-t">COMPONENT INFO</div>
      ${infoRows(cfg)}
      <div class="sec-t">MEASUREMENT PRINCIPLE</div>
      <div class="note">${cfg.type === 'strain'
        ? 'Resistance changes with mechanical strain (Wheatstone bridge). <b>Requires</b> bridge completion + signal conditioning.'
        : cfg.type === 'load'
        ? 'Strain-gauge bridge load measurement: Load Cell → HX711 → ESP32 → Digital Twin.'
        : cfg.type === 'imu'
        ? 'MEMS accelerometer + gyroscope: acceleration, vibration, shock, RMS, peak, dominant frequency, frequency shift.'
        : cfg.type === 'temp'
        ? '1-Wire digital temperature — environmental context and compensation.'
        : 'Time-of-flight distance measurement on a reference bracket.'}</div>
    `;
  }

  /* live refresh of live tab (approx 1 Hz) + last packet tick */
  let liveT = 0;
  function refreshLive(dt) {
    liveT += dt;
    if (liveT > 1.2) {
      liveT = 0;
      state.lastPacketT = 40 + Math.floor(Math.random() * 60);
      if (state.sel && state.sel !== 'EDGE1' && !state.zone && state.tab === 'live' && sensorById(state.sel)) {
        renderInspector();
      }
      if (state.sel === 'EDGE1') renderInspector();
      renderChain();
    }
  }

  page.selectSensor = (id) => {
    state.zone = null;
    const chips = [...zoneEl.querySelectorAll('.fchip')];
    paintFilterChips();
    resetAllSensorOpacity(sensorMap);
    applyFilters();
    select(id);
  };

  /* initial default render (instrumentation summary) */
  renderInspector();
  renderChain();
  applyFilters();

  /* debug / headless-render hooks */
  window.__HW = {
    select,
    setTab: t => { state.tab = t; renderInspector(); },
    setLayer: l => { state.layer = l; paintFilterChips(); applyFilters(); },
    setZone: z => setZoneActive(z),
    toggle: k => {
      state.toggles[k] = !state.toggles[k];
      page.querySelectorAll('[data-tg]').forEach(b => b.classList.toggle('on', b.dataset.tg === k && state.toggles[k]));
      paths.showSignal(state.toggles.signal || state.toggles.explode);
      paths.showMap(state.toggles.map);
      if (k === 'explode') setExplode(state.toggles.explode);
    },
    resetView: () => V.flyTo(V.defaults.homePos.clone(), V.defaults.homeTarget.clone(), 0.7),
    /* headless diagnostics for QA */
    probe: probeState,
  };

  return page;
}