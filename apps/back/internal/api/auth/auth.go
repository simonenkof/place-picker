package auth

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"place-picker/internal/config"
	user "place-picker/internal/db/repo/user"
	"place-picker/internal/jwt/tokens"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

func registerHandler(c *gin.Context, repo *user.UserRepository) {
	var creds RegisterCreds

	if err := c.ShouldBindJSON(&creds); err != nil {
		slog.Error("registerHandler | Unable to parse the request", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	if err := repo.RegisterUser(ctx, creds.Name, creds.Email, creds.Password, "user"); err != nil {
		switch {
		case errors.Is(err, user.ErrUserAlreadyExists):
			slog.Error("registerHandler | User exist", "error", err.Error())
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			slog.Error("registerHandler | Something went wrong", "error", err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "email verification sent"})
}

func loginHandler(c *gin.Context, repo *user.UserRepository) {
	var creds UserCreds

	if err := c.ShouldBindJSON(&creds); err != nil {
		slog.Error("loginHandler | Unable to parse request body", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	userId, err := repo.LoginUser(c.Request.Context(), creds.Email, creds.Password)
	if err != nil {
		slog.Error("loginHandler | invalid credentials", "error", err.Error())
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	tokens, err := tokens.GenerateTokenPair(userId, creds.Email)
	if err != nil {
		slog.Error("loginHandler | token generating error", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token pair"})
		return
	}

	c.JSON(http.StatusOK, tokens)
}

func refreshHandler(c *gin.Context) {
	var payload RefreshToken

	if err := c.BindJSON(&payload); err != nil {
		slog.Error("refreshHandler | Unable to parse the request", "error", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	token, err := tokens.GetTokenFromString(payload.RefreshToken)
	if err != nil {
		slog.Error("refreshHandler | Invalid refresh token", "error", err.Error())
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		slog.Error("refreshHandler | Invalid token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	email, ok := claims["sub"].(string)
	if !ok {
		slog.Error("refreshHandler | Invalid email in token")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email in token"})
		return
	}

	userId, ok := claims["userId"].(string)
	if !ok {
		slog.Error("refreshHandler | Invalid userId in token")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid userId in token"})
		return
	}

	tokens, err := tokens.GenerateTokenPair(userId, email)
	if err != nil {
		slog.Error("refreshHandler | Failed to create a token pair", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create a token pair"})
		return
	}

	slog.Info("refreshHandler | Refresh tokens")
	c.JSON(http.StatusOK, tokens)
}

func verifyEmailHandler(c *gin.Context, repo *user.UserRepository) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing token"})
		return
	}

	err := repo.VerifyUserEmail(c.Request.Context(), token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			frontendURL := getFrontendURL()
			c.Redirect(http.StatusFound, frontendURL+"/verify-email?error=invalid_or_expired_token")
			return
		}
		frontendURL := getFrontendURL()
		c.Redirect(http.StatusFound, frontendURL+"/verify-email?error=failed_to_verify")
		return
	}

	frontendURL := getFrontendURL()
	c.Redirect(http.StatusFound, frontendURL+"/verify-email?token="+token)
}

func getFrontendURL() string {
	if config.IsProdMode() {
		return viper.GetString("domain")
	}
	return viper.GetString("dev_frontend_url")
}
