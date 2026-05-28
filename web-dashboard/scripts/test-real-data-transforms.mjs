import assert from "node:assert/strict";

import {
  averageConfidence,
  averageInferenceMs,
  deriveAiExplanation,
  deriveSystemState,
  groupClassificationsByDay,
  hasChartFallbackData,
  hasClassificationData,
  hasTelemetryData,
  mapDailyStats,
  mapProcessingHistory,
  mapVolumeHistory,
} from "../src/app/utils/realDataTransforms.mjs";

assert.deepEqual(mapVolumeHistory([]), []);
assert.deepEqual(
  mapVolumeHistory([
    { hour: "08:00", volume: 42.5 },
    { hour: "09:00", volume: null },
  ]),
  [
    { jam: "08:00", volume: 42.5 },
    { jam: "09:00", volume: 0 },
  ],
);

assert.deepEqual(
  mapDailyStats([{ day: "26/05", organic: 3, inorganic: 2 }]),
  [{ hari: "26/05", organik: 3, anorganik: 2 }],
);

assert.deepEqual(
  mapProcessingHistory([{ hour: "10:00", items: 7 }]),
  [{ jam: "10:00", items: 7 }],
);

const logs = [
  {
    id: 1,
    predicted_class: "organic",
    confidence: 0.91,
    inference_time_ms: 120,
    classified_at: "2026-05-26T08:15:00Z",
  },
  {
    id: 2,
    predicted_class: "inorganic",
    confidence: 0.81,
    inference_time_ms: 80,
    classified_at: "2026-05-26T09:15:00Z",
  },
  {
    id: 3,
    predicted_class: "organic",
    confidence: 0.78,
    inference_time_ms: 100,
    classified_at: "2026-05-25T09:15:00Z",
  },
];

assert.equal(averageConfidence([]), 0);
assert.equal(averageConfidence(logs), 83.3);
assert.equal(averageInferenceMs([]), 0);
assert.equal(averageInferenceMs(logs), 100);

assert.deepEqual(groupClassificationsByDay(logs), [
  { tgl: "25/05/2026", organik: 1, anorganik: 0, total: 1, avgAccuracy: 78 },
  { tgl: "26/05/2026", organik: 1, anorganik: 1, total: 2, avgAccuracy: 86 },
]);

assert.equal(hasClassificationData({ distribution: [{ name: "Organik", value: 0 }] }, []), false);
assert.equal(hasClassificationData({ distribution: [{ name: "Organik", value: 1 }] }, []), true);
assert.equal(hasClassificationData({}, logs), true);

assert.equal(hasTelemetryData({ bin_statuses: [] }), false);
assert.equal(hasTelemetryData({ volume_history: [{ hour: "10:00", volume: 0 }] }), true);
assert.equal(hasTelemetryData({ bin_statuses: [{ volume_organic_pct: 12, volume_inorganic_pct: 0 }] }), true);

assert.deepEqual(deriveSystemState({ hasError: true }), { tone: "error", messageKey: "offline" });
assert.deepEqual(deriveSystemState({ hasError: false, unreadCount: 2 }), { tone: "warning", messageKey: "needs_attention" });
assert.deepEqual(deriveSystemState({ hasError: false, hasTelemetry: false, hasClassifications: false }), { tone: "muted", messageKey: "waiting_real_data" });
assert.deepEqual(deriveSystemState({ hasError: false, hasTelemetry: true, hasClassifications: true }), { tone: "ok", messageKey: "real_data_active" });

assert.deepEqual(deriveAiExplanation([]), {
  confidence: 0,
  trend: "unknown",
  misclassificationRisk: "unknown",
  reason: "Belum ada log klasifikasi yang bisa dianalisis.",
  sampleLabel: "-",
  sampleTime: "-",
});
assert.equal(deriveAiExplanation([{ item: "organic", prob: 92, time: "10:00" }]).confidence, 92);
assert.equal(deriveAiExplanation([{ item: "organic", prob: 62 }, { item: "inorganic", prob: 58 }, { item: "organic", prob: 65 }]).misclassificationRisk, "high");
assert.equal(hasChartFallbackData([{ organic: 0, inorganic: 0 }]), false);
assert.equal(hasChartFallbackData([{ organic: 1, inorganic: 0 }]), true);

console.log("realDataTransforms checks passed");
