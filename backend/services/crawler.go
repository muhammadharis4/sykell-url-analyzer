package services

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/models"
	"golang.org/x/net/html"
	"gorm.io/gorm"
)

// CrawlerService handles website crawling and analysis operations
type CrawlerService struct {
	db     *gorm.DB
	client *http.Client
}

// NewCrawlerService creates a new crawler service instance with configured HTTP client
func NewCrawlerService(db *gorm.DB) *CrawlerService {
	return &CrawlerService{
		db: db,
		client: &http.Client{
			Timeout: 30 * time.Second, // Set reasonable timeout for HTTP requests
		},
	}
}

// CrawlURL orchestrates the complete crawling process for a given URL
// It handles status updates, performs the actual crawl, and saves results
func (c *CrawlerService) CrawlURL(urlID uint) error {
	// Retrieve the URL record to check current status
	var urlModel models.URL
	if err := c.db.First(&urlModel, urlID).Error; err != nil {
		return fmt.Errorf("failed to find URL with ID %d: %v", urlID, err)
	}

	// Skip crawling if already completed to avoid unnecessary re-processing
	if urlModel.Status == "completed" {
		return nil // Already completed, no action needed
	}

	// Update status to running only if not already in progress
	if urlModel.Status != "running" {
		if err := c.db.Model(&urlModel).Update("status", "running").Error; err != nil {
			return fmt.Errorf("failed to update URL status to running: %v", err)
		}
	}

	// Execute the actual crawling and analysis
	result, err := c.performCrawl(urlModel.URL)
	if err != nil {
		// Update status to error and return the error
		c.db.Model(&models.URL{}).Where("id = ?", urlID).Update("status", "error")
		return fmt.Errorf("crawling failed for URL %s: %v", urlModel.URL, err)
	}

	// Associate the crawl result with the URL
	result.URLID = urlID
	if err := c.db.Create(result).Error; err != nil {
		// Update status to error if we can't save results
		c.db.Model(&models.URL{}).Where("id = ?", urlID).Update("status", "error")
		return fmt.Errorf("failed to save crawl results: %v", err)
	}

	// Mark URL as completed
	if err := c.db.Model(&models.URL{}).Where("id = ?", urlID).Update("status", "completed").Error; err != nil {
		return fmt.Errorf("failed to update URL status to completed: %v", err)
	}

	return nil
}

// performCrawl executes the actual website analysis and data extraction
// It fetches the webpage, parses HTML, and extracts all relevant information
func (c *CrawlerService) performCrawl(targetURL string) (*models.CrawlResult, error) {
	// Fetch the webpage using configured HTTP client
	resp, err := c.client.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	// Check for successful HTTP response
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	// Parse the HTML document
	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	// Initialize crawl result with timestamp
	result := &models.CrawlResult{
		CrawledAt: time.Now(),
	}

	// Extract various pieces of information from the HTML document
	c.extractTitle(doc, result)            // Page title
	c.extractHTMLVersion(doc, result)      // HTML version detection
	c.extractHeadingCounts(doc, result)    // H1-H6 heading counts
	c.extractLinks(doc, result, targetURL) // Internal/external links
	c.checkLoginForm(doc, result)          // Login form detection

	// Perform link accessibility check (may take additional time)
	c.checkLinkAccessibility(result)

	return result, nil
}

// extractTitle extracts the page title from the HTML document
func (c *CrawlerService) extractTitle(doc *html.Node, result *models.CrawlResult) {
	var findTitle func(*html.Node) string
	findTitle = func(n *html.Node) string {
		if n.Type == html.ElementNode && n.Data == "title" {
			if n.FirstChild != nil && n.FirstChild.Type == html.TextNode {
				return strings.TrimSpace(n.FirstChild.Data)
			}
		}
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			if title := findTitle(child); title != "" {
				return title
			}
		}
		return ""
	}
	result.Title = findTitle(doc)
}

