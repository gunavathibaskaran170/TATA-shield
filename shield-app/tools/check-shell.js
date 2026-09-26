/* Offline validation of the lofted body shell.
   Bundles src/three/bodyShell.ts with esbuild and inspects the
   generated geometry: vertex/index counts, NaN check, bounding box
   and per-zone coverage, without needing a browser.
   Run: node tools/check-shell.js   (from shield-app) */
import { build } from 'esbuild';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, '..', 'src', 'three', 'bodyShell.ts');

const out = mkdtempSync(join(tmpdir(), 'shield-shell-'));
const outfile = join(out, 'bodyShell.mjs');

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  external: ['three'],
  logLevel: 'error',
});
/* three is ESM; rewrite the bare specifier to a file URL so node resolves it */
const { readFileSync } = await import('fs');
let code = readFileSync(outfile, 'utf8');
const threeEntry = resolve(here, '..', 'node_modules', 'three', 'build', 'three.module.js');
code = code.replace(/from\s*["']three["']/g, `from "${pathToFileURL(threeEntry).href}"`);
writeFileSync(outfile, code);

const mod = await import(pathToFileURL(outfile).href);

/* the exact zone map used by Exterior.tsx */
const T_SIDE_TO = 0.56;
const T_GLASS_FROM = 0.5601;
const T_GLASS_TO = 0.795;
const T_TOP_FROM = 0.8;

const ZONES = [
  { cid: 'FrontBumper', zFrom: 1.98, zTo: 2.2, t: null, side: 'both', capFront: true },
  { cid: 'Hood', zFrom: 1.05, zTo: 1.98, t: [T_GLASS_FROM, 1], side: 'both' },
  { cid: 'FrontFender_L', zFrom: 0.51, zTo: 1.98, t: [0, T_SIDE_TO], side: 'L' },
  { cid: 'FrontFender_R', zFrom: 0.51, zTo: 1.98, t: [0, T_SIDE_TO], side: 'R' },
  { cid: 'Windshield', zFrom: 0.51, zTo: 1.05, t: [T_GLASS_FROM, 1], side: 'both' },
  { cid: 'Door_FL', zFrom: -0.07, zTo: 0.51, t: [0, T_SIDE_TO], side: 'L' },
  { cid: 'Door_FR', zFrom: -0.07, zTo: 0.51, t: [0, T_SIDE_TO], side: 'R' },
  { cid: 'RoofPanel', zFrom: -1.44, zTo: 0.51, t: [T_TOP_FROM, 1], side: 'both' },
  { cid: 'SideGlass_L', zFrom: -1.44, zTo: -0.07, t: [T_GLASS_FROM, T_GLASS_TO], side: 'L' },
  { cid: 'SideGlass_R', zFrom: -1.44, zTo: -0.07, t: [T_GLASS_FROM, T_GLASS_TO], side: 'R' },
  { cid: 'Door_RL', zFrom: -0.88, zTo: -0.07, t: [0, T_SIDE_TO], side: 'L' },
  { cid: 'Door_RR', zFrom: -0.88, zTo: -0.07, t: [0, T_SIDE_TO], side: 'R' },
  { cid: 'QuarterPanel_L', zFrom: -1.76, zTo: -0.88, t: [0, T_SIDE_TO], side: 'L' },
  { cid: 'QuarterPanel_R', zFrom: -1.76, zTo: -0.88, t: [0, T_SIDE_TO], side: 'R' },
  { cid: 'RearGlass', zFrom: -1.76, zTo: -1.44, t: [T_GLASS_FROM, 1], side: 'both' },
  { cid: 'Tailgate', zFrom: -2.05, zTo: -1.76, t: null, side: 'both' },
  { cid: 'RearBumper', zFrom: -2.25, zTo: -2.05, t: null, side: 'both', capRear: true },
];

const stations = mod.shellStations();
console.log(`stations: ${stations.length}  ring points: ${mod.RING_K}`);

let tv = 0;
let tf = 0;
let nan = 0;
const bbox = { minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, minz: 1e9, maxz: -1e9 };

console.log('\nzone                 verts   tris   bbox(x)          bbox(y)          bbox(z)');
for (const z of ZONES) {
  const geo = mod.buildShellGeometry({
    zFrom: z.zFrom,
    zTo: z.zTo,
    tFrom: z.t ? z.t[0] : 0,
    tTo: z.t ? z.t[1] : 1,
    side: z.side,
    capFront: !!z.capFront,
    capRear: !!z.capRear,
  });
  const p = geo.getAttribute('position');
  const idx = geo.getIndex();
  const nv = p.count;
  const nf = idx ? idx.count / 3 : 0;
  tv += nv;
  tf += nf;
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, minz = 1e9, maxz = -1e9;
  for (let i = 0; i < nv; i++) {
    const x = p.getX(i), y = p.getY(i), zz = p.getZ(i);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zz)) nan++;
    minx = Math.min(minx, x); maxx = Math.max(maxx, x);
    miny = Math.min(miny, y); maxy = Math.max(maxy, y);
    minz = Math.min(minz, zz); maxz = Math.max(maxz, zz);
  }
  bbox.minx = Math.min(bbox.minx, minx); bbox.maxx = Math.max(bbox.maxx, maxx);
  bbox.miny = Math.min(bbox.miny, miny); bbox.maxy = Math.max(bbox.maxy, maxy);
  bbox.minz = Math.min(bbox.minz, minz); bbox.maxz = Math.max(bbox.maxz, maxz);
  const r = (v) => v.toFixed(2).padStart(6);
  console.log(
    `${z.cid.padEnd(20)} ${String(nv).padStart(5)} ${String(nf).padStart(6)}   ` +
    `${r(minx)}..${r(maxx)}   ${r(miny)}..${r(maxy)}   ${r(minz)}..${r(maxz)}`,
  );
}

console.log(`\nTOTAL verts: ${tv}  tris: ${tf}  NaN coords: ${nan}`);
console.log(
  `WHOLE BODY  x ${bbox.minx.toFixed(3)} .. ${bbox.maxx.toFixed(3)}` +
  `  (width ${(bbox.maxx - bbox.minx).toFixed(3)})` +
  `\n            y ${bbox.miny.toFixed(3)} .. ${bbox.maxy.toFixed(3)}` +
  `  (height ${(bbox.maxy - bbox.miny).toFixed(3)})` +
  `\n            z ${bbox.minz.toFixed(3)} .. ${bbox.maxz.toFixed(3)}` +
  `  (length ${(bbox.maxz - bbox.minz).toFixed(3)})`,
);

/* normal sanity: a few outward-facing checks */
console.log('\nsample surface points (nose / roof / tail / arch):');
for (const [label, z, t] of [
  ['nose centre', 2.19, 0.98],
  ['hood centre', 1.5, 0.95],
  ['roof centre', 0.0, 1.0],
  ['belt side R', 0.0, 0.5],
  ['arch lip R', 1.425, 0.25],
  ['tail centre', -2.24, 0.9],
]) {
  const p = mod.shellPoint(z, t, 1);
  console.log(`  ${label.padEnd(14)} x=${p.x.toFixed(3)} y=${p.y.toFixed(3)} z=${p.z.toFixed(3)}`);
}
