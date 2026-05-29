"use client";

import React from "react";
import { AlertTriangle, Check, RefreshCw, Ruler, Type, Palette } from "lucide-react";
import DataFreshness from "../../components/shared/DataFreshness";
import EmptyState from "../../components/shared/EmptyState";

const TOKEN_SECTIONS = [
  {
    title: "Spacing Scale",
    icon: Ruler,
    tokens: [
      { name: "--space-xs", value: "4px" },
      { name: "--space-sm", value: "8px" },
      { name: "--space-md", value: "16px" },
      { name: "--space-lg", value: "24px" },
      { name: "--space-xl", value: "40px" },
    ],
    demo: (token) => (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: token.value, height: 16, background: "var(--brand-organic)", borderRadius: 4 }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{token.name}</span>
      </div>
    ),
  },
  {
    title: "Font Size Scale",
    icon: Type,
    tokens: [
      { name: "--fs-meta", value: "11px", usage: "Labels, timestamps" },
      { name: "--fs-body", value: "13px", usage: "Body text, table cells" },
      { name: "--fs-card-title", value: "14px", usage: "Card titles, nav items" },
      { name: "--fs-h3", value: "18px", usage: "Section headings" },
      { name: "--fs-h2", value: "24px", usage: "Page subheadings" },
      { name: "--fs-h1", value: "32px", usage: "Page titles" },
    ],
    demo: (token) => (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: token.value, fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
          {token.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{token.usage}</div>
      </div>
    ),
  },
  {
    title: "Semantic Colors",
    icon: Palette,
    tokens: [
      { name: "--text-main", value: "var(--text-main)" },
      { name: "--text-muted", value: "var(--text-muted)" },
      { name: "--text-inverse", value: "var(--text-inverse)" },
      { name: "--brand-organic", value: "var(--brand-organic)" },
      { name: "--brand-inorganic", value: "var(--brand-inorganic)" },
    ],
    demo: (token) => (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: token.value }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{token.name}</span>
      </div>
    ),
  },
];

function TokenCard({ section }) {
  const Icon = section.icon;
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={16} />
        {section.title}
      </div>
      <div style={{ marginTop: 16 }}>
        {section.tokens.map((token) => (
          <div key={token.name} style={{ marginBottom: 12 }}>
            {section.demo(token)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const now = React.useMemo(() => new Date(), []);

  return (
    <main style={{ padding: 32, maxWidth: 1080, margin: "0 auto" }}>
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "var(--fs-meta)", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          VisioBin Mini Design System
        </div>
        <h1 style={{ margin: "6px 0 8px", fontSize: "var(--fs-h1)" }}>Component & Token Catalog</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 680, lineHeight: 1.6, fontSize: "var(--fs-body)" }}>
          Internal reference for design tokens, common dashboard components, states, and operational UI patterns.
        </p>
      </section>

      {/* Design Tokens */}
      <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: 16 }}>Design Tokens</h2>
      <div className="dashboard-grid-2-1" style={{ marginBottom: 32 }}>
        {TOKEN_SECTIONS.map((section) => (
          <TokenCard key={section.title} section={section} />
        ))}
      </div>

      {/* Components */}
      <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: 16 }}>Components</h2>

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
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
                Severity, lokasi, waktu, dan aksi harus terlihat dalam satu item.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">EmptyState</div>
        <EmptyState
          title="Belum ada data contoh"
          description="Gunakan state ini saat data benar-benar kosong dan berikan aksi berikutnya."
          action="Muat ulang"
          onAction={() => {}}
        />
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">ErrorState with Auto-Retry</div>
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", marginBottom: 8 }}>
              Import ErrorState from <code style={{ color: "var(--brand-organic)" }}>components/shared/EmptyState</code>
            </div>
            <pre
              style={{
                background: "var(--bg-hover)",
                borderRadius: 8,
                padding: 16,
                fontSize: "var(--fs-meta)",
                color: "var(--text-main)",
                textAlign: "left",
                overflow: "auto",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
{`// Usage:
import { ErrorState } from "@/components/shared/EmptyState";

// Basic
<ErrorState message={error} onRetry={refetch} />

// With auto-retry countdown
<ErrorState message={error} onRetry={refetch} autoRetry locale="id" />`}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
