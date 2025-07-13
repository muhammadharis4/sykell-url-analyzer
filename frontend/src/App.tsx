import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import Header from "./components/Header";
import "./App.css";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#1976d2",
        },
        secondary: {
            main: "#dc004e",
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                }}
            >
                <Header />
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <h1>Welcome to Sykell URL Analyzer</h1>
                    <p>
                        Analyze website URLs and get detailed insights about
                        their structure and content.
                    </p>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;
