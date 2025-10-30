package db

import (
	"database/sql"
	"log"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func ApplyMigrations(conn *sql.DB) {
	driver, err := postgres.WithInstance(conn, &postgres.Config{})
	if err != nil {
		log.Fatal(err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"postgres",
		driver,
	)
	if err != nil {
		slog.Error("ApplyMigrations | DB instance error", "error", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		slog.Error("ApplyMigrations | Migrations apply error", "error", err)
	}

	slog.Info("ApplyMigrations | Migrations applyed")
}