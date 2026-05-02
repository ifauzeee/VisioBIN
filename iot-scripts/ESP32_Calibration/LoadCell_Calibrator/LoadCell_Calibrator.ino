/*
 * VisioBin - Load Cell (HX711) Calibration Tool
 * =============================================
 * Skrip ini digunakan untuk mencari nilai LOADCELL_CALIBRATION_FACTOR
 * yang akurat untuk tempat sampah pintar Anda.
 *
 * Cara Penggunaan:
 * 1. Kosongkan tempat sampah (jangan ada beban di atas load cell).
 * 2. Upload skrip ini ke ESP32.
 * 3. Buka Serial Monitor (Baud: 115200).
 * 4. Tunggu hingga muncul tulisan "Tare complete. Place known weight...".
 * 5. Letakkan beban yang sudah diketahui berat aslinya (misal botol air 500g atau 1kg).
 * 6. Ketikkan berat benda tersebut (dalam kg, misal: 0.5 atau 1.0) ke Serial Monitor dan tekan Enter.
 * 7. Skrip akan menghitung dan mencetak Calibration Factor.
 * 8. Copy nilai tersebut dan paste ke file ESP32_Firmware.ino
 */

#include "HX711.h"

// --- Pin ESP32 ---
const int LOADCELL_DOUT_PIN = 18;
const int LOADCELL_SCK_PIN = 19;

HX711 scale;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=======================================");
  Serial.println("  VisioBin HX711 Calibration Tool");
  Serial.println("=======================================");

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  if (!scale.is_ready()) {
    Serial.println("Error: Modul HX711 tidak ditemukan. Cek kabel!");
    while(1);
  }

  Serial.println("1. Mengosongkan timbangan (Tare)...");
  Serial.println("   Pastikan tidak ada benda di atas load cell!");
  delay(3000);

  scale.set_scale(); // Gunakan scale default = 1
  scale.tare();      // Reset ke nol

  Serial.println("2. Tare Selesai!");
  Serial.println("3. Letakkan benda yang diketahui beratnya di atas load cell.");
  Serial.println("   Contoh: Letakkan barbel 1kg atau botol air mineral 1 Liter.");
  Serial.println("4. Ketikkan berat benda tersebut dalam Kilogram (misal: 1.0 atau 0.5)");
  Serial.println("   di kolom input Serial Monitor, lalu tekan ENTER.");
}

void loop() {
  // Tunggu input dari user
  if (Serial.available() > 0) {
    float known_weight = Serial.parseFloat();
    
    // Bersihkan buffer enter (\n atau \r)
    while (Serial.available() > 0) Serial.read();

    if (known_weight > 0.0) {
      Serial.print("Menghitung berdasarkan berat benda: ");
      Serial.print(known_weight);
      Serial.println(" kg...");
      
      // Ambil nilai mentah (raw data) dari HX711
      long reading = scale.get_units(10); // Rata-rata dari 10 pembacaan
      
      // Hitung calibration factor
      float calibration_factor = (float)reading / known_weight;

      Serial.println("\n---------------------------------------");
      Serial.println("  KALIBRASI SELESAI!");
      Serial.println("---------------------------------------");
      Serial.print("Raw Reading       : ");
      Serial.println(reading);
      Serial.print("Known Weight      : ");
      Serial.print(known_weight);
      Serial.println(" kg");
      Serial.print("CALIBRATION FACTOR: ");
      Serial.println(calibration_factor, 2);
      Serial.println("\n>> COPY NILAI INI KE DALAM FILE ESP32_Firmware.ino:");
      Serial.print("   const float LOADCELL_CALIBRATION_FACTOR = ");
      Serial.print(calibration_factor, 2);
      Serial.println("f;");
      Serial.println("\nUntuk mengulang, ketik berat beban yang berbeda dan tekan ENTER.");
    }
  }
}
