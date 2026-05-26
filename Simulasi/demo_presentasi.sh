#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  VISIOBIN — Demo Cepat untuk Presentasi Dosen
#  Jalankan: bash demo_presentasi.sh
# ═══════════════════════════════════════════════════════════

set -euo pipefail

BASE_URL="${VISIOBIN_API:-http://localhost:8080/api/v1}"
USER="${VISIOBIN_USER:-admin}"
PASS="${VISIOBIN_PASS:-admin123}"
API_KEY="${API_KEY:-visiobin-iot-secret-key}"

# ─── Warna ─────────────────────────────────────────────────
R='\033[0m'; BOLD='\033[1m'
RED='\033[91m'; GREEN='\033[92m'; YELLOW='\033[93m'
BLUE='\033[94m'; CYAN='\033[96m'; GRAY='\033[90m'

ts()    { date '+%H:%M:%S'; }
log()   { echo -e "${GRAY}[$(ts)]${R} $1"; }
ok()    { echo -e "${GRAY}[$(ts)]${R} ${GREEN}✅  $1${R}"; }
err()   { echo -e "${GRAY}[$(ts)]${R} ${RED}❌  $1${R}"; }
warn()  { echo -e "${GRAY}[$(ts)]${R} ${YELLOW}⚠️   $1${R}"; }
info()  { echo -e "${GRAY}[$(ts)]${R} ${CYAN}ℹ️   $1${R}"; }
alert() { echo -e "${GRAY}[$(ts)]${R} ${RED}${BOLD}🚨  $1${R}"; }

header() {
  echo
  echo -e "${BLUE}${BOLD}══════════════════════════════════════════════════════════${R}"
  echo -e "${BLUE}${BOLD}  $1${R}"
  echo -e "${BLUE}${BOLD}══════════════════════════════════════════════════════════${R}"
}

divider() { echo -e "${GRAY}──────────────────────────────────────────────────────────${R}"; }

# ─── Login → ambil token ────────────────────────────────────
login() {
  info "Login ke backend ..."
  local resp
  resp=$(curl -sf -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USER\",\"password\":\"$PASS\"}" 2>/dev/null) || {
    err "Backend tidak bisa diakses! Cek: docker compose ps"
    exit 1
  }
  TOKEN=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['token'])" 2>/dev/null || echo "")
  if [ -z "$TOKEN" ]; then
    err "Login gagal. Cek username/password di .env"
    exit 1
  fi
  ok "Login berhasil!"
}

