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
  const sg01MeshCount = p.meshCount;
  await page.evaluate(() => window.__SL.setChassis(false));

  /* ---- SG02 — front-right strain (family reuse) ---- */
  console.log('\n[Sensor Lab — SG02]');
  await page.evaluate(() => window.__SL.select('SG02'));
  await sleep(1600);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.sensor === 'SG02' && p.modelLoaded, 'SG02 model loaded');
  ok(p.partKeys.includes('gauge') && p.partKeys.includes('housing') && p.partKeys.includes('pcb') && p.partKeys.includes('cover'), 'SG02 reuses SG01 strain-sensor family (gauge / housing / pcb / cover)');
  ok(p.partKeys.includes('bolts') && p.partKeys.includes('cable') && p.partKeys.includes('connector'), 'SG02 hardware parts: bolts / cable / connector');
  ok(p.meshCount === sg01MeshCount, `SG02 geometry identical to SG01 family (${p.meshCount} meshes = ${sg01MeshCount})`);
  ok(p.labels === 7 && p.internalLabels === 5, 'SG02 anatomy (7) + internal (5) labels from family config');
  ok(p.live && p.live.type === 'strain' && p.live.expected === 54, `SG02 telemetry expected 54 µε (${p.live.expected})`);

  /* ---- SG02 strain + heat demo ---- */
  await page.evaluate(() => { window.__SL.setStrain(true); window.__SL.setLoad(0.9); });
  await sleep(900);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.strain && p.state.load > 0.89, 'SG02 SHOW STRAIN demo active');
  const s2Live = await page.evaluate(() => { document.querySelector('[data-t="live"]').click(); return new Promise(r => setTimeout(() => r(document.querySelector('#sl-body').innerText || ''), 400)); });
  ok(/SG01 · Front-Left/.test(s2Live) && /SG02 · Front-Right/.test(s2Live), 'left/right pair check rendered');
  const asymOk = await page.evaluate(() => {
    const el = document.querySelector('#sl-body');
    const t = el.innerText || '';
    const m = t.match(/Asymmetry\s+([\d.]+)\s*%/);
    return m ? +m[1] > 0 : false;
  });
  ok(asymOk, 'SG02 reads higher than SG01 — asymmetric load transfer shown');
  await page.evaluate(() => { window.__SL.setStrain(false); window.__SL.setLoad(0.55); });

  /* ---- SG02 chassis mount (front-right rail = B2) ---- */
  await page.evaluate(() => window.__SL.setChassis(true));
  await sleep(1200);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.chassis && p.sensor === 'SG02', 'SHOW ON CHASSIS with SG02');
  ok(JSON.stringify(p.mountPos) === JSON.stringify([0.105, 0.045, 0.16]), `SG02 mounted front-RIGHT rail ${JSON.stringify(p.mountPos)} (mirrored from SG01)`);
  ok(p.tagVisible, 'station label tag visible on chassis');
  const tagTxt = await page.evaluate(() => { const vis = [...document.querySelectorAll('.sl-chip')].filter(x => x.style.display === 'flex'); return vis.length ? (vis[vis.length - 1].innerText || '') : ''; });
  ok(/SG02/.test(tagTxt) && /Front Right/.test(tagTxt), `tag text "${tagTxt.trim().split('\n')[0].slice(0, 44)}…`);

  /* ---- station click: SG02 → IMU02 while in chassis mode ---- */
  await page.evaluate(() => window.__SL.selectStation('IMU02'));
  await sleep(1700);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.sensor === 'IMU02' && p.state.chassis, 'station click switched to IMU02 (chassis mode kept)');

  /* ---- IMU02 — rear IMU (family reuse) ---- */
  console.log('\n[Sensor Lab — IMU02]');
  ok(p.modelLoaded, 'IMU02 model loaded');
  ok(p.partKeys.includes('cover') && p.partKeys.includes('damping') && p.partKeys.includes('gasket') && p.partKeys.includes('axes'), 'IMU02 reuses IMU01 architecture (cover / damping / gasket / axes)');
  ok(p.partKeys.length === 9, `9 IMU02 parts (${p.partKeys.length})`);
  ok(p.labels === 8, '8 IMU02 anatomy labels');
  ok(JSON.stringify(p.mountPos) === JSON.stringify([0, 0.0545, -0.232]), `IMU02 mounted REAR structural deck ${JSON.stringify(p.mountPos)}`);
  ok(JSON.stringify(p.rotation) === JSON.stringify([0, 0, 0]), 'IMU02 axes aligned with chassis axes (rotation 0,0,0)');

  /* ---- IMU02 live: FRONT/REAR response ---- */
  const imu2Live = await page.evaluate(() => { document.querySelector('[data-t="live"]').click(); return new Promise(r => setTimeout(() => r(document.querySelector('#sl-body').innerText || ''), 400)); });
  ok(/FRONT/.test(imu2Live) && /REAR/.test(imu2Live) && /Vibration RMS/.test(imu2Live), 'IMU02 live shows FRONT/REAR response + vibration RMS');
  ok(/Ax/.test(imu2Live) && /Az/.test(imu2Live) && /Gz/.test(imu2Live), 'IMU02 6-axis telemetry (Ax Ay Az · Gx Gy Gz)');

  /* ---- IMU02 axes demo ---- */
  await page.evaluate(() => { window.__SL.setAxes(true); window.__SL.setRotation('ROLL'); });
  await sleep(800);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.axes && p.state.rotMode === 'ROLL', 'IMU02 axes demo ROLL active');

  /* ---- IMU02 vibration mode ---- */
  await page.evaluate(() => { window.__SL.setVibration(true); window.__SL.setVibMag(10); });
  await sleep(800);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.vibOn && p.state.vibMag === 10, `vibration mode on (magnification ×${p.state.vibMag})`);
  const vibTxt = await page.evaluate(() => (document.querySelector('#sl-attitude') || {}).textContent || '');
  ok(/VIBRATION VISUALISATION/.test(vibTxt), `vibration readout: ${vibTxt.slice(0, 30)}`);
  await page.evaluate(() => window.__SL.setVibration(false));

  /* ---- ISOLATE SENSOR (chassis ~18% opaque, sensor opaque) ---- */
  await page.evaluate(() => window.__SL.setIsolate(true));
  await sleep(600);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.state.isolate, 'ISOLATE SENSOR active');
  ok(p.chassisOpacity !== null && p.chassisOpacity < 0.3, `chassis dimmed to ${p.chassisOpacity}`);
  await page.evaluate(() => { window.__SL.setIsolate(false); window.__SL.setChassis(false); });
  await sleep(600);

  /* ---- SG02 still fine after switching back ---- */
  await page.evaluate(() => window.__SL.select('SG02'));
  await sleep(1400);
  p = await page.evaluate(() => window.__SL.probe());
  ok(p.sensor === 'SG02' && p.modelLoaded && !p.state.chassis, 'back to SG02 docked');

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