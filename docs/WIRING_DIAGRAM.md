# VisioBIN — Wiring Diagram & Hardware Guide

## 1. Komponen Hardware

| Komponen | Model | Fungsi | Qty |
|----------|-------|--------|-----|
| Microcontroller | ESP32 DevKit V1 | Prosesor utama, WiFi/BT | 1 |
| Single Board Computer | Raspberry Pi 4B | Gateway, AI inference | 1 |
| Sensor Jarak (Organik) | VL53L0X (ToF) | Mengukur jarak sampah organik | 1 |
| Sensor Jarak (Anorganik) | VL53L0X (ToF) | Mengukur jarak sampah anorganik | 1 |
| Load Cell (Organik) | 5kg Half-bridge | Berat kompartemen organik | 1 |
| Load Cell (Anorganik) | 5kg Half-bridge | Berat kompartemen anorganik | 1 |
| ADC Load Cell | HX711 | Konversi analog load cell | 2 |
| Sensor Gas | MQ-135 | Deteksi amonia (NH3) | 1 |
| Servo Motor | SG90 / MG996R | Pembuka tutup sortir | 2 |
| Kamera | RPi Camera Module v2 | Input gambar untuk AI | 1 |
| LED Status | RGB Common Cathode | Indikator status | 1 |
| Power Supply | 5V 3A USB-C | Power ESP32 + sensors | 1 |
| Power Supply RPi | 5V 3A USB-C | Power Raspberry Pi | 1 |

---

## 2. Wiring Diagram ESP32

```
ESP32 DevKit V1
┌─────────────┐
│           3V3├──── VL53L0X_1 VCC, VL53L0X_2 VCC
│           GND├──── Common Ground (semua sensor)
│              │
│  GPIO21 (SDA)├──── VL53L0X_1 SDA ──┐
│  GPIO22 (SCL)├──── VL53L0X_1 SCL ──┤ I2C Bus
│              │                      │ (gunakan XSHUT untuk multi-VL53L0X)
│       GPIO16 ├──── VL53L0X_2 XSHUT (alamat I2C alternatif)
│              │
│  GPIO25 (DT) ├──── HX711_1 DT  (Load Cell Organik)
│  GPIO26 (SCK)├──── HX711_1 SCK
│  GPIO27 (DT) ├──── HX711_2 DT  (Load Cell Anorganik)
│  GPIO14 (SCK)├──── HX711_2 SCK
│              │
│  GPIO34 (ADC)├──── MQ-135 AOUT (Analog, hanya input)
│              │
│  GPIO12 (PWM)├──── Servo_1 Signal (Organik)
│  GPIO13 (PWM)├──── Servo_2 Signal (Anorganik)
│              │
│   GPIO2 (LED)├──── LED Status (via 220Ω resistor)
│              │
│  TX (GPIO1)  ├──── RPi RX (GPIO15) ── via level shifter 3.3V
│  RX (GPIO3)  ├──── RPi TX (GPIO14) ── via level shifter 3.3V
│              │
│           VIN├──── 5V Power Supply
│           GND├──── Power Supply GND
└─────────────┘
```

---

## 3. Wiring Raspberry Pi

```
Raspberry Pi 4B
┌─────────────┐
│  GPIO14 (TX) ├──── ESP32 RX (GPIO3) ── via level shifter
│  GPIO15 (RX) ├──── ESP32 TX (GPIO1) ── via level shifter
│              │
│  CSI Camera  ├──── RPi Camera Module v2
│              │
│  USB-C Power ├──── 5V 3A Power Supply
│           GND├──── Common Ground
└─────────────┘
```

> ⚠️ **PENTING**: ESP32 menggunakan logic level 3.3V. Jika menggunakan UART langsung ke RPi (juga 3.3V), level shifter opsional. Tapi JANGAN sambungkan ke perangkat 5V tanpa level shifter.

---

## 4. Koneksi Load Cell ke HX711

```
Load Cell (Half-bridge)     HX711 Module
┌─────────┐                ┌──────────┐
│  RED (E+)├────────────────┤ E+       │
│  BLK (E-)├────────────────┤ E-       │
│  WHT (S+)├────────────────┤ A+       │
│  GRN (S-)├────────────────┤ A-       │
└─────────┘                │          │
                           │ VCC──3.3V │
                           │ GND──GND  │
                           │ DT───GPIO │
                           │ SCK──GPIO │
                           └──────────┘
```

---

## 5. Data Flow

```
┌──────────┐    Serial/UART     ┌────────────┐    HTTP REST     ┌─────────────┐
│  ESP32   │ ──────────────────►│ Raspberry  │ ───────────────►│  Go Backend │
│ (Sensor) │   9600 baud        │  Pi 4B     │   /api/v1/      │  (Cloud)    │
│          │   JSON format      │ (Gateway)  │   telemetry     │             │
└──────────┘                    │            │                 │             │
                                │  Camera ───┤   /api/v1/      │             │
                                │  AI Model  ├───────────────►│  PostgreSQL │
                                │  (TFLite)  │   classifications│             │
                                └────────────┘                 └──────┬──────┘
                                                                      │
                                                               ┌──────▼──────┐
                                                               │  WebSocket  │
                                                               │  Dashboard  │
                                                               │  (Web/App)  │
                                                               └─────────────┘
```

---

## 6. ESP32 Serial Output Format

```json
{
  "bin_id": "uuid-string",
  "distance_organic_cm": 15.2,
  "distance_inorganic_cm": 22.8,
  "weight_organic_kg": 1.5,
  "weight_inorganic_kg": 0.8,
  "gas_amonia_ppm": 12.3
}
```

---

## 7. Catatan Penting

1. **Kalibrasi Load Cell**: Gunakan perintah serial `CALIBRATE:2500` dari RPi ke ESP32 untuk set calibration factor. Nilai tersimpan di EEPROM.

2. **Multi VL53L0X**: Dua sensor VL53L0X pada I2C bus yang sama memerlukan XSHUT pin management. ESP32 akan toggle XSHUT untuk assign alamat I2C berbeda.

3. **MQ-135 Warm-up**: Sensor gas MQ-135 memerlukan ~20 menit warm-up sebelum pembacaan stabil. Firmware sudah handle ini dengan mengirim data setelah warm-up.

4. **Power Budget**:
   - ESP32: ~240mA (WiFi active)
   - 2x VL53L0X: ~40mA
   - 2x HX711: ~2mA
   - MQ-135: ~150mA
   - 2x Servo: ~500mA (stall)
   - **Total: ~1A peak** → gunakan 5V 2A minimum

5. **Watchdog**: ESP32 firmware v2.0 memiliki hardware watchdog 30 detik. Jika loop hang, device auto-reset.
