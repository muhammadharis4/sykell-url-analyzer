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

// New API Models for crawl results endpoint
export interface ApiURL {
    id: number;
    url: string;
    status: "queued" | "running" | "completed" | "error";
    created_at: string;
    updated_at: string;
}

export interface ApiLink {
    id: number;
    crawl_result_id: number;
    url: string;
    type: "internal" | "external";
    status_code: number;
    is_accessible: boolean;
}

export interface ApiCrawlResult {
    id: number;
    url_id: number;
    title: string;
    html_version: string;
    h1_count: number;
    h2_count: number;
    h3_count: number;
    h4_count: number;
    h5_count: number;
    h6_count: number;
    internal_links: number;
    external_links: number;
    inaccessible_links: number;
    has_login_form: boolean;
    crawled_at: string;
    links: ApiLink[];
}

export interface ApiCrawlResponse {
    count: number;
    results: ApiCrawlResult;
    url: ApiURL;
}
