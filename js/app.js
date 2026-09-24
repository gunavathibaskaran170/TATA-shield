/* ============================================================
   SHIELD — Application shell + router
   Slim premium header · compact nav rail · page lifecycle
   ============================================================ */

import { createTwinPage } from './pages/twin.js';
import { createHardwareTwinPage } from './pages/hardwareTwin.js';
import { createAnatomyPage } from './pages/anatomy.js';
import { createSensorLabPage } from './pages/sensorLab.js';
import { createPlaceholderPage } from './pages/placeholders.js';
import { INSTALL_SUMMARY } from './config/sensors.js';
import { ASSET } from './config/assetConfig.js';

const NAV = [
  { id: 'twin', label: 'Twin', icon: '◇' },
  { id: 'hardware', label: 'Hardware Twin', icon: '⌑' },
  { id: 'anatomy', label: 'Anatomy', icon: '⬡' },
  { id: 'sensors', label: 'Sensor Lab', icon: '⌗' },
  { id: 'manufacturing', label: 'Manufacturing', icon: '⚙' },
  { id: 'experiments', label: 'Experiments', icon: '⌬' },
  { id: 'analytics', label: 'Analytics', icon: '▦' },
  { id: 'passport', label: 'Passport', icon: '▤' },
  { id: 'alerts', label: 'Alerts', icon: '⚠' },
];

const HEADERS = {
  twin: { kicker: 'SHIELD · STRUCTURAL DIGITAL TWIN', title: 'Structural Digital Twin' },
  hardware: { kicker: 'SHIELD · HARDWARE DIGITAL TWIN', title: 'Hardware Digital Twin' },
  anatomy: { kicker: 'SHIELD · EV CHASSIS 3D ANATOMY', title: 'EV Chassis 3D Anatomy' },
  sensors: { kicker: 'SHIELD · SENSOR LAB', title: 'Sensor Engineering Lab' },
  manufacturing: { kicker: 'SHIELD · MANUFACTURING', title: 'Smart Manufacturing Line' },
  experiments: { kicker: 'SHIELD · EXPERIMENTS', title: 'Structural Experiments' },
  analytics: { kicker: 'SHIELD · ANALYTICS', title: 'Signal Analytics' },
  passport: { kicker: 'SHIELD · ASSET PASSPORT', title: 'Structural Digital Passport' },
  alerts: { kicker: 'SHIELD · ALERTS', title: 'Operational Alerts' },
};

const LINK_STATE = {
  SIMULATED: { label: 'SIMULATED EDGE', class: 'idle', dotColor: '#7e8ca3' },
  CONNECTING: { label: 'CONNECTING', class: 'warn', dotColor: '#f2b94e' },
  CONNECTED: { label: 'CONNECTED', class: 'ok', dotColor: '#4fe0a0' },
  RECONNECTING: { label: 'RECONNECTING', class: 'warn', dotColor: '#f2b94e' },
  DISCONNECTED: { label: 'DISCONNECTED', class: 'off', dotColor: '#6b7686' },
  ERROR: { label: 'ERROR', class: 'bad', dotColor: '#ff6b5e' },
};

