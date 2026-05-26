# Real Data Dashboard Design

Date: 2026-05-26
Project: VisioBin

## Goal

Make the VisioBin web dashboard and mobile app use real backend data consistently. The dashboard, capacity indicators, analytics, reports, device views, alerts, scan history, and mobile dashboard must no longer present dummy/sample values as if they were live measurements.

## Current Context

VisioBin already has a Go backend with PostgreSQL tables for bins, sensor readings, classification logs, alerts, maintenance logs, users, and chat. The backend exposes real APIs for dashboard summary, bins, telemetry history, classifications, alerts, maintenance, and forecast. The web dashboard and Flutter app already call many of these endpoints.

The remaining problem is consistency: several screens still import `dashboardData.js`, use dummy history data, or fall back to hardcoded values such as accuracy, trend, environmental impact, throughput, and sample charts. Some backend summary fields also exist in Go but are not fully mirrored in Flutter models.

## Recommended Approach

Use the backend API as the single source of truth and standardize client behavior around it.

1. Extend or normalize backend dashboard/report data where existing endpoints do not provide enough real aggregates.
2. Update web dashboard components to render API data only.
3. Update Flutter models and screens to consume the same API fields.
4. Replace dummy fallbacks with loading, empty, or unavailable states.
5. Keep simulator-generated data acceptable as real development/test telemetry because it enters the same ingest API and database path as hardware telemetry.

## Alternatives Considered

### Frontend-only cleanup

Remove dummy imports and show empty states when data is missing. This is fast, but analytics and reports would become sparse because some needed aggregates are not directly exposed.

### Backend-only aggregation

Build a large all-in-one dashboard endpoint and leave clients mostly unchanged. This centralizes logic but risks a bloated endpoint and would not remove all fake UI behavior by itself.

### Shared real-data contract

Keep existing API boundaries, add focused aggregate fields/endpoints where needed, and align web and mobile model parsing. This is the preferred path because it improves correctness without forcing a disruptive rewrite.

## Data Contract

The backend remains authoritative for:

- Bin count, active bins, unread alerts, near-full bins.
- Latest bin capacity for organic and inorganic compartments.
- Sensor volume history from `sensor_readings`.
- Daily and hourly classification aggregates from `classification_logs`.
- Classification confidence and inference latency.
- Environmental estimates derived from stored sensor weights.
- Alerts and maintenance logs from database tables.
- Forecasts from telemetry history.

Frontend-derived values are allowed only when they are mathematically computed from fetched API data, such as average confidence from returned classification logs or average fill percentage from organic/inorganic percentages.

## Web Dashboard Design

`RingkasanView` should stop falling back to `dashboardData.js`. If `summary.volume_history`, `summary.daily_stats`, `summary.distribution`, `summary.processing_history`, or `logs` are empty, it should show an empty chart/list state instead of sample charts. KPI values should use backend fields such as `total_co2`, `total_compost`, classification totals, and real average latency/confidence.

`AnalitikView` should build trend, accuracy, distribution, inference, and quick statistics from `listClassifications` or a focused backend aggregate. Hardcoded throughput and data integrity values should be replaced with API-derived values or a clear unavailable state.

`LaporanView` should group real classification logs by day for daily reports and derive average accuracy, estimated volume/impact, and table rows from actual API data. Hardcoded "Food Waste", "PET Plastic Bottles", fixed CO2 values, and default report arrays should be removed.

`PerangkatView`, `PemantauanView`, and related operational views should use real bins, telemetry, alerts, and camera config. Device fallback rows from `dataSensor` and live event queues from static data should be replaced by real backend records or empty states.

## Mobile App Design

`DashboardSummary` in Flutter should mirror all backend summary fields used by mobile screens, including environmental totals, chart histories, distribution, and processing history.

`DashboardProvider` should keep fetching dashboard summary, bins, classifications, and alerts from the API. Computed values such as average accuracy and inference latency must return zero or unavailable state when real classifications are absent, not a fake default.

`DashboardScreen` should use real `summary.binStatuses`, classifications, alerts, and chart fields. Existing labels such as "Default" should become "Belum ada data" or similar.

`HistoryScreen` should use provider/API classification logs instead of `_dummyData`.

## Empty And Error States

When the database has no telemetry or classifications, the UI should say that no real data is available yet and suggest sending telemetry through hardware or the IoT simulator. It should not draw fake sample charts.

When the backend is unreachable, keep the current error/retry pattern.

When websocket updates arrive, web should refetch or incrementally update from API-backed payloads only.

## Testing

Backend verification:

- Run Go tests or at minimum `go test ./...`.
- Verify dashboard summary works with empty database rows.
- Verify summary works after telemetry and classification inserts.

Web verification:

- Run lint/build for `web-dashboard`.
- Verify dashboard pages no longer import static dashboard sample data for live metrics.
- Verify empty states render when API returns no rows.

Mobile verification:

- Run `flutter analyze` for `mobile_app`.
- Run available widget/unit tests.
- Verify dashboard and history screens use provider/API data rather than local dummy lists.

## Scope Boundaries

This work does not require changing the physical IoT protocol unless a backend field is missing. It also does not require replacing the existing simulator; simulator data is acceptable when it is posted through `/telemetry` and `/classifications` and stored in PostgreSQL.

This work should avoid broad redesign of visual styling. The goal is data correctness and web/mobile consistency.
