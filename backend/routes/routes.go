package routes

import (
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/controllers"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes configures all API routes
func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	// Create controller instances
	urlController := controllers.NewURLController(db)
	crawlController := controllers.NewCrawlController(db)
	authController := controllers.NewAuthController()

	router.Use(cors.Default())

	// API group
	api := router.Group("/api")

	// Auth routes (no authentication required)
	auth := api.Group("/auth")
	{
		auth.POST("/login", authController.Login)   // POST /api/auth/login
		auth.POST("/logout", authController.Logout) // POST /api/auth/logout
		auth.GET("/me", middleware.AuthMiddleware(), authController.Me) // GET /api/auth/me
	}

	// Protected URL routes (authentication required)
	urls := api.Group("/urls")
	urls.Use(middleware.AuthMiddleware()) // Apply auth middleware to all URL routes
	{
		urls.POST("", urlController.AddURL)                    // POST /api/urls
		urls.GET("", urlController.GetURLs)                    // GET /api/urls
		urls.GET("/:id", urlController.GetURL)                 // GET /api/urls/123
		urls.DELETE("/:id", urlController.DeleteURL)           // DELETE /api/urls/123
		urls.POST("/:id/start", urlController.StartProcessing) // POST /api/urls/123/start
		urls.POST("/:id/stop", urlController.StopProcessing)   // POST /api/urls/123/stop

		// Batch operations
		urls.POST("/batch/start", urlController.BatchStartProcessing) // POST /api/urls/batch/start
		urls.POST("/batch/stop", urlController.BatchStopProcessing)   // POST /api/urls/batch/stop
		urls.DELETE("/batch/delete", urlController.BatchDeleteUrls)   // DELETE /api/urls/batch/delete
		urls.POST("/batch/rerun", urlController.BatchRerunAnalysis)   // POST /api/urls/batch/rerun

		urls.GET("/crawl", crawlController.GetCrawelResults)    // GET /api/crawls
		urls.GET("/:id/crawl", crawlController.GetCrawlResults) // GET /api/urls/123/crawls
	}
}
