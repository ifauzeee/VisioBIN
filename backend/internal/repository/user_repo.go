package repository

import (
	"context"
	"fmt"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at
		FROM users 
		WHERE username = $1
	`

	var u models.User
	err := r.pool.QueryRow(ctx, query, username).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.FullName,
		&u.Role, &u.FCMToken, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at
		FROM users 
		WHERE id = $1
	`

	var u models.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.FullName,
		&u.Role, &u.FCMToken, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &u, nil
}

func (r *UserRepository) Create(ctx context.Context, username, email, passwordHash, fullName, role string) (*models.User, error) {
	if role == "" {
		role = "operator"
	}

	query := `
		INSERT INTO users (username, email, password_hash, full_name, role)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at
	`

	var u models.User
	err := r.pool.QueryRow(ctx, query, username, email, passwordHash, fullName, role).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.FullName,
		&u.Role, &u.FCMToken, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return &u, nil
}

func (r *UserRepository) UpdateFCMToken(ctx context.Context, userID, token string) error {
	query := "UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2"
	if _, err := r.pool.Exec(ctx, query, token, userID); err != nil {
		return fmt.Errorf("update fcm token: %w", err)
	}
	return nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, userID, fullName, email, passwordHash string) error {
	var query string
	var err error
	if passwordHash != "" {
		query = "UPDATE users SET full_name = $1, email = $2, password_hash = $3, updated_at = NOW() WHERE id = $4"
		_, err = r.pool.Exec(ctx, query, fullName, email, passwordHash, userID)
	} else {
		query = "UPDATE users SET full_name = $1, email = $2, updated_at = NOW() WHERE id = $3"
		_, err = r.pool.Exec(ctx, query, fullName, email, userID)
	}

	if err != nil {
		return fmt.Errorf("update profile: %w", err)
	}
	return nil
}

func (r *UserRepository) GetOperators(ctx context.Context) ([]models.User, error) {
	query := `
		SELECT id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at
		FROM users 
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.FullName,
			&u.Role, &u.FCMToken, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, nil
}

// GetAllFCMTokens mengembalikan semua FCM token dari operator dan admin yang terdaftar.
// Digunakan oleh NotificationService untuk broadcast alert ke semua petugas.
func (r *UserRepository) GetAllFCMTokens(ctx context.Context) ([]string, error) {
	query := `
		SELECT fcm_token
		FROM users 
		WHERE role IN ('operator', 'admin', 'technician') 
		  AND fcm_token IS NOT NULL 
		  AND fcm_token != ''
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get fcm tokens: %w", err)
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var token string
		if err := rows.Scan(&token); err != nil {
			continue
		}
		tokens = append(tokens, token)
	}

	return tokens, nil
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM users WHERE id = $1"
	if _, err := r.pool.Exec(ctx, query, id); err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	return nil
}
