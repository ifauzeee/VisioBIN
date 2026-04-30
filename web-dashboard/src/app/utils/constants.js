// Polling intervals (ms)
export const POLL_DASHBOARD = 5000;
export const POLL_ALERTS = 8000;
export const POLL_BINS = 10000;

// Thresholds
export const BIN_LEVEL_WARNING = 60;
export const BIN_LEVEL_CRITICAL = 80;

// Colors
export const COLORS = {
  organic: "#10B981",
  inorganic: "#3B82F6",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#22d3ee",
  purple: "#8B5CF6",
};

// Alert severity mapping
export const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Kritis" },
  warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Peringatan" },
  info: { color: "#22d3ee", bg: "rgba(34,211,238,0.12)", label: "Info" },
};
