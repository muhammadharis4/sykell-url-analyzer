/**
 * Error handling utility for the frontend application
 * Provides centralized error logging and user notification management
 */

import { toast } from "react-toastify";

export interface ErrorDetails {
    message: string;
    code?: string | number;
    context?: string;
}

export interface ApiResponse {
    error?: string;
    message?: string;
    success?: boolean;
}

/**
 * ErrorHandler class manages application errors consistently
 */
class ErrorHandler {
    private isDevelopment = import.meta.env.DEV;

    /**
     * Handle API errors with user-friendly messages
     * @param error - The error object or message
     * @param context - Additional context about where the error occurred
     * @param showToast - Whether to show a toast notification
     */
    handleError(
        error: Error | string | unknown,
        context?: string,
        showToast: boolean = true
    ): void {
        const errorDetails = this.extractErrorDetails(error, context);

        // Log error in development mode only
        if (this.isDevelopment) {
            console.error(
                `[${errorDetails.context || "Application"}] ${
                    errorDetails.message
                }`,
                error
            );
        }

        // Show user-friendly toast notification
        if (showToast) {
            toast.error(errorDetails.message);
        }
    }

    /**
     * Handle API response errors specifically
     * @param response - Failed API response
     * @param context - Context of the API call
     */
    handleApiError(response: ApiResponse, context: string): void {
        let message = "An unexpected error occurred";

        if (response?.error) {
            message = response.error;
        } else if (response?.message) {
            message = response.message;
        }

        this.handleError(new Error(message), `API ${context}`);
    }

    /**
     * Handle network/fetch errors
     * @param error - Network error
     * @param context - Context of the network call
     */
    handleNetworkError(error: Error | unknown, context: string): void {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown network error";
        const message =
            errorMessage === "Failed to fetch"
                ? "Network connection failed. Please check your internet connection."
                : errorMessage;

        this.handleError(new Error(message), `Network ${context}`);
    }

    /**
     * Show success message
     * @param message - Success message to display
     */
    showSuccess(message: string): void {
        toast.success(message);
    }

    /**
     * Show info message
     * @param message - Info message to display
     */
    showInfo(message: string): void {
        toast.info(message);
    }

    /**
     * Show warning message
     * @param message - Warning message to display
     */
    showWarning(message: string): void {
        toast.warning(message);
    }

    /**
     * Extract meaningful error details from various error types
     */
    private extractErrorDetails(
        error: Error | string | unknown,
        context?: string
    ): ErrorDetails {
        let message = "An unexpected error occurred";
        let code: string | number | undefined;

        if (error instanceof Error) {
            message = error.message;
        } else if (typeof error === "string") {
            message = error;
        } else if (error && typeof error === "object" && "message" in error) {
            message = String(error.message);
            if ("code" in error) {
                code = error.code as string | number;
            } else if ("status" in error) {
                code = error.status as string | number;
            }
        }

        return {
            message,
            code,
            context,
        };
    }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
