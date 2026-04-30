"use client";

import { useState, useEffect, useCallback } from "react";
import { listAlerts, markAlertRead as apiMarkRead } from "../services/api";
import { POLL_ALERTS } from "../utils/constants";

/**
 * Fetches alerts and provides mark-as-read functionality.
 */
export function useAlerts(token) {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await listAlerts(token, { limit: 20 });
      if (res.success) {
        const data = res.data || [];
        setAlerts(data);
        setUnreadCount(data.filter((a) => !a.is_read).length);
      }
      setError(null);
    } catch (err) {
      console.error("Alerts fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markAsRead = useCallback(
    async (alertId) => {
      if (!token) return;
      try {
        await apiMarkRead(token, alertId);
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("Mark alert read error:", err);
      }
    },
    [token]
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    const unread = alerts.filter((a) => !a.is_read);
    await Promise.allSettled(unread.map((a) => apiMarkRead(token, a.id)));
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    setUnreadCount(0);
  }, [token, alerts]);

  useEffect(() => {
    if (!token) return;
    fetchAlerts();
    const interval = setInterval(fetchAlerts, POLL_ALERTS);
    return () => clearInterval(interval);
  }, [token, fetchAlerts]);

  return { alerts, unreadCount, loading, error, markAsRead, markAllRead, refetch: fetchAlerts };
}
