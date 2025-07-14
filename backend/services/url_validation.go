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

// ValidateAndSanitizeURL validates and sanitizes a URL string
func (v *URLValidationService) ValidateAndSanitizeURL(rawURL string) (string, error) {
	// Trim whitespace
	rawURL = strings.TrimSpace(rawURL)

	if rawURL == "" {
		return "", fmt.Errorf("URL cannot be empty")
	}

	// Add http:// if no scheme is provided
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "http://" + rawURL
	}

	// Parse and validate URL
	parsedURL, err := url.Parse(rawURL)
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

// IsValidHTTPURL checks if the URL is a valid HTTP/HTTPS URL
func (v *URLValidationService) IsValidHTTPURL(rawURL string) bool {
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	return parsedURL.Scheme == "http" || parsedURL.Scheme == "https"
}
