/* SHIELD — Supporting pages (Manufacturing / Experiments / Analytics / Passport / Alerts) */

function card(title, rowsHtml, body = '') {
  return `<div class="ph-card"><h3>${title}</h3>${rowsHtml ? rowsHtml : ''}${body}</div>`;
}
function stat(l, v, cls = '') {
  return `<div class="stat"><span class="l">${l}</span><span class="v ${cls}">${v}</span></div>`;
}

const WORKFLOW = [
  ['Chassis Fabrication', 'DONE'],
  ['Battery Mounting', 'DONE'],
  ['Load Simulation', 'DONE'],
  ['Sensor Verification', 'CURRENT'],
  ['Edge Analysis', 'PENDING'],
  ['Digital Twin Validation', 'PENDING'],
  ['Quality Decision', 'PENDING'],
  ['Baseline Stored', 'PENDING'],
];
function flow() {
  return `<div class="flow">${WORKFLOW.map(([name, state]) =>
    `<div class="stage ${state === 'DONE' ? 'done' : state === 'CURRENT' ? 'cur' : ''}"><b>${name}</b><span>${state === 'CURRENT' ? 'IN PROCESS' : state}</span></div>`).join('')}</div>`;
}

export function createPlaceholderPage(host, kind) {
  const page = document.createElement('div');
  page.className = 'ph';
  host.appendChild(page);

  const content = {
    manufacturing: `
      <h2>Smart Manufacturing Line</h2>
      <div class="lead">Digital-twin-connected production line state for instrumented EV-CH-007 builds.</div>
      ${flow()}
      <div class="ph-grid">
        ${card('Station 4 · Sensor Bonding', stat('SG01–SG04 pad bond', 'VERIFIED 2026-09-12') + stat('Bond quality (resistance check)', '120 ± 0.4 Ω') + stat('Orientation re-check', 'PASS') + stat('IMU mount torque', '0.6 N·m · PASS'))}
        ${card('Edge Node Flash & Commission', stat('Firmware', 'v0.9.2 verified') + stat('WiFi / MQTT link', 'linked · RSSI −41 dBm') + stat('ADC self-test', 'PASS') + stat('Shadow twin sync', 'ACTIVE'))}
        ${card('Wireless Acquisition Test', `<p>Packet throughput from edge node to twin core during line qualification (MQTT over 2.4 GHz).</p><div class="bars">${'<i style="height:45%"></i><i style="height:70%"></i><i style="height:55%"></i><i style="height:80%"></i><i style="height:62%"></i><i style="height:90%"></i><i style="height:75%"></i>'.repeat(3)}</div>`, '')}
      </div>
      <div class="ph-grid" style="margin-top:12px">
        ${card('Vehicle State', stat('Line', 'RUNNING', '') + stat('Station 4 · Sensor bonding', 'SG01–SG04 done', '') + stat('Edge node flash', 'v0.9.2 verified', '') + stat('Shadow twin sync', 'ACTIVE', ''))}
        ${card('Quality Gates', stat('Structure acceptance', 'PASSED', '') + stat('Instrumentation acceptance', 'PASSED', '') + stat('Twin validation gate', 'NEXT', ''))}
      </div>
    `,
    experiments: `
      <h2>Structural Experiments</h2>
      <div class="lead">Controlled load-case experiments executed against the physical prototype.</div>
      <div class="ph-grid">
        ${card('Last Experiment · EX-014', stat('Load case', 'Battery inertial · 15 kg') + stat('Applied force', '147 N @ +Z') + stat('Peak strain (B4)', '78 µε') + stat('Status', 'COMPLETE'))}
        ${card('Experiment Queue', `<p>EX-015 · rear torsion sweep<br>EX-016 · curb impact pulse 15 g<br>EX-017 · thermal cycling with strain compensation validation</p>`)}
        ${card('Result Export', `<p>Auto-generated PDF + JSON reports, synced to the asset <b>Passport</b> on completion.</p>`)}
      </div>
    `,
    analytics: `
      <h2>Signal Analytics</h2>
      <div class="lead">Edge-computed features and twin-side analytics for EV-CH-007.</div>
      <div class="ph-grid">
        ${card('Live Feature Stream', stat('Span', '00:40 s · 1 Hz twin sync') + stat('Packets', '40 / 40') + stat('Sample drop', '0.0 %'))}
        ${card('Channel Coverage', `<div class="mode-row" style="margin-top:6px">${['STRAIN ×4', 'IMU ×2', 'LOAD ×1', 'TEMP ×1', 'DISP ×1', 'EDGE ×1'].map(x => `<span class="mini-chip" style="padding:3px 8px;border:1px solid var(--line);border-radius:20px;color:var(--text-dim)">${x}</span>`).join('')}</div>`)}
      </div>
    `,
    passport: `
      <h2>Structural Digital Passport</h2>
      <div class="lead">The permanent, tamper-evident engineering record for asset EV-CH-007.</div>
      <div class="ph-grid">
        ${card('Asset Identity', stat('Chassis ID', 'EV-CH-007') + stat('Build type', '1:4 instrumented prototype') + stat('Baseline version', 'BL-2026-09-12') + stat('Sensor config', 'SG01–SG04 · IMU01/02 · LC01 · TEMP01 · DISP01 · EDGE'))}
        ${card('Calibration Register', stat('SG04 calibration', 'VALID · 2026-09-11') + stat('IMU02 calibration', 'VALID · 2026-09-10') + stat('LC01 calibration', 'VALID · 2026-09-09') + stat('HX711 conditioning', 'Valid · gain 128'))}
        ${card('Event History', `<div class="pt-line">
          <div class="pt-item"><div class="pt-d">2026-09-12</div><div class="pt-t">Baseline stored</div><div class="pt-s">BL-2026-09-12 · 40 s reference window</div></div>
          <div class="pt-item"><div class="pt-d">2026-09-14</div><div class="pt-t">EX-014 battery inertial</div><div class="pt-s">Peak strain B4 78 µε · PASS</div></div>
          <div class="pt-item"><div class="pt-d">2026-09-18</div><div class="pt-t">Rear mount re-torque</div><div class="pt-s">B3/B4 shim check · verified</div></div>
          <div class="pt-item"><div class="pt-d">2026-09-20</div><div class="pt-t">Rebaseline proposed</div><div class="pt-s">Awaiting B4 residual review</div></div>
        </div>`, '')}
      </div>
    `,
    alerts: `
      <h2>Operational Alerts</h2>
      <div class="lead">Health-driven notifications from the structural and hardware twins.</div>
      <div class="ph-grid">
        ${card('Active Alert', stat('Source', 'SG02 channel fault') + stat('Severity', 'INFO · sensor excluded') + stat('Impact', 'B2 not assessed — no structural flag', '') + stat('Action', 'Verify HX711 channel wiring', ''))}
        ${card('Recent', `<div class="pt-line">
          <div class="pt-item"><div class="pt-d">2026-09-20 09:12</div><div class="pt-t">SG02 OFFLINE</div><div class="pt-s">strain_2 no valid frames · excluded</div></div>
          <div class="pt-item"><div class="pt-d">2026-09-19 16:40</div><div class="pt-t">B4 residual watch</div><div class="pt-s">+26 µε across 2 windows · monitor</div></div>
        </div>`, '')}
      </div>
    `,
  };

  page.innerHTML = content[kind] || `<h2>${kind}</h2><div class="lead">Coming soon.</div>`;
  return page;
}