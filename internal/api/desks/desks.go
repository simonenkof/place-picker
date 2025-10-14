package desks

import (
	"log/slog"
	"net/http"
	desksRepo "place-picker/internal/db/repo/desks"
	"place-picker/internal/parser"

	"github.com/gin-gonic/gin"
)

func LoadDesksHandler(c *gin.Context, repo *desksRepo.DesksRepository) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		slog.Error("LoadDesksHandler | File is required", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	parsed, err := parser.ParseDesksFile(fileHeader)
	if err != nil {
		slog.Error("LoadDesksHandler | Parse failed", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Здесь будет логика сохранения столов в базу

	c.JSON(http.StatusOK, gin.H{
		"status":       "parsed",
		"zones_count":  len(parsed.Zones),
		"example_zone": parsed.Zones[0].Name,
	})
}
