package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	Env            string
	DatabaseURL    string
	JWTSecret      string
	JWTExpiryHours int
	FCMServerKey   string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	port := getEnv("PORT", "8080")
	env := getEnv("ENV", "development")

	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "visiobin")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	databaseURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbPort, dbName, dbSSLMode,
	)

	jwtExpiry, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "72"))
	if err != nil {
		jwtExpiry = 72
	}

	conf := &Config{
		Port:           port,
		Env:            env,
		DatabaseURL:    databaseURL,
		JWTSecret:      getEnv("JWT_SECRET", "visiobin-dev-secret-key"),
		JWTExpiryHours: jwtExpiry,
		FCMServerKey:   getEnv("FCM_SERVER_KEY", ""),
	}

	return conf, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
