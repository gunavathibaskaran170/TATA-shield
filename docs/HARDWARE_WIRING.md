# SHIELD — Hardware Wiring & Netlist Deliverable

## Hardware Bill of Materials (BOM)
| Component | Qty | Part Number / Description | Datasheet / Vendor |
| :--- | :--- | :--- | :--- |
| Microcontroller | 1 | ESP32-C3 SuperMini / DevModule | [Espressif Datasheet](https://documentation.espressif.com/esp32-c3_datasheet_en.html) |
| IMU Sensor | 1 | MPU6050 6-DOF I2C Module | InvenSense MPU-6050 |
| Load Cell ADC | 1 | HX711 24-Bit ADC Module | Avia Semiconductor HX711 |
| Load Cell | 1 | 50kg S-Type / Bar Strain Load Cell | Standard 4-Wire Wheatstone Bridge |
| Temp Sensor | 1 | DS18B20 1-Wire Digital Probe | Maxim Integrated DS18B20 |
| Pull-up Resistor| 1 | 4.7kΩ 1/4W Resistor | Standard |

## Verified Netlist & Pin Map

### ESP32-C3 Pin Assignments
- **MPU6050 I2C Interface**:
  - `VCC` -> `3.3V` (ESP32-C3)
  - `GND` -> `GND` (ESP32-C3)
  - `SDA` -> `GPIO 8`
  - `SCL` -> `GPIO 9`

- **HX711 Load Cell ADC Interface**:
  - `VCC` -> `5V` / `3.3V`
  - `GND` -> `GND`
  - `DOUT` -> `GPIO 4`
  - `SCK` -> `GPIO 5`
  - `E+` -> Load Cell Red wire
  - `E-` -> Load Cell Black wire
  - `A+` -> Load Cell Green wire
  - `A-` -> Load Cell White wire

- **DS18B20 Temperature Sensor**:
  - `VCC` -> `3.3V`
  - `GND` -> `GND`
  - `DATA` -> `GPIO 6` (with 4.7kΩ pull-up resistor connected to 3.3V)

## One-Page Hardware Live FLUX Concept Prompt
Verbatim FLUX Prompt for Technical Canvas:
> "Premium automotive engineering interface concept for SHIELD, white and deep navy background, central ESP32-C3 development board, distinct MPU6050 module, HX711 with load cell, DS18B20 probe, optional strain bridge interface, USB gateway laptop and cloud service, precise spacious composition, cyan accent, realistic module materials, no fictitious measurements, no tiny baked-in text, no decorative wires claiming real pin accuracy, reserved space for live vector labels and interactive routing."
