/*
 * VisioBin - Test VL53L0X ToF Sensor (Kompartemen ORGANIK)
 * ==========================================================
 * Sketch khusus untuk menguji sensor jarak VL53L0X yang terhubung
 * ke Channel 0 pada multiplexer TCA9548A (kompartemen organik).
 *
 * Cara Pakai:
 * 1. Pastikan TCA9548A sudah terhubung (SDA=D21, SCL=D22)
 * 2. Pastikan VL53L0X Organik terhubung ke Channel 0 TCA9548A
 * 3. Upload sketch ini ke ESP32
 * 4. Buka Serial Monitor (Baud: 115200)
 * 5. Dekatkan atau jauhkan tangan di atas sensor untuk melihat perubahan
 *
 * Hasil yang diharapkan:
 *   Jarak terukur antara 30 - 1200 mm (tergantung kondisi)
 *   Jika "Out of range", berarti objek terlalu jauh atau tidak ada
 *
 * Library yang dibutuhkan:
 *   Adafruit VL53L0X (Install via Library Manager)
 *
 * Pin:
 *   SDA : D21
 *   SCL : D22
 *   ToF Organik: TCA9548A Channel 0
 */

#include <Wire.h>
#include <Adafruit_VL53L0X.h>

#define TCA9548A_ADDR  0x70
#define TOF_CHANNEL    0       // Channel 0 = Kompartemen Organik
#define BIN_HEIGHT_CM  50      // Tinggi tempat sampah (cm)
#define SDA_PIN        21
#define SCL_PIN        22

Adafruit_VL53L0X tof = Adafruit_VL53L0X();

void tcaselect(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(1 << channel);
  Wire.endTransmission();
  delay(10);
}

// Konversi jarak ke persentase kepenuhan tempat sampah
int distanceToFillPercent(float distanceCm) {
  if (distanceCm <= 0) return 100;
  if (distanceCm >= BIN_HEIGHT_CM) return 0;
  return (int)(((BIN_HEIGHT_CM - distanceCm) / BIN_HEIGHT_CM) * 100);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);

  Serial.println("\n\n========================================");
  Serial.println("   VisioBin - Test ToF VL53L0X ORGANIK");
  Serial.println("   (TCA9548A Channel 0)");
  Serial.println("========================================");

  // Aktifkan channel 0
  tcaselect(TOF_CHANNEL);

  Serial.print("Inisialisasi VL53L0X... ");
  if (!tof.begin()) {
    Serial.println("GAGAL!");
    Serial.println("[ERROR] Periksa:");
    Serial.println("  1. Kabel SDA/SCL ke TCA9548A");
    Serial.println("  2. Kabel dari TCA9548A Ch.0 ke VL53L0X");
    Serial.println("  3. Supply 3.3V ke VL53L0X");
    Serial.println("  4. Coba jalankan Test_TCA9548A dulu!");
    while (1) delay(1000);
  }

  Serial.println("OK!");
  Serial.print("Mode: Long Range... ");
  tof.setMeasurementTimingBudgetMicroSeconds(200000); // 200ms untuk akurasi lebih baik
  Serial.println("Set!");
  Serial.println("\nMemulai pembacaan jarak...");
  Serial.println("(Dekatkan tangan untuk melihat perubahan)\n");
  Serial.println("----------------------------------------");
}

void loop() {
  tcaselect(TOF_CHANNEL);

  VL53L0X_RangingMeasurementData_t measure;
  tof.rangingTest(&measure, false);

  Serial.print("[Organik] ");

  if (measure.RangeStatus != 4) {
    float distanceCm = measure.RangeMilliMeter / 10.0;
    int fillPercent  = distanceToFillPercent(distanceCm);

    // Batasi nilai
    if (distanceCm > BIN_HEIGHT_CM) distanceCm = BIN_HEIGHT_CM;
    if (distanceCm < 0) distanceCm = 0;
    if (fillPercent > 100) fillPercent = 100;
    if (fillPercent < 0) fillPercent = 0;

    Serial.print("Jarak: ");
    Serial.print(measure.RangeMilliMeter);
    Serial.print(" mm (");
    Serial.print(distanceCm, 1);
    Serial.print(" cm)  |  Kepenuhan: ");
    Serial.print(fillPercent);
    Serial.print("%  |  RangeStatus: ");
    Serial.println(measure.RangeStatus);

    // Peringatan jika hampir penuh
    if (fillPercent >= 80) {
      Serial.println("  *** PERINGATAN: Tempat sampah hampir penuh! ***");
    }
  } else {
    Serial.println("Out of range / Tidak ada objek terdeteksi");
  }

  delay(500);
}
