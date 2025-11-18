package user_repo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"time"

	mailVerification "place-picker/internal/mail"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var ErrUserAlreadyExists = errors.New("user with this email already exists")
var ErrInvalidCredentials = errors.New("invalid email or password")

type User struct {
	Id           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"passwordHash"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) RegisterUser(ctx context.Context, name, email, password, role string) error {
	var exists bool
	err := r.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("user with email %s already exists", email)
	}

	token := uuid.NewString()
	expiresAt := time.Now().Add(24 * time.Hour)

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO users (name, email, password_hash, role, verification_token, verification_expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err = r.db.ExecContext(ctx, query, name, email, string(hash), role, token, expiresAt)
	if err != nil {
		return err
	}

	go func() {
		if err := mailVerification.SendVerificationEmail(email, token); err != nil {
			slog.Error("RegisterUser | Failed to send verification email", "error", err.Error(), "email", email)
		}
	}()

	return nil
}

func (r *UserRepository) LoginUser(ctx context.Context, email, password string) (string, error) {
	var storedHash string
	var userId string
	var isVerified bool

	query := `SELECT id, password_hash, is_verified FROM users WHERE email = $1`
	err := r.db.QueryRowContext(ctx, query, email).Scan(&userId, &storedHash, &isVerified)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrInvalidCredentials
		}
		return "", err
	}

	if !isVerified {
		return "", fmt.Errorf("email not verified")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	slog.Info("LoginUser | User creds are valid", "email", email, "userId", userId)
	return userId, nil
}

func (r *UserRepository) VerifyUserEmail(ctx context.Context, token string) error {
	query := `
		UPDATE users
		SET is_verified = true,
		    verification_token = NULL,
		    verification_expires_at = NULL,
		    updated_at = NOW()
		WHERE verification_token = $1
		  AND verification_expires_at > NOW()
		  AND is_verified = false
		RETURNING id
	`

	var id string
	err := r.db.QueryRowContext(ctx, query, token).Scan(&id)
	if err != nil {
		return sql.ErrNoRows
	}

	return nil
}

func (r *UserRepository) GetUserByID(ctx context.Context, userID string) (*User, error) {
	var user User
	query := `SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1`
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&user.Id,
		&user.Email,
		&user.Name,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	return &user, nil
}
