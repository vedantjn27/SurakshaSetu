'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import '@/lib/i18n';
import axios from 'axios';

export type UserRole = 'admin' | 'reviewer' | 'analyst';

interface User {
  username: string;
  email?: string;
  role: UserRole;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, role: UserRole) => Promise<void>;
  register: (username: string, password: string, fullName: string, email: string) => Promise<string>;
  logout: () => void;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const login = async (username: string, password: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);

    try {
      // OAuth2PasswordRequestForm requires form-encoded body
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(
        `${API}/api/v1/auth/login`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Language': localStorage.getItem('language') || 'en',
          },
        }
      );

      const { access_token, role: serverRole } = response.data;

      // Fetch full user profile
      const meResponse = await axios.get(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userData: User = {
        username: meResponse.data.username,
        email: meResponse.data.email,
        role: meResponse.data.role as UserRole,
        full_name: meResponse.data.full_name,
      };

      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      document.cookie = `authToken=${access_token}; path=/; max-age=86400; SameSite=Lax`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      axios.defaults.headers.common['Accept-Language'] = localStorage.getItem('language') || 'en';

      setUser(userData);
      setSelectedRole(userData.role);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Login failed. Check your username and password.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    password: string,
    fullName: string,
    email: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API}/api/v1/auth/register`, {
        username,
        password,
        role: 'analyst',
        full_name: fullName || undefined,
        email: email || undefined,
      });
      return response.data.message;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    document.cookie = 'authToken=; path=/; max-age=0; SameSite=Lax';
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
        register,
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
