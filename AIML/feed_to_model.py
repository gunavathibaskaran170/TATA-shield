import os
import sys
import time
import joblib
import numpy as np
import serial

# ==========================================
# 1. PATH CONFIGURATION
# ==========================================
PORT = "COM5"
BAUD_RATE = 115200

MODEL_FILE = os.path.join("2_models", "chassis_model.pkl")
SCALER_FILE = os.path.join("2_models", "scaler.pkl")

# Multi-class output labels
HEALTH_LABELS = {
    0: "SAFE / NORMAL",
    1: "WARNING (High Stress / Shock Bump)",
    2: "CRITICAL (Fracture Risk / Structural Impact)",
}

# ==========================================
# 2. LOAD TRAINED MODEL & SCALER
# ==========================================
if not os.path.exists(MODEL_FILE):
    print(f"❌ Error: Model file kedaikkala -> {MODEL_FILE}")
    sys.exit(1)

model = joblib.load(MODEL_FILE)
scaler = joblib.load(SCALER_FILE) if os.path.exists(SCALER_FILE) else None

print(f"✅ Loaded Model: {MODEL_FILE}")
if scaler:
    print(f"✅ Loaded Scaler: {SCALER_FILE}")


# ==========================================
# 3. ML PREDICTION FUNCTION
# ==========================================
def predict_chassis_health(sensor_10_features: list):
    """Takes a list of 10 float values, scales them, and queries the ML model."""
    # Convert to 2D numpy array: shape (1, 10)
    raw_array = np.array(sensor_10_features, dtype=float).reshape(1, -1)

    # Scale the features if scaler was saved during training
    input_features = scaler.transform(raw_array) if scaler else raw_array

    # Model Inference
    prediction_class = model.predict(input_features)[0]

    # Get Confidence / Probabilities if supported
    confidence = None
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(input_features)[0]
        confidence = probabilities[prediction_class] * 100

    return prediction_class, confidence


# ==========================================
# 4. SERIAL STREAM INGESTION & MODEL FEED
# ==========================================
print(f"\n🔌 Opening {PORT} @ {BAUD_RATE} to feed ML model...")

try:
    ser = serial.Serial(PORT, BAUD_RATE, timeout=1.0)
    ser.setDTR(True)
    ser.setRTS(True)
    time.sleep(1.0)
    ser.reset_input_buffer()
    print("🚀 Serial connected! Streaming inputs into ML model...\n")

    while True:
        raw_bytes = ser.readline()
        if not raw_bytes:
            continue

        line_str = raw_bytes.decode("utf-8", errors="ignore").strip()
        if not line_str:
            continue

        parts = line_str.split(",")

        # Confirm exactly 10 features arrived
        if len(parts) == 10:
            try:
                feature_values = [float(val) for val in parts]

                # --- FEED TO MODEL ---
                pred_class, conf = predict_chassis_health(feature_values)
                status_label = HEALTH_LABELS.get(
                    pred_class, f"CLASS {pred_class}"
                )

                # Format dashboard CLI line
                weight, stress, g_force = (
                    feature_values[0],
                    feature_values[1],
                    feature_values[5],
                )
                conf_str = f"({conf:.1f}%)" if conf is not None else ""

                if pred_class == 2:
                    alert = "🚨 [CRITICAL]"
                elif pred_class == 1:
                    alert = "⚠️  [WARNING] "
                else:
                    alert = "✅ [NORMAL]  "

                print(
                    f"{alert} -> {status_label} {conf_str} | "
                    f"Load: {weight:5.2f}kg | Stress: {stress:5.3f}MPa | G-Force: {g_force:4.2f}G"
                )

            except ValueError:
                continue

except serial.SerialException as e:
    print(f"❌ Serial Port Error: {e}")
except KeyboardInterrupt:
    print("\n🛑 Stopped by user.")
finally:
    if "ser" in locals() and ser.is_open:
        ser.close()
        print("🔌 Serial port closed.")