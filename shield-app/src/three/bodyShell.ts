import * as THREE from 'three';

/* ============================================================
   SHIELD — procedural compact-SUV body shell (lofted surface).

   The outer envelope is one continuous lofted surface rather
   than a stack of primitives.  A series of cross-sections
   ("stations") is placed along the longitudinal axis; every
   station carries a closed, rounded profile that runs from the
   underbody centre-line, out around the widest point, over the
   roof and back to the roof centre-line.  Adjacent stations are
   lofted into a BufferGeometry.

   Why loft instead of boxes: a single watertight surface with
   smooth-shaded normals reads as a real car body from *every*
   camera angle — front, rear, side, three-quarter, top and
   bottom — which is what a 360° digital twin needs.

   Proportions are DEMO values chosen to match the supplied CAD
   reference silhouette: short front overhang, cab-forward
   volume, high beltline, tall greenhouse, flared arches and a
   chopped rear.  NOT OEM Tata CAD geometry.
   ============================================================ */

/* ------------------------------------------------------------
   Wheel-arch envelope.  The arch is *baked into the loft*: the
   lower side edge of every section is pushed up over the axle,
   so the opening and the surrounding fender crown are part of
   the same continuous surface (no boolean cuts, no seams).
   ------------------------------------------------------------ */
export const ARCH = {
  frontZ: 1.425,
  rearZ: -1.425,
  wheelY: 0.38,
  radius: 0.46,
  sillY: 0.46,
} as const;

/* Ring resolution: samples per half-section.  Odd counts keep the
   centre-line samples (bottom / top) on exact x = 0. */
const RING_M = 41;
export const RING_K = RING_M * 2 - 2; // 80 points around the closed section

/* ------------------------------------------------------------
   Station control table — [ z, floorY, yBelt, yTop, halfW, roofW ]

   z      metres, +z = forward, 0 = mid-wheelbase
   floorY underbody centre-line height
   yBelt  beltline (widest shoulder)
   yTop   upper surface (hood / roof / tailgate)
   halfW  maximum half-width
   roofW  half-width where the upper surface turns over
   ------------------------------------------------------------ */
type Key = readonly [number, number, number, number, number, number];
const KEYS: readonly Key[] = [
  /* nose */
  [2.2, 0.36, 0.85, 0.98, 0.71, 0.58],
  [2.128, 0.3, 0.89, 1.04, 0.82, 0.68],
  [2.02, 0.24, 0.95, 1.09, 0.93, 0.78],
  /* bonnet */
  [1.824, 0.19, 1.01, 1.13, 0.98, 0.84],
  [1.556, 0.17, 1.06, 1.16, 1.00, 0.88],
  [1.266, 0.15, 1.08, 1.18, 1.01, 0.90],
  /* cowl → windscreen → roof */
  [1.05, 0.15, 1.085, 1.2, 1.01, 0.90],
  [0.93, 0.15, 1.09, 1.29, 1.01, 0.90],
  [0.81, 0.15, 1.095, 1.38, 1.01, 0.90],
  [0.7, 0.15, 1.1, 1.46, 1.01, 0.90],
  [0.6, 0.15, 1.1, 1.53, 1.01, 0.90],
  [0.51, 0.15, 1.1, 1.59, 1.01, 0.90],
  [0.3, 0.15, 1.1, 1.622, 1.01, 0.90],
  [0.0, 0.15, 1.1, 1.632, 1.01, 0.90],
  [-0.429, 0.15, 1.1, 1.636, 1.01, 0.90],
  [-0.879, 0.15, 1.1, 1.63, 1.01, 0.89],
  /* C-pillar → backlight → tailgate */
  [-1.18, 0.15, 1.092, 1.615, 1.01, 0.88],
  [-1.438, 0.15, 1.082, 1.578, 1.00, 0.86],
  [-1.6, 0.15, 1.072, 1.5, 0.99, 0.84],
  [-1.76, 0.16, 1.06, 1.39, 0.98, 0.82],
  [-1.9, 0.18, 1.04, 1.24, 0.97, 0.80],
  [-2.02, 0.21, 1.01, 1.1, 0.95, 0.77],
  [-2.12, 0.26, 0.96, 1.02, 0.92, 0.73],
  /* tail */
  [-2.25, 0.36, 0.86, 0.94, 0.77, 0.60],
];

/* Longitudinal sample step.  ~92 stations is plenty smooth and
   still only ~7.4k triangles for the whole envelope. */
