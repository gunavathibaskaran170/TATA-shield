/* SHIELD — headless render + acceptance review script
   Renders the Structural Twin (views + scenarios) and the Hardware
   Twin (inspector + filters + toggles) at 1920x1080.
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

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await sleep(2600);

  /* ============ STRUCTURAL TWIN — views ============ */
  await shot('01-twin-strain');

  const tabs = ['STRESS', 'DISPLACEMENT', 'LOAD', 'ANOMALY'];
  for (const m of tabs) {
    await page.evaluate(mode => window.__TW && window.__TW.setMode(mode), m);
    await sleep(900);
    await shot('02-twin-' + m.toLowerCase());
  }

  await page.evaluate(() => window.__TW.setTab('structure')); await sleep(900); await shot('03-twin-structure');
  await page.evaluate(() => window.__TW.setTab('xray'));       await sleep(900); await shot('04-twin-xray');
  await page.evaluate(() => window.__TW.setTab('loadpath'));   await sleep(900); await shot('05-twin-loadpath');
  await page.evaluate(() => window.__TW.setTab('sensors'));    await sleep(900); await shot('06-twin-sensors');

  /* ============ STRUCTURAL TWIN — scenarios ============ */
  await page.evaluate(() => window.__TW.setTab('strain'));
  const scen = ['HIGH', 'UNEVEN', 'VIBRATION', 'SHOCK', 'CHANGE', 'FAULT'];
  for (const s of scen) {
    await page.evaluate(name => window.__TW.setScenario(name), s);
    await sleep(1000);
    await shot('07-twin-' + s.toLowerCase());
  }
  await page.evaluate(() => { window.__TW.setScenario('CHANGE'); window.__TW.setMode('ANOMALY'); });
  await sleep(1200);
  await shot('08-twin-anomaly-b4');

  /* ============ HARDWARE TWIN ============ */
  await page.evaluate(() => window.SHIELD.goto('hardware'));
  await page.waitForFunction(() => !!window.__HW, { timeout: 20000 });
  await sleep(1600);
  await shot('20-hw-default');

  await page.evaluate(() => window.__HW.select('SG04'));
  await sleep(700);
  await shot('21-hw-sg04-live');

  await page.evaluate(() => window.__HW.setTab('info'));
  await sleep(400);
  await shot('22-hw-sg04-info');

  await page.evaluate(() => window.__HW.select('IMU01'));
  await sleep(500);
  await shot('23-hw-imu01');

  await page.evaluate(() => window.__HW.select('LC01'));
  await sleep(400);
  await shot('24-hw-lc01');

  await page.evaluate(() => window.__HW.select('EDGE1'));
  await sleep(400);
  await shot('25-hw-edge-node');

  await page.evaluate(() => { window.__HW.select(null); window.__HW.toggle('signal'); });
  await sleep(1200);
  await shot('26-hw-signal-path');

  await page.evaluate(() => window.__HW.toggle('map'));
  await sleep(1200);
  await shot('27-hw-digital-mapping');

  await page.evaluate(() => window.__HW.toggle('explode'));
  await sleep(1800);
  await shot('28-hw-exploded');

  await page.evaluate(() => { window.__HW.toggle('explode'); window.__HW.toggle('map'); window.__HW.toggle('signal'); });
  await sleep(1400);

  await page.evaluate(() => window.__HW.setLayer('strain'));
  await sleep(700);
  await shot('29-hw-layer-strain');

  await page.evaluate(() => { window.__HW.setLayer('ALL'); window.__HW.setZone('BATTERY_MOUNTS'); });
  await sleep(900);
  await shot('30-hw-zone-battery-mounts');

  await page.evaluate(() => { window.__HW.setZone(null); window.__HW.select('DISP01'); });
  await sleep(600);
  await shot('31-hw-disp01');

  await page.evaluate(() => window.__HW.select(null));
  await sleep(500);
  await shot('32-hw-summary');

  /* ============ EV CHASSIS 3D ANATOMY ============ */
  await page.evaluate(() => window.SHIELD.goto('anatomy'));
  await page.waitForFunction(() => !!window.__AN, { timeout: 20000 });
  await sleep(2200);
  await shot('40-anatomy-poster');
  await page.evaluate(() => window.__AN.redraw());
  await sleep(500);
  await shot('41-anatomy-redraw');

  /* ============ EV CHASSIS WHEEL ASSEMBLY ============ */
  await page.evaluate(() => window.SHIELD.goto('wheel'));
  await page.waitForFunction(() => !!window.__WH, { timeout: 20000 });
  await sleep(2600);
  await shot('50-wheel-poster');
  await page.evaluate(() => window.__WH.redraw());
  await sleep(500);
  await shot('51-wheel-redraw');

  console.log('\nBrowser errors:');
  if (errors.length === 0) console.log('  ✓ none');
  else errors.slice(0, 20).forEach(e => console.log('  ✗ ' + e));

  await browser.close();
})().catch(e => { console.error('RENDER FAILED:', e); process.exit(1); });