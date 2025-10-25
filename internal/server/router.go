package server

import (
	"log/slog"
	// "place-picker/internal/server/middleware/auth"
	corsMiddleware "place-picker/internal/server/middleware/cors"
	logMiddleware "place-picker/internal/server/middleware/logger"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type RouteModule interface {
	RegisterPrivateRoutes(router *gin.RouterGroup)
	RegisterPublicRoutes(router *gin.RouterGroup)
}

// Настраивает мидлвары и эндпоинты сервера. Возвращает роутер.
func setupRouter(logger *slog.Logger, modules ...RouteModule) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery(), logMiddleware.SlogLogger(logger), cors.New(corsMiddleware.ConfigureCORS()))

	publicApi := router.Group("/api")
	privateApi := router.Group("/api/private")
	// privateApi.Use(auth.AuthMiddleware())

	for _, m := range modules {
		m.RegisterPublicRoutes(publicApi)
		m.RegisterPrivateRoutes(privateApi)
	}

	return router
}
