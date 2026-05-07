package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ifauze/visiobin/internal/config"
	"github.com/ifauze/visiobin/internal/database"
	"github.com/ifauze/visiobin/internal/handlers"
	"github.com/ifauze/visiobin/internal/repository"
	"github.com/ifauze/visiobin/internal/router"
	"github.com/ifauze/visiobin/internal/services"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("Config error", "error", err)
		os.Exit(1)
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		slog.Error("Database error", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Repository Layer
	binRepo := repository.NewBinRepository(db.Pool)
	telemetryRepo := repository.NewTelemetryRepository(db.Pool)
	alertRepo := repository.NewAlertRepository(db.Pool)
	userRepo := repository.NewUserRepository(db.Pool)
	maintRepo := repository.NewMaintenanceRepository(db.Pool)
	chatRepo := repository.NewChatRepository(db.Pool)


	// Service Layer
	notifSvc    := services.NewNotificationService()
	forecastSvc := services.NewForecastService(telemetryRepo, binRepo, userRepo, notifSvc)
	dashboardSvc := services.NewDashboardService(db.Pool)
	broadcaster := services.NewBroadcaster()
	go broadcaster.Run()

	slog.Info("Service layer initialized")

	// Handler Layer
	authHandler := handlers.NewAuthHandler(userRepo, cfg.JWTSecret, cfg.JWTExpiryHours)
	binHandler := handlers.NewBinHandler(binRepo, telemetryRepo, alertRepo, forecastSvc, dashboardSvc, broadcaster)
	maintHandler := handlers.NewMaintenanceHandler(maintRepo)
	chatHandler := handlers.NewChatHandler(chatRepo, userRepo, broadcaster, notifSvc)


	r := router.Setup(authHandler, binHandler, maintHandler, chatHandler, binRepo, cfg.JWTSecret, broadcaster, cfg.AllowedOrigins)


	// Background Worker: Heartbeat & Data Retention
	go func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("Background worker panic recovered", "panic", r)
			}
		}()

		ticker := time.NewTicker(1 * time.Minute)
		slog.Info("Background worker started", "task", "Heartbeat & Retention")
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			
			// 1. Mark bins offline if > 5 minutes inactive
			affected, err := binRepo.UpdateOfflineStatuses(ctx, 5)
			if err != nil {
				slog.Error("Worker Error", "module", "UpdateOfflineStatuses", "error", err)
			} else if affected > 0 {
				slog.Info("Worker Update", "task", "UpdateOfflineStatuses", "affected_bins", affected)
			}

			// 2. Data Retention: Cleanup readings > 30 days (Once an hour)
			if time.Now().Minute() == 0 {
				cleaned, err := telemetryRepo.CleanupOldReadings(ctx, 30)
				if err != nil {
					slog.Error("Worker Error", "module", "CleanupOldReadings", "error", err)
				} else if cleaned > 0 {
					slog.Info("Worker Update", "task", "CleanupOldReadings", "cleaned_readings", cleaned)
				}
			}
			cancel()
		}
	}()

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// Graceful Shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		slog.Info("Shutting down server...")

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			slog.Error("Server shutdown error", "error", err)
		}
	}()

	slog.Info("VisioBin API started", "port", cfg.Port, "env", cfg.Env)
	printRoutes()

	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		slog.Error("Listen error", "error", err)
		os.Exit(1)
	}

	slog.Info("Server stopped")
}

func printRoutes() {
	routes := []string{
		"POST   /auth/login",
		"POST   /auth/register",
		"POST   /telemetry",
		"POST   /classifications",
		"GET    /bins",
		"GET    /bins/{id}",
		"POST   /bins (Admin)",
		"GET    /alerts",
		"GET    /dashboard/summary",
		"GET    /maintenance",
		"POST   /maintenance",
	}

	slog.Info("Available Endpoints initialized")
	for _, route := range routes {
		slog.Debug("Route registered", "path", route)
	}
}
