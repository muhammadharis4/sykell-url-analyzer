// Temporary url for local development
const API_BASE_URL = "http://localhost:8080/api";

/**
 * Simple API request wrapper
 * @param endpoint - API endpoint to call
 * @param options - Fetch options
 * @returns Promise with data, success status, and HTTP status code
 */
export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    return {
        data,
        isSuccess: response.ok,
        status: response.status,
    };
};
