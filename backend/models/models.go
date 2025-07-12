package models

import (
	"time"

	"gorm.io/gorm"
)

// URL represents a website URL to be analyzed
type URL struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	URL       string         `json:"url" gorm:"unique;not null"`
	Status    string         `json:"status" gorm:"default:'queued'"` // queued, running, completed, error
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationship - one URL can have one crawl result
	CrawlResult *CrawlResult `json:"crawl_result,omitempty"`
}

// CrawlResult stores the analysis results for a URL
type CrawlResult struct {
	ID               uint      `json:"id" gorm:"primarykey"`
	URLID            uint      `json:"url_id" gorm:"not null"`
	Title            string    `json:"title"`
	HTMLVersion      string    `json:"html_version"`
	H1Count          int       `json:"h1_count"`
	H2Count          int       `json:"h2_count"`
	H3Count          int       `json:"h3_count"`
	H4Count          int       `json:"h4_count"`
	H5Count          int       `json:"h5_count"`
	H6Count          int       `json:"h6_count"`
	InternalLinks    int       `json:"internal_links"`
	ExternalLinks    int       `json:"external_links"`
	InaccessibleLinks int      `json:"inaccessible_links"`
	HasLoginForm     bool      `json:"has_login_form"`
	CrawledAt        time.Time `json:"crawled_at"`
	
	// Relationships
	URL   URL    `json:"url" gorm:"foreignKey:URLID"`
	Links []Link `json:"links,omitempty"`
}

// Link represents an individual link found on a webpage
type Link struct {
	ID           uint   `json:"id" gorm:"primarykey"`
	CrawlResultID uint   `json:"crawl_result_id" gorm:"not null"`
	URL          string `json:"url"`
	Type         string `json:"type"` // internal, external
	StatusCode   int    `json:"status_code"`
	IsAccessible bool   `json:"is_accessible"`
	
	// Relationship
	CrawlResult CrawlResult `json:"-" gorm:"foreignKey:CrawlResultID"`
}
