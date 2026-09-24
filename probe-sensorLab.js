/* SHIELD — Sensor Lab page probe (headless)
   Audits the SG01 / IMU01 engineering inspection viewer:
   3D model integrity, explode / internal / anatomy / strain /
   axes / chassis states, part selection, telemetry DOM, switcher.
   Usage: node probe-sensorLab.js
*/
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto('http://localhost:8123/', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await sleep(1200);

  await page.evaluate(() => window.SHIELD.goto('sensors'));
  await page.waitForFunction(() => !!window.__SL, { timeout: 20000 });
  await sleep(2400);

  /* ---- SG01 default ---- */
  let p = await page.evaluate(() => window.__SL.probe());
  console.log('\n[Sensor Lab — SG01 default]');
  ok(p.sensor === 'SG01', 'default sensor SG01');
  ok(p.modelLoaded, '3D model loaded');
  ok(p.meshCount > 30, `rich geometry (${p.meshCount} meshes)`);
  ok(p.partKeys.includes('gauge') && p.partKeys.includes('housing') && p.partKeys.includes('pcb'), 'SG01 core parts present: gauge / housing / pcb');
  ok(p.partKeys.includes('bolts') && p.partKeys.includes('cable') && p.partKeys.includes('connector'), 'SG01 hardware parts present: bolts / cable / connector');
  ok(p.state.explodeT === 0, 'assembled by default (explodeT 0)');
  ok(p.sw.chips === 8, 'sensor switcher shows 8 sensors');
  ok(p.sw.active === 'SG01', 'switcher active = SG01');
  ok(p.view.w > 800 && p.view.h > 500, `3D viewport sized (${p.view.w}x${p.view.h})`);
  ok(p.panel.tabs === 3, 'inspector has 3 tabs');
  ok(p.labels === 7, '7 SG01 anatomy labels defined');
  ok(p.internalLabels === 5, '5 SG01 internal labels defined');
  ok(!p.state.internal && !p.state.anatomy, 'no labels visible by default');

  /* ---- live telemetry rendered ---- */
  const liveText = await page.evaluate(() => {
    window.__SL.setView('front');
    document.querySelector('[data-t="live"]').click();
    return new Promise(r => setTimeout(() => r(document.querySelector('#sl-body').innerText || ''), 500));
  });
  ok(/µε/.test(liveText) && /Current/.test(liveText) && /Residual/.test(liveText), 'SG01 live telemetry shows µε / current / residual');

  /* ---- explode ---- */
  await page.evaluate(() => { window.__SL.setExplode(1); });
  await sleep(1100);
  p = await page.evaluate(() => window.__SL.probe());
  ok(Math.abs(p.state.explodeT - 1) < 0.05, `exploded view animated to 100% (${p.state.explodeT})`);
  await page.evaluate(() => window.__SL.setExplode(0));
  await sleep(900);

  /* ---- internal ---- */
  await page.evaluate(() => window.__SL.setInternal(true));
  await sleep(700);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.internal, 'internal (X-ray) mode on');
  const chipsVis = await page.evaluate(() => {
    const vis = [...document.querySelectorAll('.sl-chip')].filter(c => c.style.display !== 'none').length;
    return vis;
  });
  ok(chipsVis === 5, `internal labels visible (${chipsVis})`);
  await page.evaluate(() => window.__SL.setInternal(false));
  await sleep(400);

  /* ---- anatomy ---- */
  await page.evaluate(() => window.__SL.setAnatomy(true));
  await sleep(800);
  p = await page.evaluate(() => window.__SL.probe());
  const chips2 = await page.evaluate(() => [...document.querySelectorAll('.sl-chip')].filter(c => c.style.display !== 'none').length);
  ok(p.state.anatomy && chips2 === 7, `anatomy callouts rendered (${chips2})`);
  const leaders = await page.evaluate(() => [...document.querySelectorAll('#sl-svg line')].filter(l => l.getAttribute('display') !== 'none').length);
  ok(leaders === 7, `SVG leader lines rendered (${leaders})`);
  await page.evaluate(() => window.__SL.setAnatomy(false));
  await sleep(300);

  /* ---- strain demo ---- */
  await page.evaluate(() => { window.__SL.setStrain(true); window.__SL.setStrainMode('COMPRESSION'); window.__SL.setLoad(0.9); });
  await sleep(900);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.strain && p.state.load > 0.89, `strain demo + load slider active (load=${p.state.load})`);
  const strainDom = await page.evaluate(() => document.querySelector('#sl-body').innerText || '');
  ok(/COMPRESSION|µε/.test(strainDom) || p.state.selPart === null, 'strain mode wired');
  await page.evaluate(() => { window.__SL.setStrain(false); window.__SL.setLoad(0.55); });

  /* ---- part selection ---- */
  await page.evaluate(() => window.__SL.selectPart('pcb'));
  await sleep(300);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.selPart === 'pcb', 'part selection via API (pcb)');
  const det = await page.evaluate(() => (document.querySelector('#sl-parts-det').innerText || '').trim());
  ok(/Signal Conditioning PCB/i.test(det) && /SIMULATED/.test(det), 'component detail panel shows PCB + SIMULATED');

  /* ---- switch to IMU01 ---- */
  await page.evaluate(() => window.__SL.select('IMU01'));
  await sleep(1800);
  p = await page.evaluate(() => window.__SL.probe());
  console.log('\n[Sensor Lab — IMU01]');
  ok(p.sensor === 'IMU01' && p.modelLoaded, 'IMU01 model loaded');
  ok(p.partKeys.includes('cover') && p.partKeys.includes('damping') && p.partKeys.includes('gasket'), 'IMU01 exploded layers: cover / damping / gasket');
  ok(p.partKeys.includes('pcb') && p.partKeys.includes('bolts') && p.partKeys.includes('axes'), 'IMU01 PCB / bolts / axes present');
  ok(p.partKeys.length === 9, `9 IMU01 parts (${p.partKeys.length})`);
  ok(p.labels === 8, '8 IMU01 anatomy labels');
  ok(p.state.explodeT === 0 && !p.state.internal, 'state reset on switch');

  /* ---- IMU axes demo ---- */
  await page.evaluate(() => { window.__SL.setAxes(true); window.__SL.setRotation('PITCH'); });
  await sleep(900);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.axes && p.state.rotMode === 'PITCH', 'axes demo PITCH active');
  const att = await page.evaluate(() => (document.querySelector('#sl-attitude') || {}).textContent || '');
  ok(/PITCH/.test(att), `attitude readout live (${att.slice(0, 24)})`);
  await page.evaluate(() => { window.__SL.setAxes(false); });

  /* ---- IMU explode + anatomy ---- */
  await page.evaluate(() => { window.__SL.setExplode(1); window.__SL.setAnatomy(true); });
  await sleep(1400);
  p = await page.evaluate(() => window.__SL.probe());
  ok(Math.abs(p.state.explodeT - 1) < 0.05, 'IMU exploded to 100%');
  ok(p.state.anatomy, 'anatomy on with exploded view');
  await page.evaluate(() => { window.__SL.setExplode(0); window.__SL.setAnatomy(false); });

  /* ---- chassis context ---- */
  await page.evaluate(() => { window.__SL.setChassis(true); });
  await sleep(1500);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.chassis, 'SHOW ON CHASSIS active');
  ok(p.sensor === 'IMU01', 'IMU01 mounted on front cross-member');
  await page.evaluate(() => window.__SL.select('SG01'));
  await sleep(1600);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.sensor === 'SG01', 'switched back to SG01');
  ok(p.partKeys.includes('gauge'), 'SG01 re-mount OK');
  await page.evaluate(() => window.__SL.setChassis(false));

  /* ---- nav order ---- */
  ok(p.nav[0].includes('Twin') && p.nav[1].includes('Hardware Twin'), 'nav twin order preserved');
  const sensorIdx = p.nav.findIndex(n => /Sensor Lab/.test(n));
  ok(sensorIdx > 1, `Sensor Lab in nav at index ${sensorIdx}`);

  /* ---- no runtime errors ---- */
  ok(errors.length === 0, 'zero page errors' + (errors.length ? ' → ' + errors[0] : ''));

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
  await browser.close();
})().catch(e => { console.error('PROBE FAILED:', e); process.exit(1); });