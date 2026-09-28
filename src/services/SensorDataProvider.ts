import { ImpactScenario, SensorTelemetry, ChassisHealthState } from '../types/simulation';

export type TelemetryCallback = (data: SensorTelemetry) => void;

export interface SensorDataProvider {
  readonly id: string;
  readonly name: string;
  readonly isConnected: boolean;
  start(): void;
  pause(): void;
  reset(): void;
  setScenario(scenario: ImpactScenario): void;
  subscribe(callback: TelemetryCallback): () => void;
  getLatestTelemetry(): SensorTelemetry;
}

/**
 * High-fidelity real-time physics simulation of EV chassis strain, IMU kinetics,
 * temperature gradients, and actuator control logic.
 */
export class SimulatedSensorDataProvider implements SensorDataProvider {
  readonly id = 'SIMULATOR';
  readonly name = 'SHIELD High-Fidelity Physics Engine';
  public isConnected = true;

  private isRunning = true;
  private currentScenario: ImpactScenario = 'NORMAL';
  private scenarioStartTime = 0;
  private listeners: Set<TelemetryCallback> = new Set();
  private timerId: number | null = null;
  private tickCount = 0;

  // Persistent deformation for STRUCTURAL_DAMAGE
  private permanentDeformationMicroStrain = 0;
  private permanentDeflectionMm = 0;

  // Current telemetry state
  private telemetry: SensorTelemetry = {
    timestamp: Date.now(),
    strainMicroStrain: 12,
    loadKg: 24.5,
    loadCell1Raw: 842100,
    loadCell2Raw: 841950,
    strainDeformationMm: 0.08,
    accel: { x: 0.01, y: 0.02, z: 1.00 },
    gyro: { x: 0.1, y: -0.2, z: 0.0 },
    roll: 0.0,
    pitch: 0.0,
    yaw: 0.0,
    temperatureC: 24.8,
    vibrationMotorActive: false,
    vibrationDutyCycle: 0,
    buzzerActive: false,
    buzzerFrequency: 0,
    ledGreen: true,
    ledYellow: false,
    ledRed: false,
    systemStatus: 'NORMAL',
    activeScenario: 'NORMAL',
    scenarioProgress: 0,
    dataSource: 'SIMULATION',
  };

  constructor() {
    this.start();
  }

