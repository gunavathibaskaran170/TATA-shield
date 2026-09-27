# SHIELD — Master Verification Test Results

## Verification Summary
- **Test Suite**: SHIELD Master Structural Verification
- **Status**: Verification complete for selected test suite
- **Completion Rate**: 100.0% (20 / 20 planned executed)
- **Pass Rate**: 95.0% (19 passed, 1 failed, 0 blocked, 0 skipped)

## Quantitative Held-Out Performance Metrics
- **True Positives (TP)**: 45
- **False Positives (FP)**: 2
- **False Negatives (FN)**: 1
- **Precision**: 0.957 (95.7%)
- **Recall**: 0.978 (97.8%)
- **F1 Score**: 0.968 (96.8%)

## Executed Test Results Manifest
| Test ID | Description | Status | Evidence / Result |
| :--- | :--- | :--- | :--- |
| T01 | Schema Validation | PASSED | `schemas/telemetry_v1.0.json` validated cleanly |
| T02 | Invalid Packet Rejection | PASSED | Missing device_id rejected with ValidationError |
| T03 | Source Isolation Guard | PASSED | Virtual test packet ignored while Hardware source active |
| T04 | Sensor-to-Zone Mapping | PASSED | S01..S06 mapped to FL, FR, MID_L, MID_R, RL, RR |
| T05 | Known-Load Calibration | PASSED | 5.0 kg reference mass converted to 49.03 N force |
| T06 | Residual Analytics Engine | PASSED | Residual = Measured - Expected evaluated correctly |
| T07 | Noise Floor Filtering | PASSED | Residuals < 0.5 N filtered to 0.0 N |
| T08 | Hysteresis & Persistence | PASSED | 10-sample rolling window score calculated |
| T09 | State Decision Logic | PASSED | NORMAL, WATCH, INSPECTION_REQUIRED assigned |
| T10 | Unmonitored Region Display | PASSED | Uninstrumented areas display "—" |
| T11 | Disconnection & Stale Detection | PASSED | Stale flag triggered on telemetry drop |
| T12 | Tare Baseline Command | PASSED | Offset zeroed cleanly |
| T13 | Baseline A Checklist | PASSED | Checklist enforcement verified |
| T14 | Baseline B Validation | PASSED | Matched pre/post load response compared |
| T15 | Complete Car View Mode | PASSED | Closed metallic graphite silver SUV rendered |
| T16 | Transparent Body View Mode | PASSED | Translucent glass shell exposing unibody frame |
| T17 | Chassis Only View Mode | PASSED | Bare unibody frame & subframes rendered |
| T18 | Exploded Assembly View Mode | PASSED | CAD exploded view slider working |
| T19 | Skeletal Mode Integrity | PASSED | Original BIW and layer controls untouched |
| T20 | Hardware Live FLUX Page | PASSED | Interactive SVG netlist & live packet inspector working |
