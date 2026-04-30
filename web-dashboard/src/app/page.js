"use client";

import React, { useState, useEffect } from "react";
import {
  SquareTerminal, BarChart, Settings2, Trash2,
  ShieldCheck, Activity, Cpu, Search, Box, History,
  Users, LogOut, Video, TrendingUp, FileText, Clock,
} from "lucide-react";

import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useDashboard } from "./hooks/useDashboard";
import { useAlerts } from "./hooks/useAlerts";

import LoginScreen from "./components/LoginScreen";
import RingkasanView from "./components/RingkasanView";
import PemantauanView from "./components/PemantauanView";
import AnalitikView from "./components/AnalitikView";
import LaporanView from "./components/LaporanView";
import PerangkatView from "./components/PerangkatView";
import StasiunBinView from "./components/StasiunBinView";
import AlertBell from "./components/shared/AlertBell";
import DataFreshness from "./components/shared/DataFreshness";
import { formatFullDateTime } from "./utils/formatters";

function DashboardApp() {
  const { mounted, isAuthenticated, isCheckingAuth, token, login, logout } =
    useAuth();
  const [activeView, setActiveView] = useState("ringkasan");
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    error: "",
    loading: false,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    summary,
    logs,
    binLevel,
    vision,
    loading: dashLoading,
    error: dashError,
    lastUpdated,
  } = useDashboard(isAuthenticated ? token : null);

  const {
    alerts,
    unreadCount,
    markAsRead,
    markAllRead,
  } = useAlerts(isAuthenticated ? token : null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile sidebar on view change
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeView]);

  const viewMeta = {
    ringkasan: {
      title: "Ringkasan Sistem",
      subtitle: "Telemetri real-time dan analisis sortir AI.",
      badge: "Semua Sistem Normal",
      color: "var(--brand-organic)",
      icon: ShieldCheck,
    },
    pemantauan: {
      title: "Pemantauan Langsung",
      subtitle: "Monitoring stream kamera untuk validasi UI.",
      badge: "8 Stream Aktif",
      color: "#22d3ee",
      icon: Video,
    },
    analitik: {
      title: "Analitik",
      subtitle: "Evaluasi performa model dan throughput harian.",
      badge: "Model Stabil",
      color: "#f59e0b",
      icon: TrendingUp,
    },
    laporan: {
      title: "Laporan",
      subtitle: "Ringkasan harian, mingguan, dan dampak lingkungan.",
      badge: "Data 7 Hari",
      color: "#8B5CF6",
      icon: FileText,
    },
    perangkat: {
      title: "Perangkat IoT",
      subtitle: "Status sensor dan kesehatan perangkat.",
      badge: `${summary.active_bins || 0} Perangkat Aktif`,
      color: "#06B6D4",
      icon: Cpu,
    },
    stasiun: {
      title: "Stasiun Bin",
      subtitle: "Kelola dan pantau unit tempat sampah VisioBin.",
      badge: `${summary.total_bins || 0} Unit`,
      color: "var(--brand-organic)",
      icon: Box,
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginForm((p) => ({ ...p, loading: true, error: "" }));

    const result = await login(
      loginForm.username || "admin2",
      loginForm.password || "admin123"
    );

    if (!result.success) {
      setLoginForm((p) => ({ ...p, error: result.error }));
    }

    setLoginForm((p) => ({ ...p, loading: false }));
  };

  if (!mounted || isCheckingAuth) return null;
  if (!isAuthenticated)
    return (
      <LoginScreen
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLogin={handleLogin}
      />
    );

  const meta = viewMeta[activeView] || viewMeta.ringkasan;
  const MetaIcon = meta.icon;

  const navItems = [
    {
      section: "Pemantauan",
      items: [
        { key: "ringkasan", label: "Ringkasan", icon: SquareTerminal },
        { key: "pemantauan", label: "Pemantauan Langsung", icon: Activity },
        { key: "analitik", label: "Analitik", icon: BarChart },
      ],
    },
    {
      section: "Laporan",
      items: [
        { key: "laporan", label: "Laporan", icon: FileText },
        { key: "perangkat", label: "Perangkat IoT", icon: Cpu },
      ],
    },
    {
      section: "Manajemen",
      items: [
        {
          key: "stasiun",
          label: "Stasiun Bin",
          icon: Box,
          badge: summary.total_bins > 0 ? String(summary.total_bins) : undefined,
        },
        { key: "_maint", label: "Log Perawatan", icon: History },
      ],
    },
    {
      section: "Pengaturan",
      items: [
        { key: "_team", label: "Anggota Tim", icon: Users },
        { key: "_config", label: "Konfigurasi", icon: Settings2 },
      ],
    },
  ];

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: "#fff",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(255,255,255,0.1)",
            }}
          >
            <Trash2 size={16} color="#000" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "#fff",
            }}
          >
            VisioBin
          </span>
        </div>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search
            size={14}
            color="#666"
            style={{ position: "absolute", left: 12, top: 9 }}
          />
          <input
            type="text"
            placeholder="Cari..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              background: "transparent",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              color: "#fff",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <nav
          style={{ flex: 1, overflowY: "auto", marginRight: -8, paddingRight: 8 }}
          className="custom-scrollbar"
        >
          {navItems.map((group) => (
            <React.Fragment key={group.section}>
              <div className="sidebar-section">{group.section}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isDisabled = item.key.startsWith("_");
                return (
                  <div
                    key={item.key}
                    onClick={() =>
                      !isDisabled && setActiveView(item.key)
                    }
                    className={`nav-item ${activeView === item.key ? "active" : ""} ${isDisabled ? "nav-disabled" : ""}`}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <div
                        style={{
                          background: "var(--border-color)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          color: "#fff",
                        }}
                      >
                        {item.badge}
                      </div>
                    )}
                    {isDisabled && (
                      <span style={{ fontSize: 9, color: "var(--text-muted)", fontStyle: "italic" }}>
                        soon
                      </span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            className="nav-item"
            style={{ marginLeft: -12, marginRight: -12 }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              IF
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}
              >
                Ifauze
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--brand-organic)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: "var(--brand-organic)",
                    borderRadius: "50%",
                  }}
                ></div>
                Online
              </div>
            </div>
          </div>

          <div
            onClick={logout}
            className="nav-item"
            style={{
              marginLeft: -12,
              marginRight: -12,
              color: "#ef4444",
            }}
          >
            <LogOut size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Keluar Sistem
            </span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile Header Bar */}
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
            <Trash2 size={16} color="#fff" />
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>VisioBin</span>
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
            <div className="time-badge desktop-only">
              <Clock
                size={12}
                style={{ marginRight: 6, verticalAlign: -1 }}
              />
              {formatFullDateTime(currentTime)} WIB
            </div>

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

        <div className="view-transition">
          {activeView === "ringkasan" && (
            <RingkasanView
              summary={summary}
              binLevel={binLevel}
              vision={vision}
              logs={logs}
            />
          )}
          {activeView === "pemantauan" && <PemantauanView />}
          {activeView === "analitik" && <AnalitikView />}
          {activeView === "laporan" && <LaporanView />}
          {activeView === "perangkat" && <PerangkatView />}
          {activeView === "stasiun" && <StasiunBinView />}
        </div>
      </main>
    </div>
  );
}

export default function VisioBinDashboard() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}