const STEP = 0.045;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Sampled {
  floorY: number;
  yBelt: number;
  yTop: number;
  halfW: number;
  roofW: number;
}

function sampleKeys(z: number): Sampled {
  const first = KEYS[0];
  if (z >= first[0]) return { floorY: first[1], yBelt: first[2], yTop: first[3], halfW: first[4], roofW: first[5] };
  const last = KEYS[KEYS.length - 1];
  if (z <= last[0]) return { floorY: last[1], yBelt: last[2], yTop: last[3], halfW: last[4], roofW: last[5] };
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (z <= a[0] && z >= b[0]) {
      const t = (a[0] - z) / (a[0] - b[0]);
      return {
        floorY: lerp(a[1], b[1], t),
        yBelt: lerp(a[2], b[2], t),
        yTop: lerp(a[3], b[3], t),
        halfW: lerp(a[4], b[4], t),
        roofW: lerp(a[5], b[5], t),
      };
    }
  }
  return { floorY: last[1], yBelt: last[2], yTop: last[3], halfW: last[4], roofW: last[5] };
}

/* 1-2-1 smoothing along z, endpoints pinned, so linear
   interpolation between control points becomes a smooth surface. */
function smooth(a: number[], passes: number) {
  const n = a.length;
  let src = a.slice();
  let dst = a.slice();
  for (let p = 0; p < passes; p++) {
    for (let i = 1; i < n - 1; i++) {
      dst[i] = 0.25 * src[i - 1] + 0.5 * src[i] + 0.25 * src[i + 1];
    }
    src = dst.slice();
  }
  for (let i = 0; i < n; i++) a[i] = src[i];
}

/* Lower side-edge height at a given z — sill, or the wheel-arch
   crown when inside an arch opening. */
function archY(z: number): number {
  let y = 0;
  for (const zc of [ARCH.frontZ, ARCH.rearZ]) {
    const d = Math.abs(z - zc);
    if (d < ARCH.radius) {
      y = Math.max(y, ARCH.wheelY + Math.sqrt(ARCH.radius * ARCH.radius - d * d));
    }
  }
  return y;
}

/* Fender flare — a soft Gaussian bulge centred on each axle. */
const FLARE = 0.024;
const FLARE_SIGMA = 0.105;
function flare(z: number): number {
  const g = (d: number) => Math.exp(-(d * d) / (2 * FLARE_SIGMA * FLARE_SIGMA));
  return FLARE * (g(z - ARCH.frontZ) + g(z - ARCH.rearZ));
}

/* ------------------------------------------------------------
   Cross-section: right half of the outline, bottom-centre ->
   top-centre, smoothed with a Catmull-Rom spline.
   ------------------------------------------------------------ */
function sectionHalf(s: Sampled & { rockerY: number }): THREE.Vector2[] {
  const hw = s.halfW;
  const rw = Math.min(s.roofW, hw * 0.96);
  const fy = s.floorY;
  const ry = Math.max(s.rockerY, fy + 0.03);
  const by = Math.max(s.yBelt, ry + 0.05);
  const ty = Math.max(s.yTop, by + 0.04);

  const cp = [
    new THREE.Vector3(0, fy, 0), // 0 underbody centre
    new THREE.Vector3(hw * 0.55, fy + (ry - fy) * 0.1, 0), // 1 underbody outer
    new THREE.Vector3(hw * 0.975, ry, 0), // 2 rocker / arch lip — stays near full width so the fender covers the tyre
    new THREE.Vector3(hw * 0.997, ry + (by - ry) * 0.34, 0), // 3 lower flank
    new THREE.Vector3(hw, ry + (by - ry) * 0.7, 0), // 4 max width
    new THREE.Vector3(hw * 0.985, by, 0), // 5 beltline
    new THREE.Vector3(rw + (hw - rw) * 0.42, by + (ty - by) * 0.42, 0), // 6 tumblehome
    new THREE.Vector3(rw, by + (ty - by) * 0.8, 0), // 7 roof edge
    new THREE.Vector3(rw * 0.8, ty, 0), // 8 roof crown
    new THREE.Vector3(0, ty, 0), // 9 roof centre
  ];
  const curve = new THREE.CatmullRomCurve3(cp, false, 'catmullrom', 0.5);
  return curve.getPoints(RING_M - 1).map((p) => new THREE.Vector2(p.x, p.y));
}

