# Visiobin - Panduan Simulasi Windows Lokal

Gunakan panduan ini kalau terminal kamu PowerShell atau Command Prompt di Windows.

## 1. Pastikan container jalan

Jalankan dari root project:

```powershell
cd C:\Users\Ifauze\Project\VisioBIN
docker compose up -d
docker compose ps
```

## 2. Demo interaktif PowerShell

```powershell
cd C:\Users\Ifauze\Project\VisioBIN\Simulasi
.\demo_presentasi.ps1 -User ibnu -Password "PASSWORD_KAMU" -ApiUrl http://localhost:8080/api/v1 -ApiKey visiobin-iot-secret-key
```

Jika PowerShell menolak script karena execution policy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\demo_presentasi.ps1 -User ibnu -Password "PASSWORD_KAMU"
```

## 3. Demo interaktif CMD

```cmd
cd C:\Users\Ifauze\Project\VisioBIN\Simulasi
demo_presentasi.cmd -User ibnu -Password "PASSWORD_KAMU" -ApiUrl http://localhost:8080/api/v1 -ApiKey visiobin-iot-secret-key
```

## 4. Jalankan Python langsung

Di Windows pakai `py`, bukan `python3`.

```powershell
cd C:\Users\Ifauze\Project\VisioBIN\Simulasi
py .\simulasi_visiobin.py --setup --user ibnu --pass "PASSWORD_KAMU"
py .\simulasi_visiobin.py --normal --user ibnu --pass "PASSWORD_KAMU"
py .\simulasi_visiobin.py --status --user ibnu --pass "PASSWORD_KAMU"
py .\simulasi_visiobin.py --monitor --user ibnu --pass "PASSWORD_KAMU"
py .\simulasi_visiobin.py --semua --user ibnu --pass "PASSWORD_KAMU"
```

## 5. Environment variable

PowerShell:

```powershell
$env:VISIOBIN_USER="ibnu"
$env:VISIOBIN_PASS="PASSWORD_KAMU"
$env:VISIOBIN_API="http://localhost:8080/api/v1"
$env:API_KEY="visiobin-iot-secret-key"
```

CMD:

```cmd
set VISIOBIN_USER=ibnu
set VISIOBIN_PASS=PASSWORD_KAMU
set VISIOBIN_API=http://localhost:8080/api/v1
set API_KEY=visiobin-iot-secret-key
```

## 6. Monitoring log backend

PowerShell:

```powershell
docker compose logs -f backend | Select-String -Pattern "offline|worker"
```

CMD:

```cmd
docker compose logs -f backend | findstr /i /c:offline /c:worker
```

Kalau tidak ada output, berarti log backend belum memuat kata `offline` atau `worker`. Biarkan skenario offline berjalan beberapa menit, atau lihat semua log tanpa filter:

```powershell
docker compose logs -f backend
```
