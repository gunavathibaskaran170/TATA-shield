#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <HX711.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>

// Active-Low: LOW turns LED ON, HIGH turns LED OFF
#define LED_ON  LOW
#define LED_OFF HIGH

// ================= PIN CONFIGURATION (ESP32-C3) =================
const int PIN_HX711_DOUT    = 6;   // Load Cell DT
const int PIN_HX711_SCK     = 7;   // Load Cell SCK
const int PIN_DS18B20_DATA  = 5;   // Temp Sensor Data (4.7k pullup)
const int PIN_I2C_SDA       = 8;   // MPU6050 SDA
const int PIN_I2C_SCL       = 9;   // MPU6050 SCL

const int PIN_LED_GREEN     = 0;   // Safe Indicator
const int PIN_LED_YELLOW    = 1;   // Warning Indicator
const int PIN_LED_RED       = 10;  // Critical Hazard Indicator
const int PIN_BUZZER        = 3;   // Active Buzzer (+)
const int PIN_MOTOR_IN3     = 4;   // L298N IN3 (Coin Vibration Motor)

// ================= CHASSIS SPECS & THRESHOLDS =================
const float CHASSIS_AREA_MM2       = 60.0;
const float MATERIAL_YIELD_MPA     = 0.45;   // Permanent deformation limit
const float TORSION_WARP_LIMIT_DEG = 12.0;   // Realistic breadboard angle limit
float calibration_factor           = 420.0;

const float STRESS_WARN_LIMIT_MPA  = 0.20;
const float G_IMPACT_WARN_LIMIT    = 1.60;
const float G_IMPACT_CRIT_LIMIT    = 2.50;
const float TEMP_WARN_C            = 38.0;

// Dynamic Baselines
float baseline_pitch = 0.0;
float baseline_roll  = 0.0;
float peak_stress_recorded = 0.0;

HX711 scale;
Adafruit_MPU6050 mpu;
OneWire oneWire(PIN_DS18B20_DATA);
DallasTemperature tempSensors(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_MOTOR_IN3, OUTPUT);

  // Turn all OFF
  digitalWrite(PIN_LED_GREEN, LED_OFF);
  digitalWrite(PIN_LED_YELLOW, LED_OFF);
  digitalWrite(PIN_LED_RED, LED_OFF);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_MOTOR_IN3, LOW);

  // 1. Initialize MPU6050
  pinMode(PIN_I2C_SDA, INPUT_PULLUP);
  pinMode(PIN_I2C_SCL, INPUT_PULLUP);
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setTimeOut(30);

  if (!mpu.begin()) {
    Serial.println("[ERROR] MPU6050 not detected!");
    while(1);
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("[OK] MPU6050 Initialized.");
  }

  // 2. Initialize Load Cell with Startup Flush
  scale.begin(PIN_HX711_DOUT, PIN_HX711_SCK);
  scale.set_scale(calibration_factor);
  delay(500);
  // Flush 5 dummy readings to clear startup ADC noise
  for (int i = 0; i < 5; i++) {
    if (scale.is_ready()) scale.get_units(1);
    delay(50);
  }
  scale.tare();
  Serial.println("[OK] Load Cell Tare Complete.");

  // 3. Initialize DS18B20
  tempSensors.begin();
  tempSensors.setWaitForConversion(false);

  // 4. Stable Multi-Sample Baseline Calibration (Keep board stationary)
  Serial.println("\n[CALIBRATING] Calibrating resting angles... Keep board still!");
  float sum_pitch = 0.0, sum_roll = 0.0;
  for (int i = 0; i < 20; i++) {
    sensors_event_t a_cal, g_cal, t_cal;
    mpu.getEvent(&a_cal, &g_cal, &t_cal);
    sum_pitch += atan2(-a_cal.acceleration.x, sqrt(a_cal.acceleration.y * a_cal.acceleration.y + a_cal.acceleration.z * a_cal.acceleration.z)) * (180.0 / PI);
    sum_roll  += atan2(a_cal.acceleration.y, a_cal.acceleration.z) * (180.0 / PI);
    delay(50);
  }
  baseline_pitch = sum_pitch / 20.0;
  baseline_roll  = sum_roll / 20.0;

  Serial.print("[BASELINE LOCKED] Pitch: "); Serial.print(baseline_pitch, 1);
  Serial.print(" deg | Roll: "); Serial.print(baseline_roll, 1); Serial.println(" deg\n");

  // Power-on Indicator Test
  digitalWrite(PIN_LED_GREEN, LED_ON);  delay(150); digitalWrite(PIN_LED_GREEN, LED_OFF);
  digitalWrite(PIN_LED_YELLOW, LED_ON); delay(150); digitalWrite(PIN_LED_YELLOW, LED_OFF);
  digitalWrite(PIN_LED_RED, LED_ON);    delay(150); digitalWrite(PIN_LED_RED, LED_OFF);
}

