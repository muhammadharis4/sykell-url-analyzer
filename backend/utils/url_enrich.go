package utils

import (
	"time"

	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"gorm.io/gorm"
)

// EnrichURL enhances a URL model with its latest crawl result data and calculated metrics
// Returns a comprehensive map containing all URL information including crawl statistics
func EnrichURL(db *gorm.DB, url models.URL) map[string]interface{} {
	// Attempt to find the most recent crawl result for this URL
	var crawlResult models.CrawlResult
	err := db.Where("url_id = ?", url.ID).Order("crawled_at desc").First(&crawlResult).Error
	crawlResultExists := err == nil

	// Calculate broken links count if crawl results exist
	var brokenLinks int64
	if crawlResultExists {
		db.Model(&models.Link{}).
			Where("crawl_result_id = ? AND is_accessible = ?", crawlResult.ID, false).
			Count(&brokenLinks)
	}

	// Build the enriched response with base URL information
	enrichedData := map[string]interface{}{
		"id":         url.ID,
		"url":        url.URL,
		"status":     url.Status,
		"created_at": url.CreatedAt.Format(time.RFC3339),
	}

	// Add crawl result data if available, otherwise use default values
	if crawlResultExists {
		enrichedData["title"] = crawlResult.Title
		enrichedData["html_version"] = crawlResult.HTMLVersion
		enrichedData["internal_links"] = crawlResult.InternalLinks
		enrichedData["external_links"] = crawlResult.ExternalLinks
		enrichedData["broken_links"] = brokenLinks
		enrichedData["crawled_at"] = crawlResult.CrawledAt.Format(time.RFC3339)
		enrichedData["has_login_form"] = crawlResult.HasLoginForm
	} else {
		// Provide default values for URLs that haven't been crawled yet
		enrichedData["title"] = ""
		enrichedData["html_version"] = ""
		enrichedData["internal_links"] = 0
		enrichedData["external_links"] = 0
		enrichedData["broken_links"] = 0
		enrichedData["crawled_at"] = nil
		enrichedData["has_login_form"] = false
	}

	return enrichedData
}
