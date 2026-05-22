#!/bin/bash
# ============================================================
# VisioBin — Raspberry Pi Deployment Script
# ============================================================
# Jalankan script ini di Raspberry Pi setelah clone repo:
#   chmod +x scripts/deploy_raspi.sh
#   ./scripts/deploy_raspi.sh
#
# Prasyarat:
#   - Raspberry Pi OS (Bullseye/Bookworm) 64-bit
#   - Koneksi internet aktif
#   - User dengan sudo privileges
# ============================================================

set -e  # Hentikan jika ada error

# ── Warna untuk output ──────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       VisioBin — Raspberry Pi Setup                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Variabel ────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AI_DIR="$PROJECT_DIR/ai-model"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
VENV_DIR="$AI_DIR/venv"
SERVICE_NAME="visiobin-ai"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# ── Konfigurasi (edit sesuai kebutuhan) ─────────────────────
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$PROJECT_DIR/.env"
    set +a
else
    log_error "File .env tidak ditemukan di root project."
fi

: "${VISIOBIN_BIN_ID:?VISIOBIN_BIN_ID wajib ada di .env}"
: "${VISIOBIN_BACKEND:?VISIOBIN_BACKEND wajib ada di .env}"
: "${VISIOBIN_CAMERA:?VISIOBIN_CAMERA wajib ada di .env}"
: "${VISIOBIN_THRESHOLD:?VISIOBIN_THRESHOLD wajib ada di .env}"
: "${VISIOBIN_COOLDOWN:?VISIOBIN_COOLDOWN wajib ada di .env}"
: "${VISIOBIN_BACKEND_API_BASE:?VISIOBIN_BACKEND_API_BASE wajib ada di .env}"
: "${VISIOBIN_UART_PORT:?VISIOBIN_UART_PORT wajib ada di .env}"
: "${VISIOBIN_UART_BAUD:?VISIOBIN_UART_BAUD wajib ada di .env}"

BIN_ID="$VISIOBIN_BIN_ID"
BACKEND_URL="$VISIOBIN_BACKEND"
CAMERA_SOURCE="$VISIOBIN_CAMERA"
THRESHOLD="$VISIOBIN_THRESHOLD"
COOLDOWN="$VISIOBIN_COOLDOWN"

log_info "Project dir : $PROJECT_DIR"
log_info "Bin ID      : $BIN_ID"
log_info "Backend URL : $BACKEND_URL"
log_info "Camera src  : $CAMERA_SOURCE"

# ── Step 1: Update sistem ────────────────────────────────────
log_info "Step 1/7: Update package list..."
sudo apt-get update -q
log_ok "Package list updated"

# ── Step 2: Install dependensi sistem ───────────────────────
log_info "Step 2/7: Install dependensi sistem..."
sudo apt-get install -y -q \
    python3 \
    python3-pip \
    python3-venv \
    python3-opencv \
    libatlas-base-dev \
    libhdf5-dev \
    libhdf5-serial-dev \
    libharfbuzz0b \
    libwebp7 \
    libtiff6 \
    libjasper-dev \
    libilmbase25 \
    libopenexr25 \
    libgstreamer1.0-dev \
    v4l-utils \
    git \
    curl
log_ok "Dependensi sistem terinstal"

# ── Step 3: Buat virtual environment ────────────────────────
log_info "Step 3/7: Setup Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    log_ok "Virtual environment dibuat: $VENV_DIR"
else
    log_warn "Virtual environment sudah ada, skip"
fi

# Aktifkan venv
source "$VENV_DIR/bin/activate"

# ── Step 4: Install Python dependencies ─────────────────────
log_info "Step 4/7: Install Python packages..."
pip install --upgrade pip -q

# Install PyTorch untuk Raspberry Pi ARM
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q || \
    pip install torch torchvision -q

# Install paket lainnya
pip install \
    requests \
    pyserial \
    opencv-python-headless \
    numpy \
    Pillow -q

log_ok "Python packages terinstal"

