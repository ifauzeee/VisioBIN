package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BinRepository struct {
	pool *pgxpool.Pool
}

func NewBinRepository(pool *pgxpool.Pool) *BinRepository {
	return &BinRepository{pool: pool}
}

func (r *BinRepository) GetAll(ctx context.Context) ([]models.Bin, error) {
	query := `
		SELECT id, name, location, latitude, longitude, max_volume_cm, max_weight_kg, status, api_key, last_seen, created_at, updated_at
		FROM bins 
		ORDER BY created_at DESC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query bins: %w", err)
	}
	defer rows.Close()

	var bins []models.Bin
	for rows.Next() {
		var b models.Bin
		err := rows.Scan(
			&b.ID, &b.Name, &b.Location, &b.Latitude, &b.Longitude,
			&b.MaxVolumeCm, &b.MaxWeightKg, &b.Status, &b.ApiKey, &b.LastSeen, &b.CreatedAt, &b.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan bin: %w", err)
		}
		bins = append(bins, b)
	}

	return bins, nil
}

func (r *BinRepository) GetByID(ctx context.Context, id string) (*models.Bin, error) {
	query := `
		SELECT id, name, location, latitude, longitude, max_volume_cm, max_weight_kg, status, api_key, last_seen, created_at, updated_at
		FROM bins 
		WHERE id = $1
	`

	var b models.Bin
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&b.ID, &b.Name, &b.Location, &b.Latitude, &b.Longitude,
		&b.MaxVolumeCm, &b.MaxWeightKg, &b.Status, &b.ApiKey, &b.LastSeen, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get bin %s: %w", id, err)
	}

	reading, err := r.getLatestReading(ctx, id)
	if err == nil && reading != nil {
		b.LatestReading = reading
	}

	return &b, nil
}

func (r *BinRepository) Create(ctx context.Context, req *models.CreateBinRequest) (*models.Bin, error) {
	apiKey := fmt.Sprintf("vbin-%d%g", time.Now().UnixNano(), req.MaxVolumeCm) // Simple unique key
	if len(apiKey) > 32 {
		apiKey = apiKey[:32]
	}

	query := `
		INSERT INTO bins (name, location, latitude, longitude, max_volume_cm, max_weight_kg, api_key)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, name, location, latitude, longitude, max_volume_cm, max_weight_kg, status, api_key, last_seen, created_at, updated_at
	`

	var b models.Bin
	err := r.pool.QueryRow(ctx, query,
		req.Name, req.Location, req.Latitude, req.Longitude, req.MaxVolumeCm, req.MaxWeightKg, apiKey,
	).Scan(
		&b.ID, &b.Name, &b.Location, &b.Latitude, &b.Longitude,
		&b.MaxVolumeCm, &b.MaxWeightKg, &b.Status, &b.ApiKey, &b.LastSeen, &b.CreatedAt, &b.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("create bin: %w", err)
	}

	return &b, nil
}

func (r *BinRepository) Update(ctx context.Context, id string, req *models.UpdateBinRequest) (*models.Bin, error) {
	query := `
		UPDATE bins SET
			name = COALESCE($2, name),
			location = COALESCE($3, location),
			latitude = COALESCE($4, latitude),
			longitude = COALESCE($5, longitude),
			max_volume_cm = COALESCE($6, max_volume_cm),
			max_weight_kg = COALESCE($7, max_weight_kg),
			status = COALESCE($8, status),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, location, latitude, longitude, max_volume_cm, max_weight_kg, status, api_key, last_seen, created_at, updated_at
	`

	var b models.Bin
	err := r.pool.QueryRow(ctx, query, id,
		req.Name, req.Location, req.Latitude, req.Longitude,
		req.MaxVolumeCm, req.MaxWeightKg, req.Status,
	).Scan(
		&b.ID, &b.Name, &b.Location, &b.Latitude, &b.Longitude,
		&b.MaxVolumeCm, &b.MaxWeightKg, &b.Status, &b.ApiKey, &b.LastSeen, &b.CreatedAt, &b.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("update bin %s: %w", id, err)
	}

	return &b, nil
}

func (r *BinRepository) Delete(ctx context.Context, id string) error {
	if _, err := r.pool.Exec(ctx, "DELETE FROM bins WHERE id = $1", id); err != nil {
		return fmt.Errorf("delete bin %s: %w", id, err)
	}
	return nil
}

func (r *BinRepository) getLatestReading(ctx context.Context, binID string) (*models.SensorReading, error) {
	query := `
		SELECT 
			id, bin_id, distance_organic_cm, distance_inorganic_cm,
			weight_organic_kg, weight_inorganic_kg, gas_amonia_ppm,
			volume_organic_pct, volume_inorganic_pct, recorded_at
		FROM sensor_readings 
		WHERE bin_id = $1
		ORDER BY recorded_at DESC 
		LIMIT 1
	`

	var sr models.SensorReading
	err := r.pool.QueryRow(ctx, query, binID).Scan(
		&sr.ID, &sr.BinID, &sr.DistanceOrganicCm, &sr.DistanceInorganicCm,
		&sr.WeightOrganicKg, &sr.WeightInorganicKg, &sr.GasAmoniaPpm,
		&sr.VolumeOrganicPct, &sr.VolumeInorganicPct, &sr.RecordedAt,
	)

	if err != nil {
		return nil, err
	}

	return &sr, nil
}

func (r *BinRepository) GetSensorHistory(ctx context.Context, binID string, from, to time.Time, limit int) ([]models.SensorReading, error) {
	query := `
		SELECT 
			id, bin_id, distance_organic_cm, distance_inorganic_cm,
			weight_organic_kg, weight_inorganic_kg, gas_amonia_ppm,
			volume_organic_pct, volume_inorganic_pct, recorded_at
		FROM sensor_readings
		WHERE bin_id = $1 AND recorded_at BETWEEN $2 AND $3
		ORDER BY recorded_at DESC 
		LIMIT $4
	`

	rows, err := r.pool.Query(ctx, query, binID, from, to, limit)
	if err != nil {
		return nil, fmt.Errorf("get sensor history: %w", err)
	}
	defer rows.Close()

	var readings []models.SensorReading
	for rows.Next() {
		var sr models.SensorReading
		err := rows.Scan(
			&sr.ID, &sr.BinID, &sr.DistanceOrganicCm, &sr.DistanceInorganicCm,
			&sr.WeightOrganicKg, &sr.WeightInorganicKg, &sr.GasAmoniaPpm,
			&sr.VolumeOrganicPct, &sr.VolumeInorganicPct, &sr.RecordedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan sensor reading: %w", err)
		}
		readings = append(readings, sr)
	}

	return readings, nil
}

func (r *BinRepository) GetByApiKey(ctx context.Context, apiKey string) (*models.Bin, error) {
	query := `
		SELECT id, name, location, latitude, longitude, max_volume_cm, max_weight_kg, status, api_key, last_seen, created_at, updated_at
		FROM bins 
		WHERE api_key = $1
	`

	var b models.Bin
	err := r.pool.QueryRow(ctx, query, apiKey).Scan(
		&b.ID, &b.Name, &b.Location, &b.Latitude, &b.Longitude,
		&b.MaxVolumeCm, &b.MaxWeightKg, &b.Status, &b.ApiKey, &b.LastSeen, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &b, nil
}

func (r *BinRepository) UpdateLastSeen(ctx context.Context, binID string) error {
	query := `UPDATE bins SET last_seen = NOW(), status = 'active' WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, binID)
	return err
}

func (r *BinRepository) UpdateOfflineStatuses(ctx context.Context, timeoutMinutes int) (int64, error) {
	query := `
		UPDATE bins 
		SET status = 'inactive' 
		WHERE last_seen < NOW() - ($1 || ' minutes')::interval 
		AND status = 'active'
	`
	tag, err := r.pool.Exec(ctx, query, timeoutMinutes)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
