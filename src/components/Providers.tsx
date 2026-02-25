'use client';

import { QueryProvider } from '@/lib/providers';
import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicationProvider } from '@/contexts/PublicationContext';
import { ArticlesProvider } from '@/contexts/ArticlesContext';

function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PublicationProvider>
        <ArticlesProvider>
          {children}
        </ArticlesProvider>
      </PublicationProvider>
    </AuthProvider>
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
