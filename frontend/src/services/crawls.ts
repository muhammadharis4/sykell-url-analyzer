/**
 * Fetches all URLs with their crawl data
 * @returns {Promise<any>} The API response
 */
export const getUrlsWithCrawls = async () => {
    const response = await fetch("http://localhost:8080/api/urls/crawl", {
        method: "GET",
    });
    const data = await response.json();
    return {
        isSuccess: response.ok,
        data,
    };
};

/**
 * Triggers a crawl for a specific URL by ID
 * @param {number|string} id - The ID of the URL to crawl
 * @returns {Promise<any>} The API response
 */
export const crawlUrl = async (id: number | string) => {
    const response = await fetch(`http://localhost:8080/api/urls/${id}/crawl`, {
        method: "POST",
    });
    const data = await response.json();
    return {
        isSuccess: response.ok,
        data,
    };
};
