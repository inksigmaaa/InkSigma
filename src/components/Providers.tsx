'use client';

import { QueryProvider } from '@/lib/providers';
import { lazy, Suspense, ReactNode } from 'react';

const AuthContextLazy = lazy(() => import('@/contexts/AuthContext').then(m => ({ default: m.AuthProvider })));
const PublicationContextLazy = lazy(() => import('@/contexts/PublicationContext').then(m => ({ default: m.PublicationProvider })));
const ArticlesContextLazy = lazy(() => import('@/contexts/ArticlesContext').then(m => ({ default: m.ArticlesProvider })));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );
}

function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthContextLazy>
        <PublicationContextLazy>
          <ArticlesContextLazy>
            {children}
          </ArticlesContextLazy>
        </PublicationContextLazy>
      </AuthContextLazy>
    </Suspense>
  );
}

export function Providers({ children, isDashboard }: { children: ReactNode; isDashboard?: boolean }) {
  return (
    <QueryProvider>
      {isDashboard ? (
        <DashboardProviders>{children}</DashboardProviders>
      ) : (
        children
      )}
    </QueryProvider>
  );
}

export { useAuth } from '@/contexts/AuthContext';
export { usePublication } from '@/contexts/PublicationContext';
export { useArticles } from '@/contexts/ArticlesContext';
