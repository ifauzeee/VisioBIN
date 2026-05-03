"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, ShieldCheck, FileText, ChevronDown, 
  Search, ExternalLink, Mail, MessageCircle, 
  Trash2, Cpu, Camera, Lock
} from "lucide-react";

const FAQ_DATA = [
  {
    q: "Bagaimana cara kerja pemilahan otomatis VisioBin?",
    a: "VisioBin menggunakan kamera Raspberry Pi dan model AI YOLOv5n yang telah dilatih untuk mendeteksi ribuan gambar sampah organik dan anorganik. Saat sampah diletakkan di area pemindaian, AI akan mengidentifikasi jenisnya dan menginstruksikan motor servo untuk mengarahkan sampah ke reservoir yang tepat."
  },
  {
    q: "Apakah kamera merekam wajah pengguna?",
    a: "Tidak. Privasi adalah prioritas kami. Kamera hanya aktif saat mendeteksi adanya objek di area pemindaian. Algoritma kami dirancang khusus untuk deteksi objek (sampah), bukan wajah manusia. Gambar tidak disimpan secara permanen di server."
  },
  {
    q: "Apa yang harus dilakukan jika sensor tidak akurat?",
    a: "Pastikan lensa kamera bersih dari debu atau uap air. Periksa juga apakah sensor ultrasonik terhalang benda asing. Jika masalah berlanjut, gunakan fitur 'Maintenance Mode' di dashboard untuk melakukan kalibrasi ulang sensor."
  },
  {
    q: "Bagaimana cara mendapatkan notifikasi saat bin penuh?",
    a: "Pastikan Anda telah menginstal aplikasi mobile VisioBin dan masuk menggunakan akun operator. Dashboard akan secara otomatis mengirimkan push notification via Firebase (FCM) saat volume mencapai ambang batas 80%."
  }
];

const PRIVACY_CONTENT = `
### Kebijakan Privasi VisioBin

Terakhir diperbarui: 4 Mei 2026

**1. Pengumpulan Data**
Kami mengumpulkan data telemetri berupa berat, volume, dan kadar gas amonia dari unit stasiun VisioBin. Data ini digunakan murni untuk tujuan optimasi manajemen sampah.

**2. Pemrosesan Visual (Edge AI)**
Unit VisioBin menggunakan kamera untuk klasifikasi sampah. Pemrosesan gambar dilakukan secara lokal (on-device) di Raspberry Pi. Gambar hasil klasifikasi yang dikirim ke server (jika diaktifkan untuk training) akan dianonimisasi dan tidak menyertakan data pribadi pengguna.

**3. Keamanan Data**
Semua komunikasi data antara perangkat IoT, server, dan dashboard dilindungi dengan enkripsi SSL/TLS dan protokol autentikasi API Key/JWT.

**4. Hak Pengguna**
Pengguna berhak meminta penghapusan log aktivitas yang terkait dengan akun mereka melalui menu pengaturan profil.
`;

const TERMS_CONTENT = `
### Ketentuan Layanan

**1. Lisensi Penggunaan**
Sistem VisioBin diberikan kepada instansi/pengguna untuk tujuan pengelolaan sampah pintar. Dilarang melakukan rekayasa balik (reverse engineering) pada model AI tanpa izin tertulis.

**2. Akurasi AI**
Meskipun model AI kami memiliki akurasi tinggi (>95%), klasifikasi sampah tetap memiliki kemungkinan galat. Pengguna disarankan untuk melakukan pengecekan berkala.

**3. Tanggung Jawab**
VisioBin tidak bertanggung jawab atas kegagalan sistem yang disebabkan oleh gangguan jaringan internet atau kerusakan fisik akibat vandalisme pada unit stasiun.
`;

const Accordion = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border-color)", overflow: "hidden" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: "100%", padding: "20px 0", background: "transparent", border: "none",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer", color: "var(--text-main)", textAlign: "left"
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>{item.q}</span>
        <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s" }} color="var(--text-muted)" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ paddingBottom: 20, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}
          >
            {item.a}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function HelpCenterView() {
  const [activeTab, setActiveTab] = useState("faq");

  return (
    <div className="view-transition">
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 300px", gap: 40, alignItems: "start" }}>
        
        {/* Local Sidebar Navigation */}
        <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginLeft: 12 }}>
            Pusat Bantuan
          </div>
          {[
            { id: "faq", label: "FAQ", icon: <HelpCircle size={16} /> },
            { id: "privacy", label: "Kebijakan Privasi", icon: <ShieldCheck size={16} /> },
            { id: "terms", label: "Ketentuan Layanan", icon: <FileText size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                background: activeTab === tab.id ? "rgba(16, 185, 129, 0.06)" : "transparent",
                border: "none", cursor: "pointer", borderRadius: 8,
                color: activeTab === tab.id ? "var(--brand-organic)" : "var(--text-muted)",
                fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 500,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                position: "relative", textAlign: "left", width: "100%"
              }}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  style={{ 
                    position: "absolute", left: 0, top: 8, bottom: 8, width: 2, 
                    background: "var(--brand-organic)", borderRadius: "0 4px 4px 0",
                    boxShadow: "0 0 8px var(--brand-organic)"
                  }} 
                />
              )}
              <span style={{ display: "flex", alignItems: "center", color: activeTab === tab.id ? "var(--brand-organic)" : "inherit" }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {activeTab === "faq" && (
              <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {FAQ_DATA.map((item, i) => <Accordion key={i} item={item} />)}
              </motion.div>
            )}

            {activeTab === "privacy" && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="card" style={{ padding: 32, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                    {PRIVACY_CONTENT}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "terms" && (
              <motion.div key="terms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="card" style={{ padding: 32, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                    {TERMS_CONTENT}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="card" style={{ position: "sticky", top: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 20 }}>Butuh bantuan lain?</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <a href="mailto:support@visiobin.local" style={{ 
                display: "flex", alignItems: "center", gap: 12, padding: 16, 
                background: "var(--bg-hover)", borderRadius: 12, textDecoration: "none", color: "var(--text-main)"
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.1)", color: "var(--brand-organic)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Email Support</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Balasan dalam 24 jam</div>
                </div>
              </a>

              <a href="#" style={{ 
                display: "flex", alignItems: "center", gap: 12, padding: 16, 
                background: "var(--bg-hover)", borderRadius: 12, textDecoration: "none", color: "var(--text-main)"
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.1)", color: "var(--brand-inorganic)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageCircle size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Live Chat</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Tersedia Senin - Jumat</div>
                </div>
              </a>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--brand-organic)", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                <ShieldCheck size={14} /> Terverifikasi Aman
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Sistem VisioBin mematuhi standar keamanan data IoT dan enkripsi end-to-end. Kami tidak membagikan data Anda kepada pihak ketiga tanpa persetujuan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
