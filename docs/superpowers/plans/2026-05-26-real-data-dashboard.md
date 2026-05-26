# Real Data Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make VisioBin web dashboard and mobile app render real backend data instead of dummy/sample dashboard values.

**Architecture:** Keep the Go backend as the single source of truth and update clients to either render fetched values or honest empty states. Add small web transformation helpers so chart/report data is derived consistently from API payloads. Update Flutter models/provider so mobile sees the same backend summary fields as web.

**Tech Stack:** Go + PostgreSQL backend, Next.js 16/React web dashboard, Flutter mobile app, Node-based helper verification, `go test`, `npm run lint/build`, and `flutter analyze/test`.

---

## File Structure

- Modify `web-dashboard/src/app/hooks/useDashboard.js`: map backend `total_co2` and `total_compost`, remove fake CO2/latency defaults.
- Create `web-dashboard/src/app/utils/realDataTransforms.mjs`: reusable pure functions for chart, report, and metric transforms.
- Create `web-dashboard/scripts/test-real-data-transforms.mjs`: no-framework Node checks for the transform helpers.
- Modify `web-dashboard/src/app/components/RingkasanView.js`: remove imports from `dashboardData.js`; render API data or empty states.
- Modify `web-dashboard/src/app/components/AnalitikView.js`: remove default analytics arrays and hardcoded throughput/integrity metrics.
- Modify `web-dashboard/src/app/components/LaporanView.js`: build report KPIs, daily rows, and summaries from actual logs/summary.
- Modify `web-dashboard/src/app/components/PerangkatView.js`: remove `dataSensor` fallback and render bins/empty state.
- Modify `web-dashboard/src/app/components/PemantauanView.js`: remove static live feed summary/event queue where no real data exists.
- Modify `mobile_app/lib/models/models.dart`: mirror backend dashboard summary chart/environment fields.
- Modify `mobile_app/lib/providers/dashboard_provider.dart`: remove fake accuracy/inference defaults.
- Modify `mobile_app/lib/screens/dashboard_screen.dart`: remove "Default" and sample chart fallbacks.
- Modify `mobile_app/lib/screens/history_screen.dart`: render provider classifications instead of `_dummyData`.

## Task 1: Web Transform Helpers

**Files:**
- Create: `web-dashboard/src/app/utils/realDataTransforms.mjs`
- Create: `web-dashboard/scripts/test-real-data-transforms.mjs`
- Modify: `web-dashboard/package.json`

- [ ] **Step 1: Write the failing helper verification script**

Create `web-dashboard/scripts/test-real-data-transforms.mjs` with assertions for empty data, backend chart mapping, average confidence, average inference time, and daily grouping.

- [ ] **Step 2: Run the script to verify it fails**

Run: `node scripts/test-real-data-transforms.mjs`
Expected: FAIL because `src/app/utils/realDataTransforms.mjs` does not exist yet.

- [ ] **Step 3: Add the helper module**

Create helpers:

```js
export function mapVolumeHistory(points = []) {
  return points.map((point) => ({
    jam: point.hour,
    volume: Number(point.volume || 0),
  }));
}

export function mapDailyStats(points = []) {
  return points.map((point) => ({
    hari: point.day,
    organik: Number(point.organic || 0),
    anorganik: Number(point.inorganic || 0),
  }));
}

export function averageConfidence(logs = []) {
  if (!logs.length) return 0;
  return +(logs.reduce((acc, log) => acc + Number(log.confidence || 0), 0) / logs.length * 100).toFixed(1);
}

export function averageInferenceMs(logs = []) {
  if (!logs.length) return 0;
  return Math.round(logs.reduce((acc, log) => acc + Number(log.inference_time_ms || 0), 0) / logs.length);
}
```

- [ ] **Step 4: Run helper verification**

Run: `node scripts/test-real-data-transforms.mjs`
Expected: PASS with all assertions completing.

## Task 2: Web Dashboard Real Data Rendering

