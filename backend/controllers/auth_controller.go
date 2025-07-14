package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com-personal/muhammadharis4/sykell-url-analyzer/backend/middleware"
)

// AuthController handles authentication endpoints
type AuthController struct{}

// NewAuthController creates a new auth controller instance
func NewAuthController() *AuthController {
	return &AuthController{}
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login handles user authentication
func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	token, success := middleware.Login(req.Username, req.Password)
	if !success {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
	})
}

// Logout handles user logout
func (ac *AuthController) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 {
			token := parts[1]
			middleware.Logout(token)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}

// Me returns current user info (for testing authentication)
func (ac *AuthController) Me(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"username": "admin",
		"message":  "Authentication successful",
	})
}
