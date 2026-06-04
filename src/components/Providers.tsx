'use client';

import { QueryProvider } from '@/lib/providers';
import { ReactNode } from 'react';
import MotionProvider from '@/lib/motion/MotionProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <MotionProvider>{children}</MotionProvider>
    </QueryProvider>
  );
}

export { useAuth } from '@/contexts/AuthContext';
export { usePublication } from '@/contexts/PublicationContext';
export { useArticles } from '@/contexts/ArticlesContext';
