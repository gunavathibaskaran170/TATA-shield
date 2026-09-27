# SHIELD — Calibration & Measurement Procedure

## 1. Load Cell Force Calibration
1. **Zero / Tare Calibration**:
   - Ensure the test rig is unloaded.
   - Send the serial command `TARE` or click **Tare Baseline** in the Hardware Live dashboard.
   - The offset coefficient is stored in non-volatile memory (`load_cell_offset`).

2. **Reference Weight Calibration**:
   - Apply a certified reference mass $m = 5.00 \text{ kg}$ to the load cell fixture.
   - Calculate theoretical reference force:
     $$F_{ref} = m \cdot g = 5.00 \text{ kg} \cdot 9.80665 \text{ m/s}^2 = 49.033 \text{ N}$$
   - Read the raw ADC counts $C_{raw}$.
   - Compute scale factor:
     $$K_{scale} = \frac{C_{raw} - C_{zero}}{F_{ref}}$$

## 2. MPU6050 Accelerometer / Gyroscope Calibration
- Place the test rig on a level surface.
- Capture stationary offset vectors for $a_x, a_y, a_z$ and $\omega_x, \omega_y, \omega_z$.
- Subtract static offsets from real-time stream.

## 3. Baseline B (Controlled Validation) Fingerprint Commissioning
- Execute 5 repeatable reference load cycles ($0 \rightarrow 500 \text{ N} \rightarrow 0 \text{ N}$).
- Record baseline mean $\mu_{base}$ and standard deviation $\sigma_{base}$ for each installed sensor ($S01 \dots S06$).
- Store Baseline B fingerprint in `backend/app/analytics.py`.
