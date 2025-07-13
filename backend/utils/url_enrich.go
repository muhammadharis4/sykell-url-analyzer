package utils

import (
	"time"

	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"gorm.io/gorm"
)

// EnrichURL returns a map with all requested fields for a given URL
func EnrichURL(db *gorm.DB, url models.URL) map[string]interface{} {
	var crawlResult models.CrawlResult
	crawlResultExists := db.Where("url_id = ?", url.ID).Order("crawled_at desc").First(&crawlResult).Error == nil

	var brokenLinks int64
	if crawlResultExists {
		db.Model(&models.Link{}).Where("crawl_result_id = ? AND is_accessible = ?", crawlResult.ID, false).Count(&brokenLinks)
	}

	item := map[string]interface{}{
		"id":         url.ID,
		"url":        url.URL,
		"status":     url.Status,
		"created_at": url.CreatedAt.Format(time.RFC3339),
	}
	if crawlResultExists {
		item["title"] = crawlResult.Title
		item["html_version"] = crawlResult.HTMLVersion
		item["internal_links"] = crawlResult.InternalLinks
		item["external_links"] = crawlResult.ExternalLinks
		item["broken_links"] = brokenLinks
	} else {
		item["title"] = ""
		item["html_version"] = ""
		item["internal_links"] = 0
		item["external_links"] = 0
		item["broken_links"] = 0
	}
	return item
}
