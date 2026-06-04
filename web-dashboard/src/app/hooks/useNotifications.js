"use client";

import { useEffect, useCallback, useRef } from "react";
import { useToast } from "../components/shared/Toast";
import { WS_BASE } from "../services/api";

/**
 * Subscribes to WebSocket alert events and surfaces them as Toast notifications
 * and/or Web Push Notifications.
 *
 * @param {Object} options
 * @param {string|null} options.token - Auth token
 * @param {boolean} [options.pushEnabled=true] - Enable Web Push Notification API
 * @param {number} [options.threshold=80] - Bin level % to auto-toast
 */
export function useNotifications({ token, pushEnabled = true, threshold = 80 }) {
  const toast = useToast();
  const wsRef = useRef(null);
  const notifiedRef = useRef(new Set());

  const requestPushPermission = useCallback(async () => {
    if (!pushEnabled || typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, [pushEnabled]);

  const showPushNotification = useCallback(
    (title, body) => {
      if (!pushEnabled || typeof Notification === "undefined") return;
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/logo.png",
          tag: "visiobin-alert",
        });
      }
    },
    [pushEnabled]
  );

  // Browser requires user gesture to request Notification permission, 
  // so we don't call it automatically in a useEffect anymore.

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { event: evType, data } = msg;

        // Alert events from backend
        if (evType === "alert_created" || evType === "bin_alert") {
          const alertId = data?.id || data?.alert_id;
          if (!alertId || notifiedRef.current.has(alertId)) return;
          notifiedRef.current.add(alertId);
          if (notifiedRef.current.size > 200) notifiedRef.current.clear();

          const severity = (data.severity || "info").toLowerCase();
          const location = data.location || data.bin_location || data.bin_name || "Unknown";
          const message = data.message || data.alert_type || "New alert";
          const level = data.volume_pct ?? data.level ?? 0;

          // Toast
          if (severity === "critical" || level >= threshold) {
            toast.error("Alert Kritis", `${location}: ${message}`);
          } else if (severity === "warning") {
            toast.warning("Peringatan", `${location}: ${message}`);
          } else {
            toast.info("Notifikasi", `${location}: ${message}`);
          }

          // Web Push for critical
          if (severity === "critical" || level >= threshold) {
            showPushNotification(
              "VisioBIN - Alert Kritis",
              `${location}: ${message} (${Math.round(level)}%)`
            );
          }
        }

        // Bin near-full notifications
        if (evType === "bin_level_high" || evType === "bin_near_full") {
          const binId = data?.bin_id || data?.id;
          if (!binId || notifiedRef.current.has(`level_${binId}`)) return;
          notifiedRef.current.add(`level_${binId}`);
          if (notifiedRef.current.size > 200) notifiedRef.current.clear();

          const location = data.location || data.bin_name || binId;
          const level = data.volume_pct ?? data.level ?? 0;

          toast.warning(
            "Bin Hampir Penuh",
            `${location}: ${Math.round(level)}% - Segera tindak lanjuti`
          );

          if (level >= threshold) {
            showPushNotification(
              "VisioBIN - Bin Hampir Penuh",
              `${location} mencapai ${Math.round(level)}%`
            );
          }
        }
      } catch (err) {
        // Silently ignore parse errors
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, threshold, toast, showPushNotification]);

  return {
    requestPushPermission,
  };
}
