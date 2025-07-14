package controllers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/services"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve URLs"})
		return
	}

	var enrichedURLs []map[string]interface{}
	for _, url := range urls {
		enrichedURLs = append(enrichedURLs, utils.EnrichURL(uc.db, url))
	}
	c.JSON(http.StatusOK, gin.H{"urls": enrichedURLs})
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
			c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve URL"})
		return
	}

	c.JSON(http.StatusOK, utils.EnrichURL(uc.db, url))
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
		"url_id":  id,
	})
}

// StartProcessing - POST /api/urls/:id/start
func (uc *URLController) StartProcessing(c *gin.Context) {
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

	// Update status to running
	if err := uc.db.Model(&url).Update("status", "running").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update URL status",
		})
		return
	}

	// Start crawling in a goroutine
	go func() {
		if err := uc.crawlerService.CrawlURL(uint(id)); err != nil {
			// Log error (in production, you'd want proper logging)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Started processing URL",
		"url_id":  id,
		"status":  "running",
	})
}

// StopProcessing - POST /api/urls/:id/stop
func (uc *URLController) StopProcessing(c *gin.Context) {
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

	// Update status to queued (stopped)
	if err := uc.db.Model(&url).Update("status", "queued").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update URL status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Stopped processing URL",
		"url_id":  id,
		"status":  "queued",
	})
}

// BatchStartProcessing - POST /api/urls/batch/start
func (uc *URLController) BatchStartProcessing(c *gin.Context) {
	var request struct {
		IDs []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if len(request.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No URL IDs provided",
		})
		return
	}

	var successCount int
	var errors []string

	for _, idStr := range request.IDs {
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Invalid ID: %s", idStr))
			continue
		}

		// Check if URL exists and update status
		var url models.URL
		if err := uc.db.First(&url, id).Error; err != nil {
			errors = append(errors, fmt.Sprintf("URL not found: %s", idStr))
			continue
		}

		// Update status to running
		if err := uc.db.Model(&url).Update("status", "running").Error; err != nil {
			errors = append(errors, fmt.Sprintf("Failed to update URL %s", idStr))
			continue
		}

		// Start crawling in a goroutine
		go func(urlID uint) {
			if err := uc.crawlerService.CrawlURL(urlID); err != nil {
				// Log error (in production, you'd want proper logging)
			}
		}(uint(id))

		successCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Started processing %d URL(s)", successCount),
		"success_count": successCount,
		"errors":        errors,
	})
}

// BatchStopProcessing - POST /api/urls/batch/stop
func (uc *URLController) BatchStopProcessing(c *gin.Context) {
	var request struct {
		IDs []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if len(request.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No URL IDs provided",
		})
		return
	}

	var successCount int
	var errors []string

	for _, idStr := range request.IDs {
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Invalid ID: %s", idStr))
			continue
		}

		// Check if URL exists and update status
		var url models.URL
		if err := uc.db.First(&url, id).Error; err != nil {
			errors = append(errors, fmt.Sprintf("URL not found: %s", idStr))
			continue
		}

		// Update status to queued (stopped)
		if err := uc.db.Model(&url).Update("status", "queued").Error; err != nil {
			errors = append(errors, fmt.Sprintf("Failed to update URL %s", idStr))
			continue
		}

		successCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Stopped processing %d URL(s)", successCount),
		"success_count": successCount,
		"errors":        errors,
	})
}

// BatchDeleteUrls - DELETE /api/urls/batch/delete
func (uc *URLController) BatchDeleteUrls(c *gin.Context) {
	var request struct {
		IDs []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if len(request.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No URL IDs provided",
		})
		return
	}

	var successCount int
	var errors []string

	for _, idStr := range request.IDs {
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Invalid ID: %s", idStr))
			continue
		}

		// Check if URL exists
		var url models.URL
		if err := uc.db.First(&url, id).Error; err != nil {
			errors = append(errors, fmt.Sprintf("URL not found: %s", idStr))
			continue
		}

		// Delete the URL (cascade delete will handle related data)
		if err := uc.db.Delete(&url).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Failed to delete URL %s", idStr))
			continue
		}

		successCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Deleted %d URL(s)", successCount),
		"success_count": successCount,
		"errors":        errors,
	})
}

// BatchRerunAnalysis - POST /api/urls/batch/rerun
func (uc *URLController) BatchRerunAnalysis(c *gin.Context) {
	var request struct {
		IDs []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if len(request.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No URL IDs provided",
		})
		return
	}

	var successCount int
	var errors []string

	for _, idStr := range request.IDs {
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Invalid ID: %s", idStr))
			continue
		}

		// Check if URL exists
		var url models.URL
		if err := uc.db.First(&url, id).Error; err != nil {
			errors = append(errors, fmt.Sprintf("URL not found: %s", idStr))
			continue
		}

		// Clear previous crawl data (optional - you might want to keep history)
		// Delete existing crawl results for this URL
		if err := uc.db.Where("url_id = ?", id).Delete(&models.CrawlResult{}).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Failed to clear previous data for URL %s", idStr))
			continue
		}

		// Reset URL status and start fresh analysis
		if err := uc.db.Model(&url).Update("status", "running").Error; err != nil {
			errors = append(errors, fmt.Sprintf("Failed to update URL %s", idStr))
			continue
		}

		// Start crawling in a goroutine
		go func(urlID uint) {
			if err := uc.crawlerService.CrawlURL(urlID); err != nil {
				// Log error (in production, you'd want proper logging)
			}
		}(uint(id))

		successCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Restarted analysis for %d URL(s)", successCount),
		"success_count": successCount,
		"errors":        errors,
	})
}
