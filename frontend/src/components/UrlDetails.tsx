import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import {
    Typography,
    Box,
    Button,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Tooltip,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { ApiCrawlResponse, ApiURL } from "../models/Url";
import { toast } from "react-toastify";
import { crawlUrl } from "../services/crawls";

/**
 * Component to display detailed analysis of a specific URL.
 * @returns
 */
const UrlDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<ApiCrawlResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Polling state
    const pollingIntervalRef = useRef<number | null>(null);

    // Fetch function - wrapped in useCallback to fix dependency issue
    const fetchUrlDetails = useCallback(async () => {
        setLoading(true);
        if (id) {
            const crawlResponse = await crawlUrl(id);
            if (crawlResponse.isSuccess) {
                setData(crawlResponse.data);
            } else {
                toast.error("Failed to fetch crawl data");
            }
        } else {
            toast.error("URL ID is missing");
        }
        setLoading(false);
    }, [id]);

    // Silent fetch for polling (doesn't show loading state)
    const fetchUrlDetailsSilent = useCallback(async () => {
        if (id) {
            const crawlResponse = await crawlUrl(id);
            if (crawlResponse.isSuccess) {
                setData(crawlResponse.data);
            }
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchUrlDetails();
        }
    }, [id, fetchUrlDetails]);

    // Polling effect for running status
    useEffect(() => {
        const isRunning = data?.url.status === "running";

        if (isRunning && !pollingIntervalRef.current) {
            // Start polling every 3 seconds for running status
            pollingIntervalRef.current = window.setInterval(() => {
                fetchUrlDetailsSilent();
            }, 3000);
        } else if (!isRunning && pollingIntervalRef.current) {
            // Stop polling when status is no longer running
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Cleanup on unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [data?.url.status, fetchUrlDetailsSilent]);

    const getStatusChip = (status: ApiURL["status"]) => {
        const statusConfig = {
            queued: {
                color: "default" as const,
                label: "Queued",
                bgColor: "grey.100",
            },
            running: {
                color: "primary" as const,
                label: "Running",
                bgColor: "primary.light",
            },
            completed: {
                color: "success" as const,
                label: "Completed",
                bgColor: "success.light",
            },
            error: {
                color: "error" as const,
                label: "Error",
                bgColor: "error.light",
            },
        };

        const config = statusConfig[status];
        return (
            <Chip
                size="medium"
                color={config.color}
                label={config.label}
                sx={{
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    fontSize: "0.875rem",
                }}
            />
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
                gap={3}
            >
                <CircularProgress size={60} thickness={4} />
                <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                >
                    Loading URL details...
                </Typography>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box
                textAlign="center"
                py={8}
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={3}
            >
                <Typography
                    variant="h4"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                >
                    URL not found
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1400,
                mx: "auto",
                px: { xs: 2, sm: 3, md: 4 },
                py: 3,
            }}
        >
            {/* Header */}
            <Box
                display="flex"
                alignItems="center"
                mb={4}
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    pb: 2,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    gap: 2,
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 600,
                        fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                        minWidth: 0,
                        wordBreak: "break-word",
                    }}
                >
                    URL Analysis Details
                </Typography>
                <Button
                    variant="contained"
                    startIcon={
                        data?.url.status === "running" ? (
                            <CircularProgress size={16} />
                        ) : (
                            <Refresh />
                        )
                    }
                    onClick={() => {
                        fetchUrlDetails();
                        toast.info("Re-analyzing URL...");
                    }}
                    disabled={loading}
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        px: 3,
                    }}
                >
                    {data?.url.status === "running"
                        ? "Auto-updating..."
                        : "Re-analyze URL"}
                </Button>
            </Box>

            {/* Main Content Grid */}
            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: "1fr",
                    sm: "1fr",
                    md: "1fr 1fr",
                    lg: "1fr 1fr 1fr",
                }}
                gap={4}
                sx={{
                    width: "100%",
                    alignItems: "stretch",
                    "& > *": {
                        height: "600px", // Fixed height for all tiles
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                {/* Tile 1 - Basic Information */}
                <Card
                    elevation={3}
                    sx={{
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "grey.200",
                        flex: 1,
                    }}
                >
                    <CardContent
                        sx={{
                            p: 3,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: 600,
                                color: "primary.main",
                                mb: 3,
                            }}
                        >
                            Basic Information
                        </Typography>

                        <Box
                            display="flex"
                            flexDirection="column"
                            gap={2.5}
                            sx={{ flex: 1 }}
                        >
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    URL
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        wordBreak: "break-all",
                                        backgroundColor: "grey.50",
                                        p: 1.5,
                                        borderRadius: 1,
                                        fontFamily: "monospace",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    {data.url.url}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    Title
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 500 }}
                                >
                                    {data.results.title || "No title"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    Status
                                </Typography>
                                <Box>{getStatusChip(data.url.status)}</Box>
                            </Box>

                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    HTML Version
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 500 }}
                                >
                                    {data.results.html_version || "Unknown"}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    Analyzed On
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 500 }}
                                >
                                    {formatDate(data.results.crawled_at)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    Additional Information
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    <Chip
                                        label={`Login Form: ${
                                            data.results.has_login_form
                                                ? "Yes"
                                                : "No"
                                        }`}
                                        color={
                                            data.results.has_login_form
                                                ? "warning"
                                                : "default"
                                        }
                                        size="small"
                                    />
                                    <Chip
                                        label={`Total Links: ${
                                            data.results.links?.length || 0
                                        }`}
                                        color="info"
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Tile 2 - Link Analysis */}
                <Card
                    elevation={3}
                    sx={{
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "grey.200",
                        flex: 1,
                    }}
                >
                    <CardContent
                        sx={{
                            p: 3,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: 600,
                                color: "primary.main",
                                mb: 3,
                            }}
                        >
                            Link Analysis
                        </Typography>

                        {/* Link Statistics */}
                        <Box
                            sx={{
                                mb: 3,
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: 2,
                                    mb: 3,
                                }}
                            >
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography
                                        variant="h4"
                                        color="primary.main"
                                        sx={{ fontWeight: 700, mb: 0.5 }}
                                    >
                                        {data.results.internal_links || 0}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        Internal
                                    </Typography>
                                </Box>

                                <Box sx={{ textAlign: "center" }}>
                                    <Typography
                                        variant="h4"
                                        color="info.main"
                                        sx={{ fontWeight: 700, mb: 0.5 }}
                                    >
                                        {data.results.external_links || 0}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        External
                                    </Typography>
                                </Box>

                                <Box sx={{ textAlign: "center" }}>
                                    <Typography
                                        variant="h4"
                                        color="error.main"
                                        sx={{ fontWeight: 700, mb: 0.5 }}
                                    >
                                        {data.results.inaccessible_links || 0}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        Broken
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Visual Progress Bars */}
                            <Box>
                                {(() => {
                                    const total =
                                        (data.results.internal_links || 0) +
                                        (data.results.external_links || 0) +
                                        (data.results.inaccessible_links || 0);
                                    const internalPercent =
                                        total > 0
                                            ? Math.round(
                                                  ((data.results
                                                      .internal_links || 0) /
                                                      total) *
                                                      100
                                              )
                                            : 0;
                                    const externalPercent =
                                        total > 0
                                            ? Math.round(
                                                  ((data.results
                                                      .external_links || 0) /
                                                      total) *
                                                      100
                                              )
                                            : 0;
                                    const brokenPercent =
                                        total > 0
                                            ? Math.round(
                                                  ((data.results
                                                      .inaccessible_links ||
                                                      0) /
                                                      total) *
                                                      100
                                              )
                                            : 0;

                                    return (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 2,
                                            }}
                                        >
                                            {/* Internal Links Bar */}
                                            <Box>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        color="primary.main"
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        Internal Links
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {internalPercent}%
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        height: 8,
                                                        backgroundColor:
                                                            "grey.200",
                                                        borderRadius: 4,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: `${internalPercent}%`,
                                                            height: "100%",
                                                            backgroundColor:
                                                                "primary.main",
                                                            transition:
                                                                "width 0.3s ease",
                                                        }}
                                                    />
                                                </Box>
                                            </Box>

                                            {/* External Links Bar */}
                                            <Box>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        color="info.main"
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        External Links
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {externalPercent}%
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        height: 8,
                                                        backgroundColor:
                                                            "grey.200",
                                                        borderRadius: 4,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: `${externalPercent}%`,
                                                            height: "100%",
                                                            backgroundColor:
                                                                "info.main",
                                                            transition:
                                                                "width 0.3s ease",
                                                        }}
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Broken Links Bar */}
                                            <Box>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        color="error.main"
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        Broken Links
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {brokenPercent}%
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        height: 8,
                                                        backgroundColor:
                                                            "grey.200",
                                                        borderRadius: 4,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: `${brokenPercent}%`,
                                                            height: "100%",
                                                            backgroundColor:
                                                                "error.main",
                                                            transition:
                                                                "width 0.3s ease",
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })()}
                            </Box>
                        </Box>

                        {/* Broken Links List */}
                        {data.results.links &&
                            data.results.links.some(
                                (link) => !link.is_accessible
                            ) && (
                                <Box sx={{ flex: 1, minHeight: 0 }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 600,
                                            mb: 2,
                                            color: "error.main",
                                        }}
                                    >
                                        Broken Links
                                    </Typography>
                                    <Box
                                        sx={{
                                            maxHeight: "200px",
                                            overflowY: "auto",
                                            pr: 1,
                                        }}
                                    >
                                        {data.results.links
                                            .filter(
                                                (link) => !link.is_accessible
                                            )
                                            .slice(0, 10)
                                            .map((link, index) => {
                                                const truncatedUrl =
                                                    link.url.length > 40
                                                        ? `${link.url.substring(
                                                              0,
                                                              37
                                                          )}...`
                                                        : link.url;

                                                return (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            p: 1.5,
                                                            mb: 1,
                                                            backgroundColor:
                                                                "grey.50",
                                                            borderRadius: 1,
                                                            border: "1px solid",
                                                            borderColor:
                                                                "grey.300",
                                                            "&:hover": {
                                                                backgroundColor:
                                                                    "grey.100",
                                                            },
                                                        }}
                                                    >
                                                        <Box
                                                            display="flex"
                                                            alignItems="center"
                                                            gap={1}
                                                            justifyContent="space-between"
                                                        >
                                                            <Tooltip
                                                                title={link.url}
                                                                arrow
                                                            >
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontFamily:
                                                                            "monospace",
                                                                        fontSize:
                                                                            "0.75rem",
                                                                        flex: 1,
                                                                        cursor: "help",
                                                                        minWidth: 0,
                                                                        overflow:
                                                                            "hidden",
                                                                        textOverflow:
                                                                            "ellipsis",
                                                                        whiteSpace:
                                                                            "nowrap",
                                                                    }}
                                                                >
                                                                    {
                                                                        truncatedUrl
                                                                    }
                                                                </Typography>
                                                            </Tooltip>
                                                            <Box
                                                                display="flex"
                                                                alignItems="center"
                                                                gap={0.5}
                                                            >
                                                                <Chip
                                                                    label={
                                                                        link.status_code
                                                                    }
                                                                    color="error"
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize:
                                                                            "0.7rem",
                                                                        minWidth:
                                                                            "auto",
                                                                        height: "18px",
                                                                    }}
                                                                />
                                                                <Chip
                                                                    label={
                                                                        link.type
                                                                    }
                                                                    color="default"
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize:
                                                                            "0.7rem",
                                                                        height: "18px",
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        {data.results.links.filter(
                                            (link) => !link.is_accessible
                                        ).length > 10 && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontStyle: "italic",
                                                    mt: 1,
                                                    display: "block",
                                                }}
                                            >
                                                ... and{" "}
                                                {data.results.links.filter(
                                                    (link) =>
                                                        !link.is_accessible
                                                ).length - 10}{" "}
                                                more broken links
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                    </CardContent>
                </Card>

                {/* Tile 3 - Header Tags */}
                <Card
                    elevation={3}
                    sx={{
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "grey.200",
                        flex: 1,
                    }}
                >
                    <CardContent
                        sx={{
                            p: 3,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: 600,
                                color: "primary.main",
                                mb: 3,
                            }}
                        >
                            Header Tags
                        </Typography>

                        <Box
                            display="grid"
                            gridTemplateColumns="1fr"
                            gap={2}
                            sx={{ flex: 1 }}
                        >
                            {[
                                {
                                    label: "H1",
                                    value: data.results.h1_count,
                                    color: "primary",
                                },
                                {
                                    label: "H2",
                                    value: data.results.h2_count,
                                    color: "secondary",
                                },
                                {
                                    label: "H3",
                                    value: data.results.h3_count,
                                    color: "info",
                                },
                                {
                                    label: "H4",
                                    value: data.results.h4_count,
                                    color: "success",
                                },
                                {
                                    label: "H5",
                                    value: data.results.h5_count,
                                    color: "warning",
                                },
                                {
                                    label: "H6",
                                    value: data.results.h6_count,
                                    color: "error",
                                },
                            ].map((header, index) => (
                                <Box
                                    key={index}
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{
                                        p: 2,
                                        backgroundColor: "grey.50",
                                        borderRadius: 2,
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {header.label} Tags
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        color={`${header.color}.main`}
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {header.value || 0}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default UrlDetails;
