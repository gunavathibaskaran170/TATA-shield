/* ============================================================
   SHIELD — vehicle reference dimensions (metres).

   COORDINATE CONVENTION
     +x RIGHT, +y UP, +z FORWARD.
     y = 0 is the ground plane, z = 0 is mid-wheelbase.

   PROVENANCE
   Chassis / running-gear / battery / drive-unit figures are taken
   verbatim from the supplied parametric assembly definition
   `EV_Chassis_SHIELD_Assembly` (FreeCAD macro + OpenSCAD model,
   authored by P. Engineer, "PROJECT: EV SUV PLATFORM DRV-SK-001")
   — WHEELBASE 2850, CHASSIS_WIDTH 1700, RAIL 90x140, battery
   2000x1250x140, wheel R380/W245, motor R150/L360, and so on.

   The supplied definition is a *layout / packaging* model and is
   explicitly NOT validated for fabrication, structural or
   crash-worthiness. It is also NOT OEM Tata CAD or a Tata BOM.

   The outer body envelope (BODY_* below) is a DEMO SURROGATE sized
   to enclose the specified chassis so the assembly reads as a
   complete vehicle; it is not derived from any OEM surface data.

   RIDE_HEIGHT is a DERIVED value: the supplied definition places
   the rails on its own z = 0 datum with no ground clearance, so a
   ride height must be assumed to place the chassis above the road.
   ============================================================ */

/* ---- supplied parametric chassis definition (mm → m) ---- */
export const CAD = {
  wheelbase: 2.85,
  chassisWidth: 1.7,
  railOverhangFront: 0.35,
  railOverhangRear: 0.4,

  railHeight: 0.14,
  railWidth: 0.09,
  railWall: 0.004,

  xmemberHeight: 0.12,
  xmemberDepth: 0.07,
  xmemberWall: 0.004,
  frontSubframeOffset: 0.3,
  rearSubframeOffset: 0.3,

  batteryLength: 2.0,
  batteryWidth: 1.25,
  batteryHeight: 0.14,
  batteryWall: 0.006,
  coolingPlateThk: 0.015,
  moduleChannelCount: 8,
  moduleChannelWall: 0.003,

  wheelRadius: 0.38,
  wheelWidth: 0.245,
  hubRadius: 0.09,
  hubWidth: 0.06,
  brakeDiscRadius: 0.16,
  brakeDiscThk: 0.012,
  towerHeight: 0.35,
  towerRadius: 0.028,
  springCoilRadius: 0.065,
  springWireRadius: 0.009,
  springTurns: 6,

  motorRadius: 0.15,
  motorLength: 0.36,
  gearboxLength: 0.22,
  gearboxRadius: 0.17,
  inverterL: 0.22,
  inverterW: 0.18,
  inverterH: 0.14,
  halfshaftRadius: 0.022,
  halfshaftLength: 0.42,

  auxMotorRadius: 0.055,
  auxMotorLength: 0.14,
  lc1L: 0.18,
  lc1W: 0.09,
  lc1H: 0.07,

  imuL: 0.03,
  imuW: 0.022,
  imuH: 0.012,
  sgL: 0.04,
  sgW: 0.026,
  sgH: 0.016,
  sgTabL: 0.018,
  sgTabW: 0.01,
  sgTabH: 0.003,
  harnessRadius: 0.006,

  boxL: 0.3,
  boxW: 0.2,
  boxH: 0.12,
  boxWall: 0.004,
  boxLidH: 0.035,
  boxStandoff: 0.8,
  oledL: 0.034,
  oledW: 0.018,
  ledRadius: 0.0025,
  buzzerRadius: 0.008,
  bulkheadRadius: 0.012,
  bulkheadLen: 0.022,
} as const;

/* DERIVED: assumed ride height so the specified chassis clears the road. */
export const RIDE_HEIGHT = 0.16;

const AXLE_F = CAD.wheelbase / 2; // +1.425
const AXLE_R = -CAD.wheelbase / 2; // −1.425
const RAIL_X = CAD.chassisWidth / 2 - CAD.railWidth / 2; // 0.805
const RAIL_BOT = RIDE_HEIGHT;
const RAIL_TOP = RAIL_BOT + CAD.railHeight;
const BAT_BOT = RAIL_BOT + CAD.railWall;
const BAT_TOP = BAT_BOT + CAD.batteryHeight;
const WHEEL_X = CAD.chassisWidth / 2 + CAD.wheelWidth / 2; // 0.9725

