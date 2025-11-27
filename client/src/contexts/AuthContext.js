import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    // Clear token and user
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setError(null);
    setLoading(false); // Ensure we're not stuck in loading state
  }, []);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
      setError(null);
    } catch (err) {
      console.error('Failed to load user:', err);
      // Token might be invalid
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Set up API headers when token exists
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Try to get user data
      loadUser();
    } else {
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token, loadUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { email, password });

      const { token: newToken, data } = response.data;

      // Store token
      setToken(newToken);
      setUser(data.user);
      localStorage.setItem('token', newToken);

      // Set default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true };

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', userData);

      const { token: newToken, data } = response.data;

      // Store token
      setToken(newToken);
      setUser(data.user);
      localStorage.setItem('token', newToken);

      // Set default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true };

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const isAuthenticated = () => {
    return !!(user && token);
  };

  const isDoctor = () => {
    return user?.role === 'doctor';
  };

  const isNurse = () => {
    return user?.role === 'nurse';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isReceptionist = () => {
    return user?.role === 'receptionist';
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    isDoctor,
    isNurse,
    isAdmin,
    isReceptionist
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
