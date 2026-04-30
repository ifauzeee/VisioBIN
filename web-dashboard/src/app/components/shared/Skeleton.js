"use client";

import React from "react";

/**
 * Skeleton loading component — shimmer animation placeholders.
 */
export function SkeletonLine({ width = "100%", height = 14, style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius: 6,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div className="card" style={{ ...style }}>
      <SkeletonLine width="55%" height={14} />
      <SkeletonLine width="35%" height={36} style={{ marginTop: 12 }} />
      {lines > 2 && (
        <SkeletonLine width="70%" height={11} style={{ marginTop: 8 }} />
      )}
    </div>
  );
}

export function SkeletonChart({ height = 320, style = {} }) {
  return (
    <div className="card" style={{ minHeight: height, ...style }}>
      <SkeletonLine width="50%" height={14} />
      <div style={{ marginTop: 24, display: "flex", alignItems: "flex-end", gap: 8, height: height - 100 }}>
        {[40, 60, 35, 80, 55, 70, 45].map((h, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: "4px 4px 0 0",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="card">
      <SkeletonLine width="40%" height={14} />
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: "flex", gap: 16 }}>
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine
                key={c}
                width={c === 0 ? "30%" : "18%"}
                height={16}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
