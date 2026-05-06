# 📡 VisioBin IoT Simulator

Simulator perangkat IoT untuk menguji integrasi backend dan aplikasi mobile tanpa memerlukan perangkat keras fisik. Simulator ini mensimulasikan pembacaan sensor ultrasonik (volume), load cell (berat), dan sensor gas MQ-135 (amonia).

## Fitur
- Simulasi banyak bin sekaligus (berdasarkan data di database).
- Mendukung skenario khusus (sampah penuh, lonjakan gas).
- Otentikasi menggunakan akun user backend.
- Pengambilan API Key otomatis untuk setiap bin.

## Penggunaan

Pastikan backend sedang berjalan sebelum menjalankan simulator.

### Menjalankan Simulator
```bash
go run main.go -user <username> -pass <password>
```

### Opsi Flag
| Flag | Default | Deskripsi |
|------|---------|-----------|
| `-user` | (wajib) | Username untuk login ke backend |
| `-pass` | (wajib) | Password untuk login ke backend |
| `-url` | `http://localhost:8080/api/v1` | Base URL API Backend |
| `-interval` | `10` | Jeda waktu antar pengiriman data (detik) |
| `-scenario` | `default` | Skenario: `default`, `full-bin`, `gas-spike` |
| `-fast` | `false` | Mode cepat (interval 2 detik) |

### Contoh Skenario
Untuk menguji **Push Notification**, gunakan skenario `full-bin`:
```bash
go run main.go -user admin -pass admin123 -scenario full-bin
```
Skenario ini akan memaksa bin pertama untuk mengirimkan data volume > 95% yang akan memicu alert dan notifikasi di aplikasi mobile.
