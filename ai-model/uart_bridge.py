"""
VisioBin UART Bridge
====================
Script yang berjalan di Raspberry Pi untuk:
1. Menerima data sensor dari ESP32 via UART (serial JSON)
2. Meneruskan data ke Backend Golang (REST API)

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
import threading
import random
import logging

import requests

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
DEFAULT_BACKEND  = os.environ.get("VISIOBIN_BACKEND",       "http://localhost:8080/api/v1")
DEFAULT_BIN_ID   = os.environ.get("VISIOBIN_BIN_ID",        "VBIN-01")
DEFAULT_INTERVAL = float(os.environ.get("VISIOBIN_INTERVAL", "5.0"))


class UARTBridge:
    """
    Jembatan komunikasi antara ESP32 (UART) dan Backend Golang (HTTP).
    
    Protocol ESP32 → RPi:
        - Setiap baris adalah satu JSON object yang diakhiri newline
        - type: "telemetry" | "servo_done" | "heartbeat"
    
    Protocol RPi → ESP32:
        - Perintah teks satu baris: "CLASSIFY:organic\n" atau "CLASSIFY:inorganic\n"
    """

    def __init__(self, port, baud, backend_url, bin_id, simulate=False):
        self.port        = port
        self.baud        = baud
        self.backend     = backend_url
        self.bin_id      = bin_id
        self.simulate    = simulate
        self.ser         = None
        self.running     = False
        self._session    = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

        log.info(f"Platform     : Raspberry Pi (UART Bridge)")
        log.info(f"UART Port    : {port} @ {baud} baud")
        log.info(f"Backend URL  : {backend_url}")
        log.info(f"Bin ID       : {bin_id}")
        log.info(f"Mode         : {'SIMULATE' if simulate else 'LIVE UART'}")

    # ── Serial Setup ───────────────────────────────────────────────

    def _open_serial(self):
        """Buka koneksi serial ke ESP32."""
        try:
            import serial
        except ImportError:
            log.error("pyserial tidak terinstal. Jalankan: pip install pyserial")
            sys.exit(1)

        for attempt in range(5):
            try:
                self.ser = serial.Serial(
                    port=self.port,
                    baudrate=self.baud,
                    timeout=2.0,
                    write_timeout=2.0
                )
                self.ser.flushInput()
                log.info(f"Serial terbuka: {self.port} @ {self.baud}")
                return
            except Exception as e:
                log.warning(f"Gagal buka serial (percobaan {attempt+1}/5): {e}")
                time.sleep(2)

        log.error(f"Tidak bisa membuka port serial: {self.port}")
        sys.exit(1)

    # ── Backend Communication ──────────────────────────────────────

    def _send_telemetry(self, data: dict):
        """Kirim data telemetri ke backend."""
        payload = {
            "bin_id":               self.bin_id,
            "distance_organic_cm":  data.get("dist_org",    0.0),
            "distance_inorganic_cm": data.get("dist_inorg", 0.0),
            "weight_organic_kg":    data.get("weight_org",  0.0),
            "weight_inorganic_kg":  data.get("weight_inorg", 0.0),
            "gas_amonia_ppm":       data.get("gas_ppm",     0.0),
        }
        try:
            resp = self._session.post(
                f"{self.backend}/telemetry",
                json=payload,
                timeout=3
            )
            if resp.status_code == 201:
                vol_o = ((50 - payload["distance_organic_cm"]) / 50) * 100
                vol_i = ((50 - payload["distance_inorganic_cm"]) / 50) * 100
                log.info(
                    f"✓ Telemetri terkirim | "
                    f"Vol: {vol_o:.0f}%/{vol_i:.0f}% | "
                    f"Gas: {payload['gas_amonia_ppm']:.1f}ppm"
                )
            else:
                log.warning(f"✗ Backend HTTP {resp.status_code}: {resp.text[:80]}")
        except requests.exceptions.ConnectionError:
            log.error(f"✗ Backend tidak tersedia: {self.backend}")
        except Exception as e:
            log.error(f"✗ Error kirim telemetri: {e}")

    def _send_servo_command(self, direction: str):
        """
        Kirim perintah ke ESP32 untuk menggerakkan servo.
        direction: "organic" | "inorganic"
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
        """Mode live: baca dari UART serial ESP32."""
        self._open_serial()
        log.info("Menunggu data dari ESP32... (Ctrl+C untuk berhenti)")
        log.info("-" * 60)

        while self.running:
            try:
                if self.ser.in_waiting > 0:
                    raw = self.ser.readline()
                    line = raw.decode("utf-8", errors="replace")
                    self._handle_message(line)
                else:
                    time.sleep(0.05)
            except Exception as e:
                log.error(f"Error baca serial: {e}")
                time.sleep(1)

        if self.ser and self.ser.is_open:
            self.ser.close()
            log.info("Serial ditutup.")

    def run(self, interval: float = DEFAULT_INTERVAL):
        """Entry point."""
        self.running = True
        try:
            if self.simulate:
                self.run_simulate(interval)
            else:
                self.run_live()
        except KeyboardInterrupt:
            log.info("\nBridge dihentikan.")
            self.running = False


# ─────────────────────────────────────────────────────────────────
# CLI Entry Point
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="VisioBin UART Bridge — ESP32 ↔ Backend Golang"
    )
    parser.add_argument("--port",      type=str,   default=DEFAULT_PORT,     help="Serial port (default: /dev/ttyUSB0)")
    parser.add_argument("--baud",      type=int,   default=DEFAULT_BAUD,     help="Baud rate (default: 115200)")
    parser.add_argument("--url",       type=str,   default=DEFAULT_BACKEND,  help="Backend API base URL")
    parser.add_argument("--bin-id",    type=str,   default=DEFAULT_BIN_ID,   help="ID tempat sampah ini")
    parser.add_argument("--interval",  type=float, default=DEFAULT_INTERVAL, help="Interval simulasi (detik)")
    parser.add_argument("--simulate",  action="store_true",                  help="Mode simulasi tanpa hardware")
    args = parser.parse_args()

    bridge = UARTBridge(
        port        = args.port,
        baud        = args.baud,
        backend_url = args.url,
        bin_id      = args.bin_id,
        simulate    = args.simulate,
    )
    bridge.run(interval=args.interval)
