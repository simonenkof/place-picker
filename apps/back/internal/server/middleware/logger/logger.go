package middleware

import (
	"bytes"
	"io"
	"log/slog"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Статические расширения файлов, которые не нужно логировать
var staticExtensions = map[string]bool{
	".css":  true,
	".js":   true,
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".gif":  true,
	".svg":  true,
	".ico":  true,
	".woff": true,
	".woff2": true,
	".ttf":  true,
	".eot":  true,
	".otf":  true,
	".map":  true,
	".json": true,
	".xml":  true,
	".txt":  true,
	".pdf":  true,
	".zip":  true,
}

func SlogLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Пропускаем логирование для статических файлов и запросов к фронтенду (не API)
		if shouldSkipLogging(c.Request.URL.Path) {
			c.Next()
			return
		}

		start := time.Now()

		var requestBody []byte
		if c.Request.Body != nil {
			bodyBytes, err := io.ReadAll(c.Request.Body)
			if err == nil {
				requestBody = bodyBytes
				c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			}
		}

		respBody := &bytes.Buffer{}
		writer := &bodyLogWriter{body: respBody, ResponseWriter: c.Writer}
		c.Writer = writer

		c.Next()

		duration := time.Since(start)
		status := c.Writer.Status()

		userID := "unknown"
		if val, exists := c.Get("userId"); exists {
			if idStr, ok := val.(string); ok {
				userID = idStr
			}
		}

		const maxLogBody = 5 * 1024
		reqBodyStr := truncate(string(requestBody), maxLogBody)
		respBodyStr := truncate(respBody.String(), maxLogBody)

		var logFunc func(msg string, args ...any)
		switch {
		case status >= 500:
			logFunc = logger.Error
		case status >= 400:
			logFunc = logger.Warn
		default:
			logFunc = logger.Info
		}

		logFunc("HTTP request",
			slog.String("userId", userID),
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.String("query", c.Request.URL.RawQuery),
			slog.Int("status", status),
			slog.Duration("duration", duration),
			slog.String("ip", c.ClientIP()),
			slog.String("user-agent", c.Request.UserAgent()),
			slog.String("requestBody", reqBodyStr),
			slog.String("responseBody", respBodyStr),
		)
	}
}

// shouldSkipLogging проверяет, нужно ли пропустить логирование для данного пути
func shouldSkipLogging(path string) bool {
	// Логируем все API запросы
	if strings.HasPrefix(path, "/api") {
		return false
	}

	// Пропускаем логирование для статических файлов
	ext := strings.ToLower(filepath.Ext(path))
	if staticExtensions[ext] {
		return true
	}

	// Пропускаем логирование для всех остальных запросов (фронтенд)
	return true
}

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func truncate(s string, max int) string {
	if len(s) > max {
		return s[:max] + "...(truncated)"
	}
	return s
}
