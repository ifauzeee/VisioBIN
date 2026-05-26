package middleware

import (
	"context"
	"net/http"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
)

// BinContextKey is the typed context key for authenticated IoT bins
const BinContextKey contextKey = "authenticated_bin"

// APIKeyAuth is a middleware that requires a valid X-API-Key header for IoT devices
func APIKeyAuth(repo *repository.BinRepository) func(http.Handler) http.Handler {
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

			// Validate key against DB
			bin, err := repo.GetByApiKey(r.Context(), providedKey)
			if err != nil {
				writeJSON(w, http.StatusForbidden, models.APIResponse{
					Success: false,
					Message: "Invalid API Key",
				})
				return
			}

			ctx := context.WithValue(r.Context(), BinContextKey, bin)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
