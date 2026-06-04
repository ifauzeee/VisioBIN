/*
 * VisioBin - Test Sensor Gas MQ-137 (Amonia/NH3)
 * ================================================
 * Sketch khusus untuk menguji sensor gas MQ-137.
 * Menampilkan nilai ADC raw, tegangan, dan estimasi PPM amonia.
 *
 * Cara Pakai:
 * 1. Hubungkan MQ-137 ke ESP32 (A0=GPIO34, VCC=5V, GND)
 * 2. PENTING: Biarkan sensor warm-up minimal 60 detik sebelum membaca!
 * 3. Upload sketch ini ke ESP32
 * 4. Buka Serial Monitor (Baud: 115200)
 * 5. Tunggu countdown warm-up selesai
 * 6. Dekatkan sumber amonia (misal: cairan pembersih) untuk melihat perubahan
 *
 * Catatan:
 *   Nilai PPM di sketch ini adalah ESTIMASI KASAR karena konversi
 *   akurat membutuhkan kalibrasi Rs/R0 dengan udara bersih.
 *   Gunakan LoadCell_Calibrator untuk kalibrasi load cell secara terpisah.
 *
 * Hasil yang diharapkan:
 *   ADC Raw  : 0 - 4095 (12-bit ADC ESP32)
 *   Tegangan : 0.0 - 3.3V
 *   Di udara bersih: tegangan rendah (~0.1-0.4V)
 *   Ada amonia     : tegangan naik signifikan
 *
 * Pin:
 *   A0 (Analog Out MQ-137) : GPIO34 (Input only, aman untuk 3.3V)
 *   VCC                    : 5V (WAJIB 5V untuk pemanas sensor)
 */

#define MQ137_PIN       34    // GPIO34 (input only, tidak ada pull-up)
#define WARMUP_SECONDS  60    // Waktu warm-up sensor (detik)
#define VCC_REF         3.3f  // Referensi tegangan ADC ESP32
#define ADC_RESOLUTION  4095  // 12-bit ADC

// RL (load resistance) dalam kOhm — nilai resistor di modul MQ-137
// Biasanya 10kOhm untuk modul umum
#define RL_VALUE        10.0f

// R0 = Resistance sensor di udara bersih (perlu kalibrasi aktual)
// Default dari datasheet MQ-137 sebagai titik awal
#define R0_CLEAN_AIR    76.63f

void setup() {
  Serial.begin(115200);
  delay(1000);
  analogReadResolution(12); // Pastikan 12-bit ADC

  Serial.println("\n\n========================================");
  Serial.println("   VisioBin - Test Sensor Gas MQ-137");
  Serial.println("   (Amonia / NH3)");
  Serial.println("========================================");
  Serial.println("PENTING: Sensor membutuhkan warm-up!");
  Serial.print("Menunggu ");
  Serial.print(WARMUP_SECONDS);
  Serial.println(" detik...\n");

  // Countdown warm-up
  for (int i = WARMUP_SECONDS; i > 0; i--) {
    Serial.print("  Warm-up: ");
    Serial.print(i);
    Serial.println(" detik lagi...");

    // Baca selama warm-up untuk monitoring
    int raw = analogRead(MQ137_PIN);
    float v  = raw * (VCC_REF / ADC_RESOLUTION);
    Serial.print("    ADC saat ini: ");
    Serial.print(raw);
    Serial.print("  Tegangan: ");
    Serial.print(v, 3);
    Serial.println("V");

    delay(1000);
  }

  Serial.println("\n[OK] Warm-up selesai! Sensor siap dibaca.");
  Serial.println("\nSkala kualitas udara (estimasi kasar):");
  Serial.println("  < 0.5V  : Udara Bersih / Normal");
  Serial.println("  0.5-1.0V: Ada Bau Ringan");
  Serial.println("  1.0-2.0V: Amonia Terdeteksi");
  Serial.println("  > 2.0V  : Konsentrasi Tinggi!");
  Serial.println("----------------------------------------\n");
}

// Hitung estimasi Rs dari tegangan output
float calculateRs(float voltage) {
  if (voltage <= 0) return 0;
  // Rs = RL * (Vcc - Vout) / Vout  — namun sensor sudah dalam modul
  // Pendekatan: estimasi dari rasio tegangan
  float rs = RL_VALUE * (VCC_REF - voltage) / voltage;
  return rs;
}

// Estimasi PPM amonia (sangat kasar, butuh kalibrasi R0 aktual)
float estimatePPM(float rs) {
  if (rs <= 0 || R0_CLEAN_AIR <= 0) return 0;
  float ratio = rs / R0_CLEAN_AIR;
  // Dari kurva datasheet MQ-137: log(ppm) ≈ -1.5 * log(Rs/R0) + log(100)
  // Ini adalah aproksimasi linier dari kurva log-log
  float ppm = 0;
  if (ratio < 1.0) {
    ppm = pow(10, (log10(100) - 1.5 * log10(ratio)));
  } else {
    ppm = 100.0 / ratio;  // fallback linear
  }
  if (ppm < 0) ppm = 0;
  if (ppm > 9999) ppm = 9999;
  return ppm;
}

// Status kualitas udara berdasarkan tegangan
String getAirQuality(float voltage) {
  if (voltage < 0.5)       return "BERSIH";
  else if (voltage < 1.0)  return "RINGAN";
  else if (voltage < 2.0)  return "TERCEMAR";
  else                     return "BAHAYA!";
}

int readingCount = 0;

void loop() {
  readingCount++;

  // Ambil beberapa sample dan rata-ratakan untuk mengurangi noise
  long sumRaw = 0;
  for (int i = 0; i < 10; i++) {
    sumRaw += analogRead(MQ137_PIN);
    delay(10);
  }
  int   avgRaw = sumRaw / 10;
  float voltage = avgRaw * (VCC_REF / ADC_RESOLUTION);
  float rs      = calculateRs(voltage);
  float ppm     = estimatePPM(rs);
  String quality = getAirQuality(voltage);

  Serial.print("[#");
  Serial.print(readingCount);
  Serial.print("] ");
  Serial.print("ADC: ");
  Serial.print(avgRaw);
  Serial.print("  |  ");
  Serial.print("Tegangan: ");
  Serial.print(voltage, 3);
  Serial.print("V  |  ");
  Serial.print("Rs: ");
  Serial.print(rs, 2);
  Serial.print("kOhm  |  ");
  Serial.print("~PPM: ");
  Serial.print(ppm, 1);
  Serial.print("  |  Status: ");
  Serial.println(quality);

  // Peringatan level bahaya
  if (voltage >= 2.0) {
    Serial.println("  *** PERINGATAN: Konsentrasi amonia tinggi! ***");
  }

  delay(1000);
}
