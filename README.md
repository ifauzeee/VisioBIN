# 🗑️ VisioBin — Smart Waste Management System

**Rancang Bangun Purwarupa Smart Waste Management System Berbasis Edge AI dan Multi-Sensor Terintegrasi Web Dashboard dan Mobile App**

## Arsitektur

```
[Pi Camera] → [Raspberry Pi 4 / YOLOv5n] ←UART→ [ESP32 + Sensors + Servo]
                        │
                   HTTP/MQTT
                        ↓
              [Backend Golang + PostgreSQL]
                    ↙        ↘
        [Web Dashboard]    [Mobile App Flutter]
         (Next.js)           (FCM Push)
```

## Komponen

| Folder | Teknologi | Deskripsi |
|--------|-----------|-----------|
| `backend/` | Go, PostgreSQL | REST API, forecasting, FCM |
| `web-dashboard/` | Next.js | Admin monitoring dashboard |
| `mobile-app/` | Flutter | Notifikasi petugas |
| `ai-model/` | Python, YOLOv5n | Training & export model AI |
| `iot-simulator/` | Python | Simulasi data sensor |

## Quick Start (Backend)

```bash
cd backend
cp .env.example .env    # Edit konfigurasi DB
go mod download
go run cmd/server/main.go
```

## Uji Coba Sistem (End-to-End)

Untuk menguji alur pengiriman data dari perangkat IoT hingga muncul notifikasi di aplikasi mobile:

1.  **Jalankan Backend:** Pastikan server backend berjalan di port 8080.
2.  **Jalankan Mobile App:** Jalankan aplikasi Flutter di emulator atau HP fisik yang terhubung ke Firebase.
3.  **Jalankan Simulator IoT:**
    ```bash
    cd iot-simulator
    go run main.go -user <username> -pass <password> -scenario full-bin
    ```
4.  **Hasil:** Backend akan menerima data "sampah penuh", membuat Alert di database, dan mengirimkan Push Notification ke topik `visiobin_alerts` yang kemudian ditampilkan di aplikasi mobile.

## Tim

- Muhammad Ibnu Fauzi (2307422004)
- Dheo Rafi Ibrahimovic (2307422017)
- Muhammad Adian Hendrawan (2307422020)

**Dosen Pembimbing:** Dr. Prihatin Oktivasari, S.Si., M.Si

Program Studi Teknik Multimedia Dan Jaringan — Politeknik Negeri Jakarta — 2026
