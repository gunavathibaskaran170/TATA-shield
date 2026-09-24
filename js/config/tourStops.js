/* ============================================================
   SHIELD — Guided Cinematic Tour Stops
   Data-driven tour path (from reference video analysis).
   Each stop: camera pose, target, callouts to reveal, dwell time.
   ============================================================ */

export const TOUR_STOPS = [
  {
    id: 'intro',
    label: 'SHIELD · EV-CH-007',
    caption: 'Structural Health Intelligence for EV Chassis',
    duration: 4000,
    camera: { pos: new THREE.Vector3(0.4, -0.3, 0.6), target: new THREE.Vector3(0, 0.02, 0) },
    callouts: [],
    contextMode: true, // ghost body on
    bodyOpacity: 0.18,
  },
  {
    id: 'front-axle',
    label: 'Front Axle & Suspension',
    caption: 'SG01/SG02 on front longitudinal rails — primary load path',
    duration: 6000,
    camera: { pos: new THREE.Vector3(-0.35, 0.18, 0.55), target: new THREE.Vector3(-0.05, 0.04, 0.18) },
    callouts: ['SG01', 'SG02'],
    contextMode: true,
    bodyOpacity: 0.18,
  },
  {
    id: 'powertrain',
    label: 'Concept Powertrain',
    caption: 'Motor · Inverter · Reduction Drive (CONCEPT — not OEM CAD)',
    duration: 6000,
    camera: { pos: new THREE.Vector3(0.35, 0.25, 0.35), target: new THREE.Vector3(0.05, 0.05, 0.15) },
    callouts: ['PT_MOTOR', 'PT_INVERTER', 'PT_REDUCTION'],
    contextMode: true,
    bodyOpacity: 0.18,
    showConcept: true,
  },
  {
    id: 'battery-mounts',
    label: 'Battery Mount Zones',
    caption: 'B1–B4 mount zones light up per current strain reading',
    duration: 7000,
    camera: { pos: new THREE.Vector3(0.4, 0.3, -0.1), target: new THREE.Vector3(0.05, 0.03, -0.05) },
    callouts: ['B1', 'B2', 'B3', 'B4'],
    contextMode: false,
    bodyOpacity: 0.3,
    highlightRegions: ['B1', 'B2', 'B3', 'B4'],
  },
  {
    id: 'rear-structure',
    label: 'Rear Structure & IMU02',
    caption: 'SG03/SG04 on rear cross-members · IMU02 response station',
    duration: 6000,
    camera: { pos: new THREE.Vector3(0.35, 0.25, -0.55), target: new THREE.Vector3(0.05, 0.04, -0.18) },
    callouts: ['SG03', 'SG04', 'IMU02'],
    contextMode: false,
    bodyOpacity: 0.3,
  },
  {
    id: 'hero-pullback',
    label: 'Hero Shot',
    caption: 'EV-CH-007 — End-of-line structural validation platform',
    duration: 5000,
    camera: { pos: new THREE.Vector3(0.58, 0.42, 0.56), target: new THREE.Vector3(0.0, 0.02, 0.0) },
    callouts: [],
    contextMode: true,
    bodyOpacity: 0.18,
  },
];

export const TOUR_KEY = 'T'; // keyboard shortcut
export const TOUR_AUTO_START_DELAY = 2000; // ms after page load