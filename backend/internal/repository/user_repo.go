package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ifauze/visiobin/internal/models"
)

// UserRepository handles database operations for users.
type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

// GetByUsername finds a user by username.
func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `SELECT id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at
	          FROM users WHERE username = $1`

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

// GetByID finds a user by ID.
func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at
	          FROM users WHERE id = $1`

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

// Create inserts a new user.
func (r *UserRepository) Create(ctx context.Context, username, email, passwordHash, fullName string) (*models.User, error) {
	query := `INSERT INTO users (username, email, password_hash, full_name)
	          VALUES ($1, $2, $3, $4)
	          RETURNING id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at`

	var u models.User
	err := r.pool.QueryRow(ctx, query, username, email, passwordHash, fullName).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.FullName,
		&u.Role, &u.FCMToken, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &u, nil
}

// UpdateFCMToken updates the Firebase Cloud Messaging token for push notifications.
func (r *UserRepository) UpdateFCMToken(ctx context.Context, userID, token string) error {
	_, err := r.pool.Exec(ctx, "UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2", token, userID)
	if err != nil {
		return fmt.Errorf("update fcm token: %w", err)
	}
	return nil
}

// GetOperators returns all users with the operator role (for FCM notifications).
func (r *UserRepository) GetOperators(ctx context.Context) ([]models.User, error) {
	query := `SELECT id, username, email, password_hash, full_name, role, fcm_token, created_at, updated_at
	          FROM users WHERE role IN ('operator', 'admin') AND fcm_token IS NOT NULL`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.FullName,
			&u.Role, &u.FCMToken, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
