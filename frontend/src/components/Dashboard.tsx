import { useState, useMemo, useEffect } from "react";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    Toolbar,
    Typography,
    TextField,
    Box,
    Chip,
    IconButton,
    Checkbox,
    Button,
    CircularProgress,
    Alert,
} from "@mui/material";
import { Visibility, Refresh, Delete, Search } from "@mui/icons-material";
import { URL, SortOrder, TableColumn } from "../types";
import { getUrls } from "../services/api";

/**
 * Dashboard component to display and manage URLs
 * Fetches data from the API and provides sorting, filtering, and pagination
 */
const columns: TableColumn[] = [
    { id: "url", label: "URL", minWidth: 200, sortable: true },
    { id: "title", label: "Title", minWidth: 150, sortable: true },
    {
        id: "status",
        label: "Status",
        minWidth: 100,
        align: "center",
        sortable: true,
    },
    {
        id: "htmlVersion",
        label: "HTML Version",
        minWidth: 100,
        align: "center",
        sortable: true,
    },
    {
        id: "internalLinksCount",
        label: "Internal Links",
        minWidth: 120,
        align: "right",
        sortable: true,
    },
    {
        id: "externalLinksCount",
        label: "External Links",
        minWidth: 120,
        align: "right",
        sortable: true,
    },
    {
        id: "inaccessibleLinksCount",
        label: "Broken Links",
        minWidth: 120,
        align: "right",
        sortable: true,
    },
    { id: "created_at", label: "Created", minWidth: 120, sortable: true },
    { id: "actions", label: "Actions", minWidth: 120, align: "center" },
];

/**
 * Dashboard component to display and manage URLs
 * Fetches data from the API and provides sorting, filtering, and pagination
 */
