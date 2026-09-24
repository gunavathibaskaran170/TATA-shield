/* SHIELD — Wheel Assembly poster probe (headless) */
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

  await page.evaluate(() => window.SHIELD.goto('wheel'));
  await page.waitForFunction(() => !!window.__WH, { timeout: 20000 });
  await sleep(2600);

  const probe = await page.evaluate(() => {
    const out = {};
    out.hasWH = !!window.__WH;
    out.callouts = window.__WH.callouts();
    out.measures = window.__WH.measures();
    out.exploded = window.__WH.exploded();

    // all poster canvases sized?
    out.canvases = [...document.querySelectorAll('.wheel canvas')].map(c => {
      const r = c.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    });

    // hero leader coords valid?
    const lines = [...document.querySelectorAll('#wh-svg line')];
    out.leaders = lines.length;
    out.leadersNaN = lines.some(l => isNaN(+l.getAttribute('x2')) || +l.getAttribute('x2') < 0
      || +l.getAttribute('x2') > 1400);

    // exploded chips within panel?
    const panel = document.querySelector('.wa-ex').getBoundingClientRect();
    out.exLabels = [...document.querySelectorAll('.wxl')].map(el => {
      const r = el.getBoundingClientRect();
      return {
        l: Math.round(r.left - panel.left), t: Math.round(r.top - panel.top),
        inside: r.left >= panel.left - 1 && r.right <= panel.right + 1
          && r.top >= panel.top - 1 && r.bottom <= panel.bottom + 1,
      };
    });

    // exploded leaders valid?
    const exLines = [...document.querySelectorAll('.wa-ex mv-svg line, .wa-ex .mv-svg line')];
    out.exLeaders = exLines.length;
    out.exLeadersNaN = exLines.some(l => isNaN(+l.getAttribute('x2')));

    // key-measure table fits?
    const km = document.querySelector('.wa-km');
    out.kmOverflow = `${km.scrollHeight}>${km.clientHeight}?${km.scrollHeight > km.clientHeight + 1}`;

    // dim chips
    out.dims = {
      pdh: document.querySelectorAll('.wheel .pd-h').length,
      pdv: document.querySelectorAll('.wheel .pd-v').length,
      bpCaps: document.querySelectorAll('.bp-cap').length,
    };

    // hero callout chips not overlapping (rough): all within hero?
    const hero = document.querySelector('.wa-hero').getBoundingClientRect();
    out.coChips = [...document.querySelectorAll('#wh-co .co')].map(el => {
      const r = el.getBoundingClientRect();
      return r.left >= hero.left - 1 && r.right <= hero.right + 1
        && r.top >= hero.top - 1 && r.bottom <= hero.bottom + 1;
    });

    // nav order
    out.nav = [...document.querySelectorAll('.nav-item')].map(b => b.textContent.trim());
    out.note = (document.querySelector('.wa-note') || {}).textContent?.trim().slice(0, 60);
    return out;
  });

  console.log(JSON.stringify(probe, null, 2));
  console.log('\nErrors: ' + (errors.length ? '\n  ' + errors.join('\n  ') : 'none'));
  await browser.close();
})().catch(e => { console.error('PROBE FAILED:', e); process.exit(1); });
