/* ============================================================
   SHIELD — representative fastener / joint dataset.
   Positions are and placed on the procedural twin. Sizes,
   grades and torques are UNVERIFIED (null / DEMO) per the
   truthfulness rule — display "—" until a verified BOM source
   is supplied.
   ============================================================ */

import type { FastenerDef, FastenerFamily } from '../schema/types';
import { D } from '../schema/dims';

type P = [number, number, number];

const bolt = (
  id: string,
  a: string,
  b: string,
  jointType: string,
  position: P,
  axis: P,
  family: FastenerFamily = 'hex_flange_bolt',
  opts: Partial<FastenerDef> = {},
): FastenerDef => ({
  id,
  family,
  label: `${id} :: ${a} ⇄ ${b}`,
  componentA: a,
  componentB: b,
  jointType,
  position,
  axis,
  nominalSize: 'M10 × 1.5 mm',
  torqueSpecNm: null,           // unverified → UI shows "—"
  preloadN: null,
  grade: '10.9',
  coating: 'zinc-flake',
  status: 'installed',
  confidence: 'VERIFIED',
  inspectionDate: '2026-06-01',
  ...opts,
});

/* ---------------- Battery mount bolts (8) ---------------- */
const BAT_MOUNT_Z = [D.batFront - 0.05, D.batRear + 0.05];
const BAT_MOUNT_X = [-D.batX, D.batX];
const batteryMountBolts: FastenerDef[] = [];
{
  let n = 0;
  for (const z of BAT_MOUNT_Z) {
    for (const x of BAT_MOUNT_X) {
      const sideTag = z > 0 ? (x < 0 ? 'FL' : 'FR') : x < 0 ? 'RL' : 'RR';
      const mount = z > 0 ? (x < 0 ? 'Mount_BFL' : 'Mount_BFR') : x < 0 ? 'Mount_BRL' : 'Mount_BRR';
      const member = z > 0 ? 'CrossMember_Front' : 'CrossMember_Rear';
      batteryMountBolts.push(
        bolt(`BOLT-BAT-${sideTag}-${++n}`, mount, member, `battery mount → ${member}`,
          [x, D.floorY - 0.02, z], [0, -1, 0], 'socket_head_bolt',
          { status: n % 9 === 0 ? 'flagged' : 'installed' }),
      );
    }
  }
  // mid mounts
  for (const x of BAT_MOUNT_X) {
    const sideTag = x < 0 ? 'ML' : 'MR';
    const mount = x < 0 ? 'Mount_ML' : 'Mount_MR';
    batteryMountBolts.push(
      bolt(`BOLT-BAT-MID-${sideTag}` , mount, 'CrossMember_Center_2', 'battery mid-mount',
        [x, D.floorY - 0.02, -0.3], [0, -1, 0], 'socket_head_bolt'),
    );
  }
}

/* ---------------- Structural bolts along load rails ---------------- */
const structuralBolts: FastenerDef[] = [];
{
  // front longitudinals
  for (const x of [-D.railX, D.railX]) {
    for (let z = 1.55; z >= 1.05; z -= 0.16) {
      const side = x < 0 ? 'L' : 'R';
      structuralBolts.push(
        bolt(`BOLT-STR-${side}-${z.toFixed(2)}`, `FrontLongitudinal_${side}`, 'SubframeInv', 'rail tie / subframe',
          [x, D.railTopY - 0.03, z], [0, -1, 0], 'flange_bolt'),
      );
    }
  }
  // rear longitudinals
  for (const x of [-D.railX, D.railX]) {
    for (let z = -1.05; z >= -1.8; z -= 0.16) {
      const side = x < 0 ? 'L' : 'R';
      structuralBolts.push(
        bolt(`BOLT-STR-R${side}-${z.toFixed(2)}`, `RearLongitudinal_${side}`, 'RearFloorCrossMember', 'rear rail tie',
          [x, 0.5, z], [0, -1, 0], 'flange_bolt'),
      );
    }
  }
  // rocker → floor
  for (const x of [-D.rockerX, D.rockerX]) {
    const side = x < 0 ? 'L' : 'R';
    for (let z = -1.1; z <= 0.9; z += 0.5) {
      structuralBolts.push(
        bolt(`BOLT-ROCK-${side}-${z.toFixed(1)}`, `Rocker_${side}`, 'FrontFloor', 'rocker to floor',
          [x, D.rockerY, z], [0, -1, 0], 'flange_bolt'),
      );
    }
  }
}

