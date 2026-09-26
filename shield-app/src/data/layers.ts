import type { LayerDef } from '../schema/types';

export const LAYERS: LayerDef[] = [
  { index: 0, label: 'Full vehicle', hint: 'Assembled product' },
  { index: 1, label: 'Exterior body / skin', hint: 'Paint, fascia, lamps, aero' },
  { index: 2, label: 'Closures & glass', hint: 'Hood, doors, tailgate, glazing' },
  { index: 3, label: 'Cabin trim', hint: 'Trim, headliner, floor mats' },
  { index: 4, label: 'Seats / dash / controls', hint: 'Occupant systems' },
  { index: 5, label: 'Body-in-white (cage)', hint: 'Pillars, rails, beams' },
  { index: 6, label: 'Floor structure', hint: 'Pans, tunnel' },
  { index: 7, label: 'Battery enclosure', hint: 'Tray, cover, extrusions, mounts' },
  { index: 8, label: 'Battery modules & internals', hint: 'Modules, BMS, junction box' },
  { index: 9, label: 'Cross-members', hint: 'Floor & seat cross-members' },
  { index: 10, label: 'Longitudinal rails & rockers', hint: 'Load rails, sills' },
  { index: 11, label: 'Suspension', hint: 'Links, struts, springs' },
  { index: 12, label: 'Steering', hint: 'Column, rack, links' },
  { index: 13, label: 'Brakes / wheels', hint: 'Rims, tires, discs, calipers' },
  { index: 14, label: 'Electric drive unit', hint: 'Motor, gearbox, halfshafts' },
  { index: 15, label: 'Inverter / OBC / DC-DC', hint: 'Power electronics' },
  { index: 16, label: 'Cooling system', hint: 'Radiators, pumps, loops' },
  { index: 17, label: 'HV orange harness', hint: 'High-voltage cabling' },
  { index: 18, label: 'LV harness & ECUs', hint: 'Low-voltage + controllers' },
  { index: 19, label: 'Fasteners / joints / welds', hint: 'Bolts, rivets, welds, adhesive' },
  { index: 20, label: 'SHIELD sensors', hint: 'Instrumentation nodes' },
  { index: 21, label: 'Analytical heatmaps', hint: 'Model-estimated overlays' },
];

export const LAYER_BY_INDEX: Record<number, LayerDef> = Object.fromEntries(
  LAYERS.map((l) => [l.index, l]),
);