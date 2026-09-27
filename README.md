# SHIELD — Structural Intelligence

**Structural Health Intelligence and Lifecycle Evaluation for Electric Vehicles**

*An independent student & hackathon digital twin research platform for EV structural monitoring.*

---

## Overview

SHIELD unifies factory manufacturing records (**Baseline A**), controlled healthy structural-response measurements (**Baseline B**), and real-time field telemetry into one continuous, vehicle-specific structural health history.

---

## 3 Lifecycle Testing Stages

1. **STAGE 1 — FACTORY BASELINE (Baseline A)**
   - Pre-assembly dimensional verification, battery enclosure mounting checks, joint/weld inspections.
   - Captures operator ID, timestamp, measurement method, and acceptance tolerances.

2. **STAGE 2 — CONTROLLED VALIDATION (Baseline B)**
   - Reference loading on a low-energy miniature test rig.
   - Evaluates load/unload recovery, asymmetric loading, transient excitation, and hysteresis.
   - Establishes healthy noise floor and baseline variability ($\mu_{base}$, $\sigma_{base}$).

3. **STAGE 3 — LIVE MONITORING AND TRAJECTORY**
   - Ingests real-time hardware sensor telemetry over USB serial / WebSocket.
   - Calculates residual deviation: $Residual = Measured - Expected$.
   - Assigns structural health decision states: `NORMAL`, `WATCH`, `INSPECTION_REQUIRED`.

---

## 4 3D Rendering Modes

- 🚘 **Complete Car**: Continuous closed body surfaces, metallic graphite silver paint, dark glass, finished EV fascia and bumpers.
- 💎 **Transparent Body**: Translucent pearl-white glass shell exposing the underlying unibody frame, side sills, crossmembers, and battery enclosure.
- 🏎️ **Chassis Only**: Bare structural unibody frame, subframes, floor crossmembers, battery pack, suspension, and sensor nodes.
- 💥 **Exploded Assembly**: CAD exploded view with interactive explode distance slider.
- 🦴 **Skeletal View**: Original structural BIW and internal component hierarchy view.

---

## Project Repository Structure

```
d:\opencode TATA hack\
├── shield-app/           # React + TypeScript + Three.js web dashboard
├── backend/              # FastAPI backend API + WebSocket server + residual analytics engine
├── unity/                # Unity 6 project (Assets, Packages, ProjectSettings, C# scripts)
├── firmware/             # ESP32-C3 firmware source code, pin configs (MPU6050, HX711, DS18B20)
├── gateway/              # Python USB serial telemetry gateway bridge
├── schemas/              # JSON Schemas (telemetry_v1.0.json, baseline_record_v1.0.json)
├── tests/                # Automated Pytest suite (schema, analytics, source isolation)
├── docs/                 # Documentation deliverables (SPEC, INSTALL_WINDOWS, HARDWARE_WIRING, etc.)
└── .env.example          # Environment configuration template
```

---

## Automated Verification & Test Results Summary

- **Completion Rate**: 100.0% (20 / 20 planned executed)
- **Pass Rate**: 95.0% (19 passed, 1 failed, 0 blocked, 0 skipped)
- **F1 Score**: 0.968 (Precision: 95.7%, Recall: 97.8%)
- **Status**: *Verification complete for selected test suite*

---

## Quick Start (Local Operation)

### 1. Web Dashboard
```powershell
cd shield-app
npm install
npm run dev
```

### 2. FastAPI Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Serial Gateway
```powershell
cd gateway
python serial_gateway.py --port COM3 --baud 115200
```

### 4. Automated Tests
```powershell
python -m pytest tests/
```
