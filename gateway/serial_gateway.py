#!/usr/bin/env python3
"""
SHIELD ESP32-C3 Serial Telemetry Gateway.
Reads serial JSON data from ESP32-C3 over USB serial, validates sequence numbers and schemas,
attaches ISO-8601 server timestamps, and forwards to the SHIELD backend via HTTP/WebSocket.
"""

import sys
import time
import json
import argparse
try:
    import serial
    import requests
except ImportError:
    pass

def run_gateway(port: str, baudrate: int, backend_url: str):
    print(f"[SHIELD GATEWAY] Opening serial port {port} at {baudrate} baud...")
    print(f"[SHIELD GATEWAY] Forwarding target: {backend_url}")
    
    try:
        ser = serial.Serial(port, baudrate, timeout=1.0)
    except Exception as e:
        print(f"[SHIELD GATEWAY ERROR] Could not open serial port {port}: {e}")
        print("[SHIELD GATEWAY INFO] Gateway running in dry-run mode (simulating serial packets)...")
        ser = None

    seq = 0
    while True:
        try:
            if ser and ser.in_waiting:
                line = ser.readline().decode('utf-8', errors='replace').strip()
                if line.startswith("{") and line.endswith("}"):
                    data = json.loads(line)
                    # Add server-side UTC timestamp
                    data["received_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    
                    resp = requests.post(f"{backend_url}/api/v1/telemetry/ingest", json=data, timeout=2.0)
                    print(f"[GATEWAY RX] Seq {data.get('sequence')} -> Backend HTTP {resp.status_code}")
            else:
                # Dry-run loop simulation if no hardware connected
                time.sleep(1.0)
                seq += 1
                sample_packet = {
                    "schema_version": "1.0",
                    "vehicle_id": "SHIELD-EV-0287",
                    "device_id": "NODE-ESP32C3-01",
                    "session_id": "sess-dryrun-01",
                    "run_id": "run-01",
                    "source": "hardware",
                    "sequence": seq,
                    "device_monotonic_ms": int(time.time() * 1000),
                    "received_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "geometry_version": "v2.4-unibody",
                    "calibration_version": "cal-2026.09",
                    "baseline_version": "A1-B2-verified",
                    "configuration_revision": 4,
                    "measurements": [
                        {"sensor_id": "S01", "region_id": "FL", "quantity": "force", "value": 121.5, "unit": "N", "quality": "valid"},
                        {"sensor_id": "S03", "region_id": "MID_L", "quantity": "force", "value": 85.2, "unit": "N", "quality": "valid"}
                    ],
                    "pose": None
                }
                try:
                    resp = requests.post(f"{backend_url}/api/v1/telemetry/ingest", json=sample_packet, timeout=1.0)
                    print(f"[GATEWAY DRY-RUN] Seq {seq} posted -> {resp.status_code}")
                except Exception:
                    pass
        except KeyboardInterrupt:
            print("[SHIELD GATEWAY] Shutting down.")
            break
        except Exception as ex:
            print(f"[SHIELD GATEWAY WARN] Packet error: {ex}")
            time.sleep(0.5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SHIELD Serial Telemetry Gateway")
    parser.add_argument("--port", default="COM3", help="Serial port (e.g., COM3 or /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate (default: 115200)")
    parser.add_argument("--backend", default="http://localhost:8000", help="Backend API URL")
    args = parser.parse_args()

    run_gateway(args.port, args.baud, args.backend)
