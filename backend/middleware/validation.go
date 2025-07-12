package middleware

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ValidationError represents a field validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Value   string `json:"value,omitempty"`
}

// FormatValidationErrors formats validator errors into readable messages
func FormatValidationErrors(err error) []ValidationError {
	var errors []ValidationError

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, fieldError := range validationErrors {
			var message string
			switch fieldError.Tag() {
			case "required":
				message = fmt.Sprintf("%s is required", fieldError.Field())
			case "url":
				message = fmt.Sprintf("%s must be a valid URL", fieldError.Field())
			case "min":
				message = fmt.Sprintf("%s must be at least %s characters", fieldError.Field(), fieldError.Param())
			case "max":
				message = fmt.Sprintf("%s must be at most %s characters", fieldError.Field(), fieldError.Param())
			default:
				message = fmt.Sprintf("%s is invalid", fieldError.Field())
			}

			errors = append(errors, ValidationError{
				Field:   strings.ToLower(fieldError.Field()),
				Message: message,
				Value:   fmt.Sprintf("%v", fieldError.Value()),
			})
		}
	}

	return errors
}

// ValidateURL checks if a string is a valid URL
func ValidateURL(urlStr string) error {
	if urlStr == "" {
		return fmt.Errorf("URL cannot be empty")
	}

	// Parse the URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL format")
	}

	// Check if scheme is present
	if parsedURL.Scheme == "" {
		return fmt.Errorf("URL must include a scheme (http:// or https://)")
	}

	// Check if scheme is valid
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return fmt.Errorf("URL must use http:// or https:// scheme")
	}

	// Check if host is present
	if parsedURL.Host == "" {
		return fmt.Errorf("URL must include a valid host")
	}

	return nil
}

// SendValidationError sends a standardized validation error response
func SendValidationError(c *gin.Context, err error) {
	if validationErrors := FormatValidationErrors(err); len(validationErrors) > 0 {
		SendErrorResponse(c, 400, ErrValidationFailed, "Request validation failed", validationErrors)
	} else {
		SendErrorResponse(c, 400, ErrBadRequest, err.Error(), nil)
	}
}