const Dashboard = () => {
    // State for data - will be populated from API call to http://localhost:8080/api/urls
    const [data, setData] = useState<URL[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState<string>("created_at");
    const [order, setOrder] = useState<SortOrder>("desc");
    const [searchTerm, setSearchTerm] = useState("");
    const [selected, setSelected] = useState<number[]>([]);

    // Fetch data from API
    const fetchData = async () => {
        setLoading(true);
        setError(null);

        const response = await getUrls();

        if (response.isSuccess) {
            setData(response.data.urls);
        } else {
            setError(`Failed to fetch URLs: ${response.status}`);
        }

        setLoading(false);
    };

    // Load data on component mount
    useEffect(() => {
        fetchData();
    }, []);

    // Handle refresh
    const handleRefresh = () => {
        fetchData();
    };

    // Sorting and filtering logic
    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    // Handle select all click
    const handleSelectAllClick = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (event.target.checked) {
            const newSelected = filteredData.map((n: URL) => n.id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    // Handle row click
    const handleClick = (id: number) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: number[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }
        setSelected(newSelected);
    };

    // Filter and sort data
    const filteredData = useMemo(() => {
        return data.filter(
            (row: URL) =>
                row.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.result?.title
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                row.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, data]);

    // Sort filtered data
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            let aValue: string | number = "";
            let bValue: string | number = "";

            // Handle specific result properties
            switch (orderBy) {
                case "title":
                    aValue = a.result?.title || "";
                    bValue = b.result?.title || "";
                    break;
                case "htmlVersion":
                    aValue = a.result?.htmlVersion || "";
                    bValue = b.result?.htmlVersion || "";
                    break;
                case "internalLinksCount":
                    aValue = a.result?.internalLinksCount || 0;
                    bValue = b.result?.internalLinksCount || 0;
                    break;
                case "externalLinksCount":
                    aValue = a.result?.externalLinksCount || 0;
                    bValue = b.result?.externalLinksCount || 0;
                    break;
                case "inaccessibleLinksCount":
                    aValue = a.result?.inaccessibleLinksCount || 0;
                    bValue = b.result?.inaccessibleLinksCount || 0;
                    break;
                default:
                    // Handle direct URL properties
                    aValue =
                        (a as unknown as Record<string, string | number>)[
                            orderBy
                        ] || "";
                    bValue =
                        (b as unknown as Record<string, string | number>)[
                            orderBy
                        ] || "";
            }

            if (typeof aValue === "string" && typeof bValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (bValue < aValue) {
                return order === "desc" ? -1 : 1;
            }
            if (bValue > aValue) {
                return order === "desc" ? 1 : -1;
            }
            return 0;
        });
    }, [filteredData, order, orderBy]);

    // Paginate sorted data
    const paginatedData = useMemo(() => {
        return sortedData.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [sortedData, page, rowsPerPage]);

    // Helper functions for rendering
    const getStatusChip = (status: URL["status"]) => {
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

    // Check if a row is selected
    const isSelected = (id: number) => selected.indexOf(id) !== -1;
    const numSelected = selected.length;
    const rowCount = filteredData.length;

    return (
        <Box sx={{ width: "100%", height: "100%" }}>
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            <Paper
                sx={{
                    width: "100%",
                    height: "100%",
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
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <IconButton
                            onClick={handleRefresh}
                            disabled={loading}
                            title="Refresh"
                        >
                            <Refresh />
                        </IconButton>
                        {numSelected > 0 && (
                            <>
                                <Button
                                    size="small"
                                    startIcon={<Refresh />}
                                    onClick={() =>
                                        console.log(
                                            "Re-analyze not implemented yet"
                                        )
                                    }
                                    disabled
                                >
                                    Re-analyze ({numSelected})
                                </Button>
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<Delete />}
                                    onClick={() =>
                                        console.log(
                                            "Delete not implemented yet"
                                        )
                                    }
                                    disabled
                                >
                                    Delete ({numSelected})
                                </Button>
                            </>
                        )}
                    </Box>
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

                <TableContainer sx={{ flexGrow: 1, overflow: "auto" }}>
                    <Table stickyHeader sx={{ height: "100%" }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={
                                            numSelected > 0 &&
                                            numSelected < rowCount
                                        }
                                        checked={
                                            rowCount > 0 &&
                                            numSelected === rowCount
                                        }
                                        onChange={handleSelectAllClick}
                                        disabled={loading}
                                    />
                                </TableCell>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                    >
                                        {column.sortable ? (
                                            <TableSortLabel
                                                active={orderBy === column.id}
                                                direction={
                                                    orderBy === column.id
                                                        ? order
                                                        : "asc"
                                                }
                                                onClick={() =>
                                                    handleRequestSort(
                                                        column.id as keyof URL
                                                    )
                                                }
                                                disabled={loading}
                                            >
                                                {column.label}
                                            </TableSortLabel>
                                        ) : (
                                            column.label
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow style={{ height: 53 * rowsPerPage }}>
                                    <TableCell
                                        colSpan={columns.length + 1}
                                        align="center"
                                        sx={{ py: 8 }}
                                    >
                                        <CircularProgress />
                                        <Typography
                                            variant="body2"
                                            sx={{ mt: 2 }}
                                        >
                                            Loading URLs...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((row) => {
                                    const isItemSelected = isSelected(row.id);
                                    return (
                                        <TableRow
                                            hover
                                            key={row.id}
                                            selected={isItemSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    checked={isItemSelected}
                                                    onChange={() =>
                                                        handleClick(row.id)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>{row.url}</TableCell>
                                            <TableCell>
                                                {row.result?.title || "-"}
                                            </TableCell>
                                            <TableCell align="center">
                                                {getStatusChip(row.status)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {row.result?.htmlVersion || "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.result
                                                    ?.internalLinksCount || "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.result
                                                    ?.externalLinksCount || "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.result
                                                    ?.inaccessibleLinksCount ||
                                                    "-"}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(row.created_at)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        console.log(
                                                            "View details",
                                                            row.id
                                                        )
                                                    }
                                                    disabled={
                                                        row.status !==
                                                        "completed"
                                                    }
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        console.log(
                                                            "Re-analyze not implemented yet"
                                                        )
                                                    }
                                                    disabled
                                                >
                                                    <Refresh />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        console.log(
                                                            "Delete not implemented yet"
                                                        )
                                                    }
                                                    disabled
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow style={{ height: 53 * rowsPerPage }}>
                                    <TableCell
                                        colSpan={columns.length + 1}
                                        align="center"
                                        sx={{
                                            py: 8,
                                            color: "text.secondary",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        {data.length === 0
                                            ? "No URLs have been added yet. Add a URL to start analyzing."
                                            : "No URLs match your search criteria."}
                                    </TableCell>
                                </TableRow>
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
