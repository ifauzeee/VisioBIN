"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { 
  HelpCircle, ShieldCheck, FileText, ChevronDown, 
  Mail, MessageCircle, Cpu, Camera, Lock, EyeOff,
  Server, UserCheck, Scale, AlertTriangle, Zap, Info, Database,
  BarChart, Activity, CheckCircle2, Wrench, Trash2, AlertCircle
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

const PRIVACY_POINTS = [
  {
    icon: <Database size={18} />,
    title: "Pengumpulan Data Telemetri",
    desc: "Kami mengumpulkan data teknis berupa berat, volume, dan kadar gas amonia dari setiap unit VisioBin. Data ini digunakan secara anonim untuk statistik manajemen sampah dan optimasi rute pengangkutan."
  },
  {
    icon: <EyeOff size={18} />,
    title: "Privasi Visual (Edge AI)",
    desc: "Kamera pada unit VisioBin hanya memproses gambar objek sampah. Pemrosesan dilakukan secara lokal di perangkat (Edge AI). Kami tidak merekam wajah pengguna atau aktivitas di sekitar unit."
  },
  {
    icon: <Server size={18} />,
    title: "Penyimpanan & Keamanan",
    desc: "Data Anda disimpan menggunakan enkripsi AES-256. Semua transmisi data antara perangkat IoT, server Cloud, dan Dashboard dilindungi oleh protokol SSL/TLS yang aman."
  },
  {
    icon: <UserCheck size={18} />,
    title: "Kontrol Data Pengguna",
    desc: "Anda memiliki kendali penuh atas data Anda. Operator dapat meminta penghapusan riwayat telemetri atau log aktivitas melalui menu pengaturan profil kapan saja."
  }
];

const TERMS_POINTS = [
  {
    icon: <Scale size={18} />,
    title: "Lisensi Penggunaan",
    desc: "Platform VisioBin dilisensikan untuk penggunaan manajemen sampah pintar. Pengguna dilarang melakukan modifikasi ilegal pada firmware IoT atau mencoba melakukan reverse engineering pada model AI."
  },
  {
    icon: <Zap size={18} />,
    title: "Batasan Tanggung Jawab",
    desc: "Meskipun model AI kami memiliki tingkat akurasi di atas 95%, VisioBin tidak bertanggung jawab atas kesalahan klasifikasi yang disebabkan oleh kondisi pencahayaan ekstrem atau lensa kamera yang kotor."
  },
  {
    icon: <AlertTriangle size={18} />,
    title: "Ketersediaan Layanan",
    desc: "Kami berupaya menjaga uptime sistem 24/7. Namun, ketersediaan data real-time sangat bergantung pada stabilitas jaringan internet di lokasi penempatan unit stasiun."
  },
  {
    icon: <Info size={18} />,
    title: "Pembaruan Layanan",
    desc: "VisioBin berhak melakukan pembaruan model AI dan fitur dashboard secara berkala untuk meningkatkan performa sistem tanpa pemberitahuan sebelumnya."
  }
];

const GUIDE_STEPS = [
  {
    title: "Letakkan Sampah",
    desc: "Letakkan satu jenis sampah pada tray pemindaian. Pastikan tidak menghalangi pandangan kamera.",
    icon: <Camera size={18} />
  },
  {
    title: "Proses Analisis AI",
    desc: "Tunggu 1-2 detik hingga lampu indikator biru berkedip, menandakan AI sedang melakukan klasifikasi.",
    icon: <Activity size={18} />
  },
  {
    title: "Pemisahan Otomatis",
    desc: "Sistem akan secara otomatis membuka sekat reservoir sesuai jenis sampah (Organik/Anorganik).",
    icon: <Cpu size={18} />
  },
  {
    title: "Pantau di Dashboard",
    desc: "Data statistik volume dan berat akan terupdate secara real-time di aplikasi VisioBin Anda.",
    icon: <BarChart size={18} />
  }
];

const TROUBLESHOOTING_DATA = [
  {
    issue: "Indikator Merah Berkedip",
    solution: "Hal ini menandakan adanya gangguan koneksi internet. Periksa sinyal Wi-Fi di lokasi penempatan stasiun.",
    icon: <AlertTriangle size={16} color="#ef4444" />
  },
  {
    issue: "Volume Tidak Terupdate",
    solution: "Bersihkan sensor ultrasonik dari debu atau sampah yang menempel di bagian pemancar.",
    icon: <Trash2 size={16} color="#f59e0b" />
  },
  {
    issue: "Kamera Gagal Mendeteksi",
    solution: "Pastikan area pemindaian mendapatkan pencahayaan yang cukup. Bersihkan lensa kamera jika terlihat buram.",
    icon: <Camera size={16} color="#3b82f6" />
  }
];

