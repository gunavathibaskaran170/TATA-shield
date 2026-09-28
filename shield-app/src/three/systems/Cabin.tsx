import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Cyl, Rod } from '../geom';
import { Sel } from '../Sel';
import { M } from '../materials';
import { D } from '../../schema/dims';

/* ============================================================
   SHIELD — Comprehensive EV SUV Interior Architecture.
   Production-grade cabin subassembly:
   - Magnesium/Steel Cross-Car Beam (CCB) structural reinforcement
   - Sculpted multi-tier dashboard with hidden continuous HVAC vents
   - Driver 10.25" digital gauge cluster & 12.3" floating infotainment
   - Flat-bottom EV sports steering wheel with capacitive switch pods & stalks
   - Floating bridge center console with rotary PRND dial & wireless charger
   - Driver ergonomic drive-by-wire pedal box & dead footrest
   - Front 8-way power sculpted bucket seats with deep lateral bolsters
   - 60:40 split rear passenger seating bench with fold-down center armrest
   - 4 molded interior door trim cards with armrests, speakers & switches
   - Overhead roof console with LED spotlights & frameless rearview mirror
   - Acoustic carpet floor pan, molded headliner & rear tonneau cargo deck
   ============================================================ */

const FLOOR = D.floorY; // ~0.52m
const SEAT_X = 0.46;

/* Interior Specific Materials */
const MAT_LEATHER_DARK = { color: '#1a2028', roughness: 0.75, metalness: 0.1 };
const MAT_LEATHER_ACCENT = { color: '#2b3644', roughness: 0.7, metalness: 0.15 };
const MAT_PIPING = { color: '#38d9cf', roughness: 0.5, metalness: 0.2 };
const MAT_SATIN_CHROME = { color: '#cfd8e3', roughness: 0.25, metalness: 0.92 };
const MAT_BRUSHED_TITANIUM = { color: '#8b96a5', roughness: 0.35, metalness: 0.85 };
const MAT_PIANO_BLACK = { color: '#0d1117', roughness: 0.12, metalness: 0.6 };
const MAT_DOOR_CARD = { color: '#1c222b', roughness: 0.8, metalness: 0.1 };
const MAT_CARPET = { color: '#13161c', roughness: 0.95, metalness: 0.05 };
const MAT_SPEAKER_GRILLE = { color: '#455060', roughness: 0.45, metalness: 0.8 };

