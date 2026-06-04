# ESP32 Hardware Test — VisioBin

Kumpulan sketch Arduino untuk menguji setiap komponen hardware VisioBin **satu per satu** sebelum menggunakan firmware utama.

> **Gunakan folder ini saat:**
> - Perakitan pertama kali
> - Ada komponen yang dicurigai rusak/tidak terhubung
> - Setelah mengganti salah satu sensor/aktuator

---

## Daftar Sketch

| Sketch | Komponen yang Diuji | File |
|---|---|---|
| 1. `Test_TCA9548A` | I2C Multiplexer TCA9548A | [`Test_TCA9548A/Test_TCA9548A.ino`](Test_TCA9548A/Test_TCA9548A.ino) |
| 2. `Test_VL53L0X_Organic` | Sensor Jarak ToF — Kompartemen Organik | [`Test_VL53L0X_Organic/Test_VL53L0X_Organic.ino`](Test_VL53L0X_Organic/Test_VL53L0X_Organic.ino) |
| 3. `Test_VL53L0X_Inorganic` | Sensor Jarak ToF — Kompartemen Anorganik | [`Test_VL53L0X_Inorganic/Test_VL53L0X_Inorganic.ino`](Test_VL53L0X_Inorganic/Test_VL53L0X_Inorganic.ino) |
| 4. `Test_HX711` | Load Cell / Sensor Berat | [`Test_HX711/Test_HX711.ino`](Test_HX711/Test_HX711.ino) |
| 5. `Test_MQ137` | Sensor Gas Amonia MQ-137 | [`Test_MQ137/Test_MQ137.ino`](Test_MQ137/Test_MQ137.ino) |
| 6. `Test_Servo` | Servo Motor Sorter | [`Test_Servo/Test_Servo.ino`](Test_Servo/Test_Servo.ino) |
| — | `Hardware_Test` (semua sekaligus) | [`Hardware_Test/Hardware_Test.ino`](Hardware_Test/Hardware_Test.ino) |

---

## Wiring Referensi

```
ESP32 Pin   →  Komponen
─────────────────────────────────────────
D21 (SDA)   →  TCA9548A SDA
D22 (SCL)   →  TCA9548A SCL
─────────────────────────────────────────
TCA9548A Ch.0  →  VL53L0X (Organik)
TCA9548A Ch.1  →  VL53L0X (Anorganik)
─────────────────────────────────────────
D18 (DT)    →  HX711 DT
D19 (SCK)   →  HX711 SCK
─────────────────────────────────────────
GPIO34      →  MQ-137 A0 (Analog Out)
─────────────────────────────────────────
D15         →  Servo Signal
─────────────────────────────────────────
D2          →  LED Built-in (Status)
```

> **Catatan Supply:**
> - TCA9548A & VL53L0X → **3.3V**
> - HX711 → **3.3V atau 5V**
> - MQ-137 VCC → **5V WAJIB** (untuk heater sensor)
> - Servo VCC → **5V WAJIB** (3.3V tidak cukup torsi)

---

## Library yang Dibutuhkan

Install semua library ini via **Arduino IDE → Tools → Manage Libraries**:

| Library | Author | Untuk |
|---|---|---|
| `Adafruit VL53L0X` | Adafruit | Sensor ToF |
| `HX711` | Bogdan Necula | Load Cell |
| `ESP32Servo` | Kevin Harrington | Servo Motor |
| `ArduinoJson` | Benoit Blanchon | (Firmware utama) |

---

## Urutan Testing yang Disarankan

Ikuti urutan ini untuk memudahkan troubleshooting:

### Step 1 — Test TCA9548A (I2C Multiplexer)
**Kenapa duluan?** Karena 2 sensor ToF bergantung pada multiplexer ini.

1. Upload `Test_TCA9548A/Test_TCA9548A.ino`
2. Buka Serial Monitor (Baud: **115200**)
3. ✅ **Berhasil** jika terdeteksi `[OK] TCA9548A ditemukan di 0x70`
4. ✅ **Berhasil** jika Channel 0 dan Channel 1 menampilkan `[FOUND] Device di 0x29`

```
Contoh output yang benar:
  [OK] TCA9548A ditemukan di 0x70

  Channel 0:
      [FOUND] Device di 0x29 -> VL53L0X (ToF Sensor)
  Channel 1:
      [FOUND] Device di 0x29 -> VL53L0X (ToF Sensor)
  Channel 2:
      [KOSONG] Tidak ada device I2C ditemukan
  ...
```

---

### Step 2 — Test VL53L0X Organik (Channel 0)

1. Upload `Test_VL53L0X_Organic/Test_VL53L0X_Organic.ino`
2. Buka Serial Monitor (Baud: **115200**)
3. Dekatkan / jauhkan tangan di atas sensor
4. ✅ **Berhasil** jika jarak berubah mengikuti gerakan tangan

```
Contoh output yang benar:
  [Organik] Jarak: 245 mm (24.5 cm)  |  Kepenuhan: 51%  |  RangeStatus: 0
  [Organik] Jarak: 120 mm (12.0 cm)  |  Kepenuhan: 76%  |  RangeStatus: 0
```

