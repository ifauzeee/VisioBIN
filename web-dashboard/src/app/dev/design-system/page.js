"use client";

import React from "react";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import DataFreshness from "../../components/shared/DataFreshness";
import EmptyState from "../../components/shared/EmptyState";

export default function DesignSystemPage() {
  const now = React.useMemo(() => new Date(), []);

  return (
    <main style={{ padding: 32, maxWidth: 1080, margin: "0 auto" }}>
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
          VisioBin Mini Design System
        </div>
        <h1 style={{ margin: "6px 0 8px", fontSize: 30 }}>Component Catalog</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 680, lineHeight: 1.6 }}>
          Internal reference for common dashboard components, states, and operational UI patterns.
        </p>
      </section>

      <section className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Button</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" className="ops-refresh-btn">
              <Check size={14} /> Primary action
            </button>
            <button type="button" className="empty-state-action">
              <RefreshCw size={14} /> Secondary action
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">StatusChip</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <span className="map-bin-operational-status status-normal">Normal</span>
            <span className="map-bin-operational-status status-nearFull">Waspada</span>
            <span className="map-bin-operational-status status-full">Penuh</span>
            <span className="map-bin-operational-status status-offline">Offline</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">DataFreshness</div>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <DataFreshness lastUpdated={now} />
            <DataFreshness error="offline" />
            <DataFreshness />
          </div>
        </div>

        <div className="card">
          <div className="card-title">AlertItem</div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <div className="ops-card-icon" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>Unit hampir penuh</strong>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
                Severity, lokasi, waktu, dan aksi harus terlihat dalam satu item.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">EmptyState</div>
        <EmptyState
          title="Belum ada data contoh"
          description="Gunakan state ini saat data benar-benar kosong dan berikan aksi berikutnya."
          action="Muat ulang"
          onAction={() => {}}
        />
      </section>
    </main>
  );
}
