"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authService } from '@/services/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (userData: { name: string; email: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionLoadedRef = useRef(false);

  // Load current session on mount only once
  useEffect(() => {
    // Prevent multiple session loads
    if (sessionLoadedRef.current) return;
    sessionLoadedRef.current = true;

    const loadSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/get-session`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data?.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/get-session`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data?.user || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshSession,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
