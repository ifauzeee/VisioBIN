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
This project uses `.env` for configuration.
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update the `API_BASE_URL` and `WS_BASE_URL` in `.env` with your backend server address.
   - **Android Emulator**: Use `http://10.0.2.2:8080/api/v1`
   - **Physical Device**: Use your computer's local IP (e.g., `http://192.168.1.3:8080/api/v1`)

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
