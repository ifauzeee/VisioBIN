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
		RecentAlerts:      []models.Alert{},
		BinStatuses:       []models.BinStatusSummary{},
		VolumeHistory:     []models.VolumeHistoryPoint{},
		DailyStats:        []models.DailyStatPoint{},
		Distribution:      []models.ClassificationDist{},
		ProcessingHistory: []models.ProcessingHistoryPoint{},
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

	// Today's classification stats
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

	// Volume History (Last 24 Hours)
	const volHistQuery = `
		SELECT 
			TO_CHAR(date_trunc('hour', recorded_at), 'HH24:00') as hour,
			AVG((volume_organic_pct + volume_inorganic_pct) / 2) as avg_vol
		FROM sensor_readings
		WHERE recorded_at > NOW() - INTERVAL '24 hours'
		GROUP BY 1, date_trunc('hour', recorded_at)
		ORDER BY date_trunc('hour', recorded_at)
	`
	volRows, err := s.pool.Query(ctx, volHistQuery)
	if err == nil {
		defer volRows.Close()
		for volRows.Next() {
			var p models.VolumeHistoryPoint
			if err := volRows.Scan(&p.Hour, &p.Volume); err == nil {
				summary.VolumeHistory = append(summary.VolumeHistory, p)
			}
		}
	}

	// Daily Classification Stats (Last 7 Days)
	const dailyStatsQuery = `
		SELECT 
			TO_CHAR(classified_at, 'DD/MM') as day,
			COUNT(*) FILTER (WHERE predicted_class = 'organic') as org,
			COUNT(*) FILTER (WHERE predicted_class = 'inorganic') as inorg
		FROM classification_logs
		WHERE classified_at > NOW() - INTERVAL '7 days'
		GROUP BY 1, date_trunc('day', classified_at)
		ORDER BY date_trunc('day', classified_at)
	`
	dailyRows, err := s.pool.Query(ctx, dailyStatsQuery)
	if err == nil {
		defer dailyRows.Close()
		for dailyRows.Next() {
			var p models.DailyStatPoint
			if err := dailyRows.Scan(&p.Day, &p.Organic, &p.Inorganic); err == nil {
				summary.DailyStats = append(summary.DailyStats, p)
			}
		}
	}

	// Overall Distribution
	summary.Distribution = []models.ClassificationDist{
		{Name: "Organik", Value: summary.OrganicCountToday, Color: "var(--brand-organic)"},
		{Name: "Anorganik", Value: summary.InorganicCountToday, Color: "var(--brand-inorganic)"},
	}

	// Processing History (Last 24 Hours)
	const procHistQuery = `
		SELECT 
			TO_CHAR(date_trunc('hour', classified_at), 'HH24:00') as hour,
			COUNT(*) as items
		FROM classification_logs
		WHERE classified_at > NOW() - INTERVAL '24 hours'
		GROUP BY 1, date_trunc('hour', classified_at)
		ORDER BY date_trunc('hour', classified_at)
	`
	procRows, err := s.pool.Query(ctx, procHistQuery)
	if err == nil {
		defer procRows.Close()
		for procRows.Next() {
			var p models.ProcessingHistoryPoint
			if err := procRows.Scan(&p.Hour, &p.Items); err == nil {
				summary.ProcessingHistory = append(summary.ProcessingHistory, p)
			}
		}
	}

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
