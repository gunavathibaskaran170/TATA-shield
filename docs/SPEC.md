# SHIELD — Structural Intelligence Technical Specification

## Overview
SHIELD (Structural Health Intelligence and Lifecycle Evaluation for Electric Vehicles) is an independent structural digital twin architecture designed to unify factory manufacturing inspection records (Baseline A), healthy controlled validation responses (Baseline B), and live operational telemetry.

## System Architecture
1. **Frontend**: React + TypeScript + Three.js / React Three Fiber web dashboard (`shield-app/` or `frontend/`).
2. **Backend**: FastAPI + Python 3.11 asynchronous web server with WebSocket broadcasting and residual analytics engine (`backend/`).
3. **Unity 6 Digital Twin**: Unity 6 desktop simulation environment with Rigidbody/WheelCollider EV vehicle physics, camera rigs, and WebSocket telemetry client (`unity/`).
4. **Hardware & Firmware**: ESP32-C3 microcontroller with MPU6050 I2C IMU, HX711 load cell ADC, and DS18B20 1-Wire temperature sensor (`firmware/`).
5. **Serial Gateway**: Python USB serial-to-HTTP/WebSocket bridge (`gateway/`).
6. **Schema Contract**: JSON Schema v1.0 versioned data telemetry contract (`schemas/`).

## Three Lifecycle Stages
- **Stage 1 — Factory Baseline (Baseline A)**: Pre-assembly dimensional verification, battery mount inspection, weld checks.
- **Stage 2 — Controlled Validation (Baseline B)**: Low-energy test rig reference loading, hysteresis, load/unload recovery.
- **Stage 3 — Live Monitoring & Trajectory**: Real-time telemetry monitoring, 3D region overlays, vehicle trajectory tracking, and replay.

## Four 3D Viewing Modes
1. **Complete Car**: Closed metallic graphite silver production EV SUV exterior.
2. **Transparent Body**: Pearl-white translucent glass shell exposing underlying unibody frame and battery enclosure.
3. **Chassis Only**: Bare structural unibody frame, side sills, floor crossmembers, subframes, battery, and sensors.
4. **Exploded Assembly**: CAD exploded view with variable explode distance slider.
5. **Skeletal View**: Original structural BIW and internal component hierarchy view.
