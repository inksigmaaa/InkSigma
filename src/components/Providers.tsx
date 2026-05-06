'use client';

import { QueryProvider } from '@/lib/providers';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}

export { useAuth } from '@/contexts/AuthContext';
export { usePublication } from '@/contexts/PublicationContext';
export { useArticles } from '@/contexts/ArticlesContext';
