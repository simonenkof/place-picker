package user_repo

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var ErrUserAlreadyExists = errors.New("user with this email already exists")

type User struct {
	Id           int
	Email        string
	PasswordHash string
	Role         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) RegisterUser(ctx context.Context, email string, password string, role string) error {
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`
	if err := r.db.QueryRowContext(ctx, checkQuery, email).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return ErrUserAlreadyExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	insertQuery := `
		INSERT INTO users (email, password_hash, role)
		VALUES ($1, $2, $3)
	`
	_, err = r.db.ExecContext(ctx, insertQuery, email, string(hash), role)
	if err != nil {
		return err
	}

	return nil
}
