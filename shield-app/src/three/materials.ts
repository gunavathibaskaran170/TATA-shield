import * as THREE from 'three';

/* Material palette — engineering workstation look. */

export const COL = {
  paint: '#e9edf4',
  paintDeep: '#cfd8e4',
  pearl: '#f3f6fa',
  metal: '#c3ccd8',
  steel: '#9aa7b8',
  steelDark: '#6f7c8d',
  steelDark2: '#56616f',
  dark: '#3a424e',
  rubber: '#17191d',
  glass: '#9cd6e6',
  glassDark: '#23424f',
  orange: '#ff8b2b',
  orangeDark: '#d65f00',
  cyan: '#38d9cf',
  blue: '#4f8cff',
  red: '#ff6b5e',
  amber: '#f2b94e',
  green: '#4fe0a0',
  battery: '#31404f',
  tray: '#8d9aa8',
  module: '#3d5f7a',
};

export const M = {
  paintMatte: { color: COL.paint, metalness: 0.45, roughness: 0.42 },
  paint: { color: COL.paint, metalness: 0.6, roughness: 0.3 },
  pearl: { color: COL.pearl, metalness: 0.7, roughness: 0.22 },
  chrome: { color: COL.metal, metalness: 1.0, roughness: 0.18 },
  steel: { color: '#a0aebf', metalness: 0.92, roughness: 0.32 },
  steelDark: { color: '#728194', metalness: 0.88, roughness: 0.38 },
  steelDark2: { color: '#596778', metalness: 0.82, roughness: 0.45 },
  dark: { color: '#3a424e', metalness: 0.5, roughness: 0.6 },
  rubber: { color: '#17191d', metalness: 0.0, roughness: 0.94 },
  glass: { color: '#1c222b', metalness: 0.6, roughness: 0.08, transparent: true, opacity: 0.45, emissive: '#0b0f14', emissiveIntensity: 0.1 },
  glassDark: { color: '#10141a', metalness: 0.85, roughness: 0.08, transparent: true, opacity: 0.82, emissive: '#05070a', emissiveIntensity: 0.05, side: THREE.DoubleSide },
  orange: { color: COL.orange, emissive: '#c84b00', emissiveIntensity: 0.45, metalness: 0.35, roughness: 0.45 },
  orangeDim: { color: COL.orangeDark, metalness: 0.3, roughness: 0.55 },
  battery: { color: COL.battery, metalness: 0.75, roughness: 0.45 },
  tray: { color: COL.tray, metalness: 0.9, roughness: 0.35 },
  module: { color: COL.module, metalness: 0.6, roughness: 0.5 },
  blackPlastic: { color: '#22262c', metalness: 0.2, roughness: 0.75 },
  aluminum: { color: '#d8e2ec', metalness: 0.98, roughness: 0.22 },
  sensor: { color: COL.cyan, emissive: COL.cyan, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.3 },
  sensorOff: { color: '#5a6575', emissive: '#4a5360', emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.4 },
  bolt: { color: '#b7c0cc', metalness: 0.95, roughness: 0.35 },
  weld: { color: '#7d8896', metalness: 0.7, roughness: 0.5 },
  adhesive: { color: '#3b4a5c', metalness: 0.05, roughness: 0.8 },
  clip: { color: '#9aa7b8', metalness: 0.8, roughness: 0.4 },
  seat: { color: '#232a33', metalness: 0.05, roughness: 0.85 },
  seatTrim: { color: '#c8cfda', metalness: 0.3, roughness: 0.6 },
  tire: { color: '#101216', roughness: 0.96 },
  rim: { color: '#b9c2cd', metalness: 1.0, roughness: 0.16 },
  disc: { color: '#8f98a4', metalness: 0.9, roughness: 0.4 },
  caliper: { color: '#d4d9e0', metalness: 0.5, roughness: 0.5 },
  ecu: { color: '#2f3944', metalness: 0.3, roughness: 0.6 },
  lamp: { color: '#e8ecf2', emissive: '#dce8ff', emissiveIntensity: 0.5, transparent: true, opacity: 0.9, roughness: 0.1 },
  lampRed: { color: '#ffe0dd', emissive: '#ff3b30', emissiveIntensity: 0.8, transparent: true, opacity: 0.9, roughness: 0.1 },

  /* ---- body-in-white ghost skin (reference CAD cutaway look) ---- */
  bodyShell: {
    color: '#e2e7ec',
    emissive: '#1a2430',
    emissiveIntensity: 0.15,
    metalness: 0.82,
    roughness: 0.14,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
    depthWrite: false,
  },
  glassGhost: {
    color: '#1c222b',
    emissive: '#0d1116',
    emissiveIntensity: 0.1,
    metalness: 0.6,
    roughness: 0.08,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  },

  /* ---- exterior trim ---- */
  cladding: { color: '#1b1f25', metalness: 0.15, roughness: 0.82 },
  claddingGhost: { color: '#1b1f25', metalness: 0.15, roughness: 0.82, transparent: true, opacity: 0.9 },
  roofBlack: { color: '#12171d', metalness: 0.45, roughness: 0.3, transparent: true, opacity: 0.88 },
  skidPlate: { color: '#9aa6b2', metalness: 0.85, roughness: 0.42, transparent: true, opacity: 0.95 },
  drl: { color: '#eaf3ff', emissive: '#bcd8ff', emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.15 },
  /* ---- exploded-CAD presentation accents ----
     Structural rails are painted green and the pack carries
     blue / red busbars, matching the supplied exploded-assembly
     render convention. */
  railGreen: { color: '#3f9c52', metalness: 0.5, roughness: 0.42 },
  railGreenDark: { color: '#2c6f3a', metalness: 0.5, roughness: 0.5 },
  busPositive: { color: '#d64545', metalness: 0.3, roughness: 0.45, emissive: '#5a0f0f', emissiveIntensity: 0.25 },
  busNegative: { color: '#3a6fd8', metalness: 0.3, roughness: 0.45, emissive: '#0f2a5a', emissiveIntensity: 0.25 },
  leaderLine: { color: '#2b3a46', metalness: 0, roughness: 1 },
} as const;

export type MatKey = keyof typeof M;

/* Heat ramp: green → amber → red by 0..1. */
export function heatColor(n: number): THREE.Color {
  const c = new THREE.Color();
  const h = 0.38 - Math.min(1, Math.max(0, n)) * 0.38;
  c.setHSL(h, 0.92, 0.55);
  return c;
}

export const SEL_COLOR = new THREE.Color('#38d9cf');
export const GHOST_COLOR = new THREE.Color('#3c4a5e');