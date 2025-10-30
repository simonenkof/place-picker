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
		DeskId   string `json:"deskId" binding:"required"`
		DateFrom string `json:"dateFrom" binding:"required"`
		DateTo   string `json:"dateTo" binding:"required"`
	}

	ReservationsPayload struct {
		Reservations []reservationsRepo.UserReservation `json:"reservations"`
	}
)

func New(db *sql.DB) *Reservation {
	return &Reservation{ReservationsRepo: reservationsRepo.NewReservationsRepository(db)}
}

func (d *Reservation) RegisterPublicRoutes(r *gin.RouterGroup) {}

func (d *Reservation) RegisterPrivateRoutes(r *gin.RouterGroup) {
	r.POST("/reservation", func(c *gin.Context) { ReserveDesk(c, d.ReservationsRepo) })
	r.GET("/reservation", func(c *gin.Context) { GetUserReservationsHandler(c, d.ReservationsRepo) })
	r.DELETE("/reservation/:id", func(c *gin.Context) { DeleteReservationHandler(c, d.ReservationsRepo) })
	r.DELETE("/reservation/all", func(c *gin.Context) { DeleteAllUserReservationsHandler(c, d.ReservationsRepo) })
}
