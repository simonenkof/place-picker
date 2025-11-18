package desks

import (
	"context"
	"database/sql"
	"encoding/json"
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

	TimeSlot struct {
		DateFrom time.Time `json:"dateFrom"`
		DateTo   time.Time `json:"dateTo"`
	}

	Desk struct {
		Id            string     `json:"id"`
		Name          string     `json:"name"`
		Reserved      bool       `json:"reserved"`
		CreatedAt     time.Time  `json:"createdAt"`
		UpdatedAt     time.Time  `json:"updatedAt"`
		ReservedSlots []TimeSlot `json:"reservedSlots"`
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
			d.created_at,
			d.updated_at,
			COALESCE(
				json_agg(
					CASE 
						WHEN r.id IS NOT NULL THEN 
							json_build_object(
								'dateFrom', r.date_from,
								'dateTo', r.date_to
							)
					END
				) FILTER (WHERE r.id IS NOT NULL),
				'[]'::json
			) AS reserved_slots
		FROM desks d
		LEFT JOIN reservations r ON d.id = r.desk_id
		GROUP BY d.id, d.name, d.created_at, d.updated_at
		ORDER BY d.created_at;
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("GetAllDesks | failed to query desks: %w", err)
	}
	defer rows.Close()

	var desks []Desk
	for rows.Next() {
		var (
			d         Desk
			slotsJSON []byte
		)

		if err := rows.Scan(&d.Id, &d.Name, &d.CreatedAt, &d.UpdatedAt, &slotsJSON); err != nil {
			return nil, fmt.Errorf("GetAllDesks | failed to scan row: %w", err)
		}

		if err := json.Unmarshal(slotsJSON, &d.ReservedSlots); err != nil {
			return nil, fmt.Errorf("GetAllDesks | failed to unmarshal reserved slots: %w", err)
		}

		d.Reserved = len(d.ReservedSlots) > 0

		desks = append(desks, d)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetAllDesks | rows iteration error: %w", err)
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

func (r *DesksRepository) CountDesks(ctx context.Context) (int, error) {
	query := `SELECT COUNT(*) FROM desks`

	var count int
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count desks: %w", err)
	}

	return count, nil
}
