# 📚 VisioBin API Documentation

Dokumentasi ini menggunakan spesifikasi **OpenAPI 3.0.3**. 

## Cara Melihat Dokumentasi

### 1. Swagger UI (Online)
Anda bisa menyalin isi dari `openapi.yaml` dan menempelkannya ke [Swagger Editor](https://editor.swagger.io/).

### 2. VS Code Extension
Gunakan ekstensi **"Swagger Viewer"** atau **"OpenAPI (Swagger) Editor"** di VS Code untuk melihat preview dokumentasi secara langsung dengan menekan `Alt + Shift + P`.

### 3. Redocly (CLI)
Jika Anda memiliki Node.js, Anda bisa menjalankan:
```bash
npx @redocly/cli preview-docs openapi.yaml
```

## Struktur API

*   **Authentication**: Menggunakan JWT (Bearer Token).
*   **IoT Ingestion**: Menggunakan API Key (`X-API-Key`) untuk keamanan perangkat Raspberry Pi dan ESP32.
*   **Endpoints**:
    *   `/api/v1/telemetry`: Data sensor mentah.
    *   `/api/v1/classifications`: Data hasil sortir AI.
    *   `/api/v1/bins`: Manajemen unit tempat sampah.
    *   `/api/v1/alerts`: Sistem peringatan otomatis.
