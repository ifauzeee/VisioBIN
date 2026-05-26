#!/usr/bin/env python3
"""
=======================================================
  VISIOBIN - Script Simulasi Gangguan Jaringan IoT
  Tugas Perancangan Monitoring & Management Sistem
=======================================================

Menjalankan 4 skenario gangguan:
  1. Sensor Offline / Bin Down
  2. Delay Tinggi (latensi)
  3. Packet Loss
  4. Gateway Down
  5. Trafik Abnormal (bonus)

Cara pakai:
  python3 simulasi_visiobin.py --setup        # pertama kali: login & cek koneksi
  python3 simulasi_visiobin.py --semua        # jalankan semua skenario
  python3 simulasi_visiobin.py --skenario 1   # skenario tertentu saja
  python3 simulasi_visiobin.py --monitor      # live monitor status bin
"""

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

if os.name == "nt":
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

# ─── Konfigurasi ────────────────────────────────────────────
BASE_URL   = os.environ.get("VISIOBIN_API", "http://localhost:8080/api/v1")
USERNAME   = os.environ.get("VISIOBIN_USER", "admin")
PASSWORD   = os.environ.get("VISIOBIN_PASS", "admin123")
API_KEY    = os.environ.get("API_KEY", "visiobin-iot-secret-key")
# ────────────────────────────────────────────────────────────

RESET  = "\033[0m"
BOLD   = "\033[1m"
RED    = "\033[91m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
CYAN   = "\033[96m"
WHITE  = "\033[97m"
GRAY   = "\033[90m"

def ts():
    return datetime.now().strftime("%H:%M:%S")

def log(msg, color=WHITE):
    print(f"{GRAY}[{ts()}]{RESET} {color}{msg}{RESET}")

def log_ok(msg):    log(f"✅  {msg}", GREEN)
def log_err(msg):   log(f"❌  {msg}", RED)
def log_warn(msg):  log(f"⚠️   {msg}", YELLOW)
def log_info(msg):  log(f"ℹ️   {msg}", CYAN)
def log_alert(msg): log(f"🚨  {msg}", RED + BOLD)

def header(judul, nomor=None):
    print()
    garis = "═" * 60
    print(f"{BLUE}{BOLD}{garis}{RESET}")
    if nomor:
        print(f"{BLUE}{BOLD}  SKENARIO {nomor}: {judul}{RESET}")
    else:
        print(f"{BLUE}{BOLD}  {judul}{RESET}")
    print(f"{BLUE}{BOLD}{garis}{RESET}")

def divider():
    print(f"{GRAY}{'─' * 60}{RESET}")

# ─── HTTP Helpers ────────────────────────────────────────────

def http_post(path, data, headers=None, timeout=5):
    url = BASE_URL + path
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {}
    except Exception as e:
        return 0, {"error": str(e)}

def http_get(path, token=None, timeout=5):
    url = BASE_URL + path
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {}
    except Exception as e:
        return 0, {"error": str(e)}

def kirim_telemetri(bin_id, payload, delay_detik=0):
    """Kirim data telemetri ke backend. delay_detik simulasi latensi tinggi."""
    if delay_detik > 0:
        time.sleep(delay_detik)
    code, resp = http_post(
        "/telemetry",
        payload,
        headers={"X-API-Key": API_KEY}
    )
    return code, resp

# ─── Auth & Setup ────────────────────────────────────────────

def login():
    log_info(f"Login sebagai '{USERNAME}' ke {BASE_URL} ...")
    code, resp = http_post("/auth/login", {"username": USERNAME, "password": PASSWORD})
    if code == 200 and resp.get("success"):
        token = resp["data"]["token"]
        user  = resp["data"]["user"]
        log_ok(f"Login berhasil! Role: {user.get('role','?')} | User: {user.get('full_name','?')}")
        return token
    log_err(f"Login gagal (HTTP {code}). Cek username/password di .env atau argument --user/--pass")
    sys.exit(1)

