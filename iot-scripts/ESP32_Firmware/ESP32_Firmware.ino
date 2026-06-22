#include <ESP32Servo.h>
#include "HX711.h"

// =====================================================
//                    KONFIGURASI SERVO
// =====================================================
Servo myservo;

const int servoPin = 32;

// Untuk servo 360:
// 90  = stop
// 60  = putar kiri
// 120 = putar kanan
const int posisiStop      = 90;
const int posisiOrganik   = 60;   // Kiri  = Organik
const int posisiAnorganik = 120;  // Kanan = Anorganik
const int durasiGerak     = 1000;

// =====================================================
//                    SENSOR GAS MQ-137 / AMONIA
// =====================================================
const int pinMQ137 = 35;

// =====================================================
//                    LOAD CELL 1 - ORGANIK
// =====================================================
#define DOUT1 27
#define CLK1  26
HX711 scale1;

// =====================================================
//                    LOAD CELL 2 - ANORGANIK
// =====================================================
#define DOUT2 25
#define CLK2  33
HX711 scale2;

// =====================================================
//                    KALIBRASI LOAD CELL
// =====================================================
float calibration_factor_1 = -4000.0;
float calibration_factor_2 = -4000.0;

float zero_threshold = 5.0;

bool scale1_ok = false;
bool scale2_ok = false;

// =====================================================
//                    INTERVAL SENSOR
// =====================================================
unsigned long waktuLalu = 0;
const long intervalBaca = 2000;

unsigned long readCounter = 0;

// =====================================================
//                    PRINT HEADER
// =====================================================
void printHeader() {
  Serial.println();
  Serial.println("============================================================");
  Serial.println("                 VISIOBIN ESP32 SYSTEM");
  Serial.println("============================================================");
  Serial.println("Board      : ESP32");
  Serial.println("Baudrate   : 115200");
  Serial.println("Servo Pin  : GPIO 32");
  Serial.println("MQ-137 Pin : GPIO 35");
  Serial.println("LC1        : DOUT GPIO 27 | CLK GPIO 26");
  Serial.println("LC2        : DOUT GPIO 25 | CLK GPIO 33");
  Serial.println("============================================================");
  Serial.println();
}

// =====================================================
//                    PRINT COMMAND LIST
// =====================================================
void printCommandList() {
  Serial.println("------------------------------------------------------------");
  Serial.println("PERINTAH SERIAL");
  Serial.println("------------------------------------------------------------");
  Serial.println("CLASSIFY:ORGANIK    -> Servo bergerak kiri");
  Serial.println("CLASSIFY:ANORGANIK  -> Servo bergerak kanan");
  Serial.println("KIRI                -> Test manual servo kiri");
  Serial.println("KANAN               -> Test manual servo kanan");
  Serial.println("TARE                -> Reset kedua load cell ke 0");
  Serial.println("T                   -> Reset kedua load cell ke 0");
  Serial.println("STATUS              -> Tampilkan status sistem");
  Serial.println("HELP                -> Tampilkan daftar perintah");
  Serial.println("------------------------------------------------------------");
  Serial.println();
}

// =====================================================
//                    STATUS SISTEM
// =====================================================
void printSystemStatus() {
  Serial.println();
  Serial.println("+----------------------------------------------------------+");
  Serial.println("|                    SYSTEM STATUS                         |");
  Serial.println("+----------------------------------------------------------+");

  Serial.print("| Servo Pin             : GPIO ");
  Serial.println(servoPin);

  Serial.print("| MQ-137 / Amonia Pin   : GPIO ");
  Serial.println(pinMQ137);

  Serial.print("| Load Cell 1 Pin       : DOUT ");
  Serial.print(DOUT1);
  Serial.print(" | CLK ");
  Serial.println(CLK1);

  Serial.print("| Load Cell 2 Pin       : DOUT ");
  Serial.print(DOUT2);
  Serial.print(" | CLK ");
  Serial.println(CLK2);

  Serial.print("| Load Cell 1 Status    : ");
  Serial.println(scale1_ok ? "READY" : "NOT READY");

  Serial.print("| Load Cell 2 Status    : ");
  Serial.println(scale2_ok ? "READY" : "NOT READY");

  Serial.print("| Calibration LC1       : ");
  Serial.println(calibration_factor_1);

  Serial.print("| Calibration LC2       : ");
  Serial.println(calibration_factor_2);

  Serial.print("| Zero Threshold        : ");
  Serial.print(zero_threshold);
  Serial.println(" gram");

  Serial.println("+----------------------------------------------------------+");
  Serial.println();
}

