package services

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ifauze/visiobin/internal/models"
)

// DashboardService aggregates data for the dashboard summary.
type DashboardService struct {
	pool *pgxpool.Pool
}

func NewDashboardService(pool *pgxpool.Pool) *DashboardService {
	return &DashboardService{pool: pool}
}

// GetSummary returns the full dashboard summary.
func (s *DashboardService) GetSummary(ctx context.Context) (*models.DashboardSummary, error) {
	summary := &models.DashboardSummary{}

	// Total bins
	s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM bins").Scan(&summary.TotalBins)

	// Active bins
	s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM bins WHERE status = 'active'").Scan(&summary.ActiveBins)

	// Bins near full (either compartment > 80%)
	s.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT sr.bin_id)
		FROM sensor_readings sr
		INNER JOIN (
			SELECT bin_id, MAX(recorded_at) as max_time
			FROM sensor_readings GROUP BY bin_id
		) latest ON sr.bin_id = latest.bin_id AND sr.recorded_at = latest.max_time
		WHERE sr.volume_organic_pct > 80 OR sr.volume_inorganic_pct > 80
	`).Scan(&summary.BinsNearFull)

	// Unread alerts
	s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM alerts WHERE is_read = FALSE").Scan(&summary.UnreadAlerts)

	// Classification stats today
	s.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM classification_logs WHERE classified_at::date = CURRENT_DATE",
	).Scan(&summary.TotalClassToday)

	s.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM classification_logs WHERE classified_at::date = CURRENT_DATE AND predicted_class = 'organic'",
	).Scan(&summary.OrganicCountToday)

	s.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM classification_logs WHERE classified_at::date = CURRENT_DATE AND predicted_class = 'inorganic'",
	).Scan(&summary.InorganicCountToday)

	// Recent alerts (top 5)
	alertRows, err := s.pool.Query(ctx, `
		SELECT a.id, a.bin_id, a.alert_type, a.message, a.severity, a.is_read, a.created_at, b.name
		FROM alerts a JOIN bins b ON a.bin_id = b.id
		ORDER BY a.created_at DESC LIMIT 5
	`)
	if err == nil {
		defer alertRows.Close()
		for alertRows.Next() {
			var a models.Alert
			alertRows.Scan(&a.ID, &a.BinID, &a.AlertType, &a.Message, &a.Severity, &a.IsRead, &a.CreatedAt, &a.BinName)
			summary.RecentAlerts = append(summary.RecentAlerts, a)
		}
	}
	if summary.RecentAlerts == nil {
		summary.RecentAlerts = []models.Alert{}
	}

	// Bin statuses with latest readings
	binRows, err := s.pool.Query(ctx, `
		SELECT b.id, b.name, b.status, sr.volume_organic_pct, sr.volume_inorganic_pct, sr.gas_amonia_ppm
		FROM bins b
		LEFT JOIN LATERAL (
			SELECT volume_organic_pct, volume_inorganic_pct, gas_amonia_ppm
			FROM sensor_readings WHERE bin_id = b.id
			ORDER BY recorded_at DESC LIMIT 1
		) sr ON TRUE
		ORDER BY b.name
	`)
	if err == nil {
		defer binRows.Close()
		for binRows.Next() {
			var bs models.BinStatusSummary
			binRows.Scan(&bs.BinID, &bs.BinName, &bs.Status,
				&bs.VolumeOrganicPct, &bs.VolumeInorganicPct, &bs.GasAmoniaPpm)
			summary.BinStatuses = append(summary.BinStatuses, bs)
		}
	}
	if summary.BinStatuses == nil {
		summary.BinStatuses = []models.BinStatusSummary{}
	}

	return summary, nil
}
