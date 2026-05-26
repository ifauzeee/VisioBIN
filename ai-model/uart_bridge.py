"""
VisioBin UART Bridge v2.0
=========================
Script yang berjalan di Raspberry Pi untuk:
1. Menerima data sensor dari ESP32 via UART (serial JSON)
2. Meneruskan data ke Backend Golang (REST API)
3. Auto-reconnect serial jika ESP32 restart/disconnect
4. Offline buffer (SQLite) untuk data saat backend tidak tersedia
5. Retry queue dengan exponential backoff

Alur:
    ESP32 → [Serial UART] → Raspberry Pi (script ini) → [HTTP] → Backend

Format JSON yang dikirim ESP32:
{
  "type": "telemetry",
  "dist_org": 35.5,
  "dist_inorg": 42.1,
  "weight_org": 1.25,
  "weight_inorg": 0.80,
  "gas_ppm": 12.3
}

atau untuk konfirmasi servo:
{
  "type": "servo_done",
  "direction": "organic"
}

Usage (Raspberry Pi):
    pip install pyserial requests
    python uart_bridge.py --port /dev/ttyUSB0 --bin-id VBIN-01

Usage (dev/simulasi tanpa serial):
    python uart_bridge.py --simulate
"""

import argparse
import json
import os
import sys
import time
import sqlite3
import threading
import random
import logging
from datetime import datetime

import requests
from env_config import load_root_env, require_env

load_root_env()

# ─────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger("uart_bridge")

# ─────────────────────────────────────────────────────────────────
# Konfigurasi via environment variable
# ─────────────────────────────────────────────────────────────────
DEFAULT_PORT     = os.environ.get("VISIOBIN_UART_PORT",    "/dev/ttyUSB0")
DEFAULT_BAUD     = int(os.environ.get("VISIOBIN_UART_BAUD", "115200"))
DEFAULT_BACKEND  = require_env("VISIOBIN_BACKEND_API_BASE")
DEFAULT_BIN_ID   = os.environ.get("VISIOBIN_BIN_ID",        "VBIN-01")
DEFAULT_INTERVAL = float(os.environ.get("VISIOBIN_INTERVAL", "5.0"))
DEFAULT_API_KEY  = os.environ.get("VISIOBIN_API_KEY",        "")

# ─────────────────────────────────────────────────────────────────
# Offline Buffer (SQLite)
# ─────────────────────────────────────────────────────────────────

