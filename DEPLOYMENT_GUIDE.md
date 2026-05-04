# 🚀 Panduan Implementasi & Deployment VisioBIN
**Versi 1.0 - Sistem Pengelolaan Sampah Cerdas Berbasis AI & IoT**

Dokumen ini berisi instruksi lengkap untuk merakit, mengonfigurasi, dan menjalankan sistem VisioBIN secara *end-to-end*.

---

## 🏗️ 1. Daftar Kebutuhan Perangkat Keras (BOM)

### A. Komponen Utama
| Nama Komponen | Fungsi | Jumlah |
| :--- | :--- | :--- |
| **Raspberry Pi 4 (4GB+)** | Gateway, Pemrosesan AI (Edge), Kontrol Kamera | 1 unit |
| **ESP32 DevKit V1** | Node IoT, Pengumpulan Sensor, Kontrol Servo | 1 unit |
| **Kamera USB (Logitech/No-brand)** | Menangkap gambar sampah untuk klasifikasi | 1 unit |
| **MicroSD 32GB+ (Class 10)** | Media penyimpanan OS Raspberry Pi | 1 unit |

### B. Sensor & Aktuator
| Nama Komponen | Fungsi | Jumlah |
| :--- | :--- | :--- |
| **VL53L0X (ToF Sensor)** | Mengukur ketinggian sampah (Organik & Anorganik) | 2 unit |
| **TCA9548A I2C Mux** | Mengatasi konflik alamat I2C antara dua sensor ToF | 1 unit |
| **Load Cell (5-10kg) + HX711** | Mengukur berat sampah | 1 unit |
| **MQ-137** | Mendeteksi gas Amonia (bau busuk) | 1 unit |
| **Servo MG996R** | Pemilah sampah (menggerakkan tutup/sorter) | 1 unit |

---

## 🔌 2. Skema Pengabelan (Wiring Diagram)

### ESP32 ke Sensor/Aktuator
- **I2C Bus**:
    - SDA: `GPIO 21` → TCA9548A SDA
    - SCL: `GPIO 22` → TCA9548A SCL
    - *Channel Mux*: CH0 (ToF Organik), CH1 (ToF Anorganik)
- **Load Cell (HX711)**:
    - DT: `GPIO 18`
    - SCK: `GPIO 19`
- **Gas Sensor (MQ-137)**:
    - A0: `GPIO 34` (Analog)
- **Servo**:
    - Signal: `GPIO 15`
- **Power**:
    - ESP32 5V/GND ke Power Supply Eksternal (Disarankan 5V 2A terpisah)

### ESP32 ke Raspberry Pi
- **Serial Connection**:
    - ESP32 TX → RPi RX (GPIO 15 / Pin 10)
    - ESP32 RX → RPi TX (GPIO 14 / Pin 8)
    - ESP32 GND → RPi GND (Pin 6)
    - *Atau gunakan Kabel USB Data dari ESP32 langsung ke Port USB RPi.*

---

## 💻 3. Setup Perangkat Lunak

### Langkah 1: Flash ESP32
1.  Buka Arduino IDE.
2.  Install library: `Adafruit_VL53L0X`, `HX711`, `ArduinoJson`, `ESP32Servo`.
3.  Upload file `iot-scripts/ESP32_Firmware/ESP32_Firmware.ino`.
4.  **Kalibrasi**: Jika berat tidak akurat, sesuaikan nilai `LOADCELL_CALIBRATION_FACTOR`.

### Langkah 2: Setup Raspberry Pi (Edge AI)
1.  Install OS: Raspberry Pi OS (64-bit disarankan).
2.  Clone repository dan pindah ke folder `ai-model`.
3.  Install dependencies:
    ```bash
    pip install numpy opencv-python requests onnxruntime pyserial
    ```
4.  Jalankan Bridge AI:
    ```bash
    python ai_bridge_onnx.py --onnx best.onnx --uart-port /dev/ttyUSB0
    ```

### Langkah 3: Backend & Database
1.  Install Go 1.21+.
2.  Masuk ke direktori `backend`.
3.  Buat file `.env` (isi dengan kredensial DB dan Firebase).
4.  Jalankan backend:
    ```bash
    go run main.go
    ```

### Langkah 4: Web Dashboard
1.  Install Node.js 18+.
2.  Masuk ke `web-dashboard`.
3.  Jalankan perintah:
    ```bash
    npm install
    npm run dev
    ```

---

## 📲 4. Aplikasi Mobile (Flutter)
1.  Pastikan Flutter SDK sudah terinstal.
2.  Konfigurasi Firebase di folder `mobile_app`.
3.  Update `BASE_URL` API pada konfigurasi aplikasi ke alamat IP server/RPi Anda.
4.  Build & Run: `flutter run --release`.

---

## 🧪 5. Pengujian Sistem
1.  **Cek Telemetri**: Pastikan Dashboard menampilkan data Volume dan Berat dari sensor.
2.  **Cek AI**: Dekatkan sampah ke kamera, pastikan Servo bergerak ke arah yang benar (Organik/Anorganik).
3.  **Cek Notifikasi**: Paksa sensor ToF hingga jarak < 5cm (penuh), pastikan HP menerima notifikasi.

---
**Peringatan Keamanan**: Selalu gunakan Power Supply yang stabil untuk Servo MG996R karena lonjakan arusnya bisa membuat ESP32 restart jika menggunakan power dari USB laptop.
