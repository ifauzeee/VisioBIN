"use client";

import React, { useState, useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";
import AlertBell from "./AlertBell";
import DataFreshness from "./DataFreshness";
import { formatFullDateTime } from "../../utils/formatters";
import { useDashboardContext } from "../../context/DashboardContext";
import { usePathname } from "next/navigation";
import {
  SquareTerminal, BarChart, Settings2, ShieldCheck, Video, MapPin, TrendingUp, FileText, Cpu, Box, History, Users, Database, Code, HelpCircle
} from "lucide-react";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="time-badge desktop-only">
      <Clock size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
      {formatFullDateTime(time)} WIB
    </div>
  );
};

const viewMeta = {
  ringkasan: { title: "Ringkasan Sistem", subtitle: "Telemetri real-time dan analisis sortir AI.", badge: "Semua Sistem Normal", color: "var(--brand-organic)", icon: ShieldCheck },
  pemantauan: { title: "Pemantauan Langsung", subtitle: "Monitoring stream kamera untuk validasi UI.", badge: "1 Stream Aktif", color: "#22d3ee", icon: Video },
  map: { title: "Peta Lokasi", subtitle: "Monitoring persebaran unit stasiun bin secara geografis.", badge: "Live View", color: "#ef4444", icon: MapPin },
  analitik: { title: "Analitik", subtitle: "Evaluasi performa model dan throughput harian.", badge: "Model Stabil", color: "#f59e0b", icon: TrendingUp },
  laporan: { title: "Laporan", subtitle: "Ringkasan harian, mingguan, dan dampak lingkungan.", badge: "Data 7 Hari", color: "#8B5CF6", icon: FileText },
  perangkat: { title: "Perangkat IoT", subtitle: "Status sensor dan kesehatan perangkat.", badge: "Aktif", color: "#06B6D4", icon: Cpu },
  stasiun: { title: "Stasiun Bin", subtitle: "Kelola dan pantau unit tempat sampah VisioBin.", badge: "Unit Aktif", color: "var(--brand-organic)", icon: Box },
  team: { title: "Anggota Tim", subtitle: "Kelola akses pengguna dan peran dalam tim.", badge: "Manajemen Akses", color: "#8B5CF6", icon: Users },
  maint: { title: "Log Perawatan", subtitle: "Catat dan kelola riwayat pemeliharaan fisik unit VisioBin.", badge: "Riwayat Maintenance", color: "#10b981", icon: History },
  data: { title: "Eksplorasi Data", subtitle: "Telusuri data mentah telemetri dan log sistem secara detail.", badge: "Database Real-time", color: "var(--brand-organic)", icon: Database },
  config: { title: "Konfigurasi Sistem", subtitle: "Pengaturan threshold, polling, dan preferensi notifikasi.", badge: "Pengaturan", color: "#64748b", icon: Settings2 },
  profile: { title: "Profil Saya", subtitle: "Kelola informasi pribadi dan pengaturan keamanan akun.", badge: "Akun Terverifikasi", color: "var(--brand-organic)", icon: Users },
  apidocs: { title: "Dokumentasi API", subtitle: "Spesifikasi teknis untuk integrasi perangkat IoT.", badge: "v1.1.0", color: "#8B5CF6", icon: Code },
  help: { title: "Pusat Bantuan", subtitle: "Pertanyaan umum, kebijakan privasi, dan FAQ.", badge: "Help Center", color: "#10b981", icon: HelpCircle },
};

export default function Header({ setSidebarOpen }) {
  const { alerts, unreadCount, markAsRead, markAllRead, lastUpdated, dashError } = useDashboardContext();
  const pathname = usePathname();
  
  const viewKey = pathname.split('/').pop() || "ringkasan";
  const meta = viewMeta[viewKey] || viewMeta.ringkasan;
  const MetaIcon = meta.icon;

  return (
    <>
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trash2 size={16} color="var(--text-main)" />
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-main)" }}>VisioBin</span>
        </div>
        <AlertBell
          alerts={alerts}
          unreadCount={unreadCount}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllRead}
        />
      </div>

      <header
        style={{
          marginBottom: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-1px",
              marginBottom: 8,
            }}
          >
            {meta.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
            {meta.subtitle}
          </p>
          <DataFreshness lastUpdated={lastUpdated} error={dashError} />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <LiveClock />

          <div
            className="card"
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MetaIcon size={16} color={meta.color} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {meta.badge}
            </span>
          </div>

          <div className="desktop-only">
            <AlertBell
              alerts={alerts}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllRead}
            />
          </div>
        </div>
      </header>
    </>
  );
}
