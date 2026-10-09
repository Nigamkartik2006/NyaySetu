import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
          } else {
            logout();
          }
        } catch (err) {
          console.error('[AuthContext] Session verification failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, selectedRole) => {
    const res = await authApi.login({ email, password, selectedRole });
    if (res.success && res.token && res.user) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } else {
      throw new Error(res.message || 'Login failed.');
    }
  };

  const register = async (studentData) => {
    const res = await authApi.register({ ...studentData, role: 'student' });
    if (res.success && res.token && res.user) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } else {
      throw new Error(res.message || 'Registration failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    authApi.logout().catch(() => {});
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
