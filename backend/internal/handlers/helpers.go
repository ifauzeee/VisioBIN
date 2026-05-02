package handlers

import (
	"encoding/json"
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
