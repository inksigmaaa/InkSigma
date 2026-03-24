'use client';

import { useState, useEffect, Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import HomeHeader from './components/Header/HomeHeader';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import { getApiBase } from '@/utils/apiBase';
import { fetchJsonWithRetry } from '@/lib/api/client';

const API_URL = getApiBase();

function ViewSiteContent({
  initialPublication = null,
  initialPublicationId = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);

  const publicationId = initialPublication?.id || initialPublicationId || null;
  const publicationLogoUrl = initialPublication?.logoUrl || null;
  const avatarUrl = publicationLogoUrl ? `${API_URL}${publicationLogoUrl}` : null;
  const publicationName = initialPublication?.name || 'Your Publication Name';

  useEffect(() => {
    const controller = new AbortController();

    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setLoadError('');

        if (!publicationId) {
          setBlogs([]);
          setLoadError('This publication is not available right now.');
          return;
        }

        const data = await fetchJsonWithRetry(
          `${API_URL}/api/blogs?publicationId=${publicationId}&status=published`,
          {
            credentials: 'include',
            signal: controller.signal,
          },
        );

        setBlogs(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error('[ViewSite] Error fetching blogs:', error);
        setBlogs([]);
        setLoadError('We could not load this publication right now. Please try again.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      controller.abort();
    };
  }, [publicationId, retryNonce]);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem('viewSiteScrollPosition');
    if (savedPosition) {
      window.scrollTo({ top: parseInt(savedPosition, 10), behavior: 'instant' });
    }

    const handleBeforeUnload = () => {
      sessionStorage.setItem('viewSiteScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      sessionStorage.setItem('viewSiteScrollPosition', window.scrollY.toString());
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleRetry = () => {
    setLoadError('');
    setRetryNonce((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HomeHeader
        userName={publicationName}
        userAvatar={avatarUrl}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-grow pt-20 md:pt-24">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <p className="text-gray-500">Loading blogs...</p>
          </div>
        ) : loadError ? (
          <div className="mx-auto flex min-h-[400px] w-full max-w-2xl items-center px-4">
            <Alert variant="destructive">
              <AlertTitle>View site unavailable</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>{loadError}</p>
                <Button type="button" variant="outline" onClick={handleRetry}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <LatestBlog
              searchQuery={searchQuery}
              blogs={blogs}
              publicationId={publicationId}
            />
            <AllArticles
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              blogs={searchQuery ? blogs : blogs.slice(1)}
              publicationId={publicationId}
            />
          </>
        )}
      </div>
      <Footer publicationName={publicationName} />
      <ScrollToTop />
    </div>
  );
}

export default function ViewSitePageClient(props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ViewSiteContent {...props} />
    </Suspense>
  );
}
