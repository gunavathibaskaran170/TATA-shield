# SHIELD — Windows 11 Installation Guide

This document provides step-by-step installation instructions for building and running SHIELD on Windows 11.

## Prerequisites
1. **Node.js**: LTS version (v18.x or v20.x). Download from [nodejs.org](https://nodejs.org/).
2. **Python**: Version 3.10 or 3.11. Download from [python.org](https://www.python.org/). Ensure "Add Python to PATH" is checked during setup.
3. **Git**: Installed and available in PowerShell.
4. **Unity Hub / Unity 6**: Unity 6000.0.x with Windows Build Support.
5. **Arduino IDE 2.x**: (Optional, for ESP32-C3 hardware flashing).

## Step-by-Step Installation

### 1. Web Dashboard (Frontend)
```powershell
# Navigate to web dashboard folder
cd "d:\opencode TATA hack\shield-app"

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173/`.

### 2. FastAPI Backend
```powershell
# Open a new PowerShell terminal
cd "d:\opencode TATA hack\backend"

# Create a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Verify the health endpoint at `http://localhost:8000/health`.

### 3. Serial Telemetry Gateway
```powershell
# Open a new PowerShell terminal
cd "d:\opencode TATA hack\gateway"

# Run serial gateway (auto-fallback to dry-run mode if no hardware attached)
python serial_gateway.py --port COM3 --baud 115200 --backend http://localhost:8000
```

### 4. Running Verification Test Suite
```powershell
cd "d:\opencode TATA hack"
python -m pytest tests/
```

### 5. Unity 6 Project
1. Open Unity Hub.
2. Click **Add** -> **Add project from disk**.
3. Select `d:\opencode TATA hack\unity`.
4. Open with Unity 6000.x editor.
5. Load scenes from `Assets/Scenes` (`FactoryInspection.unity`, `ControlledRig.unity`, `RoadMonitoring.unity`).