def ambil_bins(token):
    log_info("Mengambil daftar bin dari backend ...")
    code, resp = http_get("/bins", token=token)
    if code == 200 and resp.get("success"):
        bins = resp.get("data", [])
        log_ok(f"Ditemukan {len(bins)} bin terdaftar")
        for b in bins:
            status_color = GREEN if b.get("status") in ("online", "active") else RED
            print(f"   {status_color}● {b['id']}{RESET}  {b['name']}  [{b.get('status','?')}]  — {b.get('location','')}")
        return bins
    log_err(f"Gagal ambil bins (HTTP {code})")
    return []

def cek_alerts(token):
    code, resp = http_get("/alerts", token=token)
    if code == 200 and resp.get("success"):
        alerts = resp.get("data", [])
        belum_dibaca = [a for a in alerts if not a.get("is_read")]
        return alerts, belum_dibaca
    return [], []

def cek_dashboard(token):
    code, resp = http_get("/dashboard/summary", token=token)
    if code == 200 and resp.get("success"):
        return resp.get("data", {})
    return {}

# ─── Payload helper ─────────────────────────────────────────

def payload_normal(bin_id, vol_org_pct=40.0, vol_inorg_pct=35.0, gas=85.0):
    """Konversi % volume → distance_cm (jarak sensor ultrasonik, max=50cm)"""
    dist_org   = 50.0 * (1 - vol_org_pct / 100) + random.uniform(-0.5, 0.5)
    dist_inorg = 50.0 * (1 - vol_inorg_pct / 100) + random.uniform(-0.5, 0.5)
    return {
        "bin_id":               bin_id,
        "distance_organic_cm":   max(2.0, min(50.0, dist_org)),
        "distance_inorganic_cm": max(2.0, min(50.0, dist_inorg)),
        "weight_organic_kg":    round(vol_org_pct * 0.20 / 100 * 20, 2),
        "weight_inorganic_kg":  round(vol_inorg_pct * 0.15 / 100 * 20, 2),
        "gas_amonia_ppm":       round(gas + random.uniform(-5, 5), 1),
    }

def payload_hampir_penuh(bin_id):
    return payload_normal(bin_id, vol_org_pct=96.0, vol_inorg_pct=93.0, gas=420.0)

def payload_gas_tinggi(bin_id):
    return payload_normal(bin_id, gas=580.0)

# ════════════════════════════════════════════════════════════
#  SKENARIO 1: SENSOR OFFLINE / BIN DOWN
# ════════════════════════════════════════════════════════════

