package reservation

import (
	"database/sql"

	"github.com/gin-gonic/gin"

	reservationsRepo "place-picker/internal/db/repo/reservation"
)

type (
	Reservation struct {
		ReservationsRepo *reservationsRepo.ReservationsRepository
	}

	CreateReservationRequest struct {
		DateFrom string `json:"dateFrom" binding:"required"`
		DateTo   string `json:"dateTo" binding:"required"`
	}
)

func New(db *sql.DB) *Reservation {
	return &Reservation{ReservationsRepo: reservationsRepo.NewReservationsRepository(db)}
}

func (d *Reservation) RegisterPublicRoutes(r *gin.RouterGroup) {}

func (d *Reservation) RegisterPrivateRoutes(r *gin.RouterGroup) {
	r.POST("/reservation/:id", func(c *gin.Context) { ReserveDesk(c, d.ReservationsRepo) })
}
