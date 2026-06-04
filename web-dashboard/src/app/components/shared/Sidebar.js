import React from "react";
import {
  ChevronLeft, ChevronRight, SquareTerminal, BarChart, Settings2, Trash2,
  Cpu, Search, Box, History,
  Users, LogOut, Video, TrendingUp, FileText,
  Sun, Moon, MapPin, Database, Activity, MessageSquare
} from "lucide-react";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardContext } from "../../context/DashboardContext";
import { deriveSystemState, hasClassificationData, hasTelemetryData } from "../../utils/realDataTransforms.mjs";
import { useTranslations } from 'next-intl';

export default function Sidebar({ sidebarOpen, setSidebarOpen, theme, toggleTheme, user, logout }) {
  const t = useTranslations('common');
  const td = useTranslations('dashboard');
  const pathname = usePathname();
  const { summary, logs, dashError, unreadCount, binLevel, searchQuery, setSearchQuery } = useDashboardContext();
  
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  React.useEffect(() => {
    const saved = localStorage.getItem("visiobin-sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);
  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("visiobin-sidebar-collapsed", newVal);
  };

  const role = user?.role || "guest";
  const isAdmin = role === "admin";
  const isOperator = role === "operator";
  const isManager = role === "manager";
  const isTechnician = role === "technician";
  const isGuest = role === "guest";
  const hasTelemetry = hasTelemetryData(summary);
  const hasClassifications = hasClassificationData(summary, logs);
  const systemState = deriveSystemState({
    hasError: Boolean(dashError),
    unreadCount,
    hasTelemetry,
    hasClassifications,
  });
  const statusColors = {
    ok: "var(--brand-organic)",
    warning: "#f59e0b",
    error: "#ef4444",
    muted: "var(--text-muted)",
  };
  const statusColor = statusColors[systemState.tone];

  const navItems = [
    {
      section: td('overview'),
      items: [
        { key: "ringkasan", label: td('overview'), icon: SquareTerminal, href: "/ringkasan" },
        { key: "pemantauan", label: t('monitoring'), icon: Activity, href: "/pemantauan" },
        { key: "map", label: t('map'), icon: MapPin, href: "/map" },
        !isGuest && { key: "chat", label: t('chat'), icon: MessageSquare, href: "/chat" },
        (isAdmin || isManager) && { key: "analitik", label: t('analytics'), icon: BarChart, href: "/analitik" },

      ].filter(Boolean),
    },
    {
      section: t('reports'),
      items: [
        (isAdmin || isManager) && { key: "laporan", label: t('reports'), icon: FileText, href: "/laporan" },
        (isAdmin || isTechnician) && { key: "perangkat", label: t('devices'), icon: Cpu, href: "/perangkat" },
      ].filter(Boolean),
    },
    {
      section: t('management'),
      items: [
        (isAdmin || isTechnician) && {
          key: "stasiun",
          label: t('stasiun'),
          icon: Box,
          href: "/stasiun",
          badge: summary.total_bins > 0 ? String(summary.total_bins) : undefined,
        },
        (isAdmin || isOperator || isTechnician || isGuest) && { key: "maint", label: t('maintenance'), icon: History, href: "/maint" },
        isAdmin && { key: "data", label: t('data_exploration'), icon: Database, href: "/data" },
      ].filter(Boolean),
    },
    ...(!isGuest ? [
      {
        section: t('settings'),
        items: [
          isAdmin && { key: "team", label: t('users'), icon: Users, href: "/team" },
          (isAdmin || isTechnician) && { key: "config", label: t('config'), icon: Settings2, href: "/config" },
        ].filter(Boolean),
      },
    ] : []),
  ].filter(section => section.items.length > 0);


  return (
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""} ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <div
        className="sidebar-header"
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
          className="sidebar-text"
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
          className="hide-print"
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
          title={theme === "dark" ? t('switchToLight') : t('switchToDark')}
          aria-label={theme === "dark" ? t('switchToLight') : t('switchToDark')}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={toggleCollapse}
          className="desktop-only hide-print"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-search-wrapper" style={{ position: "relative", marginBottom: 16 }}>
        <Search
          size={14}
          color="#666"
          style={{ position: "absolute", left: 12, top: 9 }}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder={t('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          aria-label={t('search')}
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
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={16} />
                    <span className="sidebar-text" style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <div
                        className="nav-badge"
                        style={{
                          background: "var(--bg-hover)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          color: "var(--text-main)",
                        }}
                      >
                        {item.badge}
                      </div>
                    )}
                    {isDisabled && (
                      <span className="nav-soon" style={{ fontSize: 9, color: "var(--text-muted)", fontStyle: "italic" }}>
                        {t('soon')}
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
          className="sidebar-status-box"
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
            {t('system_status')}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "var(--text-muted)" }}>{t('ai_vision')}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: hasClassifications ? "var(--brand-organic)" : "var(--text-muted)", fontWeight: 500 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: hasClassifications ? "var(--brand-organic)" : "var(--text-muted)" }} />
              {hasClassifications ? t('online') : t('waiting_real_data')}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "var(--text-muted)" }}>{t('telemetry')}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: statusColor, fontWeight: 500 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
              {hasTelemetry ? `${binLevel}%` : t(systemState.messageKey)}
            </span>
          </div>
        </div>

        <Link href={isGuest ? "#" : "/profile"} style={{ textDecoration: 'none' }} title={isCollapsed ? (user?.full_name || "User") : undefined}>
          <div
            className={`nav-item ${pathname === "/profile" ? "active" : ""} ${isGuest ? "nav-disabled" : ""}`}
            style={{ marginLeft: -12, marginRight: -12, cursor: isGuest ? "default" : "pointer", justifyContent: isCollapsed ? "center" : "flex-start" }}
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
                flexShrink: 0
              }}
            >
              {(user?.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-text" style={{ flex: 1 }}>
              <div
                style={{ fontSize: 13, fontWeight: 500, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
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
                {isGuest ? t('guest_access') : t('online')}
              </div>
            </div>
          </div>
        </Link>

        <button
          onClick={logout}
          className="nav-item"
          style={{
            all: "unset",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            marginLeft: -12,
            marginRight: -12,
            color: "#ef4444",
            cursor: "pointer",
            width: "calc(100% + 24px)",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 6,
            boxSizing: "border-box",
            justifyContent: isCollapsed ? "center" : "flex-start"
          }}
          aria-label={t('logout')}
          title={isCollapsed ? t('logout') : undefined}
        >
          <LogOut size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span className="sidebar-text">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
