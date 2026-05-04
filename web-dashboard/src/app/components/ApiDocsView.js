"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Key, Database, Send, BarChart3, Shield, 
  ChevronRight, Copy, Check, Globe, Code, 
  Smartphone, Cpu, Activity, MessageSquare, Wrench,
  Bell, FileDown, LayoutDashboard
} from "lucide-react";

const API_GROUPS = [
  {
    title: "Authentication",
    icon: <Shield size={18} />,
    color: "#8B5CF6",
    endpoints: [
      {
        method: "POST",
        path: "/auth/login",
        desc: "Otentikasi pengguna untuk mendapatkan JWT Token.",
        auth: "None",
        req: { username: "admin", password: "password123" },
        res: { success: true, token: "eyJhbGciOiJIUzI1..." }
      },
      {
        method: "POST",
        path: "/auth/guest",
        desc: "Akses tamu untuk monitoring publik (view-only).",
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
    endpoints: [
      {
        method: "POST",
        path: "/telemetry",
        desc: "Kirim data sensor (Volume, Gas, Berat) dari ESP32.",
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
        desc: "Log hasil klasifikasi AI dari Raspberry Pi.",
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
    endpoints: [
      {
        method: "GET",
        path: "/bins",
        desc: "Dapatkan daftar semua unit stasiun VisioBin.",
        auth: "JWT",
        res: [{ id: "VBIN-01", name: "Stasiun PNJ", status: "online", volume_pct: 65 }]
      },
      {
        method: "POST",
        path: "/bins",
        desc: "Daftarkan unit stasiun baru ke sistem.",
        auth: "JWT (Admin)",
        req: { name: "Stasiun Depok", location: "UI Depok", max_volume_cm: 60, max_weight_kg: 15 },
        res: { success: true, data: { id: "VBIN-02", ... } }
      },
      {
        method: "PUT",
        path: "/bins/{id}",
        desc: "Perbarui konfigurasi unit stasiun.",
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
    endpoints: [
      {
        method: "GET",
        path: "/dashboard/summary",
        desc: "Ringkasan statistik global untuk dashboard utama.",
        auth: "JWT",
        res: { total_bins: 5, active_alerts: 2, total_weight_kg: 120.5 }
      },
      {
        method: "GET",
        path: "/alerts",
        desc: "Dapatkan daftar notifikasi sistem (threshold terlewati).",
        auth: "JWT",
        res: [{ id: 501, type: "FULL_BIN", message: "Unit VBIN-01 penuh!", created_at: "..." }]
      },
      {
        method: "PUT",
        path: "/alerts/{id}/read",
        desc: "Tandai peringatan sebagai sudah dibaca.",
        auth: "JWT",
        res: { success: true, message: "Marked as read" }
      }
    ]
  },
  {
    title: "Analytics & Reports",
    icon: <FileDown size={18} />,
    color: "#06B6D4",
    endpoints: [
      {
        method: "GET",
        path: "/bins/{id}/forecast",
        desc: "Prediksi waktu penuh berdasarkan tren pengisian.",
        auth: "JWT",
        res: { hours_until_full: 4.5, estimated_full_at: "..." }
      },
      {
        method: "GET",
        path: "/bins/{id}/history",
        desc: "Ambil data historis sensor mentah (Volume/Gas).",
        auth: "JWT",
        res: [{ timestamp: "...", volume_organic_pct: 45 }]
      },
      {
        method: "GET",
        path: "/classifications/export",
        desc: "Download laporan klasifikasi sampah dalam format CSV.",
        auth: "JWT",
        res: "Binary (CSV File)"
      }
    ]
  },
  {
    title: "Team Chat",
    icon: <MessageSquare size={18} />,
    color: "#EC4899",
    endpoints: [
      {
        method: "POST",
        path: "/chat/send",
        desc: "Kirim pesan teks ke kanal diskusi tim atau individu.",
        auth: "JWT",
        req: { content: "Lapor: Unit VBIN-01 sudah dikosongkan.", recipient_id: null },
        res: { success: true, data: { id: 101, content: "Lapor...", created_at: "2026-05-04T21:00:00Z" } }
      },
      {
        method: "GET",
        path: "/chat/history",
        desc: "Ambil riwayat pesan terakhir. Gunakan query 'limit' untuk jumlah data.",
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
    endpoints: [
      {
        method: "POST",
        path: "/maintenance/logs",
        desc: "Buat catatan aktivitas pemeliharaan fisik pada unit stasiun.",
        auth: "JWT",
        req: { bin_id: "VBIN-01", action_type: "REPAIR", notes: "Penggantian modul HX711" },
        res: { success: true, message: "Maintenance log created" }
      },
      {
        method: "GET",
        path: "/maintenance/logs",
        desc: "Dapatkan riwayat log perawatan. Bisa difilter berdasarkan bin_id.",
        auth: "JWT",
        res: { 
          success: true, 
          data: [{ id: 50, action_type: "CLEANING", bin_id: "VBIN-01", creator_name: "Teknisi" }] 
        }
      }
    ]
  }
];

const CodeBlock = ({ code, title }) => {
  const [copied, setCopied] = useState(false);
  const text = typeof code === 'string' ? code : JSON.stringify(code, null, 2);


  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        padding: "6px 12px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-color)",
        borderBottom: "none",
        borderRadius: "8px 8px 0 0",
        fontSize: 11,
        color: "var(--text-muted)",
        fontWeight: 600,
        textTransform: "uppercase"
      }}>
        <span>{title}</span>
        <button 
          onClick={copyToClipboard}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          {copied ? <Check size={12} color="var(--brand-organic)" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mono hide-scrollbar" style={{ 
        margin: 0,
        padding: 16,
        background: "#050505",
        border: "1px solid var(--border-color)",
        borderRadius: "0 0 8px 8px",
        fontSize: 13,
        color: "#10b981",
        overflowX: "auto",
        lineHeight: 1.6
      }}>
        {text}
      </pre>
    </div>
  );
};

const EndpointCard = ({ endpoint }) => {
  const [expanded, setExpanded] = useState(false);
  const methodColor = {
    GET: "#10B981",
    POST: "#3B82F6",
    PUT: "#F59E0B",
    DELETE: "#EF4444"
  }[endpoint.method];

  return (
    <div className="card" style={{ padding: 0, marginBottom: 16, overflow: "hidden", border: expanded ? `1px solid ${methodColor}44` : "1px solid var(--border-color)" }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          alignItems: "center", 
          gap: 16, 
          cursor: "pointer",
          background: expanded ? "rgba(255,255,255,0.01)" : "transparent"
        }}
      >
        <div style={{ 
          width: 60, 
          padding: "4px 0", 
          borderRadius: 6, 
          background: `${methodColor}22`, 
          color: methodColor, 
          fontSize: 12, 
          fontWeight: 800, 
          textAlign: "center",
          border: `1px solid ${methodColor}44`
        }}>
          {endpoint.method}
        </div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 600, flex: 1, color: "var(--text-main)" }}>
          {endpoint.path}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <Key size={12} /> {endpoint.auth}
          </div>
          <ChevronRight size={18} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} color="var(--text-muted)" />
        </div>
      </div>

      {expanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          style={{ padding: "0 20px 24px 20px", borderTop: "1px solid var(--border-color)" }}
        >
          <div style={{ marginTop: 16, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {endpoint.desc}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: endpoint.req ? "1fr 1fr" : "1fr", gap: 20, marginTop: 20 }}>
            {endpoint.req && (
              <div>
                <CodeBlock title="Request Body" code={endpoint.req} />
              </div>
            )}
            <div>
              <CodeBlock title="Response Example" code={endpoint.res} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default function ApiDocsView() {
  const [activeGroup, setActiveGroup] = useState(API_GROUPS[0].title);

  return (
    <div className="view-transition">
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
        {/* Navigation Sidebar */}
        <div style={{ position: "sticky", top: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {API_GROUPS.map(group => (
              <div 
                key={group.title}
                onClick={() => setActiveGroup(group.title)}
                style={{ 
                  padding: "12px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  background: activeGroup === group.title ? "var(--bg-hover)" : "transparent",
                  color: activeGroup === group.title ? group.color : "var(--text-muted)",
                  transition: "all 0.2s ease"
                }}
              >
                {group.icon}
                {group.title}
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 32, padding: 20, background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)" }}>
            <div className="card-title" style={{ color: "var(--brand-inorganic)", marginBottom: 12 }}>
              <Globe size={14} /> Base URL
            </div>
            <div className="mono" style={{ fontSize: 12, wordBreak: "break-all", opacity: 0.8 }}>
              http://localhost:8080/api/v1
            </div>
            <div style={{ marginTop: 20 }}>
              <div className="card-title" style={{ fontSize: 11, marginBottom: 8 }}>Headers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span className="mono">Content-Type</span>
                  <span style={{ color: "var(--brand-organic)" }}>application/json</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span className="mono">X-API-Key</span>
                  <span style={{ color: "var(--brand-organic)" }}>Secret Key (IoT)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ minWidth: 0 }}>
          {API_GROUPS.filter(g => g.title === activeGroup).map(group => (
            <motion.div 
              key={group.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 12, 
                  background: `${group.color}15`, color: group.color, 
                  display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                  {group.icon}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>{group.title}</h2>
              </div>

              {group.endpoints.map((ep, i) => (
                <EndpointCard key={i} endpoint={ep} />
              ))}
            </motion.div>
          ))}

          {/* Code Snippets Section */}
          <div style={{ marginTop: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 12, 
                background: "rgba(255,255,255,0.05)", color: "var(--text-main)", 
                display: "flex", alignItems: "center", justifyContent: "center" 
              }}>
                <Code size={18} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>Quick Examples</h2>
            </div>

            <div className="dashboard-grid-1-1">
              <div className="card">
                <div className="card-title"><Cpu size={14} /> Arduino / ESP32 (C++)</div>
                <div className="mono" style={{ fontSize: 11, marginTop: 12, color: "var(--text-muted)", background: "#050505", padding: 16, borderRadius: 8 }}>
                  HTTPClient http;<br/>
                  http.begin("http://vbin.local/api/v1/telemetry");<br/>
                  http.addHeader("X-API-Key", "SECRET");<br/>
                  int code = http.POST("&#123;\"bin_id\":\"VBIN-01\"...&#125;");
                </div>
              </div>
              <div className="card">
                <div className="card-title"><Smartphone size={14} /> Flutter (Dart)</div>
                <div className="mono" style={{ fontSize: 11, marginTop: 12, color: "var(--text-muted)", background: "#050505", padding: 16, borderRadius: 8 }}>
                  final resp = await dio.get(<br/>
                  &nbsp;&nbsp;"/dashboard/summary",<br/>
                  &nbsp;&nbsp;options: Options(headers: &#123;<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;"Authorization": "Bearer $token"<br/>
                  &nbsp;&nbsp;&#125;)<br/>
                  );
                </div>
              </div>
            </div>
          </div>

          {/* WebSockets Section */}
          <div style={{ marginTop: 48, padding: 32, borderRadius: 16, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--brand-organic)", fontWeight: 700, marginBottom: 16 }}>
              <Activity size={20} /> Real-time Events (WebSockets)
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
              VisioBIN menggunakan WebSocket untuk pengiriman data real-time. Sambungkan ke <span className="mono" style={{ color: "var(--text-main)" }}>ws://localhost:8080/ws</span> untuk mendengarkan event berikut:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>chat_message</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Dikirim saat ada pesan baru di grup diskusi.</div>
              </div>
              <div style={{ padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>telemetry_update</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Update status volume & sensor IoT secara instan.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
