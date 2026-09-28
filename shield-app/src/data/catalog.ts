/* ============================================================
   SHIELD — master component catalog
   Single source of truth for the assembly hierarchy, layers,
   metadata and selection. The 3D builders render meshes for
   these ids; the tree/inspector/analytics read from here.
   Material / process / mass values are VERIFIED unless marked.
   ============================================================ */

import type { ComponentDef, GeometryFamily, HealthState } from '../schema/types';

type Cat = Omit<ComponentDef, 'explodeDir' | 'explodeGroup' | 'healthState'> & {
  explodeDir?: [number, number, number];
  explodeGroup?: number;
  healthState?: HealthState;
};

const H: HealthState = 'NORMAL';

function c(
  id: string,
  name: string,
  system: string,
  parent: string,
  layer: number,
  gf: GeometryFamily,
  extra: Partial<Cat> = {},
): ComponentDef {
  return {
    id,
    name,
    system,
    parent,
    layer,
    gf,
    description: extra.description ?? `${name} — high-precision structural CAD component.`,
    explodeDir: [0, 1, 0],
    explodeGroup: 1,
    healthState: extra.healthState ?? H,
    ...extra,
  };
}

const EX = 'EXTERIOR';
const BIW = 'BIW';
const SK = 'SKATEBOARD';
const SUS = 'SUSPENSION';
const ST = 'STEERING';
const BK = 'BRAKES';
const CB = 'CABIN';
const TH = 'THERMAL';
const EL = 'ELECTRICAL';
const FA = 'FASTENERS';
const SE = 'SENSORS';

const GRP_BIW_FRONT = 'GRP_BIW_FRONT';
const GRP_BIW_CELL = 'GRP_BIW_CELL';
const GRP_BIW_FLOOR = 'GRP_BIW_FLOOR';
const GRP_BIW_REAR = 'GRP_BIW_REAR';
const GRP_BATTERY = 'GRP_BATTERY';
const GRP_DRIVE = 'GRP_DRIVE';
const GRP_PWR = 'GRP_PWR_ELEC';
const GRP_HV = 'GRP_HV';

