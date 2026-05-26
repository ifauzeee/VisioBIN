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
