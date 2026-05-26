package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ifauze/visiobin/internal/models"
)

func TestGenerateToken(t *testing.T) {
	user := &models.User{
		ID:       "test-id-123",
		Username: "testuser",
		Role:     "operator",
	}

	secret := "test-secret-key-for-jwt"
	expiryHours := 24

	token, err := GenerateToken(user, secret, expiryHours)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	if token == "" {
		t.Fatal("GenerateToken returned empty token")
	}

	// Token should be a valid JWT (3 parts separated by dots)
	parts := 0
	for _, c := range token {
		if c == '.' {
			parts++
		}
	}
	if parts != 2 {
		t.Errorf("Token should have 3 parts (2 dots), got %d dots", parts)
	}
}

func TestJWTAuth_ValidToken(t *testing.T) {
	secret := "test-secret-key-for-jwt"
	user := &models.User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}

	token, err := GenerateToken(user, secret, 24)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	handler := JWTAuth(secret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := GetUserClaims(r)
		if claims == nil {
			t.Error("Claims should not be nil for valid token")
			return
		}
		if claims.UserID != "user-123" {
			t.Errorf("Expected UserID 'user-123', got '%s'", claims.UserID)
		}
		if claims.Username != "testuser" {
			t.Errorf("Expected Username 'testuser', got '%s'", claims.Username)
		}
		if claims.Role != "admin" {
			t.Errorf("Expected Role 'admin', got '%s'", claims.Role)
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}
}

func TestJWTAuth_MissingToken(t *testing.T) {
	secret := "test-secret"
	handler := JWTAuth(secret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("Handler should not be called without token")
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", rr.Code)
	}
}

func TestJWTAuth_InvalidToken(t *testing.T) {
	secret := "test-secret"
	handler := JWTAuth(secret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("Handler should not be called with invalid token")
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", rr.Code)
	}
}

func TestJWTAuth_ExpiredToken(t *testing.T) {
	secret := "test-secret"
	user := &models.User{
		ID:       "user-expired",
		Username: "expired",
		Role:     "operator",
	}

	// Generate token with 0 hours expiry (already expired)
	_ = time.Now() // reference time
	token, err := GenerateToken(user, secret, 0)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	handler := JWTAuth(secret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("Handler should not be called with expired token")
	}))

	// Wait a tiny bit to ensure expiry
	time.Sleep(100 * time.Millisecond)

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", rr.Code)
	}
}

func TestJWTAuth_QueryParam(t *testing.T) {
	secret := "test-secret"
	user := &models.User{
		ID:       "user-query",
		Username: "queryuser",
		Role:     "operator",
	}

	token, err := GenerateToken(user, secret, 24)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	handler := JWTAuth(secret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := GetUserClaims(r)
		if claims == nil {
			t.Error("Claims should not be nil for valid query param token")
			return
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test?token="+token, nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}
}

func TestRequireRole_Allowed(t *testing.T) {
	secret := "test-secret"
	user := &models.User{
		ID:       "admin-user",
		Username: "admin",
		Role:     "admin",
	}

	token, _ := GenerateToken(user, secret, 24)

	handler := JWTAuth(secret)(
		RequireRole("admin", "technician")(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}),
		),
	)

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200 for admin role, got %d", rr.Code)
	}
}

func TestRequireRole_Forbidden(t *testing.T) {
	secret := "test-secret"
	user := &models.User{
		ID:       "operator-user",
		Username: "operator",
		Role:     "operator",
	}

	token, _ := GenerateToken(user, secret, 24)

	handler := JWTAuth(secret)(
		RequireRole("admin")(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				t.Error("Handler should not be called for unauthorized role")
			}),
		),
	)

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("Expected status 403 for operator accessing admin-only, got %d", rr.Code)
	}
}
