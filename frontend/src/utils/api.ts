// API utility with automatic authentication
export const apiRequest = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");

    // Merge headers with auth token
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Make the request with auth headers
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // If unauthorized, clear token and potentially redirect
    if (response.status === 401) {
        localStorage.removeItem("auth_token");
        // You might want to dispatch an event or use a global state here
        // to trigger a logout across the app
    }

    return response;
};
