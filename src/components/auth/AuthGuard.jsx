"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }) {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [checkingPublication, setCheckingPublication] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoading(true);
                
                // Fetch session from better-auth
                const response = await fetch('http://localhost:5000/api/auth/get-session', {
                    credentials: 'include',
                    cache: 'no-store',
                });

                console.log('[AuthGuard] Session response:', response.status);

                if (!response.ok) {
                    console.log('[AuthGuard] No session, redirecting to login');
                    router.push('/login');
                    return;
                }

                const data = await response.json();
                console.log('[AuthGuard] Session data:', data);
                
                if (!data?.user) {
                    console.log('[AuthGuard] No user in session, redirecting to login');
                    router.push('/login');
                    return;
                }

                setSession(data);

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
            } catch (error) {
                console.error('[AuthGuard] Error checking auth:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

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