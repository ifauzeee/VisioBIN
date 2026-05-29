/**
 * Friendly error message mapping for production use.
 * Maps raw backend error codes/messages to user-friendly text in ID and EN.
 */
const ERROR_MESSAGES = {
  network: {
    id: "Koneksi ke server terputus. Periksa jaringan Anda.",
    en: "Connection to server lost. Please check your network.",
  },
  "401": {
    id: "Sesi login habis. Silakan masuk kembali.",
    en: "Session expired. Please log in again.",
  },
  "403": {
    id: "Akses ditolak. Hubungi administrator.",
    en: "Access denied. Contact your administrator.",
  },
  "404": {
    id: "Data tidak ditemukan.",
    en: "Data not found.",
  },
  "429": {
    id: "Terlalu banyak permintaan. Silakan tunggu.",
    en: "Too many requests. Please wait.",
  },
  "503": {
    id: "Server sedang tidak tersedia. Silakan coba lagi.",
    en: "Server is currently unavailable. Please try again.",
  },
  timeout: {
    id: "Permintaan ke server habis waktu. Coba lagi.",
    en: "Request timed out. Please try again.",
  },
  default: {
    id: "Terjadi kesalahan. Silakan coba lagi.",
    en: "Something went wrong. Please try again.",
  },
};

/**
 * Maps a raw error (object, string, or Error) to a friendly message object.
 * @param {Error|Object|string} err - The error to map
 * @param {string} [locale='id'] - Language ('id' or 'en')
 * @returns {{ message: string, code: string, isFriendly: boolean }}
 */
export function friendlyError(err, locale = "id") {
  const code = extractErrorCode(err);
  const entry = ERROR_MESSAGES[code] || ERROR_MESSAGES.default;
  const message = entry[locale] || entry.id;
  return { message, code, isFriendly: true };
}

/**
 * Extracts an error code from various error shapes.
 */
function extractErrorCode(err) {
  if (!err) return "default";
  if (err.code) return String(err.code);
  if (err.status) return String(err.status);
  if (err.statusCode) return String(err.statusCode);
  if (typeof err === "string") {
    const lower = err.toLowerCase();
    if (lower.includes("network") || lower.includes("fetch") || lower.includes("econn")) return "network";
    if (lower.includes("timeout") || lower.includes("timed out")) return "timeout";
    if (lower.includes("401") || lower.includes("unauthorized")) return "401";
    if (lower.includes("403") || lower.includes("forbidden")) return "403";
    if (lower.includes("404") || lower.includes("not found")) return "404";
    if (lower.includes("503") || lower.includes("unavailable")) return "503";
    return "default";
  }
  if (err instanceof Error) {
    const m = err.message;
    if (m.includes("401") || m.includes("unauthorized")) return "401";
    if (m.includes("403") || m.includes("forbidden")) return "403";
    if (m.includes("timeout") || m.includes("timed out")) return "timeout";
    if (m.includes("network") || m.includes("fetch")) return "network";
    return "default";
  }
  return "default";
}

/**
 * Creates an auto-retry promise that resolves after `delay` ms
 * and can be cancelled.
 * @param {number} [delay=5000] - Retry delay in ms
 * @returns {{ promise: Promise<void>, cancel: () => void }}
 */
export function retryWithDelay(delay = 5000) {
  let timer;
  const promise = new Promise((resolve) => {
    timer = setTimeout(resolve, delay);
  });
  return {
    promise,
    cancel: () => clearTimeout(timer),
  };
}