# ── Step 5: Verifikasi kamera ────────────────────────────────
log_info "Step 5/7: Cek kamera..."
if v4l2-ctl --list-devices 2>/dev/null | grep -q "Video"; then
    log_ok "Kamera terdeteksi"
elif ls /dev/video* 2>/dev/null | head -1; then
    log_ok "Video device ditemukan"
else
    log_warn "Kamera tidak terdeteksi. Pastikan Pi Camera Module terpasang dan diaktifkan."
    log_warn "Jalankan: sudo raspi-config → Interface Options → Camera → Enable"
fi

# ── Step 6: Cek koneksi ke backend ──────────────────────────
log_info "Step 6/7: Test koneksi ke backend..."
BACKEND_HOST=$(echo "$BACKEND_URL" | sed 's|http://||' | cut -d'/' -f1 | cut -d':' -f1)
BACKEND_CHECK_PORT=$(echo "$BACKEND_URL" | sed 's|http://||' | cut -d'/' -f1 | cut -d':' -f2)

if nc -z -w 3 "$BACKEND_HOST" "$BACKEND_CHECK_PORT" 2>/dev/null; then
    log_ok "Backend tersedia: $BACKEND_HOST:$BACKEND_CHECK_PORT"
else
    log_warn "Backend tidak dapat dijangkau: $BACKEND_HOST:$BACKEND_CHECK_PORT"
    log_warn "Pastikan backend sudah berjalan dan IP benar."
fi

# ── Step 7: Setup systemd service ───────────────────────────
log_info "Step 7/7: Setup systemd service..."

CURRENT_USER=$(whoami)

sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=VisioBin AI Bridge — Edge AI Inference Service
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${AI_DIR}
ExecStart=${VENV_DIR}/bin/python ${AI_DIR}/ai_bridge.py \\
    --source ${CAMERA_SOURCE} \\
    --url ${BACKEND_URL} \\
    --bin-id ${BIN_ID} \\
    --threshold ${THRESHOLD} \\
    --cooldown ${COOLDOWN}
Restart=on-failure
RestartSec=10s
StandardOutput=journal
StandardError=journal
Environment=DISPLAY=:0
Environment=VISIOBIN_BIN_ID=${BIN_ID}

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
log_ok "Service systemd dikonfigurasi: $SERVICE_NAME"

# ── Setup UART Bridge (jika diperlukan) ─────────────────────
UART_SERVICE_FILE="/etc/systemd/system/visiobin-uart.service"
sudo tee "$UART_SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=VisioBin UART Bridge — ESP32 Communication
After=network.target ${SERVICE_NAME}.service
Wants=${SERVICE_NAME}.service

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${AI_DIR}
ExecStart=${VENV_DIR}/bin/python ${AI_DIR}/uart_bridge.py \\
    --port ${VISIOBIN_UART_PORT} \\
    --baud ${VISIOBIN_UART_BAUD} \\
    --bin-id ${BIN_ID} \\
    --url ${VISIOBIN_BACKEND_API_BASE}
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable visiobin-uart
log_ok "UART bridge service dikonfigurasi"

# ── Ringkasan ────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       SETUP SELESAI!                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo " Perintah berguna:"
echo ""
echo "  # Mulai AI Bridge:"
echo "  sudo systemctl start visiobin-ai"
echo ""
echo "  # Mulai UART Bridge:"
echo "  sudo systemctl start visiobin-uart"
echo ""
echo "  # Lihat log real-time:"
echo "  sudo journalctl -u visiobin-ai -f"
echo "  sudo journalctl -u visiobin-uart -f"
echo ""
echo "  # Cek status:"
echo "  sudo systemctl status visiobin-ai"
echo ""
echo "  # Test manual tanpa kamera (mock mode):"
echo "  source $VENV_DIR/bin/activate"
echo "  python $AI_DIR/ai_bridge.py --mock --mock-dir test_images/"
echo ""
echo "  # Test UART simulator tanpa ESP32:"
echo "  python $AI_DIR/uart_bridge.py --simulate --interval 5"
echo ""
