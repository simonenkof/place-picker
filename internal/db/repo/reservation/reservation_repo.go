package reservation

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"
)

type (
	ReservationsRepository struct {
		db *sql.DB
	}

	ReservationSlot struct {
		DateFrom time.Time `json:"dateFrom"`
		DateTo   time.Time `json:"dateTo"`
	}

	UserReservation struct {
		ReservationId string            `json:"reservationId"`
		TableId       string            `json:"tableId"`
		ReservedSlots []ReservationSlot `json:"reservedSlots"`
	}
)

func NewReservationsRepository(db *sql.DB) *ReservationsRepository {
	return &ReservationsRepository{db: db}
}

func (r *ReservationsRepository) CreateReservation(ctx context.Context, deskId, userId string, dateFrom, dateTo time.Time) error {
	query := `
		INSERT INTO reservations (desk_id, user_id, date_from, date_to)
		VALUES ($1, $2, $3, $4)
	`

	_, err := r.db.ExecContext(ctx, query, deskId, userId, dateFrom, dateTo)
	if err != nil {
		var pqErr *pq.Error
		if ok := errors.As(err, &pqErr); ok {
			switch pqErr.Constraint {
			case "one_desk_per_user_per_period":
				return fmt.Errorf("this user already has a reservation for this period")
			case "one_reservation_per_desk_per_period":
				return fmt.Errorf("this desk is already reserved for this period")
			}
		}

		return err
	}

	return nil
}

func (r *ReservationsRepository) GetUserReservations(ctx context.Context, userId string) ([]UserReservation, error) {
	query := `
		SELECT 
			id AS reservation_id,
			desk_id AS table_id,
			date_from,
			date_to
		FROM reservations
		WHERE user_id = $1
		ORDER BY date_from;
	`

	rows, err := r.db.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, fmt.Errorf("failed to query user reservations: %w", err)
	}
	defer rows.Close()

	var reservations []UserReservation
	for rows.Next() {
		var (
			reservationId string
			tableId       string
			dateFrom      time.Time
			dateTo        time.Time
		)

		if err := rows.Scan(&reservationId, &tableId, &dateFrom, &dateTo); err != nil {
			return nil, fmt.Errorf("failed to scan reservation: %w", err)
		}

		reservations = append(reservations, UserReservation{
			ReservationId: reservationId,
			TableId:       tableId,
			ReservedSlots: []ReservationSlot{
				{DateFrom: dateFrom, DateTo: dateTo},
			},
		})
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return reservations, nil
}

func (r *ReservationsRepository) DeleteReservation(ctx context.Context, reservationId, userId string) error {
	query := `
		DELETE FROM reservations
		WHERE id = $1 AND user_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, reservationId, userId)
	if err != nil {
		return fmt.Errorf("failed to delete reservation: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check delete result: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
