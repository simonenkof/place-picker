package desks

import (
	"log/slog"
	"net/http"
	desksRepo "place-picker/internal/db/repo/desks"

	"github.com/gin-gonic/gin"
)

type (
	DeskRequest struct {
		Desks []Desk `json:"desks"`
	}

	Desk struct {
		Name string `json:"name"`
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

	c.JSON(http.StatusCreated, gin.H{"message": "desks creating successful"})
}
