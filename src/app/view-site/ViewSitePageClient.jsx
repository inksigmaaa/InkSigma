'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import HomeHeader from './components/Header/HomeHeader';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import { getApiBase } from '@/utils/apiBase';
import { fetchJsonWithRetry } from '@/lib/api/client';
import { getBlogPath } from '@/utils/blogUrl';
import { getImageUrl } from '@/utils/imageUrl';

const API_URL = getApiBase();
const BLOG_CACHE_TTL_MS = 60 * 1000;

const getBlogCacheKey = (publicationId) => `view-site:blogs:${publicationId}`;

const readCachedBlogs = (publicationId) => {
  if (typeof window === 'undefined' || !publicationId) return null;

  try {
    const raw = sessionStorage.getItem(getBlogCacheKey(publicationId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed?.blogs)) {
      return null;
    }

    if (Date.now() - parsed.savedAt > BLOG_CACHE_TTL_MS) {
      sessionStorage.removeItem(getBlogCacheKey(publicationId));
      return null;
    }

    return parsed.blogs;
  } catch {
    return null;
  }
};

const writeCachedBlogs = (publicationId, blogs) => {
  if (typeof window === 'undefined' || !publicationId) return;

  try {
    sessionStorage.setItem(
      getBlogCacheKey(publicationId),
      JSON.stringify({ savedAt: Date.now(), blogs }),
    );
  } catch {
    // Ignore storage failures.
  }
};

function ViewSiteContent({
  initialPublication = null,
  initialPublicationId = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);

  const publicationId = initialPublication?.id || initialPublicationId || null;
  const publicationLogoUrl = initialPublication?.logoUrl || null;
  const avatarUrl = getImageUrl(publicationLogoUrl);
  const publicationName = initialPublication?.name || 'Your Publication Name';

  useEffect(() => {
    const controller = new AbortController();

    const fetchBlogs = async () => {
      let hasCachedBlogs = false;

      try {
        setLoading(true);
        setLoadError('');

        if (!publicationId) {
          setBlogs([]);
          setLoadError('This publication is not available right now.');
          return;
        }

        const cachedBlogs = readCachedBlogs(publicationId);
        hasCachedBlogs = Array.isArray(cachedBlogs);

        if (hasCachedBlogs) {
          setBlogs(cachedBlogs);
          setLoading(false);
        }

        const data = await fetchJsonWithRetry(
          `${API_URL}/api/blogs?publicationId=${publicationId}&status=published`,
          {
            cache: 'no-store',
            credentials: 'omit',
            signal: controller.signal,
          },
          {
            attempts: 2,
            delayMs: 160,
          },
        );

        const nextBlogs = Array.isArray(data) ? data : [];
        setBlogs(nextBlogs);
        writeCachedBlogs(publicationId, nextBlogs);
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error('[ViewSite] Error fetching blogs:', error);
        if (!hasCachedBlogs) {
          setBlogs([]);
          setLoadError('We could not load this publication right now. Please try again.');
        }
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
    if (!blogs.length) return;

    const toPrefetch = blogs.slice(0, 6);
    toPrefetch.forEach((blog) => {
      if (!blog?.slug) return;
      router.prefetch(getBlogPath(blog.slug, pathname || '/view-site'));
    });
  }, [blogs, pathname, router]);

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
      <Footer
        publicationName={publicationName}
        publicationId={publicationId}
      />
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
