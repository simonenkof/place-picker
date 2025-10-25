package desks

import (
	"database/sql"

	"github.com/gin-gonic/gin"

	desksRepo "place-picker/internal/db/repo/desks"
)

type Desks struct {
	DesksRepo *desksRepo.DesksRepository
}

func New(db *sql.DB) *Desks {
	return &Desks{DesksRepo: desksRepo.NewDesksRepository(db)}
}

func (d *Desks) RegisterPublicRoutes(r *gin.RouterGroup) {}

func (d *Desks) RegisterPrivateRoutes(r *gin.RouterGroup) {
	r.POST("/desks/load", func(c *gin.Context) { LoadDesksHandler(c, d.DesksRepo) })
	r.GET("/desks", func(c *gin.Context) { GetDesksHandler(c, d.DesksRepo) })
	r.PUT("/desks/:id", func(c *gin.Context) { ChangeDeskName(c, d.DesksRepo) })
	r.DELETE("/desks/:id", func(c *gin.Context) { DeleteDeskHandler(c, d.DesksRepo) })
}
