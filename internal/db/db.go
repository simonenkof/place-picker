package db

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

func MustConnectDB() (*sql.DB, error) {
	host := viper.GetString("db.host")
	port := viper.GetString("db.port")
	user := viper.GetString("db.user")
	password := viper.GetString("db.password")
	dbname := viper.GetString("db.name")
	sslmode := viper.GetString("db.sslmode")

	if err := createDbIfNotExists(host, port, user, password, sslmode, dbname); err != nil {
		return nil, fmt.Errorf("failed to ensure database exists: %w", err)
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open target db: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping target db: %w", err)
	}

	return db, nil
}

func createDbIfNotExists(host, port, user, password, sslmode, dbname string) error {
	systemDsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=postgres sslmode=%s",
		host, port, user, password, sslmode,
	)

	systemDB, err := sql.Open("postgres", systemDsn)
	if err != nil {
		return fmt.Errorf("failed to connect to admin db: %w", err)
	}
	defer systemDB.Close()

	var exists bool

	query := fmt.Sprintf("SELECT 1 FROM pg_database WHERE datname = '%s'", dbname)
	if err := systemDB.QueryRow(query).Scan(&exists); err != nil && err != sql.ErrNoRows {
		return err
	}

	if !exists {
		if _, err := systemDB.Exec(fmt.Sprintf("CREATE DATABASE \"%s\"", dbname)); err != nil {
			return fmt.Errorf("failed to create database %s: %w", dbname, err)
		}
	}

	return nil
}
