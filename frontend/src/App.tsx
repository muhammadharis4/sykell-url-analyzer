import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import UrlDetails from "./components/UrlDetails";
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
            <Router>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "100vh",
                    }}
                >
                    <Header />
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            minHeight: 0,
                        }}
                    >
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/url/:id" element={<UrlDetails />} />
                        </Routes>
                    </Box>
                </Box>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </Router>
        </ThemeProvider>
    );
}

export default App;
