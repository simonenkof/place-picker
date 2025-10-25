package desks

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
)

type (
	DesksRepository struct {
		db *sql.DB
	}

	Desk struct {
		Id        string
		Name      string
		Reserved  bool
		CreatedAt time.Time
		UpdatedAt time.Time
	}
)

func NewDesksRepository(db *sql.DB) *DesksRepository {
	return &DesksRepository{db: db}
}

func (r *DesksRepository) CreateDesks(ctx context.Context, desks []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()

	query := `INSERT INTO desks (name) VALUES ($1)`

	for _, name := range desks {
		if _, err := tx.ExecContext(ctx, query, name); err != nil {
			tx.Rollback()

			var pqErr *pq.Error
			if errors.As(err, &pqErr) {
				if pqErr.Code == "23505" {
					return fmt.Errorf("desk names must be unique: %s", pqErr.Constraint)
				}
			}

			return fmt.Errorf("failed to insert desk %q: %w", name, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *DesksRepository) GetAllDesks(ctx context.Context) ([]Desk, error) {
	query := `
		SELECT 
			d.id,
			d.name,
			CASE WHEN r.id IS NOT NULL THEN true ELSE false END AS reserved
		FROM desks d
		LEFT JOIN reservations r ON d.id = r.desk_id;
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query desks: %w", err)
	}
	defer rows.Close()

	var desks []Desk
	for rows.Next() {
		var d Desk
		if err := rows.Scan(&d.Id, &d.Name, &d.Reserved); err != nil {
			return nil, fmt.Errorf("failed to scan desk: %w", err)
		}
		desks = append(desks, d)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return desks, nil
}

func (r *DesksRepository) UpdateDeskName(ctx context.Context, id string, newName string) error {
	query := `UPDATE desks SET name = $1 WHERE id = $2`

	result, err := r.db.ExecContext(ctx, query, newName, id)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			return fmt.Errorf("desk name must be unique: %w", err)
		}
		return fmt.Errorf("failed to update desk: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *DesksRepository) DeleteDesk(ctx context.Context, id string) error {
	query := `DELETE FROM desks WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete desk: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
