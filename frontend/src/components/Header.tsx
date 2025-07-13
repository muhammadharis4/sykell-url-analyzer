import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Button,
} from "@mui/material";
import { Analytics, Dashboard, Add, Menu } from "@mui/icons-material";

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
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
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Sykell URL Analyzer
                </Typography>

                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Button color="inherit" startIcon={<Dashboard />}>
                        Dashboard
                    </Button>
                    <Button color="inherit" startIcon={<Add />}>
                        Add URL
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
