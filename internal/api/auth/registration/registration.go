package registration

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	user "place-picker/internal/db/repo/user"
	"time"

	"github.com/gin-gonic/gin"
)

type UserCreds struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" bindung:"required,min=6"`
}

func RegisterHandler(c *gin.Context, repo *user.UserRepository) {
	var creds UserCreds

	if err := c.ShouldBindJSON(&creds); err != nil {
		slog.Error("RegisterHandler | Unable to parse the request")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	if err := repo.RegisterUser(ctx, creds.Email, creds.Password, "user"); err != nil {
		switch {
		case errors.Is(err, user.ErrUserAlreadyExists):
			slog.Error("RegisterHandler | User exist", "error", err.Error())
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			slog.Error("RegisterHandler | Something went wrong", "error", err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
}
