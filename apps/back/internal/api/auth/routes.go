package auth

import (
	"database/sql"
	user "place-picker/internal/db/repo/user"

	"github.com/gin-gonic/gin"
)

type (
	Auth struct {
		UserRepo *user.UserRepository
	}

	UserCreds struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	RegisterCreds struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	RefreshToken struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}
)

func New(db *sql.DB) *Auth {
	return &Auth{UserRepo: user.NewUserRepository(db)}
}

func (a *Auth) RegisterPublicRoutes(r *gin.RouterGroup) {
	r.POST("/auth/register", func(c *gin.Context) { registerHandler(c, a.UserRepo) })
	r.POST("/auth/login", func(c *gin.Context) { loginHandler(c, a.UserRepo) })
	r.POST("/auth/refresh", refreshHandler)
	r.GET("/auth/verify", func(c *gin.Context) { verifyEmailHandler(c, a.UserRepo) })
}

func (a *Auth) RegisterPrivateRoutes(r *gin.RouterGroup) {}