/* Right half (indices 0 .. RING_M-1) then the mirrored left half
   walked back down, giving a closed section of RING_K points. */
function sectionRing(half: THREE.Vector2[]): THREE.Vector2[] {
  const m = half.length;
  const ring: THREE.Vector2[] = [];
  for (let i = 0; i < m; i++) ring.push(half[i]);
  for (let i = m - 2; i >= 1; i--) ring.push(new THREE.Vector2(-half[i].x, half[i].y));
  return ring;
}

export interface ShellStation {
  z: number;
  ring: THREE.Vector2[];
}

let _STATIONS: ShellStation[] | null = null;

export function shellStations(): ShellStation[] {
  if (_STATIONS) return _STATIONS;
  const zEnd = KEYS[KEYS.length - 1][0];
  const zs: number[] = [];
  for (let z = KEYS[0][0]; z >= zEnd - 1e-9; z -= STEP) zs.push(z);
  const n = zs.length;

  const fy: number[] = [];
  const by: number[] = [];
  const ty: number[] = [];
  const hw: number[] = [];
  const rw: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = sampleKeys(zs[i]);
    fy.push(s.floorY);
    by.push(s.yBelt);
    ty.push(s.yTop);
    hw.push(s.halfW);
    rw.push(s.roofW);
  }
  smooth(fy, 2);
  smooth(by, 3);
  smooth(ty, 3);
  smooth(hw, 3);
  smooth(rw, 3);

  const out: ShellStation[] = [];
  for (let i = 0; i < n; i++) {
    const halfW = hw[i] + flare(zs[i]);
    const s: Sampled & { rockerY: number } = {
      floorY: fy[i],
      yBelt: by[i],
      yTop: ty[i],
      halfW,
      roofW: rw[i],
      rockerY: Math.max(ARCH.sillY, archY(zs[i])),
    };
    out.push({ z: zs[i], ring: sectionRing(sectionHalf(s)) });
  }
  _STATIONS = out;
  return out;
}

/* Normalised position along the right half of a section, 0 at the
   underbody centre-line, 1 at the roof centre-line.  Identical
   for the mirrored left half, so a single t describes a
   *band* of the cross-section. */
export function ringT(i: number): number {
  if (i < RING_M) return i / (RING_M - 1);
  return (RING_K - i) / (RING_M - 1);
}

export type ShellSide = 'both' | 'L' | 'R';

/**
 * A point on the skin, addressed by (z, t) plus side.  Used to sit
 * lamps, handles, mirrors and cladding exactly on the surface
 * instead of guessing coordinates.
 */
export function shellPoint(z: number, t: number, side: 1 | -1 = 1): THREE.Vector3 {
  const st = shellStations();
  let i = 0;
  while (i < st.length - 1 && st[i].z > z) i++;
  const a = st[i];
  const b = st[Math.min(i + 1, st.length - 1)];
  const span = a.z - b.z;
  const fz = span > 1e-9 ? THREE.MathUtils.clamp((a.z - z) / span, 0, 1) : 0;

  const at = (station: ShellStation, tt: number) => {
    const f = THREE.MathUtils.clamp(tt, 0, 1) * (RING_M - 1);
    const i0 = Math.min(RING_M - 2, Math.floor(f));
    const fr = f - i0;
    const p0 = station.ring[i0];
    const p1 = station.ring[i0 + 1];
    return new THREE.Vector2(p0.x + (p1.x - p0.x) * fr, p0.y + (p1.y - p0.y) * fr);
  };

  const p0 = at(a, t);
  const p1 = at(b, t);
  return new THREE.Vector3(
    (p0.x + (p1.x - p0.x) * fz) * side,
    p0.y + (p1.y - p0.y) * fz,
    a.z + (b.z - a.z) * fz,
  );
}

/** An arc of the skin at constant z — used for wrap-around light bars. */
export function shellArc(
  z: number,
  tFrom: number,
  tTo: number,
  side: 1 | -1 = 1,
  n = 18,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) pts.push(shellPoint(z, THREE.MathUtils.lerp(tFrom, tTo, i / n), side));
  return pts;
}

export interface ShellZone {
  zFrom: number;
  zTo: number;
  tFrom?: number;
  tTo?: number;
  side?: ShellSide;
  capFront?: boolean;
  capRear?: boolean;
}