  public subscribe(callback: TelemetryCallback): () => void {
    this.listeners.add(callback);
    callback(this.telemetry);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getLatestTelemetry(): SensorTelemetry {
    return { ...this.telemetry };
  }

  public start(): void {
    this.isRunning = true;
    if (this.timerId === null) {
      this.timerId = window.setInterval(() => this.tick(), 40); // 25 Hz update loop
    }
  }

  public pause(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public reset(): void {
    this.currentScenario = 'NORMAL';
    this.scenarioStartTime = Date.now();
    this.permanentDeformationMicroStrain = 0;
    this.permanentDeflectionMm = 0;
    this.tickCount = 0;

    this.telemetry = {
      timestamp: Date.now(),
      strainMicroStrain: 14,
      loadKg: 25.0,
      loadCell1Raw: 842100,
      loadCell2Raw: 841950,
      strainDeformationMm: 0.08,
      accel: { x: 0.0, y: 0.0, z: 1.0 },
      gyro: { x: 0.0, y: 0.0, z: 0.0 },
      roll: 0.0,
      pitch: 0.0,
      yaw: 0.0,
      temperatureC: 24.8,
      vibrationMotorActive: false,
      vibrationDutyCycle: 0,
      buzzerActive: false,
      buzzerFrequency: 0,
      ledGreen: true,
      ledYellow: false,
      ledRed: false,
      systemStatus: 'NORMAL',
      activeScenario: 'NORMAL',
      scenarioProgress: 0,
      dataSource: 'SIMULATION',
    };
    this.notify();
  }

  public setScenario(scenario: ImpactScenario): void {
    this.currentScenario = scenario;
    this.scenarioStartTime = Date.now();

    if (scenario === 'STRUCTURAL_DAMAGE') {
      this.permanentDeformationMicroStrain = 1750;
      this.permanentDeflectionMm = 7.8;
    } else if (scenario === 'NORMAL') {
      this.permanentDeformationMicroStrain = 0;
      this.permanentDeflectionMm = 0;
    }
  }

  private tick(): void {
    if (!this.isRunning) return;
    this.tickCount++;

    const now = Date.now();
    const elapsedSec = (now - this.scenarioStartTime) / 1000;
    const noise = (Math.random() - 0.5) * 4;
    const microJitter = (Math.random() - 0.5) * 0.02;

    let dynamicStrain = 0;
    let accelX = (Math.random() - 0.5) * 0.02;
    let accelY = (Math.random() - 0.5) * 0.02;
    let accelZ = 1.0 + (Math.random() - 0.5) * 0.02;
    let gyroX = (Math.random() - 0.5) * 0.4;
    let gyroY = (Math.random() - 0.5) * 0.4;
    let gyroZ = (Math.random() - 0.5) * 0.3;
    let roll = 0;
    let pitch = 0;
    let tempC = 24.8 + Math.sin(this.tickCount * 0.02) * 0.4;
    let progress = 0;

    let status: ChassisHealthState = 'NORMAL';
    let ledGreen = true;
    let ledYellow = false;
    let ledRed = false;
    let buzzer = false;
    let buzzerFreq = 0;
    let motor = false;
    let motorDuty = 0;

    switch (this.currentScenario) {
      case 'NORMAL': {
        dynamicStrain = 12 + Math.sin(this.tickCount * 0.05) * 6 + noise;
        status = 'NORMAL';
        ledGreen = true;
        ledYellow = false;
        ledRed = false;
        buzzer = false;
        motor = false;
        progress = 1.0;
        break;
      }

      case 'POTHOLE': {
        // High-frequency impact spike lasting ~1.5s then decaying
        const duration = 2.0;
        progress = Math.min(1.0, elapsedSec / duration);
        if (elapsedSec < duration) {
          const decay = Math.exp(-elapsedSec * 2.5);
          const freq = Math.sin(elapsedSec * 24);
          dynamicStrain = 280 * decay * freq + 30 * decay + 14;
          accelZ = 1.0 + 2.1 * decay * freq;
          accelY = 0.8 * decay * Math.cos(elapsedSec * 18);
          roll = 4.2 * decay * Math.sin(elapsedSec * 12);
          pitch = -3.5 * decay * Math.cos(elapsedSec * 15);
          gyroX = 35 * decay * freq;
          gyroY = -28 * decay * Math.cos(elapsedSec * 16);

          status = 'WARNING';
          ledGreen = false;
          ledYellow = true;
          ledRed = false;
          buzzer = false;
          motor = decay > 0.3;
          motorDuty = Math.floor(140 * decay);
        } else {
          // Settled back to normal
          dynamicStrain = 14 + noise;
          status = 'NORMAL';
          ledGreen = true;
          ledYellow = false;
          ledRed = false;
          buzzer = false;
          motor = false;
        }
        break;
      }

      case 'MINOR_IMPACT': {
        // Lateral curb / bump impact lasting ~3.0s
        const duration = 3.5;
        progress = Math.min(1.0, elapsedSec / duration);
        if (elapsedSec < duration) {
          const decay = Math.exp(-elapsedSec * 1.4);
          const freq = Math.sin(elapsedSec * 16);
          dynamicStrain = 580 * decay * freq + 80 * decay + 25;
          accelX = 3.2 * decay * freq;
          accelY = 1.5 * decay * Math.cos(elapsedSec * 14);
          accelZ = 1.0 + 1.2 * decay * freq;
          roll = 8.5 * decay * Math.sin(elapsedSec * 10);
          pitch = 5.0 * decay * Math.cos(elapsedSec * 12);
          gyroZ = 65 * decay * freq;

          status = 'WARNING';
          ledGreen = false;
          ledYellow = true;
          ledRed = false;
          buzzer = elapsedSec < 0.8;
          buzzerFreq = 1800;
          motor = decay > 0.15;
          motorDuty = Math.floor(190 * decay);
        } else {
          dynamicStrain = 28 + noise; // slight offset
          status = 'WARNING';
          ledGreen = false;
          ledYellow = true;
          ledRed = false;
          buzzer = false;
          motor = false;
        }
        break;
      }

      case 'MAJOR_IMPACT': {
        // High-energy collision with ongoing structural alarm
        const duration = 4.5;
        progress = Math.min(1.0, elapsedSec / duration);
        const decay = Math.exp(-elapsedSec * 0.9);
        const freq = Math.sin(elapsedSec * 22);

        dynamicStrain = 1350 * decay * freq + 750 * decay + 420;
        accelX = 6.4 * decay * freq + (Math.random() - 0.5) * 0.4;
        accelY = 4.1 * decay * Math.cos(elapsedSec * 18);
        accelZ = 1.0 + 3.8 * decay * freq;
        roll = 14.0 * decay * Math.sin(elapsedSec * 8);
        pitch = -11.0 * decay * Math.cos(elapsedSec * 9);
        tempC = 27.4 + Math.min(6.0, elapsedSec * 1.2); // Thermal friction heating

        status = 'CRITICAL';
        ledGreen = false;
        ledYellow = false;
        ledRed = true;
        // Pulsing siren buzzer
        buzzer = (Math.floor(elapsedSec * 6) % 2 === 0);
        buzzerFreq = buzzer ? 2800 : 0;
        motor = true;
        motorDuty = 255;
        break;
      }

      case 'STRUCTURAL_DAMAGE': {
        // Permanent plastic deformation of chassis frame members
        dynamicStrain = this.permanentDeformationMicroStrain + Math.sin(this.tickCount * 0.08) * 35 + noise;
        accelZ = 1.0 + microJitter * 2;
        roll = 3.2; // permanent structural twist
        pitch = -1.8;
        tempC = 29.8 + Math.sin(this.tickCount * 0.03) * 0.8;

        status = 'CRITICAL';
        ledGreen = false;
        ledYellow = false;
        ledRed = true;
        // Intermittent fault buzzer tone
        buzzer = (Math.floor(this.tickCount / 12) % 4 === 0);
        buzzerFreq = 3200;
        motor = (Math.floor(this.tickCount / 15) % 3 === 0);
        motorDuty = 220;
        progress = 1.0;
        break;
      }
    }

    const totalMicroStrain = Math.max(0, dynamicStrain + this.permanentDeformationMicroStrain);
    const loadKg = +(totalMicroStrain * 0.125).toFixed(1);
    const deflectionMm = +(totalMicroStrain * 0.0042 + this.permanentDeflectionMm).toFixed(2);

    // Compute raw 24-bit ADC values (HX711 baseline ~ 8388608 or midscale offset)
    const lc1Raw = Math.floor(842000 + totalMicroStrain * 18.4 + noise * 10);
    const lc2Raw = Math.floor(841800 + totalMicroStrain * 17.9 - noise * 8);

    this.telemetry = {
      timestamp: now,
      strainMicroStrain: Math.round(totalMicroStrain),
      loadKg,
      loadCell1Raw: lc1Raw,
      loadCell2Raw: lc2Raw,
      strainDeformationMm: deflectionMm,
      accel: {
        x: +accelX.toFixed(3),
        y: +accelY.toFixed(3),
        z: +accelZ.toFixed(3),
      },
      gyro: {
        x: +gyroX.toFixed(2),
        y: +gyroY.toFixed(2),
        z: +gyroZ.toFixed(2),
      },
      roll: +roll.toFixed(1),
      pitch: +pitch.toFixed(1),
      yaw: 0,
      temperatureC: +tempC.toFixed(1),
      vibrationMotorActive: motor,
      vibrationDutyCycle: motor ? motorDuty : 0,
      buzzerActive: buzzer,
      buzzerFrequency: buzzer ? buzzerFreq : 0,
      ledGreen,
      ledYellow,
      ledRed,
      systemStatus: status,
      activeScenario: this.currentScenario,
      scenarioProgress: progress,
      dataSource: 'SIMULATION',
    };

    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.telemetry);
    }
  }
}

