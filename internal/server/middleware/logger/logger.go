package logger

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// Возвращает мидлвар для логировния в slog.
func SlogLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		userID, exists := c.Get("userId")
		if !exists {
			userID = "unknown"
		}

		logger.Info("HTTP request",
			slog.String("userId", userID.(string)),
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.String("query", c.Request.URL.RawQuery),
			slog.Int("status", c.Writer.Status()),
			slog.Duration("duration", time.Since(start)),
			slog.String("ip", c.ClientIP()),
			slog.String("user-agent", c.Request.UserAgent()),
		)
	}
}
