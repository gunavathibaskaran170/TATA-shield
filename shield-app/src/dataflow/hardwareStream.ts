/* ============================================================
   SHIELD — Real Hardware DataSourceAdapter & Bi-Directional Controller
   Connects to ESP32-C3 via WebSocket Bridge (ws://localhost:8765)
   or Browser Web Serial API (COM5 @ 115200 baud).

   Sensor Mappings:
   - HX711 Load Cell (W: kg, F: N) -> S01..S06 Strain Channels
   - MPU6050 IMU (G-Force, Shock, Roll ΔR, Pitch ΔP, Gyro) -> IMU01..IMU03
   - DS18B20 & IMU Temp (°C) -> TEMP01, TEMP02
   - SW-420 Vibration Sensor -> Dynamic shock & alert events

   Actuators Controlled:
   - Active Piezo Buzzer (GPIO 3) -> CMD:BUZZER:1 / 0 / 250
   - Coin Vibration Motor (GPIO 4 via L298N) -> CMD:MOTOR:<pwm>
   - Traffic LEDs (GPIO 0, 1, 10) -> CMD:LED_GREEN:1, LED_YELLOW:1, LED_RED:1
   - Load Cell Zero Tare -> CMD:TARE
   ============================================================ */

import type { DataSourceAdapter, TelemetryPacket } from '../schema/types';
import { SENSORS } from '../data/sensors';
import { useStore } from '../store/useStore';

export interface HardwareMetrics {
  weightKg: number;
  forceN: number;
  dynStressMpa: number;
  peakStressMpa: number;
  gForce: number;
  shockAcc: number;
  rollDeg: number;
  pitchDeg: number;
  gyroDps: number;
  chassisTempC: number;
  imuTempC: number;
  vibrationActive: boolean;
  statusFlag: string;
  rawLine: string;
  timestamp: number;
}

type PacketCallback = (pkt: TelemetryPacket) => void;
type MetricsCallback = (m: HardwareMetrics) => void;
type LogCallback = (line: string) => void;

export class HardwareStream implements DataSourceAdapter {
  kind = 'websocket' as const;
  label = 'Hardware / ESP32 Gateway (COM5 @ 115200 baud)';

