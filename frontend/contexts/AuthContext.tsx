'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export type UserRole = 'admin' | 'reviewer' | 'analyst';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Set language header
          const language = localStorage.getItem('language') || 'en';
          axios.defaults.headers.common['Accept-Language'] = language;
        } catch (err) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
        email,
        password,
        role,
      }, {
        headers: {
          'Accept-Language': localStorage.getItem('language') || 'en',
        },
      });

      const { access_token, user: userData } = response.data;
      
      // Store token and user
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      axios.defaults.headers.common['Accept-Language'] = localStorage.getItem('language') || 'en';
      
      setUser(userData);
      setSelectedRole(role);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setSelectedRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        selectedRole,
        setSelectedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
