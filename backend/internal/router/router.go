package router

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/ifauze/visiobin/internal/handlers"
	"github.com/ifauze/visiobin/internal/middleware"
	"github.com/ifauze/visiobin/internal/services"
)

func Setup(
	authHandler *handlers.AuthHandler,
	binHandler *handlers.BinHandler,
	maintHandler *handlers.MaintenanceHandler,
	jwtSecret string,
	apiKey string,
	broadcaster *services.Broadcaster,
) *chi.Mux {
	r := chi.NewRouter()

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

	r.Get("/health", handlers.HealthCheck)
	r.Get("/ws", broadcaster.ServeWS)

	r.Route("/api/v1", func(r chi.Router) {
		// Auth
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/register", authHandler.Register)

		// Telemetry (Protected for IoT devices via API Key)
		r.Group(func(r chi.Router) {
			r.Use(middleware.APIKeyAuth(apiKey))
			r.Post("/telemetry", binHandler.IngestTelemetry)
			r.Post("/classifications", binHandler.LogClassification)
		})

		// Protected Routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(jwtSecret))

			r.Put("/auth/fcm-token", authHandler.UpdateFCMToken)

			// Bins Access
			r.Route("/bins", func(r chi.Router) {
				r.Get("/", binHandler.ListBins)
				r.Get("/{id}", binHandler.GetBin)
				r.Get("/{id}/history", binHandler.GetSensorHistory)
				r.Get("/{id}/forecast", binHandler.GetForecast)

				// Admin-only Management
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin"))
					r.Post("/", binHandler.CreateBin)
					r.Put("/{id}", binHandler.UpdateBin)
					r.Delete("/{id}", binHandler.DeleteBin)
				})
			})

			r.Get("/classifications", binHandler.ListClassifications)
			r.Get("/classifications/export", binHandler.ExportClassifications)

			r.Get("/alerts", binHandler.ListAlerts)
			r.Put("/alerts/{id}/read", binHandler.MarkAlertRead)

			r.Get("/dashboard/summary", binHandler.GetDashboardSummary)

			// Maintenance Logs
			r.Get("/maintenance", maintHandler.ListLogs)
			r.Post("/maintenance", maintHandler.CreateLog)
			r.Delete("/maintenance/{id}", maintHandler.DeleteLog)
		})
	})

	return r
}
