package controllers

import (
	"net/http"
	"strconv"

	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CrawlController struct {
	db *gorm.DB
}

// NewCrawlController creates a new instance of CrawlController
func NewCrawlController(db *gorm.DB) *CrawlController {
	return &CrawlController{
		db: db,
	}
}

// GetCrawelResults - GET /api/urls/crawls
func (cc *CrawlController) GetCrawelResults(c *gin.Context) {
	var urls []models.URL
	if err := cc.db.Find(&urls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve URLs",
		})
		return
	}

	var enrichedURLs []map[string]interface{}
	for _, url := range urls {
		enrichedURL := utils.EnrichURL(cc.db, url)
		enrichedURLs = append(enrichedURLs, enrichedURL)
	}

	c.JSON(http.StatusOK, gin.H{
		"urls": enrichedURLs,
	})
}

// GetCrawlResults - GET /api/urls/:id/results
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

	// Return results (empty array if no results yet)
	c.JSON(http.StatusOK, gin.H{
		"url":     url,
		"results": crawlResults,
		"count":   len(crawlResults),
	})
}