# ─── Ambil bin pertama ──────────────────────────────────────
get_first_bin() {
  local resp
  resp=$(curl -sf "$BASE_URL/bins" -H "Authorization: Bearer $TOKEN" 2>/dev/null) || return 1
  BIN_ID=$(echo "$resp" | python3 -c "
import sys,json
d=json.load(sys.stdin)
bins=d.get('data',[])
if bins: print(bins[0]['id'])
" 2>/dev/null || echo "")
  BIN_NAME=$(echo "$resp" | python3 -c "
import sys,json
d=json.load(sys.stdin)
bins=d.get('data',[])
if bins: print(bins[0]['name'])
" 2>/dev/null || echo "unknown")
  BIN_KEY=$(echo "$resp" | python3 -c "
import sys,json
d=json.load(sys.stdin)
bins=d.get('data',[])
if bins: print(bins[0].get('api_key',''))
" 2>/dev/null || echo "")
  [ -z "$BIN_KEY" ] && BIN_KEY="$API_KEY"
}

# ─── Kirim telemetri ────────────────────────────────────────
kirim_telemetri() {
  local bin_id="$1" dist_org="$2" dist_inorg="$3" w_org="$4" w_inorg="$5" gas="$6" key="${7:-$BIN_KEY}"
  local payload="{\"bin_id\":\"$bin_id\",\"distance_organic_cm\":$dist_org,\"distance_inorganic_cm\":$dist_inorg,\"weight_organic_kg\":$w_org,\"weight_inorganic_kg\":$w_inorg,\"gas_amonia_ppm\":$gas}"
  local http_code
  http_code=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/telemetry" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $key" \
    -d "$payload" 2>/dev/null || echo "000")
  echo "$http_code"
}

# ─── Cek dashboard ──────────────────────────────────────────
cek_dashboard() {
  curl -sf "$BASE_URL/dashboard/summary" -H "Authorization: Bearer $TOKEN" 2>/dev/null \
    | python3 -c "
import sys,json
d=json.load(sys.stdin).get('data',{})
print(f\"  Total: {d.get('total_bins','?')} | Online: {d.get('active_bins','?')} | Hampir penuh: {d.get('bins_near_full','?')} | Alert: {d.get('unread_alerts','?')}\")
" 2>/dev/null || echo "  (gagal ambil dashboard)"
}

# ─── Cek alerts ─────────────────────────────────────────────
cek_alerts() {
  curl -sf "$BASE_URL/alerts" -H "Authorization: Bearer $TOKEN" 2>/dev/null \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
alerts=[a for a in d.get('data',[]) if not a.get('is_read')]
print(f'  {len(alerts)} alert belum dibaca:')
for a in alerts[:5]:
  sev=a.get('severity','?').upper()
  msg=a.get('message','')[:65]
  bin_name=a.get('bin_name','?')
  print(f'  [{sev}] {bin_name}: {msg}')
" 2>/dev/null || echo "  (gagal ambil alerts)"
}

TOKEN=""
BIN_ID=""
BIN_NAME=""
BIN_KEY=""

# ═══════════════════════════════════════════════════════════
echo -e "${BLUE}${BOLD}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     VISIOBIN — Demo Monitoring & Simulasi Gangguan       ║"
echo "║         Tugas Perancangan Manajemen Sistem               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${R}"

login
get_first_bin

echo
info "Bin target: $BIN_NAME ($BIN_ID)"
echo
info "Dashboard awal:"
cek_dashboard

# ─── MENU ──────────────────────────────────────────────────
echo
echo -e "${BOLD}Pilih aksi demo:${R}"
echo "  1) Kirim telemetri NORMAL (semua oke)"
echo "  2) Simulasi SENSOR OFFLINE (berhenti kirim data)"
echo "  3) Simulasi PACKET LOSS (sebagian request gagal)"
echo "  4) Simulasi GATEWAY DOWN (backend unreachable)"
echo "  5) Simulasi BIN HAMPIR PENUH (trigger alert)"
echo "  6) Cek STATUS & ALERT sekarang"
echo "  7) Jalankan SEMUA skenario berurutan"
echo "  q) Keluar"
echo

while true; do
  printf "${CYAN}Pilihan [1-7/q]: ${R}"
  read -r pilihan

  case "$pilihan" in

    1)
      header "SKENARIO: TELEMETRI NORMAL"
      info "Mengirim 5 data telemetri normal ke $BIN_NAME ..."
      for i in {1..5}; do
        code=$(kirim_telemetri "$BIN_ID" "28.5" "32.0" "1.45" "0.92" "95.3")
        ok "[$i/5] HTTP $code — volume organik ~43%, anorganik ~36%"
        sleep 1
      done
      ok "Semua data masuk! Cek di dashboard: http://localhost:3000"
      ;;

    2)
      header "SKENARIO 1: SENSOR OFFLINE / BIN DOWN"
      warn "Membuktikan deteksi perangkat tidak responsif ..."
      divider
      info "Kirim data normal dulu (baseline) ..."
      code=$(kirim_telemetri "$BIN_ID" "30" "33" "1.2" "0.8" "90")
      ok "Baseline: HTTP $code"
      sleep 1
      divider
      warn "MENGHENTIKAN pengiriman dari $BIN_NAME ..."
      warn "Bin tidak akan kirim data selama 90 detik ..."
      info "(Di sistem nyata threshold = 5 menit)"
      info "Sambil menunggu, lihat log backend:"
      echo -e "    ${CYAN}docker logs -f \$(docker compose ps -q backend) | grep -i offline${R}"
      echo
      for i in {1..6}; do
        echo -ne "  ${GRAY}Menunggu... ${i}0 detik${R}\r"
        sleep 15
      done
      echo
      alert "Setelah worker berjalan → status bin akan berubah ke OFFLINE!"
      info "Cek: curl -s '$BASE_URL/bins/$BIN_ID' | python3 -m json.tool | grep status"
      curl -sf "$BASE_URL/bins/$BIN_ID" -H "Authorization: Bearer $TOKEN" 2>/dev/null \
        | python3 -c "
import sys,json
b=json.load(sys.stdin).get('data',{})
print(f\"  Status    : {b.get('status','?')}\")
print(f\"  Last Seen : {b.get('last_seen','?')}\")
" 2>/dev/null || echo "  (gagal ambil status bin)"
      ;;

    3)
      header "SKENARIO 3: PACKET LOSS"
      info "Mengirim 15 paket, ~40% sengaja digagalkan ..."
      divider
      OK=0; FAIL=0
      for i in {1..15}; do
        if (( RANDOM % 10 < 4 )); then
          warn "[$i/15] DROP  ← paket hilang (simulasi WiFi lemah)"
          (( FAIL++ )) || true
        else
          code=$(kirim_telemetri "$BIN_ID" "30" "33" "1.2" "0.8" "90" 2>/dev/null || echo "000")
          ok "[$i/15] HTTP $code — paket diterima"
          (( OK++ )) || true
        fi
        sleep 0.4
      done
      divider
      echo -e "  Terkirim : ${GREEN}$OK/15${R}"
      echo -e "  Hilang   : ${RED}$FAIL/15${R}  ($(( FAIL * 100 / 15 ))% packet loss)"
      warn "Gap data akan terlihat di grafik sensor dashboard!"
      ;;

    4)
      header "SKENARIO 4: GATEWAY DOWN"
      info "Kirim request ke backend yang 'mati' (port salah) ..."
      divider
      DEAD_URL="${BASE_URL//:8080/:9999}"
      FAIL=0
      for i in {1..6}; do
        printf "  [%d/6] POST ke %s ... " "$i" "$DEAD_URL"
        code=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "$DEAD_URL/telemetry" \
          -H "Content-Type: application/json" \
          -H "X-API-Key: $BIN_KEY" \
          -d '{"bin_id":"test"}' \
          --connect-timeout 2 \
          --max-time 3 2>/dev/null || echo "000")
        if [ "$code" = "000" ]; then
          echo -e "${RED}GAGAL${R} (connection refused / timeout)"
          (( FAIL++ )) || true
        else
          echo -e "${GREEN}HTTP $code${R}"
        fi
        sleep 0.8
      done
      divider
      alert "GATEWAY DOWN — $FAIL/6 request gagal!"
      warn "Untuk demo nyata: docker compose stop backend"
      warn "Recovery        : docker compose start backend"
      echo
      info "Setelah 5 menit, semua bin akan ditandai OFFLINE oleh worker"
      info "Bukti di log: docker logs <backend-container> | grep UpdateOfflineStatuses"
      ;;

    5)
      header "SKENARIO 5: BIN HAMPIR PENUH → TRIGGER ALERT"
      info "Mengirim data dengan volume ekstrem ke $BIN_NAME ..."
      divider
      declare -a STEPS=("5 5 0.5 0.3 50 Normal-awal" "15 14 1.5 1.0 100 Naik-pelan" "7 8 3.8 2.5 200 Hampir-penuh" "4 4 4.5 3.1 380 KRITIS!" "2.5 2.5 4.9 3.5 480 OVERFLOW!")
      for step in "${STEPS[@]}"; do
        read -r dist_o dist_i w_o w_i gas label <<< "$step"
        vol_o=$(echo "scale=0; (50 - $dist_o) * 100 / 50" | bc 2>/dev/null || echo "?")
        code=$(kirim_telemetri "$BIN_ID" "$dist_o" "$dist_i" "$w_o" "$w_i" "$gas")
        if (( vol_o > 85 )); then
          alert "Vol Organik: ~${vol_o}% | Gas: ${gas}ppm → HTTP $code  ← $label"
        elif (( vol_o > 70 )); then
          warn "Vol Organik: ~${vol_o}% | Gas: ${gas}ppm → HTTP $code  ← $label"
        else
          ok "Vol Organik: ~${vol_o}% | Gas: ${gas}ppm → HTTP $code  ← $label"
        fi
        sleep 1.5
      done
      divider
      info "Cek alert yang terpicu ..."
      sleep 2
      cek_alerts
      warn "Buka mobile app untuk lihat push notification FCM (jika dikonfigurasi)"
      ;;

    6)
      header "STATUS & ALERT SEKARANG"
      info "Dashboard summary:"
      cek_dashboard
      echo
      info "Alert aktif:"
      cek_alerts
      ;;

    7)
      header "SEMUA SKENARIO BERURUTAN"
      for s in 1 3 4 5; do
        bash "$0" <<< "$s" 2>/dev/null || true
        sleep 2
      done
      ;;

    q|Q)
      echo
      ok "Demo selesai. Dashboard: http://localhost:3000"
      break
      ;;

    *)
      warn "Pilihan tidak valid. Masukkan 1-7 atau q"
      ;;
  esac

  echo
  info "Dashboard terkini:"
  cek_dashboard
  echo
done
