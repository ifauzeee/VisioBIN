package middleware

import (
	"net/http"

	"github.com/ifauze/visiobin/internal/models"
)

// APIKeyAuth is a middleware that requires a valid X-API-Key header for IoT devices
func APIKeyAuth(expectedKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			providedKey := r.Header.Get("X-API-Key")

			if providedKey == "" {
				writeJSON(w, http.StatusUnauthorized, models.APIResponse{
					Success: false,
					Message: "Missing API Key",
				})
				return
			}

			if providedKey != expectedKey {
				writeJSON(w, http.StatusForbidden, models.APIResponse{
					Success: false,
					Message: "Invalid API Key",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