def skenario_sensor_offline(token, bins):
    header("SENSOR OFFLINE / BIN DOWN", 1)
    print(f"""
{CYAN}DESKRIPSI:{RESET}
  Simulasi bin berhenti mengirim telemetri (ESP32 mati / WiFi putus).
  Backend men-detect via background worker setiap 1 menit:
    → jika bin tidak kirim data > 5 menit, status diubah ke 'offline'

{CYAN}YANG DIBUKTIKAN:{RESET}
  • Fault Management (ISO FCAPS)
  • Deteksi otomatis perangkat tidak responsif
  • Status bin berubah di dashboard
""")

    if not bins:
        log_err("Tidak ada bin terdaftar.")
        return

    # Langkah 1: Kirim data normal dulu (buktikan semuanya online)
    divider()
    log_info("FASE 1 — Kirim telemetri normal ke semua bin (status: online)")
    divider()
    for b in bins[:3]:
        p = payload_normal(b["id"], vol_org_pct=45.0, vol_inorg_pct=38.0)
        code, resp = kirim_telemetri(b["id"], p)
        if code in (200, 201):
            log_ok(f"[{b['name']}] Telemetri terkirim → vol organik 45%, anorganik 38%")
        else:
            log_warn(f"[{b['name']}] Gagal kirim (HTTP {code})")
        time.sleep(0.5)

    print()
    log_info("Cek status bin setelah pengiriman normal ...")
    d = cek_dashboard(token)
    log_ok(f"Dashboard: {d.get('active_bins','?')} bin aktif / {d.get('total_bins','?')} total")

    # Langkah 2: Hentikan pengiriman → simulasi offline
    divider()
    log_info("FASE 2 — MENGHENTIKAN pengiriman dari bin pertama (simulasi ESP32 mati)")
    divider()
    target = bins[0]
    log_warn(f"[{target['name']}] Tidak akan mengirim data selama 6 menit ...")
    log_info("(Backend worker cek setiap 1 menit, threshold offline = 5 menit)")
    log_info("Menunggu 5 siklus × 12 detik = 1 menit (demo cepat) ...")

    for i in range(5):
        time.sleep(12)
        # Bin lain tetap kirim
        for b in bins[1:3]:
            p = payload_normal(b["id"])
            kirim_telemetri(b["id"], p)
        log(f"  [{i+1}/5] Bin lain online, {target['name']} masih tidak responsif ...", GRAY)

    # Langkah 3: Cek alert yang muncul
    divider()
    log_info("FASE 3 — Cek alert & status di backend")
    divider()
    _, belum_dibaca = cek_alerts(token)

    if belum_dibaca:
        log_alert(f"ALERT TERDETEKSI! {len(belum_dibaca)} alert belum dibaca:")
        for a in belum_dibaca[:5]:
            sev_color = RED if a.get("severity") == "critical" else YELLOW
            print(f"   {sev_color}[{a.get('severity','?').upper()}]{RESET} {a.get('message','')}")
            print(f"   {GRAY}Bin: {a.get('bin_name','?')} | Waktu: {a.get('created_at','?')[:19]}{RESET}")
    else:
        log_info("Belum ada alert baru (worker belum jalan / threshold belum tercapai)")
        log_info("→ Tunggu ~1 menit lagi atau cek log Docker: docker logs visiobin-backend-1")

    d2 = cek_dashboard(token)
    print()
    log_ok(f"HASIL: {d2.get('active_bins','?')} bin aktif, {d2.get('total_bins','?')} total")
    print(f"\n{YELLOW}CARA BUKTIKAN KE DOSEN:{RESET}")
    print("  1. Buka web dashboard → halaman Perangkat")
    print("  2. Lihat bin yang statusnya berubah jadi OFFLINE (merah)")
    print("  3. Atau jalankan: docker logs visiobin-backend-1 | grep offline")

# ════════════════════════════════════════════════════════════
#  SKENARIO 2: DELAY TINGGI
# ════════════════════════════════════════════════════════════