// =====================================================
//                    FUNGSI SERVO
// =====================================================
void gerakOrganik() {
  Serial.println();
  Serial.println("+----------------------------------------------------------+");
  Serial.println("|                    SERVO ACTION                          |");
  Serial.println("+----------------------------------------------------------+");
  Serial.println("| Kategori             : ORGANIK");
  Serial.println("| Arah                 : KIRI");
  Serial.print("| Servo Pin            : GPIO ");
  Serial.println(servoPin);
  Serial.print("| Posisi Gerak         : ");
  Serial.println(posisiOrganik);
  Serial.print("| Durasi               : ");
  Serial.print(durasiGerak);
  Serial.println(" ms");
  Serial.println("+----------------------------------------------------------+");

  myservo.write(posisiOrganik);
  delay(durasiGerak);

  myservo.write(posisiStop);

  Serial.println("[OK] Servo kembali ke posisi stop/tengah");
  Serial.println("{\"type\":\"servo_done\",\"direction\":\"organic\"}");
  Serial.println();
}

void gerakAnorganik() {
  Serial.println();
  Serial.println("+----------------------------------------------------------+");
  Serial.println("|                    SERVO ACTION                          |");
  Serial.println("+----------------------------------------------------------+");
  Serial.println("| Kategori             : ANORGANIK");
  Serial.println("| Arah                 : KANAN");
  Serial.print("| Servo Pin            : GPIO ");
  Serial.println(servoPin);
  Serial.print("| Posisi Gerak         : ");
  Serial.println(posisiAnorganik);
  Serial.print("| Durasi               : ");
  Serial.print(durasiGerak);
  Serial.println(" ms");
  Serial.println("+----------------------------------------------------------+");

  myservo.write(posisiAnorganik);
  delay(durasiGerak);

  myservo.write(posisiStop);

  Serial.println("[OK] Servo kembali ke posisi stop/tengah");
  Serial.println("{\"type\":\"servo_done\",\"direction\":\"inorganic\"}");
  Serial.println();
}

// =====================================================
//                    FUNGSI BACA LOAD CELL
// =====================================================
float readScale(HX711 &scale, const char *name, float calibration_factor) {
  if (!scale.wait_ready_timeout(1000)) {
    Serial.print("| ");
    Serial.print(name);
    Serial.println(" : ERROR - HX711 NOT READY");
    return 0.0;
  }

  scale.set_scale(calibration_factor);

  float berat = scale.get_units(10);

  if (abs(berat) < zero_threshold) {
    berat = 0.0;
  }

  Serial.print("| ");
  Serial.print(name);

  int nameLength = strlen(name);
  for (int i = nameLength; i < 22; i++) {
    Serial.print(" ");
  }

  Serial.print(": ");
  Serial.print(berat, 2);
  Serial.println(" gram");

  return berat;
}

