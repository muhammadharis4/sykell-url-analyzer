import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
} from "@mui/material";
import { Analytics, Dashboard, Add, Menu, Logout } from "@mui/icons-material";
import { addUrl } from "../services/crawls";
import { errorHandler } from "../utils/errorHandler";
import { useAuth } from "../hooks/useAuth";

/**
 * Header component with navigation and URL addition functionality
 * Provides a clean interface for adding new URLs to analyze with smart URL processing
 */
interface HeaderProps {
    onMenuClick?: () => void;
    onUrlAdded?: () => void; // Callback to refresh dashboard when URL is added
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onUrlAdded }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Smart URL processing - automatically adds protocol and handles common formats
     * @param inputUrl - Raw URL input from user
     * @returns Properly formatted URL
     */
    const processUrl = (inputUrl: string): string => {
        let processedUrl = inputUrl.trim().toLowerCase();

        // Remove common prefixes that users might add
        processedUrl = processedUrl.replace(/^(https?:\/\/)?(www\.)?/, "");

        // Add https:// prefix (more secure default)
        processedUrl = `https://www.${processedUrl}`;

        return processedUrl;
    };

    const handleAddUrl = async () => {
        if (!url.trim()) {
            errorHandler.showWarning("Please enter a URL");
            return;
        }

        // Process the URL to add proper formatting
        const processedUrl = processUrl(url);

        // Basic URL validation
        try {
            new URL(processedUrl);
        } catch {
            errorHandler.showWarning(
                "Please enter a valid domain name (e.g., example.com, google.com, github.io)"
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await addUrl(processedUrl);

            if (!response.isSuccess) {
                errorHandler.handleApiError(response, "Failed to add URL");
                return;
            }

            errorHandler.showSuccess(
                "URL added successfully and analysis started!"
            );
            setUrl("");
            setIsDialogOpen(false);

            // Notify parent component to refresh data
            if (onUrlAdded) {
                onUrlAdded();
            }
        } catch (error) {
            errorHandler.handleNetworkError(error, "add URL");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDialogClose = () => {
        if (!isSubmitting) {
            setIsDialogOpen(false);
            setUrl("");
        }
    };
    return (
        <>
            <AppBar
                position="static"
                sx={{ backgroundColor: "#1976d2", width: "100%" }}
            >
                <Toolbar sx={{ width: "100%", maxWidth: "none" }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={onMenuClick}
                        sx={{ mr: 2, display: { sm: "none" } }}
                    >
                        <Menu />
                    </IconButton>

                    <Analytics sx={{ mr: 1 }} />
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Sykell URL Analyzer
                    </Typography>

                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        <Button
                            color="inherit"
                            startIcon={<Dashboard />}
                            onClick={() => navigate("/")}
                            sx={{ textTransform: "none" }}
                        >
                            Dashboard
                        </Button>
                        <Button
                            color="inherit"
                            startIcon={<Add />}
                            onClick={() => setIsDialogOpen(true)}
                            sx={{ textTransform: "none" }}
                        >
                            Add URL
                        </Button>
                        <Button
                            color="inherit"
                            startIcon={<Logout />}
                            onClick={logout}
                            sx={{ textTransform: "none" }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Add URL Dialog */}
            <Dialog
                open={isDialogOpen}
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Add New URL
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Enter a website URL to analyze. We'll automatically add
                        https:// and www for you!
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Website URL"
                        placeholder="example.com or domain.org"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isSubmitting}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                handleAddUrl();
                            }
                        }}
                        sx={{ mt: 1 }}
                        helperText={
                            url.trim()
                                ? `Will analyze: ${processUrl(url)}`
                                : "Just enter the domain name - we'll handle the rest!"
                        }
                    />
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 2 }}>
                    <Button
                        onClick={handleDialogClose}
                        disabled={isSubmitting}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddUrl}
                        variant="contained"
                        disabled={isSubmitting || !url.trim()}
                        startIcon={
                            isSubmitting ? (
                                <CircularProgress size={16} />
                            ) : (
                                <Add />
                            )
                        }
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            px: 3,
                        }}
                    >
                        {isSubmitting ? "Adding..." : "Add URL"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Header;
