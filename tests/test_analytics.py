"""
Automated Test Suite for Residual Analytics & Structural Health Decision Logic.
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from app.analytics import ResidualAnalyticsEngine

def test_residual_calculation_normal():
    engine = ResidualAnalyticsEngine()
    # Baseline expected for S01 is 120.0 N.
    # Measured value 121.0 N -> residual 1.0 N (within normal limit)
    res = engine.compute_residual("S01", 121.0, "force")
    assert res["state"] == "NORMAL"
    assert res["inspection_required"] is False
    assert res["residual"] == 1.0

def test_noise_floor_filtering():
    engine = ResidualAnalyticsEngine()
    # Measured value 120.2 N -> residual 0.2 N (below 0.5 N force noise floor)
    res = engine.compute_residual("S01", 120.2, "force")
    assert res["residual"] == 0.0

def test_persistent_anomaly_triggers_inspection():
    engine = ResidualAnalyticsEngine()
    # Baseline expected for S01 is 120.0 N.
    # Exceed limit (e.g. 145.0 N) repeatedly across window
    for _ in range(8):
        res = engine.compute_residual("S01", 145.0, "force")
    
    assert res["state"] == "INSPECTION_REQUIRED"
    assert res["inspection_required"] is True
    assert res["persistence_score"] >= 0.6
