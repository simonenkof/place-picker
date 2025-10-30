package logger

import (
	"io"
	"log"
	"log/slog"
	"os"

	"gopkg.in/natefinch/lumberjack.v2"
)

const (
	DevMode  = "dev"
	ProdMode = "prod"
	TestMode = "test"
)

// SetupLogger настраивает глобальный логгер в зависимости от режима работы (dev, prod, test).
// Использует ротацию файлов (lumberjack).
// Устанавливает slog в качестве логгера по умолчанию.
func MustSetupLogger(logsPath, mode string) *slog.Logger {
	logFile := &lumberjack.Logger{
		Filename: logsPath,
		MaxSize:  10,
	}

	var handler slog.Handler

	switch mode {
	case TestMode:
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
	case DevMode:
		handler = slog.NewTextHandler(io.MultiWriter(os.Stdout, logFile), &slog.HandlerOptions{Level: slog.LevelDebug})
	case ProdMode:
		handler = slog.NewJSONHandler(io.MultiWriter(os.Stdout, logFile), &slog.HandlerOptions{Level: slog.LevelInfo})
	default:
		log.Panic("MustSetupLogger | service mode (dev/prod/test) could not be determined")
	}

	logger := slog.New(handler)
	slog.SetDefault(logger)

	return logger
}