  private ws: WebSocket | null = null;
  private wsUrl = 'ws://localhost:8765';
  private stat: 'idle' | 'connecting' | 'live' | 'error' = 'idle';
  private listeners: PacketCallback[] = [];
  private metricsListeners: MetricsCallback[] = [];
  private logListeners: LogCallback[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private retryCount = 0;

  // Web Serial API support (direct browser serial fallback)
  private serialPort: any = null;
  private serialReader: any = null;
  private serialWriter: any = null;
  private isUsingWebSerial = false;

  public currentMetrics: HardwareMetrics = {
    weightKg: 0,
    forceN: 0,
    dynStressMpa: 0,
    peakStressMpa: 0,
    gForce: 0.98,
    shockAcc: 9.6,
    rollDeg: 0,
    pitchDeg: 0,
    gyroDps: 0,
    chassisTempC: 28.5,
    imuTempC: 32.0,
    vibrationActive: false,
    statusFlag: 'NORMAL',
    rawLine: '',
    timestamp: Date.now(),
  };

  constructor(wsUrl = 'ws://localhost:8765') {
    this.wsUrl = wsUrl;
  }

  status() {
    return this.stat;
  }

  isConnected() {
    return this.stat === 'live';
  }

  setWsUrl(url: string) {
    this.wsUrl = url;
    if (this.stat === 'live' || this.stat === 'connecting') {
      this.disconnect();
      this.connect();
    }
  }

  connect() {
    if (this.stat === 'live' || this.stat === 'connecting') return;
    this.shouldReconnect = true;
    this.stat = 'connecting';
    this.emitLog(`[SYSTEM] Connecting to SHIELD Hardware Bridge at ${this.wsUrl}...`);

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.stat = 'live';
        this.retryCount = 0;
        this.emitLog(`[SYSTEM] Connected to Hardware WebSocket Bridge (${this.wsUrl}). Hardware Live telemetry streaming active!`);
      };

      this.ws.onmessage = (event) => {
        const raw = String(event.data || '').trim();
        if (!raw) return;
        this.handleIncomingRawLine(raw);
      };

      this.ws.onerror = () => {
        if (this.stat !== 'live') {
          this.stat = 'error';
        }
      };

      this.ws.onclose = () => {
        const wasLive = this.stat === 'live';
        this.stat = 'idle';
        this.ws = null;
        if (wasLive) {
          this.emitLog(`[SYSTEM] Disconnected from Hardware Bridge.`);
        }
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (e: any) {
      this.stat = 'error';
      this.emitLog(`[SYSTEM ERROR] Failed to initialize WebSocket: ${e.message}`);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.disconnectWebSerial();
    this.stat = 'idle';
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || !this.shouldReconnect) return;
    this.retryCount++;
    const delay = Math.min(5000, 1000 * Math.min(this.retryCount, 5));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && this.stat !== 'live') {
        this.connect();
      }
    }, delay);
  }

  /* ------------------------------------------------------------
     Web Serial API Direct Connection (Alternative to Python Bridge)
     ------------------------------------------------------------ */
  async connectWebSerial(baudRate = 115200): Promise<boolean> {
    if (!('serial' in navigator)) {
      this.emitLog(`[SYSTEM ERROR] Web Serial API is not supported in this browser.`);
      return false;
    }

    try {
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate });
      this.isUsingWebSerial = true;
      this.stat = 'live';
      this.emitLog(`[SYSTEM] Connected directly via Web Serial API @ ${baudRate} baud.`);

      const textDecoder = new TextDecoderStream();
      this.serialPort.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      this.serialReader = reader;

      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(this.serialPort.writable);
      this.serialWriter = textEncoder.writable.getWriter();

      // Start reader loop
      (async () => {
        let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed) this.handleIncomingRawLine(trimmed);
              }
            }
          }
        } catch (err: any) {
          this.emitLog(`[SERIAL ERROR] Reader loop error: ${err.message}`);
        }
      })();

      return true;
    } catch (e: any) {
      this.emitLog(`[SERIAL ERROR] Failed to open Web Serial: ${e.message}`);
      return false;
    }
  }

  async disconnectWebSerial() {
    if (this.isUsingWebSerial && this.serialPort) {
      try {
        if (this.serialReader) {
          await this.serialReader.cancel();
          this.serialReader = null;
        }
        if (this.serialWriter) {
          await this.serialWriter.close();
          this.serialWriter = null;
        }
        await this.serialPort.close();
        this.serialPort = null;
        this.isUsingWebSerial = false;
        this.stat = 'idle';
        this.emitLog(`[SYSTEM] Web Serial port closed.`);
      } catch {
        // Ignore close errors
      }
    }
  }

  /* ------------------------------------------------------------
     Telemetry Packet Ingestion & Parsing
     ------------------------------------------------------------ */
  onPacket(cb: PacketCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  onHardwareMetrics(cb: MetricsCallback) {
    this.metricsListeners.push(cb);
    cb(this.currentMetrics);
    return () => {
      this.metricsListeners = this.metricsListeners.filter((l) => l !== cb);
    };
  }

  onRawLog(cb: LogCallback) {
    this.logListeners.push(cb);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== cb);
    };
  }

  private emitLog(line: string) {
    for (const l of this.logListeners) {
      l(line);
    }
  }

  private emitMetrics() {
    for (const l of this.metricsListeners) {
      l(this.currentMetrics);
    }
  }

  /** Parses incoming serial lines from Arduino/ESP32 sketch */
  private handleIncomingRawLine(raw: string) {
    this.emitLog(raw);

    // Try parsing as JSON first
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const obj = JSON.parse(raw);
        this.updateFromJSON(obj, raw);
        return;
      } catch {
        // Fall back to regex parsing
      }
    }

    // Try parsing as CSV (e.g. "0.00,0.000,0.000,0.99,0.1,0.2,24.5,0,0")
    if (raw.includes(',') && !raw.includes(':')) {
      const parts = raw.split(',').map((s) => s.trim());
      if (parts.length >= 7) {
        const weightKg = parseFloat(parts[0]) || 0;
        const dynStressMpa = parseFloat(parts[2]) || 0;
        const gForce = parseFloat(parts[3]) || 1.0;
        const pitchDeg = parseFloat(parts[4]) || 0;
        const rollDeg = parseFloat(parts[5]) || 0;
        const chassisTempC = parseFloat(parts[6]) || 24.5;
        const vibrationActive = parts[7] === '1';
        const stateCode = parseInt(parts[8] || '0', 10);
        const statusFlag = stateCode === 2 ? 'CRITICAL TORSION ALERT' : stateCode === 1 ? 'CAUTION' : 'NORMAL';

        this.currentMetrics = {
          weightKg,
          forceN: weightKg * 9.81,
          dynStressMpa,
          peakStressMpa: dynStressMpa,
          gForce,
          shockAcc: Math.abs(gForce * 9.81 - 9.81),
          rollDeg,
          pitchDeg,
          gyroDps: 0,
          chassisTempC,
          imuTempC: 32.0,
          vibrationActive,
          statusFlag,
          rawLine: raw,
          timestamp: Date.now(),
        };

        this.emitMetrics();
        this.broadcastTelemetryPackets();
        return;
      }
    }

    // Parse standard formatted serial line:
    // DATA: [LOAD] W: 0.00 kg | F: 0.00 N | [STRESS] Dyn: 0.000 MPa | Peak: 0.000 MPa | [G-FORCE] 0.98 G (Shock: 9.6 m/s2) | [WARP] ΔR: 14.2° | ΔP: 1.6° | [GYRO] 0.8 °/s | [TEMP] Chassis: 24.2 C (IMU: 44.2 C) --> STATUS
    let weightKg = this.currentMetrics.weightKg;
    let forceN = this.currentMetrics.forceN;
    let dynStressMpa = this.currentMetrics.dynStressMpa;
    let peakStressMpa = this.currentMetrics.peakStressMpa;
    let gForce = this.currentMetrics.gForce;
    let shockAcc = this.currentMetrics.shockAcc;
    let rollDeg = this.currentMetrics.rollDeg;
    let pitchDeg = this.currentMetrics.pitchDeg;
    let gyroDps = this.currentMetrics.gyroDps;
    let chassisTempC = this.currentMetrics.chassisTempC;
    let imuTempC = this.currentMetrics.imuTempC;
    let vibrationActive = this.currentMetrics.vibrationActive;
    let statusFlag = this.currentMetrics.statusFlag;

    // Extract Load & Force (supports "[LOAD] 0.00 kg", "[LOAD] W: 0.00 kg", and "LOAD: 0.00kg")
    const weightMatch = raw.match(/(?:\[LOAD\]\s*(?:W:\s*)?|LOAD:\s*)([-\d.]+)\s*kg/i);
    if (weightMatch) weightKg = parseFloat(weightMatch[1]);

    const forceMatch = raw.match(/F:\s*([-\d.]+)\s*N/i) || raw.match(/force_N["']?:\s*([-\d.]+)/i);
    if (forceMatch) {
      forceN = parseFloat(forceMatch[1]);
    } else if (weightMatch) {
      forceN = weightKg * 9.81;
    }

    // Extract Stress (supports "[DYN STRESS] 0.000 MPa", "[STRESS] Dyn: 0.000 MPa", and "STRS: 0.000MPa")
    const dynStressMatch = raw.match(/(?:\[(?:DYN\s+)?STRESS\]\s*(?:Dyn:\s*)?|STRS:\s*)([-\d.]+)\s*MPa/i);
    if (dynStressMatch) dynStressMpa = parseFloat(dynStressMatch[1]);

    const peakStressMatch = raw.match(/Peak:\s*([-\d.]+)\s*MPa/i);
    if (peakStressMatch) peakStressMpa = parseFloat(peakStressMatch[1]);

    // Extract G-Force & Shock (supports "[G] 0.98", "[G-FORCE] 0.97 G", and "G: 0.99")
    const gForceMatch = raw.match(/(?:\[(?:G-FORCE|G)\]|G:)\s*([-\d.]+)/i);
    if (gForceMatch) gForce = parseFloat(gForceMatch[1]);

    const shockMatch = raw.match(/Shock:\s*([-\d.]+)\s*m\/s2/i);
    if (shockMatch) shockAcc = parseFloat(shockMatch[1]);

    // Extract Warp (Roll & Pitch)
    const rollMatch = raw.match(/(?:(?:\[WARP\]\s*)?(?:ΔR|ROLL|R):\s*)([-\d.]+)/i);
    if (rollMatch) rollDeg = parseFloat(rollMatch[1]);

    const pitchMatch = raw.match(/(?:(?:ΔP|PITCH|P):\s*)([-\d.]+)/i);
    if (pitchMatch) pitchDeg = parseFloat(pitchMatch[1]);

    // Extract Gyro
    const gyroMatch = raw.match(/\[GYRO\]\s*([-\d.]+)\s*°\/s/i) || raw.match(/GYRO:\s*([-\d.]+)/i);
    if (gyroMatch) gyroDps = parseFloat(gyroMatch[1]);

    // Extract Temperature (supports "[TEMP] 24.2 C", "[TEMP] Chassis: 24.6 C", "TEMP: 24.5C", "T: 24.5°C")
    if (raw.includes('Chassis: DISCONNECTED')) {
      chassisTempC = 0.0;
    } else {
      const chassisTempMatch = raw.match(/(?:\[TEMP\]\s*(?:Chassis:\s*)?|TEMP:\s*|T:\s*)([-\d.]+)\s*(?:°?C)?/i);
      if (chassisTempMatch) chassisTempC = parseFloat(chassisTempMatch[1]);
    }

    const imuTempMatch = raw.match(/IMU:\s*([-\d.]+)\s*C/i);
    if (imuTempMatch) imuTempC = parseFloat(imuTempMatch[1]);

    // Extract Vibration Status
    if (raw.includes('[VIB: SHOCK') || raw.includes('VIB: HIT') || raw.includes('VIBRATION!') || raw.includes('VIB: ACTIVE')) {
      vibrationActive = true;
    } else if (raw.includes('[VIB: IDLE ]') || raw.includes('VIB: IDLE')) {
      vibrationActive = false;
    }

    // Extract Status Flag
    if (raw.includes('-->')) {
      const parts = raw.split('-->');
      statusFlag = parts[parts.length - 1].trim();
    } else if (raw.includes('[CRITICAL]') || raw.includes('CRITICAL') || raw.includes('TORSION') || raw.includes('TWIST')) {
      statusFlag = 'CRITICAL TORSION ALERT';
    } else if (raw.includes('[CAUTION]') || raw.includes('CAUTION') || raw.includes('WARN')) {
      statusFlag = 'CAUTION';
    } else if (raw.includes('[SAFE]')) {
      statusFlag = 'NORMAL';
    } else {
      statusFlag = 'NORMAL';
    }

    this.currentMetrics = {
      weightKg,
      forceN,
      dynStressMpa,
      peakStressMpa,
      gForce,
      shockAcc,
      rollDeg,
      pitchDeg,
      gyroDps,
      chassisTempC,
      imuTempC,
      vibrationActive,
      statusFlag,
      rawLine: raw,
      timestamp: Date.now(),
    };

    this.emitMetrics();
    this.broadcastTelemetryPackets();
  }

  private updateFromJSON(obj: any, raw: string) {
    if (typeof obj.force_N === 'number') this.currentMetrics.forceN = obj.force_N;
    if (typeof obj.weight_kg === 'number') this.currentMetrics.weightKg = obj.weight_kg;
    if (typeof obj.temp_C === 'number') this.currentMetrics.chassisTempC = obj.temp_C;
    if (typeof obj.pitch === 'number') this.currentMetrics.pitchDeg = obj.pitch;
    if (typeof obj.roll === 'number') this.currentMetrics.rollDeg = obj.roll;
    if (typeof obj.g_force === 'number') this.currentMetrics.gForce = obj.g_force;
    if (typeof obj.dyn_stress === 'number') this.currentMetrics.dynStressMpa = obj.dyn_stress;
    if (typeof obj.status === 'string') this.currentMetrics.statusFlag = obj.status;
    this.currentMetrics.rawLine = raw;
    this.currentMetrics.timestamp = Date.now();

    this.emitMetrics();
    this.broadcastTelemetryPackets();
  }

  /** Converts parsed hardware metrics into SHIELD TelemetryPackets for the Analytics Engine */
  private broadcastTelemetryPackets() {
    if (!this.listeners.length) return;

    const st = useStore.getState();
    const vehicleId = st.vehicleId || 'NEXON-EV-2026';
    const ts = new Date().toISOString();
    const m = this.currentMetrics;

    const forceStrainContribution = m.forceN * 0.45;
    const rollTorsionContribution = Math.abs(m.rollDeg) * 12.0;
    const dynStressContribution = m.dynStressMpa * 8.0;

    const sensorValues: Record<string, { value: number; quality: number }> = {
      S01: { value: 452 + forceStrainContribution * 0.95, quality: 0.99 },
      S02: { value: 455 + forceStrainContribution * 1.05, quality: 0.98 },
      S03: { value: 218 + forceStrainContribution * 0.6 + rollTorsionContribution, quality: 0.97 },
      S04: { value: 221 + forceStrainContribution * 0.6 - rollTorsionContribution, quality: 0.97 },
      S05: { value: 205 + forceStrainContribution * 0.7 + dynStressContribution, quality: 0.96 },
      S06: { value: 209 + forceStrainContribution * 0.7 + dynStressContribution, quality: 0.98 },
      // IMUs
      IMU01: { value: 0.42 * m.gForce + m.shockAcc * 0.04, quality: 0.99 },
      IMU02: { value: 0.31 + Math.abs(m.gyroDps) * 0.02 + Math.abs(m.pitchDeg) * 0.015, quality: 0.99 },
      IMU03: { value: 0.35 + Math.abs(m.rollDeg) * 0.02 + (m.vibrationActive ? 0.8 : 0), quality: 0.98 },
      // Temperature
      TEMP01: { value: m.chassisTempC, quality: 0.96 },
      TEMP02: { value: m.imuTempC, quality: 0.95 },
    };

    for (const sensor of SENSORS) {
      const sVal = sensorValues[sensor.id];
      if (!sVal) continue;

      const pkt: TelemetryPacket = {
        vehicleId,
        timestamp: ts,
        sensorId: sensor.id,
        componentId: sensor.componentId,
        signal: sensor.signal,
        value: sVal.value,
        unit: sensor.unit,
        quality: sVal.quality,
        provenance: 'MEASURED',
      };

      for (const cb of this.listeners) {
        cb(pkt);
      }
    }
  }

  /* ------------------------------------------------------------
     Bi-Directional Actuator Control Commands
     ------------------------------------------------------------ */
  sendCommand(cmd: string) {
    const formatted = cmd.trim();
    if (!formatted) return;

    this.emitLog(`[TX COMMAND] > ${formatted}`);

    if (this.isUsingWebSerial && this.serialWriter) {
      try {
        this.serialWriter.write(`${formatted}\n`);
      } catch (err: any) {
        this.emitLog(`[SERIAL ERROR] Failed to send: ${err.message}`);
      }
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(formatted);
    } else {
      this.emitLog(`[SYSTEM WARN] Cannot send command '${formatted}' — hardware link not open.`);
    }
  }

  /** Trigger or toggle Piezo Buzzer */
  sendBuzzer(state: boolean | number) {
    if (typeof state === 'number') {
      this.sendCommand(`CMD:BUZZER:${state}`);
    } else {
      this.sendCommand(`CMD:BUZZER:${state ? 1 : 0}`);
    }
  }

  /** Set Coin Vibration Motor PWM Speed (0..255) */
  sendMotor(pwm: number) {
    const clamped = Math.max(0, Math.min(255, Math.round(pwm)));
    this.sendCommand(`CMD:MOTOR:${clamped}`);
  }

  /** Trigger brief vibration pulse */
  pulseMotor(durationMs = 1200) {
    this.sendMotor(255);
    setTimeout(() => {
      this.sendMotor(0);
    }, durationMs);
  }

  /** Set Status LED */
  sendLed(color: 'GREEN' | 'YELLOW' | 'RED', on: boolean) {
    this.sendCommand(`CMD:LED_${color.toUpperCase()}:${on ? 1 : 0}`);
  }

  /** Zero Tare HX711 Load Cell */
  sendTare() {
    this.sendCommand('CMD:TARE');
  }

  /** Set Simulated / Base Weight Calibration */
  sendSetBaseWeight(weightKg: number) {
    this.sendCommand(`CMD:SET_BASE_WEIGHT:${weightKg.toFixed(2)}`);
  }

  /** Set Simulated / Base Temperature */
  sendSetTemp(tempC: number) {
    this.sendCommand(`CMD:SET_TEMP:${tempC.toFixed(1)}`);
  }

  /** Set Simulated / Base Roll Warp */
  sendSetRoll(rollDeg: number) {
    this.sendCommand(`CMD:SET_ROLL:${rollDeg.toFixed(1)}`);
  }
}

// Global Singleton Instance
export const hardwareStream = new HardwareStream();
