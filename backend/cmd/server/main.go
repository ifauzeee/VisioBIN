package main

import (
	"context"
	"log"
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
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Config error: %v", err)
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Database error: %v", err)
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
				log.Printf("Background worker panic recovered: %v", r)
			}
		}()

		ticker := time.NewTicker(1 * time.Minute)
		log.Println("Background worker started (Heartbeat & Retention)")
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			
			// 1. Mark bins offline if > 5 minutes inactive
			affected, err := binRepo.UpdateOfflineStatuses(ctx, 5)
			if err != nil {
				log.Printf("Worker Error (UpdateOfflineStatuses): %v", err)
			} else if affected > 0 {
				log.Printf("Worker: Marked %d bins as offline", affected)
			}

			// 2. Data Retention: Cleanup readings > 30 days (Once an hour)
			if time.Now().Minute() == 0 {
				cleaned, err := telemetryRepo.CleanupOldReadings(ctx, 30)
				if err != nil {
					log.Printf("Worker Error (CleanupOldReadings): %v", err)
				} else if cleaned > 0 {
					log.Printf("Worker: Cleaned up %d old sensor readings", cleaned)
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

		log.Println("Shutting down server...")

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("VisioBin API started on port %s (%s)", cfg.Port, cfg.Env)
	printRoutes()

	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("Listen error: %v", err)
	}

	log.Println("Server stopped")
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

	log.Println("Available Endpoints:")
	for _, route := range routes {
		log.Printf("  -> %s", route)
	}
}
