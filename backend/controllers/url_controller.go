package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/services"
)

type URLController struct {
	db             *gorm.DB
	crawlerService *services.CrawlerService
}

func NewURLController(db *gorm.DB) *URLController {
	return &URLController{
		db:             db,
		crawlerService: services.NewCrawlerService(db),
	}
}

// AddURL - POST /api/urls
func (uc *URLController) AddURL(c *gin.Context) {
	var request struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL provided",
		})
		return
	}

	// Check if URL already exists
	var existingURL models.URL
	if err := uc.db.Where("url = ?", request.URL).First(&existingURL).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "URL already exists",
			"url":   existingURL,
		})
		return
	}

	// Create new URL
	url := models.URL{
		URL:    request.URL,
		Status: "running", // Start as running since we'll begin crawling immediately
	}

	if err := uc.db.Create(&url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save URL",
		})
		return
	}

	// Start crawling automatically in a goroutine (non-blocking)
	go func() {
		if err := uc.crawlerService.CrawlURL(url.ID); err != nil {
			// Log error (in production, you'd want proper logging)
			// The crawler service already updates the status to "error"
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message": "URL added and crawling started automatically",
		"url":     url,
		"status":  "running",
	})
}

// GetURLs - GET /api/urls
func (uc *URLController) GetURLs(c *gin.Context) {
	var urls []models.URL
	
	if err := uc.db.Order("created_at desc").Find(&urls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve URLs",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"urls": urls,
	})
}

// GetURL - GET /api/urls/:id
func (uc *URLController) GetURL(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL ID",
		})
		return
	}

	var url models.URL
	if err := uc.db.First(&url, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "URL not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve URL",
		})
		return
	}

	c.JSON(http.StatusOK, url)
}

// DeleteURL - DELETE /api/urls/:id
func (uc *URLController) DeleteURL(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL ID",
		})
		return
	}

	// Check if URL exists
	var url models.URL
	if err := uc.db.First(&url, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "URL not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve URL",
		})
		return
	}

	// Delete associated crawl results and links (cascade delete)
	// GORM will handle the cascade deletion based on foreign key constraints
	if err := uc.db.Delete(&url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete URL",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "URL deleted successfully",
		"url_id": id,
	})
}