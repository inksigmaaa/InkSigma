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

            // Skip publication check if already on create-publication page or invitation pages
            if (pathname === '/create-publication' || pathname?.startsWith('/invite/')) {
                setCheckingPublication(false);
                return;
            }

            // Check cache first (but allow cache to be cleared)
            const cacheKey = `publication-check-${session.user.id}`;
            const cached = sessionStorage.getItem(cacheKey);
            
            if (cached && cached !== 'false') {
                console.log('[AuthGuard] Using cached publication check result');
                setCheckingPublication(false);
                return;
            }

            // Check if user has a publication
            try {
                console.log('[AuthGuard] Checking if user has publication...');
                const pubResponse = await fetch(`http://localhost:5000/api/publications/check`, {
                    credentials: 'include',
                });

                if (pubResponse.ok) {
                    const { hasPublication } = await pubResponse.json();
                    console.log('[AuthGuard] Has publication:', hasPublication);
                    
                    // Cache the result
                    sessionStorage.setItem(cacheKey, hasPublication.toString());
                    
                    if (!hasPublication) {
                        console.log('[AuthGuard] No publication found, redirecting to create-publication');
                        router.push('/create-publication');
                        return;
                    }
                } else {
                    console.error('[AuthGuard] Failed to check publication:', pubResponse.status);
                    // If the check fails, allow access to prevent blocking the user
                }
            } catch (error) {
                console.error('[AuthGuard] Error checking publication:', error);
                // If there's an error, allow access to prevent blocking the user
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