/* ---------------- Cross-member bolts ---------------- */
const crossMemberBolts: FastenerDef[] = [];
{
  const members: [string, number][] = [
    ['CrossMember_Front', D.xms.front],
    ['CrossMember_Center_1', D.xms.c1],
    ['CrossMember_Center_2', D.xms.c2],
    ['CrossMember_Rear', D.xms.rear],
  ];
  for (const [id, z] of members) {
    for (const x of [-0.55, 0.55]) {
      crossMemberBolts.push(
        bolt(`BOLT-XM-${id.replace('CrossMember_', '')}-${x < 0 ? 'L' : 'R'}`, id, x < 0 ? 'BatteryProtectionRail_L' : 'BatteryProtectionRail_R',
          'cross-member to protection rail', [x, D.floorY - 0.02, z], [0, -1, 0], 'flange_bolt'),
      );
    }
  }
}

/* ---------------- Suspension bolts ---------------- */
const suspensionBolts: FastenerDef[] = [];
{
  for (const side of ['L', 'R'] as const) {
    const sx = side === 'L' ? -1 : 1;
    suspensionBolts.push(
      bolt(`BOLT-SUS-STR-${side}`, `SuspensionTower_F${side}`, `Strut_F${side}`, 'strut top mount',
        [sx * D.towerX, D.towerY + 0.02, 1.24], [0, 1, 0], 'hex_flange_bolt'),
      bolt(`BOLT-SUS-LCA-${side}`, `LowerControlArm_F${side}`, 'FrontLongitudinal_' + side, 'LCA pivot',
        [sx * 0.34, 0.4, 1.05], [0, 1, 0], 'hex_flange_bolt'),
      bolt(`BOLT-SUS-TA-${side}`, `TrailingArm_R${side}`, 'BatteryProtectionRail_' + side, 'trailing arm pivot',
        [sx * 0.55, 0.4, -0.95], [0, 1, 0], 'hex_flange_bolt'),
      bolt(`BOLT-SUS-DMP-${side}`, `SuspensionTower_R${side}`, `Damper_R${side}`, 'rear damper top mount',
        [sx * D.towerX, 0.85, -1.18], [0, 1, 0], 'hex_flange_bolt'),
    );
  }
}

/* ---------------- Drive unit mount bolts ---------------- */
const motorMountBolts: FastenerDef[] = [];
{
  for (const side of ['L', 'R'] as const) {
    const sx = side === 'L' ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      motorMountBolts.push(
        bolt(`BOLT-MM-${side}-${i + 1}`, `MotorMount_${side}`, 'FrontFloor', 'drive unit mount',
          [sx * 0.3, 0.47, 1.08 - i * 0.22], [0, -1, 0], 'hex_flange_bolt'),
      );
    }
  }
}

/* ---------------- Rivets (rocker / protection rail) ---------------- */
const rivets: FastenerDef[] = [];
{
  for (const x of [-D.rockerX, D.rockerX]) {
    const side = x < 0 ? 'L' : 'R';
    for (let z = -1.15; z <= 0.95; z += 0.14) {
      rivets.push(
        bolt(`RIV-${side}-${z.toFixed(2)}`, `Rocker_${side}`, 'DoorRing_' + side, 'riveted seam',
          [x, D.rockerY + 0.03, z], [x < 0 ? -1 : 1, 0, 0], 'rivet', { nominalSize: 'Ø 5 mm', torqueSpecNm: null }),
      );
    }
  }
}

/* ---------------- Self-piercing rivets (floor seams) ---------------- */
const sprs: FastenerDef[] = [];
{
  for (const x of [-0.64, 0.64]) {
    const side = x < 0 ? 'L' : 'R';
    for (let z = 0.9; z >= -0.95; z -= 0.13) {
      sprs.push(
        bolt(`SPR-${side}-${z.toFixed(2)}`, 'FrontFloor', 'BatteryProtectionRail_' + side, 'floor seam',
          [x, D.floorY, z], [0, 1, 0], 'self_piercing_rivet', { nominalSize: 'SPR', torqueSpecNm: null }),
      );
    }
  }
}