class OfflineBuffer:
    """
    Buffer SQLite lokal untuk menyimpan data sensor saat backend tidak tersedia.
    Data akan di-retry secara periodik dan dihapus setelah berhasil dikirim.
    """

    def __init__(self, db_path="visiobin_buffer.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.lock = threading.Lock()
        self._init_db()
        count = self.count()
        if count > 0:
            log.info(f"📦 Offline buffer: {count} pesan tertunda ditemukan di {db_path}")

    def _init_db(self):
        with self.lock:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS pending_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    endpoint TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0
                )
            """)
            self.conn.commit()

    def enqueue(self, endpoint: str, payload: dict):
        """Simpan pesan yang gagal ke buffer."""
        with self.lock:
            self.conn.execute(
                "INSERT INTO pending_messages (endpoint, payload, created_at) VALUES (?, ?, ?)",
                (endpoint, json.dumps(payload), datetime.now().isoformat())
            )
            self.conn.commit()
        log.info(f"📦 Data disimpan ke offline buffer (total: {self.count()})")

    def peek_batch(self, limit=10):
        """Ambil batch pesan tertunda tanpa menghapus."""
        with self.lock:
            cursor = self.conn.execute(
                "SELECT id, endpoint, payload FROM pending_messages ORDER BY id ASC LIMIT ?",
                (limit,)
            )
            return cursor.fetchall()

    def remove(self, msg_id: int):
        """Hapus pesan yang berhasil dikirim."""
        with self.lock:
            self.conn.execute("DELETE FROM pending_messages WHERE id = ?", (msg_id,))
            self.conn.commit()

    def increment_retry(self, msg_id: int):
        """Tambah retry count."""
        with self.lock:
            self.conn.execute(
                "UPDATE pending_messages SET retry_count = retry_count + 1 WHERE id = ?",
                (msg_id,)
            )
            self.conn.commit()

    def cleanup_old(self, max_age_hours=24):
        """Hapus pesan yang terlalu lama (>24 jam)."""
        with self.lock:
            self.conn.execute(
                "DELETE FROM pending_messages WHERE created_at < datetime('now', ?)",
                (f"-{max_age_hours} hours",)
            )
            self.conn.commit()

    def count(self) -> int:
        with self.lock:
            cursor = self.conn.execute("SELECT COUNT(*) FROM pending_messages")
            return cursor.fetchone()[0]

    def close(self):
        self.conn.close()


class UARTBridge:
    """
    Jembatan komunikasi antara ESP32 (UART) dan Backend Golang (HTTP).
    
    Fitur v2.0:
    - Auto-reconnect serial jika ESP32 restart/disconnect
    - Offline buffer SQLite untuk data saat backend tidak tersedia
    - Retry queue dengan exponential backoff
    - Watchdog untuk monitoring kesehatan koneksi

    Protocol ESP32 → RPi:
        - Setiap baris adalah satu JSON object yang diakhiri newline
        - type: "telemetry" | "servo_done" | "heartbeat" | "error"
    
    Protocol RPi → ESP32:
        - Perintah teks satu baris: "CLASSIFY:ORGANIC\n" atau "CLASSIFY:INORGANIC\n"
    """

    def __init__(self, port, baud, backend_url, bin_id, api_key="", simulate=False):
        self.port        = port
        self.baud        = baud
        self.backend     = backend_url
        self.bin_id      = bin_id
        self.api_key     = api_key
        self.simulate    = simulate
        self.ser         = None
        self.running     = False
        self._session    = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})
        if api_key:
            self._session.headers.update({"X-API-Key": api_key})

        # Offline buffer
        self.buffer = OfflineBuffer()

        # Connection stats
        self._serial_reconnect_count = 0
        self._backend_fail_count = 0
        self._last_telemetry_time = 0
        self._last_esp32_heartbeat = 0

        log.info(f"╔══════════════════════════════════════════╗")
        log.info(f"║   VisioBin UART Bridge v2.0              ║")
        log.info(f"╠══════════════════════════════════════════╣")
        log.info(f"║ UART Port    : {port:<25s} ║")
        log.info(f"║ Baud Rate    : {baud:<25d} ║")
        log.info(f"║ Backend URL  : {backend_url[:25]:<25s} ║")
        log.info(f"║ Bin ID       : {bin_id:<25s} ║")
        log.info(f"║ API Key      : {'✓ Set' if api_key else '✗ Not set':<25s} ║")
        log.info(f"║ Mode         : {'SIMULATE' if simulate else 'LIVE UART':<25s} ║")
        log.info(f"╚══════════════════════════════════════════╝")

    # ── Serial Setup (with Auto-Reconnect) ───────────────────────

    def _open_serial(self):
        """Buka koneksi serial ke ESP32 dengan auto-retry."""
        try:
            import serial
        except ImportError:
            log.error("pyserial tidak terinstal. Jalankan: pip install pyserial")
            sys.exit(1)

        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                self.ser = serial.Serial(
                    port=self.port,
                    baudrate=self.baud,
                    timeout=2.0,
                    write_timeout=2.0
                )
                self.ser.flushInput()
                log.info(f"✓ Serial terbuka: {self.port} @ {self.baud}")
                return True
            except Exception as e:
                log.warning(f"Gagal buka serial (percobaan {attempt+1}/{max_attempts}): {e}")
                time.sleep(2 ** attempt)  # Exponential backoff: 1, 2, 4, 8, 16s

        log.error(f"✗ Tidak bisa membuka port serial setelah {max_attempts} percobaan")
        return False

    def _reconnect_serial(self):
        """Auto-reconnect serial setelah disconnect."""
        if self.ser:
            try:
                self.ser.close()
            except Exception:
                pass
            self.ser = None

        self._serial_reconnect_count += 1
        log.warning(f"🔄 Mencoba reconnect serial (#{self._serial_reconnect_count})...")
        
        backoff = min(30, 2 ** min(self._serial_reconnect_count, 5))
        time.sleep(backoff)
        
        return self._open_serial()

    # ── Backend Communication (with Offline Buffer) ──────────────

    def _send_to_backend(self, endpoint: str, payload: dict) -> bool:
        """Kirim data ke backend. Return True jika berhasil."""
        try:
            resp = self._session.post(
                f"{self.backend}/{endpoint}",
                json=payload,
                timeout=5
            )
            if resp.status_code in (200, 201):
                self._backend_fail_count = 0
                return True
            else:
                log.warning(f"✗ Backend HTTP {resp.status_code}: {resp.text[:80]}")
                return False
        except requests.exceptions.ConnectionError:
            self._backend_fail_count += 1
            log.error(f"✗ Backend tidak tersedia ({self._backend_fail_count}x)")
            return False
        except requests.exceptions.Timeout:
            self._backend_fail_count += 1
            log.error(f"✗ Backend timeout ({self._backend_fail_count}x)")
            return False
        except Exception as e:
            self._backend_fail_count += 1
            log.error(f"✗ Error kirim ke backend: {e}")
            return False

    def _send_telemetry(self, data: dict):
        """Kirim data telemetri ke backend, buffer jika gagal."""
        payload = {
            "bin_id":               self.bin_id,
            "distance_organic_cm":  data.get("dist_org",    0.0),
            "distance_inorganic_cm": data.get("dist_inorg", 0.0),
            "weight_organic_kg":    data.get("weight_org",  0.0),
            "weight_inorganic_kg":  data.get("weight_inorg", 0.0),
            "gas_amonia_ppm":       data.get("gas_ppm",     0.0),
        }

        if self._send_to_backend("telemetry", payload):
            vol_o = ((50 - payload["distance_organic_cm"]) / 50) * 100
            vol_i = ((50 - payload["distance_inorganic_cm"]) / 50) * 100
            log.info(
                f"✓ Telemetri terkirim | "
                f"Vol: {vol_o:.0f}%/{vol_i:.0f}% | "
                f"Gas: {payload['gas_amonia_ppm']:.1f}ppm"
            )
            self._last_telemetry_time = time.time()
        else:
            # Simpan ke offline buffer
            self.buffer.enqueue("telemetry", payload)

    def _send_servo_command(self, direction: str):
        """
        Kirim perintah ke ESP32 untuk menggerakkan servo.
        direction: "ORGANIC" | "INORGANIC"
        """
        if self.ser is None or not self.ser.is_open:
            log.warning("Serial tidak tersedia, skip perintah servo")
            return

        cmd = f"CLASSIFY:{direction.upper()}\n"
        try:
            self.ser.write(cmd.encode("utf-8"))
            log.info(f"→ ESP32: {cmd.strip()}")
        except Exception as e:
            log.error(f"Gagal kirim perintah ke ESP32: {e}")

    # ── Retry Worker ──────────────────────────────────────────────

    def _retry_worker(self):
        """
        Background thread yang mencoba mengirim ulang data dari offline buffer.
        Berjalan setiap 30 detik dengan exponential backoff.
        """
        log.info("🔄 Retry worker dimulai")
        base_interval = 30  # 30 detik

        while self.running:
            time.sleep(base_interval)

            # Bersihkan data yang terlalu lama (>24 jam)
            self.buffer.cleanup_old(24)

            pending = self.buffer.peek_batch(20)
            if not pending:
                continue

            log.info(f"🔄 Mengirim ulang {len(pending)} pesan tertunda...")
            success_count = 0

            for msg_id, endpoint, payload_json in pending:
                try:
                    payload = json.loads(payload_json)
                    if self._send_to_backend(endpoint, payload):
                        self.buffer.remove(msg_id)
                        success_count += 1
                    else:
                        self.buffer.increment_retry(msg_id)
                        break  # Stop jika backend masih down
                except Exception as e:
                    log.error(f"Error retry #{msg_id}: {e}")
                    break

            if success_count > 0:
                remaining = self.buffer.count()
                log.info(f"✓ {success_count} pesan terkirim dari buffer (sisa: {remaining})")

    # ── Message Parser ─────────────────────────────────────────────

    def _handle_message(self, line: str):
        """Parse dan proses satu baris JSON dari ESP32."""
        line = line.strip()
        if not line:
            return

        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            log.debug(f"Non-JSON dari ESP32: {line[:50]}")
            return

        msg_type = data.get("type", "unknown")

        if msg_type == "telemetry":
            self._send_telemetry(data)

        elif msg_type == "servo_done":
            direction = data.get("direction", "unknown")
            log.info(f"✓ Servo selesai: {direction}")

        elif msg_type == "heartbeat":
            self._last_esp32_heartbeat = time.time()
            log.debug(f"♥ Heartbeat ESP32: uptime={data.get('uptime', '?')}s")

        elif msg_type == "error":
            log.error(f"⚠ Error dari ESP32: {data.get('message', '?')}")

        else:
            log.debug(f"Pesan tidak dikenal dari ESP32: {data}")

    # ── Run Modes ──────────────────────────────────────────────────

    def run_simulate(self, interval: float = 5.0):
        """
        Mode simulasi: generate data sensor random tanpa hardware.
        Berguna untuk testing pipeline tanpa ESP32.
        """
        log.info(f"Simulasi dimulai (interval={interval}s). Ctrl+C untuk berhenti.")
        log.info("-" * 60)

        dist_org   = 48.0
        dist_inorg = 49.0
        weight_org  = 0.1
        weight_inorg = 0.05
        gas_ppm    = 3.0

        cycle = 0
        while self.running:
            cycle += 1
            # Simulasi pengisian gradual
            dist_org   = max(2.0, dist_org   - random.uniform(0.3, 1.5))
            dist_inorg = max(2.0, dist_inorg - random.uniform(0.2, 1.0))
            weight_org   = min(20.0, weight_org   + random.uniform(0.02, 0.15))
            weight_inorg = min(20.0, weight_inorg + random.uniform(0.01, 0.08))
            gas_ppm    = min(200.0, gas_ppm + random.uniform(-0.5, 2.0))

            simulated_msg = json.dumps({
                "type":       "telemetry",
                "dist_org":   round(dist_org, 2),
                "dist_inorg": round(dist_inorg, 2),
                "weight_org": round(weight_org, 3),
                "weight_inorg": round(weight_inorg, 3),
                "gas_ppm":    round(max(1.0, gas_ppm), 2),
            })

            log.info(f"[SIM] Cycle #{cycle}: {simulated_msg[:80]}")
            self._handle_message(simulated_msg)
            time.sleep(interval)

    def run_live(self):
        """Mode live: baca dari UART serial ESP32 dengan auto-reconnect."""
        if not self._open_serial():
            log.error("Gagal membuka serial pada startup. Akan terus mencoba reconnect...")

        log.info("Menunggu data dari ESP32... (Ctrl+C untuk berhenti)")
        log.info("-" * 60)

        consecutive_errors = 0

        while self.running:
            # Auto-reconnect jika serial tidak tersedia
            if self.ser is None or not self.ser.is_open:
                if not self._reconnect_serial():
                    continue
                consecutive_errors = 0

            try:
                if self.ser.in_waiting > 0:
                    raw = self.ser.readline()
                    line = raw.decode("utf-8", errors="replace")
                    self._handle_message(line)
                    consecutive_errors = 0
                else:
                    time.sleep(0.05)
            except OSError as e:
                # Serial device disconnected
                consecutive_errors += 1
                log.error(f"Serial disconnected: {e}")
                self.ser = None
                if not self._reconnect_serial():
                    continue
            except Exception as e:
                consecutive_errors += 1
                log.error(f"Error baca serial: {e}")
                if consecutive_errors > 10:
                    log.warning("Terlalu banyak error berturut-turut, reconnecting...")
                    self.ser = None
                    consecutive_errors = 0
                time.sleep(1)

        if self.ser and self.ser.is_open:
            self.ser.close()
            log.info("Serial ditutup.")

    def run(self, interval: float = DEFAULT_INTERVAL):
        """Entry point."""
        self.running = True

        # Start retry worker thread
        retry_thread = threading.Thread(target=self._retry_worker, daemon=True)
        retry_thread.start()

        try:
            if self.simulate:
                self.run_simulate(interval)
            else:
                self.run_live()
        except KeyboardInterrupt:
            log.info("\nBridge dihentikan.")
        finally:
            self.running = False
            self.buffer.close()
            log.info(f"📊 Stats: serial_reconnects={self._serial_reconnect_count}, "
                     f"backend_failures={self._backend_fail_count}")


# ─────────────────────────────────────────────────────────────────
# CLI Entry Point
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="VisioBin UART Bridge v2.0 — ESP32 ↔ Backend Golang"
    )
    parser.add_argument("--port",      type=str,   default=DEFAULT_PORT,     help="Serial port (default: /dev/ttyUSB0)")
    parser.add_argument("--baud",      type=int,   default=DEFAULT_BAUD,     help="Baud rate (default: 115200)")
    parser.add_argument("--url",       type=str,   default=DEFAULT_BACKEND,  help="Backend API base URL")
    parser.add_argument("--bin-id",    type=str,   default=DEFAULT_BIN_ID,   help="ID tempat sampah ini")
    parser.add_argument("--api-key",   type=str,   default=DEFAULT_API_KEY,  help="API key untuk autentikasi IoT")
    parser.add_argument("--interval",  type=float, default=DEFAULT_INTERVAL, help="Interval simulasi (detik)")
    parser.add_argument("--simulate",  action="store_true",                  help="Mode simulasi tanpa hardware")
    args = parser.parse_args()

    bridge = UARTBridge(
        port        = args.port,
        baud        = args.baud,
        backend_url = args.url,
        bin_id      = args.bin_id,
        api_key     = args.api_key,
        simulate    = args.simulate,
    )
    bridge.run(interval=args.interval)
