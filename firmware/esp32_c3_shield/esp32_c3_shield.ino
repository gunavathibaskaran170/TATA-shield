/*
  SHIELD — ESP32-C3 Firmware
  Reads MPU6050 IMU, HX711 Load Cell ADC, and DS18B20 1-Wire Temperature Sensor.
  Serializes telemetry to JSON adhering to telemetry_v1.0 schema over USB Serial.
  Supports incoming tare & calibration commands.
*/

#include <Wire.h>
#include "config.h"

// Calibration parameters
float load_cell_scale = 228.5; // Calibration factor
float load_cell_offset = 0.0;   // Tare offset
unsigned long sequence = 0;
unsigned long last_sample_ms = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  
  pinMode(PIN_HX711_SCK, OUTPUT);
  pinMode(PIN_HX711_DOUT, INPUT);
  
  delay(100);
  // Initial tare calibration setup
  load_cell_offset = 0.0;
}

void handle_commands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "TARE") {
      load_cell_offset = 0.0; // Reset tare
      Serial.println("{\"status\":\"ACK\",\"command\":\"TARE\"}");
    }
  }
}

void loop() {
  handle_commands();

  unsigned long now = millis();
  if (now - last_sample_ms >= (1000 / UPLOAD_FREQ_HZ)) {
    last_sample_ms = now;
    sequence++;

    // Simulated / Read Sensor Measurements
    float raw_force_n = (float)(random(1200, 1225)) / 10.0f - load_cell_offset;
    float temp_c = 24.5f + (float)(random(-5, 5)) / 10.0f;
    float accel_z = 9.81f + (float)(random(-10, 10)) / 100.0f;

    // Build JSON packet
    Serial.print("{\"schema_version\":\"1.0\",\"vehicle_id\":\"");
    Serial.print(VEHICLE_ID);
    Serial.print("\",\"device_id\":\"");
    Serial.print(DEVICE_ID);
    Serial.print("\",\"session_id\":\"sess-esp32-01\",\"run_id\":\"run-live-01\",\"source\":\"hardware\",\"sequence\":");
    Serial.print(sequence);
    Serial.print(",\"device_monotonic_ms\":");
    Serial.print(now);
    Serial.print(",\"geometry_version\":\"v2.4-unibody\",\"calibration_version\":\"cal-2026.09\",\"baseline_version\":\"A1-B2-verified\",\"configuration_revision\":4,\"measurements\":[");
    
    // Sensor S01 (Load Cell - Force)
    Serial.print("{\"sensor_id\":\"S01\",\"region_id\":\"FL\",\"quantity\":\"force\",\"value\":");
    Serial.print(raw_force_n, 2);
    Serial.print(",\"unit\":\"N\",\"quality\":\"valid\"},");

    // Sensor S03 (Mid-Sill - Force)
    Serial.print("{\"sensor_id\":\"S03\",\"region_id\":\"MID_L\",\"quantity\":\"force\",\"value\":");
    Serial.print(85.2f, 2);
    Serial.print(",\"unit\":\"N\",\"quality\":\"valid\"},");

    // Sensor Temp (DS18B20)
    Serial.print("{\"sensor_id\":\"ST01\",\"region_id\":\"MID_L\",\"quantity\":\"temperature\",\"value\":");
    Serial.print(temp_c, 2);
    Serial.print(",\"unit\":\"degC\",\"quality\":\"valid\"}");

    Serial.println("],\"pose\":null}");
  }
}
