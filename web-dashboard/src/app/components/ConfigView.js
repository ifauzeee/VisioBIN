"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, Wifi, Bell, Clock, Database, Cpu, Save, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "./shared/Toast";

const DEFAULT_CONFIG = {
  apiUrl: "http://localhost:8080/api/v1",
  pollDashboard: 5,
  pollAlerts: 8,
  pollBins: 10,
  binWarningPct: 60,
  binCriticalPct: 80,
  gasWarningPpm: 30,
  gasCriticalPpm: 80,
  enableBrowserNotif: false,
  enableSoundAlert: false,
  autoRefresh: true,
};

export default function ConfigView() {
  const { showToast } = useToast();
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem("visiobin_config");
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const update = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setIsSaving(true);
    // Simulating API call/delay
    await new Promise(r => setTimeout(r, 800));
    
    try {
      localStorage.setItem("visiobin_config", JSON.stringify(config));
      setSaved(true);
      showToast("Konfigurasi berhasil disimpan!", "success");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      showToast("Gagal menyimpan konfigurasi", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem("visiobin_config");
    setSaved(false);
    showToast("Konfigurasi direset ke default", "info");
  };

  const InputRow = ({ icon: Icon, label, desc, children }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 0", borderBottom: "1px solid var(--border-color)",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color="var(--text-muted)" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-main)" }}>{label}</div>
          {desc && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );

  const NumInput = ({ value, onChange, unit, min = 1, max = 300 }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input type="number" value={value} min={min} max={max}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: 70, padding: "6px 10px", background: "var(--bg-page)",
          border: "1px solid var(--border-color)", borderRadius: 6, color: "var(--text-main)",
          fontSize: 13, outline: "none", textAlign: "right",
        }}
      />
      {unit && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{unit}</span>}
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: value ? "var(--brand-organic)" : "var(--border-color)",
      position: "relative", transition: "background 0.2s",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "var(--bg-card)",
        position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s",
      }} />
    </button>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } }
      }}
    >
      {/* Connection */}
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><Wifi size={16} /> Koneksi API</div>
        <div style={{ marginTop: 8 }}>
          <InputRow icon={Database} label="API Base URL" desc="Endpoint backend VisioBin">
            <input type="text" value={config.apiUrl}
              onChange={e => update("apiUrl", e.target.value)}
              style={{
                width: 280, padding: "6px 12px", background: "var(--bg-page)",
                border: "1px solid var(--border-color)", borderRadius: 6, color: "var(--text-main)",
                fontSize: 13, outline: "none", fontFamily: "JetBrains Mono, monospace",
              }}
            />
          </InputRow>
        </div>
      </motion.div>

      {/* Polling */}
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><Clock size={16} /> Interval Polling</div>
        <div style={{ marginTop: 8 }}>
          <InputRow icon={Clock} label="Dashboard" desc="Ringkasan & klasifikasi">
            <NumInput value={config.pollDashboard} onChange={v => update("pollDashboard", v)} unit="detik" />
          </InputRow>
          <InputRow icon={Bell} label="Notifikasi" desc="Cek alert baru">
            <NumInput value={config.pollAlerts} onChange={v => update("pollAlerts", v)} unit="detik" />
          </InputRow>
          <InputRow icon={Cpu} label="Perangkat" desc="Status bin & sensor">
            <NumInput value={config.pollBins} onChange={v => update("pollBins", v)} unit="detik" />
          </InputRow>
          <InputRow icon={Settings2} label="Auto Refresh" desc="Aktifkan polling otomatis">
            <Toggle value={config.autoRefresh} onChange={v => update("autoRefresh", v)} />
          </InputRow>
        </div>
      </motion.div>

      {/* Thresholds */}
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">⚠️ Threshold Peringatan</div>
        <div style={{ marginTop: 8 }}>
          <InputRow icon={Settings2} label="Volume Peringatan" desc="Warna kuning saat melebihi">
            <NumInput value={config.binWarningPct} onChange={v => update("binWarningPct", v)} unit="%" max={100} />
          </InputRow>
          <InputRow icon={Settings2} label="Volume Kritis" desc="Warna merah saat melebihi">
            <NumInput value={config.binCriticalPct} onChange={v => update("binCriticalPct", v)} unit="%" max={100} />
          </InputRow>
          <InputRow icon={Settings2} label="Gas Peringatan" desc="Alert gas amonia">
            <NumInput value={config.gasWarningPpm} onChange={v => update("gasWarningPpm", v)} unit="ppm" max={500} />
          </InputRow>
          <InputRow icon={Settings2} label="Gas Kritis" desc="Alert kritis gas amonia">
            <NumInput value={config.gasCriticalPpm} onChange={v => update("gasCriticalPpm", v)} unit="ppm" max={500} />
          </InputRow>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><Bell size={16} /> Notifikasi</div>
        <div style={{ marginTop: 8 }}>
          <InputRow icon={Bell} label="Notifikasi Browser" desc="Push notification saat alert kritis">
            <Toggle value={config.enableBrowserNotif} onChange={v => update("enableBrowserNotif", v)} />
          </InputRow>
          <InputRow icon={Bell} label="Suara Alert" desc="Bunyi saat ada peringatan baru">
            <Toggle value={config.enableSoundAlert} onChange={v => update("enableSoundAlert", v)} />
          </InputRow>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button onClick={reset} disabled={isSaving} style={{
          padding: "10px 20px", background: "transparent", border: "1px solid var(--border-color)",
          borderRadius: 8, color: "var(--text-muted)", fontSize: 13, fontWeight: 500, cursor: isSaving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <RotateCcw size={14} /> Reset Default
        </button>
        <button onClick={save} disabled={isSaving} style={{
          padding: "10px 24px", background: saved ? "var(--brand-organic)" : "var(--text-main)",
          border: "none", borderRadius: 8, color: saved ? "#fff" : "var(--bg-page)",
          fontSize: 13, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.2s",
          minWidth: 160, justifyContent: "center"
        }}>
          {isSaving ? (
            <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
          ) : saved ? (
            <><Save size={14} /> Tersimpan</>
          ) : (
            <><Save size={14} /> Simpan Konfigurasi</>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

