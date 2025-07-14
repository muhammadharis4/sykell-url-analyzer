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
    Checkbox,
    Button,
    Tooltip,
    Collapse,
} from "@mui/material";
import { 
    Refresh, 
    Search, 
    PlayArrow, 
    Stop, 
    Delete,
    SelectAll,
} from "@mui/icons-material";
import { UrlWithCrawl } from "../models/Url";
import { 
    getUrlsWithCrawls, 
    startProcessingUrls, 
    stopProcessingUrls, 
    deleteUrls,
    startUrlProcessing,
    stopUrlProcessing
} from "../services/crawls";
import { TableColumn } from "../types/Table";
import { toast } from "react-toastify";

/**
 * Dashboard component to display URLs
 * Fetches data from the API and provides basic filtering
 */
const columns: TableColumn[] = [
    { id: "select", label: "", minWidth: 50, align: "center" },
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
    { id: "actions", label: "Actions", minWidth: 120, align: "center" },
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
    
    // Selection state
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

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

    // Selection handlers
    const handleSelectAll = () => {
        if (filteredData.length === 0) return;
        
        const allIds = new Set(filteredData.map(url => url.id.toString()));
        setSelectedUrls(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedUrls(new Set());
    };

    const handleSelectUrl = (id: string) => {
        const newSelected = new Set(selectedUrls);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUrls(newSelected);
    };

    // Bulk action handlers
    const handleStartProcessing = async () => {
        if (selectedUrls.size === 0) {
            toast.warning("Please select URLs to start processing");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await startProcessingUrls(Array.from(selectedUrls));
            if (response.isSuccess) {
                toast.success(`Started processing ${selectedUrls.size} URL(s)`);
                setSelectedUrls(new Set());
                fetchData(); // Refresh data
            } else {
                toast.error(response.error || "Failed to start processing");
            }
        } catch (error) {
            console.error("Failed to start processing URLs:", error);
            toast.error("Failed to start processing URLs");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStopProcessing = async () => {
        if (selectedUrls.size === 0) {
            toast.warning("Please select URLs to stop processing");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await stopProcessingUrls(Array.from(selectedUrls));
            if (response.isSuccess) {
                toast.success(`Stopped processing ${selectedUrls.size} URL(s)`);
                setSelectedUrls(new Set());
                fetchData(); // Refresh data
            } else {
                toast.error(response.error || "Failed to stop processing");
            }
        } catch (error) {
            console.error("Failed to stop processing URLs:", error);
            toast.error("Failed to stop processing URLs");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteUrls = async () => {
        if (selectedUrls.size === 0) {
            toast.warning("Please select URLs to delete");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedUrls.size} URL(s)? This action cannot be undone.`)) {
            return;
        }

        setIsProcessing(true);
        try {
            const response = await deleteUrls(Array.from(selectedUrls));
            if (response.isSuccess) {
                toast.success(`Deleted ${selectedUrls.size} URL(s)`);
                setSelectedUrls(new Set());
                fetchData(); // Refresh data
            } else {
                toast.error(response.error || "Failed to delete URLs");
            }
        } catch (error) {
            console.error("Failed to delete URLs:", error);
            toast.error("Failed to delete URLs");
        } finally {
            setIsProcessing(false);
        }
    };

    // Individual URL control handlers
    const handleStartUrl = async (urlId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent row click navigation
        
        try {
            const response = await startUrlProcessing(urlId);
            if (response.isSuccess) {
                toast.success("Started processing URL");
                fetchData(); // Refresh data
            } else {
                toast.error(response.error || "Failed to start processing URL");
            }
        } catch (error) {
            console.error("Failed to start URL processing:", error);
            toast.error("Failed to start processing URL");
        }
    };

    const handleStopUrl = async (urlId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent row click navigation
        
        try {
            const response = await stopUrlProcessing(urlId);
            if (response.isSuccess) {
                toast.success("Stopped processing URL");
                fetchData(); // Refresh data
            } else {
                toast.error(response.error || "Failed to stop processing URL");
            }
        } catch (error) {
            console.error("Failed to stop URL processing:", error);
            toast.error("Failed to stop processing URL");
        }
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

    // Calculate selection stats
    const isAllSelected = filteredData.length > 0 && selectedUrls.size === filteredData.length;
    const isIndeterminate = selectedUrls.size > 0 && selectedUrls.size < filteredData.length;
    const selectedCount = selectedUrls.size;

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
                        {selectedCount > 0 && (
                            <Typography variant="caption" sx={{ ml: 2, color: "primary.main" }}>
                                {selectedCount} selected
                            </Typography>
                        )}
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

                {/* Bulk actions toolbar */}
                <Collapse in={selectedCount > 0}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 2,
                            py: 1,
                            bgcolor: "action.selected",
                            borderBottom: 1,
                            borderColor: "divider",
                        }}
                    >
                        <Tooltip title="Start Processing">
                            <span>
                                <Button
                                    size="small"
                                    startIcon={<PlayArrow />}
                                    onClick={handleStartProcessing}
                                    disabled={isProcessing}
                                    sx={{ textTransform: "none" }}
                                >
                                    Start
                                </Button>
                            </span>
                        </Tooltip>
                        <Tooltip title="Stop Processing">
                            <span>
                                <Button
                                    size="small"
                                    startIcon={<Stop />}
                                    onClick={handleStopProcessing}
                                    disabled={isProcessing}
                                    sx={{ textTransform: "none" }}
                                >
                                    Stop
                                </Button>
                            </span>
                        </Tooltip>
                        <Tooltip title="Delete URLs">
                            <span>
                                <Button
                                    size="small"
                                    startIcon={<Delete />}
                                    onClick={handleDeleteUrls}
                                    disabled={isProcessing}
                                    color="error"
                                    sx={{ textTransform: "none" }}
                                >
                                    Delete
                                </Button>
                            </span>
                        </Tooltip>
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip title="Select All">
                            <IconButton size="small" onClick={handleSelectAll}>
                                <SelectAll />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Deselect All">
                            <IconButton size="small" onClick={handleDeselectAll}>
                                <Checkbox 
                                    indeterminate={isIndeterminate}
                                    checked={isAllSelected}
                                    onChange={() => isAllSelected ? handleDeselectAll() : handleSelectAll()}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Collapse>

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
                                        {column.id === "select" ? (
                                            <Checkbox
                                                indeterminate={isIndeterminate}
                                                checked={isAllSelected}
                                                onChange={() => isAllSelected ? handleDeselectAll() : handleSelectAll()}
                                                disabled={filteredData.length === 0}
                                            />
                                        ) : (
                                            column.label
                                        )}
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
                                    .map((row) => {
                                        const isSelected = selectedUrls.has(row.id.toString());
                                        return (
                                            <TableRow
                                                hover
                                                key={row.id}
                                                selected={isSelected}
                                                sx={{ cursor: "pointer" }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectUrl(row.id.toString());
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell 
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {row.url}
                                                </TableCell>
                                                <TableCell 
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {row.title || "-"}
                                                </TableCell>
                                                <TableCell 
                                                    align="center"
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {getStatusChip(row.status)}
                                                </TableCell>
                                                <TableCell 
                                                    align="center"
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {row.html_version || "-"}
                                                </TableCell>
                                                <TableCell 
                                                    align="right"
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {row.internal_links || "-"}
                                                </TableCell>
                                                <TableCell 
                                                    align="right"
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {row.external_links || "-"}
                                                </TableCell>
                                                <TableCell 
                                                    align="right"
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {row.broken_links || "-"}
                                                </TableCell>
                                                <TableCell 
                                                    onClick={() => navigate(`/url/${row.id}`)}
                                                >
                                                    {formatDate(row.created_at)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                                        {row.status === "running" ? (
                                                            <Tooltip title="Stop Processing">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={(e) => handleStopUrl(row.id.toString(), e)}
                                                                >
                                                                    <Stop />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="Start Processing">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={(e) => handleStartUrl(row.id.toString(), e)}
                                                                    disabled={row.status === "error"}
                                                                >
                                                                    <PlayArrow />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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
