"""
Automated Test Suite for Telemetry Contract Schema Validation.
"""

import json
import pytest
from jsonschema import validate, ValidationError

def load_schema():
    with open("schemas/telemetry_v1.0.json", "r") as f:
        return json.load(f)

def test_valid_telemetry_schema():
    schema = load_schema()
    valid_packet = {
        "schema_version": "1.0",
        "vehicle_id": "SHIELD-EV-0287",
        "device_id": "NODE-01",
        "session_id": "sess-01",
        "run_id": "run-01",
        "source": "hardware",
        "sequence": 1,
        "device_monotonic_ms": 1000,
        "received_at": "2026-09-27T00:00:00Z",
        "geometry_version": "v2.4",
        "calibration_version": "cal-1",
        "baseline_version": "A1-B1",
        "configuration_revision": 1,
        "measurements": [
            {
                "sensor_id": "S01",
                "region_id": "FL",
                "quantity": "force",
                "value": 120.5,
                "unit": "N",
                "quality": "valid"
            }
        ]
    }
    # Should validate without raising ValidationError
    validate(instance=valid_packet, schema=schema)

def test_invalid_telemetry_schema_rejected():
    schema = load_schema()
    invalid_packet = {
        "schema_version": "1.0",
        "vehicle_id": "SHIELD-EV-0287",
        # Missing required device_id and session_id
        "source": "invalid_source_type",
        "sequence": -1
    }
    with pytest.raises(ValidationError):
        validate(instance=invalid_packet, schema=schema)
