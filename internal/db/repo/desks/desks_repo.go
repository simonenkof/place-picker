package desks

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"
)

type (
	DesksRepository struct {
		db *sql.DB
	}

	Desk struct {
		Id   int
		Name string
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

	query := `INSERT INTO desks (name, reserved) VALUES ($1, $2)`

	for _, name := range desks {
		if _, err := tx.ExecContext(ctx, query, name, false); err != nil {
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
