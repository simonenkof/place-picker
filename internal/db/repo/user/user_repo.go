package user_repo

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var ErrUserAlreadyExists = errors.New("user with this email already exists")
var ErrInvalidCredentials = errors.New("invalid email or password")

type User struct {
	Id           string
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

func (r *UserRepository) RegisterUser(ctx context.Context, email, password, role string) error {
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

	slog.Info("RegisterUser | User has been registered", "email", email)
	return nil
}

func (r *UserRepository) LoginUser(ctx context.Context, email, password string) (string, error) {
	var storedHash string
	var userID string

	query := `SELECT id, password_hash FROM users WHERE email = $1`
	err := r.db.QueryRowContext(ctx, query, email).Scan(&userID, &storedHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrInvalidCredentials
		}
		return "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	slog.Info("LoginUser | User creds are valid", "email", email, "userID", userID)
	return userID, nil
}