// Extract HTML version (simple detection)
func (c *CrawlerService) extractHTMLVersion(doc *html.Node, result *models.CrawlResult) {
	var findDoctype func(*html.Node) string
	findDoctype = func(n *html.Node) string {
		if n.Type == html.DoctypeNode {
			return n.Data
		}
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			if doctype := findDoctype(child); doctype != "" {
				return doctype
			}
		}
		return ""
	}

	doctype := strings.ToLower(findDoctype(doc))
	if strings.Contains(doctype, "html") || doctype == "html" {
		result.HTMLVersion = "HTML5"
	} else {
		result.HTMLVersion = "Unknown"
	}
}

// Count heading tags (H1, H2, H3, H4, H5, H6)
func (c *CrawlerService) extractHeadingCounts(doc *html.Node, result *models.CrawlResult) {
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch n.Data {
			case "h1":
				result.H1Count++
			case "h2":
				result.H2Count++
			case "h3":
				result.H3Count++
			case "h4":
				result.H4Count++
			case "h5":
				result.H5Count++
			case "h6":
				result.H6Count++
			}
		}
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			traverse(child)
		}
	}
	traverse(doc)
}

// Extract all links and categorize them
func (c *CrawlerService) extractLinks(doc *html.Node, result *models.CrawlResult, baseURL string) {
	var links []models.Link
	parsedBaseURL, _ := url.Parse(baseURL)

	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, attr := range n.Attr {
				if attr.Key == "href" && attr.Val != "" && !strings.HasPrefix(attr.Val, "#") {
					linkURL, err := url.Parse(attr.Val)
					if err != nil {
						continue
					}

					// Resolve relative URLs
					absoluteURL := parsedBaseURL.ResolveReference(linkURL)

					link := models.Link{
						URL: absoluteURL.String(),
					}

					// Determine if internal or external
					if absoluteURL.Host == parsedBaseURL.Host || absoluteURL.Host == "" {
						link.Type = "internal"
						result.InternalLinks++
					} else {
						link.Type = "external"
						result.ExternalLinks++
					}

					links = append(links, link)
				}
			}
		}
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			traverse(child)
		}
	}
	traverse(doc)
	result.Links = links
}

// Check for login forms
func (c *CrawlerService) checkLoginForm(doc *html.Node, result *models.CrawlResult) {
	var traverse func(*html.Node) bool
	traverse = func(n *html.Node) bool {
		if n.Type == html.ElementNode && n.Data == "form" {
			// Look for password input fields
			var hasPasswordField func(*html.Node) bool
			hasPasswordField = func(formNode *html.Node) bool {
				if formNode.Type == html.ElementNode && formNode.Data == "input" {
					for _, attr := range formNode.Attr {
						if attr.Key == "type" && (attr.Val == "password" || attr.Val == "email") {
							return true
						}
					}
				}
				for child := formNode.FirstChild; child != nil; child = child.NextSibling {
					if hasPasswordField(child) {
						return true
					}
				}
				return false
			}

			if hasPasswordField(n) {
				return true
			}
		}
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			if traverse(child) {
				return true
			}
		}
		return false
	}
	result.HasLoginForm = traverse(doc)
}

// Check accessibility of links (finds broken links)
func (c *CrawlerService) checkLinkAccessibility(result *models.CrawlResult) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	inaccessibleCount := 0

	for i := range result.Links {
		link := &result.Links[i]

		// Skip checking very long URLs or non-HTTP schemes
		if len(link.URL) > 2000 || (!strings.HasPrefix(link.URL, "http://") && !strings.HasPrefix(link.URL, "https://")) {
			link.StatusCode = 0
			link.IsAccessible = false
			inaccessibleCount++
			continue
		}

		// Make HEAD request to check if link is accessible
		resp, err := client.Head(link.URL)
		if err != nil {
			link.StatusCode = 0
			link.IsAccessible = false
			inaccessibleCount++
			continue
		}

		link.StatusCode = resp.StatusCode
		link.IsAccessible = resp.StatusCode < 400

		if !link.IsAccessible {
			inaccessibleCount++
		}
	}

	result.InaccessibleLinks = inaccessibleCount
}
