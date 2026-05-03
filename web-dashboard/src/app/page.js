"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  SquareTerminal, BarChart, Settings2, Trash2,
  ShieldCheck, Activity, Cpu, Search, Box, History,
  Users, LogOut, Video, TrendingUp, FileText, Clock,
  Sun, Moon, MapPin, Database
} from "lucide-react";

import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useDashboard } from "./hooks/useDashboard";
import { useAlerts } from "./hooks/useAlerts";

import LoginScreen from "./components/LoginScreen";
import RingkasanView from "./components/RingkasanView";
import PemantauanView from "./components/PemantauanView";
const PetaView = dynamic(() => import("./components/PetaView"), { ssr: false });
import AnalitikView from "./components/AnalitikView";
import LaporanView from "./components/LaporanView";
import PerangkatView from "./components/PerangkatView";
import StasiunBinView from "./components/StasiunBinView";
import TeamView from "./components/TeamView";
import ConfigView from "./components/ConfigView";
import ProfileView from "./components/ProfileView";
import LogPerawatanView from "./components/LogPerawatanView";
import DataManagementView from "./components/DataManagementView";
import { ToastProvider } from "./components/shared/Toast";
import AlertBell from "./components/shared/AlertBell";
import DataFreshness from "./components/shared/DataFreshness";
import { formatFullDateTime } from "./utils/formatters";
import { motion, AnimatePresence } from "framer-motion";

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

