package models

import "time"

// --- Bin Models ---

type Bin struct {
	ID            string         `json:"id"`
	Name          string         `json:"name"`
	Location      string         `json:"location"`
	Latitude      *float64       `json:"latitude,omitempty"`
	Longitude     *float64       `json:"longitude,omitempty"`
	MaxVolumeCm   float64        `json:"max_volume_cm"`
	MaxWeightKg   float64        `json:"max_weight_kg"`
	Status        string         `json:"status"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	LatestReading *SensorReading `json:"latest_reading,omitempty"`
}

type CreateBinRequest struct {
	Name        string   `json:"name"`
	Location    string   `json:"location"`
	Latitude    *float64 `json:"latitude,omitempty"`
	Longitude   *float64 `json:"longitude,omitempty"`
	MaxVolumeCm float64  `json:"max_volume_cm"`
	MaxWeightKg float64  `json:"max_weight_kg"`
}

type UpdateBinRequest struct {
	Name        *string  `json:"name,omitempty"`
	Location    *string  `json:"location,omitempty"`
	Latitude    *float64 `json:"latitude,omitempty"`
	Longitude   *float64 `json:"longitude,omitempty"`
	MaxVolumeCm *float64 `json:"max_volume_cm,omitempty"`
	MaxWeightKg *float64 `json:"max_weight_kg,omitempty"`
	Status      *string  `json:"status,omitempty"`
}

// --- Telemetry & Sensor Models ---

type SensorReading struct {
	ID                  int64     `json:"id"`
	BinID               string    `json:"bin_id"`
	DistanceOrganicCm   *float64  `json:"distance_organic_cm"`
	DistanceInorganicCm *float64  `json:"distance_inorganic_cm"`
	WeightOrganicKg     *float64  `json:"weight_organic_kg"`
	WeightInorganicKg   *float64  `json:"weight_inorganic_kg"`
	GasAmoniaPpm        *float64  `json:"gas_amonia_ppm"`
	VolumeOrganicPct    *float64  `json:"volume_organic_pct"`
	VolumeInorganicPct  *float64  `json:"volume_inorganic_pct"`
	RecordedAt          time.Time `json:"recorded_at"`
	BinName             string    `json:"bin_name,omitempty"`
}

type TelemetryRequest struct {
	BinID               string  `json:"bin_id"`
	DistanceOrganicCm   float64 `json:"distance_organic_cm"`
	DistanceInorganicCm float64 `json:"distance_inorganic_cm"`
	WeightOrganicKg     float64 `json:"weight_organic_kg"`
	WeightInorganicKg   float64 `json:"weight_inorganic_kg"`
	GasAmoniaPpm        float64 `json:"gas_amonia_ppm"`
}

// --- Classification Models ---

type ClassificationLog struct {
	ID              int64     `json:"id"`
	BinID           string    `json:"bin_id"`
	PredictedClass  string    `json:"predicted_class"`
	Confidence      float64   `json:"confidence"`
	InferenceTimeMs int       `json:"inference_time_ms"`
	ClassifiedAt    time.Time `json:"classified_at"`
}

type ClassificationRequest struct {
	BinID           string  `json:"bin_id"`
	PredictedClass  string  `json:"predicted_class"`
	Confidence      float64 `json:"confidence"`
	InferenceTimeMs int     `json:"inference_time_ms"`
}

// --- Alert Models ---

type Alert struct {
	ID        int64     `json:"id"`
	BinID     string    `json:"bin_id"`
	AlertType string    `json:"alert_type"`
	Message   string    `json:"message"`
	Severity  string    `json:"severity"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
	BinName   string    `json:"bin_name,omitempty"`
}

// --- User & Auth Models ---

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	FCMToken     *string   `json:"fcm_token,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type UpdateProfileRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// --- Analysis & Dashboard Models ---

type ForecastResult struct {
	BinID                   string     `json:"bin_id"`
	CurrentVolumeOrganic    float64    `json:"current_volume_organic_pct"`
	CurrentVolumeInorganic  float64    `json:"current_volume_inorganic_pct"`
	FillRateOrganicPerHr    float64    `json:"fill_rate_organic_per_hr"`
	FillRateInorganicPerHr  float64    `json:"fill_rate_inorganic_per_hr"`
	EstimatedFullOrganic    *time.Time `json:"estimated_full_organic"`
	EstimatedFullInorganic  *time.Time `json:"estimated_full_inorganic"`
	HoursUntilFullOrganic   *float64   `json:"hours_until_full_organic"`
	HoursUntilFullInorganic *float64   `json:"hours_until_full_inorganic"`
}

type VolumeHistoryPoint struct {
	Hour   string  `json:"hour"`
	Volume float64 `json:"volume"`
}

type DailyStatPoint struct {
	Day       string `json:"day"`
	Organic   int    `json:"organic"`
	Inorganic int    `json:"inorganic"`
}

type ClassificationDist struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
	Color string `json:"color"`
}

type ProcessingHistoryPoint struct {
	Hour  string `json:"hour"`
	Items int    `json:"items"`
}

type DashboardSummary struct {
	TotalBins           int                      `json:"total_bins"`
	ActiveBins          int                      `json:"active_bins"`
	BinsNearFull        int                      `json:"bins_near_full"`
	UnreadAlerts        int                      `json:"unread_alerts"`
	TotalClassToday     int                      `json:"total_classifications_today"`
	OrganicCountToday   int                      `json:"organic_count_today"`
	InorganicCountToday int                      `json:"inorganic_count_today"`
	TotalCO2            float64                  `json:"total_co2"`
	TotalCompost        float64                  `json:"total_compost"`
	RecentAlerts        []Alert                  `json:"recent_alerts"`
	BinStatuses         []BinStatusSummary       `json:"bin_statuses"`
	VolumeHistory       []VolumeHistoryPoint     `json:"volume_history"`
	DailyStats          []DailyStatPoint         `json:"daily_stats"`
	Distribution        []ClassificationDist     `json:"distribution"`
	ProcessingHistory   []ProcessingHistoryPoint `json:"processing_history"`
}

type BinStatusSummary struct {
	BinID              string   `json:"bin_id"`
	BinName            string   `json:"bin_name"`
	Status             string   `json:"status"`
	VolumeOrganicPct   *float64 `json:"volume_organic_pct"`
	VolumeInorganicPct *float64 `json:"volume_inorganic_pct"`
	GasAmoniaPpm       *float64 `json:"gas_amonia_ppm"`
}

// --- Maintenance Log Models ---

type MaintenanceLog struct {
	ID           int64     `json:"id"`
	BinID        string    `json:"bin_id"`
	ActionType   string    `json:"action_type"`
	Notes        string    `json:"notes"`
	PerformedBy  *string   `json:"performed_by,omitempty"`
	PerformedAt  time.Time `json:"performed_at"`
	BinName      string    `json:"bin_name,omitempty"`
	PerformerName string   `json:"performer_name,omitempty"`
}

type CreateMaintenanceLogRequest struct {
	BinID      string `json:"bin_id"`
	ActionType string `json:"action_type"`
	Notes      string `json:"notes"`
}

// --- Response Helpers ---

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginatedResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Page    int         `json:"page"`
	Limit   int         `json:"limit"`
	Total   int         `json:"total"`
}
