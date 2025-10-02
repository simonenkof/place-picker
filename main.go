package main

import (
	"log/slog"
	"place-picker/internal/config"
	"place-picker/internal/logger"
)

func main() {
	config := config.MustLoadConfig()
	logger.MustSetupLogger(config.LogsPath, config.Mode)
	slog.Info("logger test")
}