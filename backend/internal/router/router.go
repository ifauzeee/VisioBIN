package router

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/ifauze/visiobin/internal/handlers"
	"github.com/ifauze/visiobin/internal/middleware"
)

// Setup creates and configures the HTTP router with all routes.
func Setup(
	authHandler *handlers.AuthHandler,
	binHandler *handlers.BinHandler,
	jwtSecret string,
) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check (no auth)
	r.Get("/health", handlers.HealthCheck)

	// API v1
	r.Route("/api/v1", func(r chi.Router) {

		// === Public routes (no auth) ===
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/register", authHandler.Register)

		// === Device telemetry (uses device API key or JWT) ===
		// For now, telemetry endpoint is open so IoT devices can POST data
		r.Post("/telemetry", binHandler.IngestTelemetry)
		r.Post("/classifications", binHandler.LogClassification)

		// === Protected routes (JWT required) ===
		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(jwtSecret))

			// User
			r.Put("/auth/fcm-token", authHandler.UpdateFCMToken)

			// Bins
			r.Get("/bins", binHandler.ListBins)
			r.Get("/bins/{id}", binHandler.GetBin)
			r.Get("/bins/{id}/history", binHandler.GetSensorHistory)
			r.Get("/bins/{id}/forecast", binHandler.GetForecast)

			// Admin-only bin management
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("admin"))
				r.Post("/bins", binHandler.CreateBin)
				r.Put("/bins/{id}", binHandler.UpdateBin)
				r.Delete("/bins/{id}", binHandler.DeleteBin)
			})

			// Classifications
			r.Get("/classifications", binHandler.ListClassifications)

			// Alerts
			r.Get("/alerts", binHandler.ListAlerts)
			r.Put("/alerts/{id}/read", binHandler.MarkAlertRead)

			// Dashboard
			r.Get("/dashboard/summary", binHandler.GetDashboardSummary)
		})
	})

	return r
}
