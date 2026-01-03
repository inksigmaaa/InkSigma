"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signUp, signOut } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
  emailVerified?: boolean;
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
  const { data: session, isPending: loading, error } = useSession();
  const user = session?.user || null;

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await signIn.email({
        email: credentials.email,
        password: credentials.password,
      });
      return result;
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    try {
      const result = await signUp.email({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });
      return result;
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err: any) {
      throw new Error(err.message || 'Logout failed');
    }
  };

  const refreshSession = async () => {
    // Better Auth handles session refresh automatically
    // This is kept for compatibility with existing code
  };

  const value = {
    user,
    loading,
    error: error?.message || null,
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
