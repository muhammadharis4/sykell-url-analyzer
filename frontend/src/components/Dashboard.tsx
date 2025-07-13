import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Toolbar,
    Typography,
    TextField,
    Box,
    Chip,
    IconButton,
    CircularProgress,
} from "@mui/material";
import { Refresh, Search } from "@mui/icons-material";
import { UrlWithCrawl } from "../models/Url";
import { getUrlsWithCrawls } from "../services/crawls";
import { TableColumn } from "../types/Table";
import { toast } from "react-toastify";

/**
 * Dashboard component to display URLs
 * Fetches data from the API and provides basic filtering
 */
const columns: TableColumn[] = [
    { id: "url", label: "URL", minWidth: 200 },
    { id: "title", label: "Title", minWidth: 150 },
    { id: "status", label: "Status", minWidth: 100, align: "center" },
    {
        id: "html_version",
        label: "HTML Version",
        minWidth: 100,
        align: "center",
    },
    {
        id: "internal_links",
        label: "Internal Links",
        minWidth: 120,
        align: "right",
    },
    {
        id: "external_links",
        label: "External Links",
        minWidth: 120,
        align: "right",
    },
    {
        id: "broken_links",
        label: "Broken Links",
        minWidth: 120,
        align: "right",
    },
    { id: "created_at", label: "Created", minWidth: 120 },
];

/**
 * Dashboard component to display URLs
 */
interface DashboardProps {
    refreshTrigger?: number; // Optional prop to trigger refresh
}

const Dashboard: React.FC<DashboardProps> = ({ refreshTrigger }) => {
    const navigate = useNavigate();
    // State for data - null represents data not fetched, array represents fetched data (empty or with items)
    const [data, setData] = useState<UrlWithCrawl[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Polling state
    const [isPolling, setIsPolling] = useState(false);
    const pollingIntervalRef = useRef<number | null>(null);

    // Check if there are any URLs in "running" status
    const hasRunningUrls =
        data?.some((url) => url.status === "running") || false;

    // Fetch data from API (silent version for polling)
    const fetchDataSilent = async () => {
        const response = await getUrlsWithCrawls();
        if (response.isSuccess) {
            setData(response.data.urls);
        }
    };

    // Fetch data from API
    const fetchData = async () => {
        setLoading(true);

        const response = await getUrlsWithCrawls();

        if (response.isSuccess) {
            setData(response.data.urls);
        } else {
            toast.error("Failed to fetch crawl data");
            setData(null);
        }

        setLoading(false);
    };

    // Load data on component mount
    useEffect(() => {
        if (data === null) fetchData();
    }, [data]);

    // Handle refresh trigger from parent component
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            fetchData();
        }
    }, [refreshTrigger]);

    // Polling effect for running URLs
    useEffect(() => {
        // Start polling if there are running URLs and not already polling
        if (hasRunningUrls && !isPolling) {
            setIsPolling(true);
            pollingIntervalRef.current = window.setInterval(() => {
                fetchDataSilent();
            }, 3000); // Poll every 3 seconds
        }

        // Stop polling if no running URLs or component unmounts
        if (!hasRunningUrls && isPolling) {
            setIsPolling(false);
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }

        // Cleanup on unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [hasRunningUrls, isPolling]);

    // Handle refresh
    const handleRefresh = () => {
        fetchData();
    };

    // Filter data
    const filteredData = (() => {
        if (!data) return [];

        return data.filter(
            (row: UrlWithCrawl) =>
                row.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    })();

    // Helper functions for rendering
    const getStatusChip = (status: UrlWithCrawl["status"]) => {
        const statusConfig = {
            queued: { color: "default" as const, label: "Queued" },
            running: { color: "primary" as const, label: "Running" },
            completed: { color: "success" as const, label: "Completed" },
            error: { color: "error" as const, label: "Error" },
        };

        const config = statusConfig[status];
        return <Chip size="small" color={config.color} label={config.label} />;
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Determine what to show based on data state
    const getDisplayContent = () => {
        if (data === null && !loading) {
            return "Data not loaded. Click refresh to load.";
        }
        if (loading) {
            return "Loading URLs...";
        }
        if (data && data.length === 0) {
            return "No URLs have been added yet. Add a URL to start analyzing.";
        }
        if (filteredData.length === 0 && data && data.length > 0) {
            return "No URLs match your search criteria.";
        }
        return null; // Show table
    };

    const displayMessage = getDisplayContent();

    return (
        <Box sx={{ width: "100%" }}>
            <Paper
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
                    <Typography
                        sx={{ flex: "1 1 100%" }}
                        variant="h6"
                        component="div"
                    >
                        URL Analysis Dashboard
                    </Typography>

                    {/* Polling indicator */}
                    {isPolling && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                mr: 2,
                            }}
                        >
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            <Typography variant="caption" color="primary">
                                Auto-updating...
                            </Typography>
                        </Box>
                    )}

                    <IconButton
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Refresh"
                    >
                        <Refresh />
                    </IconButton>
                </Toolbar>

                <Box sx={{ p: 2, pb: 0 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search URLs, titles, or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <Search
                                    sx={{ mr: 1, color: "text.secondary" }}
                                />
                            ),
                        }}
                    />
                </Box>

                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayMessage ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        align="center"
                                        sx={{ py: 8 }}
                                    >
                                        {loading && (
                                            <CircularProgress sx={{ mb: 2 }} />
                                        )}
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: loading
                                                    ? "text.primary"
                                                    : "text.secondary",
                                                fontStyle: loading
                                                    ? "normal"
                                                    : "italic",
                                            }}
                                        >
                                            {displayMessage}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData
                                    .slice(
                                        page * rowsPerPage,
                                        page * rowsPerPage + rowsPerPage
                                    )
                                    .map((row) => (
                                        <TableRow
                                            hover
                                            key={row.id}
                                            onClick={() =>
                                                navigate(`/url/${row.id}`)
                                            }
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell>{row.url}</TableCell>
                                            <TableCell>
                                                {row.title || "-"}
                                            </TableCell>
                                            <TableCell align="center">
                                                {getStatusChip(row.status)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {row.html_version || "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.internal_links || "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.external_links || "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.broken_links || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(row.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>
        </Box>
    );
};

export default Dashboard;
