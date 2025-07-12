package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/middleware"
)

type CrawlController struct {
	db *gorm.DB
}

func NewCrawlController(db *gorm.DB) *CrawlController {
	return &CrawlController{
		db: db,
	}
}

// GetCrawlResults - GET /api/urls/:id/results
func (cc *CrawlController) GetCrawlResults(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		middleware.SendErrorResponse(c, http.StatusBadRequest, middleware.ErrBadRequest, "Invalid URL ID format", nil)
		return
	}

	// Check if URL exists
	var url models.URL
	if err := cc.db.First(&url, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			middleware.SendErrorResponse(c, http.StatusNotFound, middleware.ErrNotFound, "URL not found", nil)
			return
		}
		middleware.SendErrorResponse(c, http.StatusInternalServerError, middleware.ErrInternalServerError, "Failed to retrieve URL", nil)
		return
	}

	// Get crawl results for this URL
	var crawlResults []models.CrawlResult
	if err := cc.db.Preload("Links").Where("url_id = ?", id).Find(&crawlResults).Error; err != nil {
		middleware.SendErrorResponse(c, http.StatusInternalServerError, middleware.ErrInternalServerError, "Failed to retrieve crawl results", nil)
		return
	}

	// Check if crawl results exist
	if len(crawlResults) == 0 {
		// Return the URL with empty results instead of an error
		middleware.SendSuccessResponse(c, http.StatusOK, "No crawl results found yet", gin.H{
			"url":     url,
			"results": []models.CrawlResult{},
			"status":  url.Status,
		})
		return
	}

	middleware.SendSuccessResponse(c, http.StatusOK, "Crawl results retrieved successfully", gin.H{
		"url":          url,
		"results":      crawlResults,
		"results_count": len(crawlResults),
	})
}
