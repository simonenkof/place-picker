package desks

import (
	"database/sql"
)

type DesksRepository struct {
	db *sql.DB
}

func NewDesksRepository(db *sql.DB) *DesksRepository {
	return &DesksRepository{db: db}
}
