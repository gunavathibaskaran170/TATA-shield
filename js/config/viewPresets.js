/* ============================================================
   SHIELD — Camera View Presets & Focus Poses
   Data-driven camera positions for dock buttons and focus-on-selection.
   ============================================================ */

export const VIEW_PRESETS = {
  iso:     (d) => new THREE.Vector3(0.62, 0.55, 0.62).normalize().multiplyScalar(d),
  front:   (d) => new THREE.Vector3(0, 0.14, 1).normalize().multiplyScalar(d),
  top:     (d) => new THREE.Vector3(0, 1, 0.14).normalize().multiplyScalar(d),
  side:    (d) => new THREE.Vector3(1, 0.18, 0).normalize().multiplyScalar(d),
  bottom:  (d) => new THREE.Vector3(0, -1, 0.25).normalize().multiplyScalar(d),
  rear:    (d) => new THREE.Vector3(0, 0.14, -1).normalize().multiplyScalar(d),
  underside: (d) => new THREE.Vector3(0.3, -0.8, 0.3).normalize().multiplyScalar(d),
};

export const VIEW_PRESET_ORDER = ['iso', 'front', 'top', 'side', 'rear', 'bottom', 'underside'];

/* Focus poses for components/regions (used by focus-on-selection) */
export const FOCUS_POSES = {
  B1: { pos: new THREE.Vector3(-0.52, 0.34, 0.4), target: new THREE.Vector3(-0.05, 0.04, 0.22) },
  B2: { pos: new THREE.Vector3(0.52, 0.34, 0.4), target: new THREE.Vector3(0.05, 0.04, 0.22) },
  B3: { pos: new THREE.Vector3(-0.52, 0.34, -0.4), target: new THREE.Vector3(-0.05, 0.04, -0.16) },
  B4: { pos: new THREE.Vector3(0.52, 0.34, -0.4), target: new THREE.Vector3(0.05, 0.04, -0.16) },
  F1: { pos: new THREE.Vector3(0.3, 0.4, 0.72), target: new THREE.Vector3(0, 0.04, 0.22) },
  R1: { pos: new THREE.Vector3(0.3, 0.4, -0.72), target: new THREE.Vector3(0, 0.04, -0.22) },
  C1: { pos: new THREE.Vector3(0.3, 0.4, 0.0), target: new THREE.Vector3(0, 0.04, 0.0) },
  SG01: { pos: new THREE.Vector3(-0.4, 0.2, 0.3), target: new THREE.Vector3(-0.105, 0.045, 0.16) },
  SG02: { pos: new THREE.Vector3(0.4, 0.2, 0.3), target: new THREE.Vector3(0.105, 0.045, 0.16) },
  SG03: { pos: new THREE.Vector3(-0.4, 0.2, -0.3), target: new THREE.Vector3(-0.105, 0.033, -0.175) },
  SG04: { pos: new THREE.Vector3(0.4, 0.2, -0.3), target: new THREE.Vector3(0.105, 0.033, -0.175) },
  IMU01: { pos: new THREE.Vector3(0.0, 0.3, 0.5), target: new THREE.Vector3(0, 0.062, 0.18) },
  IMU02: { pos: new THREE.Vector3(0.0, 0.3, -0.5), target: new THREE.Vector3(0, 0.062, -0.18) },
  LC01: { pos: new THREE.Vector3(0.0, 0.3, 0.3), target: new THREE.Vector3(0, 0.05, 0.125) },
  TEMP01: { pos: new THREE.Vector3(-0.4, 0.2, -0.2), target: new THREE.Vector3(-0.117, 0.038, -0.06) },
  DISP01: { pos: new THREE.Vector3(0.4, 0.3, -0.2), target: new THREE.Vector3(0.105, 0.15, -0.02) },
  EDGE1: { pos: new THREE.Vector3(0.6, 0.2, -0.3), target: new THREE.Vector3(0.24, 0.045, -0.16) },
};

export const CAMERA_DEFAULTS = {
  homePos: new THREE.Vector3(0.58, 0.42, 0.56),
  homeTarget: new THREE.Vector3(0.0, 0.02, 0.0),
  minDistance: 0.26,
  maxDistance: 2.6,
  maxPolarAngle: Math.PI * 0.52,
  dampingFactor: 0.09,
  autoRotateSpeed: 0.08, // rad/s (~4.5°/s)
  autoRotateIdleDelay: 6000, // ms
};

/* Dock button definitions */
export const CAMERA_DOCK_BUTTONS = [
  { id: 'rotateLeft',   label: 'ROTATE ←', icon: '⟲', action: 'rotate', delta: -Math.PI / 6 },
  { id: 'rotateRight',  label: 'ROTATE →', icon: '⟳', action: 'rotate', delta: Math.PI / 6 },
  { id: 'zoomIn',       label: 'ZOOM +',   icon: '➕', action: 'zoom', factor: 0.7 },
  { id: 'zoomOut',      label: 'ZOOM −',   icon: '➖', action: 'zoom', factor: 1.4 },
  { id: 'reset',        label: 'RESET',    icon: '↺', action: 'reset' },
  { id: 'fit',          label: 'FIT',      icon: '⛶', action: 'fit' },
  { id: 'viewTop',      label: 'TOP',      icon: '⬆', action: 'preset', preset: 'top' },
  { id: 'viewFront',    label: 'FRONT',    icon: '⬇', action: 'preset', preset: 'front' },
  { id: 'viewRear',     label: 'REAR',     icon: '⬇', action: 'preset', preset: 'rear' },
  { id: 'viewLeft',     label: 'LEFT',     icon: '⬅', action: 'preset', preset: 'side' },
  { id: 'viewRight',    label: 'RIGHT',    icon: '➡', action: 'preset', preset: 'side' },
  { id: 'viewIso',      label: 'ISO',      icon: '⬟', action: 'preset', preset: 'iso' },
  { id: 'viewUnderside',label: 'UNDERSIDE',icon: '⬇', action: 'preset', preset: 'underside' },
];