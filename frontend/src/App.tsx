import { useState } from "react";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import UrlDetails from "./components/UrlDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
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
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleUrlAdded = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <ProtectedRoute>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                height: "100vh",
                                minHeight: 0,
                            }}
                        >
                            <Header onUrlAdded={handleUrlAdded} />
                            <Box
                                component="main"
                                sx={{
                                    flex: "1 1 auto",
                                    p: 3,
                                    display: "flex",
                                    flexDirection: "column",
                                    minHeight: 0,
                                    height: "100%",
                                }}
                            >
                                <Routes>
                                    <Route
                                        path="/"
                                        element={
                                            <Dashboard
                                                refreshTrigger={refreshTrigger}
                                            />
                                        }
                                    />
                                    <Route
                                        path="/url/:id"
                                        element={<UrlDetails />}
                                    />
                                </Routes>
                            </Box>
                        </Box>
                    </ProtectedRoute>
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
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
