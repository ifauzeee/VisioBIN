# 🔴 VisioBin Mobile App

Aplikasi mobile Flutter untuk monitoring tempat sampah VisioBin secara realtime oleh petugas lapangan.

## Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| Flutter | ≥ 3.11 | Framework cross-platform |
| Dart | — | Bahasa pemrograman |
| Provider | ^6.1.0 | State management |
| http | ^1.2.0 | REST API client |
| web_socket_channel | ^3.0.3 | WebSocket realtime |
| firebase_messaging | ^15.0.1 | Push notification (FCM) |
| fl_chart | ^1.2.0 | Grafik & chart |
| flutter_map | ^7.0.2 | Peta interaktif |
| google_fonts | ^8.1.0 | Tipografi |
| shared_preferences | ^2.5.2 | Local storage |

## Layar Aplikasi

| Layar | File | Deskripsi |
|---|---|---|
| Login | `login_screen.dart` | Autentikasi dengan JWT |
| Dashboard | `dashboard_screen.dart` | Overview realtime semua bin |
| Peta | `map_screen.dart` | Lokasi bin pada peta |
| History | `history_screen.dart` | Riwayat klasifikasi AI |
| Maintenance | `maintenance_screen.dart` | Log & tambah catatan perawatan |
| Chat | `chat_screen.dart` | Komunikasi antar peran (realtime) |
| Live Kamera | `live_camera_screen.dart` | Stream kamera Raspberry Pi |
| Settings | `settings_screen.dart` | Pengaturan akun & koneksi |
| Edit Profil | `edit_profile_screen.dart` | Update nama & password |

## Setup & Menjalankan

### 1. Install Dependencies
```bash
cd mobile_app
flutter pub get
```

### 2. Konfigurasi Firebase
- Buat project di [Firebase Console](https://console.firebase.google.com)
- Download `google-services.json` → taruh di `android/app/`
- Download `GoogleService-Info.plist` → taruh di `ios/Runner/`

### 3. Jalankan App
```bash
# Sesuaikan IP server backend
flutter run \
  --dart-define=API_BASE_URL=http://192.168.1.X:8082/api/v1 \
  --dart-define=WS_BASE_URL=ws://192.168.1.X:8082/ws \
  --dart-define=CAMERA_STREAM_URL=http://192.168.X.X:8000/stream
```

> **Tips:** Ganti `192.168.1.X` dengan IP aktual PC/server yang menjalankan backend. Pastikan mobile dan server berada di jaringan WiFi yang sama.

### 4. Build APK
```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=http://192.168.1.X:8082/api/v1 \
  --dart-define=WS_BASE_URL=ws://192.168.1.X:8082/ws
```

## Role Pengguna

| Role | Akses |
|---|---|
| `admin` | Full akses: CRUD bin, kelola user, semua fitur |
| `manager` | Monitor & analitik, chat, laporan |
| `technician` | Tambah maintenance log, monitor bin |
| `operator` | Monitor realtime, terima notifikasi |

> 📄 Konfigurasi lengkap di root [`README.md`](../README.md)
