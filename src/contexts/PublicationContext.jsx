"use client";

import { createContext, useContext, useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { memberService } from '@/services/memberService';
import { publicationService } from '@/services/publicationService';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const PublicationContext = createContext();

function PublicationProviderInner({ children }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userPublications, setUserPublications] = useState([]);
  const [currentPublication, setCurrentPublication] = useState(null);
  const [publicationDetails, setPublicationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentPubRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentPubRef.current = currentPublication;
  }, [currentPublication]);

  // Helper function to determine if we're on member dashboard routes
  const isMemberDashboard = () => {
    return pathname?.startsWith('/posts/');
  };

  // Get publication ID from URL params
  const getPublicationIdFromUrl = () => {
    return searchParams?.get('pub') ? parseInt(searchParams.get('pub')) : null;
  };

  // Load user's publications (owned + joined)
  const loadUserPublications = useCallback(async (silent = false) => {
    if (!session?.user?.id || isPending) {
      if (!isPending) {
        setLoading(false);
      }
      return;
    }

    // Only fetch on client side
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      
      // Add retry logic for network errors
      let retries = 3;
      let data = null;
      let lastError = null;
      
      while (retries > 0) {
        try {
          data = await memberService.getUserPublications();
          console.log('[PublicationContext] Successfully loaded publications:', data);
          break; // Success - exit retry loop
        } catch (err) {
          lastError = err;
          retries--;
          
          console.error(`[PublicationContext] Failed to load publications (${retries} retries left):`, {
            message: err.message,
            type: err.constructor.name,
            stack: err.stack
          });
          
          if (retries > 0) {
            console.warn(`[PublicationContext] Retrying in ${1000 * (4 - retries)}ms...`);
            // Wait before retrying (exponential backoff: 1s, 2s, 3s)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          }
        }
      }
      
      // If all retries failed, throw the last error
      if (lastError && !data) {
        throw lastError;
      }
      
      // Backend returns either array (legacy) or object with publications array (new)
      const publications = Array.isArray(data) ? data : (data.publications || []);
      
      // Check if user was removed from current publication (for joined publications only)
      const currentPub = currentPubRef.current;
      if (currentPub && !currentPub.isOwner) {
        const stillHasAccess = publications.find(pub => pub.id === currentPub.id);
        if (!stillHasAccess) {
          // User was removed from this publication, redirect to dashboard
          console.log('[PublicationContext] User removed from publication, redirecting to dashboard');
          setCurrentPublication(null);
          setPublicationDetails(null);
          setUserPublications(publications);
          setLoading(false);
          // Use window.location for a full page redirect to ensure clean state
          window.location.href = '/dashboard';
          return;
        }
      }
      
      setUserPublications(publications);
      
      // Set current publication based on context
      if (publications.length > 0) {
        // Only set initial publication if none is set
        if (!currentPublication) {
          let pubToSet = null;
          
          // Check if we have a publication ID from URL
          const urlPubId = getPublicationIdFromUrl();
          if (urlPubId) {
            // Try to find the URL publication (could be owned or joined)
            pubToSet = publications.find(pub => pub.id === urlPubId);
          }
          
          // If no URL publication found, use route-based logic
          if (!pubToSet) {
            if (isMemberDashboard()) {
              // On member dashboard, prioritize joined publications
              const joinedPub = publications.find(pub => !pub.isOwner);
              pubToSet = joinedPub || publications.find(pub => pub.isOwner) || publications[0];
            } else {
              // On admin dashboard, prioritize owned publications
              const ownedPub = publications.find(pub => pub.isOwner);
              pubToSet = ownedPub || publications[0];
            }
          }
          
          if (pubToSet) {
            setCurrentPublication(pubToSet);
            
            // Try to load full details, but don't fail if it doesn't work
            try {
              await loadPublicationDetails(pubToSet.id);
            } catch (detailsError) {
              console.warn('Failed to load publication details, continuing without them:', detailsError);
            }
          }
        } else {
          // If current publication exists, make sure it's still valid
          const stillExists = publications.find(pub => pub.id === currentPublication.id);
          if (!stillExists) {
            // Current publication no longer exists, set a new one using same logic as above
            let pubToSet = null;
            
            if (isMemberDashboard()) {
              const joinedPub = publications.find(pub => !pub.isOwner);
              pubToSet = joinedPub || publications.find(pub => pub.isOwner) || publications[0];
            } else {
              const ownedPub = publications.find(pub => pub.isOwner);
              pubToSet = ownedPub || publications[0];
            }
            
            if (pubToSet) {
              setCurrentPublication(pubToSet);
              try {
                await loadPublicationDetails(pubToSet.id);
              } catch (detailsError) {
                console.warn('Failed to load publication details, continuing without them:', detailsError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user publications:', error);
      if (!silent) {
        setError(error.message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [session?.user?.id, isPending, router]);

  // Load full publication details (with stats)
  const loadPublicationDetails = async (publicationId) => {
    if (!publicationId) {
      return null;
    }
    
    // Only fetch on client side
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const details = await publicationService.getPublicationDetails(publicationId);
      setPublicationDetails(details);
      return details;
    } catch (error) {
      console.error('Error loading publication details:', error);
      // Don't throw the error, just log it and continue without details
      // This allows the app to work even if publication details fail
      setPublicationDetails(null);
      return null;
    }
  };

  // Switch to a different publication
  const switchPublication = async (publication) => {
    setCurrentPublication(publication);
    // Try to load full details for the new publication, but don't fail if it doesn't work
    try {
      await loadPublicationDetails(publication.id);
    } catch (error) {
      console.warn('Failed to load publication details for switched publication, continuing without them:', error);
    }
  };

  // Switch to a publication by ID (useful when joining via invitation)
  const switchToPublicationById = async (publicationId) => {
    // First try to find it in existing publications
    const existingPub = userPublications.find(pub => pub.id === publicationId);
    if (existingPub) {
      setCurrentPublication(existingPub);
      await loadPublicationDetails(publicationId);
      return existingPub;
    }

    // If not found, reload all publications (user might have just joined)
    await loadUserPublications();
    const updatedPub = userPublications.find(pub => pub.id === publicationId);
    if (updatedPub) {
      setCurrentPublication(updatedPub);
      await loadPublicationDetails(publicationId);
      return updatedPub;
    }

    return null;
  };

  // Set current publication from invitation acceptance
  const setCurrentPublicationFromInvite = async (publicationData) => {
    // Add the joined publication to the list if not already there
    const existingIndex = userPublications.findIndex(pub => pub.id === publicationData.id);
    
    const publicationWithMeta = {
      ...publicationData,
      isOwner: false,
      joinedAt: new Date().toISOString(),
    };

    if (existingIndex === -1) {
      setUserPublications(prev => [...prev, publicationWithMeta]);
    } else {
      setUserPublications(prev => {
        const updated = [...prev];
        updated[existingIndex] = publicationWithMeta;
        return updated;
      });
    }

    setCurrentPublication(publicationWithMeta);
    // Load full details
    await loadPublicationDetails(publicationData.id);
    return publicationWithMeta;
  };

  // Refresh current publication data
  const refreshCurrentPublication = async () => {
    if (!currentPublication) return;

    try {
      // Reload the publication data
      await loadUserPublications();
      await loadPublicationDetails(currentPublication.id);
    } catch (error) {
      console.error('Error refreshing publication:', error);
    }
  };

  // Get user's role in current publication
  const getCurrentUserRole = () => {
    if (!currentPublication) return null;
    return currentPublication.role || publicationDetails?.userRole;
  };

  // Check if user is admin of current publication
  const isCurrentUserAdmin = () => {
    const role = getCurrentUserRole();
    return role === 'admin';
  };

  // Get owned publications
  const getOwnedPublications = () => {
    return userPublications.filter(pub => pub.isOwner);
  };

  // Get joined publications
  const getJoinedPublications = () => {
    return userPublications.filter(pub => !pub.isOwner);
  };

  useEffect(() => {
    if (session?.user?.id && !isPending) {
      loadUserPublications();
    }
  }, [session?.user?.id, isPending]);

  // Polling effect to detect membership changes (e.g., being removed by admin)
  useEffect(() => {
    if (!session?.user?.id || isPending || !currentPublication) return;

    // Only poll for joined publications (not owned)
    if (currentPublication.isOwner) return;

    const pollInterval = setInterval(() => {
      loadUserPublications(true); // silent polling
    }, 5000); // Check every 5 seconds

    return () => clearInterval(pollInterval);
  }, [session?.user?.id, isPending, currentPublication?.id, currentPublication?.isOwner, loadUserPublications]);

  // Effect to handle route changes and URL parameters
  useEffect(() => {
    if (!userPublications.length || isPending) return;

    const urlPubId = getPublicationIdFromUrl();
    
    // If URL has a publication ID and it's different from current, switch to it
    if (urlPubId && currentPublication && urlPubId !== currentPublication.id) {
      const urlPub = userPublications.find(pub => pub.id === urlPubId);
      if (urlPub) {
        setCurrentPublication(urlPub);
        loadPublicationDetails(urlPub.id).catch(error => {
          console.warn('Failed to load publication details on URL change:', error);
        });
      }
    }
    
    // On member dashboard routes, ensure we have a joined publication if available
    else if (isMemberDashboard() && currentPublication?.isOwner && !urlPubId) {
      const joinedPub = userPublications.find(pub => !pub.isOwner);
      if (joinedPub) {
        setCurrentPublication(joinedPub);
        loadPublicationDetails(joinedPub.id).catch(error => {
          console.warn('Failed to load publication details on route change:', error);
        });
      }
    }
  }, [pathname, userPublications, isPending]);

  const value = {
    userPublications,
    currentPublication,
    publicationDetails,
    loading,
    error,
    loadUserPublications,
    loadPublicationDetails,
    switchPublication,
    switchToPublicationById,
    setCurrentPublicationFromInvite,
    refreshCurrentPublication,
    getCurrentUserRole,
    isCurrentUserAdmin,
    getOwnedPublications,
    getJoinedPublications,
  };

  return (
    <PublicationContext.Provider value={value}>
      {children}
    </PublicationContext.Provider>
  );
}

export function PublicationProvider({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    }>
      <PublicationProviderInner>{children}</PublicationProviderInner>
    </Suspense>
  );
}

export function usePublication() {
  const context = useContext(PublicationContext);
  if (!context) {
    throw new Error('usePublication must be used within a PublicationProvider');
  }
  return context;
}