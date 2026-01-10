"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

export default function AuthGuard({ children }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [checkingPublication, setCheckingPublication] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // Wait for session to be determined
            if (isPending) return;

            if (!session?.user) {
                console.log('[AuthGuard] No session, redirecting to login');
                router.push('/login');
                return;
            }

            // Skip publication check if already on create-publication page
            if (pathname === '/create-publication') {
                setCheckingPublication(false);
                return;
            }

            // Check if user has a publication
            try {
                const pubResponse = await fetch(`http://localhost:5000/api/publications/check`, {
                    credentials: 'include',
                });

                if (pubResponse.ok) {
                    const { hasPublication } = await pubResponse.json();
                    if (!hasPublication) {
                        router.push('/create-publication');
                        return;
                    }
                }
            } catch (error) {
                console.error('[AuthGuard] Error checking publication:', error);
            }

            setCheckingPublication(false);
        };

        checkAuth();
    }, [session, isPending, pathname, router]);

    // Show loading while checking authentication or publication
    if (isLoading || checkingPublication) {
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