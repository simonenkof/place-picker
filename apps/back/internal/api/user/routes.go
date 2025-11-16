package user

import (
	"database/sql"
	userRepo "place-picker/internal/db/repo/user"

	"github.com/gin-gonic/gin"
)

type User struct {
	UserRepo *userRepo.UserRepository
}

func New(db *sql.DB) *User {
	return &User{UserRepo: userRepo.NewUserRepository(db)}
}

func (u *User) RegisterPublicRoutes(r *gin.RouterGroup) {}

func (u *User) RegisterPrivateRoutes(r *gin.RouterGroup) {
	r.GET("/user/me", func(c *gin.Context) { meHandler(c, u.UserRepo) })
}
