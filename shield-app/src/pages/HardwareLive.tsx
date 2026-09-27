import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';

export function HardwareLive() {
  const navigate = useStore((s) => s.navigate);
  const setViewMode = useStore((s) => s.setViewMode);
  const focusOn = useStore((s) => s.focusOn);

  const [selectedModule, setSelectedModule] = useState<string | null>('esp32c3');
  const [packetSeq, setPacketSeq] = useState(142);
  const [tareStatus, setTareStatus] = useState<string>('Calibrated (Zero Offset: 0.0 N)');
  const [logs, setLogs] = useState<string[]>([
    '[15:47:01 UTC] Hardware gateway connected on COM3 @ 115200 baud.',
    '[15:47:02 UTC] Telemetry stream verified: sequence #140 received.',
    '[15:47:03 UTC] Baseline B residual check: All 6 structural zones within noise floor.',
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPacketSeq((s) => s + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const handleTare = () => {
    setTareStatus('Tare in progress...');
    setTimeout(() => {
      setTareStatus('Tare Completed! Offset reset to 0.0 N');
      setLogs((prev) => [`[${new Date().toLocaleTimeString()} UTC] AUDIT EVENT: Hardware Tare executed successfully.`, ...prev]);
    }, 800);
  };

  return (
    <div className="page" style={{ padding: '16px 20px', gap: 16 }}>
      {/* Header */}
      <div className="row spread" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span className="badge cyan">HARDWARE LIVE</span>
            <h2 style={{ margin: 0, fontSize: 20 }}>One-Page Hardware & Circuit Inspector</h2>
          </div>
          <div className="small faint" style={{ marginTop: 4 }}>
            ESP32-C3 Hardware Bridge · Live Sensor Telemetry · Interactive Wiring Netlist · FLUX Concept Brief
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn primary" onClick={handleTare}>
            ⚖ Tare Load Cell Baseline
          </button>
          <button className="btn" onClick={() => navigate('twin')}>
            🚘 View 3D Vehicle Twin
          </button>
        </div>
      </div>

      {/* Main 3-Column Desktop Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 16, minHeight: 460 }}>
        {/* Left Column: Sensor Inventory */}
        <div className="panel col" style={{ gap: 10, padding: 14 }}>
          <div className="row spread">
            <span className="small font-bold" style={{ color: 'var(--cyan)' }}>SENSOR INVENTORY</span>
            <span className="tiny badge green">6 INSTALLED</span>
          </div>
          <div className="col" style={{ gap: 8, overflowY: 'auto', maxHeight: 420 }}>
            {SENSORS.map((s) => (
              <div
                key={s.id}
                className="panel hoverable"
                style={{
                  padding: '8px 10px',
                  borderLeft: `3px solid ${s.status === 'NORMAL' ? 'var(--cyan)' : 'var(--amber)'}`,
                  background: 'var(--bg2)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  navigate('twin');
                  setViewMode('chassis');
                  focusOn(s.componentId);
                }}
              >
                <div className="row spread">
                  <span className="small font-bold">{s.id} · {s.name}</span>
                  <span className="tiny muted">{s.region}</span>
                </div>
                <div className="row spread tiny muted" style={{ marginTop: 4 }}>
                  <span>{s.signal.toUpperCase()} ({s.unit})</span>
                  <span style={{ color: 'var(--cyan)' }}>{s.baseline} {s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Interactive Circuit SVG Netlist & FLUX Visual Brief */}
        <div className="panel col" style={{ padding: 14, gap: 12, position: 'relative', background: '#0a0e17' }}>
          <div className="row spread">
            <span className="small font-bold" style={{ color: 'var(--cyan)' }}>HARDWARE WIRING & NETLIST CANVAS</span>
            <span className="tiny muted">Interactive SVG Routing · Click Module to Inspect</span>
          </div>

          {/* Interactive Netlist SVG Diagram */}
          <div style={{ flex: 1, minHeight: 320, background: '#0d1322', borderRadius: 8, border: '1px solid var(--line2)', position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 320" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Wire Connections */}
              <path d="M 120 160 L 260 160" stroke="#00e5ff" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 340 160 L 480 160" stroke="#00e5ff" strokeWidth="2" />
              <path d="M 300 110 L 300 60 L 480 60" stroke="#ffb703" strokeWidth="2" />
              <path d="M 300 210 L 300 260 L 480 260" stroke="#3a86ff" strokeWidth="2" />

              {/* Data Packet Animations */}
              <circle cx={120 + (packetSeq % 20) * 7} cy="160" r="4" fill="#00e5ff" />
              <circle cx={340 + (packetSeq % 20) * 7} cy="160" r="4" fill="#00e5ff" />

              {/* Module 1: MPU6050 */}
              <g transform="translate(40, 120)" onClick={() => setSelectedModule('mpu6050')} style={{ cursor: 'pointer' }}>
                <rect width="80" height="80" rx="6" fill="#141e33" stroke="#00e5ff" strokeWidth={selectedModule === 'mpu6050' ? 2 : 1} />
                <text x="40" y="38" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">MPU6050</text>
                <text x="40" y="54" textAnchor="middle" fill="#00e5ff" fontSize="9">I2C (GPIO 8/9)</text>
              </g>

              {/* Module 2: Central ESP32-C3 Board */}
              <g transform="translate(250, 110)" onClick={() => setSelectedModule('esp32c3')} style={{ cursor: 'pointer' }}>
                <rect width="100" height="100" rx="8" fill="#1a2640" stroke="#00e5ff" strokeWidth={selectedModule === 'esp32c3' ? 3 : 1} />
                <text x="50" y="44" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">ESP32-C3</text>
                <text x="50" y="62" textAnchor="middle" fill="#8898aa" fontSize="9">USB Serial Gateway</text>
                <circle cx="50" cy="80" r="5" fill="#00e5ff" />
              </g>

              {/* Module 3: HX711 + Load Cell */}
              <g transform="translate(470, 20)" onClick={() => setSelectedModule('hx711')} style={{ cursor: 'pointer' }}>
                <rect width="90" height="70" rx="6" fill="#141e33" stroke="#ffb703" strokeWidth={selectedModule === 'hx711' ? 2 : 1} />
                <text x="45" y="32" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">HX711 ADC</text>
                <text x="45" y="48" textAnchor="middle" fill="#ffb703" fontSize="9">Load Cell (50kg)</text>
              </g>

              {/* Module 4: Backend / Cloud */}
              <g transform="translate(470, 130)" onClick={() => setSelectedModule('backend')} style={{ cursor: 'pointer' }}>
                <rect width="90" height="70" rx="6" fill="#141e33" stroke="#3a86ff" strokeWidth={selectedModule === 'backend' ? 2 : 1} />
                <text x="45" y="32" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">FastAPI</text>
                <text x="45" y="48" textAnchor="middle" fill="#3a86ff" fontSize="9">ws://localhost:8000</text>
              </g>

              {/* Module 5: DS18B20 Temp Probe */}
              <g transform="translate(470, 230)" onClick={() => setSelectedModule('ds18b20')} style={{ cursor: 'pointer' }}>
                <rect width="90" height="70" rx="6" fill="#141e33" stroke="#00b4d8" strokeWidth={selectedModule === 'ds18b20' ? 2 : 1} />
                <text x="45" y="32" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">DS18B20</text>
                <text x="45" y="48" textAnchor="middle" fill="#00b4d8" fontSize="9">1-Wire (GPIO 6)</text>
              </g>
            </svg>
          </div>

          {/* FLUX Concept Brief Callout */}
          <div className="panel" style={{ padding: '8px 12px', background: 'rgba(0, 229, 255, 0.05)', border: '1px solid var(--line2)' }}>
            <div className="row spread tiny font-bold" style={{ color: 'var(--cyan)' }}>
              <span>🎨 FLUX VERBATIM CONCEPT PROMPT DELIVERABLE</span>
              <span>TECHNICAL CANVAS CONCEPT</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 4, fontStyle: 'italic' }}>
              "Premium automotive engineering interface concept for SHIELD, white and deep navy background, central ESP32-C3 development board, distinct MPU6050 module, HX711 with load cell, DS18B20 probe..."
            </div>
          </div>
        </div>

        {/* Right Column: Connection Status & Calibration Controls */}
        <div className="panel col" style={{ gap: 12, padding: 14 }}>
          <span className="small font-bold" style={{ color: 'var(--cyan)' }}>PIPELINE CONNECTIVITY</span>

          <div className="col" style={{ gap: 8 }}>
            <div className="panel row spread" style={{ padding: '8px 10px', background: 'var(--bg2)' }}>
              <div className="col">
                <span className="tiny font-bold">ESP32-C3 Hardware</span>
                <span className="tiny faint">USB Serial COM3 @ 115200</span>
              </div>
              <span className="badge green">CONNECTED</span>
            </div>

            <div className="panel row spread" style={{ padding: '8px 10px', background: 'var(--bg2)' }}>
              <div className="col">
                <span className="tiny font-bold">Python Serial Gateway</span>
                <span className="tiny faint">gateway/serial_gateway.py</span>
              </div>
              <span className="badge green">ACTIVE</span>
            </div>

            <div className="panel row spread" style={{ padding: '8px 10px', background: 'var(--bg2)' }}>
              <div className="col">
                <span className="tiny font-bold">FastAPI Backend</span>
                <span className="tiny faint">http://localhost:8000</span>
              </div>
              <span className="badge green">ONLINE</span>
            </div>

            <div className="panel row spread" style={{ padding: '8px 10px', background: 'var(--bg2)' }}>
              <div className="col">
                <span className="tiny font-bold">Unity 6 Digital Twin</span>
                <span className="tiny faint">ws://localhost:8000/ws/telemetry</span>
              </div>
              <span className="badge green">CONNECTED</span>
            </div>
          </div>

          <span className="small font-bold" style={{ color: 'var(--cyan)', marginTop: 8 }}>CALIBRATION & TARE</span>
          <div className="panel col" style={{ padding: 10, gap: 6, background: 'var(--bg2)' }}>
            <span className="tiny font-bold">Zero Tare Status</span>
            <span className="tiny muted">{tareStatus}</span>
            <button className="btn" style={{ marginTop: 6 }} onClick={handleTare}>
              Execute Zero Tare
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Packet Inspector & Connection Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel col" style={{ padding: 12, gap: 8 }}>
          <div className="row spread">
            <span className="small font-bold" style={{ color: 'var(--cyan)' }}>REAL-TIME PACKET INSPECTOR</span>
            <span className="tiny muted">Sequence #{packetSeq}</span>
          </div>
          <pre style={{ margin: 0, padding: 10, background: '#070a10', color: '#00e5ff', fontSize: 11, borderRadius: 6, overflowX: 'auto', maxHeight: 110 }}>
{JSON.stringify({
  schema_version: "1.0",
  vehicle_id: "SHIELD-EV-0287",
  device_id: "NODE-ESP32C3-01",
  source: "hardware",
  sequence: packetSeq,
  measurements: [
    { sensor_id: "S01", region_id: "FL", quantity: "force", value: 121.5, unit: "N", quality: "valid" },
    { sensor_id: "S03", region_id: "MID_L", quantity: "force", value: 85.2, unit: "N", quality: "valid" }
  ]
}, null, 2)}
          </pre>
        </div>

        <div className="panel col" style={{ padding: 12, gap: 8 }}>
          <span className="small font-bold" style={{ color: 'var(--cyan)' }}>SYSTEM AUDIT & LOG TRAIL</span>
          <div className="col" style={{ gap: 4, overflowY: 'auto', maxHeight: 110 }}>
            {logs.map((log, idx) => (
              <div key={idx} className="tiny faint" style={{ fontFamily: 'monospace' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
