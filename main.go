package main

import (
	"context"
	"place-picker/internal/config"
	"place-picker/internal/db"
	"place-picker/internal/logger"
	"place-picker/internal/server"
)

func main() {
	config := config.MustLoadConfig()
	slogLogger := logger.MustSetupLogger(config.LogsPath, config.Mode)

	conn, err := db.MustConnectDB()
	if err != nil {
		slogLogger.Error("main | Unable to create database connection", "error", err.Error())
		panic("")
	}
	defer conn.Close()

	db.ApplyMigrations(conn)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	server.NewHTTPServer(ctx, slogLogger, config.HTTPServer, conn)
}