export const D = {
  /* ---- overall (DEMO surrogate body around the specified chassis) ---- */
  length: 4.45,
  width: 2.2,
  height: 1.65,
  bumperFront: 2.2,
  bumperRear: -2.25,
  sideX: 1.02,
  beltline: 1.1,
  cowlZ: 1.19,
  roofY: 1.63,

  /* ---- wheels / axles (supplied definition) ---- */
  wheelbase: CAD.wheelbase,
  track: WHEEL_X * 2,
  axleFront: AXLE_F,
  axleRear: AXLE_R,
  wheelX: WHEEL_X,
  wheelY: CAD.wheelRadius,
  tireR: CAD.wheelRadius,
  tireW: CAD.wheelWidth,
  rimR: 0.25,
  hubR: CAD.hubRadius,
  hubW: CAD.hubWidth,
  discR: CAD.brakeDiscRadius,
  discThk: CAD.brakeDiscThk,

  /* ---- longitudinal chassis rails (supplied definition) ---- */
  chassisWidth: CAD.chassisWidth,
  railX: RAIL_X,
  railW: CAD.railWidth,
  railH: CAD.railHeight,
  railWall: CAD.railWall,
  railY0: RAIL_BOT,
  railY1: RAIL_TOP,
  railFront: AXLE_F + CAD.railOverhangFront, // +1.775
  railRear: AXLE_R - CAD.railOverhangRear, // −1.825
  railLen: CAD.wheelbase + CAD.railOverhangFront + CAD.railOverhangRear,

  /* ---- crossmembers / subframes ---- */
  xmemberH: CAD.xmemberHeight,
  xmemberD: CAD.xmemberDepth,
  xmemberZ: [AXLE_F + CAD.frontSubframeOffset, 0, AXLE_R - CAD.rearSubframeOffset], // +1.725, 0, −1.725

  /* ---- battery pack envelope (supplied definition) ---- */
  batX: CAD.batteryWidth / 2, // 0.625
  batY0: BAT_BOT,
  batY1: BAT_TOP,
  batFront: CAD.batteryLength / 2, // +1.0
  batRear: -CAD.batteryLength / 2, // −1.0
  packWidth: CAD.batteryWidth,
  packDepth: CAD.batteryLength,
  packHeight: CAD.batteryHeight,
  batteryWall: CAD.batteryWall,
  coolingPlateThk: CAD.coolingPlateThk,
  moduleChannels: CAD.moduleChannelCount,
  moduleChannelWall: CAD.moduleChannelWall,

  /* ---- floor cross-member stations (for fastener placement) ---- */
  xms: { front: 0.95, c1: 0.35, c2: -0.3, rear: -1.0 } as const,

  /* ---- body-in-white / floor (DEMO) ---- */
  floorY: 0.52,
  railTopY: RAIL_TOP,
  rockerX: 0.92,
  rockerY: 0.5,
  batRailX: 0.5,
  batRailY: BAT_BOT,
  pillarX: 0.78,
  roofRailX: 0.8,

  /* ---- suspension ---- */
  towerY: RAIL_TOP,
  towerX: RAIL_X,
  towerHeight: CAD.towerHeight,
  springCoilR: CAD.springCoilRadius,
  springWireR: CAD.springWireRadius,
  springTurns: CAD.springTurns,

  /* ---- drive unit (supplied definition, longitudinal offset from front axle) ---- */
  motorZ: AXLE_F - 0.06, // 1.365 — 60 mm ahead of the front axle
  motorR: CAD.motorRadius,
  motorLen: CAD.motorLength,
  motorY: CAD.wheelRadius,
  gearLen: CAD.gearboxLength,
  gearR: CAD.gearboxRadius,
  gearX: CAD.motorLength / 2 + CAD.gearboxLength / 2, // +0.29
  inverterZ: AXLE_F - 0.06,
  inverterL: CAD.inverterL,
  inverterW: CAD.inverterW,
  inverterH: CAD.inverterH,
  halfshaftR: CAD.halfshaftRadius,
  halfshaftLen: CAD.halfshaftLength,
  auxMotorZ: AXLE_F - 0.25, // 1.175
  auxMotorR: CAD.auxMotorRadius,
  auxMotorLen: CAD.auxMotorLength,
  lc1Z: AXLE_F + 0.5, // 1.925
  lc1L: CAD.lc1L,
  lc1W: CAD.lc1W,
  lc1H: CAD.lc1H,

  /* ---- chassis-mounted instrumentation (supplied definition) ---- */
  imuL: CAD.imuL,
  imuW: CAD.imuW,
  imuH: CAD.imuH,
  sgL: CAD.sgL,
  sgW: CAD.sgW,
  sgH: CAD.sgH,
  sgTabL: CAD.sgTabL,
  sgTabW: CAD.sgTabW,
  sgTabH: CAD.sgTabH,
  harnessR: CAD.harnessRadius,
  imuAZ: AXLE_F - 0.04, // +1.385
  imuBZ: AXLE_R + 0.04, // −1.385
  sg1Z: AXLE_F - CAD.wheelbase * 0.15, // +0.9975
  sg2Z: AXLE_F - CAD.wheelbase * 0.32, // +0.513
  instrumentY: RAIL_TOP,

  /* ---- SHIELD external controller enclosure ---- */
  boxL: CAD.boxL,
  boxW: CAD.boxW,
  boxH: CAD.boxH,
  boxWall: CAD.boxWall,
  boxLidH: CAD.boxLidH,
  boxStandoff: CAD.boxStandoff,
  boxX: CAD.chassisWidth / 2 + CAD.boxStandoff, // 1.65
  boxY: RAIL_BOT,
  boxZ: -0.1,
  oledL: CAD.oledL,
  oledW: CAD.oledW,
  ledR: CAD.ledRadius,
  buzzerR: CAD.buzzerRadius,
  bulkheadR: CAD.bulkheadRadius,
  bulkheadLen: CAD.bulkheadLen,
} as const;

export type Vec3 = [number, number, number];
