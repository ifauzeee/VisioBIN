"use client";

import React from "react";
import { Inbox, WifiOff, RefreshCw } from "lucide-react";

const TrashBinIllustration = () => (
  <svg className="empty-state-illustration" width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Grid Background/Scanner lines */}
    <path d="M10 60 H110 M60 10 V110" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
    <circle cx="60" cy="60" r="40" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
    
    {/* Glow pulse */}
    <circle cx="60" cy="60" r="30" fill="url(#glowGradient)" opacity="0.15" className="alert-badge-pulse" />
    
    {/* Trash Can Body */}
    <rect x="44" y="44" width="32" height="42" rx="6" fill="var(--bg-card)" stroke="var(--text-muted)" strokeWidth="2" />
    <line x1="52" y1="54" x2="52" y2="76" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" />
    <line x1="60" y1="54" x2="60" y2="76" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" />
    <line x1="68" y1="54" x2="68" y2="76" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" />
    
    {/* Lid */}
    <path d="M40 40 H80" stroke="var(--text-muted)" strokeWidth="3" strokeLinecap="round" />
    <path d="M54 40 V36 H66 V40" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
    
    {/* Signal dot */}
    <circle cx="60" cy="24" r="3" fill="var(--brand-organic)" />
    <path d="M52 18 C56 15, 64 15, 68 18" stroke="var(--brand-organic)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M46 12 C54 7, 66 7, 74 12" stroke="var(--brand-organic)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

    <defs>
      <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--brand-organic)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
  </svg>
);

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
    <div className="empty-state">
      {Icon === Inbox ? (
        <TrashBinIllustration />
      ) : (
        <div className="empty-state-icon">
          <Icon size={24} color="var(--text-muted)" />
        </div>
      )}
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-description">{description}</div>
      {action && (
        <button onClick={onAction} className="empty-state-action" type="button">
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