// =====================================================
//                    FUNGSI TARE ULANG
// =====================================================
void tareAll() {
  Serial.println();
  Serial.println("+----------------------------------------------------------+");
  Serial.println("|                    TARE ULANG LOAD CELL                  |");
  Serial.println("+----------------------------------------------------------+");
  Serial.println("| Instruksi : Kosongkan kedua load cell                    |");
  Serial.println("| Catatan   : Jangan disentuh selama proses tare            |");
  Serial.println("+----------------------------------------------------------+");

  Serial.println("[INFO] Menunggu 3 detik sebelum tare...");
  delay(3000);

  if (scale1.wait_ready_timeout(3000)) {
    scale1.tare(30);
    scale1_ok = true;
    Serial.println("[OK] Load Cell 1 tare ulang selesai");
  } else {
    scale1_ok = false;
    Serial.println("[ERROR] Load Cell 1 gagal tare");
    Serial.println("        Cek wiring: DOUT1=27, CLK1=26, VCC, GND");
  }

  delay(500);

  if (scale2.wait_ready_timeout(3000)) {
    scale2.tare(30);
    scale2_ok = true;
    Serial.println("[OK] Load Cell 2 tare ulang selesai");
  } else {
    scale2_ok = false;
    Serial.println("[ERROR] Load Cell 2 gagal tare");
    Serial.println("        Cek wiring: DOUT2=25, CLK2=33, VCC, GND");
  }

  Serial.println("+----------------------------------------------------------+");
  Serial.println();
}

// =====================================================
//                    SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  printHeader();

  // =====================================================
  //                    SETUP SERVO
  // =====================================================
  Serial.println("[SETUP] Inisialisasi servo...");

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  myservo.setPeriodHertz(50);
  myservo.attach(servoPin, 1000, 2000);
  myservo.write(posisiStop);

  Serial.println("[OK] Servo siap di GPIO 32");
  Serial.println("[OK] Servo berada di posisi stop/tengah");

  // =====================================================
  //                    SETUP MQ-137
  // =====================================================
  Serial.println();
  Serial.println("[SETUP] Inisialisasi sensor MQ-137 / amonia...");
  pinMode(pinMQ137, INPUT);
  Serial.println("[OK] MQ-137 siap di GPIO 35");

  // =====================================================
  //                    SETUP LOAD CELL
  // =====================================================
  Serial.println();
  Serial.println("[SETUP] Inisialisasi HX711 Load Cell...");

  scale1.begin(DOUT1, CLK1);
  scale2.begin(DOUT2, CLK2);

  scale1.set_scale(calibration_factor_1);
  scale2.set_scale(calibration_factor_2);

  Serial.println("[INFO] Menunggu HX711 stabil selama 3 detik...");
  delay(3000);

  Serial.println();
  Serial.println("+----------------------------------------------------------+");
  Serial.println("|                    LOAD CELL SETUP                       |");
  Serial.println("+----------------------------------------------------------+");

  if (scale1.wait_ready_timeout(3000)) {
    scale1.tare(30);
    scale1_ok = true;
    Serial.println("| Load Cell 1 / Organik    : READY - tare selesai          |");
  } else {
    scale1_ok = false;
    Serial.println("| Load Cell 1 / Organik    : ERROR - belum ready           |");
    Serial.println("| Cek                      : DOUT=27, CLK=26, VCC, GND     |");
  }

  delay(500);

  if (scale2.wait_ready_timeout(3000)) {
    scale2.tare(30);
    scale2_ok = true;
    Serial.println("| Load Cell 2 / Anorganik  : READY - tare selesai          |");
  } else {
    scale2_ok = false;
    Serial.println("| Load Cell 2 / Anorganik  : ERROR - belum ready           |");
    Serial.println("| Cek                      : DOUT=25, CLK=33, VCC, GND     |");
  }

  Serial.println("+----------------------------------------------------------+");

  Serial.println();
  Serial.println("============================================================");
  Serial.println("                    SISTEM SIAP");
  Serial.println("============================================================");

  printCommandList();
  printSystemStatus();
}

