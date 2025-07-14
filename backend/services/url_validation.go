package services

import (
	"fmt"
	"net/url"
	"strings"
)

// URLValidationService handles URL validation and sanitization
type URLValidationService struct{}

// NewURLValidationService creates a new URL validation service
func NewURLValidationService() *URLValidationService {
	return &URLValidationService{}
}

// ValidateAndSanitizeURL validates and sanitizes a URL string with intelligent processing
func (v *URLValidationService) ValidateAndSanitizeURL(rawURL string) (string, error) {
	// Trim whitespace
	rawURL = strings.TrimSpace(rawURL)

	if rawURL == "" {
		return "", fmt.Errorf("URL cannot be empty")
	}

	// Smart URL processing - handle various input formats
	processedURL := v.processURL(rawURL)

	// Parse and validate URL
	parsedURL, err := url.Parse(processedURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL format: %v", err)
	}

	// Check if host is provided
	if parsedURL.Host == "" {
		return "", fmt.Errorf("URL must include a valid host")
	}

	// Return the cleaned URL
	return parsedURL.String(), nil
}

// processURL intelligently processes raw URL input to create a valid URL
func (v *URLValidationService) processURL(rawURL string) string {
	// Convert to lowercase for processing
	processedURL := strings.ToLower(rawURL)

	// Remove any existing protocol and www prefix to start clean
	processedURL = strings.TrimPrefix(processedURL, "https://")
	processedURL = strings.TrimPrefix(processedURL, "http://")
	processedURL = strings.TrimPrefix(processedURL, "www.")

	// Add https:// and www. for better compatibility
	// Most modern websites support HTTPS and www redirects
	return "https://www." + processedURL
}

// IsValidHTTPURL checks if the URL is a valid HTTP/HTTPS URL
func (v *URLValidationService) IsValidHTTPURL(rawURL string) bool {
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	return parsedURL.Scheme == "http" || parsedURL.Scheme == "https"
}
