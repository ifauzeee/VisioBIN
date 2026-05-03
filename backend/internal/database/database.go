package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func Connect(databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %w", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("✅ Connected to PostgreSQL database")
	
	db := &DB{Pool: pool}
	
	// Auto-run migrations if directory exists
	if err := db.RunMigrations(); err != nil {
		log.Printf("⚠️ Migration warning: %v", err)
	}

	return db, nil
}

func (db *DB) RunMigrations() error {
	migrationDir := "migrations"
	// Check if we are running from cmd/server
	if _, err := os.Stat(migrationDir); os.IsNotExist(err) {
		migrationDir = "../../migrations"
	}

	files, err := os.ReadDir(migrationDir)
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	var sqlFiles []string
	for _, f := range files {
		if !f.IsDir() && filepath.Ext(f.Name()) == ".sql" {
			sqlFiles = append(sqlFiles, filepath.Join(migrationDir, f.Name()))
		}
	}
	sort.Strings(sqlFiles)

	for _, f := range sqlFiles {
		log.Printf("📂 Running migration: %s", filepath.Base(f))
		content, err := os.ReadFile(f)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", f, err)
		}

		if _, err := db.Pool.Exec(context.Background(), string(content)); err != nil {
			// Ignore "already exists" errors to keep it simple for now
			log.Printf("   ℹ️ Migration %s info: %v", filepath.Base(f), err)
		} else {
			log.Printf("   ✅ Migration %s applied", filepath.Base(f))
		}
	}

	return nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
		log.Println("🔌 Database connection closed")
	}
}
