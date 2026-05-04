"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, Database, Send, BarChart3, Shield, 
  ChevronRight, Copy, Check, Globe, Code, 
  Smartphone, Cpu, Activity, MessageSquare, Wrench,
  Bell, FileDown, LayoutDashboard, Terminal, ExternalLink,
  Lock, Zap, Layers, AlertCircle
} from "lucide-react";

const API_GROUPS = [
  {
    title: "Authentication",
    icon: <Shield size={18} />,
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    endpoints: [
      {
        method: "POST",
        path: "/auth/login",
        desc: "Otentikasi pengguna untuk mendapatkan JWT Token yang valid selama 24 jam.",
        auth: "None",
        req: { username: "admin", password: "password123" },
        res: { success: true, token: "eyJhbGciOiJIUzI1..." }
      },
      {
        method: "POST",
        path: "/auth/guest",
        desc: "Akses tamu untuk monitoring publik dengan hak akses terbatas (view-only).",
        auth: "None",
        req: {},
        res: { token: "guest_token_..." }
      }
    ]
  },
  {
    title: "IoT Ingestion",
    icon: <Cpu size={18} />,
    color: "#10B981",
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    endpoints: [
      {
        method: "POST",
        path: "/telemetry",
        desc: "Kirim data sensor (Volume, Gas, Berat) secara berkala dari unit ESP32.",
        auth: "X-API-Key",
        req: {
          bin_id: "VBIN-01",
          volume_organic_pct: 45.5,
          volume_inorganic_pct: 20.0,
          weight_kg: 2.5,
          gas_amonia_ppm: 12.0
        },
        res: { success: true, message: "Telemetry saved" }
      },
      {
        method: "POST",
        path: "/classifications",
        desc: "Log hasil klasifikasi objek dari AI Raspberry Pi ke database pusat.",
        auth: "X-API-Key",
        req: {
          bin_id: "VBIN-01",
          predicted_class: "organic",
          confidence: 0.98,
          inference_time_ms: 15
        },
        res: { success: true, message: "Classification logged" }
      }
    ]
  },
  {
    title: "Bin Management",
    icon: <Database size={18} />,
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    endpoints: [
      {
        method: "GET",
        path: "/bins",
        desc: "Dapatkan daftar semua unit stasiun VisioBin beserta status koneksinya.",
        auth: "JWT",
        res: [{ id: "VBIN-01", name: "Stasiun PNJ", status: "online", volume_pct: 65 }]
      },
      {
        method: "POST",
        path: "/bins",
        desc: "Daftarkan unit stasiun baru ke sistem (Hanya Admin).",
        auth: "JWT (Admin)",
        req: { name: "Stasiun Depok", location: "UI Depok", max_volume_cm: 60, max_weight_kg: 15 },
        res: { success: true, data: { id: "VBIN-02", name: "Stasiun Depok" } }
      },
      {
        method: "PUT",
        path: "/bins/{id}",
        desc: "Perbarui konfigurasi fisik dan threshold unit stasiun.",
        auth: "JWT (Admin)",
        req: { name: "Nama Baru", location: "Lokasi Baru" },
        res: { success: true, message: "Bin updated" }
      },
      {
        method: "DELETE",
        path: "/bins/{id}",
        desc: "Hapus unit stasiun dari sistem secara permanen.",
        auth: "JWT (Admin)",
        res: { success: true, message: "Bin deleted" }
      }
    ]
  },
  {
    title: "Monitoring & Alerts",
    icon: <Bell size={18} />,
    color: "#F43F5E",
    gradient: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
    endpoints: [
      {
        method: "GET",
        path: "/dashboard/summary",
        desc: "Ringkasan statistik global untuk keperluan widget dashboard.",
        auth: "JWT",
        res: { total_bins: 5, active_alerts: 2, total_weight_kg: 120.5 }
      },
      {
        method: "GET",
        path: "/alerts",
        desc: "Dapatkan daftar notifikasi sistem saat threshold terlewati.",
        auth: "JWT",
        res: [{ id: 501, type: "FULL_BIN", message: "Unit VBIN-01 penuh!", created_at: "2026-05-04T21:00:00Z" }]
      },
      {
        method: "PUT",
        path: "/alerts/{id}/read",
        desc: "Tandai peringatan sebagai sudah dibaca untuk menghentikan push notification.",
        auth: "JWT",
        res: { success: true, message: "Marked as read" }
      }
    ]
  },
  {
    title: "Analytics & Reports",
    icon: <FileDown size={18} />,
    color: "#06B6D4",
    gradient: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
    endpoints: [
      {
        method: "GET",
        path: "/bins/{id}/forecast",
        desc: "Prediksi sisa waktu hingga bin penuh berdasarkan tren pengisian 24 jam terakhir.",
        auth: "JWT",
        res: { hours_until_full: 4.5, estimated_full_at: "2026-05-05T01:30:00Z" }
      },
      {
        method: "GET",
        path: "/bins/{id}/history",
        desc: "Ambil data historis sensor mentah untuk keperluan pembuatan grafik.",
        auth: "JWT",
        res: [{ timestamp: "2026-05-04T20:00:00Z", volume_organic_pct: 45 }]
      },
      {
        method: "GET",
        path: "/classifications/export",
        desc: "Download laporan klasifikasi sampah lengkap dalam format CSV.",
        auth: "JWT",
        res: "Binary (CSV File Data Content)"
      }
    ]
  },
  {
    title: "Team Chat",
    icon: <MessageSquare size={18} />,
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    endpoints: [
      {
        method: "POST",
        path: "/chat/send",
        desc: "Kirim pesan teks ke kanal diskusi tim atau individu melalui broker pesan.",
        auth: "JWT",
        req: { content: "Lapor: Unit VBIN-01 sudah dikosongkan.", recipient_id: null },
        res: { success: true, data: { id: 101, content: "Lapor...", created_at: "2026-05-04T21:00:00Z" } }
      },
      {
        method: "GET",
        path: "/chat/history",
        desc: "Ambil riwayat pesan terakhir dengan dukungan pagination.",
        auth: "JWT",
        res: { 
          success: true, 
          data: [{ id: 101, sender_name: "Admin", content: "Lapor...", role: "admin" }] 
        }
      }
    ]
  },
  {
    title: "Maintenance",
    icon: <Wrench size={18} />,
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    endpoints: [
      {
        method: "POST",
        path: "/maintenance/logs",
        desc: "Buat catatan aktivitas pemeliharaan fisik pada unit stasiun untuk kepatuhan operasional.",
        auth: "JWT",
        req: { bin_id: "VBIN-01", action_type: "REPAIR", notes: "Penggantian modul HX711" },
        res: { success: true, message: "Maintenance log created" }
      },
      {
        method: "GET",
        path: "/maintenance/logs",
        desc: "Dapatkan riwayat log perawatan yang terperinci.",
        auth: "JWT",
        res: { 
          success: true, 
          data: [{ id: 50, action_type: "CLEANING", bin_id: "VBIN-01", creator_name: "Teknisi" }] 
        }
      }
    ]
  }
];

