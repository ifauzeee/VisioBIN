package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	Env            string
	DatabaseURL    string
	JWTSecret      string
	JWTExpiryHours int
	FCMServerKey   string
	APIKey         string
	AllowedOrigins []string
}

func Load() (*Config, error) {
	_ = godotenv.Load("../.env", ".env")

	port := requireEnv("PORT")
	env := getEnv("ENV", "development")

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		dbHost := requireEnv("DB_HOST")
		dbPort := requireEnv("DB_PORT")
		dbUser := requireEnv("DB_USER")
		dbPassword := requireEnv("DB_PASSWORD")
		dbName := requireEnv("DB_NAME")
		dbSSLMode := requireEnv("DB_SSLMODE")

		databaseURL = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			dbUser, dbPassword, dbHost, dbPort, dbName, dbSSLMode,
		)
	}

	jwtExpiry, err := strconv.Atoi(requireEnv("JWT_EXPIRY_HOURS"))
	if err != nil {
		jwtExpiry = 72
	}

	conf := &Config{
		Port:           port,
		Env:            env,
		DatabaseURL:    databaseURL,
		JWTSecret:      requireEnv("JWT_SECRET"),
		JWTExpiryHours: jwtExpiry,
		FCMServerKey:   getEnv("FCM_SERVER_KEY", ""),
		APIKey:         requireEnv("API_KEY"),
		AllowedOrigins: splitEnvList(requireEnv("ALLOWED_ORIGINS")),
	}

	return conf, nil
}

func requireEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(fmt.Sprintf("missing required environment variable: %s", key))
	}
	return value
}

func splitEnvList(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
