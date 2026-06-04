/*
 * VisioBin - Test Servo Motor (Sorter)
 * ======================================
 * Sketch khusus untuk menguji servo motor yang berfungsi sebagai
 * pemilah/sorter sampah organik dan anorganik.
 *
 * Cara Pakai:
 * 1. Hubungkan servo ke ESP32 (Signal=D15, VCC=5V, GND)
 *    PENTING: Servo membutuhkan VCC 5V, BUKAN 3.3V!
 * 2. Upload sketch ini ke ESP32
 * 3. Buka Serial Monitor (Baud: 115200)
 * 4. Perhatikan servo bergerak otomatis ke posisi-posisi kunci
 * 5. Gunakan perintah serial untuk kontrol manual
 *
 * Posisi Servo VisioBin:
 *   45°  -> Kompartemen ORGANIK  (miring kiri)
 *   90°  -> NETRAL / Tengah      (posisi standby)
 *   135° -> Kompartemen ANORGANIK (miring kanan)
 *
 * Perintah Serial Monitor:
 *   O + Enter -> Gerak ke 45°  (Organik)
 *   N + Enter -> Gerak ke 90°  (Netral)
 *   A + Enter -> Gerak ke 135° (Anorganik)
 *   S + Enter -> Mode SWEEP otomatis ON/OFF
 *   angka + Enter -> Gerak ke sudut spesifik (0-180)
 *
 * Library yang dibutuhkan:
 *   ESP32Servo (Install via Library Manager)
 *
 * Pin:
 *   Signal : D15
 *   VCC    : 5V (WAJIB)
 *   GND    : GND
 */

#include <ESP32Servo.h>

#define SERVO_PIN     15

// Posisi-posisi kunci VisioBin
#define POS_ORGANIC   45   // Miring ke kompartemen organik
#define POS_NEUTRAL   90   // Posisi tengah / standby
#define POS_INORGANIC 135  // Miring ke kompartemen anorganik

// Kecepatan gerak (ms per derajat) — lebih besar = lebih lambat
#define MOVE_SPEED_MS 10

Servo servo;
int currentPos = POS_NEUTRAL;
bool autoSweep  = false;

// Gerak servo perlahan ke target
void moveToSlow(int targetPos) {
  int step = (targetPos > currentPos) ? 1 : -1;
  while (currentPos != targetPos) {
    currentPos += step;
    servo.write(currentPos);
    delay(MOVE_SPEED_MS);
  }
  Serial.print("  -> Servo di posisi: ");
  Serial.print(currentPos);
  Serial.println("°");
}

// Gerak servo langsung (tanpa animasi)
void moveTo(int targetPos) {
  if (targetPos < 0)   targetPos = 0;
  if (targetPos > 180) targetPos = 180;
  currentPos = targetPos;
  servo.write(currentPos);
  delay(300); // Tunggu servo sampai
  Serial.print("  -> Servo di posisi: ");
  Serial.print(currentPos);
  Serial.println("°");
}

void printStatus() {
  Serial.print("[Servo] Posisi saat ini: ");
  Serial.print(currentPos);
  Serial.print("°  |  Mode: ");
  Serial.println(autoSweep ? "SWEEP OTOMATIS" : "MANUAL");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Alokasikan timer PWM untuk servo
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);

  Serial.println("\n\n========================================");
  Serial.println("   VisioBin - Test Servo Motor (Sorter)");
  Serial.println("========================================");
  Serial.println("Perintah:");
  Serial.println("  O + Enter -> 45°  (Organik)");
  Serial.println("  N + Enter -> 90°  (Netral)");
  Serial.println("  A + Enter -> 135° (Anorganik)");
  Serial.println("  S + Enter -> Toggle Sweep Otomatis");
  Serial.println("  angka     -> Gerak ke sudut (0-180)");
  Serial.println("----------------------------------------");

  Serial.print("Inisialisasi Servo di pin D");
  Serial.print(SERVO_PIN);
  Serial.print("... ");

  servo.setPeriodHertz(50);           // Standard 50Hz servo
  if (servo.attach(SERVO_PIN, 500, 2400)) {  // min/max pulse width
    Serial.println("OK!");
  } else {
    Serial.println("GAGAL!");
    Serial.println("[ERROR] Periksa:");
    Serial.println("  1. Kabel signal ke D15");
    Serial.println("  2. Supply VCC 5V ke servo (BUKAN 3.3V!)");
    Serial.println("  3. Pastikan GND servo terhubung ke GND ESP32");
    while (1) delay(1000);
  }

  // Sequence test awal
  Serial.println("\nRunning startup sequence...");

  Serial.println("1. Gerak ke NETRAL (90°)");
  moveToSlow(POS_NEUTRAL);
  delay(1000);

  Serial.println("2. Gerak ke ORGANIK (45°)");
  moveToSlow(POS_ORGANIC);
  delay(1000);

  Serial.println("3. Kembali ke NETRAL (90°)");
  moveToSlow(POS_NEUTRAL);
  delay(1000);

  Serial.println("4. Gerak ke ANORGANIK (135°)");
  moveToSlow(POS_INORGANIC);
  delay(1000);

  Serial.println("5. Kembali ke NETRAL (90°)");
  moveToSlow(POS_NEUTRAL);
  delay(500);

  Serial.println("\n[OK] Startup sequence selesai!");
  Serial.println("Servo siap untuk perintah manual.\n");
  printStatus();
}

// State untuk sweep otomatis
int sweepTargets[] = {POS_ORGANIC, POS_NEUTRAL, POS_INORGANIC, POS_NEUTRAL};
int sweepIndex = 0;
unsigned long lastSweepTime = 0;
#define SWEEP_INTERVAL_MS 2000

void loop() {
  // Cek perintah serial
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.length() == 0) {
      printStatus();
    } else if (input == "O" || input == "o") {
      autoSweep = false;
      Serial.println("[CMD] Gerak ke Organik (45°)");
      moveToSlow(POS_ORGANIC);
    } else if (input == "N" || input == "n") {
      autoSweep = false;
      Serial.println("[CMD] Gerak ke Netral (90°)");
      moveToSlow(POS_NEUTRAL);
    } else if (input == "A" || input == "a") {
      autoSweep = false;
      Serial.println("[CMD] Gerak ke Anorganik (135°)");
      moveToSlow(POS_INORGANIC);
    } else if (input == "S" || input == "s") {
      autoSweep = !autoSweep;
      sweepIndex = 0;
      lastSweepTime = millis();
      Serial.print("[CMD] Sweep Otomatis: ");
      Serial.println(autoSweep ? "ON" : "OFF");
    } else {
      // Coba parse sebagai angka (sudut)
      int angle = input.toInt();
      if (angle >= 0 && angle <= 180) {
        autoSweep = false;
        Serial.print("[CMD] Gerak ke sudut: ");
        Serial.print(angle);
        Serial.println("°");
        moveToSlow(angle);
      } else {
        Serial.println("[?] Perintah tidak dikenal.");
        Serial.println("    Gunakan: O, N, A, S, atau angka 0-180");
      }
    }
  }

  // Mode sweep otomatis
  if (autoSweep && (millis() - lastSweepTime >= SWEEP_INTERVAL_MS)) {
    lastSweepTime = millis();
    int target = sweepTargets[sweepIndex];
    Serial.print("[SWEEP] ");
    moveToSlow(target);
    sweepIndex = (sweepIndex + 1) % 4;
  }
}
