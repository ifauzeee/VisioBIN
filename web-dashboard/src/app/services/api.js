import { APP_CONFIG } from "../config/appConfig";

const API_BASE = APP_CONFIG.apiBaseUrl;

export const WS_BASE = API_BASE.replace("http", "ws").split("/api")[0] + "/ws";

/**
 * Centralized API fetch with auth token injection.
 * Auto-retries once with refresh token on 401.
 */
export async function apiFetch(endpoint, token, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    // Auto-refresh on 401 if we have a refresh token
    if (res.status === 401 && !options._retried) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return apiFetch(endpoint, refreshed, { ...options, _retried: true });
      }
    }
    const error = new Error(data.message || `API Error ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────

export async function login(username, password) {
  return apiFetch("/auth/login", null, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(payload) {
  return apiFetch("/auth/register", null, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginGuest() {
  return apiFetch("/auth/guest-login", null, {
    method: "POST",
  });
}

/**
 * Refresh the access token using stored refresh token.
 * Returns the new access token string or null on failure.
 */
export async function tryRefreshToken() {
  const rt = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  if (!rt) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const newToken = data.data.token;
      const newRefresh = data.data.refresh_token;
      localStorage.setItem('token', newToken);
      if (newRefresh) localStorage.setItem('refresh_token', newRefresh);
      return newToken;
    }
  } catch (e) {
    console.error('[API] Refresh token failed:', e);
  }
  return null;
}

export async function updateProfile(token, payload) {
  return apiFetch("/auth/profile", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function listUsers(token) {
  return apiFetch("/auth/users", token);
}

export async function deleteUser(token, userId) {
  return apiFetch(`/auth/users/${userId}`, token, { method: "DELETE" });
}

// ── Dashboard ─────────────────────────────────────────

export async function getDashboardSummary(token) {
  return apiFetch("/dashboard/summary", token);
}

// ── Bins ──────────────────────────────────────────────

export async function listBins(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch(`/bins${query ? `?${query}` : ""}`, token);
}

export async function getBin(token, binId) {
  return apiFetch(`/bins/${binId}`, token);
}

export async function getSensorHistory(token, binId, params = {}) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch(`/bins/${binId}/history${query ? `?${query}` : ""}`, token);
}

export async function getForecast(token, binId) {
  return apiFetch(`/bins/${binId}/forecast`, token);
}

export async function createBin(token, payload) {
  return apiFetch("/bins", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBin(token, binId, payload) {
  return apiFetch(`/bins/${binId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBin(token, binId) {
  return apiFetch(`/bins/${binId}`, token, { method: "DELETE" });
}

// ── Classifications ───────────────────────────────────

export async function listClassifications(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.bin_id) qs.set("bin_id", params.bin_id);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch(`/classifications${query ? `?${query}` : ""}`, token);
}

// ── Alerts ────────────────────────────────────────────

export async function listAlerts(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.unread) qs.set("unread", "true");
  const query = qs.toString();
  return apiFetch(`/alerts${query ? `?${query}` : ""}`, token);
}

export async function markAlertRead(token, alertId) {
  return apiFetch(`/alerts/${alertId}/read`, token, { method: "PUT" });
}

// ── Maintenance Logs ─────────────────────────────────

export async function listMaintenanceLogs(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.bin_id) qs.set("bin_id", params.bin_id);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch(`/maintenance${query ? `?${query}` : ""}`, token);
}

export async function createMaintenanceLog(token, payload) {
  return apiFetch("/maintenance", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMaintenanceLog(token, logId) {
  return apiFetch(`/maintenance/${logId}`, token, { method: "DELETE" });
}

export async function listAllTelemetry(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch(`/telemetry${query ? `?${query}` : ""}`, token);
}

// ── Chat ──────────────────────────────────────────────

export async function listChatHistory(token, otherId = "", limit = 50) {
  return apiFetch(`/chat/history?other_id=${otherId}&limit=${limit}`, token);
}

export async function sendChatMessage(token, content, recipientId = null) {
  return apiFetch("/chat", token, {
    method: "POST",
    body: JSON.stringify({ content, recipient_id: recipientId }),
  });
}
