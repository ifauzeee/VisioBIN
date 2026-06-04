# 🟢 VisioBin Web Dashboard

Admin dashboard untuk monitoring dan manajemen sistem VisioBin. Dibangun dengan Next.js (App Router).

## Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 14+ | Framework React (App Router) |
| React | 18+ | UI library |
| WebSocket | Native | Data realtime |
| next-intl | — | Internasionalisasi (id/en) |

## Halaman Dashboard

| Halaman | Route | Deskripsi |
|---|---|---|
| Ringkasan | `/ringkasan` | Overview: total bin, alert aktif, statistik hari ini |
| Pemantauan | `/pemantauan` | Monitor realtime semua sensor setiap bin |
| Analitik | `/analitik` | Grafik historis kepenuhan, berat, gas, klasifikasi |
| Peta | `/peta` | Lokasi bin pada peta interaktif |
| Laporan | `/laporan` | Export data ke CSV |
| Maintenance | `/maint` | Log & riwayat perawatan bin |
| Chat | `/chat` | Komunikasi realtime antar peran |
| Perangkat | `/perangkat` | Manajemen ESP32 dan bin |
| Team | `/team` | Manajemen pengguna dan role |
| Config | `/config` | Pengaturan sistem |

## Menjalankan

### Via Docker
```bash
# Dari root project
docker compose up -d dashboard
```

### Dev Server (Hot Reload)
```bash
cd web-dashboard
npm install
npm run dev
```

Buka: http://localhost:3000

### Build Production
```bash
npm run build
npm start
```

## Environment Variables

Dibaca otomatis dari root `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8082/api/v1
CAMERA_STREAM_URL=http://192.168.X.X:8000/stream
DASHBOARD_PORT=3000
```

> 📄 Konfigurasi lengkap di root [`README.md`](../README.md)
