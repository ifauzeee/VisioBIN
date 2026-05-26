package handlers

import (
	crypto_rand "crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"regexp"

	"github.com/go-chi/chi/v5"
	"github.com/ifauze/visiobin/internal/middleware"
	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// validRoles defines all allowed user roles in the system
var validRoles = map[string]bool{
	"admin": true, "operator": true, "manager": true, "technician": true,
}

type AuthHandler struct {
	userRepo  *repository.UserRepository
	jwtSecret string
	jwtExpiry int
}

func NewAuthHandler(ur *repository.UserRepository, secret string, expiry int) *AuthHandler {
	return &AuthHandler{
		userRepo:  ur,
		jwtSecret: secret,
		jwtExpiry: expiry,
	}
}

// isValidPassword checks password complexity requirements:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one digit
func isValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(password)
	return hasUpper && hasLower && hasDigit
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	if req.Username == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Username and password are required",
		})
		return
	}

	user, err := h.userRepo.GetByUsername(r.Context(), req.Username)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "Invalid username or password",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "Invalid username or password",
		})
		return
	}

	token, err := middleware.GenerateToken(user, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to generate token",
		})
		return
	}

	refreshToken, _ := middleware.GenerateRefreshToken(user.ID, h.jwtSecret)

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"token":         token,
			"refresh_token": refreshToken,
			"user":          *user,
		},
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Username, email, and password are required",
		})
		return
	}

	if !isValidPassword(req.Password) {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one digit",
		})
		return
	}

	// Security: Public registration is always assigned "operator" role.
	// Only admins can assign other roles via PUT /auth/users/{id}/role.
	req.Role = "operator"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to hash password",
		})
		return
	}

	user, err := h.userRepo.Create(r.Context(), req.Username, req.Email, string(hashedPassword), req.FullName, req.Role)
	if err != nil {
		writeJSON(w, http.StatusConflict, models.APIResponse{
			Success: false, Message: "Username or email already exists",
		})
		return
	}

	token, err := middleware.GenerateToken(user, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "User created but failed to generate token",
		})
		return
	}

	refreshToken, _ := middleware.GenerateRefreshToken(user.ID, h.jwtSecret)

	writeJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"token":         token,
			"refresh_token": refreshToken,
			"user":          *user,
		},
	})
}

func (h *AuthHandler) GuestLogin(w http.ResponseWriter, r *http.Request) {
	// Generate cryptographically secure random guest ID
	randBytes := make([]byte, 8)
	if _, err := crypto_rand.Read(randBytes); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to generate guest session",
		})
		return
	}
	guestSuffix := hex.EncodeToString(randBytes)
	guestID := "guest-" + guestSuffix

	guestUser := &models.User{
		ID:       guestID,
		Username: "guest-" + guestSuffix[:8],
		Email:    "guest@visiobin.local",
		FullName: "Guest User",
		Role:     "guest",
	}

	token, err := middleware.GenerateToken(guestUser, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to generate guest token",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"token": token,
			"user":  *guestUser,
		},
	})
}

// RefreshToken issues a new access token using a valid refresh token.
// POST /auth/refresh { "refresh_token": "..." }
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "refresh_token is required",
		})
		return
	}

	userID, err := middleware.ValidateRefreshToken(body.RefreshToken, h.jwtSecret)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "Invalid or expired refresh token",
		})
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "User not found",
		})
		return
	}

	newToken, err := middleware.GenerateToken(user, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to generate new token",
		})
		return
	}

	newRefreshToken, _ := middleware.GenerateRefreshToken(user.ID, h.jwtSecret)

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"token":         newToken,
			"refresh_token": newRefreshToken,
			"user":          *user,
		},
	})
}

func (h *AuthHandler) UpdateFCMToken(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "Unauthorized",
		})
		return
	}

	var body struct {
		FCMToken string `json:"fcm_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.FCMToken == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "fcm_token is required",
		})
		return
	}

	if err := h.userRepo.UpdateFCMToken(r.Context(), claims.UserID, body.FCMToken); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to update FCM token",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true, Message: "FCM token updated",
	})
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "Unauthorized",
		})
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	var passwordHash string
	if req.Password != "" {
		if !isValidPassword(req.Password) {
			writeJSON(w, http.StatusBadRequest, models.APIResponse{
				Success: false, Message: "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one digit",
			})
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, models.APIResponse{
				Success: false, Message: "Failed to hash password",
			})
			return
		}
		passwordHash = string(hash)
	}

	if err := h.userRepo.UpdateProfile(r.Context(), claims.UserID, req.FullName, req.Email, passwordHash); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to update profile",
		})
		return
	}

	user, _ := h.userRepo.GetByID(r.Context(), claims.UserID)

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profile updated successfully",
		Data:    user,
	})
}

// UpdateUserRole allows admins to change a user's role.
// This is the only way to assign roles other than "operator".
func (h *AuthHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "User ID is required",
		})
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Role == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Role is required",
		})
		return
	}

	if !validRoles[body.Role] {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid role. Must be one of: admin, operator, manager, technician",
		})
		return
	}

	if err := h.userRepo.UpdateRole(r.Context(), id, body.Role); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to update user role",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true, Message: "User role updated successfully",
	})
}

func (h *AuthHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userRepo.GetOperators(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch team members",
		})
		return
	}

	if users == nil {
		users = []models.User{}
	}

	writeJSON(w, http.StatusOK, models.PaginatedResponse{
		Success: true, 
		Data: users,
		Page: 1,
		Limit: len(users),
		Total: len(users),
	})
}

func (h *AuthHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "User ID is required",
		})
		return
	}

	if err := h.userRepo.Delete(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to delete user",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true, Message: "User deleted successfully",
	})
}
