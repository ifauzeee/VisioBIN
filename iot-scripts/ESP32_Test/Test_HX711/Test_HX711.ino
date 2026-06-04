/*
 * VisioBin - Test HX711 Load Cell
 * ================================
 * Sketch khusus untuk menguji modul Load Cell HX711.
 * Menampilkan raw ADC value dan estimasi berat (tanpa kalibrasi).
 *
 * Cara Pakai:
 * 1. Hubungkan HX711 ke ESP32 (DT=D18, SCK=D19, VCC=3.3V atau 5V, GND)
 * 2. Upload sketch ini ke ESP32
 * 3. Buka Serial Monitor (Baud: 115200)
 * 4. Tunggu hingga proses TARE selesai (jangan ada beban saat ini)
 * 5. Letakkan benda di atas load cell dan amati perubahan nilai
 * 6. Ketik "T" + Enter di Serial Monitor untuk reset tare ulang
 * 7. Ketik "R" + Enter untuk melihat raw value mentah
 *
 * Hasil yang diharapkan:
 *   Raw value stabil saat tidak ada beban (sekitar 0 setelah tare)
 *   Nilai berubah proporsional saat ada beban
 *   Noise < 5% dari pembacaan = kondisi baik
 *
 * Library yang dibutuhkan:
 *   HX711 by Bogdan Necula (Install via Library Manager)
 *
 * Pin:
 *   DT  : D18
 *   SCK : D19
 */

#include <HX711.h>

#define LOADCELL_DOUT_PIN 18
#define LOADCELL_SCK_PIN  19

// Calibration factor default (hasil dari LoadCell_Calibrator)
// Ganti nilai ini sesuai hasil kalibrasi anda
#define CALIBRATION_FACTOR 2280.0f

HX711 scale;

bool useCalibration = false;
long rawZero = 0;

void printSeparator() {
  Serial.println("----------------------------------------");
}

void doTare() {
  Serial.print("  Melakukan TARE (tunggu)... ");
  scale.tare();
  rawZero = scale.read_average(10);
  Serial.println("Selesai!");
  Serial.print("  Zero point raw: ");
  Serial.println(rawZero);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("   VisioBin - Test HX711 Load Cell");
  Serial.println("========================================");
  Serial.println("Perintah Serial:");
  Serial.println("  T + Enter -> Tare ulang (reset nol)");
  Serial.println("  R + Enter -> Toggle tampilkan RAW value");
  Serial.println("  C + Enter -> Toggle kalibrasi ON/OFF");
  printSeparator();

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  Serial.print("Mendeteksi HX711... ");
  if (!scale.wait_ready_timeout(3000)) {
    Serial.println("GAGAL!");
    Serial.println("[ERROR] Periksa:");
    Serial.println("  1. Kabel DT ke D18 dan SCK ke D19");
    Serial.println("  2. Supply VCC ke HX711 (3.3V atau 5V)");
    Serial.println("  3. Pastikan load cell terhubung ke HX711 (E+/E-/A+/A-)");
    while (1) delay(1000);
  }
  Serial.println("OK!");

  scale.set_scale(useCalibration ? CALIBRATION_FACTOR : 1.0f);
  doTare();

  Serial.println("\nMemulai pembacaan berat...");
  Serial.println("(Letakkan beban untuk melihat perubahan)\n");
  printSeparator();
}

bool showRaw = false;

void loop() {
  // Cek perintah serial
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    while (Serial.available()) Serial.read(); // flush

    if (cmd == 'T' || cmd == 't') {
      Serial.println("[CMD] Tare ulang...");
      doTare();
    } else if (cmd == 'R' || cmd == 'r') {
      showRaw = !showRaw;
      Serial.print("[CMD] Tampilkan RAW: ");
      Serial.println(showRaw ? "ON" : "OFF");
    } else if (cmd == 'C' || cmd == 'c') {
      useCalibration = !useCalibration;
      scale.set_scale(useCalibration ? CALIBRATION_FACTOR : 1.0f);
      Serial.print("[CMD] Kalibrasi: ");
      Serial.print(useCalibration ? "ON (Factor=" : "OFF");
      if (useCalibration) {
        Serial.print(CALIBRATION_FACTOR);
        Serial.print(")");
      }
      Serial.println();
    }
  }

  if (!scale.is_ready()) {
    Serial.println("[WAIT] HX711 belum siap...");
    delay(200);
    return;
  }

  // Ambil rata-rata 5 pembacaan
  float reading = scale.get_units(5);
  long  rawVal  = scale.read_average(5);

  Serial.print("[Load Cell] ");

  if (useCalibration) {
    if (reading < 0) reading = 0;
    Serial.print("Berat: ");
    Serial.print(reading, 3);
    Serial.print(" kg  (");
    Serial.print(reading * 1000, 0);
    Serial.print(" gram)");
  } else {
    Serial.print("Units (raw/scale=1): ");
    Serial.print(reading, 1);
  }

  if (showRaw) {
    Serial.print("  |  RAW ADC: ");
    Serial.print(rawVal);
  }

  Serial.println();
  delay(500);
}
