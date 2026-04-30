/**
 * Format a Date or ISO string to Indonesian locale time string.
 */
export function formatTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("id-ID", { hour12: false });
}

/**
 * Format a Date or ISO string to Indonesian locale date string.
 */
export function formatDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a Date to full Indonesian datetime string (for header).
 */
export function formatFullDateTime(date) {
  return date.toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Returns a relative time string like "3 detik lalu", "2 menit lalu".
 */
export function timeAgo(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "baru saja";
  if (diffSec < 60) return `${diffSec} detik lalu`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} hari lalu`;
}

/**
 * Format hours float to "X jam Y menit" string.
 */
export function formatHoursRemaining(hours) {
  if (hours == null || hours <= 0) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}

/**
 * Get bin level color based on percentage.
 */
export function getBinLevelColor(pct) {
  if (pct > 80) return "#ef4444";
  if (pct > 60) return "#f59e0b";
  return "#10B981";
}

/**
 * Get bin level status text based on percentage.
 */
export function getBinLevelStatus(pct) {
  if (pct > 80) return "⚠️ Segera kosongkan!";
  if (pct > 60) return "🟡 Mulai penuh";
  return "✅ Normal";
}