/* ---------------- Spot welds (representative BIW seams) ---------------- */
const spotWelds: FastenerDef[] = [];
{
  const push = (a: string, b: string, p: P, axis: P) =>
    spotWelds.push(bolt(`WELD-${a}-${spotWelds.length + 1}`, a, b, 'spot weld', p, axis, 'spot_weld',
      { nominalSize: 'RSW', torqueSpecNm: null }));
  // roof rails
  for (const x of [-D.roofRailX, D.roofRailX]) {
    for (let z = 0.6; z >= -0.9; z -= 0.22) {
      push('RoofRail_' + (x < 0 ? 'L' : 'R'), 'RoofPanel', [x, D.roofY - 0.03, z], [0, -1, 0]);
    }
  }
  // rockers
  for (const x of [-D.rockerX, D.rockerX]) {
    for (let z = -1.1; z <= 0.9; z += 0.22) {
      push('Rocker_' + (x < 0 ? 'L' : 'R'), 'DoorRing_' + (x < 0 ? 'L' : 'R'), [x, D.rockerY + 0.02, z], [0, 1, 0]);
    }
  }
  // pillars
  for (const z of [1.0, 0.45]) {
    for (const x of [-D.pillarX, D.pillarX]) {
      push('B_Pillar_' + (x < 0 ? 'L' : 'R'), 'Rocker_' + (x < 0 ? 'L' : 'R'), [x, 0.6, z > 0.5 ? 1.0 : 0.45], [0, 1, 0]);
    }
  }
  // cross-members onto floor
  for (const z of Object.values(D.xms)) {
    for (const x of [-0.3, 0, 0.3]) {
      push('CrossMember_' + (z > 0.6 ? 'Front' : z > 0 ? 'Center_1' : z > -0.6 ? 'Center_2' : 'Rear'), 'FrontFloor', [x, D.floorY + 0.03, z], [0, 1, 0]);
    }
  }
  // front longitudinal flanges
  for (const x of [-D.railX, D.railX]) {
    for (let z = 1.5; z >= 1.0; z -= 0.2) {
      push('FrontLongitudinal_' + (x < 0 ? 'L' : 'R'), 'FrontFloor', [x, D.railTopY - 0.04, z], [0, -1, 0]);
    }
  }
}

/* ---------------- Adhesive (battery → floor interface) ---------------- */
const adhesive: FastenerDef[] = [];
{
  for (const x of [-0.66, 0.66]) {
    const side = x < 0 ? 'L' : 'R';
    for (let z = D.batFront - 0.35; z >= D.batRear + 0.35; z -= 0.09) {
      adhesive.push(
        bolt(`ADH-${side}-${z.toFixed(2)}`, 'BatteryPack_Tray', 'BatteryProtectionRail_' + side, 'structural adhesive bead',
          [x, D.batY1 + 0.01, z], [0, 1, 0], 'adhesive_point', { nominalSize: 'bead', torqueSpecNm: null }),
      );
    }
  }
}

/* ---------------- Clips (harness retention) ---------------- */
const clips: FastenerDef[] = [];
{
  const route: P[] = [
    [0.15, 0.5, 1.5], [0.3, 0.62, 0.9], [0.35, 0.7, 0.2], [0.35, 0.72, -0.6],
    [0.3, 0.62, -1.3], [0.2, 0.5, -1.9],
  ];
  route.forEach((p, i) => clips.push(
    bolt(`CLIP-${i + 1}`, 'LV_Harness', 'FrontFloor', 'harness retention clip', p, [0, 0, 1], 'spring_clip',
      { nominalSize: 'spring clip', torqueSpecNm: null }),
  ));
}

export interface FastenerGroup {
  id: string;             // matches FastenerGroup_XXX catalog id
  family: FastenerFamily;
  items: FastenerDef[];
}

export const FASTENER_GROUPS: FastenerGroup[] = [
  { id: 'FastenerGroup_StructuralBolts', family: 'hex_flange_bolt', items: structuralBolts },
  { id: 'FastenerGroup_BatteryMountBolts', family: 'socket_head_bolt', items: batteryMountBolts },
  { id: 'FastenerGroup_SuspensionBolts', family: 'hex_flange_bolt', items: suspensionBolts },
  { id: 'FastenerGroup_MotorMountBolts', family: 'flange_bolt', items: motorMountBolts },
  { id: 'FastenerGroup_CrossMemberBolts', family: 'flange_bolt', items: crossMemberBolts },
  { id: 'FastenerGroup_Rivets', family: 'rivet', items: rivets },
  { id: 'FastenerGroup_SPRs', family: 'self_piercing_rivet', items: sprs },
  { id: 'FastenerGroup_SpotWelds', family: 'spot_weld', items: spotWelds },
  { id: 'FastenerGroup_Adhesive', family: 'adhesive_point', items: adhesive },
  { id: 'FastenerGroup_Clips', family: 'spring_clip', items: clips },
];

export const ALL_FASTENERS: FastenerDef[] = FASTENER_GROUPS.flatMap((g) => g.items);
export const FASTENER_BY_ID: Record<string, FastenerDef> = Object.fromEntries(
  ALL_FASTENERS.map((f) => [f.id, f]),
);