/** Front Row Ergonomic Power Bucket Seat */
function FrontBucketSeat(props: {
  cid: string;
  railCid: string;
  anchorCid: string;
  x: number;
  z: number;
  isDriver?: boolean;
}) {
  const { cid, railCid, anchorCid, x, z, isDriver = false } = props;
  const sideSign = x < 0 ? -1 : 1;

  return (
    <group>
      {/* Precision Chrome/Steel Seat Rails */}
      <Sel cid={railCid}>
        <group position={[x, FLOOR + 0.02, z]}>
          {[-0.19, 0.19].map((rx) => (
            <group key={rx}>
              <Rod a={[rx, 0.01, -0.28]} b={[rx, 0.01, 0.26]} r={0.01}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Rod>
              {/* Floor mounting brackets */}
              <Box args={[0.04, 0.03, 0.04]} position={[rx, 0.015, -0.26]}>
                <meshStandardMaterial {...M.steelDark} />
              </Box>
              <Box args={[0.04, 0.03, 0.04]} position={[rx, 0.015, 0.24]}>
                <meshStandardMaterial {...M.steelDark} />
              </Box>
            </group>
          ))}
        </group>
      </Sel>

      {/* Main Seat Assembly */}
      <Sel cid={cid}>
        <group position={[x, FLOOR + 0.04, z]}>
          {/* Motorized seat base plinth */}
          <Box args={[0.44, 0.06, 0.46]} position={[0, 0.04, 0]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>

          {/* Outboard power seat adjustment switches */}
          <group position={[sideSign * 0.23, 0.045, 0.05]}>
            <Box args={[0.015, 0.02, 0.08]} position={[0, 0, 0]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
            <Box args={[0.015, 0.04, 0.02]} position={[0, 0.01, -0.05]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          </group>

          {/* Contoured seat bottom cushion */}
          <group position={[0, 0.095, 0]}>
            <RoundedBox args={[0.42, 0.075, 0.46]} radius={0.025} smoothness={3}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            {/* Perforated breathable center cushion insert */}
            <RoundedBox args={[0.26, 0.08, 0.4]} radius={0.015} smoothness={2} position={[0, 0.005, 0]}>
              <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
            </RoundedBox>
            {/* Cyan contrast piping seam */}
            {[-0.135, 0.135].map((px) => (
              <Rod key={px} a={[px, 0.046, -0.2]} b={[px, 0.046, 0.2]} r={0.003}>
                <meshStandardMaterial {...MAT_PIPING} />
              </Rod>
            ))}
            {/* Left & Right lateral thigh support bolsters */}
            {[-0.19, 0.19].map((bx) => (
              <RoundedBox key={bx} args={[0.07, 0.11, 0.44]} radius={0.025} smoothness={3} position={[bx, 0.025, 0]}>
                <meshStandardMaterial {...MAT_LEATHER_DARK} />
              </RoundedBox>
            ))}
          </group>

          {/* Ergonomic angled backrest */}
          <group position={[0, 0.38, -0.19]} rotation={[-0.18, 0, 0]}>
            <RoundedBox args={[0.42, 0.52, 0.08]} radius={0.03} smoothness={3}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            {/* Perforated center lumbar insert */}
            <RoundedBox args={[0.26, 0.48, 0.085]} radius={0.02} smoothness={2} position={[0, 0, 0.005]}>
              <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
            </RoundedBox>
            {/* Piping accent on backrest */}
            {[-0.135, 0.135].map((px) => (
              <Rod key={px} a={[px, -0.22, 0.048]} b={[px, 0.22, 0.048]} r={0.003}>
                <meshStandardMaterial {...MAT_PIPING} />
              </Rod>
            ))}
            {/* Deep torso lateral containment bolsters */}
            {[-0.185, 0.185].map((bx) => (
              <RoundedBox key={bx} args={[0.065, 0.48, 0.1]} radius={0.025} smoothness={3} position={[bx, 0, 0.015]}>
                <meshStandardMaterial {...MAT_LEATHER_DARK} />
              </RoundedBox>
            ))}
            {/* Shoulder wings */}
            {[-0.195, 0.195].map((wx) => (
              <RoundedBox key={wx} args={[0.06, 0.16, 0.09]} radius={0.02} smoothness={2} position={[wx, 0.18, 0.02]}>
                <meshStandardMaterial {...MAT_LEATHER_DARK} />
              </RoundedBox>
            ))}

            {/* Adjustable Headrest with dual chrome posts */}
            {[-0.07, 0.07].map((px) => (
              <Rod key={px} a={[px, 0.26, 0]} b={[px, 0.34, 0]} r={0.007}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Rod>
            ))}
            <RoundedBox args={[0.24, 0.15, 0.09]} radius={0.03} smoothness={3} position={[0, 0.41, 0.01]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            <RoundedBox args={[0.18, 0.11, 0.095]} radius={0.02} smoothness={2} position={[0, 0.41, 0.012]}>
              <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
            </RoundedBox>
          </group>
        </group>
      </Sel>

      {/* Pyrotechnic Seatbelt Pre-tensioner Buckle */}
      <Sel cid={anchorCid}>
        <group position={[x - sideSign * 0.22, FLOOR + 0.16, z - 0.06]}>
          <Rod a={[0, -0.08, 0]} b={[0, 0.04, 0]} r={0.008}>
            <meshStandardMaterial {...M.steelDark} />
          </Rod>
          <Box args={[0.03, 0.06, 0.04]} position={[0, 0.06, 0]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
          <Box args={[0.02, 0.012, 0.01]} position={[0, 0.088, 0]}>
            <meshStandardMaterial color="#e63946" />
          </Box>
        </group>
      </Sel>
    </group>
  );
}

/** 60:40 Split Rear 3-Passenger Seating Bench */
function RearSeatingAssembly() {
  const zPos = -0.76;
  const yPos = FLOOR + 0.05;

  return (
    <group position={[0, yPos, zPos]}>
      {/* Lower Seat Cushion Bench spanning 3 passengers */}
      <Sel cid="RearBench">
        <group>
          {/* Main bench foam & trim */}
          <RoundedBox args={[1.36, 0.085, 0.48]} radius={0.03} smoothness={3} position={[0, 0.05, 0]}>
            <meshStandardMaterial {...MAT_LEATHER_DARK} />
          </RoundedBox>

          {/* Left Outboard Insert */}
          <RoundedBox args={[0.38, 0.09, 0.42]} radius={0.02} smoothness={2} position={[-0.46, 0.055, 0]}>
            <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
          </RoundedBox>
          {/* Right Outboard Insert */}
          <RoundedBox args={[0.38, 0.09, 0.42]} radius={0.02} smoothness={2} position={[0.46, 0.055, 0]}>
            <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
          </RoundedBox>
          {/* Center Perch Insert */}
          <RoundedBox args={[0.26, 0.09, 0.42]} radius={0.02} smoothness={2} position={[0, 0.055, 0]}>
            <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
          </RoundedBox>

          {/* Outboard Thigh Bolsters */}
          {[-0.64, 0.64].map((bx) => (
            <RoundedBox key={bx} args={[0.07, 0.11, 0.46]} radius={0.025} smoothness={3} position={[bx, 0.07, 0]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
          ))}

          {/* ISOFIX Child Seat Anchor Badges */}
          {[-0.56, -0.36, 0.36, 0.56].map((ix) => (
            <Box key={ix} args={[0.035, 0.015, 0.01]} position={[ix, 0.09, 0.22]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          ))}
        </group>
      </Sel>

      {/* 60:40 Split Backrest Assembly */}
      <group position={[0, 0.35, -0.2]} rotation={[-0.2, 0, 0]}>
        {/* Left 40% Backrest (Seat_RL) */}
        <Sel cid="Seat_RL">
          <group position={[-0.35, 0, 0]}>
            <RoundedBox args={[0.58, 0.52, 0.08]} radius={0.03} smoothness={3}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            <RoundedBox args={[0.44, 0.48, 0.085]} radius={0.02} smoothness={2} position={[0, 0, 0.005]}>
              <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
            </RoundedBox>
            {/* Left Outboard Torso Bolster */}
            <RoundedBox args={[0.065, 0.48, 0.1]} radius={0.025} smoothness={3} position={[-0.26, 0, 0.015]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            {/* Headrest */}
            {[-0.06, 0.06].map((px) => (
              <Rod key={px} a={[px, 0.26, 0]} b={[px, 0.34, 0]} r={0.007}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Rod>
            ))}
            <RoundedBox args={[0.22, 0.14, 0.085]} radius={0.03} smoothness={3} position={[0, 0.4, 0.01]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
          </group>
        </Sel>

        {/* Center Seat & Fold-down Armrest (Seat_RC) */}
        <Sel cid="Seat_RC">
          <group position={[0.06, 0, 0]}>
            {/* Center Backrest Section */}
            <RoundedBox args={[0.24, 0.52, 0.08]} radius={0.025} smoothness={2}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            {/* Center Fold-down Armrest with dual cupholders */}
            <group position={[0, 0.02, 0.045]}>
              <RoundedBox args={[0.2, 0.38, 0.06]} radius={0.02} smoothness={2}>
                <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
              </RoundedBox>
              {[-0.08, 0.08].map((cy) => (
                <Cyl key={cy} args={[0.03, 0.03, 0.012, 16]} position={[0, cy, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
                  <meshStandardMaterial {...MAT_PIANO_BLACK} />
                </Cyl>
              ))}
            </group>
            {/* Center Headrest */}
            {[-0.04, 0.04].map((px) => (
              <Rod key={px} a={[px, 0.26, 0]} b={[px, 0.32, 0]} r={0.006}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Rod>
            ))}
            <RoundedBox args={[0.18, 0.12, 0.08]} radius={0.025} smoothness={3} position={[0, 0.38, 0.01]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
          </group>
        </Sel>

        {/* Right Outboard Backrest (Seat_RR) */}
        <Sel cid="Seat_RR">
          <group position={[0.47, 0, 0]}>
            <RoundedBox args={[0.46, 0.52, 0.08]} radius={0.03} smoothness={3}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            <RoundedBox args={[0.36, 0.48, 0.085]} radius={0.02} smoothness={2} position={[0, 0, 0.005]}>
              <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
            </RoundedBox>
            {/* Right Outboard Torso Bolster */}
            <RoundedBox args={[0.065, 0.48, 0.1]} radius={0.025} smoothness={3} position={[0.2, 0, 0.015]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            {/* Headrest */}
            {[-0.06, 0.06].map((px) => (
              <Rod key={px} a={[px, 0.26, 0]} b={[px, 0.34, 0]} r={0.007}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Rod>
            ))}
            <RoundedBox args={[0.22, 0.14, 0.085]} radius={0.03} smoothness={3} position={[0, 0.4, 0.01]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
          </group>
        </Sel>
      </group>
    </group>
  );
}

/** Structural Cross-Car Magnesium / Steel Beam (CCB) */
function CrossCarStructuralBeam() {
  return (
    <Sel cid="CrossCarBeam">
      <group position={[0, 0.88, 1.15]}>
        {/* Main CCB Tubular Member spanning A-pillars */}
        <Cyl args={[0.028, 0.028, 1.64, 20]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#8e9ba9" metalness={0.92} roughness={0.3} />
        </Cyl>

        {/* Left & Right A-Pillar Mounting Flanges */}
        {[-0.81, 0.81].map((fx) => (
          <Box key={fx} args={[0.04, 0.14, 0.12]} position={[fx, 0, 0]}>
            <meshStandardMaterial {...M.steelDark} />
          </Box>
        ))}

        {/* Steering Column Support Cradle Structure */}
        <group position={[0.46, -0.04, -0.04]}>
          <Box args={[0.18, 0.08, 0.12]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#7a8898" metalness={0.88} roughness={0.35} />
          </Box>
          <Rod a={[-0.08, -0.15, 0.04]} b={[-0.08, 0, 0]} r={0.01}>
            <meshStandardMaterial {...M.steel} />
          </Rod>
          <Rod a={[0.08, -0.15, 0.04]} b={[0.08, 0, 0]} r={0.01}>
            <meshStandardMaterial {...M.steel} />
          </Rod>
        </group>

        {/* Center Tunnel Downward Brace Legs */}
        {[-0.14, 0.14].map((lx) => (
          <Rod key={lx} a={[lx, 0, 0]} b={[lx * 0.7, -0.32, 0.08]} r={0.012}>
            <meshStandardMaterial color="#8e9ba9" metalness={0.9} roughness={0.32} />
          </Rod>
        ))}

        {/* Passenger Airbag Structural Housing Bracket */}
        <Box args={[0.26, 0.1, 0.14]} position={[-0.46, 0.04, -0.02]}>
          <meshStandardMaterial color="#6a7788" metalness={0.85} roughness={0.4} />
        </Box>
      </group>
    </Sel>
  );
}

/** Cockpit Dashboard, Dual HD Displays & Concealed Climate Vents */
function DashboardCockpit() {
  return (
    <group>
      {/* Multi-Tier Ergonomic Dashboard Carrier */}
      <Sel cid="DashboardCarrier">
        <group position={[0, 0.96, 1.14]}>
          {/* Upper Soft-Touch Dashboard Pad with Windshield Defroster Vents */}
          <group position={[0, 0.06, 0]} rotation={[0.12, 0, 0]}>
            <RoundedBox args={[1.72, 0.12, 0.38]} radius={0.03} smoothness={3}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
            {/* Windshield defroster linear grille */}
            <Box args={[1.42, 0.01, 0.03]} position={[0, 0.062, 0.12]}>
              <meshStandardMaterial {...MAT_PIANO_BLACK} />
            </Box>
          </group>

          {/* Continuous Satin Metallic Accent Wing Blade */}
          <Box args={[1.7, 0.025, 0.34]} position={[0, 0.01, -0.02]}>
            <meshStandardMaterial {...MAT_BRUSHED_TITANIUM} />
          </Box>

          {/* Lower Dashboard Module & Glovebox */}
          <group position={[0, -0.12, 0.02]}>
            <RoundedBox args={[1.68, 0.18, 0.32]} radius={0.025} smoothness={3}>
              <meshStandardMaterial {...MAT_DOOR_CARD} />
            </RoundedBox>
            {/* Passenger Glovebox Lid with Satin Handle */}
            <group position={[-0.46, 0, -0.14]}>
              <Box args={[0.48, 0.14, 0.015]} position={[0, 0, 0]}>
                <meshStandardMaterial {...MAT_DOOR_CARD} />
              </Box>
              <Box args={[0.08, 0.015, 0.01]} position={[0.16, 0.04, -0.01]}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Box>
            </group>
          </group>
        </group>
      </Sel>

      {/* Hidden Continuous Horizontal HVAC Vents & Climate Module */}
      <Sel cid="HVACModule_Cabin">
        <group position={[0, 0.94, 1.05]}>
          {/* Continuous Louver Vent Strip across Dash */}
          <Box args={[1.56, 0.022, 0.04]} position={[0, 0, 0]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
          {/* Satin Chrome Airflow Direction Adjuster Tabs */}
          {[-0.62, -0.22, 0.22, 0.62].map((tx) => (
            <Box key={tx} args={[0.03, 0.014, 0.02]} position={[tx, 0, -0.015]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          ))}
          {/* Under-dash Climate Blower & Heat Exchanger Box */}
          <Box args={[0.48, 0.3, 0.32]} position={[0, -0.32, 0.12]}>
            <meshStandardMaterial {...M.dark} />
          </Box>
        </group>
      </Sel>

      {/* Driver 10.25" Digital Gauge Instrument Cluster */}
      <Sel cid="InstrumentCluster">
        <group position={[0.46, 1.05, 1.08]} rotation={[0.08, 0, 0]}>
          {/* Hooded Anti-Glare Cluster Bezel */}
          <RoundedBox args={[0.3, 0.16, 0.06]} radius={0.015} smoothness={2}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </RoundedBox>
          {/* High-Resolution Cluster Display Screen */}
          <Box args={[0.27, 0.13, 0.008]} position={[0, 0, -0.028]}>
            <meshStandardMaterial
              color="#041019"
              emissive="#00e5ff"
              emissiveIntensity={0.65}
              roughness={0.1}
              metalness={0.8}
            />
          </Box>
          {/* Speedometer & ADAS UI Graphic Elements */}
          <Box args={[0.07, 0.02, 0.002]} position={[0, 0.02, -0.033]}>
            <meshBasicMaterial color="#ffffff" />
          </Box>
          <Box args={[0.18, 0.008, 0.002]} position={[0, -0.035, -0.033]}>
            <meshBasicMaterial color="#38d9cf" />
          </Box>
        </group>
      </Sel>

      {/* Central 12.3" Panoramic Floating Infotainment Display */}
      <Sel cid="CenterDisplay">
        <group position={[0, 1.03, 1.04]} rotation={[0.06, -0.06, 0]}>
          {/* Magnesium Display Housing & Stand */}
          <Box args={[0.08, 0.06, 0.06]} position={[0, -0.08, 0.02]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Box>
          <RoundedBox args={[0.44, 0.19, 0.024]} radius={0.012} smoothness={2}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </RoundedBox>
          {/* Edge-to-edge Glass Touch Interface */}
          <Box args={[0.42, 0.17, 0.006]} position={[0, 0, -0.011]}>
            <meshStandardMaterial
              color="#081420"
              emissive="#2563eb"
              emissiveIntensity={0.5}
              roughness={0.08}
              metalness={0.85}
            />
          </Box>
          {/* Simulated UI Map & Status Bar */}
          <Box args={[0.38, 0.012, 0.002]} position={[0, 0.065, -0.015]}>
            <meshBasicMaterial color="#38bdf8" />
          </Box>
          <Box args={[0.16, 0.08, 0.002]} position={[-0.1, -0.01, -0.015]}>
            <meshBasicMaterial color="#1e3a8a" />
          </Box>
        </group>
      </Sel>
    </group>
  );
}

/** Flat-Bottom EV Sports Steering Wheel & Column Assembly */
function SteeringAssembly() {
  const x = 0.46;
  const y = 0.94;
  const z = 0.88;

  return (
    <group position={[x, y, z]}>
      {/* Telescopic Steering Column Shroud */}
      <Sel cid="SteeringColumn">
        <group position={[0, -0.02, 0.1]} rotation={[0.32, 0, 0]}>
          <Box args={[0.15, 0.13, 0.22]} position={[0, 0, 0]}>
            <meshStandardMaterial {...MAT_DOOR_CARD} />
          </Box>

          {/* Left Turn Indicator & Lighting Control Stalk */}
          <group position={[-0.09, 0.02, -0.02]} rotation={[0, 0, 0.25]}>
            <Rod a={[0, 0, 0]} b={[-0.11, 0.02, 0]} r={0.007}>
              <meshStandardMaterial {...MAT_PIANO_BLACK} />
            </Rod>
            <Cyl args={[0.01, 0.01, 0.035, 12]} position={[-0.1, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Cyl>
          </group>

          {/* Right Windshield Wiper / Washer Stalk */}
          <group position={[0.09, 0.02, -0.02]} rotation={[0, 0, -0.25]}>
            <Rod a={[0, 0, 0]} b={[0.11, 0.02, 0]} r={0.007}>
              <meshStandardMaterial {...MAT_PIANO_BLACK} />
            </Rod>
            <Cyl args={[0.01, 0.01, 0.035, 12]} position={[0.1, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Cyl>
          </group>

          {/* Regenerative Braking Strength Paddle Shifters (-, +) */}
          {[-0.08, 0.08].map((px) => (
            <Box key={px} args={[0.035, 0.06, 0.008]} position={[px, 0.04, -0.06]}>
              <meshStandardMaterial {...MAT_BRUSHED_TITANIUM} />
            </Box>
          ))}
        </group>
      </Sel>

      {/* Flat-Bottom Modern Sports Steering Wheel */}
      <Sel cid="SteeringWheel">
        <group position={[0, 0.02, 0]} rotation={[0.32, 0, 0]}>
          {/* Flat-Bottom Outer Rim Ring */}
          <group position={[0, 0, 0]}>
            {/* Top Curved Rim */}
            <mesh position={[0, 0.02, 0]}>
              <torusGeometry args={[0.17, 0.018, 16, 32, Math.PI * 1.5]} />
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </mesh>
            {/* Flat Bottom Section */}
            <Box args={[0.22, 0.034, 0.034]} position={[0, -0.16, 0]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </Box>
            {/* Top 12 o'clock Cyan Center Marker */}
            <Box args={[0.025, 0.038, 0.038]} position={[0, 0.188, 0]}>
              <meshStandardMaterial {...MAT_PIPING} />
            </Box>
          </group>

          {/* Center Airbag Hub / Horn Pad with SHIELD Emblem */}
          <group position={[0, 0, 0.015]}>
            <RoundedBox args={[0.14, 0.12, 0.04]} radius={0.02} smoothness={2}>
              <meshStandardMaterial {...MAT_LEATHER_ACCENT} />
            </RoundedBox>
            {/* Chrome SHIELD Crest */}
            <Cyl args={[0.022, 0.022, 0.008, 16]} position={[0, 0.01, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Cyl>
          </group>

          {/* 3 Spokes (Left, Right, Bottom) */}
          {/* Left Spoke with Capacitive Audio & Voice Controls */}
          <group position={[-0.09, 0, 0.01]}>
            <Box args={[0.08, 0.04, 0.018]} position={[0, 0, 0]}>
              <meshStandardMaterial {...MAT_PIANO_BLACK} />
            </Box>
            <Box args={[0.05, 0.025, 0.006]} position={[0, 0, 0.01]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          </group>

          {/* Right Spoke with ADAS & Adaptive Cruise Controls */}
          <group position={[0.09, 0, 0.01]}>
            <Box args={[0.08, 0.04, 0.018]} position={[0, 0, 0]}>
              <meshStandardMaterial {...MAT_PIANO_BLACK} />
            </Box>
            <Box args={[0.05, 0.025, 0.006]} position={[0, 0, 0.01]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          </group>

          {/* Bottom Center Spoke with Satin Accent Inset */}
          <Box args={[0.04, 0.09, 0.016]} position={[0, -0.09, 0.01]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Box>
        </group>
      </Sel>
    </group>
  );
}

/** Floating Bridge Center Console & Controls */
function CenterConsoleBridge() {
  return (
    <Sel cid="CenterConsole">
      <group position={[0, FLOOR + 0.06, 0.38]}>
        {/* Main Floating Bridge Structure */}
        <RoundedBox args={[0.34, 0.22, 1.15]} radius={0.03} smoothness={3} position={[0, 0.09, 0]}>
          <meshStandardMaterial {...MAT_DOOR_CARD} />
        </RoundedBox>

        {/* Satin Metallic Edge Flank Trim */}
        {[-0.175, 0.175].map((sx) => (
          <Box key={sx} args={[0.012, 0.03, 1.1]} position={[sx, 0.19, 0]}>
            <meshStandardMaterial {...MAT_BRUSHED_TITANIUM} />
          </Box>
        ))}

        {/* Top Control Deck with High-Gloss Piano Black Finish */}
        <RoundedBox args={[0.3, 0.02, 1.08]} radius={0.015} smoothness={2} position={[0, 0.205, 0]}>
          <meshStandardMaterial {...MAT_PIANO_BLACK} />
        </RoundedBox>

        {/* Rotary Shift-By-Wire EV Gear Selector Dial (P - R - N - D) */}
        <group position={[0, 0.225, 0.36]}>
          <Cyl args={[0.042, 0.045, 0.028, 24]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Cyl>
          {/* Top Knurled Ring & Indicator LED */}
          <Cyl args={[0.036, 0.036, 0.004, 24]} position={[0, 0.015, 0]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Cyl>
          <Box args={[0.012, 0.004, 0.004]} position={[0, 0.017, -0.022]}>
            <meshBasicMaterial color="#38d9cf" />
          </Box>
        </group>

        {/* Electronic Parking Brake (EPB) & Auto-Hold Switch */}
        <group position={[0, 0.22, 0.24]}>
          <Box args={[0.06, 0.016, 0.04]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Box>
          <Box args={[0.04, 0.008, 0.02]} position={[0, 0, 0.04]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
        </group>

        {/* Qi Wireless Smartphone Charging Cradle */}
        <group position={[0, 0.21, 0.09]}>
          <Box args={[0.16, 0.008, 0.19]}>
            <meshStandardMaterial color="#1e2530" roughness={0.9} />
          </Box>
          <Box args={[0.02, 0.002, 0.006]} position={[0, 0.005, -0.08]}>
            <meshBasicMaterial color="#22c55e" />
          </Box>
        </group>

        {/* Twin Beverage Cupholders with Rubber Tabs */}
        <group position={[0, 0.21, -0.09]}>
          {[-0.055, 0.055].map((cz) => (
            <group key={cz} position={[0, 0, cz]}>
              <Cyl args={[0.042, 0.042, 0.035, 20]}>
                <meshStandardMaterial {...MAT_PIANO_BLACK} />
              </Cyl>
              <Cyl args={[0.046, 0.046, 0.004, 20]} position={[0, 0.018, 0]}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Cyl>
            </group>
          ))}
        </group>

        {/* Sculpted Split Butterfly Opening Leather Central Armrest */}
        <group position={[0, 0.24, -0.36]}>
          {[-0.075, 0.075].map((ax) => (
            <RoundedBox key={ax} args={[0.14, 0.06, 0.36]} radius={0.02} smoothness={3} position={[ax, 0, 0]}>
              <meshStandardMaterial {...MAT_LEATHER_DARK} />
            </RoundedBox>
          ))}
          {/* Piping detail on armrest */}
          <Rod a={[-0.14, 0.03, -0.17]} b={[-0.14, 0.03, 0.17]} r={0.003}>
            <meshStandardMaterial {...MAT_PIPING} />
          </Rod>
          <Rod a={[0.14, 0.03, -0.17]} b={[0.14, 0.03, 0.17]} r={0.003}>
            <meshStandardMaterial {...MAT_PIPING} />
          </Rod>
        </group>

        {/* Lower Bridge Open Pass-Through Storage Cavern */}
        <Box args={[0.26, 0.08, 0.6]} position={[0, -0.03, 0.1]}>
          <meshStandardMaterial color="#10141a" roughness={0.9} />
        </Box>

        {/* Rear Face Climate Vents & Dual USB-C Outlets for Rear Passengers */}
        <group position={[0, 0.12, -0.58]} rotation={[0, Math.PI, 0]}>
          <Box args={[0.16, 0.08, 0.02]} position={[0, 0.04, 0]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
          {[-0.04, 0.04].map((vx) => (
            <Box key={vx} args={[0.03, 0.012, 0.01]} position={[vx, 0.04, 0.012]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          ))}
          <Box args={[0.06, 0.02, 0.01]} position={[0, -0.02, 0.01]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Box>
        </group>
      </group>
    </Sel>
  );
}

/** Driver Ergonomic Drive-By-Wire Pedal Box */
function DriverPedalBox() {
  const x = 0.46;
  const y = FLOOR + 0.06;
  const z = 1.18;

  return (
    <Sel cid="PedalBox">
      <group position={[x, y, z]}>
        {/* Drive-By-Wire Electronic Accelerator Pedal */}
        <group position={[0.09, 0.04, -0.04]} rotation={[0.3, 0, 0]}>
          <Rod a={[0, 0.16, 0.04]} b={[0, 0.04, 0]} r={0.007}>
            <meshStandardMaterial {...M.steelDark} />
          </Rod>
          <Box args={[0.038, 0.11, 0.015]} position={[0, 0.02, -0.01]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
          <Box args={[0.028, 0.09, 0.005]} position={[0, 0.02, -0.018]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Box>
        </group>

        {/* Wide Regenerative Brake Pedal */}
        <group position={[-0.04, 0.06, -0.03]} rotation={[0.26, 0, 0]}>
          <Rod a={[0, 0.18, 0.05]} b={[0, 0.06, 0]} r={0.01}>
            <meshStandardMaterial {...M.steelDark} />
          </Rod>
          <Box args={[0.07, 0.065, 0.018]} position={[0, 0.03, -0.01]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
          {/* Anti-slip rubber ribs */}
          {[-0.015, 0, 0.015].map((ry) => (
            <Box key={ry} args={[0.055, 0.006, 0.006]} position={[0, 0.03 + ry, -0.02]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          ))}
        </group>

        {/* Driver Left Dead-Pedal Footrest Plate */}
        <group position={[-0.14, 0.04, 0.02]} rotation={[0.35, 0, 0]}>
          <Box args={[0.06, 0.16, 0.015]}>
            <meshStandardMaterial {...MAT_DOOR_CARD} />
          </Box>
          <Box args={[0.045, 0.13, 0.006]} position={[0, 0, -0.01]}>
            <meshStandardMaterial {...MAT_BRUSHED_TITANIUM} />
          </Box>
        </group>
      </group>
    </Sel>
  );
}

/** Molded Interior Door Trim Card */
function InteriorDoorCard(props: {
  cid: string;
  side: 1 | -1;
  isFront: boolean;
  zPos: number;
}) {
  const { cid, side, isFront, zPos } = props;
  const xPos = side * 0.885;
  const yPos = 0.88;
  const length = isFront ? 0.68 : 0.54;

  return (
    <Sel cid={cid}>
      <group position={[xPos, yPos, zPos]} rotation={[0, side < 0 ? 0 : Math.PI, 0]}>
        {/* Molded Inner Door Panel Card Body */}
        <RoundedBox args={[0.04, 0.44, length]} radius={0.02} smoothness={2} position={[-0.01, 0, 0]}>
          <meshStandardMaterial {...MAT_DOOR_CARD} />
        </RoundedBox>

        {/* Soft-Touch Leather Armrest Pad */}
        <group position={[0.015, -0.02, 0]}>
          <RoundedBox args={[0.045, 0.065, length * 0.7]} radius={0.015} smoothness={2}>
            <meshStandardMaterial {...MAT_LEATHER_DARK} />
          </RoundedBox>
          {/* Piping Accent */}
          <Rod a={[0.022, 0.033, -length * 0.3]} b={[0.022, 0.033, length * 0.3]} r={0.0025}>
            <meshStandardMaterial {...MAT_PIPING} />
          </Rod>
        </group>

        {/* Satin Chrome Interior Door Release Latch */}
        <group position={[0.015, 0.11, isFront ? 0.16 : 0.12]}>
          <Box args={[0.02, 0.045, 0.08]} position={[-0.005, 0, 0]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
          <Box args={[0.015, 0.02, 0.06]} position={[0.005, 0, -0.01]} rotation={[0, 0.1, 0]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Box>
        </group>

        {/* Power Window & Mirror Switch Pod */}
        <group position={[0.02, 0.02, isFront ? 0.14 : 0.08]} rotation={[0, 0, 0.1]}>
          <Box args={[0.035, 0.012, isFront ? 0.12 : 0.06]}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Box>
          {/* Switch toggles */}
          {isFront ? (
            <>
              {[-0.03, 0, 0.03].map((sz) => (
                <Box key={sz} args={[0.015, 0.01, 0.018]} position={[0, 0.008, sz]}>
                  <meshStandardMaterial {...MAT_SATIN_CHROME} />
                </Box>
              ))}
            </>
          ) : (
            <Box args={[0.015, 0.01, 0.02]} position={[0, 0.008, 0]}>
              <meshStandardMaterial {...MAT_SATIN_CHROME} />
            </Box>
          )}
        </group>

        {/* Premium Acoustic Speaker Grille */}
        <group position={[0.012, -0.14, isFront ? 0.18 : 0.12]}>
          <Cyl args={[0.065, 0.065, 0.012, 24]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial {...MAT_SPEAKER_GRILLE} />
          </Cyl>
          <Cyl args={[0.068, 0.068, 0.004, 24]} position={[0.004, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial {...MAT_SATIN_CHROME} />
          </Cyl>
        </group>

        {/* Lower Door Map Pocket with 1.0L Bottle Holder Recess */}
        <Box args={[0.035, 0.12, length * 0.75]} position={[0.015, -0.14, -0.06]}>
          <meshStandardMaterial {...MAT_DOOR_CARD} />
        </Box>
      </group>
    </Sel>
  );
}

/** Overhead Console & Frameless Auto-Dimming Mirror */
function OverheadConsoleAndMirror() {
  return (
    <group>
      {/* Overhead Roof Console Module */}
      <Sel cid="OverheadConsole">
        <group position={[0, 1.54, 0.96]} rotation={[-0.14, 0, 0]}>
          <RoundedBox args={[0.26, 0.03, 0.24]} radius={0.015} smoothness={2}>
            <meshStandardMaterial {...MAT_DOOR_CARD} />
          </RoundedBox>
          {/* Dual LED Map Reading Spotlights */}
          {[-0.07, 0.07].map((lx) => (
            <Cyl key={lx} args={[0.022, 0.022, 0.008, 16]} position={[lx, -0.012, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.8} />
            </Cyl>
          ))}
          {/* Emergency SOS e-Call Flap Button */}
          <Box args={[0.035, 0.012, 0.025]} position={[0, -0.012, -0.04]}>
            <meshStandardMaterial color="#dc2626" />
          </Box>
        </group>
      </Sel>

      {/* Frameless Auto-Dimming Rearview Mirror */}
      <Sel cid="RearviewMirror">
        <group position={[0, 1.45, 1.02]}>
          {/* Windshield Mounting Bracket & ADAS Camera Cowl */}
          <Rod a={[0, 0.07, 0.06]} b={[0, 0, 0]} r={0.008}>
            <meshStandardMaterial {...MAT_PIANO_BLACK} />
          </Rod>
          {/* Mirror Glass & Bezel */}
          <group position={[0, 0, 0]} rotation={[0.1, 0, 0]}>
            <RoundedBox args={[0.24, 0.07, 0.012]} radius={0.01} smoothness={2}>
              <meshStandardMaterial {...MAT_PIANO_BLACK} />
            </RoundedBox>
            <Box args={[0.23, 0.062, 0.003]} position={[0, 0, -0.007]}>
              <meshStandardMaterial color="#94a3b8" metalness={0.98} roughness={0.05} />
            </Box>
          </group>
        </group>
      </Sel>
    </group>
  );
}

/** Complete Vehicle Interior Cabin Subassembly */
export function Cabin() {
  return (
    <group name="shield-interior-cabin">
      {/* ---------------- CABIN FLOOR & ACOUSTIC CARPETING ---------------- */}
      <Sel cid="InteriorTrim_Floor">
        <group position={[0, FLOOR + 0.012, -0.15]}>
          <Box args={[1.74, 0.025, 3.12]}>
            <meshStandardMaterial {...MAT_CARPET} />
          </Box>
          {/* Driver Heel Rest Pad */}
          <Box args={[0.34, 0.008, 0.42]} position={[0.46, 0.015, 0.54]}>
            <meshStandardMaterial color="#1f242d" roughness={0.9} />
          </Box>
        </group>
      </Sel>

      {/* ---------------- ROOF HEADLINER & SUN VISORS ---------------- */}
      <Sel cid="InteriorTrim_Headliner">
        <group position={[0, 1.552, -0.42]}>
          <Box args={[1.72, 0.02, 2.22]}>
            <meshStandardMaterial color="#2d3440" roughness={0.85} metalness={0.1} />
          </Box>
          {/* Driver & Passenger Sun Visors */}
          {[-0.46, 0.46].map((vx) => (
            <group key={vx} position={[vx, -0.015, 1.34]} rotation={[-0.1, 0, 0]}>
              <RoundedBox args={[0.32, 0.015, 0.14]} radius={0.01} smoothness={2}>
                <meshStandardMaterial {...MAT_DOOR_CARD} />
              </RoundedBox>
            </group>
          ))}
        </group>
      </Sel>

      {/* ---------------- REAR CARGO PARCEL SHELF & TRUNK FLOOR ---------------- */}
      <Sel cid="InteriorTrim_Cargo">
        <group>
          {/* Rigid Tonneau Parcel Privacy Shelf */}
          <RoundedBox args={[1.42, 0.025, 0.52]} radius={0.015} smoothness={2} position={[0, 0.96, -1.42]}>
            <meshStandardMaterial {...MAT_DOOR_CARD} />
          </RoundedBox>
          {/* Flat Heavy-Duty Luggage Trunk Floor */}
          <Box args={[1.48, 0.03, 0.95]} position={[0, FLOOR + 0.03, -1.65]}>
            <meshStandardMaterial {...MAT_CARPET} />
          </Box>
          {/* Chrome Tie-down D-Rings in Trunk */}
          {[-0.55, 0.55].map((tx) =>
            [-1.35, -1.95].map((tz) => (
              <Cyl key={`${tx}_${tz}`} args={[0.02, 0.02, 0.006, 16]} position={[tx, FLOOR + 0.05, tz]}>
                <meshStandardMaterial {...MAT_SATIN_CHROME} />
              </Cyl>
            ))
          )}
        </group>
      </Sel>

      {/* ---------------- STRUCTURAL CROSS-CAR BEAM (CCB) ---------------- */}
      <CrossCarStructuralBeam />

      {/* ---------------- DASHBOARD, DIGITAL DISPLAYS & HVAC ---------------- */}
      <DashboardCockpit />

      {/* ---------------- SPORTS STEERING WHEEL & COLUMN ---------------- */}
      <SteeringAssembly />

      {/* ---------------- FLOATING BRIDGE CENTER CONSOLE ---------------- */}
      <CenterConsoleBridge />

      {/* ---------------- DRIVER ERGONOMIC PEDAL BOX ---------------- */}
      <DriverPedalBox />

      {/* ---------------- FRONT ROW SEATING ---------------- */}
      {/* Driver Seat (Right Hand Drive / Tata Engineering standard) */}
      <FrontBucketSeat
        cid="Seat_FL"
        railCid="SeatRail_FL"
        anchorCid="SeatbeltAnchor_FL"
        x={SEAT_X}
        z={0.28}
        isDriver={true}
      />
      {/* Front Passenger Seat */}
      <FrontBucketSeat
        cid="Seat_FR"
        railCid="SeatRail_FR"
        anchorCid="SeatbeltAnchor_FR"
        x={-SEAT_X}
        z={0.28}
        isDriver={false}
      />

      {/* ---------------- REAR ROW 60:40 SPLIT SEATING BENCH ---------------- */}
      <RearSeatingAssembly />

      {/* ---------------- 4 MOLDED INTERIOR DOOR CARDS ---------------- */}
      <InteriorDoorCard cid="DoorTrim_FL" side={1} isFront={true} zPos={0.22} />
      <InteriorDoorCard cid="DoorTrim_FR" side={-1} isFront={true} zPos={0.22} />
      <InteriorDoorCard cid="DoorTrim_RL" side={1} isFront={false} zPos={-0.48} />
      <InteriorDoorCard cid="DoorTrim_RR" side={-1} isFront={false} zPos={-0.48} />

      {/* ---------------- OVERHEAD CONSOLE & MIRROR ---------------- */}
      <OverheadConsoleAndMirror />
    </group>
  );
}
