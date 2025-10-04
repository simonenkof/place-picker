package main

import (
	"log"
	"place-picker/internal/config"
	"place-picker/internal/db"
	"place-picker/internal/logger"
)

func main() {
	config := config.MustLoadConfig()
	logger.MustSetupLogger(config.LogsPath, config.Mode)

	conn, err := db.MustConnectDB()
	if err != nil {
		log.Fatal("main | Unable to create database connection")
	}
	defer conn.Close()

	db.ApplyMigrations(conn)
}