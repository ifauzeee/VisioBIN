"use client";

import React from "react";
import {
  SquareTerminal, BarChart, Settings2, Trash2,
  Cpu, Search, Box, History,
  Users, LogOut, Video, TrendingUp, FileText,
  Sun, Moon, MapPin, Database, Code, HelpCircle,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardContext } from "../../context/DashboardContext";

export default function Sidebar({ sidebarOpen, setSidebarOpen, theme, toggleTheme, user, logout }) {
  const pathname = usePathname();
  const { summary } = useDashboardContext();
  const isGuest = user?.role === "guest";

  const navItems = [
    {
      section: "Pemantauan",
      items: [
        { key: "ringkasan", label: "Ringkasan", icon: SquareTerminal, href: "/ringkasan" },
        { key: "pemantauan", label: "Pemantauan Langsung", icon: Activity, href: "/pemantauan" },
        { key: "map", label: "Peta Lokasi", icon: MapPin, href: "/map" },
        { key: "analitik", label: "Analitik", icon: BarChart, href: "/analitik" },
      ],
    },
    {
      section: "Laporan",
      items: [
        { key: "laporan", label: "Laporan", icon: FileText, href: "/laporan" },
        { key: "perangkat", label: "Perangkat IoT", icon: Cpu, href: "/perangkat" },
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
            href: "/stasiun",
            badge: summary.total_bins > 0 ? String(summary.total_bins) : undefined,
          },
          { key: "maint", label: "Log Perawatan", icon: History, href: "/maint" },
          { key: "data", label: "Eksplorasi Data", icon: Database, href: "/data" },
        ],
      },
      {
        section: "Pengaturan",
        items: [
          { key: "team", label: "Anggota Tim", icon: Users, href: "/team" },
          { key: "apidocs", label: "Dokumentasi API", icon: Code, href: "/apidocs" },
          { key: "help", label: "Pusat Bantuan", icon: HelpCircle, href: "/help" },
          { key: "config", label: "Konfigurasi", icon: Settings2, href: "/config" },
        ],
      },
    ] : [
      {
        section: "Manajemen",
        items: [
          { key: "maint", label: "Log Perawatan", icon: History, href: "/maint" },
        ],
      },
    ]),
  ];


  return (
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
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div 
            style={{ 
              width: 32, 
              height: 32, 
              backgroundColor: 'var(--text-main)',
              WebkitMaskImage: 'url(/logo.png)',
              maskImage: 'url(/logo.png)',
              WebkitMaskMode: 'luminance',
              maskMode: 'luminance',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              opacity: 0.9
            }} 
          />
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
          VisioBIN
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
              const Icon = item.icon || SquareTerminal;
              const isActive = pathname === item.href;
              const isDisabled = item.key.startsWith("_");
              
              return (
                <Link 
                  href={isDisabled ? "#" : item.href} 
                  key={item.key}
                  style={{ textDecoration: 'none' }}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`nav-item ${isActive ? "active" : ""} ${isDisabled ? "nav-disabled" : ""}`}
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
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

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

        <Link href={isGuest ? "#" : "/profile"} style={{ textDecoration: 'none' }}>
          <div
            className={`nav-item ${pathname === "/profile" ? "active" : ""} ${isGuest ? "nav-disabled" : ""}`}
            style={{ marginLeft: -12, marginRight: -12, cursor: isGuest ? "default" : "pointer" }}
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
        </Link>

        <div
          onClick={logout}
          className="nav-item"
          style={{
            marginLeft: -12,
            marginRight: -12,
            color: "#ef4444",
            cursor: "pointer"
          }}
        >
          <LogOut size={16} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            Keluar Sistem
          </span>
        </div>
      </div>
    </aside>
  );
}
