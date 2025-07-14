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

// URLController handles HTTP requests related to URL management and crawling operations
type URLController struct {
	db                *gorm.DB
	crawlerService    *services.CrawlerService
	validationService *services.URLValidationService
	responseUtil      *utils.ResponseUtil
}

// NewURLController creates a new instance of URLController with all required dependencies
func NewURLController(db *gorm.DB) *URLController {
	return &URLController{
		db:                db,
		crawlerService:    services.NewCrawlerService(db),
		validationService: services.NewURLValidationService(),
		responseUtil:      utils.NewResponseUtil(),
	}
}

// AddURLRequest represents the request body for adding a new URL
type AddURLRequest struct {
	URL string `json:"url" binding:"required"`
}

// AddURL handles POST /api/urls - Adds a new URL to the system and starts crawling automatically
func (uc *URLController) AddURL(c *gin.Context) {
	var request AddURLRequest

	// Parse and validate request body
	if err := c.ShouldBindJSON(&request); err != nil {
		uc.responseUtil.BadRequest(c, "Invalid request body: URL is required")
		return
	}

	// Validate and sanitize the URL
	sanitizedURL, err := uc.validationService.ValidateAndSanitizeURL(request.URL)
	if err != nil {
		uc.responseUtil.BadRequest(c, fmt.Sprintf("Invalid URL: %v", err))
		return
	}

	// Check if URL already exists in the database
	var existingURL models.URL
	if err := uc.db.Where("url = ?", sanitizedURL).First(&existingURL).Error; err == nil {
		uc.responseUtil.Conflict(c, "URL already exists in the system", map[string]interface{}{
			"existing_url": existingURL,
		})
		return
	}

	// Create new URL record with initial status
	url := models.URL{
		URL:    sanitizedURL,
		Status: "running", // Start as running since crawling begins immediately
	}

	// Save URL to database
	if err := uc.db.Create(&url).Error; err != nil {
		utils.AppLogger.Error(fmt.Sprintf("Failed to save URL to database: %v", err))
		uc.responseUtil.InternalServerError(c, "Failed to save URL")
		return
	}

	// Start crawling process asynchronously (non-blocking)
	go func() {
		if err := uc.crawlerService.CrawlURL(url.ID); err != nil {
			utils.AppLogger.Error(fmt.Sprintf("Crawling failed for URL ID %d: %v", url.ID, err))
		}
	}()

	// Return success response
	uc.responseUtil.Created(c, map[string]interface{}{
		"id":     url.ID,
		"url":    url.URL,
		"status": url.Status,
	}, "URL added successfully and crawling started")
}

// GetURLs handles GET /api/urls - Retrieves all URLs with their enriched crawl data
func (uc *URLController) GetURLs(c *gin.Context) {
	var urls []models.URL

	// Fetch all URLs ordered by creation date (newest first)
	if err := uc.db.Order("created_at desc").Find(&urls).Error; err != nil {
		utils.AppLogger.Error(fmt.Sprintf("Failed to retrieve URLs from database: %v", err))
		uc.responseUtil.InternalServerError(c, "Failed to retrieve URLs")
		return
	}

	// Enrich each URL with crawl data
	var enrichedURLs []map[string]interface{}
	for _, url := range urls {
		enrichedURLs = append(enrichedURLs, utils.EnrichURL(uc.db, url))
	}

	uc.responseUtil.Success(c, map[string]interface{}{
		"urls": enrichedURLs,
	}, "URLs retrieved successfully")
}

// GetURL handles GET /api/urls/:id - Retrieves a specific URL with its enriched crawl data
func (uc *URLController) GetURL(c *gin.Context) {
	// Parse and validate URL ID from path parameter
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		uc.responseUtil.BadRequest(c, "Invalid URL ID format")
		return
	}

	// Fetch URL from database
	var url models.URL
	if err := uc.db.First(&url, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			uc.responseUtil.NotFound(c, "URL not found")
			return
		}
		utils.AppLogger.Error(fmt.Sprintf("Failed to retrieve URL %d: %v", id, err))
		uc.responseUtil.InternalServerError(c, "Failed to retrieve URL")
		return
	}

	// Return enriched URL data
	enrichedURL := utils.EnrichURL(uc.db, url)
	uc.responseUtil.Success(c, enrichedURL, "URL retrieved successfully")
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

		// Clear previous crawl data properly (handle foreign key constraints)
		// First delete all links associated with crawl results for this URL
		uc.db.Exec("DELETE l FROM links l INNER JOIN crawl_results cr ON l.crawl_result_id = cr.id WHERE cr.url_id = ?", id)

		// Then delete crawl results for this URL
		if err := uc.db.Where("url_id = ?", id).Delete(&models.CrawlResult{}).Error; err != nil {
			// Log but don't fail if no data exists to delete
			// This is normal for URLs that haven't been crawled yet
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
