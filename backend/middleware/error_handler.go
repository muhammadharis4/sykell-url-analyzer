package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error   string      `json:"error"`
	Message string      `json:"message"`
	Code    int         `json:"code"`
	Details interface{} `json:"details,omitempty"`
}

// SuccessResponse represents a standardized success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorHandler middleware for standardized error responses
func ErrorHandler() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "Internal Server Error",
				Message: err,
				Code:    http.StatusInternalServerError,
			})
		}
		c.AbortWithStatus(http.StatusInternalServerError)
	})
}

// Helper functions for consistent responses
func SendErrorResponse(c *gin.Context, statusCode int, errorType string, message string, details interface{}) {
	c.JSON(statusCode, ErrorResponse{
		Error:   errorType,
		Message: message,
		Code:    statusCode,
		Details: details,
	})
}

func SendSuccessResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Common error types
const (
	ErrBadRequest          = "Bad Request"
	ErrNotFound            = "Not Found"
	ErrConflict            = "Conflict"
	ErrInternalServerError = "Internal Server Error"
	ErrUnauthorized        = "Unauthorized"
	ErrValidationFailed    = "Validation Failed"
)
