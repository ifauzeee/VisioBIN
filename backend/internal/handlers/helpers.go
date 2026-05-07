package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"time"
)

// startTime digunakan untuk menghitung uptime server
var startTime = time.Now()

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	// Log errors (4xx and 5xx)
	if status >= 400 {
		slog.Warn("API Error Response", "status", status, "data", data)
	}

	json.NewEncoder(w).Encode(data)
}

// HealthCheck handler untuk monitoring dan Docker HEALTHCHECK.
// Endpoint: GET /health
// Tidak memerlukan autentikasi.
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(startTime)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":    true,
		"status":     "ok",
		"service":    "VisioBin API",
		"version":    "1.0.0",
		"env":        os.Getenv("ENV"),
		"uptime_sec": int(uptime.Seconds()),
		"go_version": runtime.Version(),
	})
}
