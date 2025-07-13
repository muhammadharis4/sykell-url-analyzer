import { apiRequest } from "./api-config";

/**
 * Fetches the list of URLs from the API
 * @returns 
 */
export const getUrls = () => {
    return apiRequest("/urls");
};