❌ **Jika `GAGAL`** → Cek kabel ke TCA9548A Channel 0, ulangi Step 1.

---

### Step 3 — Test VL53L0X Anorganik (Channel 1)

1. Upload `Test_VL53L0X_Inorganic/Test_VL53L0X_Inorganic.ino`
2. Langkah sama dengan Step 2
3. ✅ **Berhasil** jika jarak berubah dan muncul label `[Anorganik]`

---

### Step 4 — Test HX711 Load Cell

1. **Pastikan tidak ada beban di atas load cell** saat upload
2. Upload `Test_HX711/Test_HX711.ino`
3. Buka Serial Monitor (Baud: **115200**)
4. Tunggu proses TARE selesai otomatis
5. Letakkan benda di atas load cell
6. ✅ **Berhasil** jika nilai berubah saat ada/tidak ada benda

**Perintah Serial Monitor:**

| Ketik | Fungsi |
|---|---|
| `T` + Enter | Tare ulang (reset ke nol) |
| `R` + Enter | Toggle tampilkan nilai RAW ADC |
| `C` + Enter | Toggle kalibrasi ON/OFF |

```
Contoh output yang benar:
  [Load Cell] Units (raw/scale=1): 124523.0
  [Load Cell] Units (raw/scale=1): 5232.1    ← setelah tare, tanpa beban
  [Load Cell] Units (raw/scale=1): 687432.0  ← setelah diberi beban
```

> **Tip:** Untuk mendapatkan nilai berat dalam kg/gram yang akurat,
> jalankan `LoadCell_Calibrator` di folder `ESP32_Calibration/`.

---

### Step 5 — Test MQ-137 (Sensor Gas)

> ⚠️ **PENTING:** MQ-137 membutuhkan **VCC 5V** dan **warm-up 60 detik** sebelum nilai stabil!

1. Upload `Test_MQ137/Test_MQ137.ino`
2. Buka Serial Monitor (Baud: **115200**)
3. Tunggu countdown 60 detik warm-up
4. Dekatkan sumber amonia (contoh: cairan pembersih lantai) untuk melihat perubahan
5. ✅ **Berhasil** jika tegangan naik saat ada amonia

```
Contoh output yang benar (di udara bersih):
  [#61] ADC: 312  |  Tegangan: 0.251V  |  Rs: 120.84kOhm  |  ~PPM: 0.8  |  Status: BERSIH

Contoh output saat ada amonia:
  [#75] ADC: 2840  |  Tegangan: 2.287V  |  Rs: 10.45kOhm  |  ~PPM: 87.3  |  Status: BAHAYA!
  *** PERINGATAN: Konsentrasi amonia tinggi! ***
```

---

### Step 6 — Test Servo Motor

> ⚠️ **PENTING:** Servo membutuhkan **VCC 5V**. Jangan gunakan 3.3V!

1. Upload `Test_Servo/Test_Servo.ino`
2. Buka Serial Monitor (Baud: **115200**)
3. Servo akan otomatis bergerak ke semua posisi (startup sequence)
4. ✅ **Berhasil** jika servo bergerak fisik ke posisi 45° → 90° → 135° → 90°

**Perintah Serial Monitor:**

| Ketik | Fungsi |
|---|---|
| `O` + Enter | Gerak ke 45° (posisi Organik) |
| `N` + Enter | Gerak ke 90° (posisi Netral) |
| `A` + Enter | Gerak ke 135° (posisi Anorganik) |
| `S` + Enter | Toggle mode sweep otomatis |
| `angka` + Enter | Gerak ke sudut tertentu (0–180) |

---

### Step 7 — Hardware Test (Semua Sekaligus)

Setelah semua komponen lulus test individual, jalankan `Hardware_Test` sebagai validasi akhir sebelum firmware utama.

1. Upload `Hardware_Test/Hardware_Test.ino`
2. Semua sensor akan dibaca dan ditampilkan setiap 2 detik
3. ✅ **Siap ke firmware utama** jika semua komponen menampilkan `OK!`

---

### Step 8 — Upload Firmware Utama

Setelah semua hardware terverifikasi, upload firmware utama:

📁 `../ESP32_Firmware/ESP32_Firmware.ino`

---

## Troubleshooting Umum

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| TCA9548A tidak ditemukan | Kabel SDA/SCL terbalik atau lepas | Cek D21=SDA, D22=SCL |
| VL53L0X `GAGAL` | Channel TCA salah atau sensor tidak terhubung | Jalankan Test_TCA9548A dulu |
| HX711 `GAGAL` | Kabel DT/SCK salah atau supply tidak stabil | Cek D18=DT, D19=SCK |
| Load Cell nilai tidak stabil | Getaran eksternal atau koneksi longgar | Letakkan di permukaan rata, kencangkan kabel |
| MQ-137 selalu 0 atau tidak berubah | Sensor belum warm-up / VCC bukan 5V | Tunggu 60 detik, pastikan VCC=5V |
| Servo tidak bergerak | VCC 3.3V atau signal pin salah | Ganti ke VCC 5V, cek D15=Signal |
| Servo bergetar/jitter | Supply 5V tidak cukup arus | Gunakan power supply terpisah untuk servo |
