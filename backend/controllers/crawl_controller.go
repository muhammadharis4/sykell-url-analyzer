package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/services"
)

type CrawlController struct {
	db             *gorm.DB
	crawlerService *services.CrawlerService
}

func NewCrawlController(db *gorm.DB) *CrawlController {
	return &CrawlController{
		db:             db,
		crawlerService: services.NewCrawlerService(db),
	}
}

// StartCrawl - POST /api/v1/urls/:id/crawl
func (cc *CrawlController) StartCrawl(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL ID",
		})
		return
	}

	// Check if URL exists
	var url models.URL
	if err := cc.db.First(&url, id).Error; err != nil {
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

	// Check if URL is already being crawled or completed
	if url.Status == "running" {
		c.JSON(http.StatusConflict, gin.H{
			"error": "URL is already being crawled",
			"status": url.Status,
		})
		return
	}

	// Start crawling in a goroutine (non-blocking)
	go func() {
		if err := cc.crawlerService.CrawlURL(uint(id)); err != nil {
			// Log error (in production, you'd want proper logging)
			// The crawler service already updates the status to "error"
		}
	}()

	// Update status to running and return immediately
	if err := cc.db.Model(&url).Update("status", "running").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to start crawling",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Crawling started successfully",
		"url_id": id,
		"status": "running",
	})
}

// GetCrawlResults - GET /api/v1/urls/:id/results
func (cc *CrawlController) GetCrawlResults(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL ID",
		})
		return
	}

	// Check if URL exists
	var url models.URL
	if err := cc.db.First(&url, id).Error; err != nil {
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

	// Get crawl results for this URL
	var crawlResults []models.CrawlResult
	if err := cc.db.Preload("Links").Where("url_id = ?", id).Find(&crawlResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve crawl results",
		})
		return
	}

	// Check if crawl results exist
	if len(crawlResults) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No crawl results found for this URL",
			"url":   url,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":     url,
		"results": crawlResults,
	})
}
