package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/controllers"
)

// SetupRoutes configures all API routes
func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	// Create controller instances
	urlController := controllers.NewURLController(db)
	crawlController := controllers.NewCrawlController(db)

	// API v1 group
	v1 := router.Group("/api/v1")
	
	// URL routes
	urls := v1.Group("/urls")
	{
		urls.POST("", urlController.AddURL)                      // POST /api/v1/urls
		urls.GET("", urlController.GetURLs)                      // GET /api/v1/urls  
		urls.GET("/:id", urlController.GetURL)                   // GET /api/v1/urls/123
		urls.DELETE("/:id", urlController.DeleteURL)             // DELETE /api/v1/urls/123
	}
}
