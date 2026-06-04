/*
 * VisioBin - Test TCA9548A I2C Multiplexer
 * =========================================
 * Sketch ini melakukan scan semua 8 channel pada TCA9548A
 * untuk memastikan multiplexer bekerja dan mendeteksi
 * device I2C yang terhubung di setiap channel.
 *
 * Cara Pakai:
 * 1. Hubungkan TCA9548A ke ESP32 (SDA=D21, SCL=D22, VCC=3.3V, GND)
 * 2. Upload sketch ini
 * 3. Buka Serial Monitor (Baud: 115200)
 * 4. Lihat hasil scan — device yang ditemukan akan ditampilkan per channel
 *
 * Hasil yang diharapkan (VisioBin):
 *   Channel 0: 0x29 (VL53L0X Organik)
 *   Channel 1: 0x29 (VL53L0X Anorganik)
 *
 * Pin:
 *   SDA : D21
 *   SCL : D22
 *   ADDR: 0x70 (default, ADDR pin ke GND)
 */

#include <Wire.h>

#define TCA9548A_ADDR 0x70
#define SDA_PIN 21
#define SCL_PIN 22

// Pilih channel TCA9548A (0-7)
void tcaselect(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(1 << channel);
  Wire.endTransmission();
  delay(10);
}

// Nonaktifkan semua channel
void tcaDisableAll() {
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(0x00);
  Wire.endTransmission();
}

// Scan I2C address pada channel aktif
void scanI2C(uint8_t channel) {
  int devicesFound = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    if (addr == TCA9548A_ADDR) continue; // Skip alamat TCA itu sendiri

    Wire.beginTransmission(addr);
    uint8_t error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("    [FOUND] Device di 0x");
      if (addr < 16) Serial.print("0");
      Serial.print(addr, HEX);

      // Identifikasi device umum
      if (addr == 0x29) Serial.print(" -> VL53L0X (ToF Sensor)");
      else if (addr == 0x3C || addr == 0x3D) Serial.print(" -> OLED Display");
      else if (addr == 0x48) Serial.print(" -> ADS1115 / Temp Sensor");
      else if (addr == 0x68 || addr == 0x69) Serial.print(" -> MPU6050 / DS3231 RTC");
      else if (addr == 0x76 || addr == 0x77) Serial.print(" -> BME280 / BMP280");

      Serial.println();
      devicesFound++;
    }
  }

  if (devicesFound == 0) {
    Serial.println("    [KOSONG] Tidak ada device I2C ditemukan");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);

  Serial.println("\n\n========================================");
  Serial.println("   VisioBin - Test TCA9548A I2C Mux");
  Serial.println("========================================");

  // Cek apakah TCA9548A terdeteksi
  Wire.beginTransmission(TCA9548A_ADDR);
  uint8_t err = Wire.endTransmission();

  if (err != 0) {
    Serial.println("[ERROR] TCA9548A TIDAK DITEMUKAN di 0x70!");
    Serial.println("        Periksa kabel SDA/SCL dan supply 3.3V.");
    Serial.println("        Sketch berhenti.");
    while (1) delay(1000);
  }

  Serial.println("[OK] TCA9548A ditemukan di 0x70\n");
  Serial.println("Memulai scan semua 8 channel...");
  Serial.println("----------------------------------------");
}

void loop() {
  for (uint8_t ch = 0; ch < 8; ch++) {
    Serial.print("Channel ");
    Serial.print(ch);
    Serial.println(":");

    tcaselect(ch);
    delay(20);
    scanI2C(ch);

    tcaDisableAll();
    delay(50);
  }

  Serial.println("----------------------------------------");
  Serial.println("Scan selesai. Mengulang dalam 5 detik...\n");
  delay(5000);
}
