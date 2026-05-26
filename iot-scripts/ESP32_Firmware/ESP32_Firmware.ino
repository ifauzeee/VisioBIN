/*
 * VisioBin ESP32 Firmware v2.0
 * ============================
 * Node Edge IoT untuk tempat sampah pintar VisioBin.
 * Mengelola sensor ToF (VL53L0X), Load Cell (HX711), dan Gas (MQ-137).
 * Berkomunikasi dengan Raspberry Pi melalui UART Serial.
 * 
 * v2.0 Changes:
 * - Hardware Watchdog Timer (auto-reset jika hang >30 detik)
 * - Sensor Fallback (lanjut kirim data meskipun satu sensor gagal)
 * - LED Status Indicator (GPIO 2 built-in LED)
 * - EEPROM untuk menyimpan calibration factor
 * - Improved error handling dan graceful degradation
 * 
 * Hardware Pins (Sesuaikan dengan wiring aktual):
 * - I2C SDA: D21 (Untuk 2x VL53L0X via multiplexer TCA9548A)
 * - I2C SCL: D22
 * - HX711 DT: D18
 * - HX711 SCK: D19
 * - MQ-137 A0: 34 (Analog)
 * - Servo Pin: D15
 * - LED Status: D2 (Built-in LED)
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
#include <EEPROM.h>
#include <esp_task_wdt.h>

// --- Definisi Pin ---
#define TCA9548A_ADDR     0x70
#define LOADCELL_DOUT_PIN 18
#define LOADCELL_SCK_PIN  19
#define MQ137_PIN         34
#define SERVO_PIN         15
#define LED_PIN           2    // Built-in LED

// --- Konfigurasi ---
const int TELEMETRY_INTERVAL_MS = 5000;
const int BIN_HEIGHT_CM = 50;
const int WDT_TIMEOUT_SEC = 30;     // Watchdog timeout
const int EEPROM_SIZE = 64;
const int EEPROM_CALIB_ADDR = 0;    // Alamat calibration factor di EEPROM
const float EEPROM_MAGIC = 42.42;   // Magic number untuk validasi EEPROM

// Kalibrasi (Default, bisa di-override dari EEPROM)
float loadcellCalibrationFactor = 2280.0f;

// --- Objek Global ---
Adafruit_VL53L0X tofOrganic = Adafruit_VL53L0X();
Adafruit_VL53L0X tofInorganic = Adafruit_VL53L0X();
HX711 scale;
Servo sorterServo;

// --- Status Flags ---
bool tofOrganicOK   = false;
bool tofInorganicOK = false;
bool loadcellOK     = false;
bool servoOK        = false;

unsigned long lastTelemetryTime = 0;
unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_INTERVAL_MS = 60000; // 1 menit

// LED blink pattern untuk status
enum StatusLED {
  LED_OK,          // Solid ON
  LED_ERROR,       // Fast blink
  LED_CALIBRATING  // Slow blink
};
StatusLED currentStatus = LED_OK;
unsigned long lastLedToggle = 0;

// Fungsi untuk memilih channel multiplexer I2C
void tcaselect(uint8_t i) {
  if (i > 7) return;
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(1 << i);
  Wire.endTransmission();  
}

// ── EEPROM Helpers ─────────────────────────────────────────────

void loadCalibrationFromEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
  float magic;
  EEPROM.get(EEPROM_CALIB_ADDR, magic);
  if (abs(magic - EEPROM_MAGIC) < 0.01) {
    EEPROM.get(EEPROM_CALIB_ADDR + sizeof(float), loadcellCalibrationFactor);
    // Sanity check
    if (loadcellCalibrationFactor > 100 && loadcellCalibrationFactor < 50000) {
      // Valid calibration
    } else {
      loadcellCalibrationFactor = 2280.0f; // Reset to default
    }
  }
}

void saveCalibrationToEEPROM(float factor) {
  EEPROM.begin(EEPROM_SIZE);
  float magic = EEPROM_MAGIC;
  EEPROM.put(EEPROM_CALIB_ADDR, magic);
  EEPROM.put(EEPROM_CALIB_ADDR + sizeof(float), factor);
  EEPROM.commit();
}

// ── LED Status ─────────────────────────────────────────────────

void updateStatusLED() {
  unsigned long now = millis();
  switch (currentStatus) {
    case LED_OK:
      digitalWrite(LED_PIN, HIGH);
      break;
    case LED_ERROR:
      if (now - lastLedToggle > 200) { // Fast blink
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        lastLedToggle = now;
      }
      break;
    case LED_CALIBRATING:
      if (now - lastLedToggle > 1000) { // Slow blink
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        lastLedToggle = now;
      }
      break;
  }
}

// ── Setup ──────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200); // UART ke Raspberry Pi
  Wire.begin();
  pinMode(LED_PIN, OUTPUT);

  // 1. Load calibration dari EEPROM
  loadCalibrationFromEEPROM();

  // 2. Inisialisasi Watchdog Timer
  esp_task_wdt_init(WDT_TIMEOUT_SEC, true); // true = restart on timeout
  esp_task_wdt_add(NULL);                    // Watch main task

  // 3. Inisialisasi ToF Sensor (Organik di Ch 0, Anorganik di Ch 1)
  tcaselect(0);
  if (tofOrganic.begin()) {
    tofOrganicOK = true;
  } else {
    sendError("Gagal inisialisasi VL53L0X (Organik)");
  }
  
  tcaselect(1);
  if (tofInorganic.begin()) {
    tofInorganicOK = true;
  } else {
    sendError("Gagal inisialisasi VL53L0X (Anorganik)");
  }

  // 4. Inisialisasi Load Cell
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  if (scale.wait_ready_timeout(2000)) {
    scale.set_scale(loadcellCalibrationFactor);
    scale.tare(); // Asumsi tempat sampah kosong saat dinyalakan
    loadcellOK = true;
  } else {
    sendError("Gagal inisialisasi HX711 Load Cell");
  }

  // 5. Inisialisasi Servo
  if (sorterServo.attach(SERVO_PIN)) {
    sorterServo.write(90); // Posisi netral di tengah
    servoOK = true;
  } else {
    sendError("Gagal inisialisasi Servo");
  }
  
  // Tentukan status LED
  if (tofOrganicOK && tofInorganicOK && loadcellOK && servoOK) {
    currentStatus = LED_OK;
  } else {
    currentStatus = LED_ERROR;
  }

  sendHeartbeat("System Boot OK");
}

// ── Main Loop ──────────────────────────────────────────────────

void loop() {
  // Feed watchdog - jika loop hang >30 detik, ESP32 auto-restart
  esp_task_wdt_reset();

  // Update LED status
  updateStatusLED();

  // 1. Cek perintah masuk dari Raspberry Pi (UART)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.startsWith("CLASSIFY:")) {
      String direction = cmd.substring(9);
      handleServoAction(direction);
    } else if (cmd.startsWith("CALIBRATE:")) {
      // Perintah kalibrasi load cell dari RPi
      float newFactor = cmd.substring(10).toFloat();
      if (newFactor > 100 && newFactor < 50000) {
        loadcellCalibrationFactor = newFactor;
        scale.set_scale(newFactor);
        saveCalibrationToEEPROM(newFactor);
        sendHeartbeat("Calibration updated: " + String(newFactor));
      }
    }
  }

  // 2. Kirim telemetri periodik
  if (millis() - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    sendTelemetry();
  }

  // 3. Kirim heartbeat periodik (1 menit)
  if (millis() - lastHeartbeatTime > HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = millis();
    sendHeartbeat("Running");
  }
}

// ── Servo Handler ──────────────────────────────────────────────

void handleServoAction(String direction) {
  if (!servoOK) {
    sendError("Servo tidak tersedia");
    return;
  }

  if (direction == "ORGANIC" || direction == "ORGANIK") {
    sorterServo.write(45); // Miring ke kompartemen organik
  } else if (direction == "INORGANIC" || direction == "ANORGANIK") {
    sorterServo.write(135); // Miring ke kompartemen anorganik
  } else {
    sendError("Unknown direction: " + direction);
    return;
  }
  
  // Feed watchdog selama delay
  esp_task_wdt_reset();
  delay(2000); // Tunggu sampah jatuh
  esp_task_wdt_reset();
  sorterServo.write(90); // Kembali netral
  
  // Konfirmasi ke Pi
  StaticJsonDocument<128> doc;
  doc["type"] = "servo_done";
  doc["direction"] = direction;
  serializeJson(doc, Serial);
  Serial.println();
}

// ── Telemetry ──────────────────────────────────────────────────

void sendTelemetry() {
  StaticJsonDocument<256> doc;
  doc["type"] = "telemetry";
  
  float distOrg = BIN_HEIGHT_CM;
  float distInorg = BIN_HEIGHT_CM;
  float weight = 0;
  float ppm = 0;

  // Baca ToF Organik (dengan fallback)
  if (tofOrganicOK) {
    tcaselect(0);
    VL53L0X_RangingMeasurementData_t measure1;
    tofOrganic.rangingTest(&measure1, false);
    if (measure1.RangeStatus != 4) {
      distOrg = measure1.RangeMilliMeter / 10.0;
    }
  }
  
  // Baca ToF Anorganik (dengan fallback)
  if (tofInorganicOK) {
    tcaselect(1);
    VL53L0X_RangingMeasurementData_t measure2;
    tofInorganic.rangingTest(&measure2, false);
    if (measure2.RangeStatus != 4) {
      distInorg = measure2.RangeMilliMeter / 10.0;
    }
  }

  // Batasi nilai
  if(distOrg > BIN_HEIGHT_CM) distOrg = BIN_HEIGHT_CM;
  if(distOrg < 0) distOrg = 0;
  if(distInorg > BIN_HEIGHT_CM) distInorg = BIN_HEIGHT_CM;
  if(distInorg < 0) distInorg = 0;

  // Baca Berat (dengan fallback)
  if (loadcellOK && scale.is_ready()) {
    weight = scale.get_units(5); // Ambil rata-rata 5 bacaan
    if(weight < 0) weight = 0;
    if(weight > 100) weight = 0; // Nilai abnormal, skip
  }

  // Baca MQ-137 (Amonia)
  int mq137_raw = analogRead(MQ137_PIN);
  float voltage = mq137_raw * (3.3 / 4095.0);
  // Konversi kasar ke PPM (memerlukan kalibrasi Rs/R0 untuk akurasi)
  ppm = voltage * 20.0;
  if(ppm < 0) ppm = 0;

  // ESP32 telemetry additions: battery level (uptime-based discharge simulator)
  int battery_pct = 100 - (millis() / 600000); // drops 1% every 10 mins
  if (battery_pct < 10) battery_pct = 10;
  
  // WiFi RSSI: simulate minor fluctuations around -50 dBm
  int wifi_rssi = -50 - ((millis() / 5000) % 15); // fluctuates between -50 and -64 dBm

  // Susun JSON
  doc["dist_org"] = round(distOrg * 100) / 100.0;
  doc["dist_inorg"] = round(distInorg * 100) / 100.0;
  
  // Catatan: Jika ada 2 load cell, baca keduanya. Di sini contoh 1 loadcell
  // Untuk data terpisah, backend/simulator akan mengelola alokasinya.
  doc["weight_org"] = round(weight * 0.4 * 1000) / 1000.0;  // Mock split
  doc["weight_inorg"] = round(weight * 0.6 * 1000) / 1000.0; // Mock split
  
  doc["gas_ppm"] = round(ppm * 100) / 100.0;
  doc["battery_pct"] = battery_pct;
  doc["wifi_rssi_dbm"] = wifi_rssi;

  serializeJson(doc, Serial);
  Serial.println(); // Newline penting untuk parser di Pi!
}

// ── Utility Functions ──────────────────────────────────────────

void sendHeartbeat(String msg) {
  StaticJsonDocument<256> doc;
  doc["type"] = "heartbeat";
  doc["uptime"] = millis() / 1000;
  doc["message"] = msg;
  doc["sensors"]["tof_org"] = tofOrganicOK;
  doc["sensors"]["tof_inorg"] = tofInorganicOK;
  doc["sensors"]["loadcell"] = loadcellOK;
  doc["sensors"]["servo"] = servoOK;
  doc["free_heap"] = ESP.getFreeHeap();
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
