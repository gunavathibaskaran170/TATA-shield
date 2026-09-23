/* SHIELD — acceptance analytics for rendered frames.
   Loads each screenshot PNG in a headless browser and measures:
   - vehicle presence (non-background pixel density in the 3D centre)
   - label/signal brightness (high-luminance pixels)
   - right inspector panel + bottom strip rendering
   - frame not blank
*/
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const shots = fs.readdirSync(path.join(__dirname, 'shots')).filter(f => f.endsWith('.png')).sort();

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });

  const results = await page.evaluate(async (files) => {
    const out = [];
    for (const f of files) {
      const resp = await fetch('/shots/' + f);
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);
      const c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const W = c.width, H = c.height;

      let centerNonBg = 0, centerCount = 0, bright = 0, panelCount = 0, stripCount = 0, panelPix = 0, stripPix = 0;
      const cx = W / 2, cy = H / 2;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const isBg = Math.abs(r - 7) < 6 && Math.abs(g - 11) < 6 && Math.abs(b - 18) < 6;
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy < 170 * 170) {
            centerCount++;
            if (!isBg) centerNonBg++;
          }
          if (lum > 150) bright++;
          // right inspector area (approx)
          if (x > W - 356 && x < W - 8 && y > 90 && y < H - 90) {
            panelPix++;
            if (lum > 18 && lum < 210) panelCount++;
          }
          // bottom strip area
          if (x > 60 && x < W - 60 && y > H - 66 && y < H - 24) {
            stripPix++;
            if (lum > 18 && lum < 210) stripCount++;
          }
        }
      }
      out.push({
        file: f,
        W, H,
        centerDensity: +(centerNonBg / centerCount).toFixed(3),
        brightPct: +((bright * 100) / (W * H)).toFixed(2),
        inspectorCoverage: +((panelCount * 100) / panelPix).toFixed(1),
        stripCoverage: +((stripCount * 100) / stripPix).toFixed(1),
        verdict: (centerNonBg / centerCount) > 0.06 ? 'vehicle-ok' : 'EMPTY-CENTER',
      });
    }
    return out;
  }, shots);

  for (const r of results) {
    console.log(
      `${r.file.padEnd(26)} center=${String(r.centerDensity).padEnd(6)} bright=${String(r.brightPct).padEnd(5)}% insp=${String(r.inspectorCoverage).padEnd(5)}% strip=${String(r.stripCoverage).padEnd(5)}%  ${r.verdict}`
    );
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });