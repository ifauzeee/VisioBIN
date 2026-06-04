# 🔵 VisioBin Backend API

REST API untuk sistem Smart Waste Management VisioBin. Dibangun dengan Go, PostgreSQL, WebSocket, dan Firebase FCM.

## Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| Go | 1.21 | Bahasa pemrograman |
| chi | v5 | HTTP router |
| pgx | v5 | PostgreSQL driver |
| golang-jwt | v5 | JWT authentication |
| gorilla/websocket | v1.5 | WebSocket |
| Firebase Admin SDK | v4 | Push notification (FCM) |
| bcrypt | — | Password hashing |

## Struktur

```
backend/
├── cmd/server/main.go      # Entry point
├── internal/
│   ├── config/             # Env loader
│   ├── database/           # Koneksi pgx pool
│   ├── handlers/           # HTTP handlers
│   │   ├── auth.go         # Login, register, user management
│   │   ├── bins.go         # Bin CRUD, telemetry, klasifikasi, dashboard
│   │   ├── chat.go         # Chat antar peran
│   │   └── maintenance.go  # Log maintenance
│   ├── middleware/         # JWT, API key, CORS, logger, recoverer
│   ├── models/             # Struct data semua entitas
│   ├── repository/         # Query SQL ke PostgreSQL
│   ├── router/             # Setup semua route API
│   └── services/
│       ├── broadcaster.go  # WebSocket broadcast
│       ├── dashboard.go    # Query dashboard summary
│       ├── forecast.go     # Prediksi kepenuhan + threshold check
│       └── notification.go # FCM push notification
├── migrations/
│   ├── 001_init.sql        # Schema utama + seed admin + 2 bin
│   ├── 002_maintenance_logs.sql
│   ├── 003_iot_updates.sql # api_key & last_seen di tabel bins
│   ├── 003_battery_wifi.sql # battery_pct & wifi_rssi_dbm
│   ├── 004_chat_system.sql
│   └── 005_private_chat.sql
└── Dockerfile
```

## Menjalankan

### Via Docker (Rekomendasi)
```bash
# Dari root project
docker compose up -d backend
```

### Manual
```bash
cd backend
go mod download
go run cmd/server/main.go
```

## Endpoint Ringkas

```
GET  /health                          Health check
POST /api/v1/auth/login               Login
POST /api/v1/auth/register            Registrasi
GET  /api/v1/bins                     Daftar bin (JWT)
POST /api/v1/telemetry                Ingest data sensor (API Key)
POST /api/v1/classifications          Log klasifikasi AI (API Key)
GET  /api/v1/dashboard/summary        Ringkasan dashboard (JWT)
GET  /api/v1/alerts                   Daftar alerts (JWT)
GET  /api/v1/classifications/export   Export CSV (JWT)
GET  /ws                              WebSocket realtime (JWT)
```

> 📄 Dokumentasi lengkap ada di root [`README.md`](../README.md#-api-reference)

## Format Telemetry dari ESP32

Backend menerima **dua format** field name dari IoT:

```json
// Format pendek (ESP32 Firmware)
{"bin_id":"...", "dist_org":25.5, "dist_inorg":18.2, "gas_ppm":12.5, ...}

// Format panjang (Dashboard / manual)
{"bin_id":"...", "distance_organic_cm":25.5, "distance_inorganic_cm":18.2, ...}
```

## Akun Default

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin123` | admin |

> Password harus minimal 8 karakter, ada huruf besar, kecil, dan angka.

## Environment Variables

Semua env dibaca dari root `.env`. Lihat [`../.env.example`](../.env.example) untuk referensi lengkap.
