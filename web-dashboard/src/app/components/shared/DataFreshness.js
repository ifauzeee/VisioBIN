"use client";

import React from "react";
import { timeAgo } from "../../utils/formatters";

/**
 * Small indicator showing when data was last refreshed.
 */
export default function DataFreshness({ lastUpdated, error }) {
  if (error) {
    return (
      <div className="data-freshness">
        <div className="data-freshness-dot data-freshness-dot-error" />
        <span className="data-freshness-error">Koneksi terputus</span>
      </div>
    );
  }

  if (!lastUpdated) {
    return (
      <div className="data-freshness">
        <div className="data-freshness-dot skeleton-shimmer" />
        <span>Menghubungkan...</span>
      </div>
    );
  }

  return (
    <div className="data-freshness">
      <div className="data-freshness-dot pulse-dot-green data-freshness-dot-ok" />
      <span>
        Diperbarui {timeAgo(lastUpdated)}
      </span>
    </div>
  );
}
