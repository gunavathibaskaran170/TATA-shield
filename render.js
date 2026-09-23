/* SHIELD — headless render + acceptance review script
   Renders the Structural Twin and Hardware Twin pages at
   1920x1080 and exercises the Hardware Twin interaction modes.
   Usage: node render.js
*/
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8123/';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n    ' + (e.stack || '').split('\n').slice(1, 5).join('\n    ')));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  const shot = async name => {
    await page.screenshot({ path: path.join(SHOTS, name + '.png') });
    console.log('📸 ' + name);
  };
  // capture the interactive whole-page view (canvas + chrome = "the application")
  const shotFull = async name => {
    await page.screenshot({ path: path.join(SHOTS, name + '.png') });
    console.log('📸 ' + name);
  };

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await sleep(2600); // let the 3D settle
  await shotFull('01-twin-strain');

  const modes = ['STRESS', 'DEFORMATION', 'LOAD', 'ANOMALY'];
  for (const m of modes) {
    await page.evaluate(mode => window.__TW && window.__TW.setMode(mode), m);
    await sleep(900);
    await shotFull('02-twin-' + m.toLowerCase());
  }

  // ---- Hardware Twin ----
  await page.evaluate(() => window.SHIELD.goto('hardware'));
  await page.waitForFunction(() => !!window.__HW, { timeout: 20000 });
  await sleep(1600);
  await shotFull('10-hw-default');

  // SG04 inspector — LIVE DATA
  await page.evaluate(() => window.__HW.select('SG04'));
  await sleep(700);
  await shotFull('11-hw-sg04-live');

  // SG04 — COMPONENT INFO
  await page.evaluate(() => window.__HW.setTab('info'));
  await sleep(400);
  await shotFull('12-hw-sg04-info');

  // IMU01 — two-IMU transfer
  await page.evaluate(() => window.__HW.select('IMU01'));
  await sleep(500);
  await shotFull('13-hw-imu01');

  // LC01
  await page.evaluate(() => window.__HW.select('LC01'));
  await sleep(400);
  await shotFull('14-hw-lc01');

  // Edge node
  await page.evaluate(() => window.__HW.select('EDGE1'));
  await sleep(400);
  await shotFull('15-hw-edge-node');

  // Signal path
  await page.evaluate(() => { window.__HW.select(null); window.__HW.toggle('signal'); });
  await sleep(1200);
  await shotFull('16-hw-signal-path');

  // keep signal, add digital mapping
  await page.evaluate(() => window.__HW.toggle('map'));
  await sleep(1200);
  await shotFull('17-hw-digital-mapping');

  // exploded instrumentation
  await page.evaluate(() => window.__HW.toggle('explode'));
  await sleep(1800);
  await shotFull('18-hw-exploded');

  // clear modes
  await page.evaluate(() => { window.__HW.toggle('explode'); window.__HW.toggle('map'); window.__HW.toggle('signal'); });
  await sleep(1400);

  // layer filter STRAIN
  await page.evaluate(() => window.__HW.setLayer('strain'));
  await sleep(700);
  await shotFull('19-hw-layer-strain');

  // zone filter BATTERY_MOUNTS
  await page.evaluate(() => { window.__HW.setLayer('ALL'); window.__HW.setZone('BATTERY_MOUNTS'); });
  await sleep(900);
  await shotFull('20-hw-zone-battery-mounts');

  // DISP01 inspector
  await page.evaluate(() => { window.__HW.setZone(null); window.__HW.select('DISP01'); });
  await sleep(600);
  await shotFull('21-hw-disp01');

  // summary again (deselect) + SG02 offline visible
  await page.evaluate(() => window.__HW.select(null));
  await sleep(500);
  await shotFull('22-hw-summary');

  console.log('\nBrowser errors:');
  if (errors.length === 0) console.log('  ✓ none');
  else errors.slice(0, 20).forEach(e => console.log('  ✗ ' + e));

  await browser.close();
})().catch(e => { console.error('RENDER FAILED:', e); process.exit(1); });