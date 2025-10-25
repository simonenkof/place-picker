package tokens

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// Создает пару токенов.
// - creds - Учетные данные пользователя, для которого создаются токены.
func GenerateTokenPair(userId, email string) (TokenPair, error) {
	var tokenPair TokenPair

	accessToken, err := generateToken(userId, email, 15*time.Minute)
	if err != nil {
		return tokenPair, fmt.Errorf("GenerateTokenPair | Could not generate access token. %v", err)
	}

	refreshToken, err := generateToken(userId, email, 7*24*time.Hour)
	if err != nil {
		return tokenPair, fmt.Errorf("GenerateTokenPair | Could not generate refresh token %v", err)
	}

	tokenPair.AccessToken = accessToken
	tokenPair.RefreshToken = refreshToken

	slog.Info("GenerateTokenPair | Generate access and refresh tokens", "userId", userId, "email", email)

	return tokenPair, nil
}

// Создает токен.
// - email - email пользователя.
// - expiry - время до сгорания токена.
func generateToken(userId, email string, expiry time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"userId": userId,
		"sub":    email,
		"exp":    time.Now().Add(expiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(viper.GetString("jwt.secret")))
	if err != nil {
		return "", fmt.Errorf("GenerateTokenPair | Could not sign token")
	}

	return tokenString, nil
}

func GetTokenFromString(refreshToken string) (*jwt.Token, error) {
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (any, error) {
		return []byte(viper.GetString("jwt.secret")), nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("GetTokenFromString | Failed to decrypt the refresh token")
	}

	return token, nil
}