**Files:**
- Modify: `web-dashboard/src/app/hooks/useDashboard.js`
- Modify: `web-dashboard/src/app/components/RingkasanView.js`
- Modify: `web-dashboard/src/app/components/AnalitikView.js`
- Modify: `web-dashboard/src/app/components/LaporanView.js`

- [ ] **Step 1: Update `useDashboard` mapping**

Use backend `total_co2` and `total_compost`, compute latency only from real classification logs, and keep empty arrays empty.

- [ ] **Step 2: Remove `dashboardData.js` imports from summary/analytics/report screens**

Delete sample imports and replace fallback arrays with empty arrays from helper transforms.

- [ ] **Step 3: Add local empty chart/list messages**

Where arrays are empty, render text such as `Belum ada data telemetry` or `Belum ada aktivitas klasifikasi`.

- [ ] **Step 4: Run helper test and lint**

Run: `npm run test:transforms`
Expected: PASS.

Run: `npm run lint`
Expected: no lint errors in modified files.

## Task 3: Web Operational Screens Real Data Rendering

**Files:**
- Modify: `web-dashboard/src/app/components/PerangkatView.js`
- Modify: `web-dashboard/src/app/components/PemantauanView.js`

- [ ] **Step 1: Remove device sample fallback**

Render bins from context/API. If none exist, show an empty state telling the user no bin devices are registered.

- [ ] **Step 2: Remove static live event fallback**

Use real alert/log state where available; otherwise show an empty state.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no lint errors in modified files.

## Task 4: Mobile Real Data Models And Provider

**Files:**
- Modify: `mobile_app/lib/models/models.dart`
- Modify: `mobile_app/lib/providers/dashboard_provider.dart`

- [ ] **Step 1: Expand `DashboardSummary`**

Add `totalCO2`, `totalCompost`, `volumeHistory`, `dailyStats`, `distribution`, and `processingHistory` fields parsed from backend JSON.

- [ ] **Step 2: Remove fake provider defaults**

Change `averageAccuracy` and `averageInferenceMs` to return `0` when there are no real classifications.

- [ ] **Step 3: Run Flutter analyze**

Run: `flutter analyze`
Expected: no new analyzer errors from modified model/provider files.

## Task 5: Mobile Dashboard And History Screens

**Files:**
- Modify: `mobile_app/lib/screens/dashboard_screen.dart`
- Modify: `mobile_app/lib/screens/history_screen.dart`

- [ ] **Step 1: Replace sample chart fallback**

Use `provider.summary.dailyStats` and display an empty chart message when no real daily stats exist.

- [ ] **Step 2: Replace `_dummyData` history**

Read `DashboardProvider.recentClassifications`, render each real classification, and show an empty state when absent.

- [ ] **Step 3: Run Flutter test**

Run: `flutter test`
Expected: widget tests pass or reveal pre-existing generated-project assumptions to document.

## Task 6: Full Verification And Commit

**Files:**
- Review all modified files.

- [ ] **Step 1: Backend verification**

Run: `go test ./...` from `backend`.
Expected: pass.

- [ ] **Step 2: Web verification**

Run: `npm run test:transforms`, `npm run lint`, and `npm run build` from `web-dashboard`.
Expected: pass or document exact failure.

- [ ] **Step 3: Mobile verification**

Run: `flutter analyze` and `flutter test` from `mobile_app`.
Expected: pass or document exact failure.

- [ ] **Step 4: Search for remaining fake data in live surfaces**

Run: `rg "dashboardData|defaultLogs|_dummyData|Fallback to sample|97\\.8|97\\.4|Food Waste|PET Plastic|2\\.4 item/s|Data Integrity" web-dashboard/src mobile_app/lib`
Expected: no matches for live dashboard/report/history dummy values, except harmless text unrelated to real metrics.

- [ ] **Step 5: Commit implementation**

Stage only intentional files and commit with:

```bash
git commit -m "feat: use real dashboard data across web and mobile"
```
