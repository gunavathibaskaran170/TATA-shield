/* SHIELD — Anatomy page probe (headless) */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

  await page.evaluate(() => window.SHIELD.goto('anatomy'));
  await page.waitForFunction(() => !!window.__AN, { timeout: 20000 });
  await sleep(2600);

  const probe = await page.evaluate(() => {
    const out = {};
    out.hasTW = !!window.__AN;
    out.layers = window.__AN.layers();
    out.callouts = window.__AN.callouts();

    // all poster canvases sized?
    out.canvases = [...document.querySelectorAll('.anatomy canvas')].map(c => {
      const r = c.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    });

    // callout leader coords valid?
    const lines = [...document.querySelectorAll('#an-svg line')];
    out.leaders = lines.map(l => ({
      x1: l.getAttribute('x1'), y1: l.getAttribute('y1'),
      x2: (+l.getAttribute('x2')).toFixed(0), y2: (+l.getAttribute('y2')).toFixed(0),
    }));
    out.leadersNaN = lines.some(l => isNaN(+l.getAttribute('x2')) || +l.getAttribute('x2') < 0
      || +l.getAttribute('x2') > 1400);

    // layer label placement
    out.layerLabels = [...document.querySelectorAll('.lyl')].map(el => {
      const r = el.getBoundingClientRect();
      return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width) };
    });

    // zone labels
    out.zoneLabels = [...document.querySelectorAll('.zyl')].map(el => {
      const r = el.getBoundingClientRect();
      return { l: Math.round(r.left), t: Math.round(r.top) };
    });

    // legend clipping check
    out.legendOverflow = [...document.querySelectorAll('.po-card')].map(c =>
      `${c.scrollHeight}>${c.clientHeight}?${c.scrollHeight > c.clientHeight + 1}`);

    // nav order
    out.nav = [...document.querySelectorAll('.nav-item')].map(b => b.textContent.trim());

    // dimension chips present
    out.dims = {
      pdh: document.querySelectorAll('.pd-h').length,
      pdv: document.querySelectorAll('.pd-v').length,
    };

    // grid geometry
    const g = document.querySelector('.po-grid').getBoundingClientRect();
    const hero = document.querySelector('.po-hero').getBoundingClientRect();
    out.grid = { w: Math.round(g.width), h: Math.round(g.height) };
    out.hero = { w: Math.round(hero.width), h: Math.round(hero.height) };
    return out;
  });

  console.log(JSON.stringify(probe, null, 2));
  console.log('\nErrors: ' + (errors.length ? '\n  ' + errors.join('\n  ') : 'none'));
  await browser.close();
})().catch(e => { console.error('PROBE FAILED:', e); process.exit(1); });
