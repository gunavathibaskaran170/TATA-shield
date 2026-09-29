"""
SHIELD — Automated Structural Digital Twin Verification Script
Executes empirical runtime verification for all system test scenarios.
"""

import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000"

def test_backend_health():
    print("[TEST 1/3] Checking Backend Health Endpoint...")
    req = urllib.request.Request(f"{BASE_URL}/health")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        assert data["status"] == "online", "Backend health status must be online"
        print("  [PASS] Backend is ONLINE:", data["service"])

def test_ml_predict_api():
    print("[TEST 2/3] Testing ML Model Inference Adapter (POST /api/ml/predict)...")
    payload = json.dumps({
        "force_kn": 28.5,
        "stress_mpa": 320.0,
        "hardpoint_id": "front_rail_lh",
        "temp_c": 35.0
    }).encode("utf-8")

    req = urllib.request.Request(f"{BASE_URL}/api/ml/predict", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        assert "anomalyScore" in data, "ML prediction must return anomalyScore"
        assert "confidence" in data, "ML prediction must return confidence"
        assert data["severity"] in ["NORMAL", "WARNING", "CRITICAL"], "Severity must be valid enum"
        print("  [PASS] ML Prediction Received:")
        print(f"    AnomalyScore={data['anomalyScore']}, Severity={data['severity']}, Confidence={data['confidence']}")

def test_ai_analyze_api():
    print("[TEST 3/3] Testing Gemini AI Structural Copilot Adapter (POST /api/ai/analyze)...")
    payload = json.dumps({
        "hardpoint": "HP-F01-L",
        "force_kn": 48.0,
        "stress_mpa": 520.0,
        "strain_ue": 2480.0,
        "utilization_pct": 104.0,
        "ml_prediction": {"anomalyScore": 0.88, "severity": "CRITICAL"}
    }).encode("utf-8")

    req = urllib.request.Request(f"{BASE_URL}/api/ai/analyze", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        assert "summary" in data, "AI Analysis must return summary"
        assert "possible_causes" in data, "AI Analysis must return possible_causes array"
        assert "recommended_actions" in data, "AI Analysis must return recommended_actions array"
        print("  [PASS] Gemini AI Structural Reasoning Received:")
        print("    Summary:", data["summary"][:90] + "...")

def main():
    print("=========================================================")
    print("SHIELD DIGITAL TWIN -- EMPIRICAL RUNTIME SYSTEM VERIFICATION")
    print("=========================================================")
    try:
        test_backend_health()
        test_ml_predict_api()
        test_ai_analyze_api()
        print("=========================================================")
        print("ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100% VERIFIED)")
        print("=========================================================")
    except Exception as e:
        print("[FAIL] VERIFICATION ERROR:", e)
        sys.exit(1)

if __name__ == "__main__":
    main()
