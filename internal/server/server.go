package server

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"place-picker/internal/api/auth"
	"place-picker/internal/config"
	"time"

	"github.com/gin-gonic/gin"
)

// Запускает HTTP сервер. При завершении переданного контекста мягко завершает работу HTTP сервера.
func NewHTTPServer(ctx context.Context, logger *slog.Logger, config config.HTTPServer, db *sql.DB) {
	srv := newHTTPServerInstance(logger, config, db)

	go func() {
		logger.Info("NewHTTPServer | server start", "port", config.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("NewHTTPServer | ListenAndServe error", "error", err)
		}
	}()

	<-ctx.Done()
	stopServer(srv, logger)
}

// Останавливает работу сервера.
func stopServer(srv *http.Server, logger *slog.Logger) {
	ctxTimeout, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	logger.Info("stopServer | Shutting down server...")
	if err := srv.Shutdown(ctxTimeout); err != nil {
		logger.Error("stopServer | Server shutdown error.", "error", err)
	}

	logger.Info("stopServer | Server shutdown gracefully.")
}

// Создает HTTP сервер с переданной конфигурацией и возвращает его.
func newHTTPServerInstance(logger *slog.Logger, serverConfig config.HTTPServer, db *sql.DB) *http.Server {
	router := setupRouter(logger, auth.New(db))

	if config.IsProdMode() {
		gin.SetMode(gin.ReleaseMode)
	}

	return &http.Server{
		Addr:         serverConfig.Port, // порт должен быть с :, например :8000
		Handler:      router,
		ReadTimeout:  serverConfig.ReadTimeout,
		WriteTimeout: serverConfig.WriteTimeout,
	}
}
