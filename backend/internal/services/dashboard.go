package services

import (
	"context"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardService struct {
	pool *pgxpool.Pool
}

func NewDashboardService(pool *pgxpool.Pool) *DashboardService {
	return &DashboardService{pool: pool}
}

func (s *DashboardService) GetSummary(ctx context.Context) (*models.DashboardSummary, error) {
	summary := &models.DashboardSummary{
		RecentAlerts: []models.Alert{},
		BinStatuses:  []models.BinStatusSummary{},
	}

	s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM bins").Scan(&summary.TotalBins)
	s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM bins WHERE status = 'active'").Scan(&summary.ActiveBins)
	s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM alerts WHERE is_read = FALSE").Scan(&summary.UnreadAlerts)

	// Bins near full (threshold > 80%)
	const nearFullQuery = `
		SELECT COUNT(DISTINCT sr.bin_id)
		FROM sensor_readings sr
		INNER JOIN (
			SELECT bin_id, MAX(recorded_at) as max_time
			FROM sensor_readings GROUP BY bin_id
		) latest ON sr.bin_id = latest.bin_id AND sr.recorded_at = latest.max_time
		WHERE sr.volume_organic_pct > 80 OR sr.volume_inorganic_pct > 80
	`
	s.pool.QueryRow(ctx, nearFullQuery).Scan(&summary.BinsNearFull)

	// Today's classification stats (optimized into one query)
	const statsQuery = `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE predicted_class = 'organic'),
			COUNT(*) FILTER (WHERE predicted_class = 'inorganic')
		FROM classification_logs 
		WHERE classified_at::date = CURRENT_DATE
	`
	s.pool.QueryRow(ctx, statsQuery).Scan(
		&summary.TotalClassToday,
		&summary.OrganicCountToday,
		&summary.InorganicCountToday,
	)

	// Recent alerts
	const alertQuery = `
		SELECT a.id, a.bin_id, a.alert_type, a.message, a.severity, a.is_read, a.created_at, b.name
		FROM alerts a 
		JOIN bins b ON a.bin_id = b.id
		ORDER BY a.created_at DESC LIMIT 5
	`
	alertRows, err := s.pool.Query(ctx, alertQuery)
	if err == nil {
		defer alertRows.Close()
		for alertRows.Next() {
			var a models.Alert
			if err := alertRows.Scan(&a.ID, &a.BinID, &a.AlertType, &a.Message, &a.Severity, &a.IsRead, &a.CreatedAt, &a.BinName); err == nil {
				summary.RecentAlerts = append(summary.RecentAlerts, a)
			}
		}
	}

	// Bin statuses with latest readings
	const statusQuery = `
		SELECT b.id, b.name, b.status, sr.volume_organic_pct, sr.volume_inorganic_pct, sr.gas_amonia_ppm
		FROM bins b
		LEFT JOIN LATERAL (
			SELECT volume_organic_pct, volume_inorganic_pct, gas_amonia_ppm
			FROM sensor_readings WHERE bin_id = b.id
			ORDER BY recorded_at DESC LIMIT 1
		) sr ON TRUE
		ORDER BY b.name
	`
	binRows, err := s.pool.Query(ctx, statusQuery)
	if err == nil {
		defer binRows.Close()
		for binRows.Next() {
			var bs models.BinStatusSummary
			err := binRows.Scan(&bs.BinID, &bs.BinName, &bs.Status,
				&bs.VolumeOrganicPct, &bs.VolumeInorganicPct, &bs.GasAmoniaPpm)
			if err == nil {
				summary.BinStatuses = append(summary.BinStatuses, bs)
			}
		}
	}

	return summary, nil
}
