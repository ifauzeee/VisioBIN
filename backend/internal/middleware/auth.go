package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ifauze/visiobin/internal/models"
)

type contextKey string

const UserContextKey contextKey = "user_claims"

type JWTClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(user *models.User, secret string, expiryHours int) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "visiobin-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func JWTAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := ""
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
					tokenString = parts[1]
				}
			}

			// Fallback to query param for file exports
			if tokenString == "" {
				tokenString = r.URL.Query().Get("token")
			}

			if tokenString == "" {
				writeJSON(w, http.StatusUnauthorized, models.APIResponse{
					Success: false,
					Message: "Authorization required",
				})
				return
			}
			claims := &JWTClaims{}

			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(secret), nil
			})

			if err != nil || !token.Valid {
				writeJSON(w, http.StatusUnauthorized, models.APIResponse{
					Success: false,
					Message: "Invalid or expired token",
				})
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*JWTClaims)
			if !ok {
				writeJSON(w, http.StatusUnauthorized, models.APIResponse{
					Success: false,
					Message: "Unauthorized",
				})
				return
			}

			for _, role := range roles {
				if claims.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			writeJSON(w, http.StatusForbidden, models.APIResponse{
				Success: false,
				Message: "Insufficient permissions",
			})
		})
	}
}

func GetUserClaims(r *http.Request) *JWTClaims {
	claims, _ := r.Context().Value(UserContextKey).(*JWTClaims)
	return claims
}
