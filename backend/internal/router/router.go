package router

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/ifauze/visiobin/internal/handlers"
	"github.com/ifauze/visiobin/internal/middleware"
	"github.com/ifauze/visiobin/internal/repository"
	"github.com/ifauze/visiobin/internal/services"
)

func Setup(
	authHandler *handlers.AuthHandler,
	binHandler *handlers.BinHandler,
	maintHandler *handlers.MaintenanceHandler,
	chatHandler *handlers.ChatHandler,
	binRepo *repository.BinRepository,
	jwtSecret string,
	broadcaster *services.Broadcaster,
	allowedOrigins []string,
) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", handlers.HealthCheck)
	r.Get("/ws", broadcaster.ServeWS)

	r.Route("/api/v1", func(r chi.Router) {
		// Auth Public
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/guest", authHandler.GuestLogin)

		// Telemetry Ingest (IoT Key)
		r.Group(func(r chi.Router) {
			r.Use(middleware.APIKeyAuth(binRepo))
			r.Post("/telemetry", binHandler.IngestTelemetry)
			r.Post("/classifications", binHandler.LogClassification)
		})

		// Dashboard Protected (JWT)
		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(jwtSecret))

			// User & Profile
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("admin", "operator", "manager", "technician"))
				r.Put("/auth/fcm-token", authHandler.UpdateFCMToken)
				r.Put("/auth/profile", authHandler.UpdateProfile)
				r.Get("/auth/users", authHandler.ListUsers)
			})

			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("admin"))
				r.Delete("/auth/users/{id}", authHandler.DeleteUser)
			})

			// Chat System (All authenticated roles)
			r.Route("/chat", func(r chi.Router) {
				r.Post("/", chatHandler.SendMessage)
				r.Get("/history", chatHandler.GetHistory)
			})

			// Bins & Analytics
			r.Route("/bins", func(r chi.Router) {
				r.Get("/", binHandler.ListBins)
				r.Get("/{id}", binHandler.GetBin)
				r.Get("/{id}/history", binHandler.GetSensorHistory)
				r.Get("/{id}/forecast", binHandler.GetForecast)

				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin", "technician"))
					r.Post("/", binHandler.CreateBin)
					r.Put("/{id}", binHandler.UpdateBin)
					r.Delete("/{id}", binHandler.DeleteBin)
				})
			})

			r.Get("/classifications", binHandler.ListClassifications)
			r.Get("/classifications/export", binHandler.ExportClassifications)
			r.Get("/alerts", binHandler.ListAlerts)
			
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("admin", "operator", "technician"))
				r.Put("/alerts/{id}/read", binHandler.MarkAlertRead)
			})

			r.Get("/dashboard/summary", binHandler.GetDashboardSummary)
			r.Get("/telemetry", binHandler.ListAllTelemetry)

			// Maintenance Logs
			r.Get("/maintenance", maintHandler.ListLogs)
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("admin", "operator", "technician"))
				r.Post("/maintenance", maintHandler.CreateLog)
				r.Delete("/maintenance/{id}", maintHandler.DeleteLog)
			})
		})
	})

	return r
}
