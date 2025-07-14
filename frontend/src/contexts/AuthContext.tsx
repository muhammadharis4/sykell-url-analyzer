import React, { useState, useEffect } from 'react';
import { AuthContext } from '../hooks/useAuth';

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token in localStorage
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
            // Verify token with backend
            verifyToken(savedToken).then(isValid => {
                if (isValid) {
                    setToken(savedToken);
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('auth_token');
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async (token: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                const newToken = data.token;
                
                setToken(newToken);
                setIsAuthenticated(true);
                localStorage.setItem('auth_token', newToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const logout = async () => {
        if (token) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.error('Logout request failed:', error);
            }
        }

        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('auth_token');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            token,
            login,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
