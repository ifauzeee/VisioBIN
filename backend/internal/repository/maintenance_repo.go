package repository

import (
	"context"
	"fmt"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MaintenanceRepository struct {
	pool *pgxpool.Pool
}

func NewMaintenanceRepository(pool *pgxpool.Pool) *MaintenanceRepository {
	return &MaintenanceRepository{pool: pool}
}

func (r *MaintenanceRepository) Create(ctx context.Context, req *models.CreateMaintenanceLogRequest, userID string) (*models.MaintenanceLog, error) {
	query := `
		INSERT INTO maintenance_logs (bin_id, action_type, notes, performed_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, bin_id, action_type, notes, performed_by, performed_at
	`

	var log models.MaintenanceLog
	err := r.pool.QueryRow(ctx, query, req.BinID, req.ActionType, req.Notes, userID).Scan(
		&log.ID, &log.BinID, &log.ActionType, &log.Notes, &log.PerformedBy, &log.PerformedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create maintenance log: %w", err)
	}

	return &log, nil
}

func (r *MaintenanceRepository) GetAll(ctx context.Context, binID string, limit, offset int) ([]models.MaintenanceLog, int, error) {
	countQuery := "SELECT COUNT(*) FROM maintenance_logs"
	dataQuery := `
		SELECT m.id, m.bin_id, m.action_type, m.notes, m.performed_by, m.performed_at,
		       b.name AS bin_name, COALESCE(u.full_name, '') AS performer_name
		FROM maintenance_logs m
		JOIN bins b ON m.bin_id = b.id
		LEFT JOIN users u ON m.performed_by = u.id
	`

	args := []interface{}{}
	argIdx := 1

	if binID != "" {
		countQuery += fmt.Sprintf(" WHERE bin_id = $%d", argIdx)
		dataQuery += fmt.Sprintf(" WHERE m.bin_id = $%d", argIdx)
		args = append(args, binID)
		argIdx++
	}

	dataQuery += fmt.Sprintf(" ORDER BY m.performed_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)

	var total int
	if len(args) > 0 {
		if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
			return nil, 0, fmt.Errorf("count maintenance logs: %w", err)
		}
	} else {
		if err := r.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
			return nil, 0, fmt.Errorf("count maintenance logs: %w", err)
		}
	}

	queryArgs := append(args, limit, offset)
	rows, err := r.pool.Query(ctx, dataQuery, queryArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("query maintenance logs: %w", err)
	}
	defer rows.Close()

	var logs []models.MaintenanceLog
	for rows.Next() {
		var log models.MaintenanceLog
		err := rows.Scan(
			&log.ID, &log.BinID, &log.ActionType, &log.Notes, &log.PerformedBy,
			&log.PerformedAt, &log.BinName, &log.PerformerName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan maintenance log: %w", err)
		}
		logs = append(logs, log)
	}

	return logs, total, nil
}

func (r *MaintenanceRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM maintenance_logs WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete maintenance log: %w", err)
	}
	return nil
}
