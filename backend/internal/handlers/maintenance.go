package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
)

type MaintenanceHandler struct {
	maintRepo *repository.MaintenanceRepository
}

func NewMaintenanceHandler(mr *repository.MaintenanceRepository) *MaintenanceHandler {
	return &MaintenanceHandler{maintRepo: mr}
}

func (h *MaintenanceHandler) CreateLog(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMaintenanceLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	if req.BinID == "" || req.ActionType == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "bin_id and action_type are required",
		})
		return
	}

	// Get user ID from JWT context
	userID, _ := r.Context().Value("user_id").(string)

	log, err := h.maintRepo.Create(r.Context(), &req, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to create maintenance log",
		})
		return
	}

	writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: log})
}

func (h *MaintenanceHandler) ListLogs(w http.ResponseWriter, r *http.Request) {
	binID := r.URL.Query().Get("bin_id")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	logs, total, err := h.maintRepo.GetAll(r.Context(), binID, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch maintenance logs",
		})
		return
	}

	if logs == nil {
		logs = []models.MaintenanceLog{}
	}

	writeJSON(w, http.StatusOK, models.PaginatedResponse{
		Success: true, Data: logs, Page: page, Limit: limit, Total: total,
	})
}

func (h *MaintenanceHandler) DeleteLog(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid log ID",
		})
		return
	}

	if err := h.maintRepo.Delete(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to delete maintenance log",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Message: "Maintenance log deleted"})
}
