package desks

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	desksRepo "place-picker/internal/db/repo/desks"
	"strings"

	"github.com/gin-gonic/gin"
)

type (
	DeskRequest struct {
		Desks []Desk `json:"desks"`
	}

	Desk struct {
		Name string `json:"name"`
	}

	UpdateDeskRequest struct {
		Name string `json:"name" binding:"required"`
	}
)

const requiredDesksCount = 39

func InitializeDesks(ctx context.Context, logger *slog.Logger, repo *desksRepo.DesksRepository) error {
	count, err := repo.CountDesks(ctx)
	if err != nil {
		logger.Error("InitializeDesks | Unable to count desks", "error", err.Error())
		return fmt.Errorf("unable to count desks: %w", err)
	}

	if count == requiredDesksCount {
		logger.Info("InitializeDesks | Desks already exist", "count", count)
		return nil
	}

	logger.Info("InitializeDesks | Initializing desks", "current_count", count, "required_count", requiredDesksCount)

	deskNames := make([]string, 0, requiredDesksCount)
	for i := 1; i <= requiredDesksCount; i++ {
		deskNames = append(deskNames, fmt.Sprintf("A-%02d", i))
	}

	if err := repo.CreateDesks(ctx, deskNames); err != nil {
		logger.Error("InitializeDesks | Unable to create desks", "error", err.Error())
		return fmt.Errorf("unable to create desks: %w", err)
	}

	logger.Info("InitializeDesks | Desks initialized successfully", "count", len(deskNames))
	return nil
}

func LoadDesksHandler(c *gin.Context, repo *desksRepo.DesksRepository) {
	if err := InitializeDesks(c.Request.Context(), slog.Default(), repo); err != nil {
		slog.Error("LoadDesksHandler | Unable to initialize desks", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to initialize desks"})
		return
	}

	count, err := repo.CountDesks(c.Request.Context())
	if err != nil {
		slog.Error("LoadDesksHandler | Unable to count desks", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to count desks"})
		return
	}

	slog.Info("LoadDesksHandler | Desks initialized successfully", "count", count)
	c.JSON(http.StatusOK, gin.H{"message": "desks initialized successfully", "count": count})
}

func GetDesksHandler(c *gin.Context, repo *desksRepo.DesksRepository) {
	desks, err := repo.GetAllDesks(c.Request.Context())
	if err != nil {
		slog.Error("GetDesksHandler | Unable to get desks", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load desks"})
		return
	}

	slog.Info("GetDesksHandler | Desks get successful")
	c.JSON(http.StatusOK, AllDesksPayload{Desks: desks})
}

func ChangeDeskName(c *gin.Context, repo *desksRepo.DesksRepository) {
	deskId := c.Param("id")

	if deskId == "" {
		slog.Error("ChangeDeskName | Desk id is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "desk id is required"})
		return
	}

	var req UpdateDeskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("ChangeDeskName | Unable parse request body", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := repo.UpdateDeskName(c.Request.Context(), deskId, req.Name); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			slog.Error("ChangeDeskName | Desk not found", "error", err.Error())
			c.JSON(http.StatusNotFound, gin.H{"error": "desk not found"})
			return
		}
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "desk name must be unique"})
			return
		}

		slog.Error("ChangeDeskName | Failed to update desk", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update desk"})
		return
	}

	slog.Info("ChangeDeskName | Desk updated successful")
	c.JSON(http.StatusOK, gin.H{"message": "desk updated successfully"})
}

func DeleteDeskHandler(c *gin.Context, repo *desksRepo.DesksRepository) {
	deskId := c.Param("id")

	if deskId == "" {
		slog.Error("DeleteDeskHandler | Desk id is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "desk id is required"})
		return
	}

	if err := repo.DeleteDesk(c.Request.Context(), deskId); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			slog.Error("DeleteDeskHandler | Desk not found", "error", err.Error())
			c.JSON(http.StatusNotFound, gin.H{"error": "desk not found"})
			return
		}

		slog.Error("DeleteDeskHandler | Failed to delete desk", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete desk"})
		return
	}

	slog.Info("DeleteDeskHandler | Desk deleted successful")
	c.JSON(http.StatusOK, gin.H{"message": "desk deleted successfully"})
}