/**
 * Real ESP32-C3 Hardware Provider supporting Web Serial, Web Bluetooth, and WebSocket streams.
 */
export class RealESP32SensorDataProvider implements SensorDataProvider {
  readonly id = 'REAL_ESP32';
  readonly name = 'ESP32-C3 Direct Hardware Stream';
  public isConnected = false;

  private listeners: Set<TelemetryCallback> = new Set();
  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private simulatedFallback: SimulatedSensorDataProvider;

  private telemetry: SensorTelemetry = {
    timestamp: Date.now(),
    strainMicroStrain: 0,
    loadKg: 0,
    loadCell1Raw: 0,
    loadCell2Raw: 0,
    strainDeformationMm: 0,
    accel: { x: 0, y: 0, z: 1.0 },
    gyro: { x: 0, y: 0, z: 0 },
    roll: 0,
    pitch: 0,
    yaw: 0,
    temperatureC: 25.0,
    vibrationMotorActive: false,
    vibrationDutyCycle: 0,
    buzzerActive: false,
    buzzerFrequency: 0,
    ledGreen: true,
    ledYellow: false,
    ledRed: false,
    systemStatus: 'NORMAL',
    activeScenario: 'NORMAL',
    scenarioProgress: 0,
    dataSource: 'REAL_HARDWARE',
  };