const TECH_SPECS = [
  { label: "Microcontroller", value: "ESP32 DevKit V1", icon: <Cpu size={14} /> },
  { label: "Edge Computing", value: "Raspberry Pi 4 Model B (4GB)", icon: <Cpu size={14} /> },
  { label: "Vision Sensor", value: "Raspberry Pi Camera Module V2", icon: <Camera size={14} /> },
  { label: "Weight Sensor", value: "Load Cell 5kg + HX711 AD", icon: <Database size={14} /> },
  { label: "Gas Sensor", value: "MQ-135 (Ammonia & Air Quality)", icon: <Activity size={14} /> },
  { label: "Connectivity", value: "Wi-Fi 802.11 b/g/n & MQTT", icon: <Zap size={14} /> }
];

const WASTE_CATEGORIES = [
  {
    type: "Organik",
    color: "#10b981",
    examples: ["Sisa Makanan", "Daun Kering", "Kulit Buah", "Kertas Basah"],
    desc: "Sampah yang mudah terurai secara alami dan dapat diolah menjadi kompos."
  },
  {
    type: "Anorganik",
    color: "#3b82f6",
    examples: ["Botol Plastik", "Kaleng Minuman", "Kaca", "Kabel Bekas"],
    desc: "Sampah yang sulit terurai dan sangat disarankan untuk didaur ulang (Recycle)."
  },
  {
    type: "B3 (Dilarang)",
    color: "#ef4444",
    examples: ["Baterai Bekas", "Lampu Neon", "Cairan Kimia", "Jarum Suntik"],
    desc: "Bahan Berbahaya dan Beracun. Dilarang memasukkan ke dalam stasiun VisioBin."
  }
];

const SectionHeader = ({ icon, title, id, color }) => (
  <div id={id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginTop: 64, scrollMarginTop: 100 }}>
    <div style={{ 
      width: 40, height: 40, borderRadius: 12, 
      background: `${color}15`, color: color, 
      display: "flex", alignItems: "center", justifyContent: "center" 
    }}>
      {icon}
    </div>
    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>{title}</h2>
  </div>
);

const Accordion = ({ item }) => {
  const [isOpen, setIsOpen] = React.useState(false);
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
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          style={{ paddingBottom: 20, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}
        >
          {item.a}
        </motion.div>
      )}
    </div>
  );
};

