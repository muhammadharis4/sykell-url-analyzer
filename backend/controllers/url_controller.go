package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
)

type URLController struct {
	db *gorm.DB
}

func NewURLController(db *gorm.DB) *URLController {
	return &URLController{db: db}
}

// AddURL - POST /api/v1/urls
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
		Status: "queued",
	}

	if err := uc.db.Create(&url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save URL",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "URL added successfully",
		"url":     url,
	})
}

// GetURLs - GET /api/v1/urls
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

// GetURL - GET /api/v1/urls/:id
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