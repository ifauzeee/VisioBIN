package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/ifauze/visiobin/internal/middleware"
	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"github.com/go-chi/chi/v5"
)

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

	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			Token: token,
			User:  *user,
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

	if len(req.Password) < 6 {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Password must be at least 6 characters",
		})
		return
	}

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

	writeJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			Token: token,
			User:  *user,
		},
	})
}

func (h *AuthHandler) GuestLogin(w http.ResponseWriter, r *http.Request) {
	// Create a mock user for guest with a unique suffix
	guestID := "guest-" + time.Now().Format("050415") // Simple unique-ish ID for demo
	guestUser := &models.User{
		ID:       guestID,
		Username: "guest-" + guestID[6:],
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
		Data: models.AuthResponse{
			Token: token,
			User:  *guestUser,
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
		if len(req.Password) < 6 {
			writeJSON(w, http.StatusBadRequest, models.APIResponse{
				Success: false, Message: "Password must be at least 6 characters",
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
