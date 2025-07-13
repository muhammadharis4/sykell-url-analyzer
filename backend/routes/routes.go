package routes

import (
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/controllers"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes configures all API routes
func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	// Create controller instances
	urlController := controllers.NewURLController(db)
	crawlController := controllers.NewCrawlController(db)

	// API group
	api := router.Group("/api")

	// URL routes
	urls := api.Group("/urls")

	// crawl routes
	crawls := api.Group("/crawls")
	{
		urls.POST("", urlController.AddURL)          // POST /api/urls
		urls.GET("", urlController.GetURLs)          // GET /api/urls
		urls.GET("/:id", urlController.GetURL)       // GET /api/urls/123
		urls.DELETE("/:id", urlController.DeleteURL) // DELETE /api/urls/123

		crawls.GET("/crawls", crawlController.GetCrawelResults)    // GET /api/crawls
		crawls.GET("/:id/crawls", crawlController.GetCrawlResults) // GET /api/urls/123/crawls
	}
}
