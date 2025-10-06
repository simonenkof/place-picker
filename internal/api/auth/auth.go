package auth

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	user "place-picker/internal/db/repo/user"
	"place-picker/internal/jwt/tokens"
	"time"

	"github.com/gin-gonic/gin"
)

func registerHandler(c *gin.Context, repo *user.UserRepository) {
	var creds UserCreds

	if err := c.ShouldBindJSON(&creds); err != nil {
		slog.Error("RegisterHandler | Unable to parse the request", "error", err.Error())
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

	c.JSON(http.StatusCreated, gin.H{"message": "registration successful"})
}

func loginHandler(c *gin.Context, repo *user.UserRepository) {
	var creds UserCreds

	if err := c.ShouldBindJSON(&creds); err != nil {
		slog.Error("loginHandler | Unable to parse the request", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := repo.LoginUser(c.Request.Context(), creds.Email, creds.Password); err != nil {
		slog.Error("RegisterHandler | invalid credentials", "error", err.Error())
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	tokens, err := tokens.GenerateTokenPair(creds.Email)
	if err != nil {
		slog.Error("LoginHandler | token generating error", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create a token pair"})
		return
	}

	c.JSON(http.StatusOK, tokens)
}