function DashboardApp() {
  const { mounted, isAuthenticated, isCheckingAuth, token, user, login, guestLogin, logout } =
    useAuth();
  const [activeView, setActiveView] = useState("ringkasan");
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    error: "",
    loading: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("visiobin-theme") || "dark";
    setTheme(savedTheme);
    document.body.classList.toggle("light-mode", savedTheme === "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("visiobin-theme", newTheme);
    document.body.classList.toggle("light-mode", newTheme === "light");
  };

  const {
    summary,
    logs,
    binLevel,
    binLevelOrg,
    binLevelInorg,
    vision,
    bins,
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
      badge: "1 Stream Aktif",
      color: "#22d3ee",
      icon: Video,
    },
    map: {
      title: "Peta Lokasi",
      subtitle: "Monitoring persebaran unit stasiun bin secara geografis.",
      badge: "Live View",
      color: "#ef4444",
      icon: MapPin,
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
    team: {
      title: "Anggota Tim",
      subtitle: "Kelola akses pengguna dan peran dalam tim.",
      badge: "Manajemen Akses",
      color: "#8B5CF6",
      icon: Users,
    },
    maint: {
      title: "Log Perawatan",
      subtitle: "Catat dan kelola riwayat pemeliharaan fisik unit VisioBin.",
      badge: "Riwayat Maintenance",
      color: "#10b981",
      icon: History,
    },
    data: {
      title: "Eksplorasi Data",
      subtitle: "Telusuri data mentah telemetri dan log sistem secara detail.",
      badge: "Database Real-time",
      color: "var(--brand-organic)",
      icon: Database,
    },
    config: {
      title: "Konfigurasi Sistem",
      subtitle: "Pengaturan threshold, polling, dan preferensi notifikasi.",
      badge: "Pengaturan",
      color: "#64748b",
      icon: Settings2,
    },
    profile: {
      title: "Profil Saya",
      subtitle: "Kelola informasi pribadi dan pengaturan keamanan akun.",
      badge: "Akun Terverifikasi",
      color: "var(--brand-organic)",
      icon: Users,
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginForm((p) => ({ ...p, loading: true, error: "" }));

    const result = await login(
      loginForm.username,
      loginForm.password
    );

    if (!result.success) {
      setLoginForm((p) => ({ ...p, error: result.error }));
    }

    setLoginForm((p) => ({ ...p, loading: false }));
  };

  const handleGuestLogin = async () => {
    setLoginForm((p) => ({ ...p, loading: true, error: "" }));
    const result = await guestLogin();
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
        handleGuestLogin={handleGuestLogin}
      />
    );

  const meta = viewMeta[activeView] || viewMeta.ringkasan;
  const MetaIcon = meta.icon;

  const isGuest = user?.role === "guest";

  const navItems = [
    {
      section: "Pemantauan",
      items: [
        { key: "ringkasan", label: "Ringkasan", icon: SquareTerminal },
        { key: "pemantauan", label: "Pemantauan Langsung", icon: Activity },
        { key: "map", label: "Peta Lokasi", icon: MapPin },
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
    ...(!isGuest ? [
      {
        section: "Manajemen",
        items: [
          {
            key: "stasiun",
            label: "Stasiun Bin",
            icon: Box,
            badge: summary.total_bins > 0 ? String(summary.total_bins) : undefined,
          },
          { key: "maint", label: "Log Perawatan", icon: History },
          { key: "data", label: "Eksplorasi Data", icon: Database },
        ],
      },
      {
        section: "Pengaturan",
        items: [
          { key: "team", label: "Anggota Tim", icon: Users },
          { key: "config", label: "Konfigurasi", icon: Settings2 },
        ],
      },
    ] : [
      {
        section: "Manajemen",
        items: [
          { key: "maint", label: "Log Perawatan", icon: History },
        ],
      },
    ]),
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
              background: "var(--text-main)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Trash2 size={16} color="var(--bg-page)" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "var(--text-main)",
              flex: 1,
            }}
          >
            VisioBin
          </span>
          <button
            onClick={toggleTheme}
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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
              background: "var(--bg-page)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              color: "var(--text-main)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <nav
          style={{ flex: 1, overflowY: "auto", marginRight: -8, paddingRight: 8 }}
          className="hide-scrollbar"
        >
          {navItems.map((group) => (
            <React.Fragment key={group.section}>
              <div className="sidebar-section">{group.section}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isDisabled = item.key.startsWith("_");
                return (
                  <motion.div
                    key={item.key}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
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
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* 3. Spacer otomatis & Widget IoT / Sistem */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 16,
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Mini System Status Widget */}
          <div
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              SYSTEM STATUS
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>AI Vision</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--brand-organic)", fontWeight: 500 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-organic)" }} />
                Online
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>Storage</span>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>45%</span>
            </div>
          </div>
          <div
            className={`nav-item ${activeView === "profile" ? "active" : ""} ${isGuest ? "nav-disabled" : ""}`}
            style={{ marginLeft: -12, marginRight: -12, cursor: isGuest ? "default" : "pointer" }}
            onClick={() => !isGuest && setActiveView("profile")}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  isGuest ? "#4b5563" : "linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {(user?.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 13, fontWeight: 500, color: "var(--text-main)" }}
              >
                {user?.full_name || "User"}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: isGuest ? "var(--text-muted)" : "var(--brand-organic)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: isGuest ? "var(--text-muted)" : "var(--brand-organic)",
                    borderRadius: "50%",
                  }}
                ></div>
                {isGuest ? "Guest Access" : "Online"}
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

      <main className={`main-content ${activeView === 'map' ? 'no-scroll' : ''}`}>
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

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeView === "ringkasan" && (
              <RingkasanView
                summary={summary}
                binLevel={binLevel}
                binLevelOrg={binLevelOrg}
                binLevelInorg={binLevelInorg}
                vision={vision}
                logs={logs}
              />
            )}
            {activeView === "pemantauan" && <PemantauanView />}
            {activeView === "map" && <PetaView bins={bins} />}
            {activeView === "analitik" && <AnalitikView />}
            {activeView === "laporan" && <LaporanView />}
            {activeView === "perangkat" && <PerangkatView />}
            {activeView === "stasiun" && <StasiunBinView />}
            {activeView === "team" && <TeamView />}
            {activeView === "config" && <ConfigView />}
            {activeView === "profile" && <ProfileView />}
            {activeView === "maint" && <LogPerawatanView />}
            {activeView === "data" && <DataManagementView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function VisioBinDashboard() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DashboardApp />
      </AuthProvider>
    </ToastProvider>
  );
}