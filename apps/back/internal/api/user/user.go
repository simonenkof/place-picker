package user

import (
	"context"
	"log/slog"
	"net/http"
	userRepo "place-picker/internal/db/repo/user"
	"time"

	"github.com/gin-gonic/gin"
)

func meHandler(c *gin.Context, repo *userRepo.UserRepository) {
	userID, exists := c.Get("userId")
	if !exists {
		slog.Error("meHandler | userId not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		slog.Error("meHandler | userId is not a string")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	user, err := repo.GetUserByID(ctx, userIDStr)
	if err != nil {
		slog.Error("meHandler | Failed to get user", "error", err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
