package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
	"github.com/ifauze/visiobin/internal/services"
)

// BinHandler handles bin and telemetry endpoints.
type BinHandler struct {
	binRepo       *repository.BinRepository
	telemetryRepo *repository.TelemetryRepository
	alertRepo     *repository.AlertRepository
	forecastSvc   *services.ForecastService
	dashboardSvc  *services.DashboardService
}

func NewBinHandler(
	br *repository.BinRepository,
	tr *repository.TelemetryRepository,
	ar *repository.AlertRepository,
	fs *services.ForecastService,
	ds *services.DashboardService,
) *BinHandler {
	return &BinHandler{
		binRepo:       br,
		telemetryRepo: tr,
		alertRepo:     ar,
		forecastSvc:   fs,
		dashboardSvc:  ds,
	}
}

// ============================================
// Bin CRUD
// ============================================

// ListBins returns all bins.
func (h *BinHandler) ListBins(w http.ResponseWriter, r *http.Request) {
	bins, err := h.binRepo.GetAll(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch bins",
		})
		return
	}
	if bins == nil {
		bins = []models.Bin{}
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: bins})
}

// GetBin returns a single bin with its latest reading.
func (h *BinHandler) GetBin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	bin, err := h.binRepo.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, models.APIResponse{
			Success: false, Message: "Bin not found",
		})
		return
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: bin})
}

// CreateBin creates a new bin.
func (h *BinHandler) CreateBin(w http.ResponseWriter, r *http.Request) {
	var req models.CreateBinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Name is required",
		})
		return
	}

	if req.MaxVolumeCm <= 0 {
		req.MaxVolumeCm = 50.0
	}
	if req.MaxWeightKg <= 0 {
		req.MaxWeightKg = 20.0
	}

	bin, err := h.binRepo.Create(r.Context(), &req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to create bin",
		})
		return
	}
	writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: bin})
}

// UpdateBin modifies a bin.
func (h *BinHandler) UpdateBin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.UpdateBinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	bin, err := h.binRepo.Update(r.Context(), id, &req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to update bin",
		})
		return
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: bin})
}

// DeleteBin removes a bin.
func (h *BinHandler) DeleteBin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.binRepo.Delete(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to delete bin",
		})
		return
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Message: "Bin deleted"})
}

// ============================================
// Telemetry
// ============================================

// IngestTelemetry receives sensor data from Raspberry Pi.
func (h *BinHandler) IngestTelemetry(w http.ResponseWriter, r *http.Request) {
	var req models.TelemetryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	if req.BinID == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "bin_id is required",
		})
		return
	}

	reading, err := h.telemetryRepo.InsertReading(r.Context(), &req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to store telemetry: " + err.Error(),
		})
		return
	}

	// Check thresholds and create alerts if needed (async-like, non-blocking)
	go h.forecastSvc.CheckThresholds(r.Context(), reading, h.alertRepo)

	writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: reading})
}

// GetSensorHistory returns historical sensor data for a bin.
func (h *BinHandler) GetSensorHistory(w http.ResponseWriter, r *http.Request) {
	binID := chi.URLParam(r, "id")

	// Parse query params
	limitStr := r.URL.Query().Get("limit")
	limit := 100
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	from := time.Now().Add(-24 * time.Hour) // default: last 24 hours
	to := time.Now()

	if t, err := time.Parse(time.RFC3339, fromStr); err == nil {
		from = t
	}
	if t, err := time.Parse(time.RFC3339, toStr); err == nil {
		to = t
	}

	readings, err := h.binRepo.GetSensorHistory(r.Context(), binID, from, to, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch sensor history",
		})
		return
	}
	if readings == nil {
		readings = []models.SensorReading{}
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: readings})
}

// ============================================
// Forecast
// ============================================

// GetForecast returns the estimated time until a bin is full.
func (h *BinHandler) GetForecast(w http.ResponseWriter, r *http.Request) {
	binID := chi.URLParam(r, "id")

	forecast, err := h.forecastSvc.EstimateTimeFull(r.Context(), binID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to generate forecast",
		})
		return
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: forecast})
}

// ============================================
// Classifications
// ============================================

// LogClassification stores an AI classification result.
func (h *BinHandler) LogClassification(w http.ResponseWriter, r *http.Request) {
	var req models.ClassificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body",
		})
		return
	}

	if req.BinID == "" || req.PredictedClass == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "bin_id and predicted_class are required",
		})
		return
	}

	log, err := h.telemetryRepo.InsertClassification(r.Context(), &req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to log classification",
		})
		return
	}
	writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: log})
}

// ListClassifications returns classification logs.
func (h *BinHandler) ListClassifications(w http.ResponseWriter, r *http.Request) {
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

	logs, total, err := h.telemetryRepo.GetClassifications(r.Context(), binID, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch classifications",
		})
		return
	}
	if logs == nil {
		logs = []models.ClassificationLog{}
	}

	writeJSON(w, http.StatusOK, models.PaginatedResponse{
		Success: true, Data: logs, Page: page, Limit: limit, Total: total,
	})
}

// ============================================
// Alerts
// ============================================

// ListAlerts returns alerts with pagination.
func (h *BinHandler) ListAlerts(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	unreadOnly := r.URL.Query().Get("unread") == "true"

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	alerts, total, err := h.alertRepo.GetAll(r.Context(), limit, offset, unreadOnly)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch alerts",
		})
		return
	}
	if alerts == nil {
		alerts = []models.Alert{}
	}

	writeJSON(w, http.StatusOK, models.PaginatedResponse{
		Success: true, Data: alerts, Page: page, Limit: limit, Total: total,
	})
}

// MarkAlertRead marks an alert as read.
func (h *BinHandler) MarkAlertRead(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid alert ID",
		})
		return
	}

	if err := h.alertRepo.MarkAsRead(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to mark alert as read",
		})
		return
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Message: "Alert marked as read"})
}

// ============================================
// Dashboard
// ============================================

// GetDashboardSummary returns aggregated data for the web dashboard.
func (h *BinHandler) GetDashboardSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.dashboardSvc.GetSummary(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch dashboard summary",
		})
		return
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: summary})
}