export function initApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <nav id="nav">
      <div class="brand">
        <div class="logo">S</div>
        <div><div class="name">SHIELD</div><div class="sub">STRUCTURAL TWIN PLATFORM</div></div>
      </div>
      <div class="nav-sec">WORKSPACE</div>
      <div id="nav-items"></div>
      <div class="nav-foot">
        ASSET <span class="up">EV-CH-007</span> · Scaled test frame · 400 × 200 mm<br>
        REGIONS B1–B4 · F1 · C1 · R1<br>
        edge: ESP32 · WiFi/MQTT
      </div>
    </nav>
    <main id="main">
      <header id="hdr">
        <div class="h-title">
          <div class="kicker" id="h-kicker"></div>
          <h1 id="h-title"></h1>
        </div>
        <div class="h-chips">
          <div class="chip"><span class="dot idle" style="background:#7e8ca3"></span><span>Asset</span><b class="mono">EV-CH-007</b></div>
          <div class="chip"><span>Vehicle Mode</span><b>Manufacturing</b></div>
          <div class="chip" id="hdr-mode-chip"><span class="dot idle" id="hdr-mode-dot"></span><span>MODE</span><b id="hdr-mode-label">SIMULATION</b></div>
          <div class="chip" id="hdr-link-chip"><span class="dot idle" id="hdr-link-dot"></span><span>LINK</span><b id="hdr-link-label">SIMULATED EDGE</b></div>
          <div class="chip" id="hdr-health-chip"><span class="dot ok" id="hdr-health-dot"></span><span>Sensors</span><b id="hdr-health-label">8/8 Healthy</b></div>
          <div class="hdr-icon" title="Settings">⚙</div>
          <div class="hdr-icon" title="Help">?</div>
        </div>
      </header>
      <div id="content"></div>
    </main>
  `;

  const navEl = app.querySelector('#nav-items');
  const contentEl = app.querySelector('#content');
  const hKicker = app.querySelector('#h-kicker');
  const hTitle = app.querySelector('#h-title');
  const pages = {};
  let current = null;
  let pendingHardwareSelect = null;

  const hdrModeLabel = app.querySelector('#hdr-mode-label');
  const hdrModeDot = app.querySelector('#hdr-mode-dot');
  const hdrLinkLabel = app.querySelector('#hdr-link-label');
  const hdrLinkDot = app.querySelector('#hdr-link-dot');
  const hdrHealthLabel = app.querySelector('#hdr-health-label');
  const hdrHealthDot = app.querySelector('#hdr-health-dot');

  function setModeChip(mode) {
    hdrModeLabel.textContent = mode;
    if (mode === 'LIVE') {
      hdrModeDot.className = 'dot accent pulse';
    } else {
      hdrModeDot.className = 'dot idle';
    }
  }

  function setLinkChip(state) {
    const s = LINK_STATE[state] || LINK_STATE.DISCONNECTED;
    hdrLinkLabel.textContent = s.label;
    hdrLinkDot.className = 'dot ' + s.class;
    hdrLinkDot.style.background = s.dotColor;
  }

  function setHealthChip(healthy, total) {
    hdrHealthLabel.textContent = healthy + '/' + total + ' Healthy';
    const cls = healthy === total ? 'ok' : healthy > 0 ? 'warn' : 'bad';
    hdrHealthDot.className = 'dot ' + cls;
  }

  setModeChip('SIMULATION');
  setLinkChip('SIMULATED');
  setHealthChip(8, 8);

  NAV.forEach(item => {
    const b = document.createElement('button');
    b.className = 'nav-item';
    b.dataset.page = item.id;
    b.innerHTML = '<span class="ic">' + item.icon + '</span><span>' + item.label + '</span>';
    b.addEventListener('click', () => go(item.id));
    navEl.appendChild(b);
  });

  function go(id, payload) {
    if (id === current) {
      if (id === 'hardware' && payload && pages.hardware) pages.hardware.selectSensor && pages.hardware.selectSensor(payload);
      return;
    }
    current = id;
    navEl.querySelectorAll('.nav-item').forEach(x =>
      x.classList.toggle('active', x.dataset.page === id));
    contentEl.innerHTML = '';
    pages[id] = null;
    const h = HEADERS[id];
    hKicker.textContent = h.kicker;
    hTitle.textContent = h.title;

    pendingHardwareSelect = id === 'hardware' ? payload : null;

    if (id === 'twin') {
      const page = createTwinPage(contentEl, go);
      page.classList.add('active');
      pages.twin = page;
    } else if (id === 'hardware') {
      const page = createHardwareTwinPage(contentEl);
      page.classList.add('active');
      pages.hardware = page;
      if (pendingHardwareSelect) {
        queueMicrotask(() => page.selectSensor && page.selectSensor(pendingHardwareSelect));
      }
      pendingHardwareSelect = null;
    } else if (id === 'anatomy') {
      const page = createAnatomyPage(contentEl);
      page.classList.add('active');
      pages.anatomy = page;
    } else if (id === 'sensors') {
      const page = createSensorLabPage(contentEl);
      page.classList.add('active');
      pages.sensors = page;
    } else {
      const page = createPlaceholderPage(contentEl, id);
      page.classList.add('active');
      pages[id] = page;
    }
  }

  window.addEventListener('resize', () => { /* ResizeObserver handles views */ });

  go('twin');

  window.SHIELD = {
    goto: go,
    INSTALL_SUMMARY: { healthy: 8, installed: 8 },
    setModeChip,
    setLinkChip,
    setHealthChip,
  };
  return { go };
}

initApp();