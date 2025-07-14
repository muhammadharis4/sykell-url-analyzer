import { apiRequest } from '../utils/api';

/**
 * Fetches all URLs with their crawl data
 * @returns {Promise<any>} The API response
 */
export const getUrlsWithCrawls = async () => {
    try {
        const response = await apiRequest("/api/urls/crawl", {
            method: "GET",
        });

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Triggers a crawl for a specific URL by ID
 * @param {number|string} id - The ID of the URL to crawl
 * @returns {Promise<any>} The API response
 */
export const crawlUrl = async (id: string) => {
    try {
        const response = await fetch(
            `http://localhost:8080/api/urls/${id}/crawl`,
            {
                method: "GET",
            }
        );

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Adds a new URL for analysis
 * @param {string} url - The URL to add
 * @returns {Promise<any>} The API response
 */
export const addUrl = async (url: string) => {
    try {
        const response = await apiRequest("/api/urls", {
            method: "POST",
            body: JSON.stringify({ url: url.trim() }),
        });

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Starts processing/crawling multiple URLs
 * @param {string[]} ids - Array of URL IDs to start processing
 * @returns {Promise<any>} The API response
 */
export const startProcessingUrls = async (ids: string[]) => {
    try {
        const response = await fetch(
            "http://localhost:8080/api/urls/batch/start",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids }),
            }
        );

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Stops processing/crawling multiple URLs
 * @param {string[]} ids - Array of URL IDs to stop processing
 * @returns {Promise<any>} The API response
 */
export const stopProcessingUrls = async (ids: string[]) => {
    try {
        const response = await fetch(
            "http://localhost:8080/api/urls/batch/stop",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids }),
            }
        );

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Deletes multiple URLs
 * @param {string[]} ids - Array of URL IDs to delete
 * @returns {Promise<any>} The API response
 */
export const deleteUrls = async (ids: string[]) => {
    try {
        const response = await fetch(
            "http://localhost:8080/api/urls/batch/delete",
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids }),
            }
        );

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Re-runs analysis for multiple URLs (clears previous data and starts fresh)
 * @param {string[]} ids - Array of URL IDs to re-analyze
 * @returns {Promise<any>} The API response
 */
export const rerunAnalysis = async (ids: string[]) => {
    try {
        const response = await fetch(
            "http://localhost:8080/api/urls/batch/rerun",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids }),
            }
        );

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Starts processing/crawling a specific URL by ID
 * @param {string} id - The ID of the URL to start processing
 * @returns {Promise<any>} The API response
 */
export const startUrlProcessing = async (id: string) => {
    try {
        const response = await fetch(
            `http://localhost:8080/api/urls/${id}/start`,
            {
                method: "POST",
            }
        );

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};

/**
 * Stops processing/crawling a specific URL by ID
 * @param {string} id - The ID of the URL to stop processing
 * @returns {Promise<any>} The API response
 */
export const stopUrlProcessing = async (id: string) => {
    try {
        const response = await fetch(
            `http://localhost:8080/api/urls/${id}/stop`,
            {
                method: "POST",
            }
        );

        if (!response.ok) {
            return {
                isSuccess: false,
                data: null,
                error: `HTTP error! status: ${response.status}`,
            };
        }

        const data = await response.json();
        return {
            isSuccess: true,
            data,
        };
    } catch (error) {
        return {
            isSuccess: false,
            data: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Network error occurred",
        };
    }
};
