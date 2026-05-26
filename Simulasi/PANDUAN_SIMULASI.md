# 📡 Visiobin — Panduan Simulasi Gangguan Jaringan
## Tugas Perancangan Monitoring & Management Sistem

---

## 📁 File yang Disediakan

| File | Fungsi |
|------|--------|
| `simulasi_visiobin.py` | Script Python lengkap — semua 4 skenario |
| `demo_presentasi.sh` | Script bash interaktif — menu untuk demo live |

---

## ⚙️ Persiapan (1x saja)

### 1. Pastikan backend sudah jalan
```bash
cd /path/ke/project/visiobin
docker compose up -d
docker compose ps        # semua harus "running"
```

### 2. Salin file simulasi ke folder project
```bash
cp simulasi_visiobin.py /path/ke/project/visiobin/
cp demo_presentasi.sh   /path/ke/project/visiobin/
chmod +x demo_presentasi.sh
```

### 3. Set environment (sesuaikan dengan .env kamu)
```bash
export VISIOBIN_USER="admin"       # username admin yang terdaftar
export VISIOBIN_PASS="admin123"    # password-nya
export VISIOBIN_API="http://localhost:8080/api/v1"
export API_KEY="visiobin-iot-secret-key"   # dari .env kamu
```

Atau langsung pakai argumen:
```bash
python3 simulasi_visiobin.py --user admin --pass admin123
```

### 4. Cek koneksi dulu
```bash
python3 simulasi_visiobin.py --setup
```
Output yang benar:
```
✅  Login berhasil!
✅  Ditemukan 3 bin terdaftar
✅  KONEKSI BERHASIL!
```

---

## 🎬 Cara Pakai untuk Presentasi

### Opsi A — Script interaktif (DIREKOMENDASIKAN untuk demo ke dosen)
```bash
bash demo_presentasi.sh
```
Akan muncul menu, tinggal ketik angka:
- `1` → telemetri normal
- `2` → sensor offline
- `3` → packet loss  
- `4` → gateway down
- `5` → bin hampir penuh
- `6` → cek status & alert

### Opsi B — Python semua skenario otomatis
```bash
python3 simulasi_visiobin.py --semua
```

### Opsi C — Python skenario tertentu saja
```bash
python3 simulasi_visiobin.py --skenario 1   # sensor offline
python3 simulasi_visiobin.py --skenario 2   # delay tinggi
python3 simulasi_visiobin.py --skenario 3   # packet loss
python3 simulasi_visiobin.py --skenario 4   # gateway down
python3 simulasi_visiobin.py --skenario 5   # trafik abnormal
```

### Opsi D — Live monitor (buka di terminal terpisah)
```bash
python3 simulasi_visiobin.py --monitor
```

---

## 🎯 Skenario Gangguan & Bukti yang Ditunjukkan

### Skenario 1: Sensor Offline / Bin Down
**Apa yang terjadi:** Bin berhenti mengirim data (simulasi ESP32 mati/WiFi putus)  
**Deteksi:** Background worker backend (setiap 1 menit) → jika >5 menit tidak aktif → status diubah `offline`  
**Bukti ke dosen:**
```bash
# Terminal 1 — jalankan simulasi
python3 simulasi_visiobin.py --skenario 1

# Terminal 2 — lihat log backend
docker logs -f $(docker compose ps -q backend) | grep -i "offline\|worker"

# Terminal 3 — cek status bin lewat API
watch -n 5 "curl -s http://localhost:8080/api/v1/bins -H 'Authorization: Bearer TOKEN' | python3 -m json.tool | grep -A2 status"
```
**Yang terlihat di dashboard:** Status bin berubah merah (offline)

---

### Skenario 2: Delay Tinggi
**Apa yang terjadi:** Pengiriman data lambat (simulasi jaringan congested)  
**Deteksi:** Perbandingan response time normal vs delay  
**Bukti ke dosen:**
```bash
python3 simulasi_visiobin.py --skenario 2
```
Output akan menunjukkan tabel perbandingan:
```
Normal   : 45ms
Terganggu: 2,800ms  (62× lebih lambat)
```

