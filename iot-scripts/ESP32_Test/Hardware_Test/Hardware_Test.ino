/*
 * VisioBin - ESP32 Hardware Diagnostics & Sensor Test
 * ===================================================
 * Skrip ini berguna untuk memastikan semua sensor (ToF, Load Cell, Gas) 
 * dan aktuator (Servo) berfungsi dan terpasang dengan benar sebelum
 * menggunakan firmware asli.
 *
 * Akan mencetak data dari semua komponen ke Serial Monitor setiap 2 detik.
 */

#include <Wire.h>
#include <Adafruit_VL53L0X.h>
#include <HX711.h>
#include <ESP32Servo.h>

// --- Definisi Pin ---
#define TCA9548A_ADDR 0x70
#define LOADCELL_DOUT_PIN 18
#define LOADCELL_SCK_PIN  19
#define MQ137_PIN         34
#define SERVO_PIN         15

Adafruit_VL53L0X tof1 = Adafruit_VL53L0X();
Adafruit_VL53L0X tof2 = Adafruit_VL53L0X();
HX711 scale;
Servo servo;

bool tof1_ok = false;
bool tof2_ok = false;
bool scale_ok = false;
int servo_pos = 90;
int servo_step = 45;

void tcaselect(uint8_t i) {
  if (i > 7) return;
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(1 << i);
  Wire.endTransmission();  
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n--- VisioBin Hardware Diagnostic Test ---");

  Wire.begin();

  // Test ToF 1 (Organik)
  Serial.print("Init ToF 1 (Ch 0)... ");
  tcaselect(0);
  if (tof1.begin()) {
    Serial.println("OK!");
    tof1_ok = true;
  } else {
    Serial.println("GAGAL!");
  }

  // Test ToF 2 (Anorganik)
  Serial.print("Init ToF 2 (Ch 1)... ");
  tcaselect(1);
  if (tof2.begin()) {
    Serial.println("OK!");
    tof2_ok = true;
  } else {
    Serial.println("GAGAL!");
  }

  // Test Load Cell
  Serial.print("Init Load Cell HX711... ");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  if (scale.is_ready()) {
    Serial.println("OK!");
    scale_ok = true;
    scale.set_scale(); // Tanpa kalibrasi, baca raw value
    scale.tare();
  } else {
    Serial.println("GAGAL!");
  }

  // Test Servo
  Serial.print("Init Servo... ");
  servo.attach(SERVO_PIN);
  servo.write(90);
  Serial.println("OK! (Posisi Netral)");
  
  Serial.println("Memulai pembacaan dalam 3 detik...\n");
  delay(3000);
}

void loop() {
  Serial.println("-----------------------------------");
  
  // 1. Baca ToF
  tcaselect(0);
  if (tof1_ok) {
    VL53L0X_RangingMeasurementData_t measure;
    tof1.rangingTest(&measure, false);
    if (measure.RangeStatus != 4) {
      Serial.print("ToF 1 (Organik)  : "); Serial.print(measure.RangeMilliMeter); Serial.println(" mm");
    } else {
      Serial.println("ToF 1 (Organik)  : Out of range");
    }
  }

  tcaselect(1);
  if (tof2_ok) {
    VL53L0X_RangingMeasurementData_t measure;
    tof2.rangingTest(&measure, false);
    if (measure.RangeStatus != 4) {
      Serial.print("ToF 2 (Anorganik): "); Serial.print(measure.RangeMilliMeter); Serial.println(" mm");
    } else {
      Serial.println("ToF 2 (Anorganik): Out of range");
    }
  }

  // 2. Baca Berat
  if (scale_ok) {
    long raw_weight = scale.get_units(5);
    Serial.print("Load Cell (Raw)  : "); Serial.println(raw_weight);
  }

  // 3. Baca Sensor Gas
  int mq_raw = analogRead(MQ137_PIN);
  float voltage = mq_raw * (3.3 / 4095.0);
  Serial.print("MQ-137 Gas (Raw) : "); Serial.print(mq_raw);
  Serial.print(" ("); Serial.print(voltage); Serial.println("V)");

  // 4. Gerakkan Servo
  servo_pos += servo_step;
  if (servo_pos > 135) {
    servo_pos = 45; // 45 -> 90 -> 135 -> 45
  }
  servo.write(servo_pos);
  Serial.print("Servo Position   : "); Serial.println(servo_pos);

  delay(2000);
}
