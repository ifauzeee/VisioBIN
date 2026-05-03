"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDashboardSummary, listClassifications, WS_BASE } from "../services/api";
import { POLL_DASHBOARD } from "../utils/constants";

/**
 * Fetches dashboard summary + recent classifications from the real API.
 * Auto-polls every POLL_DASHBOARD ms.
 */
export function useDashboard(token) {
  const [summary, setSummary] = useState({
    total_processed: 0,
    organic: 0,
    inorganic: 0,
    co2: 0,
    latency: 0,
    unread_alerts: 0,
    bins_near_full: 0,
    total_bins: 0,
    active_bins: 0,
    bin_statuses: [],
    volume_history: [],
    daily_stats: [],
    distribution: [],
    processing_history: [],
  });
  const [logs, setLogs] = useState([]);
  const [binLevel, setBinLevel] = useState(0);
  const [binLevelOrg, setBinLevelOrg] = useState(0);
  const [binLevelInorg, setBinLevelInorg] = useState(0);
  const [vision, setVision] = useState({
    state: "scanning",
    label: "terdeteksi",
    prob: 0,
    box: { top: 20, left: 20, w: 60, h: 60 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const visionTimeoutRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      // Fetch summary
      const summaryRes = await getDashboardSummary(token);
      if (summaryRes.success) {
        const s = summaryRes.data;
        const org = s.organic_count_today || 0;
        const inorg = s.inorganic_count_today || 0;

        setSummary({
          total_processed: org + inorg,
          organic: org,
          inorganic: inorg,
          co2: +(org * 0.05 + inorg * 0.02).toFixed(2),
          latency: 14,
          unread_alerts: s.unread_alerts || 0,
          bins_near_full: s.bins_near_full || 0,
          total_bins: s.total_bins || 0,
          active_bins: s.active_bins || 0,
          bin_statuses: s.bin_statuses || [],
          volume_history: s.volume_history || [],
          daily_stats: s.daily_stats || [],
          distribution: s.distribution || [],
          processing_history: s.processing_history || [],
        });

        // Calculate bin level from first bin
        if (s.bin_statuses?.length > 0) {
          const b = s.bin_statuses[0];
          const orgLvl = b.volume_organic_pct || 0;
          const inorgLvl = b.volume_inorganic_pct || 0;
          const lvl =
            b.volume_pct ??
            b.volume_total_pct ??
            (orgLvl + inorgLvl) / 2;
          
          setBinLevel(Math.round(lvl));
          setBinLevelOrg(Math.round(orgLvl));
          setBinLevelInorg(Math.round(inorgLvl));
        }
      }

      // Fetch classifications
      const logsRes = await listClassifications(token, { limit: 10 });
      if (logsRes.success) {
        const newLogs = (logsRes.data || []).map((l) => ({
          id: l.id,
          time: new Date(l.classified_at).toLocaleTimeString("id-ID", {
            hour12: false,
          }),
          type: "tempat-sampah",
          item: l.predicted_class,
          prob: +(l.confidence * 100).toFixed(1),
          inference_ms: l.inference_time_ms,
          bin_id: l.bin_id,
        }));
        setLogs(newLogs);

        // Update vision state with latest classification
        if (newLogs.length > 0) {
          const latest = newLogs[0];
          setVision({
            state: "locked",
            label: latest.item,
            prob: latest.prob,
            box: { top: 30, left: 30, w: 40, h: 40 },
          });

          // Clear previous timeout
          if (visionTimeoutRef.current) {
            clearTimeout(visionTimeoutRef.current);
          }
          visionTimeoutRef.current = setTimeout(
            () => setVision((v) => ({ ...v, state: "scanning" })),
            2000
          );
        }
      }

      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetchData();
    const interval = setInterval(fetchData, POLL_DASHBOARD);

    // WebSocket for Real-time
    const ws = new WebSocket(WS_BASE);

    ws.onmessage = (event) => {
      try {
        const { event: evType, data } = JSON.parse(event.data);

        if (evType === "telemetry_updated") {
          // Incrementally update summary or refetch
          // For charts consistency, a refetch is better
          fetchData();
        }

        if (evType === "classification_logged") {
          // Update logs locally for instant feedback
          const newLog = {
            id: data.id,
            time: new Date(data.classified_at).toLocaleTimeString("id-ID", {
              hour12: false,
            }),
            type: "tempat-sampah",
            item: data.predicted_class,
            prob: +(data.confidence * 100).toFixed(1),
            inference_ms: data.inference_time_ms,
            bin_id: data.bin_id,
          };

          setLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id).slice(0, 9)]);

          // Visual Feedback for AI Vision
          setVision({
            state: "locked",
            label: data.predicted_class,
            prob: +(data.confidence * 100).toFixed(1),
            box: {
              top: 25 + Math.random() * 10,
              left: 25 + Math.random() * 10,
              w: 40,
              h: 40,
            },
          });

          if (visionTimeoutRef.current) clearTimeout(visionTimeoutRef.current);
          visionTimeoutRef.current = setTimeout(
            () => setVision((v) => ({ ...v, state: "scanning" })),
            3000
          );

          // Update summary counts
          setSummary((prev) => ({
            ...prev,
            total_processed: prev.total_processed + 1,
            organic: data.predicted_class === "organic" ? prev.organic + 1 : prev.organic,
            inorganic: data.predicted_class === "inorganic" ? prev.inorganic + 1 : prev.inorganic,
          }));
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
      if (visionTimeoutRef.current) clearTimeout(visionTimeoutRef.current);
    };
  }, [token, fetchData]);

  return {
    summary,
    logs,
    binLevel,
    binLevelOrg,
    binLevelInorg,
    vision,
    bins: summary.bin_statuses,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
