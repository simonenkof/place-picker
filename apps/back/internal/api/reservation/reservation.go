package reservation

import (
	"database/sql"
	"errors"
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
	dateFrom, err := time.Parse(layout, req.DateFrom)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dateFrom format"})
		return
	}

	dateTo, err := time.Parse(layout, req.DateTo)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dateTo format"})
		return
	}

	if dateTo.Before(dateFrom) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dateTo cannot be before dateFrom"})
		return
	}

	current := dateFrom
	for current.Before(dateTo) || current.Equal(dateTo) {
		dayStart := time.Date(current.Year(), current.Month(), current.Day(), dateFrom.Hour(), dateFrom.Minute(), 0, 0, current.Location())
		dayEnd := time.Date(current.Year(), current.Month(), current.Day(), dateTo.Hour(), dateTo.Minute(), 0, 0, current.Location())

		if dayStart.Hour() < 3 || dayEnd.Hour() > 18 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "reservation must be within working hours (08:00-21:00) UTC"})
			return
		}

		err := repo.CreateReservation(c.Request.Context(), req.DeskId, userId.(string), dayStart, dayEnd)
		if err != nil {
			slog.Error("ReserveDesk | Failed to create reservation", "error", err.Error())
			if strings.Contains(err.Error(), "already has a reservation") || strings.Contains(err.Error(), "already reserved") {
				c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create reservation"})
			return
		}

		current = current.AddDate(0, 0, 1)
	}

	slog.Info("ReserveDesk | Reservation created", "userId", userId.(string), "deskId", req.DeskId, "dateFrom", dateFrom, "dateTo", dateTo)
	c.JSON(http.StatusCreated, gin.H{"message": "reservations created successfully"})
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

func DeleteReservationHandler(c *gin.Context, repo *reservationsRepo.ReservationsRepository) {
	reservationId := c.Param("id")
	if reservationId == "" {
		slog.Error("DeleteReservationHandler | Reservation id is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing reservation id"})
		return
	}

	userId, exists := c.Get("userId")
	if !exists {
		slog.Error("DeleteReservationHandler | Failed to check user id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err := repo.DeleteReservation(c.Request.Context(), reservationId, userId.(string))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "reservation not found or not owned by user"})
			return
		}

		slog.Error("DeleteReservationHandler | Failed to delete reservation", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete reservation"})
		return
	}

	slog.Info("DeleteReservationHandler | Reservation deleted", "reservationId", reservationId, "userId", userId)
	c.JSON(http.StatusOK, gin.H{"message": "reservation deleted successfully"})
}

func DeleteAllUserReservationsHandler(c *gin.Context, repo *reservationsRepo.ReservationsRepository) {
	userId, exists := c.Get("userId")
	if !exists {
		slog.Error("DeleteAllUserReservationsHandler | Failed to check user id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err := repo.DeleteAllUserReservations(c.Request.Context(), userId.(string))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "no reservations found for user"})
			return
		}

		slog.Error("DeleteAllUserReservationsHandler | Failed to delete reservations", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user reservations"})
		return
	}

	slog.Info("DeleteAllUserReservationsHandler | All reservations deleted", "userId", userId)
	c.JSON(http.StatusOK, gin.H{"message": "all reservations deleted successfully"})
}
