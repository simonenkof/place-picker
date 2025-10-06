package auth

import (
	"database/sql"
	"place-picker/internal/api/auth/registration"
	user "place-picker/internal/db/repo/user"

	"github.com/gin-gonic/gin"
)

type Auth struct {
	UserRepo *user.UserRepository
}

func New(db *sql.DB) *Auth {
	return &Auth{UserRepo: user.NewUserRepository(db)}
}

func (a *Auth) RegisterPublicRoutes(r *gin.RouterGroup) {
	r.POST("/auth/register", func(c *gin.Context) { registration.RegisterHandler(c, a.UserRepo) })
}

func (a *Auth) RegisterPrivateRoutes(r *gin.RouterGroup) {}