void loop() {
  // 1. Filtered Load Cell Reading
  float weight_kg = 0.0;
  if (scale.is_ready()) {
    float raw_w = scale.get_units(1);
    // Glitch rejection filter: Prototype won't exceed 15kg realistically
    if (raw_w > 0.0 && raw_w < 15.0) {
      weight_kg = raw_w;
    }
  }

  // 2. MPU6050 Dynamics
  sensors_event_t a, g, temp_mpu;
  mpu.getEvent(&a, &g, &temp_mpu);

  float ax = a.acceleration.x;
  float ay = a.acceleration.y;
  float az = a.acceleration.z;
  float net_accel = sqrt(ax * ax + ay * ay + az * az);
  float g_force   = net_accel / 9.81;

  // Dynamic Impact Stress
  float vertical_shock_accel = fabs(az - 9.81);
  float dynamic_stress_mpa   = (weight_kg * (9.81 + vertical_shock_accel)) / CHASSIS_AREA_MM2;

  // Peak Stress Tracker (Sanity check: only record realistic values < 10 MPa)
  if (dynamic_stress_mpa < 10.0 && dynamic_stress_mpa > peak_stress_recorded) {
    peak_stress_recorded = dynamic_stress_mpa;
  }

  // 3. Geometry Deviation (Warp vs Calibrated Baseline)
  float current_pitch = atan2(-ax, sqrt(ay * ay + az * az)) * (180.0 / PI);
  float current_roll  = atan2(ay, az) * (180.0 / PI);

  float delta_pitch = fabs(current_pitch - baseline_pitch);
  float delta_roll  = fabs(current_roll - baseline_roll);

  // 4. Temperature Reading
  tempSensors.requestTemperatures();
  float chassis_temp = tempSensors.getTempCByIndex(0);

  // 5. Fault & Deformation Detection
  bool is_plastic_deformed = false;
  String deformation_status = "Nominal (Safe)";

  if (peak_stress_recorded >= MATERIAL_YIELD_MPA) {
    is_plastic_deformed = true;
    deformation_status = "PERMANENT YIELD FAILURE!";
  } else if (delta_roll > TORSION_WARP_LIMIT_DEG) {
    is_plastic_deformed = true;
    deformation_status = "FRAME TORSION TWIST!";
  } else if (delta_pitch > 15.0) {
    is_plastic_deformed = true;
    deformation_status = "STRUCTURAL CHASSIS SAG!";
  } else if (dynamic_stress_mpa > STRESS_WARN_LIMIT_MPA) {
    deformation_status = "Elastic Flex (Temporary)";
  }

  bool is_critical = is_plastic_deformed || (g_force >= G_IMPACT_CRIT_LIMIT) ||
                     (chassis_temp != DEVICE_DISCONNECTED_C && chassis_temp >= 45.0);

  bool is_warning  = (!is_critical) && 
                     ((dynamic_stress_mpa >= STRESS_WARN_LIMIT_MPA) || 
                      (g_force >= G_IMPACT_WARN_LIMIT) || 
                      (chassis_temp != DEVICE_DISCONNECTED_C && chassis_temp >= TEMP_WARN_C));

  // 6. Actuation (Active-LOW: LOW=ON, HIGH=OFF)
  if (is_critical) {
    digitalWrite(PIN_LED_GREEN, LED_OFF);
    digitalWrite(PIN_LED_YELLOW, LED_OFF);
    digitalWrite(PIN_LED_RED, LED_ON);

    digitalWrite(PIN_BUZZER, HIGH);
    digitalWrite(PIN_MOTOR_IN3, HIGH);
    delay(150);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_MOTOR_IN3, LOW);
  } 
  else if (is_warning) {
    digitalWrite(PIN_LED_GREEN, LED_OFF);
    digitalWrite(PIN_LED_YELLOW, LED_ON);
    digitalWrite(PIN_LED_RED, LED_OFF);

    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_MOTOR_IN3, LOW);
  } 
  else {
    // Normal Safe State: ONLY Green ON
    digitalWrite(PIN_LED_GREEN, LED_ON);
    digitalWrite(PIN_LED_YELLOW, LED_OFF);
    digitalWrite(PIN_LED_RED, LED_OFF);

    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_MOTOR_IN3, LOW);
  }

  // 7. Telemetry Output
  Serial.print("[LOAD] ");
  Serial.print(weight_kg, 2);
  Serial.print(" kg | [DYN STRESS] ");
  Serial.print(dynamic_stress_mpa, 3);
  Serial.print(" MPa | [PEAK] ");
  Serial.print(peak_stress_recorded, 3);
  Serial.print(" MPa | [G] ");
  Serial.print(g_force, 2);
  Serial.print(" | [WARP] R: ");
  Serial.print(delta_roll, 1);
  Serial.print(" deg, P: ");
  Serial.print(delta_pitch, 1);
  Serial.print(" deg --> ");
  Serial.println(deformation_status);

  delay(300);
}