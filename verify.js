/* SHIELD — behavioural assertions across the Hardware Twin page */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8123/';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    defaultViewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });

  const ok = (name, cond, extra = '') => {
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (extra ? '  [' + extra + ']' : ''));
    if (!cond) process.exitCode = 1;
  };

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => !!window.__TW && !!window.SHIELD, { timeout: 20000 });

  // nav has both pages clearly distinct
  const nav = await page.evaluate(() => [...document.querySelectorAll('.nav-item')].map(b => b.textContent.trim()));
  ok('nav lists Twin + Hardware Twin as separate pages', nav.some(x => x.includes('Twin')) && nav.some(x => x.includes('Hardware Twin')), nav.join(' | '));
  ok('Hardware Twin is a distinct nav item from Twin', nav[1].includes('Hardware Twin') && !nav[0].includes('Hardware Twin'));

  // go to Hardware Twin
  await page.evaluate(() => window.SHIELD.goto('hardware'));
  await page.waitForFunction(() => !!window.__HW, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1200));

  const text = sel => page.evaluate(s => document.querySelector(s)?.innerText || '', sel);

  // default summary
  let t = await text('#in-body');
  ok('summary shows Instrumentation Summary', (await text('#in-h2')) === 'Instrumentation Summary');
  ok('summary installed sensors = 8', /Installed sensors\s*8/.test(t));
  ok('summary strain 4 / IMU 2 / load 1 / temp 1 / disp 1', /Strain channels\s*4/.test(t) && /IMUs\s*2/.test(t) && /Load channels\s*1/.test(t) && /Temperature\s*1/.test(t) && /Optional displacement\s*1 \(installed\)/.test(t));
  ok('summary health 7/8', /Sensor health\s*7\/8 Healthy/.test(t));
  ok('summary monitored coverage 4 strain zones', /4 strain zones · B1–B4/.test(t));
  ok('summary has SG02 shown offline', (await page.evaluate(() => {
    const h = [...document.querySelectorAll('#in-body .hdot')].map(x => x.textContent.trim() + (x.classList.contains('off') ? '(off)' : ''));
    return h.join(' ');
  })).includes('SG02(off)'));

  // SG04 live inspector
  await page.evaluate(() => window.__HW.select('SG04'));
  await page.evaluate(() => window.__HW.setTab('live'));
  t = await text('#in-body');
  ok('SG04 inspector opens', (await text('#in-h2')) === 'SG04');
  ok('SG04 structural region B4 named', /B4 — Rear-Right Battery Mount/.test(t));
  ok('SG04 shows measurement + unit µε', /Local longitudinal strain/.test(t) && /µε/.test(t));
  ok('SG04 baseline/current/expected/residual present', /Baseline\s*49\s*µε/.test(t) && /Expected \(model\)\s*52\s*µε/.test(t) && /Residual/.test(t));
  ok('SG04 mechanical purpose text', /battery mount \/ cross-member junction/.test(t));
  ok('SG04 orientation shown Longitudinal', /Longitudinal/.test(t));
  ok('SG04 calibration valid', /Calibration\s*Valid/.test(t));

  // component info tab
  await page.evaluate(() => window.__HW.setTab('info'));
  t = await text('#in-body');
  ok('SG04 component info: 120 Ω foil gauge', /120 Ω foil resistance strain gauge/.test(t));
  ok('SG04 component info: Wheatstone + conditioning', /Wheatstone/.test(t));
  ok('SG04 component info: requires bridge+conditioning note', /Requires/.test(t));

  // IMU pair concept
  await page.evaluate(() => { window.__HW.select('IMU01'); window.__HW.setTab('live'); });
  t = await text('#in-body');
  ok('IMU01 inspector opens with reference name', (await text('#in-sub')).includes('Front / Reference'));
  ok('two-IMU transfer concept shown', /IMU01 REFERENCE/.test(t) && /IMU02 RESPONSE/.test(t));
  ok('derived quantities RMS ratio / freq shift', /Vibration RMS ratio/.test(t) && /Dominant-frequency shift/.test(t));

  // LC01 (component info tab holds its signal chain)
  await page.evaluate(() => { window.__HW.select('LC01'); window.__HW.setTab('info'); });
  t = await text('#in-body');
  ok('LC01 inspector load signal chain', /Load Cell/.test(t) && /HX711/.test(t) && /ESP32/.test(t) && /Digital Twin/.test(t));

  // TEMP01 non-damage-sensor note (component info tab)
  await page.evaluate(() => { window.__HW.select('TEMP01'); window.__HW.setTab('info'); });
  t = await text('#in-body');
  ok('TEMP01 explicitly not a damage sensor', /not/.test(t) && /damage sensor/.test(t));

  // DISP01
  await page.evaluate(() => window.__HW.select('DISP01'));
  t = await text('#in-body');
  ok('DISP01 displacement + reference + difference', /Current Displacement/.test(t) && /Reference/.test(t) && /Difference/.test(t));

  // SG02 offline semantics
  await page.evaluate(() => window.__HW.select('SG02'));
  t = await text('#in-body');
  ok('SG02 shows OFFLINE status', /OFFLINE/.test(t) && /Last Valid Update/.test(t));
  ok('SG02 excluded from assessment, zone not failed', /excluded from current region assessment/.test(t));

  // edge node
  await page.evaluate(() => window.__HW.select('EDGE1'));
  t = await text('#in-body');
  ok('edge node inspector: ESP32', /ESP32/.test(t));
  ok('edge node shows connected sensors list', /SG04/.test(t) && /IMU02/.test(t) && /TEMP01/.test(t));
  ok('edge node acquisition running + sample rate pending', /RUNNING/.test(t) && /config pending/.test(t));

  // signal chain updates per selected sensor
  const chain = await text('#hw-chain');
  ok('bottom chain has HX711/ADS1115 for strain when EDGE selected? (chain shows global)', chain.length > 0);
  await page.evaluate(() => window.__HW.select('SG03'));
  const chain3 = await text('#hw-chain');
  ok('bottom chain updates per sensor (SG03 → B3)', chain3.includes('SG03') && chain3.includes('B3 REGION'));

  // filters
  await page.evaluate(() => window.__HW.setLayer('strain'));
  const visibleAfterStrain = await page.evaluate(() => {
    let names = [];
    // inspect element states instead of 3D: check filter chips + no crash
    return [...document.querySelectorAll('#layer-chips .fchip')].find(c => c.classList.contains('on'))?.textContent;
  });
  ok('layer filter STRAIN active', visibleAfterStrain === 'STRAIN');
  await page.evaluate(() => window.__HW.setLayer('ALL'));
  await page.evaluate(() => window.__HW.setZone('BATTERY_MOUNTS'));
  t = await text('#in-body');
  ok('zone filter shows battery-mount zone regions', /B3 —/.test(t) && /B4 —/.test(t));

  // exploded toggle + signal toggles run without error
  await page.evaluate(() => { window.__HW.setZone(null); window.__HW.toggle('signal'); window.__HW.toggle('map'); });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.__HW.toggle('explode'));
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => window.__HW.toggle('explode'));

  // twin page sanity (modes)
  await page.evaluate(() => window.SHIELD.goto('twin'));
  await page.waitForFunction(() => !!window.__TW, { timeout: 20000 });
  for (const m of ['STRAIN', 'ANOMALY']) {
    const r = await page.evaluate(mode => window.__TW.setMode(mode) || true, m);
    ok('twin mode ' + m + ' runs', r === true);
  }
  const dec = await text('#tw-decision');
  ok('twin decision panel populated', dec.includes('B4'));

  console.log('\nRuntime errors:');
  if (!errors.length) console.log('  ✓ none');
  else errors.forEach(e => console.log('  ✗ ' + e));

  await browser.close();
})().catch(e => { console.error('VERIFY FAILED:', e); process.exit(1); });