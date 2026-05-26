function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak valid";
  return [
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    date.getUTCFullYear(),
  ].join("/");
}

export function mapVolumeHistory(points = []) {
  return points.map((point) => ({
    jam: point.hour,
    volume: toNumber(point.volume),
  }));
}

export function mapDailyStats(points = []) {
  return points.map((point) => ({
    hari: point.day,
    organik: toNumber(point.organic),
    anorganik: toNumber(point.inorganic),
  }));
}

export function mapProcessingHistory(points = []) {
  return points.map((point) => ({
    jam: point.hour,
    items: toNumber(point.items),
  }));
}

export function averageConfidence(logs = []) {
  if (!logs.length) return 0;
  const total = logs.reduce((acc, log) => acc + toNumber(log.confidence), 0);
  return +((total / logs.length) * 100).toFixed(1);
}

export function averageInferenceMs(logs = []) {
  if (!logs.length) return 0;
  const total = logs.reduce((acc, log) => acc + toNumber(log.inference_time_ms), 0);
  return Math.round(total / logs.length);
}

export function groupClassificationsByDay(logs = []) {
  const grouped = new Map();

  logs.forEach((log) => {
    const key = formatDateKey(log.classified_at);
    const current = grouped.get(key) || {
      tgl: key,
      organik: 0,
      anorganik: 0,
      total: 0,
      confidenceTotal: 0,
    };

    if (log.predicted_class === "organic") {
      current.organik += 1;
    }
    if (log.predicted_class === "inorganic") {
      current.anorganik += 1;
    }

    current.total += 1;
    current.confidenceTotal += toNumber(log.confidence);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => {
      const [ad, am, ay] = a.tgl.split("/").map(Number);
      const [bd, bm, by] = b.tgl.split("/").map(Number);
      return Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd);
    })
    .map(({ confidenceTotal, ...item }) => ({
      ...item,
      avgAccuracy: item.total ? +((confidenceTotal / item.total) * 100).toFixed(1) : 0,
    }));
}

export function hasClassificationData(summary = {}, logs = []) {
  if (logs.length > 0) return true;
  if (toNumber(summary.organic_count_today) + toNumber(summary.inorganic_count_today) > 0) return true;
  if ((summary.daily_stats || []).some((point) => toNumber(point.organic) + toNumber(point.inorganic) > 0)) return true;
  return (summary.distribution || []).some((item) => toNumber(item.value) > 0);
}

export function hasTelemetryData(summary = {}) {
  if ((summary.volume_history || []).length > 0) return true;
  if ((summary.processing_history || []).length > 0) return true;
  return (summary.bin_statuses || []).some(
    (bin) =>
      toNumber(bin.volume_pct) > 0 ||
      toNumber(bin.volume_total_pct) > 0 ||
      toNumber(bin.volume_organic_pct) > 0 ||
      toNumber(bin.volume_inorganic_pct) > 0 ||
      toNumber(bin.gas_amonia_ppm) > 0,
  );
}

export function deriveSystemState({
  hasError = false,
  unreadCount = 0,
  hasTelemetry = false,
  hasClassifications = false,
} = {}) {
  if (hasError) return { tone: "error", messageKey: "offline" };
  if (unreadCount > 0) return { tone: "warning", messageKey: "needs_attention" };
  if (!hasTelemetry && !hasClassifications) return { tone: "muted", messageKey: "waiting_real_data" };
  return { tone: "ok", messageKey: "real_data_active" };
}
