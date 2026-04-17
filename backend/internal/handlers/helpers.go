package handlers

import (
	"encoding/json"
	"net/http"
)

// writeJSON writes a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// HealthCheck returns a simple health status.
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "VisioBin API is running",
		"version": "1.0.0",
	})
}
