import React, { useState } from 'react';
import { RealESP32SensorDataProvider } from '../../services/SensorDataProvider';

interface RealHardwareModalProps {
  realProvider: RealESP32SensorDataProvider;
  onConnected: () => void;
  onDisconnected: () => void;
  onClose: () => void;
}

export const RealHardwareModal: React.FC<RealHardwareModalProps> = ({
  realProvider,
  onConnected,
  onDisconnected,
  onClose,
}) => {
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'SERIAL' | 'FIRMWARE'>('SERIAL');
  const [mockJson, setMockJson] = useState<string>(
    '{"strain": 420, "load": 52.5, "ax": 0.12, "ay": -0.05, "az": 1.02, "gx": 1.2, "gy": -0.8, "gz": 0.0, "roll": 2.1, "pitch": -1.4, "temp": 26.2, "buzzer": 0, "motor": 0}'
  );

  const handleConnectSerial = async () => {
    setStatusMsg('Requesting Serial Port via Web Serial API...');
    const res = await realProvider.connectSerial(baudRate);
    setStatusMsg(res.message);
    if (res.success) {
      onConnected();
    }
  };

  const handleDisconnectSerial = async () => {
    await realProvider.disconnectSerial();
    setStatusMsg('Disconnected from Serial Port.');
    onDisconnected();
  };

  const handleInjectMock = () => {
    const ok = realProvider.parseJsonTelemetry(mockJson);
    if (ok) {
      setStatusMsg('✓ Telemetry packet parsed and streamed to 3D scene!');
      onConnected();
    } else {
      setStatusMsg('⚠ Failed to parse JSON packet.');
    }
  };

  const sampleCppCode = `// =================================================================
// SHIELD — ESP32-C3 Structural Health Monitoring Firmware
// Pinout strictly aligned with SHIELD 3D Simulation Schematic
// =================================================================
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "HX711.h"

// Pin Definitions
#define PIN_LED_GREEN   0   // Normal Status LED (via 220R)
#define PIN_LED_YELLOW  1   // Warning Status LED (via 220R)
#define PIN_BUZZER      3   // Active Piezo Buzzer (+)
#define PIN_L298N_IN3   4   // L298N H-Bridge PWM Motor Drive
#define PIN_DS18B20     5   // 1-Wire Temp Sensor (4.7k pullup)
#define PIN_HX711_DT    6   // HX711 Serial Data
#define PIN_HX711_SCK   7   // HX711 Serial Clock
#define PIN_I2C_SDA     8   // MPU6050 SDA
#define PIN_I2C_SCL     9   // MPU6050 SCL
#define PIN_LED_RED     10  // Critical Status LED (via 220R)

Adafruit_MPU6050 mpu;
OneWire oneWire(PIN_DS18B20);
DallasTemperature tempSensor(&oneWire);
HX711 scale;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize GPIOs
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_L298N_IN3, OUTPUT);

  // I2C Setup
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  mpu.begin();

  // 1-Wire & Temp
  tempSensor.begin();

  // HX711 Strain Gauge ADC
  scale.begin(PIN_HX711_DT, PIN_HX711_SCK);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  tempSensor.requestTemperatures();
  float chassisTemp = tempSensor.getTempCByIndex(0);

  long rawStrain = scale.is_ready() ? scale.read() : 0;
  float microStrain = (rawStrain - 842000) / 18.4; // Calibrated formula

  // Threshold Logic
  bool warn = microStrain > 350;
  bool crit = microStrain > 1000;

  digitalWrite(PIN_LED_GREEN, !warn && !crit);
  digitalWrite(PIN_LED_YELLOW, warn && !crit);
  digitalWrite(PIN_LED_RED, crit);
  digitalWrite(PIN_BUZZER, crit);
  analogWrite(PIN_L298N_IN3, crit ? 255 : (warn ? 120 : 0));

  // Stream JSON packet over USB-Serial to SHIELD 3D Web App
  Serial.printf("{\\"strain\\":%.1f,\\"load\\":%.1f,\\"ax\\":%.3f,\\"ay\\":%.3f,\\"az\\":%.3f,\\"temp\\":%.1f,\\"buzzer\\":%d,\\"motor\\":%d}\\n",
    microStrain, microStrain * 0.125,
    a.acceleration.x / 9.81, a.acceleration.y / 9.81, a.acceleration.z / 9.81,
    chassisTemp, crit ? 1 : 0, crit ? 1 : 0
  );

  delay(40); // 25 Hz telemetry rate
}
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white font-['Chakra_Petch']">
              Physical ESP32-C3 Hardware Bridge
            </h2>
            <p className="text-xs text-slate-400">
              Stream live telemetry from real ESP32 microcontroller into the 3D scene via Web Serial API
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2">
          <button
            onClick={() => setActiveTab('SERIAL')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'SERIAL'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Web Serial Connection
          </button>
          <button
            onClick={() => setActiveTab('FIRMWARE')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'FIRMWARE'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            ESP32-C3 Arduino C++ Firmware
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-['Plus_Jakarta_Sans']">
          {activeTab === 'SERIAL' ? (
            <>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Connection Status:</span>
                  <span
                    className={`font-bold ${
                      realProvider.isConnected ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {realProvider.isConnected ? 'CONNECTED & STREAMING' : 'DISCONNECTED'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Baud Rate:</span>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(Number(e.target.value))}
                    disabled={realProvider.isConnected}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                  >
                    <option value={115200}>115200 baud (Standard)</option>
                    <option value={9600}>9600 baud</option>
                    <option value={57600}>57600 baud</option>
                    <option value={230400}>230400 baud (High Speed)</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  {!realProvider.isConnected ? (
                    <button
                      onClick={handleConnectSerial}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                    >
                      Connect USB Port (Web Serial)
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnectSerial}
                      className="px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      Disconnect Port
                    </button>
                  )}
                </div>
              </div>

              {statusMsg && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-cyan-300 text-xs">
                  {statusMsg}
                </div>
              )}

              {/* JSON Packet Injection / Manual Testing */}
              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                  Manual Telemetry Packet Injector
                </span>
                <textarea
                  value={mockJson}
                  onChange={(e) => setMockJson(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-slate-200 resize-none"
                />
                <button
                  onClick={handleInjectMock}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 rounded transition-colors cursor-pointer"
                >
                  Send Packet to 3D Simulator
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Ready-to-flash C++ sketch for Arduino IDE / PlatformIO:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sampleCppCode);
                    setStatusMsg('✓ Copied firmware code to clipboard!');
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors cursor-pointer"
                >
                  Copy Code
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[50vh] leading-relaxed">
                {sampleCppCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
