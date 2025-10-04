package cors

import (
	"time"

	"github.com/gin-contrib/cors"
)

// Возвращает настроенный CORS.
func ConfigureCORS() cors.Config {
	return cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
		MaxAge:       12 * time.Hour,
	}
}