function keepRing(tFrom: number, tTo: number, side: ShellSide): Set<number> {
  const keep = new Set<number>();
  const EPS = 0.012; // seamless overlap across longitudinal seams (hood/fender, door/glass)
  if (side === 'both') {
    for (let i = 0; i < RING_K; i++) {
      const t = ringT(i);
      if (t >= tFrom - EPS && t <= tTo + EPS) keep.add(i);
    }
    return keep;
  }
  if (side === 'R') {
    // walk runs underbody centre (i = 0, t = 0) → roof centre (t = 1)
    for (let i = 0; i < RING_M; i++) {
      const t = ringT(i);
      if (t >= tFrom - EPS && t <= tTo + EPS) keep.add(i);
    }
    return keep;
  }
  // 'L' walks the opposite way: roof centre (t = 1) → underbody centre
  const steps = RING_M - 1;
  const s0 = Math.ceil((1 - tTo) * steps - EPS);
  const s1 = Math.floor((1 - tFrom) * steps + EPS);
  for (let s = s0; s <= s1; s++) keep.add((RING_M - 1 + s) % RING_K);
  return keep;
}

function stationSpan(zFrom: number, zTo: number): [number, number] {
  const st = shellStations();
  const n = st.length;
  let i0 = 0;
  while (i0 < n - 1 && st[i0].z > zTo + 0.001) i0++;
  let i1 = n - 1;
  while (i1 > 0 && st[i1].z < zFrom - 0.001) i1--;
  if (i1 < i0) return [0, n - 1];
  return [i0, i1];
}

/**
 * Build one piece of the lofted envelope.
 *
 * Adjacent zones share their boundary station row exactly, so the
 * full body can be split into selectable components (bumper,
 * hood, fender, roof, doors, glass, tailgate …) with no gaps.
 */
export function buildShellGeometry(zone: ShellZone): THREE.BufferGeometry {
  const { zFrom, zTo, tFrom = 0, tTo = 1, side = 'both', capFront = false, capRear = false } = zone;
  const st = shellStations();
  const [i0, i1] = stationSpan(zFrom, zTo);
  const keep = keepRing(tFrom, tTo, side);
  const rows = Math.max(0, i1 - i0 + 1);

  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  for (let r = 0; r < rows; r++) {
    for (let j = 0; j < RING_K; j++) {
      if (!keep.has(j)) continue;
      const p = st[i0 + r].ring[j];
      pos.push(p.x, p.y, st[i0 + r].z);
      uv.push(j / (RING_K - 1), r / Math.max(1, rows - 1));
    }
  }

  // index lookup: (row, ringIndex) -> vertex, or -1
  const lookup = new Map<number, number>();
  let cursor = 0;
  for (let r = 0; r < rows; r++) {
    for (let j = 0; j < RING_K; j++) {
      if (!keep.has(j)) continue;
      lookup.set(r * RING_K + j, cursor++);
    }
  }

  const v = (r: number, j: number) => {
    const k = lookup.get(r * RING_K + j);
    return k === undefined ? -1 : k;
  };

  for (let r = 0; r < rows - 1; r++) {
    for (let j = 0; j < RING_K; j++) {
      const j2 = (j + 1) % RING_K;
      const a = v(r, j);
      const b = v(r + 1, j);
      const c = v(r + 1, j2);
      const d = v(r, j2);
      if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      // wind so the face normal points out of the body
      idx.push(a, b, c, a, c, d);
    }
  }

  const addCap = (row: number, front: boolean) => {
    const ring = st[i0 + row].ring;
    const kept: number[] = [];
    let cx = 0;
    let cy = 0;
    for (let j = 0; j < RING_K; j++) {
      if (!keep.has(j)) continue;
      kept.push(j);
      cx += ring[j].x;
      cy += ring[j].y;
    }
    if (kept.length < 3) return;
    const center = pos.length / 3;
    pos.push(cx / kept.length, cy / kept.length, st[i0 + row].z);
    uv.push(0.5, front ? 0 : 1);
    const capStart = pos.length / 3;
    for (const j of kept) {
      const p = ring[j];
      pos.push(p.x, p.y, st[i0 + row].z);
      uv.push(p.x * 0.5 + 0.5, p.y);
    }
    for (let k = 0; k < kept.length; k++) {
      const a = capStart + k;
      const b = capStart + ((k + 1) % kept.length);
      if (front) idx.push(center, a, b);
      else idx.push(center, b, a);
    }
  };

  if (capFront && i0 === 0) addCap(0, true);
  if (capRear && i1 === st.length - 1) addCap(rows - 1, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
