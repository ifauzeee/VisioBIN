"use client";

import React from "react";
import { Inbox, WifiOff, RefreshCw } from "lucide-react";

/**
 * Empty state component shown when no data is available.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "Belum ada data",
  description = "Data akan muncul saat sistem mulai beroperasi.",
  action,
  onAction,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        minHeight: 200,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Icon size={24} color="var(--text-muted)" />
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-main)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            marginTop: 20,
            padding: "8px 20px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            color: "var(--text-main)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} />
          {action}
        </button>
      )}
    </div>
  );
}

/**
 * Error state with retry button.
 */
export function ErrorState({ message = "Gagal memuat data", onRetry }) {
  return (
    <EmptyState
      icon={WifiOff}
      title="Koneksi Bermasalah"
      description={message}
      action="Coba Lagi"
      onAction={onRetry}
    />
  );
}
