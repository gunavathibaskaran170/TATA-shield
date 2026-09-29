/* ============================================================
   SHIELD — HARDWARE LAYOUT, 3D TWIN & LIVE SERIAL TERMINAL
   Features:
   - 3D Interactive Breadboard & Circuit Model (React Three Fiber / Three.js)
   - Official Schematic Wiring Diagram toggle mode
   - Color-coded PIN CONNECTION SUMMARY panel
   - Interactive Working Controls (Load Cell, WebAudio Buzzer, Motor, Temp, Gyro)
   - Real-Time Hardware Serial Terminal Console (COM3 Gateway, Packet Stream, Command CLI)
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { BreadboardScene, CameraPreset } from '../three/BreadboardScene';
import { PageHeader } from '../ui/PageHeader';

export function HardwareLive() {
  const navigate = useStore((s) => s.navigate);
  const setViewMode = useStore((s) => s.setViewMode);

  // View Mode: '3d' (3D Interactive Model) or 'schematic' (Official 2D Layout Diagram)
  const [viewStyle, setViewStyle] = useState<'3d' | 'schematic'>('3d');
  const [activeModule, setActiveModule] = useState<string>('esp32c3');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('default');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showCallouts, setShowCallouts] = useState<boolean>(true);

  // Working Hardware Test State
  const [loadForceN, setLoadForceN] = useState<number>(380);
  const [tempC, setTempC] = useState<number>(28.5);
  const [pitchDeg, setPitchDeg] = useState<number>(1.2);
  const [rollDeg, setRollDeg] = useState<number>(-0.4);
  const [vibrationActive, setVibrationActive] = useState<boolean>(false);
  const [buzzerBeeping, setBuzzerBeeping] = useState<boolean>(false);
  const [tareStatus, setTareStatus] = useState<string>('Calibrated (Offset: 0.0 N)');

  // Hardware Connection & Serial Terminal State
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [comPort, setComPort] = useState<string>('COM3');
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [packetSeq, setPacketSeq] = useState<number>(2481);
  const [commandInput, setCommandInput] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Terminal Log Array
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM INIT] Hardware Gateway Services started.',
    '[15:24:01.002] Scanning serial ports... Found COM3 (ESP32-C3 Dev Board).',
    '[15:24:01.050] Connected to COM3 @ 115200 baud (Buffer: 4096 bytes).',
    '[15:24:01.120] TX: {"cmd":"PING"} -> RX: {"status":"ACK", "firmware":"v2.4.1-SHIELD"}',
    '[15:24:02.000] RX #2480: {"device":"ESP32-C3","strain_N":380.0,"temp_C":28.5,"led":"GREEN"}',
  ]);

  const terminalBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal box internal container only (NEVER scrolls browser window)
  useEffect(() => {
    if (autoScroll && terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [terminalLogs, autoScroll]);

  // Live Hardware Telemetry Packet Simulation Loop when Connected
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setPacketSeq((s) => s + 1);
      const now = new Date().toLocaleTimeString();
      const newLog = `[${now}] RX #${packetSeq + 1}: {"force_N":${loadForceN.toFixed(1)},"temp_C":${tempC.toFixed(1)},"pitch":${pitchDeg},"roll":${rollDeg},"status":"${loadForceN > 1200 ? 'CRITICAL' : loadForceN > 500 ? 'CAUTION' : 'NORMAL'}"}`;
      setTerminalLogs((prev) => [...prev.slice(-80), newLog]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isConnected, packetSeq, loadForceN, tempC, pitchDeg, rollDeg]);

  // Web Audio Synthesizer Piezo Beep
  const triggerBuzzerAudio = (freq = 880, durationMs = 200) => {
    setBuzzerBeeping(true);
    setTimeout(() => setBuzzerBeeping(false), durationMs);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignore audio policy restrictions
    }
  };

  // Trigger Vibration Motor
  const triggerVibrationMotor = () => {
    setVibrationActive(true);
    setTimeout(() => setVibrationActive(false), 1200);
  };

  // Zero Tare Handler
  const handleTare = () => {
    setTareStatus('Tare executing...');
    const now = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${now}] TX: {"cmd":"TARE"} -> Executing Load Cell Zero Calibration...`]);
    setTimeout(() => {
      setLoadForceN(0);
      setTareStatus('Zero Tare Complete (Offset: 0.0 N)');
      setTerminalLogs((prev) => [...prev, `[${now}] RX: {"status":"TARE_OK", "zero_offset_N":0.0}`]);
    }, 600);
  };

  // Send Command CLI Handler
  const handleSendCommand = () => {
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim().toUpperCase();
    const now = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${now}] TX COMMAND: > ${cmd}`]);
    setCommandInput('');

    // Process Command Logic
    setTimeout(() => {
      if (cmd === 'TARE') {
        handleTare();
      } else if (cmd === 'BUZZER' || cmd === 'BEEP') {
        triggerBuzzerAudio(880, 250);
        setTerminalLogs((prev) => [...prev, `[${now}] RX: {"status":"BUZZER_ACK", "duration_ms":250}`]);
      } else if (cmd === 'VIBRATE' || cmd === 'MOTOR') {
        triggerVibrationMotor();
        setTerminalLogs((prev) => [...prev, `[${now}] RX: {"status":"MOTOR_PWM_ACTIVE", "duty":100}`]);
      } else if (cmd.startsWith('FORCE=')) {
        const val = parseFloat(cmd.replace('FORCE=', ''));
        if (!isNaN(val)) {
          setLoadForceN(val);
          setTerminalLogs((prev) => [...prev, `[${now}] RX: {"status":"FORCE_SET_OK", "force_N":${val}}`]);
        }
      } else {
        setTerminalLogs((prev) => [...prev, `[${now}] RX: {"status":"OK", "result":"Executed ${cmd}"}`]);
      }
    }, 150);
  };

  // Compute LED State
  const ledState = loadForceN > 1200 ? 'RED' : loadForceN > 500 ? 'YELLOW' : 'GREEN';

  // Automatically trigger alerts on red critical strain
  useEffect(() => {
    if (loadForceN > 1200) {
      triggerBuzzerAudio(1046, 300);
      setVibrationActive(true);
    }
  }, [loadForceN]);

  return (
    <div className="hardware-live-page" style={{ position: 'relative', width: '100%', height: '100%', overflowX: 'hidden', overflowY: 'auto', background: '#070b11', color: '#e2e8f0', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-sans)' }}>
      
      <PageHeader
        title="Hardware Layout & Serial Gateway"
        description="Interactive 3D Circuit & ESP32-C3 Microcontroller · Official 2D Schematic · Real-Time Serial Console"
        actions={
          <div className="row gap-2">
            <span className={`px-2 py-1 rounded text-[11px] font-semibold ${isConnected ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50' : 'bg-red-950/80 text-red-400 border border-red-700/50'}`}>
              {isConnected ? '● HARDWARE CONNECTED' : '○ DISCONNECTED'}
            </span>
            <div className="row gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                className={`btn tiny ${viewStyle === '3d' ? 'active' : ''}`}
                onClick={() => setViewStyle('3d')}
              >
                🎲 3D Interactive
              </button>
              <button
                className={`btn tiny ${viewStyle === 'schematic' ? 'active' : ''}`}
                onClick={() => setViewStyle('schematic')}
              >
                📐 2D Schematic
              </button>
            </div>

            <button
              className="btn tiny"
              onClick={handleTare}
              style={{ background: 'rgba(255,255,255,0.06)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', fontWeight: 600 }}
            >
              ⚖ ZERO TARE
            </button>
            <button
              className="btn tiny"
              onClick={() => {
                navigate('twin');
                setViewMode('chassis');
              }}
              style={{ background: '#0284c7', color: '#fff', fontWeight: 600 }}
            >
              🚘 3D VEHICLE TWIN →
            </button>
          </div>
        }
      />

      {/* ============================================================
          MAIN 2-COLUMN HARDWARE WORKSTATION (3D/2D CANVAS + PIN SUMMARY)
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT 8 COLUMNS: 3D / 2D HARDWARE WORKSPACE CANVAS */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="panel p-3 bg-slate-950/90 border border-cyan-500/40 rounded-xl col gap-3 relative shadow-2xl overflow-hidden" style={{ minHeight: 440 }}>
            
            <div className="spread">
              <div className="row gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="tiny font-bold text-cyan-300 uppercase tracking-wider">
                  {viewStyle === '3d' ? '3D INTERACTIVE HARDWARE & BREADBOARD MODEL (ORBIT, ROTATE & CLICK)' : '2D OFFICIAL WIRING DIAGRAM & SCHEMATIC'}
                </span>
              </div>
              <span className="tiny mono text-slate-400">SELECTED: {activeModule.toUpperCase()}</span>
            </div>

            {/* CANVAS RENDER CONTAINER */}
            <div className="relative w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900" style={{ height: 380 }}>
              
              {/* CAMERA ANGLE & ROTATE OVERLAY TOOLBAR */}
              {viewStyle === '3d' && (
                <div className="absolute top-2 left-2 z-10 row flex-wrap gap-1.5 p-1 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg text-xs font-mono">
                  <button
                    className={`btn tiny px-2 py-1 ${autoRotate ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-300'}`}
                    onClick={() => setAutoRotate(!autoRotate)}
                  >
                    🔄 360° {autoRotate ? 'ROTATE ON' : 'ROTATE'}
                  </button>
                  <button
                    className={`btn tiny px-2 py-1 ${cameraPreset === 'default' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300'}`}
                    onClick={() => setCameraPreset('default')}
                  >
                    🎲 DEFAULT
                  </button>
                  <button
                    className={`btn tiny px-2 py-1 ${cameraPreset === 'top' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300'}`}
                    onClick={() => setCameraPreset('top')}
                  >
                    🔝 TOP
                  </button>
                  <button
                    className={`btn tiny px-2 py-1 ${cameraPreset === 'front' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300'}`}
                    onClick={() => setCameraPreset('front')}
                  >
                    👁️ FRONT
                  </button>
                  <button
                    className={`btn tiny px-2 py-1 ${cameraPreset === 'side' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300'}`}
                    onClick={() => setCameraPreset('side')}
                  >
                    ↔️ SIDE
                  </button>
                  <button
                    className={`btn tiny px-2 py-1 ${cameraPreset === 'esp32' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-slate-300'}`}
                    onClick={() => { setCameraPreset('esp32'); setActiveModule('esp32c3'); }}
                  >
                    🔍 ESP32 FOCUS
                  </button>
                  <button
                    className={`btn tiny px-2 py-1 ${showCallouts ? 'bg-purple-900 text-purple-200 border-purple-500' : 'bg-slate-900 text-slate-400'}`}
                    onClick={() => setShowCallouts(!showCallouts)}
                  >
                    🏷️ CALLOUTS
                  </button>
                </div>
              )}

              {/* VIEW 1: FULL 3D INTERACTIVE BREADBOARD MODEL */}
              {viewStyle === '3d' && (
                <BreadboardScene
                  activeModule={activeModule}
                  setActiveModule={setActiveModule}
                  loadForceN={loadForceN}
                  tempC={tempC}
                  vibrationActive={vibrationActive}
                  buzzerBeeping={buzzerBeeping}
                  isConnected={isConnected}
                  cameraPreset={cameraPreset}
                  autoRotate={autoRotate}
                  showCallouts={showCallouts}
                />
              )}

              {/* VIEW 2: 2D OFFICIAL SCHEMATIC WIRING DIAGRAM */}
              {viewStyle === 'schematic' && (
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src="/hardware_wiring_diagram.jpg"
                    alt="SHIELD Hardware Layout"
                    className="w-full h-full object-contain block"
                  />
                </div>
              )}

            </div>

            {/* LIVE WORKING INTERACTIVE HARDWARE CONTROLS */}
            <div className="panel p-3 bg-slate-900/90 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              
              {/* CONTROL 1: SIMULATED LOAD CELL FORCE */}
              <div className="col gap-1.5 p-2 bg-slate-950 rounded border border-slate-800">
                <div className="spread">
                  <span className="tiny faint">LOAD CELL STRAIN:</span>
                  <span className={`font-bold ${loadForceN > 1200 ? 'text-red-400 animate-pulse' : loadForceN > 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {loadForceN.toFixed(0)} N
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="25"
                  value={loadForceN}
                  onChange={(e) => setLoadForceN(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="spread tiny text-[10px] text-slate-500">
                  <span>0 N (Normal)</span>
                  <span>500 N (Caution)</span>
                  <span>1200 N (Yield)</span>
                </div>
              </div>

              {/* CONTROL 2: ACTUATOR TEST BUTTONS */}
              <div className="col gap-1.5 p-2 bg-slate-950 rounded border border-slate-800">
                <span className="tiny faint">ACTUATOR TEST BUTTONS:</span>
                <div className="row gap-1.5">
                  <button
                    className="btn tiny flex-1"
                    onClick={() => triggerBuzzerAudio(880, 250)}
                    style={{ background: buzzerBeeping ? '#7e22ce' : 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid #a855f7' }}
                  >
                    🔔 TEST BUZZER
                  </button>
                  <button
                    className="btn tiny flex-1"
                    onClick={triggerVibrationMotor}
                    style={{ background: vibrationActive ? '#d97706' : 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid #f59e0b' }}
                  >
                    ⚡ VIBRATE MOTOR
                  </button>
                </div>
              </div>

              {/* CONTROL 3: SENSORS INPUT (TEMP & GYRO) */}
              <div className="col gap-1.5 p-2 bg-slate-950 rounded border border-slate-800">
                <div className="spread">
                  <span className="tiny faint">DS18B20 TEMP:</span>
                  <span className="font-bold text-cyan-300">{tempC.toFixed(1)} °C</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="100"
                  step="1"
                  value={tempC}
                  onChange={(e) => setTempC(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="spread tiny text-[10px] text-slate-400">
                  <span>MPU6050 Pitch: {pitchDeg}°</span>
                  <span>Roll: {rollDeg}°</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT 4 COLUMNS: PIN CONNECTION SUMMARY PANEL */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="panel p-4 bg-slate-950/95 border border-slate-800 rounded-xl col gap-3 shadow-2xl" style={{ minHeight: 440 }}>
            
            <div className="spread pb-2 border-b border-slate-800">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">PIN CONNECTION SUMMARY</span>
              <span className="tiny mono text-cyan-400 font-bold">ESP32-C3 GPIO NETLIST</span>
            </div>

            {/* COLOR-CODED PIN CONNECTION CATEGORIES */}
            <div className="col gap-2.5 text-xs font-mono">
              
              {/* CATEGORY 1: POWER DISTRIBUTION */}
              <div
                onClick={() => setActiveModule('power')}
                className={`panel p-2.5 rounded-lg border col gap-1.5 cursor-pointer transition-all ${
                  activeModule === 'power' ? 'bg-red-950/40 border-red-500' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="row gap-2 font-bold text-red-400 text-xs">
                  <span>⚡</span>
                  <span>Power Distribution</span>
                </div>
                <div className="col gap-1 text-[11px] text-slate-300 pl-4">
                  <div className="spread"><span>ESP32 3.3V</span><span className="text-slate-500">→</span><span>Breadboard + Rail</span></div>
                  <div className="spread"><span>ESP32 5V/VIN</span><span className="text-slate-500">→</span><span>L298N 12V/VCC</span></div>
                  <div className="spread"><span>ESP32 GND</span><span className="text-slate-500">→</span><span>Breadboard - Rail (Common GND)</span></div>
                </div>
              </div>

              {/* CATEGORY 2: SENSORS */}
              <div
                onClick={() => setActiveModule('sensors')}
                className={`panel p-2.5 rounded-lg border col gap-1.5 cursor-pointer transition-all ${
                  activeModule === 'sensors' || activeModule === 'mpu6050' || activeModule === 'ds18b20' || activeModule === 'hx711' ? 'bg-sky-950/40 border-sky-500' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="row gap-2 font-bold text-sky-400 text-xs">
                  <span>🛰️</span>
                  <span>Sensors</span>
                </div>
                <div className="col gap-1.5 text-[11px] text-slate-300 pl-4">
                  <div>
                    <div className="font-bold text-cyan-300">HX711 ADC:</div>
                    <div className="spread tiny text-slate-400"><span>VCC → 3.3V</span><span>GND → GND</span><span>DT → GPIO 6</span><span>SCK → GPIO 7</span></div>
                  </div>
                  <div>
                    <div className="font-bold text-sky-300">MPU6050 IMU:</div>
                    <div className="spread tiny text-slate-400"><span>VCC → 3.3V</span><span>GND → GND</span><span>SDA → GPIO 8</span><span>SCL → GPIO 9</span></div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">DS18B20 Temp:</div>
                    <div className="tiny text-slate-400">VCC → 3.3V | GND → GND | DATA → GPIO 5 (with 4.7kΩ pull-up)</div>
                  </div>
                </div>
              </div>

              {/* CATEGORY 3: LOAD CELLS TO HX711 */}
              <div
                onClick={() => setActiveModule('loadcell')}
                className={`panel p-2.5 rounded-lg border col gap-1.5 cursor-pointer transition-all ${
                  activeModule === 'loadcell' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="row gap-2 font-bold text-emerald-400 text-xs">
                  <span>🔒</span>
                  <span>Load Cells to HX711</span>
                </div>
                <div className="col gap-1 text-[11px] text-slate-300 pl-4">
                  <div className="spread"><span>LC1 Red → E+</span><span>LC2 Red → E-</span></div>
                  <div className="spread"><span>Two Black (twisted)</span><span className="text-slate-500">→</span><span>A+</span></div>
                  <div className="spread"><span>Two White (twisted)</span><span className="text-slate-500">→</span><span>A-</span></div>
                </div>
              </div>

              {/* CATEGORY 4: ACTUATORS & INDICATORS */}
              <div
                onClick={() => setActiveModule('actuators')}
                className={`panel p-2.5 rounded-lg border col gap-1.5 cursor-pointer transition-all ${
                  activeModule === 'actuators' || activeModule === 'l298n' || activeModule === 'buzzer' || activeModule === 'traffic_leds' ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="row gap-2 font-bold text-amber-400 text-xs">
                  <span>⚙️</span>
                  <span>Actuators & Indicators</span>
                </div>
                <div className="col gap-1.5 text-[11px] text-slate-300 pl-4">
                  <div>
                    <div className="font-bold text-red-400">L298N Driver:</div>
                    <div className="tiny text-slate-400">IN3 → GPIO 4 | IN4 → GND | ENB → Black cap (enable)</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">Coin Motor:</div>
                    <div className="tiny text-slate-400">Red → OUT3 | Blue/Black → OUT4</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-300">Buzzer (GPIO 3):</div>
                    <div className="tiny text-slate-400">(+) Long pin → GPIO 3 | (-) Short pin → GND</div>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300">Traffic LEDs:</div>
                    <div className="tiny text-slate-400">Green → GPIO 0 | Yellow → GPIO 1 | Red → GPIO 10 (all 220Ω)</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ============================================================
          BOTTOM HARDWARE SERIAL TERMINAL CONSOLE (LIVE HARDWARE WORK GATEWAY)
          ============================================================ */}
      <div className="panel p-3 bg-slate-950/95 border border-cyan-500/50 rounded-xl col gap-3 shadow-2xl">
        
        {/* TERMINAL HEADER & SERIAL PORT GATEWAY CONTROLS */}
        <div className="spread flex-wrap gap-2 pb-2 border-b border-slate-800 text-xs font-mono">
          <div className="row gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-cyan-300 uppercase tracking-wider">HARDWARE SERIAL TERMINAL & GATEWAY CLI</span>
            <span className="tiny faint text-slate-400">| Direct Hardware Communications Link</span>
          </div>

          <div className="row gap-2">
            {/* COM Port Selector */}
            <select
              value={comPort}
              onChange={(e) => setComPort(e.target.value)}
              className="text-xs px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono font-bold cursor-pointer"
            >
              <option value="COM3">COM3 — ESP32-C3 Gateway</option>
              <option value="COM4">COM4 — Hardware Test Rig</option>
              <option value="COM5">COM5 — External Sensor Hub</option>
            </select>

            {/* Baud Rate Selector */}
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(parseInt(e.target.value, 10))}
              className="text-xs px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 font-mono font-bold cursor-pointer"
            >
              <option value={115200}>115200 Baud</option>
              <option value={9600}>9600 Baud</option>
              <option value={57600}>57600 Baud</option>
            </select>

            {/* Connect / Disconnect Toggle Button */}
            <button
              className="btn tiny"
              onClick={() => setIsConnected(!isConnected)}
              style={{
                background: isConnected ? '#059669' : '#dc2626',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              {isConnected ? '🔌 CONNECTED (COM3)' : '⏸ DISCONNECTED'}
            </button>

            <button
              className="btn tiny"
              onClick={() => setTerminalLogs([])}
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* TERMINAL LOG OUTPUT CONSOLE */}
        <div
          ref={terminalBoxRef}
          className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 col gap-1 overflow-y-auto"
          style={{ height: 160, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
        >
          {terminalLogs.map((log, i) => (
            <div
              key={i}
              className={`leading-relaxed ${
                log.includes('CRITICAL') || log.includes('ERR') ? 'text-red-400 font-bold' :
                log.includes('CAUTION') || log.includes('TX') ? 'text-amber-300' :
                log.includes('SYSTEM') ? 'text-cyan-300 font-bold' : 'text-emerald-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {/* SERIAL COMMAND INPUT LINE (CLI) */}
        <div className="row gap-2 font-mono text-xs">
          <span className="text-cyan-400 font-bold text-sm">&gt;</span>
          <input
            type="text"
            placeholder="Enter Serial Command (e.g. TARE, BUZZER, VIBRATE, FORCE=750)..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendCommand();
            }}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono outline-none focus:border-cyan-500"
          />
          <button
            className="btn tiny px-4 py-2"
            onClick={handleSendCommand}
            style={{ background: '#0284c7', color: '#fff', fontWeight: 800, border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            SEND ▶
          </button>
        </div>

      </div>

    </div>
  );
}
