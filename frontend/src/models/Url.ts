// Core URL entity
export interface UrlWithCrawl {
    id: number;
    url: string;
    status: "queued" | "running" | "completed" | "error";
    created_at: string;
    title: string;
    html_version: string;
    internal_links: number;
    external_links: number;
    broken_links: number;
}


