/*
 * VisioBin ESP32 Firmware
 * =======================
 * Node Edge IoT untuk tempat sampah pintar VisioBin.
 * Mengelola sensor ToF (VL53L0X), Load Cell (HX711), dan Gas (MQ-137).
 * Berkomunikasi dengan Raspberry Pi melalui UART Serial.
 * 
 * Hardware Pins (Sesuaikan dengan wiring aktual):
 * - I2C SDA: D21 (Untuk 2x VL53L0X via multiplexer TCA9548A)
 * - I2C SCL: D22
 * - HX711 DT: D18
 * - HX711 SCK: D19
 * - MQ-137 A0: 34 (Analog)
 * - Servo Pin: D15
 * 
 * Library yang dibutuhkan:
 * - Adafruit_VL53L0X
 * - HX711 by Bogdan Necula
 * - ArduinoJson
 * - ESP32Servo
 */

#include <Wire.h>
#include <Adafruit_VL53L0X.h>
#include <HX711.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// --- Definisi Pin ---
#define TCA9548A_ADDR 0x70
#define LOADCELL_DOUT_PIN 18
#define LOADCELL_SCK_PIN  19
#define MQ137_PIN         34
#define SERVO_PIN         15

// --- Konfigurasi ---
const int TELEMETRY_INTERVAL_MS = 5000;
const int BIN_HEIGHT_CM = 50;

// Kalibrasi (Ubah setelah kalibrasi fisik!)
const float LOADCELL_CALIBRATION_FACTOR = 2280.f; 

// --- Objek Global ---
Adafruit_VL53L0X tofOrganic = Adafruit_VL53L0X();
Adafruit_VL53L0X tofInorganic = Adafruit_VL53L0X();
HX711 scale;
Servo sorterServo;

unsigned long lastTelemetryTime = 0;

// Fungsi untuk memilih channel multiplexer I2C
void tcaselect(uint8_t i) {
  if (i > 7) return;
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(1 << i);
  Wire.endTransmission();  
}

void setup() {
  Serial.begin(115200); // UART ke Raspberry Pi
  Wire.begin();

  // 1. Inisialisasi ToF Sensor (Organik di Ch 0, Anorganik di Ch 1)
  tcaselect(0);
  if (!tofOrganic.begin()) {
    sendError("Gagal inisialisasi VL53L0X (Organik)");
  }
  
  tcaselect(1);
  if (!tofInorganic.begin()) {
    sendError("Gagal inisialisasi VL53L0X (Anorganik)");
  }

  // 2. Inisialisasi Load Cell
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(LOADCELL_CALIBRATION_FACTOR);
  scale.tare(); // Asumsi tempat sampah kosong saat dinyalakan

  // 3. Inisialisasi Servo
  sorterServo.attach(SERVO_PIN);
  sorterServo.write(90); // Posisi netral di tengah
  
  sendHeartbeat("System Boot OK");
}

void loop() {
  // 1. Cek perintah masuk dari Raspberry Pi (UART)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.startsWith("CLASSIFY:")) {
      String direction = cmd.substring(9);
      handleServoAction(direction);
    }
  }

  // 2. Kirim telemetri periodik
  if (millis() - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    sendTelemetry();
  }
}

void handleServoAction(String direction) {
  if (direction == "ORGANIC") {
    sorterServo.write(45); // Miring ke kompartemen organik
  } else if (direction == "INORGANIC") {
    sorterServo.write(135); // Miring ke kompartemen anorganik
  } else {
    sendError("Unknown direction: " + direction);
    return;
  }
  
  delay(2000); // Tunggu sampah jatuh
  sorterServo.write(90); // Kembali netral
  
  // Konfirmasi ke Pi
  StaticJsonDocument<128> doc;
  doc["type"] = "servo_done";
  doc["direction"] = direction;
  serializeJson(doc, Serial);
  Serial.println();
}

void sendTelemetry() {
  StaticJsonDocument<256> doc;
  doc["type"] = "telemetry";
  
  // Baca ToF Organik
  tcaselect(0);
  VL53L0X_RangingMeasurementData_t measure1;
  tofOrganic.rangingTest(&measure1, false);
  float distOrg = measure1.RangeStatus != 4 ? (measure1.RangeMilliMeter / 10.0) : BIN_HEIGHT_CM;
  
  // Baca ToF Anorganik
  tcaselect(1);
  VL53L0X_RangingMeasurementData_t measure2;
  tofInorganic.rangingTest(&measure2, false);
  float distInorg = measure2.RangeStatus != 4 ? (measure2.RangeMilliMeter / 10.0) : BIN_HEIGHT_CM;

  // Batasi nilai
  if(distOrg > BIN_HEIGHT_CM) distOrg = BIN_HEIGHT_CM;
  if(distInorg > BIN_HEIGHT_CM) distInorg = BIN_HEIGHT_CM;

  // Baca Berat (Asumsi timbangan global)
  float weight = scale.get_units(5); // Ambil rata-rata 5 bacaan
  if(weight < 0) weight = 0;

  // Baca MQ-137 (Amonia)
  int mq137_raw = analogRead(MQ137_PIN);
  float voltage = mq137_raw * (3.3 / 4095.0);
  // Konversi kasar ke PPM (memerlukan kalibrasi Rs/R0 untuk akurasi)
  float ppm = voltage * 20.0; 

  // Susun JSON
  doc["dist_org"] = distOrg;
  doc["dist_inorg"] = distInorg;
  
  // Catatan: Jika ada 2 load cell, baca keduanya. Di sini contoh 1 loadcell
  // Untuk data terpisah, backend/simulator akan mengelola alokasinya.
  doc["weight_org"] = weight * 0.4;  // Mock
  doc["weight_inorg"] = weight * 0.6; // Mock
  
  doc["gas_ppm"] = ppm;

  serializeJson(doc, Serial);
  Serial.println(); // Newline penting untuk parser di Pi!
}

void sendHeartbeat(String msg) {
  StaticJsonDocument<128> doc;
  doc["type"] = "heartbeat";
  doc["uptime"] = millis() / 1000;
  doc["message"] = msg;
  serializeJson(doc, Serial);
  Serial.println();
}

void sendError(String msg) {
  StaticJsonDocument<128> doc;
  doc["type"] = "error";
  doc["message"] = msg;
  serializeJson(doc, Serial);
  Serial.println();
}
