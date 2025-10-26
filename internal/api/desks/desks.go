package desks

import (
	"database/sql"
	"errors"
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

func LoadDesksHandler(c *gin.Context, repo *desksRepo.DesksRepository) {
	var desksReq DeskRequest

	if err := c.ShouldBindJSON(&desksReq); err != nil {
		slog.Error("LoadDesksHandler | Unable to parse the request", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	deskNames := make([]string, 0, len(desksReq.Desks))
	for _, d := range desksReq.Desks {
		deskNames = append(deskNames, d.Name)
	}

	if err := repo.CreateDesks(c.Request.Context(), deskNames); err != nil {
		slog.Error("LoadDesksHandler | Unable to create desks", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to create desks"})
		return
	}

	slog.Info("LoadDesksHandler | desks creating successful")
	c.JSON(http.StatusCreated, gin.H{"message": "desks creating successful"})
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
	deskID := c.Param("id")

	if deskID == "" {
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

	if err := repo.UpdateDeskName(c.Request.Context(), deskID, req.Name); err != nil {
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
	deskID := c.Param("id")

	if deskID == "" {
		slog.Error("DeleteDeskHandler | Desk id is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "desk id is required"})
		return
	}

	if err := repo.DeleteDesk(c.Request.Context(), deskID); err != nil {
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
