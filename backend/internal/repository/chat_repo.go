package repository

import (
	"context"
	"fmt"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ChatRepository struct {
	pool *pgxpool.Pool
}

func NewChatRepository(pool *pgxpool.Pool) *ChatRepository {
	return &ChatRepository{pool: pool}
}

func (r *ChatRepository) CreateMessage(ctx context.Context, senderID string, recipientID *string, content string) (*models.ChatMessage, error) {
	query := `
		INSERT INTO chat_messages (sender_id, recipient_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, sender_id, recipient_id, content, created_at
	`

	var msg models.ChatMessage
	err := r.pool.QueryRow(ctx, query, senderID, recipientID, content).Scan(
		&msg.ID, &msg.SenderID, &msg.RecipientID, &msg.Content, &msg.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create message: %w", err)
	}

	return &msg, nil
}

func (r *ChatRepository) GetRecentMessages(ctx context.Context, limit int, userID, otherID string) ([]models.ChatMessage, error) {
	var query string
	var args []interface{}

	if otherID == "" {
		// General chat (recipient_id IS NULL)
		query = `
			SELECT m.id, m.sender_id, m.recipient_id, m.content, m.created_at, u.full_name as sender_name, u.role as sender_role
			FROM chat_messages m
			JOIN users u ON m.sender_id = u.id
			WHERE m.recipient_id IS NULL
			ORDER BY m.created_at DESC
			LIMIT $1
		`
		args = append(args, limit)
	} else {
		// Private chat between userID and otherID
		query = `
			SELECT m.id, m.sender_id, m.recipient_id, m.content, m.created_at, u.full_name as sender_name, u.role as sender_role
			FROM chat_messages m
			JOIN users u ON m.sender_id = u.id
			WHERE (m.sender_id = $1 AND m.recipient_id = $2)
			   OR (m.sender_id = $2 AND m.recipient_id = $1)
			ORDER BY m.created_at DESC
			LIMIT $3
		`
		args = append(args, userID, otherID, limit)
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("get messages: %w", err)
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var m models.ChatMessage
		err := rows.Scan(
			&m.ID, &m.SenderID, &m.RecipientID, &m.Content, &m.CreatedAt, &m.SenderName, &m.SenderRole,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}

	// Chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}