// =====================================================
//                    LOOP
// =====================================================
void loop() {
  unsigned long waktuSekarang = millis();

  // =====================================================
  //              TERIMA PERINTAH SERIAL
  // =====================================================
  if (Serial.available() > 0) {
    String perintah = Serial.readStringUntil('\n');
    perintah.trim();

    String perintahUpper = perintah;
    perintahUpper.toUpperCase();

    if (perintahUpper == "CLASSIFY:ORGANIK") {
      gerakOrganik();

    } else if (perintahUpper == "CLASSIFY:ANORGANIK") {
      gerakAnorganik();

    } else if (perintahUpper == "KIRI") {
      Serial.println();
      Serial.println("[MANUAL] Test servo kiri...");
      myservo.write(posisiOrganik);
      delay(durasiGerak);
      myservo.write(posisiStop);
      Serial.println("[OK] Servo stop/tengah");

    } else if (perintahUpper == "KANAN") {
      Serial.println();
      Serial.println("[MANUAL] Test servo kanan...");
      myservo.write(posisiAnorganik);
      delay(durasiGerak);
      myservo.write(posisiStop);
      Serial.println("[OK] Servo stop/tengah");

    } else if (perintahUpper == "TARE" || perintahUpper == "T") {
      tareAll();

    } else if (perintahUpper == "STATUS") {
      printSystemStatus();

    } else if (perintahUpper == "HELP") {
      printCommandList();

    } else {
      Serial.println();
      Serial.print("[WARNING] Perintah tidak dikenal: ");
      Serial.println(perintah);
      Serial.println("[INFO] Ketik HELP untuk melihat daftar perintah.");
    }

    while (Serial.available() > 0) {
      Serial.read();
    }
  }

  // =====================================================
  //              BACA SENSOR SETIAP 2 DETIK
  // =====================================================
  if (waktuSekarang - waktuLalu >= intervalBaca) {
    waktuLalu = waktuSekarang;
    readCounter++;

    int nilaiMQ = analogRead(pinMQ137);

    float teganganMQ = nilaiMQ * (3.3 / 4095.0);

    float berat_organik = 0.0;
    float berat_anorganik = 0.0;

    Serial.println();
    Serial.println("+----------------------------------------------------------+");
    Serial.println("|                    SENSOR SNAPSHOT                       |");
    Serial.println("+----------------------------------------------------------+");

    Serial.print("| Read #                  : ");
    Serial.println(readCounter);

    Serial.print("| MQ-137 Raw ADC          : ");
    Serial.println(nilaiMQ);

    Serial.print("| MQ-137 Voltage          : ");
    Serial.print(teganganMQ, 3);
    Serial.println(" V");

    Serial.print("| Load Cell 1 Status      : ");
    Serial.println(scale1_ok ? "READY" : "NOT READY");

    if (scale1_ok) {
      berat_organik = readScale(scale1, "Load Cell 1 Organik", calibration_factor_1);
    } else {
      Serial.println("| Load Cell 1 Organik     : -");
    }

    delay(200);

    Serial.print("| Load Cell 2 Status      : ");
    Serial.println(scale2_ok ? "READY" : "NOT READY");

    if (scale2_ok) {
      berat_anorganik = readScale(scale2, "Load Cell 2 Anorganik", calibration_factor_2);
    } else {
      Serial.println("| Load Cell 2 Anorganik   : -");
    }

    delay(200);

    float totalBerat = berat_organik + berat_anorganik;

    Serial.print("| Total Berat             : ");
    Serial.print(totalBerat, 2);
    Serial.println(" gram");

    Serial.println("+----------------------------------------------------------+");

    // JSON untuk Raspberry Pi / backend
    Serial.print("{\"type\":\"telemetry\"");
    Serial.print(",\"read\":");
    Serial.print(readCounter);
    Serial.print(",\"mq137\":");
    Serial.print(nilaiMQ);
    Serial.print(",\"mq137_voltage\":");
    Serial.print(teganganMQ, 3);
    Serial.print(",\"weight_org\":");
    Serial.print(berat_organik, 2);
    Serial.print(",\"weight_inorg\":");
    Serial.print(berat_anorganik, 2);
    Serial.print(",\"total_weight\":");
    Serial.print(totalBerat, 2);
    Serial.print(",\"lc1_ready\":");
    Serial.print(scale1_ok ? "true" : "false");
    Serial.print(",\"lc2_ready\":");
    Serial.print(scale2_ok ? "true" : "false");
    Serial.println("}");
  }
}
