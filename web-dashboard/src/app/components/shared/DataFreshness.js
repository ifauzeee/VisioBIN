"use client";

import React from "react";
import { timeAgo } from "../../utils/formatters";

/**
 * Small indicator showing when data was last refreshed.
 */
export default function DataFreshness({ lastUpdated, error }) {
  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#ef4444",
          }}
        />
        <span style={{ color: "#ef4444" }}>Koneksi terputus</span>
      </div>
    );
  }

  if (!lastUpdated) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
        <div
          className="skeleton-shimmer"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
          }}
        />
        <span style={{ color: "var(--text-muted)" }}>Menghubungkan...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
      <div
        className="pulse-dot-green"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--brand-organic)",
        }}
      />
      <span style={{ color: "var(--text-muted)" }}>
        Diperbarui {timeAgo(lastUpdated)}
      </span>
    </div>
  );
}