  constructor() {
    this.simulatedFallback = new SimulatedSensorDataProvider();
  }

  public subscribe(callback: TelemetryCallback): () => void {
    this.listeners.add(callback);
    callback(this.telemetry);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getLatestTelemetry(): SensorTelemetry {
    return { ...this.telemetry };
  }

  public start(): void {
    // If not connected to physical port, fallback gracefully
    if (!this.isConnected) {
      this.simulatedFallback.start();
    }
  }

  public pause(): void {
    this.simulatedFallback.pause();
  }

  public reset(): void {
    this.simulatedFallback.reset();
  }

  public setScenario(scenario: ImpactScenario): void {
    this.simulatedFallback.setScenario(scenario);
  }

  /**
   * Connects via Browser Web Serial API (Chrome/Edge on Desktop)
   */
  public async connectSerial(baudRate = 115200): Promise<{ success: boolean; message: string }> {
    if (!('serial' in navigator)) {
      return {
        success: false,
        message: 'Web Serial API is not supported in this browser. Please use Chrome/Edge on Desktop.'
      };
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;
      this.isReading = true;
      this.readSerialLoop();
      return { success: true, message: 'Connected to ESP32-C3 on Serial Port at ' + baudRate + ' baud.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to open serial port' };
    }
  }

  public async disconnectSerial(): Promise<void> {
    this.isReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {}
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {}
    }
    this.isConnected = false;
  }

  private async readSerialLoop(): Promise<void> {
    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';
    try {
      while (this.isReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            this.parseJsonTelemetry(line.trim());
          }
        }
      }
    } catch (err) {
      console.warn('Serial read ended:', err);
    } finally {
      this.isConnected = false;
    }
  }

  public parseJsonTelemetry(jsonString: string): boolean {
    try {
      if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) return false;
      const data = JSON.parse(jsonString);
      
      const strain = data.strain || data.ue || 0;
      const status: ChassisHealthState =
        strain > 1200 ? 'CRITICAL' : strain > 350 ? 'WARNING' : 'NORMAL';

      this.telemetry = {
        timestamp: Date.now(),
        strainMicroStrain: Math.round(strain),
        loadKg: data.load || +(strain * 0.125).toFixed(1),
        loadCell1Raw: data.raw1 || 0,
        loadCell2Raw: data.raw2 || 0,
        strainDeformationMm: data.deflection || +(strain * 0.0042).toFixed(2),
        accel: {
          x: data.ax ?? 0,
          y: data.ay ?? 0,
          z: data.az ?? 1.0,
        },
        gyro: {
          x: data.gx ?? 0,
          y: data.gy ?? 0,
          z: data.gz ?? 0,
        },
        roll: data.roll ?? 0,
        pitch: data.pitch ?? 0,
        yaw: data.yaw ?? 0,
        temperatureC: data.temp ?? 25.0,
        vibrationMotorActive: Boolean(data.motor),
        vibrationDutyCycle: data.duty ?? 0,
        buzzerActive: Boolean(data.buzzer),
        buzzerFrequency: data.buzzer ? 2500 : 0,
        ledGreen: status === 'NORMAL',
        ledYellow: status === 'WARNING',
        ledRed: status === 'CRITICAL',
        systemStatus: status,
        activeScenario: 'NORMAL',
        scenarioProgress: 1.0,
        dataSource: 'REAL_HARDWARE',
      };

      for (const listener of this.listeners) {
        listener(this.telemetry);
      }
      return true;
    } catch {
      return false;
    }
  }
}
