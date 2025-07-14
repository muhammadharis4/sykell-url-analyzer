package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse represents a standard API response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// ResponseUtil provides utilities for consistent API responses
type ResponseUtil struct{}

// NewResponseUtil creates a new response utility
func NewResponseUtil() *ResponseUtil {
	return &ResponseUtil{}
}

// Success sends a successful response
func (r *ResponseUtil) Success(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Created sends a created response
func (r *ResponseUtil) Created(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// BadRequest sends a bad request error response
func (r *ResponseUtil) BadRequest(c *gin.Context, error string) {
	c.JSON(http.StatusBadRequest, APIResponse{
		Success: false,
		Error:   error,
	})
}

// NotFound sends a not found error response
func (r *ResponseUtil) NotFound(c *gin.Context, error string) {
	c.JSON(http.StatusNotFound, APIResponse{
		Success: false,
		Error:   error,
	})
}

// Conflict sends a conflict error response
func (r *ResponseUtil) Conflict(c *gin.Context, error string, data interface{}) {
	c.JSON(http.StatusConflict, APIResponse{
		Success: false,
		Error:   error,
		Data:    data,
	})
}

// InternalServerError sends an internal server error response
func (r *ResponseUtil) InternalServerError(c *gin.Context, error string) {
	c.JSON(http.StatusInternalServerError, APIResponse{
		Success: false,
		Error:   error,
	})
}

// Global response utility instance
var Response = NewResponseUtil()
