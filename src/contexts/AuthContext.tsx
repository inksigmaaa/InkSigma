'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (isPending) return;
    setUser(session?.user || null);
    setLoading(false);
  }, [session, isPending]);

  const login = async (credentials: any) => {
    const { signIn } = await import('@/lib/auth-client');
    const result = await signIn.email({
      email: credentials.email,
      password: credentials.password,
    });
    if (result.error) throw new Error(result.error.message);
    await refetch();
    return result.data;
  };

  const register = async (userData: any) => {
    const { signUp } = await import('@/lib/auth-client');
    const result = await signUp.email({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
    if (result.error) throw new Error(result.error.message);
    await refetch();
    return result.data;
  };

  const logout = async () => {
    const { signOut } = await import('@/lib/auth-client');
    await signOut();
    setUser(null);
  };

  const refreshSession = () => {
    refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || isPending,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
