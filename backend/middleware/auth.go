package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Simple in-memory session store
var activeSessions = make(map[string]bool)

// Default credentials
const (
	defaultUsername = "admin"
	defaultPassword = "admin"
)

// AuthMiddleware checks for valid session token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// Check if token exists in active sessions
		if !activeSessions[token] {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Login creates a new session token
func Login(username, password string) (string, bool) {
	if username == defaultUsername && password == defaultPassword {
		// Generate a simple token (in production, use proper JWT or similar)
		token := generateSimpleToken()
		activeSessions[token] = true
		return token, true
	}
	return "", false
}

// Logout removes the session token
func Logout(token string) {
	delete(activeSessions, token)
}

// Simple token generator (not secure for production)
func generateSimpleToken() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return "auth_token_" + hex.EncodeToString(bytes)
}

// Simple random string generator (keeping for backward compatibility)
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[len(activeSessions)%len(charset)+i%len(charset)]
	}
	return string(b)
}
