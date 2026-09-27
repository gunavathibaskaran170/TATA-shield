#ifndef SHIELD_CONFIG_H
#define SHIELD_CONFIG_H

// SHIELD ESP32-C3 Hardware Pin Configuration
// Board: ESP32-C3 SuperMini / ESP32-C3 Dev Module

#define DEVICE_ID "NODE-ESP32C3-01"
#define VEHICLE_ID "SHIELD-EV-0287"
#define BAUD_RATE 115200

// I2C Pins for MPU6050 Accelerometer / Gyroscope
#define PIN_I2C_SDA 8
#define PIN_I2C_SCL 9

// HX711 Load Cell ADC Digital Pins
#define PIN_HX711_DOUT 4
#define PIN_HX711_SCK 5

// DS18B20 1-Wire Temperature Sensor Digital Pin
#define PIN_DS18B20_DATA 6

// Telemetry Sampling Rates (Hz)
#define ACQUISITION_FREQ_HZ 50
#define UPLOAD_FREQ_HZ 10

#endif // SHIELD_CONFIG_H
