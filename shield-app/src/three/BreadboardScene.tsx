/* ============================================================
   SHIELD — 3D Interactive Hardware Breadboard & Circuit Twin
   Full 3D interactive hardware scene featuring:
   - Procedural 3D White Solderless Breadboard with Power Rails (+ / -)
   - 3D ESP32-C3 Dev Board with Onboard Status LED
   - 3D HX711 ADC & Dual Aluminum Load Cell Bars
   - 3D MPU6050 IMU & Stainless DS18B20 Probe
   - 3D L298N Motor Driver, Coin Vibration Motor, & Piezo Buzzer
   - Dynamic 3D Emissive Traffic LEDs (Green / Yellow / Red)
   - 3D Curve Tube Jumper Wires connecting GPIO Pins
   - 3D Orbit Controls & Component Selection Highlighting
   ============================================================ */

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

interface BreadboardSceneProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  loadForceN: number;
  tempC: number;
  vibrationActive: boolean;
  buzzerBeeping: boolean;
  isConnected: boolean;
}

/** 3D Curved Jumper Wire Component */
function JumperWire({
  start,
  end,
  color,
  selected,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  selected?: boolean;
}) {
  const curve = useMemo(() => {
    const p1 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const midY = Math.max(p1.y, p2.y) + 0.35 + Math.random() * 0.15;
    const mid = new THREE.Vector3((p1.x + p2.x) / 2, midY, (p1.z + p2.z) / 2);
    return new THREE.QuadraticBezierCurve3(p1, mid, p2);
  }, [start, end]);

  const geom = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.012, 8, false), [curve]);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        color={color}
        metalness={0.2}
        roughness={0.4}
        emissive={selected ? color : '#000000'}
        emissiveIntensity={selected ? 0.6 : 0}
      />
    </mesh>
  );
}

/** 3D Solderless Breadboard Base */
function BreadboardBase() {
  return (
    <group position={[0, 0, 0]}>
      {/* White Plastic Base */}
      <mesh castShadow receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[3.2, 0.1, 1.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Red Power Rail Line (+) */}
      <mesh position={[0, 0.001, 0.78]}>
        <planeGeometry args={[3.0, 0.02]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Blue Ground Rail Line (-) */}
      <mesh position={[0, 0.001, 0.82]}>
        <planeGeometry args={[3.0, 0.02]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* Red Power Rail Line Top (+) */}
      <mesh position={[0, 0.001, -0.78]}>
        <planeGeometry args={[3.0, 0.02]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Blue Ground Rail Line Top (-) */}
      <mesh position={[0, 0.001, -0.82]}>
        <planeGeometry args={[3.0, 0.02]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* Center Divider Channel */}
      <mesh position={[0, 0.001, 0]}>
        <boxGeometry args={[3.1, 0.01, 0.08]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** 3D ESP32-C3 Master Board */
function Esp32Board({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  const ledRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (ledRef.current) {
      ledRef.current.emissiveIntensity = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4);
    }
  });

  return (
    <group position={[0, 0.06, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Black PCB Board */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.55, 0.04, 1.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Metal RF Shield Cover */}
      <mesh castShadow position={[0, 0.035, -0.2]}>
        <boxGeometry args={[0.38, 0.03, 0.45]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* USB-C Connector */}
      <mesh position={[0, 0.025, 0.58]}>
        <boxGeometry args={[0.22, 0.03, 0.12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Onboard Status Blue LED */}
      <mesh position={[-0.18, 0.03, 0.35]}>
        <boxGeometry args={[0.04, 0.02, 0.04]} />
        <meshStandardMaterial ref={ledRef} color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>

      {/* Pin Headers */}
      {[-0.24, 0.24].map((x, i) => (
        <mesh key={i} position={[x, -0.03, 0]}>
          <boxGeometry args={[0.04, 0.06, 1.15]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}

      {/* Highlight Box */}
      {selected && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.62, 0.12, 1.28]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.6} />
        </mesh>
      )}

      {/* Tag Label */}
      <Html position={[0, 0.25, 0]} center>
        <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow">
          ESP32-C3
        </span>
      </Html>
    </group>
  );
}

/** 3D HX711 ADC & Load Cells */
function Hx711AndLoadCell({
  selected,
  onClick,
  loadForceN,
}: {
  selected: boolean;
  onClick: () => void;
  loadForceN: number;
}) {
  return (
    <group position={[-1.0, 0.06, 0.3]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Green HX711 PCB */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.45, 0.03, 0.35]} />
        <meshStandardMaterial color="#059669" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* HX711 IC Chip */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.18, 0.02, 0.12]} />
        <meshStandardMaterial color="#090d16" />
      </mesh>

      {/* Aluminum Load Cell Metal Bar */}
      <group position={[-0.6, 0.05, -0.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.65, 0.16, 0.18]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Strain Gauge Patch */}
        <mesh position={[0, 0.085, 0]}>
          <boxGeometry args={[0.22, 0.01, 0.12]} />
          <meshStandardMaterial color={loadForceN > 1200 ? '#ef4444' : loadForceN > 500 ? '#f59e0b' : '#10b981'} />
        </mesh>
      </group>

      {/* Highlight Box */}
      {selected && (
        <mesh position={[-0.3, 0.05, -0.1]}>
          <boxGeometry args={[1.4, 0.25, 0.9]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.6} />
        </mesh>
      )}

      {/* Tag Label */}
      <Html position={[0, 0.22, 0]} center>
        <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-emerald-400 text-emerald-300 font-mono text-[9px] font-bold shadow">
          HX711 ({loadForceN.toFixed(0)}N)
        </span>
      </Html>
    </group>
  );
}

