# VisioBin Mobile App 📱

A modern Flutter application for monitoring waste bins, waste classification, and real-time team collaboration.

## 🚀 Features

- **Real-time Monitoring**: Track bin levels, ammonia gas, and status.
- **AI Classification**: View history of waste classification (Organic vs Inorganic).
- **Maintenance Logs**: Log and track bin repairs/maintenance.
- **Inter-role Chat**: Real-time communication between Admin, Manager, Technician, and Operator.
- **Push Notifications**: Integrated with Firebase for critical alerts.

## ⚙️ Setup & Configuration

### 1. Environment Configuration
VisioBin memakai satu `.env` di root project. Jalankan dari root:

```powershell
.\scripts\flutter_run_from_env.ps1
```

Script itu membaca `API_BASE_URL`, `WS_BASE_URL`, dan `CAMERA_STREAM_URL` dari root `.env`, lalu meneruskannya ke Flutter dengan `--dart-define`.

Jika perlu membuat env awal:
   ```bash
   cp ../.env.example ../.env
   ```

### 2. Dependencies
Install all required Flutter packages:
```bash
flutter pub get
```

### 3. Running the App
```bash
flutter run
```

## 🛠 Tech Stack
- **Framework**: Flutter (Dart)
- **State Management**: Provider
- **Networking**: Http & WebSocket (web_socket_channel)
- **UI Components**: Lucide Icons, Google Fonts, Framer-like animations
- **Real-time**: WebSocket & Firebase Cloud Messaging

---
© 2026 VisioBIN Team
