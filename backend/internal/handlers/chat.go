package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ifauze/visiobin/internal/middleware"
	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
	"github.com/ifauze/visiobin/internal/services"
)

type ChatHandler struct {
	chatRepo    *repository.ChatRepository
	userRepo    *repository.UserRepository
	broadcaster *services.Broadcaster
	notifSvc    *services.NotificationService
}

func NewChatHandler(cr *repository.ChatRepository, ur *repository.UserRepository, b *services.Broadcaster, ns *services.NotificationService) *ChatHandler {
	return &ChatHandler{
		chatRepo:    cr,
		userRepo:    ur,
		broadcaster: b,
		notifSvc:    ns,
	}
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Content     string  `json:"content"`
		RecipientID *string `json:"recipient_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	if req.Content == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Content is required",
		})
		return
	}

	// Get sender ID from claims
	claims := middleware.GetUserClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "Unauthorized",
		})
		return
	}
	userID := claims.UserID
	
	// Save to DB
	msg, err := h.chatRepo.CreateMessage(r.Context(), userID, req.RecipientID, req.Content)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to save message",
		})
		return
	}

	// Enrich with sender info
	user, _ := h.userRepo.GetByID(r.Context(), userID)
	if user != nil {
		msg.SenderName = user.FullName
		msg.SenderRole = user.Role
	}

	// Broadcast via WebSocket
	h.broadcaster.Broadcast(map[string]interface{}{
		"event": "chat_message",
		"data":  msg,
	})

	// Send Push Notification
	go h.notifSvc.NotifyChatMessage(context.Background(), h.userRepo, msg.SenderName, msg.Content, req.RecipientID)

	writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: msg})
}

func (h *ChatHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 {
		limit = l
	}

	claims := middleware.GetUserClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.APIResponse{
			Success: false, Message: "Unauthorized",
		})
		return
	}
	userID := claims.UserID
	otherID := r.URL.Query().Get("other_id")

	messages, err := h.chatRepo.GetRecentMessages(r.Context(), limit, userID, otherID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch chat history",
		})
		return
	}

	if messages == nil {
		messages = []models.ChatMessage{}
	}

	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: messages})
}
