# 🗑️ VisioBin — Smart Waste Management System

> **Rancang Bangun Purwarupa Smart Waste Management System Berbasis Edge AI dan Multi-Sensor Terintegrasi Web Dashboard dan Mobile App**

[![Go](https://img.shields.io/badge/Backend-Go%201.21-00ADD8?logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Dashboard-Next.js-black?logo=next.js)](https://nextjs.org)
[![Flutter](https://img.shields.io/badge/Mobile-Flutter-02569B?logo=flutter)](https://flutter.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-336791?logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?logo=docker)](https://docker.com)

> ⚠️ **Satu `.env` untuk semua.** Seluruh konfigurasi (Backend, Dashboard, Mobile, AI, Docker) dibaca dari satu file `.env` di root project. Tidak ada `.env` terpisah di subfolder.

---

## 📋 Daftar Isi

- [Gambaran Sistem](#-gambaran-sistem)
- [Arsitektur](#-arsitektur)
- [Struktur Project](#-struktur-project)
- [Hardware & Sensor](#-hardware--sensor)
- [Prasyarat](#-prasyarat)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Cara Menjalankan](#-cara-menjalankan)
  - [1. Docker (Rekomendasi)](#1-docker-rekomendasi)
  - [2. Manual per Komponen](#2-manual-per-komponen)
- [API Reference](#-api-reference)
- [ESP32 — Testing & Kalibrasi](#-esp32--testing--kalibrasi)
- [AI Model](#-ai-model)
- [Tim](#-tim)

---

## 🌐 Gambaran Sistem

VisioBin adalah sistem tempat sampah pintar yang mampu:

- 🤖 **Mengklasifikasikan sampah** secara otomatis (Organik / Anorganik) menggunakan kamera + model YOLOv8 ONNX yang berjalan di Raspberry Pi
- 📊 **Memantau kondisi bin** secara realtime: tingkat kepenuhan (ToF sensor), berat (load cell), kadar gas amonia (MQ-137), baterai, dan sinyal WiFi
- 🔄 **Memilah sampah otomatis** via servo motor berdasarkan hasil klasifikasi AI
- 📱 **Mengirim notifikasi** ke petugas melalui mobile app (FCM) saat bin hampir penuh atau ada anomali
- 📈 **Menampilkan dashboard** analitik: grafik historis, prediksi kepenuhan, statistik klasifikasi, dan peta lokasi bin

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    LAPISAN HARDWARE (IoT)                   │
│                                                             │
│  [Pi Camera v2]                                             │
│       ↓ (CSI / USB)                                        │
│  [Raspberry Pi 4]  ←──── UART ────→  [ESP32 DevKit]        │
│   YOLOv8 ONNX                           ├─ VL53L0X x2 (ToF)│
│   uart_bridge.py                        ├─ HX711 (Berat)   │
│   ai_bridge_onnx.py                     ├─ MQ-137 (Gas)    │
│                                         └─ Servo Motor     │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP/REST
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAPISAN BACKEND                           │
│                                                             │
│  [Go API Server — Port 8082]                                │
│   ├─ REST API (chi router)                                  │
│   ├─ WebSocket Broadcaster                                  │
│   ├─ JWT Auth + API Key Auth                                │
│   ├─ Background Worker (heartbeat, retention)               │
│   └─ Firebase FCM (push notification)                       │
│                                                             │
│  [PostgreSQL 15 — Port 5433]                                │
│   └─ bins, sensor_readings, classification_logs,            │
│      alerts, users, maintenance_logs, chat_messages         │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
                ↓                               ↓
┌───────────────────────┐       ┌───────────────────────────┐
│   Web Dashboard       │       │   Mobile App              │
│   Next.js — Port 3000 │       │   Flutter (Android/iOS)   │
│   ├─ Ringkasan        │       │   ├─ Dashboard realtime   │
│   ├─ Pemantauan bin   │       │   ├─ Peta lokasi bin      │
│   ├─ Analitik         │       │   ├─ History klasifikasi  │
│   ├─ Peta             │       │   ├─ Chat antar peran     │
│   ├─ Laporan & CSV    │       │   ├─ Maintenance log      │
│   ├─ Maintenance      │       │   └─ Push notification    │
│   ├─ Chat tim         │       └───────────────────────────┘
│   └─ Manajemen tim    │
└───────────────────────┘
```

---

## 📁 Struktur Project

```
VisioBIN/
├── .env                    # ⚙️  Konfigurasi terpusat (satu file untuk semua)
├── .env.example            # 📋 Template konfigurasi
├── docker-compose.yml      # 🐳 Orkestrasi semua service
│
├── backend/                # 🔵 Go REST API
│   ├── cmd/server/         #    Entry point (main.go)
│   ├── internal/
│   │   ├── config/         #    Konfigurasi & env loader
│   │   ├── database/       #    Koneksi PostgreSQL (pgx)
│   │   ├── handlers/       #    HTTP handler (auth, bins, chat, maintenance)
│   │   ├── middleware/      #    JWT auth, API key auth, CORS, logger
│   │   ├── models/         #    Struct data (Bin, SensorReading, User, dll)
│   │   ├── repository/     #    Query database
│   │   ├── router/         #    Definisi route API
│   │   └── services/       #    Business logic (forecast, notif, broadcast)
│   ├── migrations/         #    SQL migration 001–005
│   └── Dockerfile
│
├── web-dashboard/          # 🟢 Next.js Admin Dashboard
│   └── src/app/
│       ├── (dashboard)/    #    Halaman-halaman dashboard:
│       │   ├── ringkasan/  #    Overview & statistik
│       │   ├── pemantauan/ #    Monitor bin realtime
│       │   ├── analitik/   #    Grafik & tren
│       │   ├── peta/       #    Peta lokasi bin
│       │   ├── laporan/    #    Export CSV
│       │   ├── maint/      #    Log maintenance
│       │   ├── chat/       #    Chat antar peran
│       │   ├── perangkat/  #    Manajemen ESP32/bin
│       │   ├── stasiun/    #    Stasiun monitoring
│       │   ├── team/       #    Manajemen pengguna
│       │   └── config/     #    Pengaturan sistem
│       └── apidocs/        #    Dokumentasi API interaktif
│
├── mobile_app/             # 🔴 Flutter Mobile App
│   └── lib/
│       ├── screens/        #    10 layar UI
│       ├── providers/      #    State management (Provider)
│       ├── services/       #    API & WebSocket client
│       ├── models/         #    Data models
│       └── widgets/        #    Komponen reusable
│
├── ai-model/               # 🧠 Python AI (YOLOv8 ONNX)
│   ├── best.pt             #    Model PyTorch (YOLOv8)
│   ├── best.onnx           #    Model ONNX (untuk Raspberry Pi)
│   ├── ai_bridge_onnx.py   #    Bridge kamera → AI → ESP32
│   ├── uart_bridge.py      #    Bridge UART ESP32 → Backend
│   └── test_images/        #    Gambar uji inferensi
│
└── iot-scripts/            # 🟡 Arduino / ESP32
    ├── ESP32_Firmware/     #    Firmware utama (produksi)
    ├── ESP32_Calibration/  #    Kalibrasi Load Cell HX711
    └── ESP32_Test/         #    Test per sensor (lihat README di dalamnya)
        ├── Hardware_Test/
        ├── Test_TCA9548A/
        ├── Test_VL53L0X_Organic/
        ├── Test_VL53L0X_Inorganic/
        ├── Test_HX711/
        ├── Test_MQ137/
        └── Test_Servo/
```

---

## ⚙️ Hardware & Sensor

### Komponen yang Digunakan

| Komponen | Model | Fungsi | Pin ESP32 |
|---|---|---|---|
| Mikrokontroler | ESP32 DevKit V1 | Controller utama | — |
| Single Board Computer | Raspberry Pi 4 (4GB) | Edge AI + Backend relay | — |
| Kamera | Pi Camera v2 / USB Webcam | Input klasifikasi sampah | CSI / USB |
| Sensor Jarak (Organik) | VL53L0X | Kepenuhan bin organik | I2C via TCA9548A Ch.0 |
| Sensor Jarak (Anorganik) | VL53L0X | Kepenuhan bin anorganik | I2C via TCA9548A Ch.1 |
| I2C Multiplexer | TCA9548A | Mengelola 2x VL53L0X | SDA=D21, SCL=D22 |
| Sensor Berat | HX711 + Load Cell | Berat sampah | DT=D18, SCK=D19 |
| Sensor Gas | MQ-137 | Kadar amonia (NH₃) | GPIO34 (Analog) |
| Servo Motor | SG90 / MG996R | Pemilah sampah otomatis | D15 |
| LED Status | Built-in LED | Indikator status firmware | D2 |

### Wiring Ringkas

```
ESP32          →   Komponen
────────────────────────────────
D21 (SDA)      →   TCA9548A SDA
D22 (SCL)      →   TCA9548A SCL
TCA Ch.0       →   VL53L0X (Organik)
TCA Ch.1       →   VL53L0X (Anorganik)
D18            →   HX711 DT
D19            →   HX711 SCK
GPIO34         →   MQ-137 A0
D15            →   Servo Signal
────────────────────────────────
Supply: VL53L0X & TCA → 3.3V
        HX711          → 3.3V atau 5V
        MQ-137 & Servo → 5V (WAJIB)
```

> 📄 Panduan test hardware per sensor: [`iot-scripts/ESP32_Test/README.md`](iot-scripts/ESP32_Test/README.md)

---

## ✅ Prasyarat

### Software

| Software | Versi | Digunakan untuk |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | ≥ 27 | Menjalankan semua service |
| [Go](https://golang.org/dl/) | ≥ 1.21 | Backend (opsional, jika tanpa Docker) |
| [Node.js](https://nodejs.org/) | ≥ 18 | Web dashboard dev server |
| [Flutter SDK](https://flutter.dev/docs/get-started/install) | ≥ 3.11 | Mobile app |
| [Python](https://python.org) | ≥ 3.9 | AI model (Raspberry Pi) |
| [Arduino IDE](https://www.arduino.cc/en/software) | ≥ 2.x | Upload firmware ESP32 |

### Arduino Libraries (Install via Library Manager)

| Library | Author | Untuk |
|---|---|---|
| Adafruit VL53L0X | Adafruit | Sensor ToF |
| HX711 | Bogdan Necula | Load Cell |
| ESP32Servo | Kevin Harrington | Servo |
| ArduinoJson | Benoit Blanchon | JSON serialization |

---

## ⚙️ Konfigurasi Environment

Semua konfigurasi runtime disimpan di **satu file** `.env` di root project. Salin dari template:

```bash
cp .env.example .env
```

Variabel penting yang perlu disesuaikan:

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres        # Ganti di production!
DB_NAME=visiobin

# Backend
BACKEND_PORT=8082           # Port backend API
JWT_SECRET=...              # Ganti dengan string random yang kuat
API_KEY=visiobin-iot-secret-key  # API key untuk ESP32/Raspberry Pi

# Web Dashboard
NEXT_PUBLIC_API_URL=http://localhost:8082/api/v1
DASHBOARD_PORT=3000

# Mobile App (sesuaikan IP server)
API_BASE_URL=http://192.168.1.X:8082/api/v1
WS_BASE_URL=ws://192.168.1.X:8082/ws

# Raspberry Pi / AI
CAMERA_STREAM_URL=http://192.168.X.X:8000/stream
VISIOBIN_UART_PORT=/dev/ttyUSB0   # Port USB ESP32 di Raspberry Pi
VISIOBIN_BIN_ID=VBIN-01           # ID bin yang terhubung
```

> ⚠️ **Jangan commit file `.env`** ke Git — sudah ada di `.gitignore`.

---

## 🚀 Cara Menjalankan

### 1. Docker (Rekomendasi)

Jalankan seluruh stack (Backend + Database + Dashboard + Adminer) dengan satu perintah:

```bash
# Clone project
git clone https://github.com/ifauzeee/VisioBIN.git
cd VisioBIN

# Salin dan edit konfigurasi
cp .env.example .env

# Jalankan semua service
docker compose up -d
```

Service yang berjalan:

| Service | URL | Keterangan |
|---|---|---|
| Backend API | http://localhost:8082 | REST API + WebSocket |
| Web Dashboard | http://localhost:3000 | Admin dashboard |
| Adminer (DB GUI) | http://localhost:8081 | Manajemen database |
| PostgreSQL | localhost:5433 | Database (internal) |

Cek status:
```bash
docker compose ps
docker compose logs backend   # Log backend
docker compose logs -f        # Semua log (live)
```

Stop semua:
```bash
docker compose down
```

---

### 2. Manual per Komponen

#### 🔵 Backend (Go)

```bash
cd backend
go mod download
go run cmd/server/main.go
```

Test health check:
```bash
curl http://localhost:8082/health
```

#### 🟢 Web Dashboard (Next.js)

```bash
cd web-dashboard
npm install
npm run dev
```

Buka: http://localhost:3000

#### 🔴 Mobile App (Flutter)

```bash
cd mobile_app
flutter pub get

# Jalankan dengan env dari root .env
flutter run \
  --dart-define=API_BASE_URL=http://192.168.1.X:8082/api/v1 \
  --dart-define=WS_BASE_URL=ws://192.168.1.X:8082/ws
```

#### 🧠 AI Model (Raspberry Pi)

```bash
cd ai-model
pip install -r requirements.txt   # jika ada, atau install manual

# Jalankan UART bridge (ESP32 → Backend)
python uart_bridge.py

# Jalankan AI bridge (Kamera → AI → ESP32)
python ai_bridge_onnx.py --onnx best.onnx --capture
```

#### 🟡 Upload Firmware ESP32

1. Buka `iot-scripts/ESP32_Firmware/ESP32_Firmware.ino` di Arduino IDE
2. Pilih board: **ESP32 Dev Module**
3. Pilih port COM yang sesuai
4. Upload

---

## 📡 API Reference

### Base URL
```
http://localhost:8082
```

### Autentikasi

**Login** — Mendapatkan JWT token:
```bash
POST /api/v1/auth/login
Content-Type: application/json

{"username": "admin", "password": "Admin123"}
```

**Akun default:**
| Username | Password | Role |
|---|---|---|
| `admin` | `Admin123` | admin |

Gunakan token di header untuk endpoint yang memerlukan autentikasi:
```
Authorization: Bearer <token>
```

---

### Endpoint Utama

#### Health Check
```
GET /health
```

#### Auth
```
POST /api/v1/auth/login          # Login
POST /api/v1/auth/register       # Registrasi (password min 8 char, harus ada huruf besar, kecil, angka)
POST /api/v1/auth/guest-login    # Login sebagai tamu (read-only)
POST /api/v1/auth/refresh        # Refresh JWT token
PUT  /api/v1/auth/fcm-token      # Update FCM token untuk push notif
PUT  /api/v1/auth/profile        # Update profil
GET  /api/v1/auth/users          # Daftar pengguna (admin/operator)
DELETE /api/v1/auth/users/{id}   # Hapus pengguna (admin)
PUT  /api/v1/auth/users/{id}/role # Ubah role pengguna (admin)
```

#### Bins (Tempat Sampah)
```
GET    /api/v1/bins              # Daftar semua bin
GET    /api/v1/bins/{id}         # Detail satu bin
POST   /api/v1/bins              # Tambah bin baru (admin/technician)
PUT    /api/v1/bins/{id}         # Update bin (admin/technician)
DELETE /api/v1/bins/{id}         # Hapus bin (admin/technician)
GET    /api/v1/bins/{id}/history # History sensor 24 jam terakhir
GET    /api/v1/bins/{id}/forecast # Prediksi kapan bin penuh
```

#### Telemetry (IoT Data Ingest)
```
POST /api/v1/telemetry
X-API-Key: <api_key_bin>
Content-Type: application/json

# Format dari ESP32 Firmware (field pendek):
{
  "bin_id": "<uuid-bin>",
  "dist_org": 25.5,        // jarak ke sampah organik (cm)
  "dist_inorg": 18.2,      // jarak ke sampah anorganik (cm)
  "weight_org": 1.2,       // berat organik (kg)
  "weight_inorg": 0.8,     // berat anorganik (kg)
  "gas_ppm": 12.5,         // kadar amonia (PPM)
  "battery_pct": 87,       // baterai ESP32 (%)
  "wifi_rssi_dbm": -52     // sinyal WiFi (dBm)
}
```

#### Klasifikasi AI
```
POST /api/v1/classifications
X-API-Key: <api_key_bin>
Content-Type: application/json

{
  "bin_id": "<uuid-bin>",
  "predicted_class": "organic",   # atau "inorganic"
  "confidence": 0.94,
  "inference_time_ms": 125
}
```

#### Dashboard & Analytics
```
GET /api/v1/dashboard/summary    # Ringkasan: total bin, alerts, klasifikasi hari ini
GET /api/v1/telemetry            # Semua data telemetry (paginated)
GET /api/v1/classifications      # History klasifikasi AI (paginated)
GET /api/v1/classifications/export # Export ke CSV
GET /api/v1/alerts               # Daftar alerts
PUT /api/v1/alerts/{id}/read     # Tandai alert sudah dibaca
```

#### Maintenance & Chat
```
GET    /api/v1/maintenance       # Log maintenance
POST   /api/v1/maintenance       # Tambah log maintenance
DELETE /api/v1/maintenance/{id}  # Hapus log maintenance
POST   /api/v1/chat/             # Kirim pesan chat
GET    /api/v1/chat/history      # Riwayat chat
```

#### WebSocket
```
GET /ws                          # WebSocket realtime (butuh JWT)
```

Event yang dikirim server:
```json
{"event": "telemetry_updated", "data": {...}}
{"event": "classification_logged", "data": {...}}
```

---

## 🔌 ESP32 — Testing & Kalibrasi

Sebelum memasang ke fisik tempat sampah, uji setiap sensor secara terpisah.

> 📄 **Panduan lengkap:** [`iot-scripts/ESP32_Test/README.md`](iot-scripts/ESP32_Test/README.md)

### Urutan Testing
```
1. Test_TCA9548A       → Pastikan I2C multiplexer terdeteksi
2. Test_VL53L0X_Organic    → Test sensor jarak kompartemen organik
3. Test_VL53L0X_Inorganic  → Test sensor jarak kompartemen anorganik
4. Test_HX711          → Test load cell + kalibrasi berat
5. Test_MQ137          → Test sensor gas (warm-up 60 detik!)
6. Test_Servo          → Test servo sorter
7. Hardware_Test       → Test semua sekaligus (validasi akhir)
8. ESP32_Firmware      → Upload firmware produksi
```

### Kalibrasi Load Cell
```
iot-scripts/ESP32_Calibration/LoadCell_Calibrator/LoadCell_Calibrator.ino
```
1. Upload sketch kalibrasi
2. Kosongkan load cell → tare otomatis
3. Letakkan benda diketahui beratnya (mis. 500g)
4. Ketik `0.5` di Serial Monitor → catat **Calibration Factor**
5. Update `loadcellCalibrationFactor` di `ESP32_Firmware.ino`

---

## 🧠 AI Model

Model: **YOLOv8n Classification** (dieksport ke ONNX untuk inferensi di Raspberry Pi)

| File | Ukuran | Format |
|---|---|---|
| `ai-model/best.pt` | ~8.1 MB | PyTorch (training/development) |
| `ai-model/best.onnx` | ~16.7 MB | ONNX (produksi Raspberry Pi) |

### Menjalankan AI di Raspberry Pi

```bash
cd ai-model

# Test inferensi dengan gambar statis
python test_inference.py

# Live dengan kamera (mode produksi)
python ai_bridge_onnx.py --onnx best.onnx --capture

# Dengan UART ke ESP32
python ai_bridge_onnx.py --onnx best.onnx \
  --uart-port /dev/ttyUSB0 \
  --capture

# Stream kamera ke web (untuk monitoring)
python stream_server.py
```

### Kelas Output

| Output AI | Perintah ke ESP32 | Servo |
|---|---|---|
| `organic` / `organik` | `CLASSIFY:ORGANIC\n` | Gerak ke 45° |
| `inorganic` / `anorganik` | `CLASSIFY:INORGANIC\n` | Gerak ke 135° |

---

## 👥 Tim

| Nama | NIM | Tanggung Jawab |
|---|---|---|
| **Muhammad Ibnu Fauzi** | 2307422004 | Backend API (Go), Web Dashboard (Next.js), Mobile App (Flutter), AI Model & Raspberry Pi, Docker & DevOps, IoT Firmware ESP32, Integrasi sistem end-to-end |
| Dheo Rafi Ibrahimovic | 2307422017 | Hardware & Perakitan Fisik |
| Muhammad Adian Hendrawan | 2307422020 | Hardware & Perakitan Fisik |

**Dosen Pembimbing:** Dr. Prihatin Oktivasari, S.Si., M.Si

**Program Studi:** Teknik Multimedia Dan Jaringan  
**Institusi:** Politeknik Negeri Jakarta  
**Tahun:** 2026

---

<div align="center">
  <sub>VisioBin — Smart Waste Management System © 2026</sub>
</div>
