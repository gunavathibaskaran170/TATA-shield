/* SHIELD — monocoque chassis geometry probe
   Verifies the redesigned chassis body parts are present, positioned
   and sized as designed, wheels/suspension anchors unchanged,
   region groups intact, and the whole assembly bounds sane.
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
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => !!window.__TW && !!window.__LAST_CHASSIS__, { timeout: 20000 });
  await sleep(1500);

  const s = await page.evaluate(() => {
    const { group, regionGroups } = window.__LAST_CHASSIS__;
    const out = { names: Object.create(null), regions: [], mins: [1e9, 1e9, 1e9], maxs: [-1e9, -1e9, -1e9] };
    group.traverse(o => {
      if (o.isMesh) {
        try {
          const n = o.name || '(unnamed)';
          const entry = out.names[n] || (out.names[n] = { count: 0, pos: [], size: [] });
          entry.count++;
          entry.pos.push([+o.position.x.toFixed(3), +o.position.y.toFixed(3), +o.position.z.toFixed(3)]);
          const p = o.geometry && o.geometry.parameters;
          if (p && p.width !== undefined && p.depth !== undefined) {
            entry.size.push([+p.width.toFixed(3), +p.height.toFixed(3), +p.depth.toFixed(3)]);
          }
          const unrot = !o.rotation.x && !o.rotation.y && !o.rotation.z;
          if (p && p.width !== undefined && unrot) {
            out.mins[0] = Math.min(out.mins[0], o.position.x - p.width / 2);
            out.mins[1] = Math.min(out.mins[1], o.position.y - p.height / 2);
            out.mins[2] = Math.min(out.mins[2], o.position.z - p.depth / 2);
            out.maxs[0] = Math.max(out.maxs[0], o.position.x + p.width / 2);
            out.maxs[1] = Math.max(out.maxs[1], o.position.y + p.height / 2);
            out.maxs[2] = Math.max(out.maxs[2], o.position.z + p.depth / 2);
          }
        } catch (err) {
          out.fail = out.fail || [];
          out.fail.push({ name: o.name, type: o.type, geom: o.geometry && o.geometry.type, msg: String(err && err.message) });
        }
      }
    });
    out.regions = Object.keys(regionGroups);
    out.c1Top = 0; out.c1X = 0;
    const c1 = regionGroups['C1'];
    if (c1) {
      c1.traverse(o => {
        if (o.isMesh && o.geometry && o.geometry.parameters && o.geometry.parameters.width !== undefined && !o.rotation.x && !o.rotation.y && !o.rotation.z) {
          out.c1Top = Math.max(out.c1Top, o.position.y + o.geometry.parameters.height / 2);
          out.c1X = Math.max(out.c1X, Math.abs(o.position.x) + o.geometry.parameters.width / 2);
        }
      });
    }
    // wheels: direct children of root, positioned at the corners
    out.wheels = group.children.filter(c => c.type === 'Group' && Math.abs(c.position.x) > 0.1)
      .map(c => [+c.position.x.toFixed(3), +c.position.y.toFixed(3), +c.position.z.toFixed(3)]);
    return out;
  });

  s.bounds = [[s.mins[0], s.mins[1], s.mins[2]], [s.maxs[0], s.maxs[1], s.maxs[2]]];
  console.log('--- probe failures:', JSON.stringify(s.fail || []));
  console.log('--- region groups:', s.regions.join(', '));
  console.log('--- box-only bounds (approx, excl. wheels):', JSON.stringify(s.bounds));
  console.log('--- C1 shell top y / max |x|:', s.c1Top, s.c1X);
  console.log('--- wheel positions:', JSON.stringify(s.wheels));

  const N = name => (s.names[name] || { count: 0 }).count;
  const P = name => (s.names[name] || { pos: [] }).pos;

  ok('region groups all present', ['B1','B2','B3','B4','F1','C1','R1'].every(r => s.regions.includes(r)), s.regions.join(','));
  ok('2 shell walls at ±0.088', N('shell-wall') === 2 && P('shell-wall').every(p => Math.abs(Math.abs(p[0]) - 0.088) < 0.001 && p[1] === 0.025));
  ok('2 shell caps on top of walls', N('shell-cap') === 2 && P('shell-cap').every(p => Math.abs(p[1] - 0.0435) < 0.001));
  ok('10 sill brackets tie walls to rails', N('sill-bracket') === 10);
  ok('2 upper frame rails at ±0.062 y0.068', N('upper-rail') === 2 && P('upper-rail').every(p => Math.abs(Math.abs(p[0]) - 0.062) < 0.001 && p[1] === 0.068));
  ok('2 upper head rails at z ±0.185', N('upper-head') === 2 && P('upper-head').every(p => Math.abs(Math.abs(p[2]) - 0.185) < 0.001 && p[1] === 0.068));
  ok('2 bumpers at z ±0.268 (400/200 shell plus crash)', N('bumper') === 2 && P('bumper').every(p => Math.abs(Math.abs(p[2]) - 0.268) < 0.001));
  ok('2 deck panels over end bays', N('deck') === 2 && P('deck').every(p => Math.abs(p[1] - 0.052) < 0.001));
  ok('2 bulkhead cross-walls at z ±0.198', N('bulkhead') === 2 && P('bulkhead').every(p => Math.abs(Math.abs(p[2]) - 0.198) < 0.001));
  ok('4 crash pods per... 8 total bulge cylinders (bumper crash pods)', N('(unnamed)') >= 8);
  ok('battery housing transparent mesh', N('battery-housing') === 1 && P('battery-housing')[0][1] === 0.028);
  ok('battery bezel rim present', N('battery-bezel') === 1 && P('battery-bezel')[0][1] === 0.052);
  ok('5 floor ribs + floor plate', N('floor') === 1 && N('floor-rib') === 5);
  ok('2 mid-braces under battery', N('mid-brace') === 2);
  ok('3 cross members', N('cross') === 3);
  ok('rails kept: flange at ±0.105 y0.045', N('rail-flange') === 2 && P('rail-flange').every(p => Math.abs(Math.abs(p[0]) - 0.105) < 0.001 && p[1] === 0.045));
  ok('4 wheel assemblies in place', s.wheels.length === 4 &&
    s.wheels.every(w => Math.abs(Math.abs(w[0]) - 0.152) < 0.001 && Math.abs(w[1] - 0.047) < 0.001 && Math.abs(Math.abs(w[2]) - 0.205) < 0.001), JSON.stringify(s.wheels));
  ok('overall bounds sane (stage ±0.45/±0.33, upper frame to 0.078)', Math.abs(s.bounds[0][0]) <= 0.46 && Math.abs(s.bounds[1][0]) <= 0.46 && s.bounds[1][1] >= 0.07 && s.bounds[1][1] <= 0.15 && Math.abs(s.bounds[1][2]) <= 0.34, JSON.stringify(s.bounds));
  ok('C1 shell reaches y≈0.078 (upper frame)', s.c1Top >= 0.07, 'top=' + s.c1Top);
  ok('no browser errors', errors.length === 0, errors.join(' | '));

  console.log(passed + ' passed / ' + failed + ' failed');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();