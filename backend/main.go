package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/config"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/routes"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db := config.InitDB(cfg)

	// Run migrations (create tables automatically)
	err := db.AutoMigrate(
		&models.URL{},
		&models.CrawlResult{},
		&models.Link{},
	)
	if err != nil {
		log.Fatal("Failed to run migrations:", err)
	}
	log.Println("Database migrations completed")

	// Set Gin mode based on environment
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize router
	router := gin.Default()

	// Basic health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Sykell URL Analyzer API is running",
			"version": "1.0.0",
		})
	})

	// Setup API routes
	routes.SetupRoutes(router, db)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("🔗 Health check: http://localhost:%s/health", port)
	log.Printf("🗄️  Database: %s@%s:%s/%s", cfg.DBUser, cfg.DBHost, cfg.DBPort, cfg.DBName)
	
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
