/**
 * Fetches all URLs with their crawl data
 * @returns {Promise<any>} The API response
 */
export const getUrlsWithCrawls = async () => {
    try {
        const response = await fetch("http://localhost:8080/api/urls/crawl", {
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
