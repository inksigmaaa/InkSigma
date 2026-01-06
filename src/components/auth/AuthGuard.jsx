"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

export default function AuthGuard({ children }) {
    const { data: session, isLoading } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !session?.user) {
            router.push('/login');
        }
    }, [session, isLoading, router]);

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!session?.user) {
        return null;
    }

    return children;
}