package repository

import (
	"context"
	"fmt"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AlertRepository struct {
	pool *pgxpool.Pool
}

func NewAlertRepository(pool *pgxpool.Pool) *AlertRepository {
	return &AlertRepository{pool: pool}
}

func (r *AlertRepository) Create(ctx context.Context, binID, alertType, message, severity string) (*models.Alert, error) {
	query := `
		INSERT INTO alerts (bin_id, alert_type, message, severity)
		VALUES ($1, $2, $3, $4)
		RETURNING id, bin_id, alert_type, message, severity, is_read, created_at
	`

	var a models.Alert
	err := r.pool.QueryRow(ctx, query, binID, alertType, message, severity).Scan(
		&a.ID, &a.BinID, &a.AlertType, &a.Message, &a.Severity, &a.IsRead, &a.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create alert: %w", err)
	}

	return &a, nil
}

func (r *AlertRepository) GetAll(ctx context.Context, limit, offset int, unreadOnly bool) ([]models.Alert, int, error) {
	countQuery := "SELECT COUNT(*) FROM alerts"
	dataQuery := `
		SELECT a.id, a.bin_id, a.alert_type, a.message, a.severity, a.is_read, a.created_at, b.name
		FROM alerts a 
		JOIN bins b ON a.bin_id = b.id
	`

	if unreadOnly {
		countQuery += " WHERE is_read = FALSE"
		dataQuery += " WHERE a.is_read = FALSE"
	}

	dataQuery += " ORDER BY a.created_at DESC LIMIT $1 OFFSET $2"

	var total int
	if err := r.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count alerts: %w", err)
	}

	rows, err := r.pool.Query(ctx, dataQuery, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		err := rows.Scan(
			&a.ID, &a.BinID, &a.AlertType, &a.Message, &a.Severity, &a.IsRead, &a.CreatedAt, &a.BinName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan alert: %w", err)
		}
		alerts = append(alerts, a)
	}

	return alerts, total, nil
}

func (r *AlertRepository) MarkAsRead(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, "UPDATE alerts SET is_read = TRUE WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("mark alert read: %w", err)
	}
	return nil
}

func (r *AlertRepository) CountUnread(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM alerts WHERE is_read = FALSE").Scan(&count)
	return count, err
}

func (r *AlertRepository) GetRecent(ctx context.Context, limit int) ([]models.Alert, error) {
	query := `
		SELECT a.id, a.bin_id, a.alert_type, a.message, a.severity, a.is_read, a.created_at, b.name
		FROM alerts a 
		JOIN bins b ON a.bin_id = b.id
		ORDER BY a.created_at DESC 
		LIMIT $1
	`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		err := rows.Scan(
			&a.ID, &a.BinID, &a.AlertType, &a.Message, &a.Severity, &a.IsRead, &a.CreatedAt, &a.BinName,
		)
		if err != nil {
			return nil, err
		}
		alerts = append(alerts, a)
	}

	return alerts, nil
}
