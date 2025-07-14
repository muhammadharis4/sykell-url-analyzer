package utils

import (
	"log"
	"os"
)

// Logger provides structured logging for the application
type Logger struct {
	infoLogger  *log.Logger
	errorLogger *log.Logger
	debugLogger *log.Logger
}

// NewLogger creates a new logger instance
func NewLogger() *Logger {
	return &Logger{
		infoLogger:  log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile),
		errorLogger: log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile),
		debugLogger: log.New(os.Stdout, "DEBUG: ", log.Ldate|log.Ltime|log.Lshortfile),
	}
}

// Info logs informational messages
func (l *Logger) Info(message string) {
	l.infoLogger.Println(message)
}

// Error logs error messages
func (l *Logger) Error(message string) {
	l.errorLogger.Println(message)
}

// Debug logs debug messages (only in development)
func (l *Logger) Debug(message string) {
	if os.Getenv("GIN_MODE") != "release" {
		l.debugLogger.Println(message)
	}
}

// Global logger instance
var AppLogger = NewLogger()