---

### Skenario 3: Packet Loss
**Apa yang terjadi:** ~30-60% paket data hilang (WiFi RSSI < -80dBm)  
**Deteksi:** Grafik sensor menunjukkan gap/lompatan  
**Bukti ke dosen:**
```bash
python3 simulasi_visiobin.py --skenario 3
```
Buka dashboard → Grafik Sensor → lihat data tidak kontinu

---

### Skenario 4: Gateway Down
**Apa yang terjadi:** Backend tidak bisa diakses sama sekali  
**Deteksi:** Semua request gagal `connection refused`  
**Bukti ke dosen (DEMO NYATA — paling impresif):**
```bash
# Matikan backend
docker compose stop backend

# Lihat semua request gagal
for i in {1..5}; do
  echo -n "Request $i: "
  curl -sf -o /dev/null -w "HTTP %{http_code}\n" \
    http://localhost:8080/api/v1/dashboard/summary || echo "CONNECTION REFUSED"
  sleep 2
done

# Hidupkan lagi
docker compose start backend
echo "Backend kembali online!"
```

---

### Skenario 5: Trafik Abnormal (Bonus)
**Apa yang terjadi:** Volume bin naik ekstrem → trigger alert + FCM notif  
**Deteksi:** ForecastService deteksi fill rate anomali → buat alert  
**Bukti ke dosen:**
```bash
python3 simulasi_visiobin.py --skenario 5

# Cek alert yang terpicu
curl -s "http://localhost:8080/api/v1/alerts" \
  -H "Authorization: Bearer TOKEN" | python3 -m json.tool
```

---

## 🔍 Perintah Monitoring Tambahan (Berguna saat Presentasi)

```bash
# Lihat log backend real-time
docker logs -f $(docker compose ps -q backend)

# Cek status semua container
docker compose ps

# Query langsung ke database PostgreSQL
docker compose exec postgres psql -U postgres -d visiobin -c \
  "SELECT id, name, status, last_seen FROM bins ORDER BY last_seen DESC;"

# Lihat alert terbaru di DB
docker compose exec postgres psql -U postgres -d visiobin -c \
  "SELECT bin_id, alert_type, severity, message, created_at FROM alerts ORDER BY created_at DESC LIMIT 10;"

# Lihat telemetri terbaru
docker compose exec postgres psql -U postgres -d visiobin -c \
  "SELECT bin_id, volume_organic_pct, volume_inorganic_pct, gas_amonia_ppm, recorded_at FROM sensor_readings ORDER BY recorded_at DESC LIMIT 10;"
```

---

## 🗂️ Mapping ke ISO FCAPS

| Skenario Simulasi | ISO Management | Parameter |
|-------------------|---------------|-----------|
| Sensor Offline | **Fault Management** | Device uptime, last_seen |
| Delay Tinggi | **Performance Management** | Latency, response time |
| Packet Loss | **Performance Management** | Packet loss %, data integrity |
| Gateway Down | **Fault Management** | Service availability |
| Bin Hampir Penuh | **Accounting Management** | Resource usage (volume %) |
| Auth JWT + API Key | **Security Management** | Akses ilegal |
| Config bin di dashboard | **Configuration Management** | Pendataan device |

---

## ❓ Troubleshooting

**Login gagal:**
- Cek username/password: `docker compose exec postgres psql -U postgres -d visiobin -c "SELECT username, role FROM users;"`
- Register user baru lewat API atau dashboard

**Tidak ada bin:**
- Buat bin dulu lewat dashboard admin atau:
  ```bash
  curl -X POST http://localhost:8080/api/v1/bins \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Bin Demo","location":"Lab","max_volume_cm":50,"max_weight_kg":20}'
  ```

**API_KEY salah:**
- Lihat di `.env`: nilai `API_KEY=...`
- Atau ambil dari database: `SELECT id, name, api_key FROM bins LIMIT 5;`
