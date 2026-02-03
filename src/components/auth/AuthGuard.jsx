"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { getApiBase } from '@/utils/apiBase';

export default function AuthGuard({ children }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authTimeout, setAuthTimeout] = useState(false);
    const hasCheckedRef = useRef(false);
    const lastUserIdRef = useRef(null);

    useEffect(() => {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (!isAuthorized && !authTimeout) {
                console.warn('[AuthGuard] Auth check timed out, proceeding anyway');
                setAuthTimeout(true);
                setIsAuthorized(true); // Allow access to prevent infinite loading
            }
        }, 10000); // 10 second timeout

        const checkAuth = async () => {
            // Wait for session to be determined
            if (isPending) return;

            if (!session?.user) {
                console.log('[AuthGuard] No session, redirecting to login');
                router.push('/login');
                clearTimeout(timeoutId);
                return;
            }

            // If we've already checked for this user, skip
            if (hasCheckedRef.current && lastUserIdRef.current === session.user.id) {
                setIsAuthorized(true);
                return;
            }

            // Skip publication check if already on create-publication page or invitation pages
            if (pathname === '/create-publication' || pathname?.startsWith('/invite/')) {
                setIsAuthorized(true);
                hasCheckedRef.current = true;
                lastUserIdRef.current = session.user.id;
                return;
            }

            // Check cache first
            const cacheKey = `publication-check-${session.user.id}`;
            const cached = sessionStorage.getItem(cacheKey);
            
            if (cached === 'true') {
                console.log('[AuthGuard] Using cached publication check result');
                setIsAuthorized(true);
                hasCheckedRef.current = true;
                lastUserIdRef.current = session.user.id;
                return;
            }

            // Check if user has a publication
            try {
                console.log('[AuthGuard] Checking if user has publication...');
                const pubResponse = await fetch(`${getApiBase()}/api/publications/check`, {
                    credentials: 'include',
                });

                if (!pubResponse.ok) {
                    console.error('[AuthGuard] Failed to check publication:', pubResponse.status);
                    router.push('/create-publication');
                    return;
                }

                const { hasPublication } = await pubResponse.json();
                console.log('[AuthGuard] Has publication:', hasPublication);
                
                // Cache the result
                sessionStorage.setItem(cacheKey, hasPublication.toString());
                
                if (!hasPublication) {
                    console.log('[AuthGuard] No publication found, redirecting to create-publication');
                    router.push('/create-publication');
                    return;
                }
            } catch (error) {
                console.error('[AuthGuard] Error checking publication:', error);
                router.push('/create-publication');
                return;
            }

            setIsAuthorized(true);
            hasCheckedRef.current = true;
            lastUserIdRef.current = session.user.id;
            clearTimeout(timeoutId);
        };

        checkAuth();

        return () => clearTimeout(timeoutId);
    }, [session, isPending, pathname, router, authTimeout, isAuthorized]);

    // Show loading only on initial auth check, not on navigation
    if (isPending || (!isAuthorized && !hasCheckedRef.current)) {
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
