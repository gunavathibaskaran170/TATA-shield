/* SHIELD — runtime mechanics QA (events static screenshots can't prove)
   Verifies: digital-mapping pulses animate, exploded instrumentation
   changes battery opacity / sensor scale / camera distance.
   Usage: node check-mechanics.js   (requires server.js running)
*/
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8123/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let passed = 0, failed = 0;
const ok = (name, cond, detail) => {
  console.log((cond ? '  \u2713 ' : '  \u2717 ') + name + (cond ? '' : '  [' + detail + ']'));
  cond ? passed++ : failed++;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await sleep(2000);

  // ---- navigate to Hardware Twin ----
  await page.evaluate(() => window.SHIELD.goto('hardware'));
  await page.waitForFunction(() => !!window.__HW, { timeout: 20000 });
  await sleep(1800);

  const probe = () => page.evaluate(() => window.__HW.probe());

  // baseline
  let p = await probe();
  ok('baseline: explodeT = 0', p.explodeT === 0, JSON.stringify(p));
  ok('baseline: battery opacity ~0.52', Math.abs(p.batteryOpacity - 0.52) < 0.06, p.batteryOpacity);
  ok('baseline: sensor scale ~1.0', Math.abs(p.sensorScale - 1.0) < 0.08, p.sensorScale);

  // ---- digital mapping animation ----
  await page.evaluate(() => window.__HW.toggle('map'));
  await sleep(500);
  p = await probe();
  ok('map mode: map lines visible', p.mapVisible === true, JSON.stringify(p.mapVisible));
  const dotsA = JSON.stringify(p.mapPulse.dots);
  await sleep(500);
  p = await probe();
  const dotsB = JSON.stringify(p.mapPulse.dots);
  ok('map mode: pulses animated (positions advance)', dotsA !== dotsB, dotsA + ' vs ' + dotsB);
  ok('map mode: map pulse dots exist', p.mapPulse.dots.length >= 2, p.mapPulse.dots.length);

  // ---- exploded instrumentation ----
  await page.evaluate(() => window.__HW.toggle('explode'));
  await sleep(2600); // damping + flyTo settle
  p = await probe();
  ok('explode: damped t ramps to ~1', Math.abs(p.explodeT - 1) < 0.15, p.explodeT);
  ok('explode: battery more transparent (≤0.25)', p.batteryOpacity <= 0.25, p.batteryOpacity);
  ok('explode: sensors scaled up (~1.3)', Math.abs(p.sensorScale - 1.3) < 0.15, p.sensorScale);
  const home = [0.66, 0.50, 0.64], ex = [0.74, 0.58, 0.72];
  const dHome = Math.hypot(...home.map((v, i) => v - p.camPos[i]));
  const dEx = Math.hypot(...ex.map((v, i) => v - p.camPos[i]));
  ok('explode: camera pulled out toward 0.74,0.58,0.72', dEx < 0.22 && dEx < dHome,
    'dEx=' + dEx.toFixed(3) + ' dHome=' + dHome.toFixed(3));

  // ---- reset back ----
  await page.evaluate(() => { window.__HW.toggle('explode'); window.__HW.toggle('map'); });
  await sleep(2200);
  p = await probe();
  ok('reset: explodeT back to 0', p.explodeT < 0.1, p.explodeT);
  ok('reset: camera back to home position', Math.hypot(...home.map((v, i) => v - p.camPos[i])) < 0.12, p.camPos);

  console.log('\nRuntime errors:');
  if (errors.length === 0) console.log('  \u2713 none');
  else errors.slice(0, 10).forEach(e => console.log('  \u2717 ' + e));

  console.log(`\nRESULT: ${passed} passed / ${failed} failed`);
  await browser.close();
  process.exit(failed === 0 && errors.length === 0 ? 0 : 1);
})().catch(e => { console.error('MECHANICS QA FAILED:', e); process.exit(1); });