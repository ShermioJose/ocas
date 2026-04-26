import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleAuthChange = () => {
            if (!localStorage.getItem('token')) {
                setToken(null);
                setUser(null);
            }
        };

        window.addEventListener('auth_changed', handleAuthChange);
        
        const verifyToken = async () => {
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    if(res.data.success) {
                        setUser(res.data.user);
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                    }
                } catch (e) {
                    // Axios interceptor will handle 401
                }
            }
            setLoading(false);
        };

        verifyToken();

        return () => window.removeEventListener('auth_changed', handleAuthChange);
    }, [token]);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', jwtToken);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // Ignore error on logout
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            window.location.href = '/login';
        }
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAdmin, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
