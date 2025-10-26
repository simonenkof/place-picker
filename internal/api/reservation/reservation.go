package reservation

import (
	"log/slog"
	"net/http"
	reservationsRepo "place-picker/internal/db/repo/reservation"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func ReserveDesk(c *gin.Context, repo *reservationsRepo.ReservationsRepository) {
	userId, exists := c.Get("userId")
	if !exists {
		slog.Error("ReserveDesk | user id is required")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user id is required"})
		return
	}

	var req CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("ReserveDesk | Unable parse request body", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	const layout = "15:04 02.01.2006"
	dateFrom, _ := time.Parse(layout, req.DateFrom)
	dateTo, _ := time.Parse(layout, req.DateTo)

	err := repo.CreateReservation(c.Request.Context(), req.DeskId, userId.(string), dateFrom, dateTo)
	if err != nil {
		if strings.Contains(err.Error(), "already has a reservation") {
			slog.Error("ReserveDesk | Already has a reservation", "error", err.Error())
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}

		slog.Error("ReserveDesk | Failed to create reservation", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create reservation"})
		return
	}

	slog.Info("ReserveDesk | Reservation created", "userId", userId.(string), "deskId", req.DeskId, "dateFrom", dateFrom, "dateTo", dateTo)
	c.JSON(http.StatusCreated, gin.H{"message": "reservation created"})
}

func GetUserReservationsHandler(c *gin.Context, repo *reservationsRepo.ReservationsRepository) {
	userId, exists := c.Get("userId")
	if !exists {
		slog.Error("GetUserReservationsHandler | Failed to check user id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	reservations, err := repo.GetUserReservations(c.Request.Context(), userId.(string))
	if err != nil {
		slog.Error("GetUserReservationsHandler | Failed to load reservations", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load reservations"})
		return
	}

	c.JSON(http.StatusOK, ReservationsPayload{Reservations: reservations})
}
