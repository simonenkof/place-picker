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
)

func NewReservationsRepository(db *sql.DB) *ReservationsRepository {
	return &ReservationsRepository{db: db}
}

func (r *ReservationsRepository) CreateReservation(ctx context.Context, deskID, userID string, dateFrom, dateTo time.Time) error {
	query := `
		INSERT INTO reservations (desk_id, user_id, date_from, date_to)
		VALUES ($1, $2, $3, $4)
	`

	_, err := r.db.ExecContext(ctx, query, deskID, userID, dateFrom, dateTo)
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
