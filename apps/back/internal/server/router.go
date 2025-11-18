package server

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"place-picker/internal/config"
	authMiddleware "place-picker/internal/server/middleware/auth"
	corsMiddleware "place-picker/internal/server/middleware/cors"
	loggerMiddleware "place-picker/internal/server/middleware/logger"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

type RouteModule interface {
	RegisterPrivateRoutes(router *gin.RouterGroup)
	RegisterPublicRoutes(router *gin.RouterGroup)
}

// Настраивает мидлвары и эндпоинты сервера. Возвращает роутер.
func setupRouter(logger *slog.Logger, modules ...RouteModule) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery(), loggerMiddleware.SlogLogger(logger), cors.New(corsMiddleware.ConfigureCORS()))

	publicApi := router.Group("/api")
	privateApi := router.Group("/api/private")
	privateApi.Use(authMiddleware.AuthMiddleware())

	for _, m := range modules {
		m.RegisterPublicRoutes(publicApi)
		m.RegisterPrivateRoutes(privateApi)
	}

	registerStaticFrontend(router)

	return router
}

func registerStaticFrontend(router *gin.Engine) {
	frontendPath := viper.GetString("frontend_path")

	slog.Info("registerStaticFrontend | Frontend registered", "frontend_path", frontendPath)

	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}

		if config.IsProdMode() {
			if !strings.Contains(c.GetHeader("Accept"), "text/html") {
				filePath := filepath.Join(frontendPath, c.Request.URL.Path)
				if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
					c.File(filePath)
					return
				}
			}

			accept := c.GetHeader("Accept")
			if strings.Contains(accept, "text/html") {
				c.File(filepath.Join(frontendPath, "index.html"))
				return
			}

			c.AbortWithStatus(http.StatusNotFound)
		} else {
			target, _ := url.Parse(viper.GetString("dev_frontend_url"))
			proxy := httputil.NewSingleHostReverseProxy(target)

			c.Request.Host = target.Host
			proxy.ServeHTTP(c.Writer, c.Request)
		}
	})
}
