"""
Automated Test Suite for Telemetry Source Isolation.
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from fastapi.testclient import TestClient
from app.main import app, canonical_vehicle_state

client = TestClient(app)

def test_source_isolation_rejects_mismatched_virtual_input():
    canonical_vehicle_state["active_source"] = "hardware"

    mismatched_packet = {
        "schema_version": "1.0",
        "vehicle_id": "SHIELD-EV-0287",
        "device_id": "VIRTUAL-RIG",
        "session_id": "sess-virt-01",
        "run_id": "run-01",
        "source": "virtual_test", # Source mismatch while active_source is 'hardware'
        "sequence": 10,
        "device_monotonic_ms": 2000,
        "received_at": "2026-09-27T00:00:00Z",
        "geometry_version": "v2.4",
        "calibration_version": "cal-1",
        "baseline_version": "A1-B1",
        "configuration_revision": 1,
        "measurements": [
            {"sensor_id": "S01", "region_id": "FL", "quantity": "force", "value": 150.0, "unit": "N", "quality": "valid"}
        ]
    }

    response = client.post("/api/v1/telemetry/ingest", json=mismatched_packet)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ignored"
    assert "isolation" in data["reason"].lower()
