"use client";

import { useState, useEffect, useCallback } from "react";
import { listBins, getBin, getSensorHistory, getForecast } from "../services/api";
import { POLL_BINS } from "../utils/constants";

/**
 * Fetches all bins and optionally a selected bin's details, sensor history, and forecast.
 */
export function useBins(token) {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBins = useCallback(async () => {
    if (!token) return;
    try {
      const res = await listBins(token);
      if (res.success) {
        setBins(res.data || []);
      }
      setError(null);
    } catch (err) {
      console.error("Bins fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const selectBin = useCallback(
    async (binId) => {
      if (!token || !binId) {
        setSelectedBin(null);
        setSensorHistory([]);
        setForecast(null);
        return;
      }

      setDetailLoading(true);
      try {
        const [binRes, historyRes, forecastRes] = await Promise.allSettled([
          getBin(token, binId),
          getSensorHistory(token, binId, { limit: 50 }),
          getForecast(token, binId),
        ]);

        if (binRes.status === "fulfilled" && binRes.value.success) {
          setSelectedBin(binRes.value.data);
        }
        if (historyRes.status === "fulfilled" && historyRes.value.success) {
          setSensorHistory(historyRes.value.data || []);
        }
        if (forecastRes.status === "fulfilled" && forecastRes.value.success) {
          setForecast(forecastRes.value.data);
        }
      } catch (err) {
        console.error("Bin detail error:", err);
      } finally {
        setDetailLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;
    fetchBins();
    const interval = setInterval(fetchBins, POLL_BINS);
    return () => clearInterval(interval);
  }, [token, fetchBins]);

  return {
    bins,
    selectedBin,
    sensorHistory,
    forecast,
    loading,
    detailLoading,
    error,
    selectBin,
    refetch: fetchBins,
  };
}
