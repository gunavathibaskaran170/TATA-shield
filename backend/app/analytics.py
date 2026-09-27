"""
SHIELD Backend Analytics Engine.
Calculates residual deviation: Residual = Measured - Expected (Baseline B).
Enforces persistence windowing, noise floor filtering, and decision states.
Decision states: NORMAL | WATCH | INSPECTION_REQUIRED.
Acquisition states: UNCOMMISSIONED | STALE | INVALID | OFFLINE.
"""

from typing import Dict, Any, Optional, List

# Configurable noise floors per signal type
NOISE_FLOORS = {
    "strain": 5.0,        # microstrain
    "force": 0.5,         # Newtons
    "acceleration": 0.05, # m/s^2
    "temperature": 0.2,   # deg C
    "displacement": 0.1   # mm
}

# Threshold multipliers relative to baseline standard deviation
THRESHOLD_WATCH = 2.5
THRESHOLD_INSPECTION = 4.0

class ResidualAnalyticsEngine:
    def __init__(self):
        self.baseline_b: Dict[str, float] = {
            "S01": 120.0,
            "S02": 122.0,
            "S03": 85.0,
            "S04": 84.0,
            "S05": 140.0,
            "S06": 138.0
        }
        self.baseline_std: Dict[str, float] = {
            "S01": 4.0,
            "S02": 4.2,
            "S03": 3.0,
            "S04": 3.1,
            "S05": 5.0,
            "S06": 4.8
        }
        # Persistence window history: sensor_id -> list of recent residuals
        self.history: Dict[str, List[float]] = {}
        self.window_size = 10

    def compute_residual(self, sensor_id: str, measured_value: Optional[float], quantity: str = "force") -> Dict[str, Any]:
        if measured_value is None:
            return {
                "sensor_id": sensor_id,
                "measured": None,
                "expected": self.baseline_b.get(sensor_id),
                "residual": None,
                "residual_percent": None,
                "persistence_score": 0.0,
                "anomaly_score": 0.0,
                "state": "UNCOMMISSIONED",
                "quality": "stale",
                "inspection_required": False,
                "rationale": "Measurement unavailable."
            }

        expected = self.baseline_b.get(sensor_id, 100.0)
        raw_residual = measured_value - expected
        noise_floor = NOISE_FLOORS.get(quantity, 0.5)

        # Apply noise floor filtering
        filtered_residual = 0.0 if abs(raw_residual) < noise_floor else raw_residual

        # Maintain window history
        if sensor_id not in self.history:
            self.history[sensor_id] = []
        self.history[sensor_id].append(filtered_residual)
        if len(self.history[sensor_id]) > self.window_size:
            self.history[sensor_id].pop(0)

        # Calculate persistence score (fraction of window exceeding watch threshold)
        std = self.baseline_std.get(sensor_id, 3.0)
        watch_limit = std * THRESHOLD_WATCH
        inspection_limit = std * THRESHOLD_INSPECTION

        recent = self.history[sensor_id]
        exceeded_count = sum(1 for r in recent if abs(r) >= watch_limit)
        persistence_score = round(exceeded_count / len(recent), 2)

        avg_residual = sum(recent) / len(recent)
        abs_avg = abs(avg_residual)

        # Decision State Logic
        if abs_avg >= inspection_limit and persistence_score >= 0.6:
            state = "INSPECTION_REQUIRED"
            anomaly_score = min(1.0, round(abs_avg / (inspection_limit * 1.5), 2))
            rationale = f"Persistent structural deviation of {abs_avg:.2f} units exceeds 4σ limit."
        elif abs_avg >= watch_limit or persistence_score >= 0.4:
            state = "WATCH"
            anomaly_score = min(0.9, round(abs_avg / inspection_limit, 2))
            rationale = f"Elevated residual of {abs_avg:.2f} units detected under load."
        else:
            state = "NORMAL"
            anomaly_score = round(abs_avg / (watch_limit * 2), 2)
            rationale = "Structural response consistent with Baseline B reference limits."

        res_pct = round((raw_residual / expected) * 100, 2) if expected != 0 else 0.0

        return {
            "sensor_id": sensor_id,
            "measured": round(measured_value, 3),
            "expected": round(expected, 3),
            "residual": round(filtered_residual, 3),
            "residual_percent": res_pct,
            "persistence_score": persistence_score,
            "anomaly_score": anomaly_score,
            "state": state,
            "quality": "valid",
            "inspection_required": state == "INSPECTION_REQUIRED",
            "rationale": rationale
        }
