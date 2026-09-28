import React from 'react';
import { SensorTelemetry, HardwareComponentMeta } from '../../types/simulation';

interface TelemetryDashboardProps {
  telemetry: SensorTelemetry;
  onInspectComponent: (comp: HardwareComponentMeta | null) => void;
  components: HardwareComponentMeta[];
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  telemetry,
  onInspectComponent,
  components,
}) => {
  const getStatusBadge = () => {
    switch (telemetry.systemStatus) {
      case 'NORMAL':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/50 rounded text-emerald-400 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">STATUS: NORMAL</span>
            <span className="text-emerald-500/80">· Structural Integrity Nominal</span>
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/60 border border-amber-500/50 rounded text-amber-400 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="font-bold">STATUS: WARNING</span>
            <span className="text-amber-500/80">· Dynamic Shock Threshold Exceeded</span>
          </div>
        );
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/80 border border-rose-500/80 rounded text-rose-300 font-mono text-xs animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-bold">STATUS: CRITICAL</span>
            <span className="text-rose-400">· Structural Plastic Deformation Alert</span>
          </div>
        );
    }
  };

  return (
    <div className="w-96 h-full flex flex-col bg-[#0b0f19] border-l border-slate-800 text-slate-200 overflow-y-auto shrink-0 select-none font-['Plus_Jakarta_Sans']">
      {/* Top Telemetry Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono">
            Live Engineering Telemetry
          </span>
          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
            RATE: 25 Hz · 40ms
          </span>
        </div>
        {getStatusBadge()}
      </div>

      <div className="p-4 space-y-4">
        {/* 1. CHASSIS STRUCTURAL STRAIN (HX711 & Load Cells) */}
        <section className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-cyan-400" />
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-300 font-mono">
                Structural Strain & Load (HX711)
              </h3>
            </div>
            <button
              onClick={() => onInspectComponent(components.find((c) => c.id === 'hx711') || null)}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Inspect
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-mono">Micro-Strain (με)</span>
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  telemetry.strainMicroStrain > 1000
                    ? 'text-rose-400'
                    : telemetry.strainMicroStrain > 300
                    ? 'text-amber-400'
                    : 'text-cyan-300'
                }`}
              >
                {telemetry.strainMicroStrain} <span className="text-xs font-normal text-slate-400">με</span>
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-mono">Dynamic Load</span>
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {telemetry.loadKg} <span className="text-xs font-normal text-slate-400">kg</span>
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Deflection (Δz):</span>
              <span className="text-white font-semibold tabular-nums">{telemetry.strainDeformationMm} mm</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-slate-800/60 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">LC1 (FL):</span>
                <span className="text-cyan-300 tabular-nums">{(telemetry.loadCell1Raw).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LC2 (FR):</span>
                <span className="text-cyan-300 tabular-nums">{(telemetry.loadCell2Raw).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LC3 (RL):</span>
                <span className="text-cyan-300 tabular-nums">{(telemetry.loadCell1Raw - 80).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LC4 (RR):</span>
                <span className="text-cyan-300 tabular-nums">{(telemetry.loadCell2Raw + 65).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Strain Bar Visualizer */}
          <div className="mt-3">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-100 ${
                  telemetry.strainMicroStrain > 1000
                    ? 'bg-rose-500'
                    : telemetry.strainMicroStrain > 300
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, (telemetry.strainMicroStrain / 1500) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0 με (Nominal)</span>
              <span>300 με (Warn)</span>
              <span>1000+ με (Crit)</span>
            </div>
          </div>
        </section>

        {/* 2. MPU6050 6-DoF IMU KINETICS */}
        <section className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-blue-400" />
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-300 font-mono">
                Chassis Kinetics (MPU6050)
              </h3>
            </div>
            <button
              onClick={() => onInspectComponent(components.find((c) => c.id === 'mpu6050') || null)}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Inspect
            </button>
          </div>

          {/* Acceleration Tri-Axis */}
          <div className="mb-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              Linear Acceleration (g):
            </span>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px]">AX</span>
                <span className="font-bold text-white tabular-nums">{telemetry.accel.x > 0 ? `+${telemetry.accel.x}` : telemetry.accel.x}</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px]">AY</span>
                <span className="font-bold text-white tabular-nums">{telemetry.accel.y > 0 ? `+${telemetry.accel.y}` : telemetry.accel.y}</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px]">AZ</span>
                <span className="font-bold text-white tabular-nums">{telemetry.accel.z > 0 ? `+${telemetry.accel.z}` : telemetry.accel.z}</span>
              </div>
            </div>
          </div>

          {/* Gyroscope Tri-Axis */}
          <div className="mb-2.5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              Angular Velocity (°/s):
            </span>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px]">GX</span>
                <span className="text-slate-300 tabular-nums">{telemetry.gyro.x}</span>
              </div>
              <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px]">GY</span>
                <span className="text-slate-300 tabular-nums">{telemetry.gyro.y}</span>
              </div>
              <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px]">GZ</span>
                <span className="text-slate-300 tabular-nums">{telemetry.gyro.z}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Attitude */}
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span>Attitude:</span>
            <span className="text-cyan-300 tabular-nums">
              Roll: {telemetry.roll}° · Pitch: {telemetry.pitch}°
            </span>
          </div>
        </section>

        {/* 3. TEMPERATURE SENSOR (DS18B20) */}
        <section className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-purple-400" />
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-300 font-mono">
                Chassis Rail Temp (DS18B20)
              </h3>
            </div>
            <button
              onClick={() => onInspectComponent(components.find((c) => c.id === 'ds18b20') || null)}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Inspect
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {telemetry.temperatureC}
              </span>
              <span className="text-sm font-mono text-slate-400">°C</span>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 block">4.7kΩ Pull-up Active</span>
              <span>1-Wire GPIO 5</span>
            </div>
          </div>
        </section>

        {/* 4. ACTUATORS & ALERT SYSTEM */}
        <section className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800">
          <h3 className="text-xs font-bold tracking-wide uppercase text-slate-300 font-mono mb-2">
            Actuators & Indicator Status
          </h3>

          <div className="space-y-2">
            {/* Piezo Buzzer */}
            <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    telemetry.buzzerActive ? 'bg-amber-400 animate-ping' : 'bg-slate-600'
                  }`}
                />
                <span>Active Buzzer (GPIO 3)</span>
              </div>
              <span
                className={`font-semibold ${
                  telemetry.buzzerActive ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {telemetry.buzzerActive ? `ON (${telemetry.buzzerFrequency} Hz)` : 'OFF'}
              </span>
            </div>

            {/* Coin Vibration Motor */}
            <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    telemetry.vibrationMotorActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span>Haptic Motor (L298N OUT3/4)</span>
              </div>
              <span
                className={`font-semibold ${
                  telemetry.vibrationMotorActive ? 'text-cyan-400' : 'text-slate-500'
                }`}
              >
                {telemetry.vibrationMotorActive
                  ? `ACTIVE (${Math.round((telemetry.vibrationDutyCycle / 255) * 100)}% PWM)`
                  : 'OFF'}
              </span>
            </div>

            {/* Traffic Status LEDs */}
            <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">Traffic Status Array:</span>
                <span className="text-[11px] font-mono font-semibold text-white">
                  {telemetry.systemStatus}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                {/* Green LED */}
                <div
                  className={`p-1.5 rounded border transition-all ${
                    telemetry.ledGreen
                      ? 'bg-emerald-950 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="block text-[10px]">GPIO 0</span>
                  <span className="font-bold">GREEN</span>
                </div>
                {/* Yellow LED */}
                <div
                  className={`p-1.5 rounded border transition-all ${
                    telemetry.ledYellow
                      ? 'bg-amber-950 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="block text-[10px]">GPIO 1</span>
                  <span className="font-bold">YELLOW</span>
                </div>
                {/* Red LED */}
                <div
                  className={`p-1.5 rounded border transition-all ${
                    telemetry.ledRed
                      ? 'bg-rose-950 border-rose-500/80 text-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="block text-[10px]">GPIO 10</span>
                  <span className="font-bold">RED</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. GPIO STATUS PIN MATRIX */}
        <section className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-300 font-mono">
              ESP32-C3 Pin Logic Matrix
            </h3>
            <span className="text-[10px] font-mono text-slate-500">10 GPIOs</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 0 (Grn LED):</span>
              <span className={telemetry.ledGreen ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {telemetry.ledGreen ? 'HIGH (3.3V)' : 'LOW (0V)'}
              </span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 1 (Yel LED):</span>
              <span className={telemetry.ledYellow ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                {telemetry.ledYellow ? 'HIGH (3.3V)' : 'LOW (0V)'}
              </span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 3 (Buzzer):</span>
              <span className={telemetry.buzzerActive ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                {telemetry.buzzerActive ? 'HIGH (TONE)' : 'LOW (0V)'}
              </span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 4 (IN3 PWM):</span>
              <span className={telemetry.vibrationMotorActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                {telemetry.vibrationMotorActive ? `${telemetry.vibrationDutyCycle} PWM` : '0 PWM'}
              </span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 5 (DS18B20):</span>
              <span className="text-purple-400 font-bold">1-WIRE BUS</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 6 (HX711 DT):</span>
              <span className="text-cyan-400 font-bold">24-BIT DOUT</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 7 (HX SCK):</span>
              <span className="text-cyan-400 font-bold">10Hz CLK</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 8 (MPU SDA):</span>
              <span className="text-blue-400 font-bold">I2C DATA</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 9 (MPU SCL):</span>
              <span className="text-blue-400 font-bold">400kHz CLK</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-950/70 rounded border border-slate-800/80">
              <span className="text-slate-400">GPIO 10 (Red LED):</span>
              <span className={telemetry.ledRed ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                {telemetry.ledRed ? 'HIGH (3.3V)' : 'LOW (0V)'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
