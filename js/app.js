/* ============================================================
   SHIELD — Application shell + router
   Left nav · header · page lifecycle
   ============================================================ */

import { createTwinPage } from './pages/twin.js';
import { createHardwareTwinPage } from './pages/hardwareTwin.js';
import { createPlaceholderPage } from './pages/placeholders.js';
import { INSTALL_SUMMARY } from './config/sensors.js';

const NAV = [
  { id: 'twin', label: 'Twin', icon: '◆' },
  { id: 'hardware', label: 'Hardware Twin', icon: '◈' },
  { id: 'manufacturing', label: 'Manufacturing', icon: '⚙' },
  { id: 'experiments', label: 'Experiments', icon: '⌬' },
  { id: 'analytics', label: 'Analytics', icon: '▥' },
  { id: 'passport', label: 'Passport', icon: '▤' },
  { id: 'alerts', label: 'Alerts', icon: '⚠' },
];

const HEADERS = {
  twin: { kicker: 'SHIELD · STRUCTURAL DIGITAL TWIN', title: 'Structural Digital Twin' },
  hardware: { kicker: 'SHIELD · HARDWARE DIGITAL TWIN', title: 'Hardware Digital Twin' },
  manufacturing: { kicker: 'SHIELD · MANUFACTURING', title: 'Manufacturing' },
  experiments: { kicker: 'SHIELD · EXPERIMENTS', title: 'Experiments' },
  analytics: { kicker: 'SHIELD · ANALYTICS', title: 'Analytics' },
  passport: { kicker: 'SHIELD · ASSET PASSPORT', title: 'Asset Passport' },
  alerts: { kicker: 'SHIELD · ALERTS', title: 'Alerts' },
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
        PROTOTYPE DEMO · EV-CH-007<br>Instrumented build 1:4<br><span style="color:var(--text-faint)">edge: ESP32 · WiFi/MQTT</span>
      </div>
    </nav>
    <main id="main">
      <header id="hdr">
        <div class="h-title">
          <div class="kicker" id="h-kicker"></div>
          <h1 id="h-title"></h1>
        </div>
        <div class="h-chips">
          <div class="chip"><b class="mono">EV-CH-007</b>&nbsp;·&nbsp;<span>Instrumented Model 1:4</span></div>
          <div class="chip"><span>Vehicle Mode</span><b>Manufacturing</b></div>
          <div class="chip"><span class="dot ok pulse"></span><span>Edge Node</span><b>Connected</b></div>
          <div class="chip"><span class="dot ${INSTALL_SUMMARY.healthy === INSTALL_SUMMARY.installed ? 'ok' : 'warn'}"></span><span>Sensors</span><b>${INSTALL_SUMMARY.healthy}/${INSTALL_SUMMARY.installed} Healthy</b></div>
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

  NAV.forEach(item => {
    const b = document.createElement('button');
    b.className = 'nav-item';
    b.dataset.page = item.id;
    b.innerHTML = `<span class="ic">${item.icon}</span><span>${item.label}</span>`;
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
    } else {
      const page = createPlaceholderPage(contentEl, id);
      page.classList.add('active');
      pages[id] = page;
    }
  }

  window.addEventListener('resize', () => { /* ResizeObserver handles views */ });

  go('twin');

  // allow cross-link "open hardware twin sensor"
  window.SHIELD = {
    goto: go,
    INSTALL_SUMMARY,
  };
  return { go };
}

initApp();