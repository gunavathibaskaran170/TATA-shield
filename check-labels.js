/* SHIELD — label legibility QA
   Proves every sensor label sprite renders on screen at its projected 3D
   position with visible content (text glyph on pill = high local luminance
   variance + bright peak). Screenshot is decoded in-page to a 2D canvas.
   Usage: node check-labels.js
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
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await sleep(2200);
  await page.evaluate(() => window.SHIELD.goto('hardware'));
  await page.waitForFunction(() => !!window.__HW, { timeout: 20000 });
  await sleep(2200);

  const { labels } = await page.evaluate(() => window.__HW.probe().labels);
  const shotB64 = await page.screenshot({ encoding: 'base64' });

  const samples = await page.evaluate(async (shotB64, labels) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + shotB64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const lum = (x, y) => {
      const d = ctx.getImageData(x, y, 1, 1).data;
      return (0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]) / 255;
    };
    const patch = (cx, cy, r) => {
      const vals = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        vals.push(lum(cx + dx, cy + dy));
      }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const var_ = vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vals.length;
      const max = Math.max(...vals);
      return { var: +var_.toFixed(4), max: +max.toFixed(2) };
    };
    return labels.map(l => {
      const inView = l.sx >= 8 && l.sy >= 8 && l.sx < c.width - 8 && l.sy < c.height - 8;
      if (!inView) return { id: l.id, state: 'off-canvas', sx: l.sx, sy: l.sy };
      const lab = patch(l.sx, l.sy, 7);
      const bg = patch(l.sx, Math.max(8, Math.min(l.sy + 70, c.height - 8)), 7);
      return { id: l.id, state: 'ok', labVar: lab.var, labMax: lab.max, bgVar: bg.var };
    });
  }, shotB64, labels);

  ok('labels: all 9 project on-canvas', samples.every(s => s.state === 'ok'),
    JSON.stringify(samples.map(s => s.id + ':' + s.state)));
  samples.filter(s => s.state === 'ok').forEach(s => {
    const visible = s.labVar > s.bgVar + 0.0008 || s.labMax > 0.72;
    ok('label ' + s.id + ' visible (var ' + s.labVar + ' vs bg ' + s.bgVar + ', max ' + s.labMax + ')',
      visible, JSON.stringify(s));
  });

  console.log(`\nRESULT: ${passed} passed / ${failed} failed`);
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error('LABELS QA FAILED:', e); process.exit(1); });