export const CATALOG: ComponentDef[] = [
  /* ------------------------------------------------ EXTERIOR - L1/L2 */
  c('FrontBumper', 'Front bumper fascia', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'CENTER', region: 'F1', material: 'ABS/PC painted', manufacturingProcess: 'Injection moulded',
    explodeDir: [0, 0, -1], explodeGroup: 3, massKg: 4.2, description: 'Painted bumper fascia with lower grille region. Engineering CAD model.',
  }),
  c('RearBumper', 'Rear bumper fascia', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'CENTER', region: 'R1', material: 'ABS/PC painted', manufacturingProcess: 'Injection moulded',
    explodeDir: [0, 0, 1], explodeGroup: 3, massKg: 3.8,
  }),
  c('Hood', 'Hood (bonnet) panel', EX, 'SYS_EXTERIOR', 2, 'panel', {
    side: 'CENTER', region: 'F1', material: 'Steel / aluminium closure', manufacturingProcess: 'Stamped outer + inner, hemmed',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 11.5,
  }),
  c('RoofPanel', 'Roof panel', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'CENTER', region: 'C1', material: 'Steel painted', manufacturingProcess: 'Stamped, bonded + welded to roof rails',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 9.4,
  }),
  c('FrontFender_L', 'Front fender L', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'L', material: 'Steel painted', manufacturingProcess: 'Stamped',
    explodeDir: [-1, 0.4, 0], explodeGroup: 3, massKg: 2.4,
  }),
  c('FrontFender_R', 'Front fender R', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'R', material: 'Steel painted', manufacturingProcess: 'Stamped',
    explodeDir: [1, 0.4, 0], explodeGroup: 3, massKg: 2.4,
  }),
  c('QuarterPanel_L', 'Rear quarter panel L', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'L', material: 'Steel painted', manufacturingProcess: 'Stamped',
    explodeDir: [-1, 0.3, 0], explodeGroup: 3, massKg: 3.1,
  }),
  c('QuarterPanel_R', 'Rear quarter panel R', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'R', material: 'Steel painted', manufacturingProcess: 'Stamped',
    explodeDir: [1, 0.3, 0], explodeGroup: 3, massKg: 3.1,
  }),
  c('Door_FL', 'Front door — left', EX, 'SYS_EXTERIOR', 2, 'panel', {
    side: 'L', material: 'Steel painted', manufacturingProcess: 'Outer + inner stampings, hemmed + bonded',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 17.2,
  }),
  c('Door_FR', 'Front door — right', EX, 'SYS_EXTERIOR', 2, 'panel', {
    side: 'R', material: 'Steel painted', manufacturingProcess: 'Outer + inner stampings, hemmed + bonded',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 17.2,
  }),
  c('Door_RL', 'Rear door — left', EX, 'SYS_EXTERIOR', 2, 'panel', {
    side: 'L', material: 'Steel painted', manufacturingProcess: 'Outer + inner stampings, hemmed + bonded',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 14.6,
  }),
  c('Door_RR', 'Rear door — right', EX, 'SYS_EXTERIOR', 2, 'panel', {
    side: 'R', material: 'Steel painted', manufacturingProcess: 'Outer + inner stampings, hemmed + bonded',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 14.6,
  }),
  c('Tailgate', 'Tailgate / liftgate', EX, 'SYS_EXTERIOR', 2, 'panel', {
    side: 'CENTER', region: 'R1', material: 'Steel painted', manufacturingProcess: 'Stamped, hemmed',
    explodeDir: [0, 1, 0.4], explodeGroup: 3, massKg: 12.8,
  }),
  c('Windshield', 'Windshield glass', EX, 'SYS_EXTERIOR', 2, 'glass', {
    side: 'CENTER', material: 'Laminated glass', manufacturingProcess: 'Bonded to body',
    explodeDir: [0, 1, -0.3], explodeGroup: 2, massKg: 8.2,
  }),
  c('RearGlass', 'Rear window glass', EX, 'SYS_EXTERIOR', 2, 'glass', {
    side: 'CENTER', material: 'Tempered glass', manufacturingProcess: 'Bonded',
    explodeDir: [0, 1, 0.3], explodeGroup: 2, massKg: 3.5,
  }),
  c('SideGlass_L', 'Side glass — left', EX, 'SYS_EXTERIOR', 2, 'glass', {
    side: 'L', material: 'Tempered glass', manufacturingProcess: 'Channelled in door frame',
    explodeDir: [-1, 0.4, 0], explodeGroup: 2, massKg: 3.0,
  }),
  c('SideGlass_R', 'Side glass — right', EX, 'SYS_EXTERIOR', 2, 'glass', {
    side: 'R', material: 'Tempered glass', manufacturingProcess: 'Channelled in door frame',
    explodeDir: [1, 0.4, 0], explodeGroup: 2, massKg: 3.0,
  }),
  c('Mirrors', 'Door mirrors', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'CENTER', material: 'Painted ABS', manufacturingProcess: 'Injection moulded',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.6,
  }),
  c('Headlamp_L', 'Headlamp assembly L', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'L', material: 'Polycarbonate lens + housing', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 0, -0.3], explodeGroup: 3, massKg: 1.8,
  }),
  c('Headlamp_R', 'Headlamp assembly R', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'R', material: 'Polycarbonate lens + housing', manufacturingProcess: 'Assembled',
    explodeDir: [1, 0, -0.3], explodeGroup: 3, massKg: 1.8,
  }),
  c('Taillamp_L', 'Tail lamp assembly L', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'L', material: 'Polycarbonate lens + housing', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 0, 0.3], explodeGroup: 3, massKg: 1.1,
  }),
  c('Taillamp_R', 'Tail lamp assembly R', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'R', material: 'Polycarbonate lens + housing', manufacturingProcess: 'Assembled',
    explodeDir: [1, 0, 0.3], explodeGroup: 3, massKg: 1.1,
  }),
  c('UnderbodyAero_Mid', 'Underbody aero cover — centre', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'CENTER', material: 'Composite splash shield', manufacturingProcess: 'Thermoformed',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 2.6,
  }),
  c('UnderbodyAero_L', 'Underbody aero cover — left', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'L', material: 'Composite splash shield', manufacturingProcess: 'Thermoformed',
    explodeDir: [-0.3, -1, 0], explodeGroup: 2, massKg: 1.8,
  }),
  c('UnderbodyAero_R', 'Underbody aero cover — right', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'R', material: 'Composite splash shield', manufacturingProcess: 'Thermoformed',
    explodeDir: [0.3, -1, 0], explodeGroup: 2, massKg: 1.8,
  }),

  /* ---- exterior cladding & trim (matches the reference CAD styling) ---- */
  c('ArchCladding_FL', 'Wheel-arch cladding — front left', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'L', region: 'F1', material: 'PP+EPDM textured cladding', manufacturingProcess: 'Injection moulded',
    explodeDir: [-1, 0, 0.2], explodeGroup: 3, massKg: 2.4,
    description: 'Two-tone textured arch flare over the front-left corner. Sits proud of the ghosted body skin. Engineering CAD model.',
  }),
  c('ArchCladding_FR', 'Wheel-arch cladding — front right', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'R', region: 'F1', material: 'PP+EPDM textured cladding', manufacturingProcess: 'Injection moulded',
    explodeDir: [1, 0, 0.2], explodeGroup: 3, massKg: 2.4,
  }),
  c('ArchCladding_RL', 'Wheel-arch cladding — rear left', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'L', region: 'R1', material: 'PP+EPDM textured cladding', manufacturingProcess: 'Injection moulded',
    explodeDir: [-1, 0, -0.2], explodeGroup: 3, massKg: 2.4,
  }),
  c('ArchCladding_RR', 'Wheel-arch cladding — rear right', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'R', region: 'R1', material: 'PP+EPDM textured cladding', manufacturingProcess: 'Injection moulded',
    explodeDir: [1, 0, -0.2], explodeGroup: 3, massKg: 2.4,
  }),
  c('RockerCladding_L', 'Rocker / sill cladding — left', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'L', material: 'PP+EPDM textured cladding', manufacturingProcess: 'Injection moulded',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 1.5,
  }),
  c('RockerCladding_R', 'Rocker / sill cladding — right', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'R', material: 'PP+EPDM textured cladding', manufacturingProcess: 'Injection moulded',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 1.5,
  }),
  c('DoorHandle_FL', 'Door handle — front left', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'L', material: 'Painted steel / satin chrome', manufacturingProcess: 'Cast + plated',
    explodeDir: [-1, 0, 0.2], explodeGroup: 3, massKg: 0.2,
  }),
  c('DoorHandle_FR', 'Door handle — front right', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'R', material: 'Painted steel / satin chrome', manufacturingProcess: 'Cast + plated',
    explodeDir: [1, 0, 0.2], explodeGroup: 3, massKg: 0.2,
  }),
  c('DoorHandle_RL', 'Door handle — rear left', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'L', material: 'Painted steel / satin chrome', manufacturingProcess: 'Cast + plated',
    explodeDir: [-1, 0, -0.2], explodeGroup: 3, massKg: 0.2,
  }),
  c('DoorHandle_RR', 'Door handle — rear right', EX, 'SYS_EXTERIOR', 1, 'box', {
    side: 'R', material: 'Painted steel / satin chrome', manufacturingProcess: 'Cast + plated',
    explodeDir: [1, 0, -0.2], explodeGroup: 3, massKg: 0.2,
  }),
  c('ChargeFlap', 'Charge-port flap', EX, 'SYS_EXTERIOR', 1, 'panel', {
    side: 'L', material: 'Painted polymer', manufacturingProcess: 'Injection moulded',
    explodeDir: [-1, 0, 0.3], explodeGroup: 3, massKg: 0.3,
  }),

  /* ------------------------------------------------ BODY-IN-WHITE */
  c('CrashBeam', 'Front crash beam', BIW, GRP_BIW_FRONT, 5, 'beam', {
    side: 'CENTER', region: 'F1', material: 'Hot-stamped boron steel', manufacturingProcess: 'Hot stamping',
    explodeDir: [0, 0, -1], explodeGroup: 1, massKg: 3.4,
  }),
  c('CrushCan_L', 'Crush can — left', BIW, GRP_BIW_FRONT, 5, 'beam', {
    side: 'L', region: 'F1', material: 'Aluminium extrusion', manufacturingProcess: 'Extruded + machined slots',
    explodeDir: [0, 0, -1], explodeGroup: 1, massKg: 0.6,
  }),
  c('CrushCan_R', 'Crush can — right', BIW, GRP_BIW_FRONT, 5, 'beam', {
    side: 'R', region: 'F1', material: 'Aluminium extrusion', manufacturingProcess: 'Extruded + machined slots',
    explodeDir: [0, 0, -1], explodeGroup: 1, massKg: 0.6,
  }),
  c('FrontLongitudinal_L', 'Front longitudinal rail — left', BIW, GRP_BIW_FRONT, 10, 'rail', {
    side: 'L', region: 'F1', material: 'High-strength steel', manufacturingProcess: 'Stamped box-section, spot welded',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 7.8,
  }),
  c('FrontLongitudinal_R', 'Front longitudinal rail — right', BIW, GRP_BIW_FRONT, 10, 'rail', {
    side: 'R', region: 'F1', material: 'High-strength steel', manufacturingProcess: 'Stamped box-section, spot welded',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 7.8,
  }),
  c('RadiatorSupport', 'Radiator support frame', BIW, GRP_BIW_FRONT, 5, 'panel', {
    side: 'CENTER', region: 'F1', material: 'Steel', manufacturingProcess: 'Welded frame',
    explodeDir: [0, 0, -1], explodeGroup: 1, massKg: 2.2,
  }),
  c('FrontUpperRail_L', 'Front upper rail — left', BIW, GRP_BIW_FRONT, 10, 'rail', {
    side: 'L', region: 'F1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [-0.5, 1, 0], explodeGroup: 1, massKg: 3.1,
  }),
  c('FrontUpperRail_R', 'Front upper rail — right', BIW, GRP_BIW_FRONT, 10, 'rail', {
    side: 'R', region: 'F1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0.5, 1, 0], explodeGroup: 1, massKg: 3.1,
  }),

  c('A_Pillar_L', 'A-pillar — left', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'L', region: 'C1', material: 'Hot-stamped steel', manufacturingProcess: 'Hot stamping, welded sub-assy',
    explodeDir: [-0.6, 1, 0], explodeGroup: 1, massKg: 6.4,
  }),
  c('A_Pillar_R', 'A-pillar — right', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'R', region: 'C1', material: 'Hot-stamped steel', manufacturingProcess: 'Hot stamping, welded sub-assy',
    explodeDir: [0.6, 1, 0], explodeGroup: 1, massKg: 6.4,
  }),
  c('B_Pillar_L', 'B-pillar — left', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'L', region: 'C1', material: 'Hot-stamped steel', manufacturingProcess: 'Hot stamping',
    explodeDir: [-0.7, 1, 0], explodeGroup: 1, massKg: 5.9,
  }),
  c('B_Pillar_R', 'B-pillar — right', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'R', region: 'C1', material: 'Hot-stamped steel', manufacturingProcess: 'Hot stamping',
    explodeDir: [0.7, 1, 0], explodeGroup: 1, massKg: 5.9,
  }),
  c('C_Pillar_L', 'C-pillar — left', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'L', region: 'R1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [-0.7, 1, 0], explodeGroup: 1, massKg: 4.2,
  }),
  c('C_Pillar_R', 'C-pillar — right', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'R', region: 'R1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0.7, 1, 0], explodeGroup: 1, massKg: 4.2,
  }),
  c('RoofRail_L', 'Roof rail — left', BIW, GRP_BIW_CELL, 5, 'rail', {
    side: 'L', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped + spot welded',
    explodeDir: [-0.5, 1, 0], explodeGroup: 1, massKg: 3.6,
  }),
  c('RoofRail_R', 'Roof rail — right', BIW, GRP_BIW_CELL, 5, 'rail', {
    side: 'R', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped + spot welded',
    explodeDir: [0.5, 1, 0], explodeGroup: 1, massKg: 3.6,
  }),
  c('RoofCrossMember_1', 'Roof cross-member 1', BIW, GRP_BIW_CELL, 5, 'beam', {
    side: 'CENTER', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 1.4,
  }),
  c('RoofCrossMember_2', 'Roof cross-member 2', BIW, GRP_BIW_CELL, 5, 'beam', {
    side: 'CENTER', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 1.4,
  }),
  c('RoofCrossMember_3', 'Roof cross-member 3', BIW, GRP_BIW_CELL, 5, 'beam', {
    side: 'CENTER', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 1.4,
  }),
  c('Rocker_L', 'Rocker / side sill — left', BIW, GRP_BIW_CELL, 10, 'rail', {
    side: 'L', region: 'C1', material: 'Hot-stamped steel', manufacturingProcess: 'Boxed section, laser welded',
    explodeDir: [-0.8, 0, 0], explodeGroup: 1, massKg: 8.1,
  }),
  c('Rocker_R', 'Rocker / side sill — right', BIW, GRP_BIW_CELL, 10, 'rail', {
    side: 'R', region: 'C1', material: 'Hot-stamped steel', manufacturingProcess: 'Boxed section, laser welded',
    explodeDir: [0.8, 0, 0], explodeGroup: 1, massKg: 8.1,
  }),
  c('DoorRing_L', 'Door ring — left', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'L', region: 'C1', material: 'Steel weld assembly', manufacturingProcess: 'Spot welded ring',
    explodeDir: [-0.6, 0.6, 0], explodeGroup: 1, massKg: 4.7,
  }),
  c('DoorRing_R', 'Door ring — right', BIW, GRP_BIW_CELL, 5, 'strut', {
    side: 'R', region: 'C1', material: 'Steel weld assembly', manufacturingProcess: 'Spot welded ring',
    explodeDir: [0.6, 0.6, 0], explodeGroup: 1, massKg: 4.7,
  }),
  c('DashCrossMember', 'Dashboard cross member', BIW, GRP_BIW_CELL, 5, 'beam', {
    side: 'CENTER', region: 'F1', material: 'Steel tube', manufacturingProcess: 'Hydroformed',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 2.8,
  }),
  c('SeatCrossMember_Front', 'Seat cross-member — front', BIW, GRP_BIW_CELL, 9, 'beam', {
    side: 'CENTER', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 1.9,
  }),
  c('SeatCrossMember_Rear', 'Seat cross-member — rear', BIW, GRP_BIW_CELL, 9, 'beam', {
    side: 'CENTER', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 1.9,
  }),

  c('FrontFloor', 'Front floor pan', BIW, GRP_BIW_FLOOR, 6, 'panel', {
    side: 'CENTER', region: 'C1', material: 'Steel sheet with pressed beads', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 9.8,
  }),
  c('RearFloor', 'Rear floor pan', BIW, GRP_BIW_FLOOR, 6, 'panel', {
    side: 'CENTER', region: 'C1', material: 'Steel sheet with pressed beads', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 8.6,
  }),
  c('CenterTunnel', 'Centre tunnel / flat-floor hump', BIW, GRP_BIW_FLOOR, 6, 'panel', {
    side: 'CENTER', region: 'C1', material: 'Steel sheet', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 2.1,
  }),
  c('BatteryProtectionRail_L', 'Battery protection rail — left', BIW, GRP_BIW_FLOOR, 10, 'rail', {
    side: 'L', region: 'B1', material: 'Extruded aluminium', manufacturingProcess: 'Extrusion + riveted',
    explodeDir: [-0.5, 1, 0], explodeGroup: 1, massKg: 5.4,
  }),
  c('BatteryProtectionRail_R', 'Battery protection rail — right', BIW, GRP_BIW_FLOOR, 10, 'rail', {
    side: 'R', region: 'B2', material: 'Extruded aluminium', manufacturingProcess: 'Extrusion + riveted',
    explodeDir: [0.5, 1, 0], explodeGroup: 1, massKg: 5.4,
  }),
  c('CrossMember_Front', 'Floor cross-member — front', BIW, GRP_BIW_FLOOR, 9, 'beam', {
    side: 'CENTER', region: 'B1', material: 'High-strength steel', manufacturingProcess: 'Stamped + flanged',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 2.6,
  }),
  c('CrossMember_Center_1', 'Floor cross-member — centre 1', BIW, GRP_BIW_FLOOR, 9, 'beam', {
    side: 'CENTER', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped + flanged',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 2.6,
  }),
  c('CrossMember_Center_2', 'Floor cross-member — centre 2', BIW, GRP_BIW_FLOOR, 9, 'beam', {
    side: 'CENTER', region: 'C1', material: 'High-strength steel', manufacturingProcess: 'Stamped + flanged',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 2.6,
  }),
  c('CrossMember_Rear', 'Floor cross-member — rear', BIW, GRP_BIW_FLOOR, 9, 'beam', {
    side: 'CENTER', region: 'R1', material: 'High-strength steel', manufacturingProcess: 'Stamped + flanged',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 2.6,
  }),

  c('RearLongitudinal_L', 'Rear longitudinal — left', BIW, GRP_BIW_REAR, 10, 'rail', {
    side: 'L', region: 'R1', material: 'High-strength steel', manufacturingProcess: 'Stamped box-section',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 5.2,
  }),
  c('RearLongitudinal_R', 'Rear longitudinal — right', BIW, GRP_BIW_REAR, 10, 'rail', {
    side: 'R', region: 'R1', material: 'High-strength steel', manufacturingProcess: 'Stamped box-section',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 5.2,
  }),
  c('RearCrashBeam', 'Rear crash beam', BIW, GRP_BIW_REAR, 5, 'beam', {
    side: 'CENTER', region: 'R1', material: 'Hot-stamped steel', manufacturingProcess: 'Hot stamping',
    explodeDir: [0, 0, 1], explodeGroup: 1, massKg: 2.9,
  }),
  c('RearFloorCrossMember', 'Rear floor cross-member', BIW, GRP_BIW_REAR, 9, 'beam', {
    side: 'CENTER', region: 'R1', material: 'High-strength steel', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 1, massKg: 2.2,
  }),
  c('Wheelhouse_L', 'Rear wheelhouse — left', BIW, GRP_BIW_REAR, 5, 'panel', {
    side: 'L', region: 'R1', material: 'Steel', manufacturingProcess: 'Stamped',
    explodeDir: [-1, 0, 0], explodeGroup: 1, massKg: 2.7,
  }),
  c('Wheelhouse_R', 'Rear wheelhouse — right', BIW, GRP_BIW_REAR, 5, 'panel', {
    side: 'R', region: 'R1', material: 'Steel', manufacturingProcess: 'Stamped',
    explodeDir: [1, 0, 0], explodeGroup: 1, massKg: 2.7,
  }),
  c('SuspensionTower_FL', 'Suspension load area — front left', BIW, GRP_BIW_REAR, 5, 'panel', {
    side: 'L', region: 'F1', material: 'Steel doubler plate', manufacturingProcess: 'Stamped + welded',
    explodeDir: [-0.5, 1, 0], explodeGroup: 1, massKg: 1.2,
  }),
  c('SuspensionTower_FR', 'Suspension load area — front right', BIW, GRP_BIW_REAR, 5, 'panel', {
    side: 'R', region: 'F1', material: 'Steel doubler plate', manufacturingProcess: 'Stamped + welded',
    explodeDir: [0.5, 1, 0], explodeGroup: 1, massKg: 1.2,
  }),
  c('SuspensionTower_RL', 'Suspension load area — rear left', BIW, GRP_BIW_REAR, 5, 'panel', {
    side: 'L', region: 'R1', material: 'Steel doubler plate', manufacturingProcess: 'Stamped + welded',
    explodeDir: [-0.5, 1, 0], explodeGroup: 1, massKg: 1.1,
  }),
  c('SuspensionTower_RR', 'Suspension load area — rear right', BIW, GRP_BIW_REAR, 5, 'panel', {
    side: 'R', region: 'R1', material: 'Steel doubler plate', manufacturingProcess: 'Stamped + welded',
    explodeDir: [0.5, 1, 0], explodeGroup: 1, massKg: 1.1,
  }),

  /* ------------------------------------------------ EV SKATEBOARD */
  c('BatteryPack_Tray', 'Battery pack — lower tray', SK, GRP_BATTERY, 7, 'pack', {
    side: 'CENTER', region: 'C1', material: 'Cast aluminium tray', manufacturingProcess: 'HPDC + machined',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 42.0,
  }),
  c('BatteryPack_Cover', 'Battery pack — upper cover', SK, GRP_BATTERY, 7, 'pack', {
    side: 'CENTER', region: 'C1', material: 'Steel / composite cover', manufacturingProcess: 'Stamped',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 14.0,
  }),
  c('BatteryPack_SideL', 'Pack side extrusion — left', SK, GRP_BATTERY, 7, 'rail', {
    side: 'L', region: 'B1', material: 'Aluminium side extrusion', manufacturingProcess: 'Extruded',
    explodeDir: [-1, 0, 0], explodeGroup: 2, massKg: 6.8,
  }),
  c('BatteryPack_SideR', 'Pack side extrusion — right', SK, GRP_BATTERY, 7, 'rail', {
    side: 'R', region: 'B2', material: 'Aluminium side extrusion', manufacturingProcess: 'Extruded',
    explodeDir: [1, 0, 0], explodeGroup: 2, massKg: 6.8,
  }),
  c('BatteryPack_XF', 'Pack cross-member — front', SK, GRP_BATTERY, 7, 'beam', {
    side: 'CENTER', region: 'B1', material: 'Aluminium extrusion', manufacturingProcess: 'Extruded',
    explodeDir: [0, 0, -1], explodeGroup: 2, massKg: 3.2,
  }),
  c('BatteryPack_XR', 'Pack cross-member — rear', SK, GRP_BATTERY, 7, 'beam', {
    side: 'CENTER', region: 'B3', material: 'Aluminium extrusion', manufacturingProcess: 'Extruded',
    explodeDir: [0, 0, 1], explodeGroup: 2, massKg: 3.2,
  }),
  c('BatteryModuleRail_L', 'Internal module rail — left', SK, GRP_BATTERY, 8, 'rail', {
    side: 'L', material: 'Aluminium section', manufacturingProcess: 'Extruded',
    explodeDir: [-1, 0, 0], explodeGroup: 2, massKg: 1.8,
  }),
  c('BatteryModuleRail_R', 'Internal module rail — right', SK, GRP_BATTERY, 8, 'rail', {
    side: 'R', material: 'Aluminium section', manufacturingProcess: 'Extruded',
    explodeDir: [1, 0, 0], explodeGroup: 2, massKg: 1.8,
  }),
  c('Module_01', 'Battery module 01', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 25.4,
  }),
  c('Module_02', 'Battery module 02', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 25.4,
  }),
  c('Module_03', 'Battery module 03', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 25.4,
  }),
  c('Module_04', 'Battery module 04', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 25.4,
  }),
  c('Module_05', 'Battery module 05', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 25.4,
  }),
  c('Module_06', 'Battery module 06', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 19.0,
  }),
  c('Module_07', 'Battery module 07', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 19.0,
  }),
  c('Module_08', 'Battery module 08', SK, GRP_BATTERY, 8, 'pack', {
    side: 'CENTER', material: 'Li-ion module housing', manufacturingProcess: 'Cell → module assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 19.0,
    description: 'Battery module 08 of 8. The supplied parametric definition specifies MODULE_CHANNEL_COUNT = 8 internal partition channels; channel count is taken from that definition, module internals remain VERIFIED.',
  }),
  c('BMS', 'Battery management system', SK, GRP_BATTERY, 8, 'electronics', {
    side: 'CENTER', material: 'PCB in enclosure', manufacturingProcess: 'SMT assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.1,
  }),
  c('HVJunctionBox', 'HV junction box', SK, GRP_BATTERY, 8, 'electronics', {
    side: 'CENTER', material: 'ABS enclosure, HV busbars', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 2.4,
  }),
  c('ServiceDisconnect', 'Service disconnect', SK, GRP_BATTERY, 8, 'box', {
    side: 'CENTER', material: 'Interlock switch assembly', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.5,
  }),
  c('CoolingPlate', 'Cooling plate', SK, GRP_BATTERY, 7, 'panel', {
    side: 'CENTER', material: 'Aluminium cold plate', manufacturingProcess: 'Vacuum brazed',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 6.0,
  }),
  c('CoolantInlet', 'Coolant inlet', SK, GRP_BATTERY, 7, 'cylinder', {
    side: 'CENTER', material: 'Composite fitting', manufacturingProcess: 'Moulded',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 0.1,
  }),
  c('CoolantOutlet', 'Coolant outlet', SK, GRP_BATTERY, 7, 'cylinder', {
    side: 'CENTER', material: 'Composite fitting', manufacturingProcess: 'Moulded',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 0.1,
  }),
  c('PackVent', 'Pack vent elements', SK, GRP_BATTERY, 7, 'box', {
    side: 'CENTER', material: 'Membrane vents', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 0.3,
  }),
  c('Mount_BFL', 'Battery mount — front left', SK, GRP_BATTERY, 7, 'box', {
    side: 'L', region: 'B1', material: 'Aluminium bracket', manufacturingProcess: 'Machined',
    explodeDir: [-0.6, 1, 0], explodeGroup: 2, massKg: 0.9,
  }),
  c('Mount_BFR', 'Battery mount — front right', SK, GRP_BATTERY, 7, 'box', {
    side: 'R', region: 'B2', material: 'Aluminium bracket', manufacturingProcess: 'Machined',
    explodeDir: [0.6, 1, 0], explodeGroup: 2, massKg: 0.9,
  }),
  c('Mount_BRL', 'Battery mount — rear left', SK, GRP_BATTERY, 7, 'box', {
    side: 'L', region: 'B3', material: 'Aluminium bracket', manufacturingProcess: 'Machined',
    explodeDir: [-0.6, 1, 0], explodeGroup: 2, massKg: 0.9,
  }),
  c('Mount_BRR', 'Battery mount — rear right', SK, GRP_BATTERY, 7, 'box', {
    side: 'R', region: 'B4', material: 'Aluminium bracket', manufacturingProcess: 'Machined',
    explodeDir: [0.6, 1, 0], explodeGroup: 2, massKg: 0.9,
  }),
  c('Mount_ML', 'Battery mid-mount — left', SK, GRP_BATTERY, 7, 'box', {
    side: 'L', material: 'Aluminium bracket', manufacturingProcess: 'Machined',
    explodeDir: [-0.6, 1, 0], explodeGroup: 2, massKg: 0.7,
  }),
  c('Mount_MR', 'Battery mid-mount — right', SK, GRP_BATTERY, 7, 'box', {
    side: 'R', material: 'Aluminium bracket', manufacturingProcess: 'Machined',
    explodeDir: [0.6, 1, 0], explodeGroup: 2, massKg: 0.7,
  }),

  c('TractionMotor', 'Front traction motor', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'CENTER', region: 'F1', material: 'Electric machine, oil cooled', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 72.0,
  }),
  c('DriveInverter', 'Drive inverter (power stage)', SK, GRP_DRIVE, 15, 'electronics', {
    side: 'CENTER', region: 'F1', material: 'Power electronics enclosure', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 11.2,
  }),
  c('GearReduction', 'Gear reduction unit', SK, GRP_DRIVE, 14, 'box', {
    side: 'CENTER', material: 'Gearbox housing', manufacturingProcess: 'Ductile iron casting',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 18.0,
  }),
  c('Differential', 'Differential', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'CENTER', material: 'Final drive assembly', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 8.4,
  }),
  c('Halfshaft_L', 'Halfshaft — left', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'L', material: 'Shaft + CV joints', manufacturingProcess: 'Forged + machined',
    explodeDir: [-0.8, 0, 0], explodeGroup: 3, massKg: 4.6,
  }),
  c('Halfshaft_R', 'Halfshaft — right', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'R', material: 'Shaft + CV joints', manufacturingProcess: 'Forged + machined',
    explodeDir: [0.8, 0, 0], explodeGroup: 3, massKg: 4.6,
  }),
  c('MotorMount_L', 'Motor mount — left', SK, GRP_DRIVE, 14, 'box', {
    side: 'L', material: 'Cast bracket + bush', manufacturingProcess: 'Casting',
    explodeDir: [-0.5, 1, 0], explodeGroup: 2, massKg: 1.6,
  }),
  c('MotorMount_R', 'Motor mount — right', SK, GRP_DRIVE, 14, 'box', {
    side: 'R', material: 'Cast bracket + bush', manufacturingProcess: 'Casting',
    explodeDir: [0.5, 1, 0], explodeGroup: 2, massKg: 1.6,
  }),

  c('OnBoardCharger', 'On-board charger (OBC)', SK, GRP_PWR, 15, 'electronics', {
    side: 'CENTER', region: 'R1', material: 'Power electronics enclosure', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 7.8,
  }),
  c('DCDCConverter', 'DC-DC converter', SK, GRP_PWR, 15, 'electronics', {
    side: 'CENTER', material: 'Power electronics enclosure', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 3.1,
  }),

  c('HVBus_Motor', 'HV bus — battery → inverter', SK, GRP_HV, 17, 'harness', {
    side: 'CENTER', region: 'F1', material: 'Orange shielded HV cables', manufacturingProcess: 'Cable assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 2.4,
  }),
  c('HVBus_Charger', 'HV bus — battery → OBC', SK, GRP_HV, 17, 'harness', {
    side: 'CENTER', material: 'Orange shielded HV cables', manufacturingProcess: 'Cable assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.4,
  }),
  c('HVBus_DCDC', 'HV bus — battery → DC-DC', SK, GRP_HV, 17, 'harness', {
    side: 'CENTER', material: 'Orange shielded HV cables', manufacturingProcess: 'Cable assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.1,
  }),
  /* ---- rear e-drive module (supplied exploded-assembly definition) ----
     Mirrors the front unit at the rear axle, with the motor and
     gearbox reduced to 0.9 / 0.85 of the front unit. */
  c('RearTractionMotor', 'Rear traction motor (PMSM)', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'CENTER', region: 'R1', material: 'PMSM, R135 x L360 (supplied exploded definition)', manufacturingProcess: 'Assembled (supplied exploded definition)',
    explodeDir: [0, 0, -1], explodeGroup: 4, massKg: 34.0,
    description: 'Rear transverse drive motor, 0.9x the front unit radius, mounted 60 mm ahead of the rear axle centreline per the supplied exploded-assembly definition.',
  }),
  c('RearGearReduction', 'Rear reduction gearbox', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'CENTER', region: 'R1', material: 'Planetary gearbox, R144.5 x L176 (supplied exploded definition)', manufacturingProcess: 'Assembled (supplied exploded definition)',
    explodeDir: [0, 0, -1], explodeGroup: 4, massKg: 12.0,
  }),
  c('RearDriveInverter', 'Rear drive inverter', SK, GRP_DRIVE, 14, 'electronics', {
    side: 'CENTER', region: 'R1', material: 'Power electronics enclosure (supplied exploded definition)', manufacturingProcess: 'Assembled (supplied exploded definition)',
    explodeDir: [0, 0, -1], explodeGroup: 4, massKg: 8.0,
  }),
  c('RearHalfshaft_L', 'Rear half-shaft — left', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'L', region: 'R1', material: 'R22 half-shaft (supplied definition)', manufacturingProcess: 'Spline + forged',
    explodeDir: [-1, 0, -0.2], explodeGroup: 3, massKg: 4.6,
  }),
  c('RearHalfshaft_R', 'Rear half-shaft — right', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'R', region: 'R1', material: 'R22 half-shaft (supplied definition)', manufacturingProcess: 'Spline + forged',
    explodeDir: [1, 0, -0.2], explodeGroup: 3, massKg: 4.6,
  }),

  /* ---- front cooling module (supplied exploded-assembly definition) ----
     Radiator slab 30 x 480 x 380 mm plus a R170 x 60 fan shroud,
     floating ahead of the nose in the exploded presentation. */
  c('RadiatorModule', 'Front radiator / cooling module', TH, 'SYS_THERMAL', 16, 'panel', {
    side: 'CENTER', region: 'F1', material: 'Aluminium radiator core, 480 x 380 x 30 mm (supplied exploded definition)', manufacturingProcess: 'Brazed core + tanks (supplied exploded definition)',
    explodeDir: [0, 0, 1], explodeGroup: 4, massKg: 6.8,
    description: 'Front cooling module, 480 x 380 x 30 mm radiator core with a R170 x 60 mm fan, per the supplied exploded-assembly definition.',
  }),
  c('CoolingFan', 'Cooling fan + shroud', TH, 'SYS_THERMAL', 16, 'cylinder', {
    side: 'CENTER', region: 'F1', material: 'Electric fan, R170 x 60 mm (supplied exploded definition)', manufacturingProcess: 'Assembled (supplied exploded definition)',
    explodeDir: [0, 0, 1], explodeGroup: 4, massKg: 2.4,
  }),

  c('ChargePort', 'Charge port / inlet', SK, 'SYS_SKATEBOARD', 17, 'box', {
    side: 'L', region: 'F1', material: 'Charge inlet assembly', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 1.3,
  }),
  c('HVBus_Pack', 'HV busbar - in-pack distribution', SK, GRP_HV, 17, 'harness', {
    side: 'CENTER', material: 'Copper busbar, insulated', manufacturingProcess: 'Busbar assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.8,
  }),

  /* ---- structural chassis (supplied parametric definition) ----
     CHASSIS_WIDTH 1700 mm, rails 90 x 140 mm with 4 mm wall,
     overhanging 350 mm front / 400 mm rear; three 70 x 120 mm
     crossmembers with subframes 300 mm outboard of each axle.
     Values below are that definition converted to metres. */
  c('ChassisRail_L', 'Chassis rail - left', SK, 'SYS_SKATEBOARD', 6, 'rail', {
    side: 'L', material: 'Hydroformed hollow steel rail, 90 x 140 x 4 mm (supplied definition)',
    manufacturingProcess: 'Hydroforming (supplied definition)',
    explodeDir: [-1, 0, 0], explodeGroup: 2, massKg: 9.6,
    description: 'Longitudinal hydroformed rail at x = -805 mm, section 90 x 140 mm, 4 mm wall, spanning 350 mm ahead of the front axle to 400 mm behind the rear axle. Dimensions from the supplied parametric definition; that definition is explicitly not validated for fabrication, structural or crash-worthiness use.',
  }),
  c('ChassisRail_R', 'Chassis rail - right', SK, 'SYS_SKATEBOARD', 6, 'rail', {
    side: 'R', material: 'Hydroformed hollow steel rail, 90 x 140 x 4 mm (supplied definition)',
    manufacturingProcess: 'Hydroforming (supplied definition)',
    explodeDir: [1, 0, 0], explodeGroup: 2, massKg: 9.6,
  }),
  c('FrontSubframe', 'Front subframe', SK, 'SYS_SKATEBOARD', 6, 'beam', {
    side: 'CENTER', region: 'F1', material: 'Hollow crossmember 70 x 120 x 4 mm (supplied definition)',
    manufacturingProcess: 'Hydroforming (supplied definition)',
    explodeDir: [0, 0, 1], explodeGroup: 2, massKg: 5.2,
    description: 'Full-width crossmember 300 mm ahead of the front axle centreline, per the supplied definition.',
  }),
  c('Crossmember_Centre', 'Centre crossmember', SK, 'SYS_SKATEBOARD', 6, 'beam', {
    side: 'CENTER', material: 'Hollow crossmember 70 x 120 x 4 mm (supplied definition)',
    manufacturingProcess: 'Hydroforming (supplied definition)',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 4.8,
    description: 'Full-width crossmember at the wheelbase midpoint, per the supplied definition.',
  }),
  c('RearSubframe', 'Rear subframe', SK, 'SYS_SKATEBOARD', 6, 'beam', {
    side: 'CENTER', region: 'R1', material: 'Hollow crossmember 70 x 120 x 4 mm (supplied definition)',
    manufacturingProcess: 'Hydroforming (supplied definition)',
    explodeDir: [0, 0, -1], explodeGroup: 2, massKg: 5.2,
    description: 'Full-width crossmember 300 mm behind the rear axle centreline, per the supplied definition.',
  }),

  /* ---- bench-test hardware from the supplied definition ---- */
  c('AuxMotor', 'Auxiliary excitation motor', SK, GRP_DRIVE, 14, 'cylinder', {
    side: 'CENTER', region: 'F1', material: 'PMSM, R55 x L140 mm (supplied definition)', manufacturingProcess: 'Assembled (supplied definition)',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 3.4,
    description: 'Bench excitation motor used to drive the chassis during validation. R55 x 140 mm per the supplied definition.',
  }),
  c('LC1_Fixture', 'LC1 dummy-load fixture', SK, GRP_DRIVE, 14, 'box', {
    side: 'CENTER', region: 'F1', material: 'Dummy load enclosure 180 x 90 x 70 mm (supplied definition)', manufacturingProcess: 'Assembled (supplied definition)',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 2.1,
    description: 'LC1 dummy-load test fixture mounted ahead of the front subframe, per the supplied definition.',
  }),

  /* ---- rear multi-link hardware ---- */
  c('LowerLink_RL', 'Rear lower link - left', SK, 'SYS_SKATEBOARD', 7, 'strut', {
    side: 'L', region: 'R1', material: 'Forged steel link', manufacturingProcess: 'Forged + machined',
    explodeDir: [-1, 0, 0], explodeGroup: 2, massKg: 2.2,
  }),
  c('LowerLink_RR', 'Rear lower link - right', SK, 'SYS_SKATEBOARD', 7, 'strut', {
    side: 'R', region: 'R1', material: 'Forged steel link', manufacturingProcess: 'Forged + machined',
    explodeDir: [1, 0, 0], explodeGroup: 2, massKg: 2.2,
  }),
  c('UpperLink_RL', 'Rear upper link - left', SK, 'SYS_SKATEBOARD', 7, 'strut', {
    side: 'L', region: 'R1', material: 'Forged steel link', manufacturingProcess: 'Forged + machined',
    explodeDir: [-1, 0, 0], explodeGroup: 2, massKg: 1.4,
  }),
  c('UpperLink_RR', 'Rear upper link - right', SK, 'SYS_SKATEBOARD', 7, 'strut', {
    side: 'R', region: 'R1', material: 'Forged steel link', manufacturingProcess: 'Forged + machined',
    explodeDir: [1, 0, 0], explodeGroup: 2, massKg: 1.4,
  }),
  c('StrutTopMount_FL', 'Strut top mount - front left', SK, 'SYS_SKATEBOARD', 7, 'cylinder', {
    side: 'L', region: 'F1', material: 'Steel top mount with bonded bushing', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 1, 0], explodeGroup: 2, massKg: 0.9,
    description: 'Tower height 350 mm and envelope radius 28 mm are taken from the supplied definition; the mount body itself is VERIFIED.',
  }),
  c('StrutTopMount_FR', 'Strut top mount - front right', SK, 'SYS_SKATEBOARD', 7, 'cylinder', {
    side: 'R', region: 'F1', material: 'Steel top mount with bonded bushing', manufacturingProcess: 'Assembled',
    explodeDir: [1, 1, 0], explodeGroup: 2, massKg: 0.9,
  }),
  c('StrutTopMount_RL', 'Strut top mount - rear left', SK, 'SYS_SKATEBOARD', 7, 'cylinder', {
    side: 'L', region: 'R1', material: 'Steel top mount with bonded bushing', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 1, 0], explodeGroup: 2, massKg: 0.9,
  }),
  c('StrutTopMount_RR', 'Strut top mount - rear right', SK, 'SYS_SKATEBOARD', 7, 'cylinder', {
    side: 'R', region: 'R1', material: 'Steel top mount with bonded bushing', manufacturingProcess: 'Assembled',
    explodeDir: [1, 1, 0], explodeGroup: 2, massKg: 0.9,
  }),

  /* ---- chassis-mounted structural-health instrumentation ----
     IMU housings 30 x 22 x 12 mm, strain enclosures 40 x 26 x 16 mm
     with an 18 x 10 x 3 mm mounting tab, harness R6 mm - all from
     the supplied definition. */
  c('IMU_Housing_A1', 'IMU housing A1 - front rail', SE, 'SYS_SENSORS', 19, 'sensor', {
    side: 'L', region: 'F1', material: 'MPU-6050 housing 30 x 22 x 12 mm (supplied definition)', manufacturingProcess: 'PCB in enclosure (supplied definition)',
    explodeDir: [-1, 1, 0], explodeGroup: 3, massKg: 0.03,
    description: 'Mounted on the left chassis rail 40 mm inboard of the front axle, seated on the rail top face. Position from the supplied definition.',
  }),
  c('IMU_Housing_A2', 'IMU housing A2 - rear rail', SE, 'SYS_SENSORS', 19, 'sensor', {
    side: 'L', region: 'R1', material: 'MPU-6050 housing 30 x 22 x 12 mm (supplied definition)', manufacturingProcess: 'PCB in enclosure (supplied definition)',
    explodeDir: [-1, 1, 0], explodeGroup: 3, massKg: 0.03,
    description: 'Mounted on the left chassis rail 40 mm inboard of the rear axle, seated on the rail top face. Position from the supplied definition.',
  }),
  c('SG_Housing_SG1', 'Strain-gauge enclosure SG1', SE, 'SYS_SENSORS', 19, 'sensor', {
    side: 'R', region: 'F1', material: 'Strain-gauge enclosure 40 x 26 x 16 mm (supplied definition)', manufacturingProcess: 'Bonded to rail (supplied definition)',
    explodeDir: [1, 1, 0], explodeGroup: 3, massKg: 0.05,
    description: 'Bonded to the right chassis rail at 35 % of the wheelbase from the front axle. Housing and mounting-tab sizes are from the supplied definition.',
  }),
  c('SG_Housing_SG2', 'Strain-gauge enclosure SG2', SE, 'SYS_SENSORS', 19, 'sensor', {
    side: 'R', region: 'C1', material: 'Strain-gauge enclosure 40 x 26 x 16 mm (supplied definition)', manufacturingProcess: 'Bonded to rail (supplied definition)',
    explodeDir: [1, 1, 0], explodeGroup: 3, massKg: 0.05,
    description: 'Bonded to the right chassis rail at 68 % of the wheelbase from the front axle; this is the harness origin to the SHIELD enclosure. Position from the supplied definition.',
  }),

  /* ---- SHIELD external IP67 instrumentation enclosure ----
     300 x 200 x 120 mm shell with a 35 mm hinged lid and 4 mm wall,
     mounted 800 mm outboard of the chassis edge; OLED 34 x 18,
     buzzer R8, multi-pin bulkhead R12 x 22. All from the supplied
     definition.  The controller box is shown detached from the
     vehicle because it is a bench / test instrument, not part of
     the car. */
  c('ShieldBox_Shell', 'SHIELD enclosure shell', SE, 'SYS_SHIELD_BOX', 20, 'box', {
    side: 'L', material: 'IP67 ABS enclosure, 300 x 200 x 120 mm, 4 mm wall (supplied definition)', manufacturingProcess: 'Injection moulded (supplied definition)',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 1.1,
    description: 'Detached SHIELD instrumentation controller, mounted 800 mm outboard of the chassis edge. Envelope, wall and standoff are from the supplied definition; the internal electronics stack is VERIFIED.',
  }),
  c('ShieldBox_Lid', 'SHIELD enclosure lid', SE, 'SYS_SHIELD_BOX', 20, 'box', {
    side: 'L', material: 'Hinged lid, 35 mm (supplied definition)', manufacturingProcess: 'Injection moulded (supplied definition)',
    explodeDir: [-1, 1, 0], explodeGroup: 3, massKg: 0.4,
  }),
  c('ShieldBox_Bulkhead', 'SHIELD bulkhead connector', SE, 'SYS_SHIELD_BOX', 20, 'cylinder', {
    side: 'CENTER', material: 'Multi-pin circular connector, R12 x 22 mm (supplied definition)', manufacturingProcess: 'Assembled (supplied definition)',
    explodeDir: [0, 0, 1], explodeGroup: 3, massKg: 0.12,
  }),
  c('ShieldBox_Panel', 'SHIELD control panel - OLED / LEDs / buzzer', SE, 'SYS_SHIELD_BOX', 20, 'box', {
    side: 'CENTER', material: 'OLED 34 x 18 mm cutout, 3 x LED R2.5, buzzer R8 (supplied definition)', manufacturingProcess: 'Assembled (supplied definition)',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 0.06,
  }),
  c('ShieldBox_Electronics', 'SHIELD electronics stack', SE, 'SYS_SHIELD_BOX', 20, 'electronics', {
    side: 'CENTER', material: 'Breadboard, ESP32, 3 x HX711, 2 x bridge, ADS1115, USB', manufacturingProcess: 'SMT / breadboard assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.28,
    description: 'Internal stack: breadboard 165 x 55 mm, ESP32, 3 x HX711 load-cell amplifiers, 2 x bridge modules, ADS1115 ADC and a USB module. Envelope is from the supplied definition; component selection is VERIFIED.',
  }),
  c('SensorHarness', 'Low-voltage sensor harness', SE, 'SYS_SHIELD_BOX', 20, 'harness', {
    side: 'CENTER', material: 'Conduit R6 mm (supplied definition)', manufacturingProcess: 'Assembled (supplied definition)',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.35,
    description: 'Low-voltage harness bridging the SG2 rail enclosure to the SHIELD enclosure bulkhead connector. Conduit radius 6 mm is from the supplied definition.',
  }),

  /* ------------------------------------------------ SUSPENSION */
  c('Knuckle_FL', 'Front knuckle — left', SUS, 'SYS_SUSPENSION', 11, 'box', {
    side: 'L', material: 'Ductile iron knuckle', manufacturingProcess: 'Casting',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 5.2,
  }),
  c('Knuckle_FR', 'Front knuckle — right', SUS, 'SYS_SUSPENSION', 11, 'box', {
    side: 'R', material: 'Ductile iron knuckle', manufacturingProcess: 'Casting',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 5.2,
  }),
  c('LowerControlArm_FL', 'Lower control arm — left', SUS, 'SYS_SUSPENSION', 11, 'strut', {
    side: 'L', material: 'Steel forging', manufacturingProcess: 'Forged',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 2.8,
  }),
  c('LowerControlArm_FR', 'Lower control arm — right', SUS, 'SYS_SUSPENSION', 11, 'strut', {
    side: 'R', material: 'Steel forging', manufacturingProcess: 'Forged',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 2.8,
  }),
  c('Strut_FL', 'MacPherson strut — left', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'L', material: 'Damper assembly', manufacturingProcess: 'Assembled',
    explodeDir: [-0.6, 1, 0], explodeGroup: 3, massKg: 3.4,
  }),
  c('Strut_FR', 'MacPherson strut — right', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'R', material: 'Damper assembly', manufacturingProcess: 'Assembled',
    explodeDir: [0.6, 1, 0], explodeGroup: 3, massKg: 3.4,
  }),
  c('CoilSpring_FL', 'Coil spring — left front', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'L', material: 'Spring steel', manufacturingProcess: 'Coiled + shot peened',
    explodeDir: [-0.6, 1, 0], explodeGroup: 3, massKg: 2.2,
  }),
  c('CoilSpring_FR', 'Coil spring — right front', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'R', material: 'Spring steel', manufacturingProcess: 'Coiled + shot peened',
    explodeDir: [0.6, 1, 0], explodeGroup: 3, massKg: 2.2,
  }),
  c('StabilizerLink_FL', 'Stabilizer link — left', SUS, 'SYS_SUSPENSION', 11, 'strut', {
    side: 'L', material: 'Steel link + ball joints', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 0.3, 0], explodeGroup: 3, massKg: 0.8,
  }),
  c('StabilizerLink_FR', 'Stabilizer link — right', SUS, 'SYS_SUSPENSION', 11, 'strut', {
    side: 'R', material: 'Steel link + ball joints', manufacturingProcess: 'Assembled',
    explodeDir: [1, 0.3, 0], explodeGroup: 3, massKg: 0.8,
  }),
  c('TrailingArm_RL', 'Rear trailing arm — left', SUS, 'SYS_SUSPENSION', 11, 'strut', {
    side: 'L', material: 'Steel fabrication', manufacturingProcess: 'Welded fabrication',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 3.9,
  }),
  c('TrailingArm_RR', 'Rear trailing arm — right', SUS, 'SYS_SUSPENSION', 11, 'strut', {
    side: 'R', material: 'Steel fabrication', manufacturingProcess: 'Welded fabrication',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 3.9,
  }),
  c('CoilSpring_RL', 'Coil spring — left rear', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'L', material: 'Spring steel', manufacturingProcess: 'Coiled',
    explodeDir: [-0.6, 1, 0], explodeGroup: 3, massKg: 2.0,
  }),
  c('CoilSpring_RR', 'Coil spring — right rear', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'R', material: 'Spring steel', manufacturingProcess: 'Coiled',
    explodeDir: [0.6, 1, 0], explodeGroup: 3, massKg: 2.0,
  }),
  c('Damper_RL', 'Rear damper — left', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'L', material: 'Hydraulic damper', manufacturingProcess: 'Assembled',
    explodeDir: [-0.6, 1, 0], explodeGroup: 3, massKg: 1.9,
  }),
  c('Damper_RR', 'Rear damper — right', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'R', material: 'Hydraulic damper', manufacturingProcess: 'Assembled',
    explodeDir: [0.6, 1, 0], explodeGroup: 3, massKg: 1.9,
  }),
  c('Bushing_FL', 'Bushings — left front', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'L', material: 'Rubber bushing', manufacturingProcess: 'Bonded',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 0.3,
  }),
  c('Bushing_FR', 'Bushings — right front', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'R', material: 'Rubber bushing', manufacturingProcess: 'Bonded',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 0.3,
  }),
  c('Bushing_RL', 'Bushings — left rear', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'L', material: 'Rubber bushing', manufacturingProcess: 'Bonded',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 0.3,
  }),
  c('Bushing_RR', 'Bushings — right rear', SUS, 'SYS_SUSPENSION', 11, 'cylinder', {
    side: 'R', material: 'Rubber bushing', manufacturingProcess: 'Bonded',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 0.3,
  }),

  /* ------------------------------------------------ STEERING */
  c('SteeringWheel', 'Steering wheel', ST, 'SYS_STEERING', 12, 'wheel', {
    side: 'CENTER', material: 'Leather-wrapped + switches', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 3.2,
  }),
  c('SteeringColumn', 'Steering column', ST, 'SYS_STEERING', 12, 'cylinder', {
    side: 'CENTER', material: 'Steel column + jacket', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 4.8,
  }),
  c('EPSMotor', 'EPS motor', ST, 'SYS_STEERING', 12, 'cylinder', {
    side: 'CENTER', material: 'Column EPS motor', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 3.3,
  }),
  c('SteeringRack', 'Steering rack', ST, 'SYS_STEERING', 12, 'beam', {
    side: 'CENTER', region: 'F1', material: 'Steel housing + pinion', manufacturingProcess: 'Machined',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 6.4,
  }),
  c('TieRod_L', 'Tie rod — left', ST, 'SYS_STEERING', 12, 'strut', {
    side: 'L', material: 'Steel tie rod', manufacturingProcess: 'Forged ends + tube',
    explodeDir: [-1, 0, 0], explodeGroup: 2, massKg: 0.9,
  }),
  c('TieRod_R', 'Tie rod — right', ST, 'SYS_STEERING', 12, 'strut', {
    side: 'R', material: 'Steel tie rod', manufacturingProcess: 'Forged ends + tube',
    explodeDir: [1, 0, 0], explodeGroup: 2, massKg: 0.9,
  }),

  /* ------------------------------------------------ BRAKES / WHEELS */
  c('Wheel_FL', 'Wheel rim — front left', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'L', material: 'Aluminium alloy rim', manufacturingProcess: 'Low-pressure cast',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 10.4,
  }),
  c('Tire_FL', 'Tire — front left', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'L', material: 'Radial tire', manufacturingProcess: 'Vulcanised',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 11.2,
  }),
  c('Hub_FL', 'Wheel hub — front left', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'L', material: 'Steel hub + bearings', manufacturingProcess: 'Machined',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 3.4,
  }),
  c('Disc_FL', 'Brake disc — front left', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'L', material: 'Cast iron ventilated disc', manufacturingProcess: 'Cast + machined',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 7.2,
  }),
  c('Caliper_FL', 'Brake caliper — front left', BK, 'SYS_BRAKES', 13, 'box', {
    side: 'L', material: 'Aluminium caliper', manufacturingProcess: 'Cast',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 2.6,
  }),
  c('Wheel_FR', 'Wheel rim — front right', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'R', material: 'Aluminium alloy rim', manufacturingProcess: 'Low-pressure cast',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 10.4,
  }),
  c('Tire_FR', 'Tire — front right', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'R', material: 'Radial tire', manufacturingProcess: 'Vulcanised',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 11.2,
  }),
  c('Hub_FR', 'Wheel hub — front right', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'R', material: 'Steel hub + bearings', manufacturingProcess: 'Machined',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 3.4,
  }),
  c('Disc_FR', 'Brake disc — front right', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'R', material: 'Cast iron ventilated disc', manufacturingProcess: 'Cast + machined',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 7.2,
  }),
  c('Caliper_FR', 'Brake caliper — front right', BK, 'SYS_BRAKES', 13, 'box', {
    side: 'R', material: 'Aluminium caliper', manufacturingProcess: 'Cast',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 2.6,
  }),
  c('Wheel_RL', 'Wheel rim — rear left', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'L', material: 'Aluminium alloy rim', manufacturingProcess: 'Low-pressure cast',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 10.4,
  }),
  c('Tire_RL', 'Tire — rear left', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'L', material: 'Radial tire', manufacturingProcess: 'Vulcanised',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 11.2,
  }),
  c('Hub_RL', 'Wheel hub — rear left', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'L', material: 'Steel hub + bearings', manufacturingProcess: 'Machined',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 3.4,
  }),
  c('Disc_RL', 'Brake disc — rear left', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'L', material: 'Cast iron disc', manufacturingProcess: 'Cast + machined',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 5.8,
  }),
  c('Caliper_RL', 'Brake caliper — rear left', BK, 'SYS_BRAKES', 13, 'box', {
    side: 'L', material: 'Aluminium caliper', manufacturingProcess: 'Cast',
    explodeDir: [-1, 0, 0], explodeGroup: 4, massKg: 2.2,
  }),
  c('Wheel_RR', 'Wheel rim — rear right', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'R', material: 'Aluminium alloy rim', manufacturingProcess: 'Low-pressure cast',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 10.4,
  }),
  c('Tire_RR', 'Tire — rear right', BK, 'SYS_BRAKES', 13, 'wheel', {
    side: 'R', material: 'Radial tire', manufacturingProcess: 'Vulcanised',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 11.2,
  }),
  c('Hub_RR', 'Wheel hub — rear right', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'R', material: 'Steel hub + bearings', manufacturingProcess: 'Machined',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 3.4,
  }),
  c('Disc_RR', 'Brake disc — rear right', BK, 'SYS_BRAKES', 13, 'cylinder', {
    side: 'R', material: 'Cast iron disc', manufacturingProcess: 'Cast + machined',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 5.8,
  }),
  c('Caliper_RR', 'Brake caliper — rear right', BK, 'SYS_BRAKES', 13, 'box', {
    side: 'R', material: 'Aluminium caliper', manufacturingProcess: 'Cast',
    explodeDir: [1, 0, 0], explodeGroup: 4, massKg: 2.2,
  }),
  c('BrakeLines', 'Brake lines — all corners', BK, 'SYS_BRAKES', 13, 'harness', {
    side: 'CENTER', material: 'Steel tube + flexible hose', manufacturingProcess: 'Formed tube',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 1.4,
  }),
  c('ABS_WSS_FL', 'ABS wheel-speed sensor — FL', BK, 'SYS_BRAKES', 13, 'sensor', {
    side: 'L', material: 'Hall-effect sensor', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 0.08,
  }),
  c('ABS_WSS_FR', 'ABS wheel-speed sensor — FR', BK, 'SYS_BRAKES', 13, 'sensor', {
    side: 'R', material: 'Hall-effect sensor', manufacturingProcess: 'Assembled',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 0.08,
  }),
  c('ABS_WSS_RL', 'ABS wheel-speed sensor — RL', BK, 'SYS_BRAKES', 13, 'sensor', {
    side: 'L', material: 'Hall-effect sensor', manufacturingProcess: 'Assembled',
    explodeDir: [-1, 0, 0], explodeGroup: 3, massKg: 0.08,
  }),
  c('ABS_WSS_RR', 'ABS wheel-speed sensor — RR', BK, 'SYS_BRAKES', 13, 'sensor', {
    side: 'R', material: 'Hall-effect sensor', manufacturingProcess: 'Assembled',
    explodeDir: [1, 0, 0], explodeGroup: 3, massKg: 0.08,
  }),

  /* ------------------------------------------------ CABIN */
  c('InteriorTrim_Floor', 'Cabin acoustic floor carpeting', CB, 'SYS_CABIN', 3, 'panel', {
    side: 'CENTER', material: 'Carpet over molded polyurethane acoustic deadener', manufacturingProcess: 'Compression molded',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 5.4,
    description: 'Full-length molded sound-deadening cabin floor carpet pan with integrated driver heel pad and dead-pedal rest.',
  }),
  c('InteriorTrim_Headliner', 'Molded acoustic headliner', CB, 'SYS_CABIN', 3, 'panel', {
    side: 'CENTER', material: 'Multi-layer composite substrate with knitted fabric finish', manufacturingProcess: 'Thermoformed',
    explodeDir: [0, -1, 0], explodeGroup: 2, massKg: 2.2,
    description: 'Thermoformed roof headliner panel with integrated wiring channels, microphone apertures, and sun visor pivots.',
  }),
  c('InteriorTrim_Cargo', 'Rear cargo load floor & parcel shelf', CB, 'SYS_CABIN', 3, 'panel', {
    side: 'CENTER', region: 'R1', material: 'Reinforced honeycomb composite with felt lining', manufacturingProcess: 'Molded',
    explodeDir: [0, 1, -0.3], explodeGroup: 2, massKg: 3.8,
    description: 'Rear tonneau luggage parcel shelf and heavy-duty flat cargo load floor with luggage tie-down anchors.',
  }),
  c('CrossCarBeam', 'Cross-car structural beam (CCB)', CB, 'SYS_CABIN', 4, 'beam', {
    side: 'CENTER', region: 'C1', material: 'Die-cast magnesium AM60B + high-strength tubular steel', manufacturingProcess: 'High-pressure die cast + welded',
    explodeDir: [0, 1, 0.2], explodeGroup: 2, massKg: 6.8,
    description: 'Primary structural cross-car instrument panel carrier beam tying left and right A-pillars, supporting the steering column assembly and passenger airbag.',
  }),
  c('DashboardCarrier', 'Multi-tier cockpit dashboard carrier', CB, 'SYS_CABIN', 4, 'panel', {
    side: 'CENTER', region: 'C1', material: 'Soft-touch slush-molded TPO with satin metallic trim & ABS substrate', manufacturingProcess: 'Slush molded skin + foam injection',
    explodeDir: [0, 1, 0.2], explodeGroup: 2, massKg: 8.6,
    description: 'Ergonomic two-tier cockpit dashboard assembly with soft-touch upper dash, satin metallic horizontal wing, and passenger glovebox compartment.',
  }),
  c('InstrumentCluster', 'Driver 10.25-inch digital gauge cluster', CB, 'SYS_CABIN', 4, 'electronics', {
    side: 'L', region: 'C1', material: 'Full HD anti-glare IPS LCD panel with magnesium heatsink', manufacturingProcess: 'Optical bonding + automated assembly',
    explodeDir: [-0.3, 1, 0.2], explodeGroup: 2, massKg: 0.85,
    description: 'Driver instrument cluster displaying real-time speed, ADAS lane visualization, battery SOC, motor power demand, and thermal alarms.',
  }),
  c('CenterDisplay', '12.3-inch panoramic central infotainment display', CB, 'SYS_CABIN', 4, 'electronics', {
    side: 'CENTER', region: 'C1', material: 'Capacitive touch ultra-HD display with gorilla glass cover', manufacturingProcess: 'Optical bonding + automated assembly',
    explodeDir: [0, 1, 0.2], explodeGroup: 2, massKg: 1.35,
    description: 'Floating central infotainment touch display angled towards the driver, providing navigation, energy management, climate control, and digital twin telemetry.',
  }),
  c('SteeringWheel', 'Flat-bottom EV sports steering wheel', CB, 'SYS_CABIN', 4, 'wheel', {
    side: 'L', region: 'C1', material: 'Magnesium skeleton + perforated synthetic leather wrap + capacitive switches', manufacturingProcess: 'Cast core + molded foam + hand-stitched',
    explodeDir: [-0.4, 1, 0.1], explodeGroup: 2, massKg: 2.8,
    description: 'Modern flat-bottom 3-spoke sports steering wheel with thumb rests, capacitive ADAS/media switch pods, and center horn boss with SHIELD emblem.',
  }),
  c('SteeringColumn', 'Steering column shroud & control stalks', CB, 'SYS_CABIN', 4, 'cylinder', {
    side: 'L', region: 'C1', material: 'Telescopic steel column with twin multifunction control stalks & regen paddles', manufacturingProcess: 'Machined + molded shroud',
    explodeDir: [-0.4, 1, 0.1], explodeGroup: 2, massKg: 3.4,
    description: 'Adjustable steering column housing with turn-indicator/wiper stalks and regenerative braking selector paddles.',
  }),
  c('CenterConsole', 'Floating bridge center console', CB, 'SYS_CABIN', 4, 'panel', {
    side: 'CENTER', region: 'C1', material: 'Leatherette padded bridge with rotary EV shift dial & wireless charger', manufacturingProcess: 'Injection molded + wrapped',
    explodeDir: [0, 1, 0], explodeGroup: 2, massKg: 6.2,
    description: 'Floating center console bridge with knurled rotary shift-by-wire dial, EPB switch, wireless smartphone charging pad, twin cupholders, and split-armrest storage box.',
  }),
  c('HVACModule_Cabin', 'Cabin climate distribution module & louvers', CB, 'SYS_CABIN', 4, 'box', {
    side: 'CENTER', region: 'C1', material: 'Polypropylene housing with stepper actuators & hidden continuous air vents', manufacturingProcess: 'Molded + automated assembly',
    explodeDir: [0, 1, 0.1], explodeGroup: 2, massKg: 7.2,
    description: 'Dual-zone cabin climate distribution assembly with continuous horizontal dashboard air vent blades and rear seat ventilation ducts.',
  }),
  c('PedalBox', 'Drive-by-wire ergonomic pedal assembly', CB, 'SYS_CABIN', 4, 'box', {
    side: 'L', region: 'C1', material: 'Reinforced glass-filled polyamide + forged steel pedals + rubber pads', manufacturingProcess: 'Molded + stamped',
    explodeDir: [-0.4, 1, 0.3], explodeGroup: 2, massKg: 2.1,
    description: 'Electronic drive-by-wire throttle pedal, heavy-duty brake pedal with anti-slip rubber ribs, and driver dead-pedal footrest plate.',
  }),
  c('OverheadConsole', 'Overhead roof console & interior lighting', CB, 'SYS_CABIN', 4, 'box', {
    side: 'CENTER', region: 'C1', material: 'Molded ABS/PC with touch LED map lights & SOS telematics', manufacturingProcess: 'Molded + PCB assembly',
    explodeDir: [0, -1, 0.2], explodeGroup: 2, massKg: 0.65,
    description: 'Windshield header roof console with capacitive reading lights, ambient LED strip, and emergency SOS e-call button.',
  }),
  c('RearviewMirror', 'Frameless auto-dimming rearview mirror', CB, 'SYS_CABIN', 4, 'box', {
    side: 'CENTER', region: 'C1', material: 'Electrochromic glass + camera bracket', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0.2], explodeGroup: 2, massKg: 0.45,
    description: 'Frameless electrochromic auto-dimming central rearview mirror with integrated ADAS camera cowl mount.',
  }),
  c('Seat_FL', 'Driver ergonomic bucket seat (8-way power)', CB, 'SYS_CABIN', 4, 'seat', {
    side: 'L', region: 'C1', material: 'High-strength steel skeleton + dual-density PU foam + perforated leatherette', manufacturingProcess: 'Welded frame + molded foam + stitched trim',
    explodeDir: [-0.6, 1, 0.1], explodeGroup: 2, massKg: 19.2,
    description: 'Ergonomically contoured driver bucket seat featuring deep side thigh and torso bolsters, 8-way power adjustment, and twin-post adjustable headrest.',
  }),
  c('Seat_FR', 'Passenger ergonomic bucket seat (6-way power)', CB, 'SYS_CABIN', 4, 'seat', {
    side: 'R', region: 'C1', material: 'High-strength steel skeleton + dual-density PU foam + perforated leatherette', manufacturingProcess: 'Welded frame + molded foam + stitched trim',
    explodeDir: [0.6, 1, 0.1], explodeGroup: 2, massKg: 18.6,
    description: 'Sculpted front passenger bucket seat with supportive lateral bolsters, power recline, and twin-post adjustable headrest.',
  }),
  c('RearBench', 'Rear 60:40 split 3-passenger bench seat', CB, 'SYS_CABIN', 4, 'seat', {
    side: 'CENTER', region: 'C2', material: 'Steel tubular frame + high-resilience foam + fold-down center armrest', manufacturingProcess: 'Welded frame + molded foam + stitched trim',
    explodeDir: [0, 1, -0.2], explodeGroup: 2, massKg: 24.8,
    description: '60:40 split-folding 3-passenger rear bench with ergonomic outboard contours, 3 adjustable headrests, fold-down center armrest with twin cupholders, and ISOFIX child seat anchors.',
  }),
  c('Seat_RL', 'Rear seat — left outboard cushion', CB, 'SYS_CABIN', 4, 'seat', {
    side: 'L', region: 'C2', material: 'Steel tubular frame + high-resilience foam + leatherette', manufacturingProcess: 'Welded frame + molded foam',
    explodeDir: [-0.5, 1, -0.2], explodeGroup: 2, massKg: 10.2,
    description: 'Left outboard rear seat with contoured lateral support and adjustable headrest.',
  }),
  c('Seat_RC', 'Rear seat — center perch & fold armrest', CB, 'SYS_CABIN', 4, 'seat', {
    side: 'CENTER', region: 'C2', material: 'Steel tubular frame + foam + fold-down armrest', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, -0.2], explodeGroup: 2, massKg: 4.4,
    description: 'Center rear passenger seating position with integrated fold-down armrest and twin cupholders.',
  }),
  c('Seat_RR', 'Rear seat — right outboard cushion', CB, 'SYS_CABIN', 4, 'seat', {
    side: 'R', region: 'C2', material: 'Steel tubular frame + high-resilience foam + leatherette', manufacturingProcess: 'Welded frame + molded foam',
    explodeDir: [0.5, 1, -0.2], explodeGroup: 2, massKg: 10.2,
    description: 'Right outboard rear seat with contoured lateral support and adjustable headrest.',
  }),
  c('SeatRail_FL', 'Front seat slider track assembly — left', CB, 'SYS_CABIN', 4, 'rail', {
    side: 'L', region: 'C1', material: 'High-strength cold-rolled steel rails with ball bearings', manufacturingProcess: 'Roll formed + stamped',
    explodeDir: [-0.6, 1, 0.1], explodeGroup: 2, massKg: 1.8,
    description: 'Dual longitudinal seat slider track with motorized lead-screw positioning mechanism for driver seat.',
  }),
  c('SeatRail_FR', 'Front seat slider track assembly — right', CB, 'SYS_CABIN', 4, 'rail', {
    side: 'R', region: 'C1', material: 'High-strength cold-rolled steel rails with ball bearings', manufacturingProcess: 'Roll formed + stamped',
    explodeDir: [0.6, 1, 0.1], explodeGroup: 2, massKg: 1.8,
    description: 'Dual longitudinal seat slider track with manual/motorized positioning mechanism for passenger seat.',
  }),
  c('SeatbeltAnchor_FL', 'Pyrotechnic seatbelt pre-tensioner — FL', CB, 'SYS_CABIN', 4, 'box', {
    side: 'L', region: 'C1', material: 'Forged steel anchor bracket with pyrotechnic tensioner', manufacturingProcess: 'Forged + automated assembly',
    explodeDir: [-0.7, 1, 0.1], explodeGroup: 2, massKg: 0.8,
    description: 'B-pillar and seat base pyrotechnic pre-tensioner seatbelt buckle anchor with buckle sensor switch.',
  }),
  c('SeatbeltAnchor_FR', 'Pyrotechnic seatbelt pre-tensioner — FR', CB, 'SYS_CABIN', 4, 'box', {
    side: 'R', region: 'C1', material: 'Forged steel anchor bracket with pyrotechnic tensioner', manufacturingProcess: 'Forged + automated assembly',
    explodeDir: [0.7, 1, 0.1], explodeGroup: 2, massKg: 0.8,
    description: 'B-pillar and seat base pyrotechnic pre-tensioner seatbelt buckle anchor with buckle sensor switch.',
  }),
  c('DoorTrim_FL', 'Interior door trim card — front left (driver)', CB, 'SYS_CABIN', 4, 'panel', {
    side: 'L', region: 'C1', material: 'Molded polypropylene core + soft-touch leatherette armrest + satin chrome release lever', manufacturingProcess: 'Injection molded + vacuum formed skin',
    explodeDir: [-1, 0.2, 0.2], explodeGroup: 3, massKg: 3.6,
    description: 'Molded front driver door card featuring master power window/mirror switchpack, satin chrome release handle, grab handle, map pocket with 1L bottle holder, and premium acoustic speaker grille.',
  }),
  c('DoorTrim_FR', 'Interior door trim card — front right (passenger)', CB, 'SYS_CABIN', 4, 'panel', {
    side: 'R', region: 'C1', material: 'Molded polypropylene core + soft-touch leatherette armrest + satin chrome release lever', manufacturingProcess: 'Injection molded + vacuum formed skin',
    explodeDir: [1, 0.2, 0.2], explodeGroup: 3, massKg: 3.4,
    description: 'Molded front passenger door card with power window switch, satin chrome door handle, soft armrest, door storage pocket, and speaker grille.',
  }),
  c('DoorTrim_RL', 'Interior door trim card — rear left', CB, 'SYS_CABIN', 4, 'panel', {
    side: 'L', region: 'C2', material: 'Molded polypropylene core + soft armrest + chrome handle', manufacturingProcess: 'Injection molded',
    explodeDir: [-1, 0.2, -0.2], explodeGroup: 3, massKg: 2.9,
    description: 'Rear left door card with power window switch, satin chrome handle, grab armrest, bottle storage pocket, and speaker grille.',
  }),
  c('DoorTrim_RR', 'Interior door trim card — rear right', CB, 'SYS_CABIN', 4, 'panel', {
    side: 'R', region: 'C2', material: 'Molded polypropylene core + soft armrest + chrome handle', manufacturingProcess: 'Injection molded',
    explodeDir: [1, 0.2, -0.2], explodeGroup: 3, massKg: 2.9,
    description: 'Rear right door card with power window switch, satin chrome handle, grab armrest, bottle storage pocket, and speaker grille.',
  }),
  c('AirbagModules', 'Supplemental Restraint System (SRS) airbag modules', CB, 'SYS_CABIN', 4, 'box', {
    side: 'CENTER', region: 'C1', material: 'Woven nylon airbags + pyrotechnic inflators + magnesium housings', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0.1], explodeGroup: 2, massKg: 4.8,
    description: 'Comprehensive SRS package including driver steering wheel airbag, passenger front dashboard airbag, front seat side thorax airbags, and full-length side curtain airbags.',
  }),

  /* ------------------------------------------------ THERMAL */
  c('Radiator', 'Radiator (low-temp)', TH, 'SYS_THERMAL', 16, 'thermal', {
    side: 'CENTER', region: 'F1', material: 'Aluminium heat exchanger', manufacturingProcess: 'Brazed',
    explodeDir: [0, 0, -1], explodeGroup: 3, massKg: 3.4,
  }),
  c('Condenser', 'AC condenser', TH, 'SYS_THERMAL', 16, 'thermal', {
    side: 'CENTER', region: 'F1', material: 'Aluminium heat exchanger', manufacturingProcess: 'Brazed',
    explodeDir: [0, 0, -1], explodeGroup: 3, massKg: 2.8,
  }),
  c('CoolantPump_Motor', 'Coolant pump — motor loop', TH, 'SYS_THERMAL', 16, 'cylinder', {
    side: 'CENTER', material: 'Electric coolant pump', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 3, massKg: 0.8,
  }),
  c('CoolantPump_Battery', 'Coolant pump — battery loop', TH, 'SYS_THERMAL', 16, 'cylinder', {
    side: 'CENTER', material: 'Electric coolant pump', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 3, massKg: 0.8,
  }),
  c('Chiller', 'Chiller', TH, 'SYS_THERMAL', 16, 'thermal', {
    side: 'CENTER', material: 'Plate heat exchanger', manufacturingProcess: 'Brazed',
    explodeDir: [0, -1, 0], explodeGroup: 3, massKg: 1.6,
  }),
  c('CoolantHeater', 'Coolant heater', TH, 'SYS_THERMAL', 16, 'thermal', {
    side: 'CENTER', material: 'PTC heater', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 3, massKg: 1.2,
  }),
  c('CoolantReservoir', 'Coolant reservoir', TH, 'SYS_THERMAL', 16, 'box', {
    side: 'CENTER', material: 'PP tank', manufacturingProcess: 'Blow moulded',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.5,
  }),
  c('BatteryCoolantLoop', 'Battery cooling loop', TH, 'SYS_THERMAL', 16, 'harness', {
    side: 'CENTER', material: 'Coolant hoses', manufacturingProcess: 'Routed hose',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.4,
  }),
  c('MotorCoolantLoop', 'Motor cooling loop', TH, 'SYS_THERMAL', 16, 'harness', {
    side: 'CENTER', material: 'Coolant hoses', manufacturingProcess: 'Routed hose',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.2,
  }),
  c('HVACLoop', 'HVAC refrigerant loop', TH, 'SYS_THERMAL', 16, 'harness', {
    side: 'CENTER', material: 'Refrigerant lines', manufacturingProcess: 'Routed tube',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.6,
  }),

  /* ------------------------------------------------ ELECTRICAL */
  c('HV_OrangeHarness', 'HV orange harness', EL, 'SYS_ELECTRICAL', 17, 'harness', {
    side: 'CENTER', material: 'Orange shielded HV cable set', manufacturingProcess: 'Cable assembly, HV interlocks',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 6.8,
  }),
  c('LV_Harness', 'LV harness', EL, 'SYS_ELECTRICAL', 18, 'harness', {
    side: 'CENTER', material: 'LV wire bundles', manufacturingProcess: 'Wire harness assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 9.4,
  }),
  c('FuseBox', 'Fuse box', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'Fuse carrier', manufacturingProcess: 'Assembled',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.9,
  }),
  c('VehicleControlUnit', 'Vehicle control unit', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'VCU ECU', manufacturingProcess: 'SMT assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.8,
  }),
  c('Gateway', 'Gateway (CAN/Ethernet)', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'Gateway ECU', manufacturingProcess: 'SMT assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.5,
  }),
  c('BodyControlModule', 'Body control module', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'BCM', manufacturingProcess: 'SMT assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.6,
  }),
  c('ABS_ESC_Module', 'ABS / ESC module', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'ABS/ESC unit', manufacturingProcess: 'Assembled',
    explodeDir: [0, -1, 0], explodeGroup: 3, massKg: 2.1,
  }),
  c('EPS_Controller', 'EPS controller', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'EPS ECU', manufacturingProcess: 'SMT assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.5,
  }),
  c('BMS_Controller', 'BMS controller', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'BMS ECU', manufacturingProcess: 'SMT assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 0.5,
  }),
  c('ADAS_ECU', 'ADAS ECU', EL, 'SYS_ELECTRICAL', 18, 'electronics', {
    side: 'CENTER', material: 'ADAS domain controller', manufacturingProcess: 'SMT assembly',
    explodeDir: [0, 1, 0], explodeGroup: 3, massKg: 1.2,
  }),

  /* ------------------------------------------------ FASTENER GROUPS */
  c('FastenerGroup_StructuralBolts', 'Structural bolts (representative)', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Steel bolt fasteners', manufacturingProcess: 'Torqued assembly',
    explodeDir: [0, 0.4, 0], explodeGroup: 4, massKg: 3.2, description: 'Representative structural fasteners. Individual bolts are selectable; sizes/torques are VERIFIED until verified.',
  }),
  c('FastenerGroup_BatteryMountBolts', 'Battery mount bolts', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Steel flange bolts', manufacturingProcess: 'Torqued assembly',
    explodeDir: [0, -0.4, 0], explodeGroup: 4, massKg: 0.8,
  }),
  c('FastenerGroup_SuspensionBolts', 'Suspension bolts', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Steel bolts + nuts', manufacturingProcess: 'Torqued assembly',
    explodeDir: [0, 0.5, 0], explodeGroup: 4, massKg: 1.4,
  }),
  c('FastenerGroup_MotorMountBolts', 'Drive unit mount bolts', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Steel bolts', manufacturingProcess: 'Torqued assembly',
    explodeDir: [0, -0.4, 0], explodeGroup: 4, massKg: 0.6,
  }),
  c('FastenerGroup_CrossMemberBolts', 'Cross-member bolts', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Steel bolts', manufacturingProcess: 'Torqued assembly',
    explodeDir: [0, 0.5, 0], explodeGroup: 4, massKg: 1.0,
  }),
  c('FastenerGroup_Rivets', 'Rivets', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Aluminium rivets', manufacturingProcess: 'Riveted',
    explodeDir: [0, 0.4, 0], explodeGroup: 4, massKg: 0.5,
  }),
  c('FastenerGroup_SPRs', 'Self-piercing rivets', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'SPR fasteners', manufacturingProcess: 'Self-piercing rivet',
    explodeDir: [0, 0.4, 0], explodeGroup: 4, massKg: 0.4,
  }),
  c('FastenerGroup_SpotWelds', 'Spot welds (representative)', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Resistance spot welds', manufacturingProcess: 'RSW',
    explodeDir: [0, 0.3, 0], explodeGroup: 4, massKg: 0.6,
  }),
  c('FastenerGroup_Adhesive', 'Structural adhesive paths', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Structural adhesive', manufacturingProcess: 'Dispensed bead',
    explodeDir: [0, 0.3, 0], explodeGroup: 4, massKg: 0.8,
  }),
  c('FastenerGroup_Clips', 'Clips / brackets', FA, 'SYS_FASTENERS', 19, 'fastener', {
    side: 'CENTER', material: 'Spring steel clips', manufacturingProcess: 'Snap-fit',
    explodeDir: [0, 0.3, 0], explodeGroup: 4, massKg: 0.3,
  }),

  /* ------------------------------------------------ SENSORS */
  c('S01', 'Strain gauge — front-left rail', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'L', region: 'F1', material: 'Foil strain gauge', manufacturingProcess: 'Bonded',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
  c('S02', 'Strain gauge — front-right rail', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'R', region: 'F1', material: 'Foil strain gauge', manufacturingProcess: 'Bonded',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
  c('S03', 'Strain gauge — battery mount FL', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'L', region: 'B1', material: 'Foil strain gauge', manufacturingProcess: 'Bonded',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
  c('S04', 'Strain gauge — battery mount FR', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'R', region: 'B2', material: 'Foil strain gauge', manufacturingProcess: 'Bonded',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
  c('S05', 'Strain gauge — battery mount RL', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'L', region: 'B3', material: 'Foil strain gauge', manufacturingProcess: 'Bonded',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
  c('S06', 'Strain gauge — battery mount RR', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'R', region: 'B4', material: 'Foil strain gauge', manufacturingProcess: 'Bonded',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
  c('IMU01', 'IMU — front substructure', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'CENTER', region: 'F1', material: '6-DOF IMU', manufacturingProcess: 'SMT + cased',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.02,
  }),
  c('IMU02', 'IMU — cabin / floor centre', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'CENTER', region: 'C1', material: '6-DOF IMU', manufacturingProcess: 'SMT + cased',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.02,
  }),
  c('IMU03', 'IMU — rear floor / cross-member', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'CENTER', region: 'R1', material: '6-DOF IMU', manufacturingProcess: 'SMT + cased',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.02,
  }),
  c('TEMP01', 'Thermistor — battery enclosure', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'CENTER', region: 'C1', material: 'NTC thermistor', manufacturingProcess: 'Potted',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
  c('TEMP02', 'Thermistor — rear cross-member', SE, 'SYS_SENSORS', 20, 'sensor', {
    side: 'CENTER', region: 'R1', material: 'NTC thermistor', manufacturingProcess: 'Potted',
    explodeDir: [0, 0.6, 0], explodeGroup: 4, massKg: 0.01,
  }),
];

export const CATALOG_BY_ID: Record<string, ComponentDef> = Object.fromEntries(
  CATALOG.map((d) => [d.id, d]),
);

export const SYSTEM_GROUPS: { id: string; name: string }[] = [
  { id: 'SYS_EXTERIOR', name: 'Exterior / Skin' },
  { id: 'SYS_BIW', name: 'Body-in-White' },
  { id: 'SYS_SKATEBOARD', name: 'EV Skateboard' },
  { id: 'SYS_SUSPENSION', name: 'Suspension' },
  { id: 'SYS_STEERING', name: 'Steering' },
  { id: 'SYS_BRAKES', name: 'Brakes / Wheels' },
  { id: 'SYS_CABIN', name: 'Cabin / Interior' },
  { id: 'SYS_THERMAL', name: 'Thermal System' },
  { id: 'SYS_ELECTRICAL', name: 'Electrical & ECU' },
  { id: 'SYS_FASTENERS', name: 'Fasteners / Joints' },
  { id: 'SYS_SENSORS', name: 'SHIELD Sensors' },
  { id: 'SYS_SHIELD_BOX', name: 'SHIELD Controller Box' },
];

export const BIW_GROUPS: { id: string; name: string }[] = [
  { id: GRP_BIW_FRONT, name: 'Front Structure' },
  { id: GRP_BIW_CELL, name: 'Safety Cell' },
  { id: GRP_BIW_FLOOR, name: 'Floor / Underbody' },
  { id: GRP_BIW_REAR, name: 'Rear Structure' },
];

export const SK_GROUPS: { id: string; name: string }[] = [
  { id: GRP_BATTERY, name: 'Battery Pack' },
  { id: GRP_DRIVE, name: 'Front E-Drive' },
  { id: GRP_PWR, name: 'OBC / DC-DC' },
  { id: GRP_HV, name: 'HV Bus' },
];

export function childrenOf(id: string): ComponentDef[] {
  return CATALOG.filter((c) => c.parent === id);
}

export function ancestorsOf(id: string): string[] {
  const out: string[] = [];
  let cur = CATALOG_BY_ID[id];
  let guard = 0;
  while (cur && cur.parent && guard++ < 20) {
    const p = cur.parent;
    if (CATALOG_BY_ID[p]) {
      out.push(p);
      cur = CATALOG_BY_ID[p];
    } else cur = undefined as unknown as ComponentDef;
  }
  return out;
}

export function descendantsOf(id: string): string[] {
  const out: string[] = [];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const ch of childrenOf(cur)) {
      out.push(ch.id);
      stack.push(ch.id);
    }
  }
  return out;
}

export function relatedIds(id: string): string[] {
  return [...ancestorsOf(id), ...descendantsOf(id)];
}

/** Left/right symmetry partner (e.g. A_Pillar_L ↔ A_Pillar_R). */
export function symmetryPartner(id: string): string | null {
  const d = CATALOG_BY_ID[id];
  if (!d || !d.side || d.side === 'CENTER') return null;
  const flip = d.side === 'L' ? 'R' : 'L';
  const stem = d.side === 'L' ? id.replace(/_L$/, '') : id.replace(/_R$/, '');
  const cand = stem + (flip === 'L' ? '_L' : '_R');
  return CATALOG_BY_ID[cand] && CATALOG_BY_ID[cand].side === flip ? cand : null;
}