/** 3D MPU6050 IMU */
function Mpu6050Sensor({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <group position={[-1.0, 0.06, -0.4]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Blue PCB */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.42, 0.03, 0.32]} />
        <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* IC Chip */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.14, 0.02, 0.14]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Highlight Box */}
      {selected && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.5, 0.12, 0.4]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.6} />
        </mesh>
      )}
      <Html position={[0, 0.22, 0]} center>
        <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-sky-400 text-sky-300 font-mono text-[9px] font-bold shadow">
          MPU6050
        </span>
      </Html>
    </group>
  );
}

/** 3D DS18B20 Temp Probe */
function Ds18b20Probe({ selected, onClick, tempC }: { selected: boolean; onClick: () => void; tempC: number }) {
  return (
    <group position={[-0.5, 0.05, -0.75]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Stainless Steel Probe Cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.35, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Cable */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.3, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {selected && (
        <mesh position={[-0.05, 0.05, 0]}>
          <boxGeometry args={[0.65, 0.12, 0.2]} />
          <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.6} />
        </mesh>
      )}
      <Html position={[-0.2, 0.18, 0]} center>
        <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-400 text-amber-300 font-mono text-[9px] font-bold shadow">
          DS18B20 ({tempC.toFixed(1)}°C)
        </span>
      </Html>
    </group>
  );
}