const CodeBlock = ({ code, title, color }) => {
  const [copied, setCopied] = useState(false);
  const text = typeof code === 'string' ? code : JSON.stringify(code, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        padding: "8px 16px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border-color)",
        borderBottom: "none",
        borderRadius: "10px 10px 0 0",
        fontSize: 11,
        color: "var(--text-muted)",
        fontWeight: 600,
        letterSpacing: "0.5px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
          {title}
        </div>
        <button 
          onClick={copyToClipboard}
          style={{ 
            background: "transparent", border: "none", color: "var(--text-muted)", 
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            transition: "color 0.2s"
          }}
          className="copy-btn"
        >
          {copied ? <Check size={12} color="var(--brand-organic)" /> : <Copy size={12} />}
          <span style={{ fontSize: 10 }}>{copied ? "COPIED" : "COPY"}</span>
        </button>
      </div>
      <pre className="mono hide-scrollbar" style={{ 
        margin: 0,
        padding: 20,
        background: "rgba(0,0,0,0.4)",
        border: "1px solid var(--border-color)",
        borderRadius: "0 0 10px 10px",
        fontSize: 13,
        color: "#10b981",
        overflowX: "auto",
        lineHeight: 1.7,
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        {text}
      </pre>
    </div>
  );
};

const EndpointCard = ({ endpoint }) => {
  const [expanded, setExpanded] = useState(false);
  const methodColors = {
    GET: { bg: "rgba(16, 185, 129, 0.1)", text: "#10B981", border: "rgba(16, 185, 129, 0.3)" },
    POST: { bg: "rgba(59, 130, 246, 0.1)", text: "#3B82F6", border: "rgba(59, 130, 246, 0.3)" },
    PUT: { bg: "rgba(245, 158, 11, 0.1)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.3)" },
    DELETE: { bg: "rgba(239, 68, 68, 0.1)", text: "#EF4444", border: "rgba(239, 68, 68, 0.3)" }
  };
  const color = methodColors[endpoint.method] || methodColors.GET;

  return (
    <motion.div 
      layout
      className="card" 
      style={{ 
        padding: 0, 
        marginBottom: 16, 
        overflow: "hidden", 
        border: expanded ? `1px solid ${color.text}55` : "1px solid var(--border-color)",
        background: expanded ? "rgba(255,255,255,0.015)" : "var(--bg-card)",
        transition: "all 0.3s ease"
      }}
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          padding: "18px 24px", 
          display: "flex", 
          alignItems: "center", 
          gap: 20, 
          cursor: "pointer"
        }}
      >
        <div style={{ 
          width: 64, 
          padding: "5px 0", 
          borderRadius: 8, 
          background: color.bg, 
          color: color.text, 
          fontSize: 12, 
          fontWeight: 800, 
          textAlign: "center",
          border: `1px solid ${color.border}`,
          letterSpacing: "0.5px"
        }}>
          {endpoint.method}
        </div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 600, flex: 1, color: "var(--text-main)", letterSpacing: "-0.2px" }}>
          {endpoint.path}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ 
            fontSize: 10, 
            color: "var(--text-muted)", 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            background: "rgba(255,255,255,0.03)",
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--border-color)"
          }}>
            <Lock size={10} /> {endpoint.auth}
          </div>
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronRight size={20} color="var(--text-muted)" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 28px 24px", borderTop: "1px solid var(--border-color)" }}>
              <div style={{ marginTop: 20, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                {endpoint.desc}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: endpoint.req ? "1fr 1fr" : "1fr", gap: 24, marginTop: 24 }}>
                {endpoint.req && (
                  <div>
                    <CodeBlock title="Request JSON Body" code={endpoint.req} color={color.text} />
                  </div>
                )}
                <div>
                  <CodeBlock title="Response Example" code={endpoint.res} color="#10b981" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function ApiDocsView() {
  const [activeGroup, setActiveGroup] = useState(API_GROUPS[0].title);
  const observer = useRef(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0
    };

    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const group = API_GROUPS.find(g => g.title.toLowerCase().replace(/\s+/g, '-') === id);
          if (group) setActiveGroup(group.title);
        }
      });
    }, options);

    API_GROUPS.forEach(group => {
      const el = document.getElementById(group.title.toLowerCase().replace(/\s+/g, '-'));
      if (el) observer.current.observe(el);
    });

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  return (
    <div className="view-transition">
      {/* Hero Header */}
      <div style={{ 
        marginBottom: 40, 
        padding: 32, 
        borderRadius: 20, 
        background: "linear-gradient(to right, rgba(139, 92, 246, 0.05), transparent)",
        border: "1px solid var(--border-color)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ 
          position: "absolute", top: -20, right: -20, opacity: 0.05, transform: "rotate(-15deg)" 
        }}>
          <Terminal size={180} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--brand-inorganic)", fontWeight: 700, fontSize: 12, letterSpacing: "1px", marginBottom: 12 }}>
            <Globe size={14} /> PRODUCTION API ENDPOINT
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.5px" }}>
            Dokumentasi Teknis VisioBIN <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>v1.2.0</span>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 600 }}>
            Gunakan panduan ini untuk mengintegrasikan perangkat IoT, aplikasi mobile, atau layanan pihak ketiga dengan ekosistem VisioBin.
          </p>
          
          <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>BASE URL</div>
              <div className="mono" style={{ background: "rgba(0,0,0,0.3)", padding: "6px 12px", borderRadius: 8, fontSize: 12, border: "1px solid var(--border-color)", color: "var(--brand-organic)" }}>
                http://localhost:8080/api/v1
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>STATUS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--brand-organic)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand-organic)", boxShadow: "0 0 10px var(--brand-organic)" }} className="pulse-dot-green" />
                Operational
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 40, alignItems: "start" }}>
        {/* Advanced Navigation Sidebar */}
        <div style={{ position: "sticky", top: 24 }}>
          <div className="glass-card" style={{ padding: 12, borderRadius: 16 }}>
            <div style={{ padding: "8px 16px 16px 16px", borderBottom: "1px solid var(--border-color)", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px" }}>RESOURCES</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {API_GROUPS.map(group => {
                const isActive = activeGroup === group.title;
                return (
                  <div 
                    key={group.title}
                    onClick={() => {
                      const el = document.getElementById(group.title.toLowerCase().replace(/\s+/g, '-'));
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    style={{ 
                      padding: "12px 16px",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? `${group.color}15` : "transparent",
                      color: isActive ? group.color : "var(--text-muted)",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      position: "relative",
                    }}
                    className="nav-item-docs"
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="sidebarActiveIndicator"
                        style={{ 
                          position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, 
                          background: group.color, borderRadius: "0 4px 4px 0" 
                        }} 
                      />
                    )}
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: isActive ? 1 : 0.6 }}>
                      {group.icon}
                    </span>
                    {group.title}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: 24, padding: 24, borderRadius: 16, borderStyle: "dashed" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={14} color="#f59e0b" /> Need Help?
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
              Jika Anda menemukan bug pada API atau butuh kustomisasi akses, silakan hubungi tim DevOps kami.
            </p>
            <button className="btn-secondary" style={{ width: "100%", fontSize: 12, padding: "8px" }}>
              Contact Support
            </button>
          </div>
        </div>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 80 }}>
          {API_GROUPS.map((group) => (
            <div 
              key={group.title}
              id={group.title.toLowerCase().replace(/\s+/g, '-')}
              style={{ scrollMarginTop: 24 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ 
                  width: 52, height: 52, borderRadius: 16, 
                  background: group.gradient, color: "#fff", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 8px 20px ${group.color}33`
                }}>
                  {group.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.8px" }}>{group.title}</h2>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{group.endpoints.length} Endpoints available</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {group.endpoints.map((ep, i) => (
                  <EndpointCard key={i} endpoint={ep} />
                ))}
              </div>
            </div>
          ))}

          {/* Quick Setup Card */}
          <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 20 }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Layers size={20} color="var(--brand-inorganic)" />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Quick Integration</h3>
              </div>
            </div>
            <div style={{ padding: 32 }}>
              <div className="dashboard-grid-1-1">
                <div className="card" style={{ background: "transparent", padding: 0, border: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                    <Smartphone size={16} /> Mobile (Flutter/Dart)
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", background: "#050505", padding: 20, borderRadius: 12, border: "1px solid var(--border-color)" }}>
                    <span style={{ color: "#8b5cf6" }}>final</span> resp = <span style={{ color: "#8b5cf6" }}>await</span> dio.get(<br/>
                    &nbsp;&nbsp;<span style={{ color: "#10b981" }}>"/dashboard/summary"</span>,<br/>
                    &nbsp;&nbsp;options: Options(headers: &#123;<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: "#10b981" }}>"Authorization"</span>: <span style={{ color: "#10b981" }}>"Bearer $token"</span><br/>
                    &nbsp;&nbsp;&#125;)<br/>
                    );
                  </div>
                </div>
                <div className="card" style={{ background: "transparent", padding: 0, border: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                    <Cpu size={16} /> Hardware (ESP32 C++)
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", background: "#050505", padding: 20, borderRadius: 12, border: "1px solid var(--border-color)" }}>
                    HTTPClient http;<br/>
                    http.begin(<span style={{ color: "#10b981" }}>"http://vbin.local/api/v1/telemetry"</span>);<br/>
                    http.addHeader(<span style={{ color: "#10b981" }}>"X-API-Key"</span>, <span style={{ color: "#10b981" }}>"SECRET"</span>);<br/>
                    <span style={{ color: "#8b5cf6" }}>int</span> code = http.POST(<span style={{ color: "#10b981" }}>"&#123;\"bin_id\":\"VBIN-01\"...&#125;"</span>);
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WebSockets Real-time Area */}
          <div style={{ 
            padding: 40, 
            borderRadius: 24, 
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)", 
            border: "1px solid rgba(16, 185, 129, 0.2)",
            position: "relative",
            overflow: "hidden"
          }}>
             <div style={{ 
              position: "absolute", bottom: -30, right: -30, opacity: 0.1, color: "var(--brand-organic)"
            }}>
              <Zap size={160} />
            </div>
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--brand-organic)", fontWeight: 700, marginBottom: 20, fontSize: 20 }}>
                <Activity size={24} /> Real-time Integration (WebSockets)
              </div>
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 32, maxWidth: 700 }}>
                Untuk fitur yang membutuhkan update data seketika tanpa polling, gunakan koneksi WebSocket. Kami menggunakan broker pesan yang dioptimalkan untuk latency rendah pada perangkat IoT.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ padding: 24, background: "rgba(0,0,0,0.3)", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <MessageSquare size={18} color="var(--brand-organic)" />
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>chat_message</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Diterima secara instan saat operator atau teknisi mengirimkan pesan baru di kanal diskusi.
                  </div>
                </div>
                <div style={{ padding: 24, background: "rgba(0,0,0,0.3)", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Activity size={18} color="var(--brand-organic)" />
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>telemetry_updated</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Diterima saat unit stasiun mengirimkan pembacaan sensor terbaru (volume/berat/gas).
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 24, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.4)" }}>
                <AlertCircle size={16} color="var(--brand-organic)" />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  WebSocket URL: <span className="mono" style={{ color: "var(--text-main)" }}>ws://localhost:8080/ws</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .nav-item-docs:hover {
          background: rgba(255,255,255,0.03) !important;
          color: var(--text-main) !important;
          padding-left: 20px !important;
        }
        .copy-btn:hover {
          color: var(--text-main) !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