const ContentCard = ({ icon, title, desc, color }) => (
  <div className="card" style={{ padding: 24, display: "flex", gap: 20, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", marginBottom: 16 }}>
    <div style={{ 
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: `${color}10`, color: color,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      {icon}
    </div>
    <div>
      <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "var(--text-main)" }}>{title}</h4>
      <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</p>
    </div>
  </div>
);

export default function HelpCenterView() {
  const [activeSection, setActiveSection] = React.useState("faq");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-100px 0px -60% 0px" }
    );

    ["faq", "guide", "categories", "specs", "trouble", "privacy", "terms"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollIntoView = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="view-transition">
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 60 }}>
        {/* Sticky Sidebar Navigation with Scroll Spy */}
        <div style={{ position: "sticky", top: 120, height: "fit-content" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { id: "faq", label: "FAQ", icon: <HelpCircle size={16} />, color: "#10b981" },
              { id: "guide", label: "Panduan", icon: <Activity size={16} />, color: "#8b5cf6" },
              { id: "categories", label: "Kategori", icon: <Info size={16} />, color: "#3b82f6" },
              { id: "specs", label: "Spesifikasi", icon: <Database size={16} />, color: "#6366f1" },
              { id: "trouble", label: "Troubleshoot", icon: <Wrench size={16} />, color: "#ef4444" },
              { id: "privacy", label: "Privasi", icon: <ShieldCheck size={16} />, color: "#3b82f6" },
              { id: "terms", label: "Ketentuan", icon: <FileText size={16} />, color: "#f59e0b" }
            ].map(tab => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollIntoView(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    background: isActive ? "rgba(255,255,255,0.03)" : "transparent", 
                    border: "none", borderRadius: 8,
                    cursor: "pointer", 
                    color: isActive ? tab.color : "var(--text-muted)", 
                    fontSize: 14, fontWeight: 500,
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", 
                    textAlign: "left",
                    position: "relative"
                  }}
                  className="nav-item-help"
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeBar"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 8,
                        bottom: 8,
                        width: 2,
                        background: tab.color,
                        borderRadius: "0 4px 4px 0",
                        boxShadow: `0 0 10px ${tab.color}44`
                      }}
                    />
                  )}
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="card" style={{ marginTop: 40, padding: 20, background: "rgba(255,255,255,0.01)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Bantuan Langsung</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="mailto:support@visiobin.local" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
                <Mail size={14} /> Email Support
              </a>
              <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
                <MessageCircle size={14} /> Live Chat
              </a>
            </div>
          </div>
        </div>

        {/* Scrolling Content Area */}
        <div style={{ minWidth: 0, paddingBottom: 100 }}>
          <section>
            <SectionHeader icon={<HelpCircle size={18} />} title="Pertanyaan Umum (FAQ)" id="faq" color="#10b981" />
            <div className="card" style={{ padding: "0 24px" }}>
              {FAQ_DATA.map((item, i) => <Accordion key={i} item={item} />)}
            </div>
          </section>

          <section>
            <SectionHeader icon={<Activity size={18} />} title="Panduan Penggunaan" id="guide" color="#8b5cf6" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {GUIDE_STEPS.map((step, i) => (
                <div key={i} className="card" style={{ padding: 24, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: "50%", 
                      background: "var(--brand-organic)", color: "#fff", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ color: "#8b5cf6" }}>{step.icon}</div>
                    <h4 style={{ fontSize: 15, fontWeight: 600 }}>{step.title}</h4>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<Info size={18} />} title="Kategori Sampah" id="categories" color="#3b82f6" />
            <div className="dashboard-grid-1-1">
              {WASTE_CATEGORIES.map((cat, i) => (
                <div key={i} className="card" style={{ padding: 24, borderTop: `4px solid ${cat.color}` }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: cat.color, marginBottom: 12 }}>{cat.type}</h4>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{cat.desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cat.examples.map((ex, j) => (
                      <span key={j} style={{ fontSize: 10, padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 4, color: "var(--text-main)" }}>
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<Database size={18} />} title="Spesifikasi Teknis" id="specs" color="#6366f1" />
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {TECH_SPECS.map((spec, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ color: "var(--brand-organic)" }}>{spec.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{spec.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{spec.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <SectionHeader icon={<Wrench size={18} />} title="Penyelesaian Masalah" id="trouble" color="#ef4444" />
            <div className="card" style={{ padding: 8, background: "rgba(255,255,255,0.01)" }}>
              {TROUBLESHOOTING_DATA.map((t, i) => (
                <div key={i} style={{ 
                  display: "flex", gap: 16, padding: "16px 24px", 
                  borderBottom: i === TROUBLESHOOTING_DATA.length - 1 ? "none" : "1px solid var(--border-color)" 
                }}>
                  <div style={{ marginTop: 2 }}>{t.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t.issue}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.solution}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<ShieldCheck size={18} />} title="Kebijakan Privasi" id="privacy" color="#3b82f6" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {PRIVACY_POINTS.map((pt, i) => (
                <ContentCard key={i} {...pt} color="#3b82f6" />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<FileText size={18} />} title="Ketentuan Layanan" id="terms" color="#f59e0b" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {TERMS_POINTS.map((pt, i) => (
                <ContentCard key={i} {...pt} color="#f59e0b" />
              ))}
            </div>
          </section>

          <div style={{ marginTop: 80, padding: 32, borderRadius: 20, background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, transparent 100%)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--brand-organic)", fontWeight: 700, marginBottom: 16 }}>
              <Lock size={20} /> Keamanan Protokol Zero-Trust
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
              VisioBin beroperasi dengan prinsip keamanan data yang ketat. Setiap akses ke telemetri dan sistem klasifikasi melewati lapisan autentikasi ganda untuk memastikan bahwa data pintar Anda tetap aman dari akses yang tidak sah.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-item-help:hover {
          background: var(--bg-hover) !important;
          color: var(--text-main) !important;
        }
      `}</style>
    </div>
  );
}