/** 3D Traffic LEDs (Green, Yellow, Red) */
function TrafficLeds({
  selected,
  onClick,
  loadForceN,
}: {
  selected: boolean;
  onClick: () => void;
  loadForceN: number;
}) {
  const isRed = loadForceN > 1200;
  const isYellow = loadForceN > 500 && loadForceN <= 1200;
  const isGreen = loadForceN <= 500;

  return (
    <group position={[0.9, 0.1, 0.2]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Green LED */}
      <mesh position={[-0.15, 0.12, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.15, 16]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={isGreen ? 1.5 : 0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Yellow LED */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.15, 16]} />
        <meshStandardMaterial
          color="#eab308"
          emissive="#eab308"
          emissiveIntensity={isYellow ? 1.5 : 0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Red LED */}
      <mesh position={[0.15, 0.12, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.15, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={isRed ? 1.8 : 0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {selected && (
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.45, 0.25, 0.2]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.6} />
        </mesh>
      )}

      <Html position={[0, 0.28, 0]} center>
        <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-emerald-400 text-emerald-300 font-mono text-[9px] font-bold shadow">
          LEDs: {isRed ? '🔴 RED' : isYellow ? '🟡 YELLOW' : '🟢 GREEN'}
        </span>
      </Html>
    </group>
  );
}

/** 3D L298N Motor Driver, Coin Motor, & Buzzer */
function ActuatorsModule({
  selected,
  onClick,
  vibrationActive,
  buzzerBeeping,
}: {
  selected: boolean;
  onClick: () => void;
  vibrationActive: boolean;
  buzzerBeeping: boolean;
}) {
  return (
    <group position={[0.9, 0.08, -0.4]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* L298N Red Driver PCB */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.55, 0.04, 0.55]} />
        <meshStandardMaterial color="#dc2626" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Black Aluminum Heatsink */}
      <mesh position={[0, 0.12, -0.05]}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Coin Vibration Motor */}
      <Float speed={vibrationActive ? 8 : 0} rotationIntensity={vibrationActive ? 2 : 0} floatIntensity={0}>
        <group position={[0.45, 0.05, 0.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 20]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
          <Html position={[0, 0.15, 0]} center>
            <span className={`px-1 rounded font-mono text-[8px] font-bold ${vibrationActive ? 'bg-amber-500 text-black animate-pulse' : 'bg-slate-950 text-slate-400'}`}>
              {vibrationActive ? '⚡ VIBRATING' : 'MOTOR'}
            </span>
          </Html>
        </group>
      </Float>

      {/* Piezo Buzzer */}
      <group position={[0.45, 0.08, -0.2]}>
        <mesh>
          <cylinderGeometry args={[0.075, 0.075, 0.14, 20]} />
          <meshStandardMaterial color="#090d16" metalness={0.2} roughness={0.6} />
        </mesh>
        <Html position={[0, 0.18, 0]} center>
          <span className={`px-1 rounded font-mono text-[8px] font-bold ${buzzerBeeping ? 'bg-purple-500 text-white animate-ping' : 'bg-slate-950 text-slate-400'}`}>
            {buzzerBeeping ? '🔔 BEEP' : 'BUZZER'}
          </span>
        </Html>
      </group>

      {selected && (
        <mesh position={[0.2, 0.1, 0]}>
          <boxGeometry args={[0.9, 0.3, 0.7]} />
          <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.6} />
        </mesh>
      )}

      <Html position={[0, 0.28, -0.05]} center>
        <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-red-400 text-red-300 font-mono text-[9px] font-bold shadow">
          L298N / ACTUATORS
        </span>
      </Html>
    </group>
  );
}

export type CameraPreset = 'default' | 'top' | 'front' | 'side' | 'esp32';

interface BreadboardSceneProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  loadForceN: number;
  tempC: number;
  vibrationActive: boolean;
  buzzerBeeping: boolean;
  isConnected: boolean;
  cameraPreset?: CameraPreset;
  autoRotate?: boolean;
  showCallouts?: boolean;
}

/** Camera Controller for View Presets & Auto Rotation */
function CameraRig({ preset = 'default', autoRotate = false }: { preset?: CameraPreset; autoRotate?: boolean }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    const targetMap: Record<CameraPreset, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
      default: { pos: [0, 2.2, 2.4], lookAt: [0, 0, 0] },
      top: { pos: [0, 3.2, 0.001], lookAt: [0, 0, 0] },
      front: { pos: [0, 0.9, 2.6], lookAt: [0, 0, 0] },
      side: { pos: [2.8, 1.0, 0], lookAt: [0, 0, 0] },
      esp32: { pos: [0, 0.7, 0.9], lookAt: [0, 0.06, 0] },
    };
    const t = targetMap[preset] || targetMap.default;
    controlsRef.current.object.position.set(...t.pos);
    controlsRef.current.target.set(...t.lookAt);
    controlsRef.current.update();
  }, [preset]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={1.8}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={0.5}
      maxDistance={6.0}
    />
  );
}

