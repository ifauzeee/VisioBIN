package middleware

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// Logger logs HTTP requests with method, path, status, and duration.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap response writer to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)
		log.Printf("%-7s %s %d %v",
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			duration,
		)
	})
}

// Recoverer catches panics and returns a 500 error.
func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("🔥 PANIC: %v", err)
				writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
					"success": false,
					"message": "Internal server error",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture the status code.
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// writeJSON is a helper to write JSON responses.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
