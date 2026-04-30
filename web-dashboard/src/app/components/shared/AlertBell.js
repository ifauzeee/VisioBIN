"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { timeAgo } from "../../utils/formatters";
import { SEVERITY_CONFIG } from "../../utils/constants";

const SEVERITY_ICONS = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function AlertBell({ alerts, unreadCount, onMarkRead, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        id="alert-bell"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          padding: "8px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
        aria-label="Notifications"
      >
        <Bell size={16} color={unreadCount > 0 ? "#f59e0b" : "var(--text-muted)"} />
        {unreadCount > 0 && (
          <span
            className="alert-badge-pulse"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              background: "#ef4444",
              borderRadius: "50%",
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-page)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="alert-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 380,
            maxHeight: 480,
            background: "#0A0A0A",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            animation: "alertDropIn 0.2s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              Notifikasi
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} baru
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--brand-organic)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCheck size={14} /> Tandai semua
              </button>
            )}
          </div>

          {/* Alert List */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: 8 }}
            className="custom-scrollbar"
          >
            {alerts.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                <Bell size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                <div>Tidak ada notifikasi</div>
              </div>
            ) : (
              alerts.map((alert) => {
                const severity = (alert.severity || "info").toLowerCase();
                const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
                const SevIcon = SEVERITY_ICONS[severity] || Info;

                return (
                  <div
                    key={alert.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      marginBottom: 4,
                      background: alert.is_read
                        ? "transparent"
                        : "rgba(255,255,255,0.03)",
                      borderLeft: alert.is_read
                        ? "3px solid transparent"
                        : `3px solid ${config.color}`,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onClick={() => !alert.is_read && onMarkRead(alert.id)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, flex: 1 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: config.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <SevIcon size={14} color={config.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: alert.is_read ? 400 : 600,
                              color: alert.is_read ? "var(--text-muted)" : "#fff",
                              marginBottom: 4,
                            }}
                          >
                            {alert.message || alert.alert_type}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              fontSize: 11,
                              color: "var(--text-muted)",
                            }}
                          >
                            <span>{alert.bin_name || alert.bin_id?.slice(0, 8)}</span>
                            <span>·</span>
                            <span>{timeAgo(alert.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      {!alert.is_read && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: config.color,
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
