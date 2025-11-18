package mail

import (
	"fmt"
	"log/slog"
	"strconv"

	"github.com/spf13/viper"
	"gopkg.in/gomail.v2"
)

func SendVerificationEmail(email, token string) error {
	user := viper.GetString("mail.user")
	password := viper.GetString("mail.password")
	portStr := viper.GetString("smtp.port")
	domain := viper.GetString("domain")
	provider := viper.GetString("smtp.provider")

	if user == "" || password == "" || portStr == "" || domain == "" || provider == "" {
		return fmt.Errorf("SendVerificationEmail | one or more required configuration variables are missing")
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return fmt.Errorf("SendVerificationEmail | invalid SMTP port: %v", err)
	}

	m := gomail.NewMessage()
	m.SetHeader("From", user)
	m.SetHeader("To", email)
	m.SetHeader("Subject", "Подтверждение регистрации")
	m.SetBody("text/html", fmt.Sprintf(`
		<h2>Добро пожаловать в Place Picker!</h2>
		<p>Нажмите на ссылку ниже, чтобы подтвердить ваш email и начать использовать сервис:</p>
		<a href="%s/api/auth/verify?token=%s">Подтвердить регистрацию</a>
	`, domain, token))

	d := gomail.NewDialer(provider, port, user, password)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send verification email: %v", err)
	}

	slog.Info("SendVerificationEmail | Send email verification")

	return nil
}