def skenario_delay_tinggi(token, bins):
    header("DELAY TINGGI (LATENSI)", 2)
    print(f"""
{CYAN}DESKRIPSI:{RESET}
  Simulasi pengiriman data dengan delay tinggi (jaringan lambat).
  Membandingkan latensi normal vs kondisi delay ekstrem.

{CYAN}YANG DIBUKTIKAN:{RESET}
  • Performance Management (ISO FCAPS)
  • Dampak latensi tinggi terhadap data real-time
  • Deteksi response time yang tidak wajar
""")

    if not bins:
        log_err("Tidak ada bin.")
        return

    b = bins[0]
    p = payload_normal(b["id"], 50.0, 45.0)

    # Normal baseline
    divider()
    log_info("FASE 1 — Pengiriman NORMAL (tanpa delay buatan)")
    divider()

    latencies = []
    for i in range(5):
        mulai = time.time()
        code, _ = kirim_telemetri(b["id"], p)
        latensi_ms = (time.time() - mulai) * 1000
        latencies.append(latensi_ms)
        status = "OK" if code in (200, 201) else f"ERR {code}"
        bar = "█" * int(latensi_ms / 20)
        print(f"   [{i+1}] {GREEN}{status}{RESET}  {latensi_ms:6.0f}ms  {CYAN}{bar}{RESET}")
        time.sleep(1)

    avg_normal = sum(latencies) / len(latencies)
    log_ok(f"Rata-rata latensi normal: {avg_normal:.0f}ms")

    # Delay tinggi
    divider()
    log_info("FASE 2 — Pengiriman dengan DELAY TINGGI (simulasi jaringan lambat)")
    divider()

    delays = [1.5, 2.0, 3.0, 2.5, 1.8]
    latencies_lambat = []
    for i, d_detik in enumerate(delays):
        mulai = time.time()
        code, _ = kirim_telemetri(b["id"], p, delay_detik=d_detik)
        latensi_ms = (time.time() - mulai) * 1000
        latencies_lambat.append(latensi_ms)
        status = "OK" if code in (200, 201) else f"ERR {code}"
        bar = "█" * int(min(latensi_ms / 100, 40))
        print(f"   [{i+1}] {YELLOW}{status}{RESET}  {latensi_ms:6.0f}ms  {YELLOW}{bar}{RESET}  ← delay {d_detik}s")

    avg_lambat = sum(latencies_lambat) / len(latencies_lambat)

    divider()
    print(f"\n{BOLD}PERBANDINGAN LATENSI:{RESET}")
    print(f"  Normal   : {GREEN}{avg_normal:.0f}ms{RESET}")
    print(f"  Terganggu: {RED}{avg_lambat:.0f}ms{RESET}  ({avg_lambat/avg_normal:.1f}× lebih lambat)")
    rasio = avg_lambat / avg_normal
    if rasio > 10:
        log_alert(f"KRITIS: Latensi {rasio:.0f}× di atas normal!")
    elif rasio > 5:
        log_warn(f"PERINGATAN: Latensi {rasio:.0f}× di atas normal")

    print(f"\n{YELLOW}CARA BUKTIKAN KE DOSEN:{RESET}")
    print("  1. Lihat tabel di atas — kolom ms menunjukkan perbedaan jelas")
    print("  2. Data tetap masuk ke backend (HTTP 201), tapi lambat")
    print("  3. Dampak: dashboard update delay, alert terlambat muncul")

# ════════════════════════════════════════════════════════════
#  SKENARIO 3: PACKET LOSS
# ════════════════════════════════════════════════════════════

def skenario_packet_loss(token, bins):
    header("PACKET LOSS", 3)
    print(f"""
{CYAN}DESKRIPSI:{RESET}
  Simulasi kehilangan paket data — beberapa request sengaja digagalkan
  (seperti sinyal WiFi lemah RSSI < -80dBm atau koneksi putus-putus).

{CYAN}YANG DIBUKTIKAN:{RESET}
  • Performance Management & Fault Management
  • Gap data di grafik sensor
  • Tidak semua telemetri sampai ke backend
""")

    if not bins:
        log_err("Tidak ada bin.")
        return

    b = bins[0] if bins else None
    total = 20
    loss_rates = [0.10, 0.30, 0.60]  # 10%, 30%, 60% packet loss

    for loss_pct in loss_rates:
        divider()
        log_info(f"Packet loss {loss_pct*100:.0f}% — mengirim {total} paket ...")
        terkirim = 0
        gagal    = 0

        for i in range(total):
            p = payload_normal(b["id"] if b else "BIN-TEST",
                               vol_org_pct=40 + i * 0.5,
                               vol_inorg_pct=35 + i * 0.3)
            if random.random() < loss_pct:
                # Simulasi packet drop: skip pengiriman
                gagal += 1
                print(f"   [{i+1:2d}/{total}] {RED}DROP{RESET}  ← paket hilang (simulasi WiFi lemah)")
            else:
                code, _ = kirim_telemetri(b["id"] if b else "BIN-TEST", p)
                if code in (200, 201):
                    terkirim += 1
                    print(f"   [{i+1:2d}/{total}] {GREEN}OK  {RESET}  telemetri diterima backend")
                else:
                    gagal += 1
                    print(f"   [{i+1:2d}/{total}] {RED}ERR {RESET}  HTTP {code}")
            time.sleep(0.3)

        print()
        sukses_pct = (terkirim / total) * 100
        log_warn(f"Hasil: {terkirim}/{total} paket diterima ({sukses_pct:.0f}% success rate)")
        log_err( f"       {gagal}/{total} paket hilang ({(gagal/total)*100:.0f}% packet loss)")
        if sukses_pct < 50:
            log_alert("Packet loss KRITIS — data sensor tidak dapat diandalkan!")
        print()
        time.sleep(1)

    print(f"\n{YELLOW}CARA BUKTIKAN KE DOSEN:{RESET}")
    print("  1. Buka web dashboard → Grafik Sensor")
    print("  2. Lihat gap/lompatan pada grafik volume (data tidak kontinu)")
    print("  3. Jalankan: curl -s http://localhost:8080/api/v1/bins/{id}/history")

