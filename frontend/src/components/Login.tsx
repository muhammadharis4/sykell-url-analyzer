import React, { useState } from "react";
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Container,
} from "@mui/material";
import { Lock } from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";

const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const success = await login(username, password);
            if (!success) {
                setError("Invalid username or password");
            }
        } catch {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minHeight: "80vh",
                    justifyContent: "center",
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: "primary.main",
                            color: "white",
                            p: 1,
                            borderRadius: "50%",
                            mb: 2,
                        }}
                    >
                        <Lock />
                    </Box>

                    <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                        Sign In
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, textAlign: "center" }}
                    >
                        Sykell URL Analyzer
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ width: "100%" }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading || !username || !password}
                        >
                            {loading ? (
                                <CircularProgress size={24} />
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </Box>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2, textAlign: "center" }}
                    >
                        Default credentials: admin / admin
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
