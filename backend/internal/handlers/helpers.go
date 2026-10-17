package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"strings"
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

// clampFloat limits a value to the range [min, max]
func clampFloat(val, min, max float64) float64 {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}

// normalizePredictedClass maps accepted class labels onto the canonical English
// values stored in classification_logs; dashboard analytics filter on those.
func normalizePredictedClass(value string) (string, bool) {
	switch strings.ToLower(value) {
	case "organic", "organik":
		return "organic", true
	case "inorganic", "anorganik":
		return "inorganic", true
	default:
		return "", false
	}
}
