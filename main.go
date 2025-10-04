package main

import (
	"context"
	"log"
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
		log.Fatal("main | Unable to create database connection")
	}
	defer conn.Close()

	db.ApplyMigrations(conn)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	server.NewHTTPServer(ctx, slogLogger, config.HTTPServer)
}