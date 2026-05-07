package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
	"github.com/ifauze/visiobin/internal/services"
)

type BinHandler struct {
	binRepo       *repository.BinRepository
	telemetryRepo *repository.TelemetryRepository
	alertRepo     *repository.AlertRepository
	forecastSvc   *services.ForecastService
	dashboardSvc  *services.DashboardService
	broadcaster   *services.Broadcaster
}

func NewBinHandler(
	br *repository.BinRepository,
	tr *repository.TelemetryRepository,
	ar *repository.AlertRepository,
	fs *services.ForecastService,
	ds *services.DashboardService,
	bc *services.Broadcaster,
) *BinHandler {
	return &BinHandler{
		binRepo:       br,
		telemetryRepo: tr,
		alertRepo:     ar,
		forecastSvc:   fs,
		dashboardSvc:  ds,
		broadcaster:   bc,
	}
}

// --- Bin Management ---

func (h *BinHandler) ListBins(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	bins, total, err := h.binRepo.GetPaginated(r.Context(), limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch bins",
		})
		return
	}

	if bins == nil {
		bins = []models.Bin{}
	}

	writeJSON(w, http.StatusOK, models.PaginatedResponse{
		Success: true, Data: bins, Page: page, Limit: limit, Total: total,
	})
}

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

// --- Telemetry & Sensors ---

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

	// Refresh online status
	h.binRepo.UpdateLastSeen(r.Context(), reading.BinID)

	// Async threshold check (Gunakan context.Background agar tidak terputus saat request selesai)
	go h.forecastSvc.CheckThresholds(context.Background(), reading, h.alertRepo)

	// Broadcast via WebSocket
	h.broadcaster.Broadcast(map[string]interface{}{
		"event": "telemetry_updated",
		"data":  reading,
	})

	writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: reading})
}

func (h *BinHandler) GetSensorHistory(w http.ResponseWriter, r *http.Request) {
	binID := chi.URLParam(r, "id")

	limit := 100
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 {
		limit = l
	}

	from := time.Now().Add(-24 * time.Hour)
	to := time.Now()

	if t, err := time.Parse(time.RFC3339, r.URL.Query().Get("from")); err == nil {
		from = t
	}
	if t, err := time.Parse(time.RFC3339, r.URL.Query().Get("to")); err == nil {
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

func (h *BinHandler) ListAllTelemetry(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	readings, total, err := h.telemetryRepo.GetGlobalHistory(r.Context(), limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to fetch telemetry data",
		})
		return
	}

	if readings == nil {
		readings = []models.SensorReading{}
	}

	writeJSON(w, http.StatusOK, models.PaginatedResponse{
		Success: true, Data: readings, Page: page, Limit: limit, Total: total,
	})
}

// --- Analytics & Predictions ---

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

	// Broadcast via WebSocket
	h.broadcaster.Broadcast(map[string]interface{}{
		"event": "classification_logged",
		"data":  log,
	})

	writeJSON(w, http.StatusCreated, models.APIResponse{Success: true, Data: log})
}

func (h *BinHandler) ExportClassifications(w http.ResponseWriter, r *http.Request) {
	// Simple CSV Export
	rows, err := h.telemetryRepo.GetPool().Query(r.Context(), `
		SELECT c.id, b.name, c.predicted_class, c.confidence, c.inference_time_ms, c.classified_at
		FROM classification_logs c
		JOIN bins b ON c.bin_id = b.id
		ORDER BY c.classified_at DESC
	`)
	if err != nil {
		http.Error(w, "Failed to fetch logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment;filename=visiobin_report.csv")

	w.Write([]byte("ID,Bin Name,Class,Confidence,Inference(ms),Timestamp\n"))

	for rows.Next() {
		var id, binName, class string
		var conf float64
		var infer int
		var createdAt time.Time
		if err := rows.Scan(&id, &binName, &class, &conf, &infer, &createdAt); err == nil {
			line := fmt.Sprintf("%s,%s,%s,%.2f,%d,%s\n",
				id, binName, class, conf, infer, createdAt.Format(time.RFC3339))
			w.Write([]byte(line))
		}
	}
}

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

// --- Alerts ---

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

// --- Dashboard ---

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
