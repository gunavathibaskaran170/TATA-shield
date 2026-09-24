/* ============================================================
   SHIELD — Layer Visibility Presets
   Data-driven (not code branches). Used by Systems Panel.
   ============================================================ */

export const LAYER_PRESETS = {
  ASSEMBLED: {
    label: 'ASSEMBLED',
    description: 'All systems visible',
    layers: { body: true, chassis: true, battery: true, powertrain: true, suspension: true, wheels: true, sensors: true },
  },
  CHASSIS_ONLY: {
    label: 'CHASSIS ONLY',
    description: 'Body/glass/powertrain hidden; battery ghost; chassis + suspension/wheels visible',
    layers: { body: false, chassis: true, battery: 'ghost', powertrain: false, suspension: true, wheels: true, sensors: true },
  },
  NO_CHASSIS: {
    label: 'NO CHASSIS',
    description: 'Chassis hidden; all other systems visible',
    layers: { body: true, chassis: false, battery: true, powertrain: true, suspension: true, wheels: true, sensors: true },
  },
  XRAY: {
    label: 'X-RAY',
    description: 'Body ghosted (slider 0–100%), internals opaque',
    layers: { body: 'xray', chassis: true, battery: true, powertrain: true, suspension: true, wheels: true, sensors: true },
  },
  SENSORS: {
    label: 'SENSORS',
    description: 'Sensor network emphasised, rest ghosted',
    layers: { body: 'ghost', chassis: 'ghost', battery: 'ghost', powertrain: 'ghost', suspension: 'ghost', wheels: 'ghost', sensors: true },
  },
  POWERTRAIN_FOCUS: {
    label: 'POWERTRAIN FOCUS',
    description: 'Powertrain + chassis, rest hidden',
    layers: { body: false, chassis: true, battery: false, powertrain: true, suspension: false, wheels: false, sensors: false },
  },
  BATTERY_FOCUS: {
    label: 'BATTERY FOCUS',
    description: 'Battery + chassis, rest hidden',
    layers: { body: false, chassis: true, battery: true, powertrain: false, suspension: false, wheels: false, sensors: false },
  },
};

export const LAYER_ROWS = [
  { id: 'body',       label: 'BODY',        icon: '▫', color: '#e6eefc', default: true,  subToggles: ['doors', 'glass', 'hood'] },
  { id: 'chassis',    label: 'CHASSIS',     icon: '■', color: '#38d9cf', default: true,  subToggles: ['rails', 'cross', 'floor', 'mounts'] },
  { id: 'battery',    label: 'BATTERY',     icon: '◆', color: '#f2b94e', default: true,  subToggles: ['cover', 'modules', 'bms'] },
  { id: 'powertrain', label: 'POWERTRAIN',  icon: '▲', color: '#ff7a1a', default: true,  subToggles: ['motor', 'inverter', 'reduction', 'shafts'] },
  { id: 'suspension', label: 'SUSPENSION',  icon: '◆', color: '#4fe0a0', default: true,  subToggles: ['springs', 'arms', 'knuckles'] },
  { id: 'wheels',     label: 'WHEELS',      icon: '●', color: '#4f8cff', default: true,  subToggles: ['tyres', 'rims', 'brakes'] },
  { id: 'sensors',    label: 'SENSORS',     icon: '◇', color: '#ff6b5e', default: true,  subToggles: [] },
];

export const SUB_TOGGLES = {
  body: [
    { id: 'doors', key: 'doors', label: 'Doors' },
    { id: 'glass', key: 'glass', label: 'Glass' },
    { id: 'hood',  key: 'hood',  label: 'Hood/Trunk' },
  ],
  chassis: [
    { id: 'rails',  key: 'rails',  label: 'Long Rails' },
    { id: 'cross',  key: 'cross',  label: 'Cross Members' },
    { id: 'floor',  key: 'floor',  label: 'Floor Plate' },
    { id: 'mounts', key: 'mounts', label: 'Battery Mounts' },
  ],
  battery: [
    { id: 'cover',    key: 'cover',    label: 'PC Cover' },
    { id: 'modules',  key: 'modules',  label: 'Modules' },
    { id: 'bms',      key: 'bms',      label: 'BMS Board' },
  ],
  powertrain: [
    { id: 'motor',      key: 'motor',      label: 'Motor' },
    { id: 'inverter',   key: 'inverter',   label: 'Inverter' },
    { id: 'reduction',  key: 'reduction',  label: 'Reduction Drive' },
    { id: 'shafts',     key: 'shafts',     label: 'Driveshafts' },
  ],
  suspension: [
    { id: 'springs', key: 'springs', label: 'Coil-Overs' },
    { id: 'arms',    key: 'arms',    label: 'Wishbones' },
    { id: 'knuckles',key: 'knuckles', label: 'Knuckles' },
  ],
  wheels: [
    { id: 'tyres', key: 'tyres', label: 'Tyres' },
    { id: 'rims',  key: 'rims',  label: 'Rims' },
    { id: 'brakes',key: 'brakes', label: 'Brakes' },
  ],
  sensors: [],
};