package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ifauze/visiobin/internal/models"
)

// TelemetryRepository handles sensor_readings and classification_logs.
type TelemetryRepository struct {
	pool *pgxpool.Pool
}

func NewTelemetryRepository(pool *pgxpool.Pool) *TelemetryRepository {
	return &TelemetryRepository{pool: pool}
}

// InsertReading stores a new sensor telemetry data point.
// It automatically calculates volume percentage from distance readings.
func (r *TelemetryRepository) InsertReading(ctx context.Context, req *models.TelemetryRequest) (*models.SensorReading, error) {
	// Fetch bin to calculate volume percentage
	var maxVolumeCm float64
	err := r.pool.QueryRow(ctx, "SELECT max_volume_cm FROM bins WHERE id = $1", req.BinID).Scan(&maxVolumeCm)
	if err != nil {
		return nil, fmt.Errorf("bin not found: %w", err)
	}

	// Calculate volume percentage: (max_distance - current_distance) / max_distance * 100
	volOrganicPct := ((maxVolumeCm - req.DistanceOrganicCm) / maxVolumeCm) * 100
	volInorganicPct := ((maxVolumeCm - req.DistanceInorganicCm) / maxVolumeCm) * 100

	// Clamp values between 0 and 100
	volOrganicPct = clamp(volOrganicPct, 0, 100)
	volInorganicPct = clamp(volInorganicPct, 0, 100)

	query := `INSERT INTO sensor_readings
	          (bin_id, distance_organic_cm, distance_inorganic_cm,
	           weight_organic_kg, weight_inorganic_kg, gas_amonia_ppm,
	           volume_organic_pct, volume_inorganic_pct)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	          RETURNING id, bin_id, distance_organic_cm, distance_inorganic_cm,
	            weight_organic_kg, weight_inorganic_kg, gas_amonia_ppm,
	            volume_organic_pct, volume_inorganic_pct, recorded_at`

	var sr models.SensorReading
	err = r.pool.QueryRow(ctx, query,
		req.BinID, req.DistanceOrganicCm, req.DistanceInorganicCm,
		req.WeightOrganicKg, req.WeightInorganicKg, req.GasAmoniaPpm,
		volOrganicPct, volInorganicPct,
	).Scan(&sr.ID, &sr.BinID, &sr.DistanceOrganicCm, &sr.DistanceInorganicCm,
		&sr.WeightOrganicKg, &sr.WeightInorganicKg, &sr.GasAmoniaPpm,
		&sr.VolumeOrganicPct, &sr.VolumeInorganicPct, &sr.RecordedAt)

	if err != nil {
		return nil, fmt.Errorf("insert sensor reading: %w", err)
	}
	return &sr, nil
}

// InsertClassification stores an AI classification event.
func (r *TelemetryRepository) InsertClassification(ctx context.Context, req *models.ClassificationRequest) (*models.ClassificationLog, error) {
	query := `INSERT INTO classification_logs (bin_id, predicted_class, confidence, inference_time_ms)
	          VALUES ($1, $2, $3, $4)
	          RETURNING id, bin_id, predicted_class, confidence, inference_time_ms, classified_at`

	var cl models.ClassificationLog
	err := r.pool.QueryRow(ctx, query,
		req.BinID, req.PredictedClass, req.Confidence, req.InferenceTimeMs,
	).Scan(&cl.ID, &cl.BinID, &cl.PredictedClass, &cl.Confidence, &cl.InferenceTimeMs, &cl.ClassifiedAt)

	if err != nil {
		return nil, fmt.Errorf("insert classification: %w", err)
	}
	return &cl, nil
}

// GetClassifications returns classification logs with optional bin filter.
func (r *TelemetryRepository) GetClassifications(ctx context.Context, binID string, limit, offset int) ([]models.ClassificationLog, int, error) {
	var total int
	countQuery := "SELECT COUNT(*) FROM classification_logs"
	dataQuery := `SELECT id, bin_id, predicted_class, confidence, inference_time_ms, classified_at
	              FROM classification_logs ORDER BY classified_at DESC LIMIT $1 OFFSET $2`

	if binID != "" {
		countQuery += " WHERE bin_id = '" + binID + "'"
		dataQuery = `SELECT id, bin_id, predicted_class, confidence, inference_time_ms, classified_at
		             FROM classification_logs WHERE bin_id = $3
		             ORDER BY classified_at DESC LIMIT $1 OFFSET $2`
	}

	err := r.pool.QueryRow(ctx, countQuery).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count classifications: %w", err)
	}

	var rows interface{ Close() }
	var logs []models.ClassificationLog

	if binID != "" {
		r, err := r.pool.Query(ctx, dataQuery, limit, offset, binID)
		if err != nil {
			return nil, 0, fmt.Errorf("query classifications: %w", err)
		}
		rows = r
		defer rows.Close()
		for r.Next() {
			var cl models.ClassificationLog
			if err := r.Scan(&cl.ID, &cl.BinID, &cl.PredictedClass, &cl.Confidence, &cl.InferenceTimeMs, &cl.ClassifiedAt); err != nil {
				return nil, 0, err
			}
			logs = append(logs, cl)
		}
	} else {
		r, err := r.pool.Query(ctx, dataQuery, limit, offset)
		if err != nil {
			return nil, 0, fmt.Errorf("query classifications: %w", err)
		}
		rows = r
		defer rows.Close()
		for r.Next() {
			var cl models.ClassificationLog
			if err := r.Scan(&cl.ID, &cl.BinID, &cl.PredictedClass, &cl.Confidence, &cl.InferenceTimeMs, &cl.ClassifiedAt); err != nil {
				return nil, 0, err
			}
			logs = append(logs, cl)
		}
	}

	return logs, total, nil
}

// GetForecastData returns sensor readings for forecasting (last N days).
func (r *TelemetryRepository) GetForecastData(ctx context.Context, binID string, days int) ([]models.SensorReading, error) {
	query := `SELECT id, bin_id, distance_organic_cm, distance_inorganic_cm,
	            weight_organic_kg, weight_inorganic_kg, gas_amonia_ppm,
	            volume_organic_pct, volume_inorganic_pct, recorded_at
	          FROM sensor_readings
	          WHERE bin_id = $1 AND recorded_at > NOW() - ($2 || ' days')::INTERVAL
	          ORDER BY recorded_at ASC`

	pgRows, err := r.pool.Query(ctx, query, binID, fmt.Sprintf("%d", days))
	if err != nil {
		return nil, fmt.Errorf("get forecast data: %w", err)
	}
	defer pgRows.Close()

	var readings []models.SensorReading
	for pgRows.Next() {
		var sr models.SensorReading
		err := pgRows.Scan(&sr.ID, &sr.BinID, &sr.DistanceOrganicCm, &sr.DistanceInorganicCm,
			&sr.WeightOrganicKg, &sr.WeightInorganicKg, &sr.GasAmoniaPpm,
			&sr.VolumeOrganicPct, &sr.VolumeInorganicPct, &sr.RecordedAt)
		if err != nil {
			return nil, fmt.Errorf("scan forecast reading: %w", err)
		}
		readings = append(readings, sr)
	}
	return readings, nil
}

func clamp(val, min, max float64) float64 {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}
