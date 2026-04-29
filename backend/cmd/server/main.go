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

	// Service Layer
	forecastSvc := services.NewForecastService(telemetryRepo, binRepo)
	dashboardSvc := services.NewDashboardService(db.Pool)

	// Handler Layer
	authHandler := handlers.NewAuthHandler(userRepo, cfg.JWTSecret, cfg.JWTExpiryHours)
	binHandler := handlers.NewBinHandler(binRepo, telemetryRepo, alertRepo, forecastSvc, dashboardSvc)

	r := router.Setup(authHandler, binHandler, cfg.JWTSecret)

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
	}

	log.Println("Available Endpoints:")
	for _, route := range routes {
		log.Printf("  -> %s", route)
	}
}