# ════════════════════════════════════════════════════════════
#  SKENARIO 4: GATEWAY DOWN
# ════════════════════════════════════════════════════════════

def skenario_gateway_down(token, bins):
    header("GATEWAY DOWN (BACKEND TIDAK RESPONSIF)", 4)
    print(f"""
{CYAN}DESKRIPSI:{RESET}
  Simulasi backend tidak bisa diakses (server crash / network down).
  Semua request dari ESP32/simulator akan gagal connection refused.

{CYAN}YANG DIBUKTIKAN:{RESET}
  • Fault Management
  • Behavior sistem saat gateway tidak tersedia
  • Cara deteksi dan recovery
""")

    # Cek dulu kondisi normal
    divider()
    log_info("FASE 1 — Verifikasi backend ONLINE")
    divider()
    code, resp = http_get("/dashboard/summary", token=token)
    if code == 200:
        log_ok(f"Backend ONLINE — dashboard summary berhasil diambil")
        d = resp.get("data", {})
        log_ok(f"Total bins: {d.get('total_bins','?')} | Aktif: {d.get('active_bins','?')}")
    else:
        log_err(f"Backend sudah tidak responsif? HTTP {code}")

    # Kirim telemetri normal
    if bins:
        b = bins[0]
        p = payload_normal(b["id"])
        code, _ = kirim_telemetri(b["id"], p)
        log_ok(f"Telemetri normal → HTTP {code}")

    divider()
    log_info("FASE 2 — Simulasi GATEWAY DOWN")
    log_info("Mengirim ke URL yang tidak tersedia (port berbeda) ...")
    divider()

    url_mati = BASE_URL.replace(":8080", ":9999")  # port tidak ada
    gagal_count = 0

    for i in range(8):
        p = payload_normal(bins[0]["id"] if bins else "BIN-TEST",
                           vol_org_pct=40.0 + i * 2)
        mulai = time.time()
        try:
            body = json.dumps(p).encode()
            req = urllib.request.Request(url_mati + "/telemetry", data=body, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("X-API-Key", API_KEY)
            urllib.request.urlopen(req, timeout=3)
            print(f"   [{i+1}] {GREEN}OK{RESET}  (tidak seharusnya berhasil)")
        except Exception as e:
            elapsed = (time.time() - mulai) * 1000
            gagal_count += 1
            err_msg = str(e)[:60]
            print(f"   [{i+1}] {RED}GAGAL{RESET}  ({elapsed:.0f}ms)  → {err_msg}")
        time.sleep(0.8)

    print()
    log_alert(f"GATEWAY DOWN — {gagal_count}/8 request GAGAL total!")
    log_warn("Dampak: Semua bin tidak bisa kirim data, dashboard stale")
    log_warn("Semua bin akan ditandai OFFLINE oleh worker setelah 5 menit")

    # Recovery check
    divider()
    log_info("FASE 3 — Verifikasi backend kembali ONLINE (recovery)")
    divider()
    code, _ = http_get("/dashboard/summary", token=token)
    if code == 200:
        log_ok("Backend kembali responsif!")
        log_info("Recovery: jalankan docker compose restart backend")
    else:
        log_err(f"Backend belum pulih (HTTP {code})")

    print(f"\n{YELLOW}CARA BUKTIKAN KE DOSEN:{RESET}")
    print("  1. Jalankan: docker compose stop backend")
    print("     → Lihat semua request gagal connection refused")
    print("  2. Jalankan: docker compose start backend")
    print("     → Backend online kembali, bin mulai kirim data lagi")
    print("  3. Setelah 5+ menit down, cek: semua bin status = offline di dashboard")

# ════════════════════════════════════════════════════════════
#  SKENARIO 5: TRAFIK ABNORMAL (BONUS)
# ════════════════════════════════════════════════════════════

def skenario_trafik_abnormal(token, bins):
    header("TRAFIK ABNORMAL (BIN HAMPIR PENUH)", 5)
    print(f"""
{CYAN}DESKRIPSI:{RESET}
  Simulasi volume bin naik ekstrem dalam waktu singkat.
  Backend akan men-trigger alert + FCM push notification ke admin.

{CYAN}YANG DIBUKTIKAN:{RESET}
  • Fault Management + Accounting Management
  • ForecastService mendeteksi fill rate anomali
  • Alert otomatis dibuat, notifikasi FCM terkirim
""")

    if not bins:
        log_err("Tidak ada bin.")
        return

    b = bins[0]
    divider()
    log_info(f"Simulasi lonjakan volume pada bin: {b['name']}")
    divider()

    # Simulasi naik perlahan, lalu tiba-tiba cepat
    steps = [
        (20.0, 15.0, 80.0,  "Normal awal"),
        (35.0, 28.0, 120.0, "Naik pelan"),
        (55.0, 48.0, 180.0, "Mulai meningkat"),
        (72.0, 65.0, 260.0, "Trafik tinggi"),
        (85.0, 80.0, 350.0, "⚠️  Mendekati penuh!"),
        (93.0, 91.0, 420.0, "🚨 HAMPIR PENUH - alert dipicu!"),
        (97.0, 96.0, 480.0, "🚨 KRITIS - segera kosongkan!"),
    ]

    for org, inorg, gas, keterangan in steps:
        p = payload_normal(b["id"], vol_org_pct=org, vol_inorg_pct=inorg, gas=gas)
        code, resp = kirim_telemetri(b["id"], p)

        color = GREEN if org < 70 else (YELLOW if org < 85 else RED)
        bar_o = "█" * int(org / 5)
        bar_i = "█" * int(inorg / 5)

        print(f"\n   {color}{keterangan}{RESET}")
        print(f"   Organik  : {color}{bar_o}{RESET} {org:.0f}%")
        print(f"   Anorganik: {color}{bar_i}{RESET} {inorg:.0f}%")
        print(f"   Gas NH₃  : {gas:.0f} ppm")
        print(f"   HTTP     : {GREEN if code in (200,201) else RED}{code}{RESET}")
        time.sleep(1.5)

    # Cek alert yang muncul
    print()
    divider()
    log_info("Cek alert yang terpicu ...")
    divider()
    time.sleep(2)
    _, belum_dibaca = cek_alerts(token)
    if belum_dibaca:
        log_alert(f"{len(belum_dibaca)} alert aktif:")
        for a in belum_dibaca[:6]:
            sev = a.get("severity", "?")
            c = RED if sev == "critical" else YELLOW
            print(f"   {c}[{sev.upper()}]{RESET} {a.get('message','')[:70]}")
            print(f"   {GRAY}Bin: {a.get('bin_name','?')} | {a.get('created_at','?')[:19]}{RESET}")
    else:
        log_info("Belum ada alert baru (mungkin perlu tunggu sebentar atau cek threshold backend)")

    print(f"\n{YELLOW}CARA BUKTIKAN KE DOSEN:{RESET}")
    print("  1. Buka web dashboard → Ringkasan → lihat 'Bin Hampir Penuh'")
    print("  2. Buka tab Alert → lihat alert volume critical muncul")
    print("  3. Jika FCM aktif, cek mobile app → notifikasi push masuk")

# ════════════════════════════════════════════════════════════
#  LIVE MONITOR
# ════════════════════════════════════════════════════════════

def live_monitor(token, bins, interval=5):
    header("LIVE MONITOR — Real-time Status")
    log_info(f"Refresh setiap {interval} detik. Tekan Ctrl+C untuk berhenti.\n")

    try:
        cycle = 0
        while True:
            cycle += 1
            print(f"\r{GRAY}[{ts()}] Cycle #{cycle}{RESET}", end="", flush=True)
            print()

            d = cek_dashboard(token)
            total   = d.get("total_bins", "?")
            aktif   = d.get("active_bins", "?")
            alerts  = d.get("unread_alerts", "?")
            hampir  = d.get("bins_near_full", "?")

            print(f"  Bins: {GREEN}{aktif}{RESET}/{total} online  |  "
                  f"Hampir penuh: {YELLOW}{hampir}{RESET}  |  "
                  f"Alert: {RED}{alerts}{RESET}")

            statuses = d.get("bin_statuses", [])
            for s in statuses:
                color = GREEN if s.get("status") in ("online", "active") else RED
                vo = s.get("volume_organic_pct")
                vi = s.get("volume_inorganic_pct")
                vol_str = f"{vo:.0f}%/{vi:.0f}%" if vo is not None else "N/A"
                print(f"  {color}●{RESET} {s.get('bin_name','?'):25s} [{s.get('status','?'):7s}]  {vol_str}")

            time.sleep(interval)
    except KeyboardInterrupt:
        print(f"\n{GRAY}Monitor dihentikan.{RESET}")

def kirim_telemetri_normal(token, bins, jumlah=5):
    header("TELEMETRI NORMAL")
    if not bins:
        log_err("Tidak ada bin terdaftar.")
        return

    target = bins[0]
    log_info(f"Mengirim {jumlah} data telemetri normal ke {target['name']} ...")
    divider()

    for i in range(jumlah):
        payload = payload_normal(target["id"], vol_org_pct=43.0, vol_inorg_pct=36.0, gas=95.0)
        code, _ = kirim_telemetri(target["id"], payload)
        if code in (200, 201):
            log_ok(f"[{i + 1}/{jumlah}] HTTP {code} - volume organik ~43%, anorganik ~36%")
        else:
            log_warn(f"[{i + 1}/{jumlah}] HTTP {code} - data belum diterima backend")
        time.sleep(1)

    print_status(token)

def print_status(token):
    header("STATUS & ALERT")
    d = cek_dashboard(token)
    alerts, belum_dibaca = cek_alerts(token)

    print(f"  Total Bin    : {d.get('total_bins', 0)}")
    print(f"  Bin Online   : {d.get('active_bins', 0)}")
    print(f"  Hampir Penuh : {d.get('bins_near_full', 0)}")
    print(f"  Alert Aktif  : {len(belum_dibaca)}")
    print(f"  Total Alert  : {len(alerts)}")

    statuses = d.get("bin_statuses", [])
    if statuses:
        print()
        print("  Status bin:")
        for s in statuses:
            color = GREEN if s.get("status") in ("online", "active") else RED
            vo = s.get("volume_organic_pct")
            vi = s.get("volume_inorganic_pct")
            vol_str = f"{vo:.0f}%/{vi:.0f}%" if vo is not None and vi is not None else "N/A"
            print(f"   {color}*{RESET} {s.get('bin_name','?'):25s} [{s.get('status','?')}] {vol_str}")

    if belum_dibaca:
        print()
        log_alert("Alert belum dibaca:")
        for a in belum_dibaca[:8]:
            sev = a.get("severity", "?").upper()
            print(f"   [{sev}] {a.get('bin_name','?')}: {a.get('message','')[:80]}")

# ════════════════════════════════════════════════════════════
#  SETUP / CEK KONEKSI
# ════════════════════════════════════════════════════════════

def setup_check():
    header("SETUP & CEK KONEKSI")
    print(f"  API URL  : {CYAN}{BASE_URL}{RESET}")
    print(f"  Username : {CYAN}{USERNAME}{RESET}")
    print(f"  API Key  : {CYAN}{API_KEY[:10]}...{RESET}")
    print()

    token = login()
    bins  = ambil_bins(token)
    d     = cek_dashboard(token)
    _, ba = cek_alerts(token)

    print()
    divider()
    print(f"  {GREEN}{BOLD}KONEKSI BERHASIL!{RESET}")
    print(f"  Total Bin    : {d.get('total_bins', 0)}")
    print(f"  Bin Online   : {d.get('active_bins', 0)}")
    print(f"  Alert Aktif  : {len(ba)}")
    print(f"  Klasifikasi hari ini: {d.get('total_classifications_today', 0)}")
    divider()
    print(f"\n{GREEN}Siap menjalankan skenario simulasi!{RESET}")
    runner = "py" if os.name == "nt" else "python3"
    print(f"Jalankan: {runner} simulasi_visiobin.py --semua")
    return token, bins

# ════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════

def main():
    global BASE_URL, USERNAME, PASSWORD, API_KEY  # noqa: PLW0603
    parser = argparse.ArgumentParser(
        description="Visiobin — Script Simulasi Gangguan Jaringan IoT"
    )
    parser.add_argument("--setup",    action="store_true", help="Cek koneksi & setup awal")
    parser.add_argument("--semua",    action="store_true", help="Jalankan semua skenario")
    parser.add_argument("--skenario", type=int, choices=[1,2,3,4,5],
                        help="Jalankan skenario tertentu (1-5)")
    parser.add_argument("--monitor",  action="store_true", help="Live monitor status bin")
    parser.add_argument("--normal",   action="store_true", help="Kirim telemetri normal")
    parser.add_argument("--status",   action="store_true", help="Tampilkan status dashboard dan alert")
    parser.add_argument("--interval", type=int, default=5, help="Interval refresh monitor dalam detik")
    parser.add_argument("--user",     default=USERNAME, help="Username login")
    parser.add_argument("--pass",     default=PASSWORD, dest="password",
                        help="Password login")
    parser.add_argument("--url",      default=BASE_URL, help="Base URL API backend")
    parser.add_argument("--api-key",  default=API_KEY, help="API key IoT untuk kirim telemetry")
    args = parser.parse_args()

    # Override globals dari argumen
    BASE_URL = args.url
    USERNAME = args.user
    PASSWORD = args.password
    API_KEY = args.api_key

    print(f"""
{BLUE}{BOLD}
╔══════════════════════════════════════════════════════════╗
║        VISIOBIN — Simulasi Monitoring & Management       ║
║          Tugas Perancangan Sistem Monitoring IoT         ║
╚══════════════════════════════════════════════════════════╝
{RESET}""")

    if args.setup or (not args.semua and not args.skenario and not args.monitor and not args.normal and not args.status):
        token, bins = setup_check()
        return

    token = login()
    bins  = ambil_bins(token)

    skenario_map = {
        1: skenario_sensor_offline,
        2: skenario_delay_tinggi,
        3: skenario_packet_loss,
        4: skenario_gateway_down,
        5: skenario_trafik_abnormal,
    }

    if args.monitor:
        live_monitor(token, bins, interval=args.interval)
    elif args.normal:
        kirim_telemetri_normal(token, bins)
    elif args.status:
        print_status(token)
    elif args.skenario:
        skenario_map[args.skenario](token, bins)
    elif args.semua:
        for no, fn in skenario_map.items():
            fn(token, bins)
            if no < 5:
                print(f"\n{GRAY}Lanjut ke skenario berikutnya dalam 3 detik ...{RESET}")
                time.sleep(3)

    print(f"\n{GREEN}{BOLD}Simulasi selesai.{RESET}")
    print(f"Buka dashboard: {CYAN}http://localhost:3000{RESET}")
    print(f"Cek alert     : {CYAN}http://localhost:8080/api/v1/alerts{RESET}")

if __name__ == "__main__":
    main()