export function BreadboardScene({
  activeModule,
  setActiveModule,
  loadForceN,
  tempC,
  vibrationActive,
  buzzerBeeping,
  isConnected,
  cameraPreset = 'default',
  autoRotate = false,
  showCallouts = true,
}: BreadboardSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 2.2, 2.4], fov: 45 }}
        onPointerMissed={() => setActiveModule('esp32c3')}
      >
        <color attach="background" args={['#070b11']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} castShadow />
        <directionalLight position={[-3, 4, -2]} intensity={0.6} color="#38bdf8" />

        <CameraRig preset={cameraPreset} autoRotate={autoRotate} />

        {/* Main 3D Breadboard Assembly */}
        <group position={[0, -0.2, 0]}>
          <BreadboardBase />

          {/* 3D Hardware Modules */}
          <Esp32Board selected={activeModule === 'esp32c3'} onClick={() => setActiveModule('esp32c3')} />
          <Hx711AndLoadCell selected={activeModule === 'hx711' || activeModule === 'loadcell'} onClick={() => setActiveModule('hx711')} loadForceN={loadForceN} />
          <Mpu6050Sensor selected={activeModule === 'mpu6050'} onClick={() => setActiveModule('mpu6050')} />
          <Ds18b20Probe selected={activeModule === 'ds18b20'} onClick={() => setActiveModule('ds18b20')} tempC={tempC} />
          <TrafficLeds selected={activeModule === 'traffic_leds'} onClick={() => setActiveModule('traffic_leds')} loadForceN={loadForceN} />
          <ActuatorsModule selected={activeModule === 'l298n' || activeModule === 'motor' || activeModule === 'buzzer'} onClick={() => setActiveModule('l298n')} vibrationActive={vibrationActive} buzzerBeeping={buzzerBeeping} />

          {/* ESP32 Interactive Callout Badges */}
          {showCallouts && (
            <group position={[0, 0.06, 0]}>
              <Html position={[0, 0.16, -0.55]} center>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-mono text-[9px] font-bold shadow-lg animate-pulse whitespace-nowrap">
                  📡 PCB Antenna (2.4GHz Wi-Fi / BLE 5)
                </span>
              </Html>

              <Html position={[0, 0.12, -0.2]} center>
                <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-400 text-slate-200 font-mono text-[9px] font-bold shadow-lg whitespace-nowrap">
                  🛡️ ESP32-C3 RISC-V 32-bit
                </span>
              </Html>

              <Html position={[0, 0.1, 0.58]} center>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-mono text-[9px] font-bold shadow-lg whitespace-nowrap">
                  ⚡ USB-C 5V / Serial
                </span>
              </Html>

              <Html position={[-0.28, 0.08, 0.0]} center>
                <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-400 text-amber-200 font-mono text-[8px] font-bold shadow-lg whitespace-nowrap">
                  📌 GPIO Headers
                </span>
              </Html>
            </group>
          )}

          {/* 3D Colored Jumper Wires connecting GPIO Pins */}
          <JumperWire start={[0.24, 0.08, 0.2]} end={[0.75, 0.12, 0.2]} color="#ef4444" selected={activeModule === 'traffic_leds'} />
          <JumperWire start={[0.24, 0.08, 0.1]} end={[0.9, 0.12, 0.2]} color="#eab308" selected={activeModule === 'traffic_leds'} />
          <JumperWire start={[0.24, 0.08, 0.0]} end={[1.05, 0.12, 0.2]} color="#10b981" selected={activeModule === 'traffic_leds'} />

          <JumperWire start={[-0.24, 0.08, 0.1]} end={[-0.8, 0.08, 0.3]} color="#06b6d4" selected={activeModule === 'hx711'} />
          <JumperWire start={[-0.24, 0.08, 0.2]} end={[-0.8, 0.08, 0.4]} color="#3b82f6" selected={activeModule === 'hx711'} />

          <JumperWire start={[-0.24, 0.08, -0.2]} end={[-0.8, 0.08, -0.4]} color="#a855f7" selected={activeModule === 'mpu6050'} />
          <JumperWire start={[-0.24, 0.08, -0.3]} end={[-0.8, 0.08, -0.3]} color="#f97316" selected={activeModule === 'mpu6050'} />

          <JumperWire start={[0.24, 0.08, -0.3]} end={[0.7, 0.1, -0.4]} color="#dc2626" selected={activeModule === 'l298n'} />
          <JumperWire start={[0.24, 0.08, -0.4]} end={[1.35, 0.1, -0.2]} color="#a855f7" selected={activeModule === 'buzzer'} />
        </group>
      </Canvas>
    </div>
  );
}
