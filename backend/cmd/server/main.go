package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/ifauze/visiobin/internal/config"
	"github.com/ifauze/visiobin/internal/database"
	"github.com/ifauze/visiobin/internal/handlers"
	"github.com/ifauze/visiobin/internal/repository"
	"github.com/ifauze/visiobin/internal/router"
	"github.com/ifauze/visiobin/internal/services"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	log.Printf("🚀 Starting VisioBin API server (env=%s)", cfg.Env)

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	binRepo := repository.NewBinRepository(db.Pool)
	telemetryRepo := repository.NewTelemetryRepository(db.Pool)
	alertRepo := repository.NewAlertRepository(db.Pool)
	userRepo := repository.NewUserRepository(db.Pool)

	// Initialize services
	forecastSvc := services.NewForecastService(telemetryRepo, binRepo)
	dashboardSvc := services.NewDashboardService(db.Pool)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo, cfg.JWTSecret, cfg.JWTExpiryHours)
	binHandler := handlers.NewBinHandler(binRepo, telemetryRepo, alertRepo, forecastSvc, dashboardSvc)

	// Setup router
	r := router.Setup(authHandler, binHandler, cfg.JWTSecret)

	// Print API routes summary
	printRoutes()

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	server := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("\n🛑 Shutting down server...")
		server.Close()
	}()

	log.Printf("✅ VisioBin API listening on http://localhost:%s", cfg.Port)
	log.Printf("📖 Health check: http://localhost:%s/health", cfg.Port)

	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("❌ Server error: %v", err)
	}

	log.Println("👋 Server stopped")
}

func printRoutes() {
	log.Println("📋 API Routes:")
	log.Println("   POST   /api/v1/auth/login")
	log.Println("   POST   /api/v1/auth/register")
	log.Println("   POST   /api/v1/telemetry          (IoT device)")
	log.Println("   POST   /api/v1/classifications     (IoT device)")
	log.Println("   GET    /api/v1/bins                 🔒")
	log.Println("   GET    /api/v1/bins/{id}            🔒")
	log.Println("   POST   /api/v1/bins                 🔒 admin")
	log.Println("   PUT    /api/v1/bins/{id}            🔒 admin")
	log.Println("   DELETE /api/v1/bins/{id}            🔒 admin")
	log.Println("   GET    /api/v1/bins/{id}/history    🔒")
	log.Println("   GET    /api/v1/bins/{id}/forecast   🔒")
	log.Println("   GET    /api/v1/classifications      🔒")
	log.Println("   GET    /api/v1/alerts               🔒")
	log.Println("   PUT    /api/v1/alerts/{id}/read     🔒")
	log.Println("   GET    /api/v1/dashboard/summary    🔒")
}
