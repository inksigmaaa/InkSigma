'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePublicationMeta } from '@/hooks/usePublicationMeta';
import { usePublication } from '@/contexts/PublicationContext';
import HomeHeader from './components/Header/HomeHeader';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import { getApiBase } from '@/utils/apiBase';
import { parseHost } from '@/utils/hostParser';

const API_URL = getApiBase();

function ViewSiteContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicationData, setPublicationData] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentPublication } = usePublication();

  const [hostContext, setHostContext] = useState({
    subdomain: searchParams.get('subdomain'),
    customDomain: searchParams.get('customDomain'),
  });
  const pubIdFromUrl = searchParams.get('publicationId');

  useEffect(() => {
    const paramSub = searchParams.get('subdomain');
    const paramCustomDomain = searchParams.get('customDomain');

    if (paramSub || paramCustomDomain) {
      setHostContext({
        subdomain: paramSub,
        customDomain: paramCustomDomain,
      });
      return;
    }

    if (typeof window !== 'undefined') {
      const parsedHost = parseHost(window.location.host);
      const nextHostContext = {
        subdomain:
          parsedHost.isCustomDomain || parsedHost.isDashboard
            ? null
            : parsedHost.subdomain,
        customDomain: parsedHost.isCustomDomain ? parsedHost.hostname : null,
      };

      console.log('[ViewSite] Detected host context:', nextHostContext);
      setHostContext(nextHostContext);
    }
  }, [searchParams]);

  // Fetch publication data and update meta tags
  const { publication } = usePublicationMeta(hostContext);

  // Set publication data from subdomain lookup or publicationId lookup
  useEffect(() => {
    if (publication) {
      // Use publication from subdomain lookup
      console.log('[ViewSite] Using publication from subdomain:', publication);
      setPublicationData(publication);
    } else if (pubIdFromUrl || currentPublication?.id) {
      // Fallback to fetching by ID
      const fetchPublicationDetails = async () => {
        const publicationId = pubIdFromUrl || currentPublication?.id;

        try {
          console.log('[ViewSite] Fetching publication by ID:', publicationId);
          const response = await fetch(`${API_URL}/api/publications/${publicationId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            console.log('[ViewSite] Publication data:', data);
            setPublicationData(data);
          } else {
            console.error('[ViewSite] Failed to fetch publication:', response.status);
          }
        } catch (error) {
          console.error('[ViewSite] Error fetching publication:', error);
        }
      };

      fetchPublicationDetails();
    }
  }, [publication, pubIdFromUrl, currentPublication?.id]);

  // Fetch published blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        // Use publicationId from URL query parameter, fetched publication data, or currentPublication
        // Remove parseInt to support UUIDs and avoid NaN issues
        const publicationId = pubIdFromUrl || publicationData?.id || currentPublication?.id;

        console.log('[ViewSite] Fetching blogs for publication:', publicationId);

        if (!publicationId) {
          console.log('[ViewSite] No publicationId, skipping blog fetch');
          setBlogs([]);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/blogs?publicationId=${publicationId}&status=published`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('[ViewSite] Blogs fetched:', data.length);
          setBlogs(data);
        } else {
          console.error('[ViewSite] Failed to fetch blogs:', response.status);
          setBlogs([]);
        }
      } catch (error) {
        console.error('[ViewSite] Error fetching blogs:', error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [publicationData?.id, currentPublication?.id, pubIdFromUrl]);

  // Get unique categories from blogs, limit to 3
  const categories = [...new Set(blogs.map(blog => blog.categories?.[0]).filter(Boolean))].slice(0, 3);

  // Restore scroll position when returning from blog
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('viewSiteScrollPosition');
    if (savedPosition) {
      // Restore to saved position instantly
      window.scrollTo({ top: parseInt(savedPosition, 10), behavior: 'instant' });
    }

    // Save scroll position when navigating away
    const handleBeforeUnload = () => {
      sessionStorage.setItem('viewSiteScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Save position when component unmounts (navigating to blog)
      sessionStorage.setItem('viewSiteScrollPosition', window.scrollY.toString());
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const publicationLogoUrl = publicationData?.logoUrl || publication?.logoUrl || currentPublication?.logoUrl;
  const avatarUrl = publicationLogoUrl ? `${API_URL}${publicationLogoUrl}` : null;
  const publicationName = publicationData?.name || publication?.name || currentPublication?.name || "Your Publication Name";

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
        ) : (
          <>
            <LatestBlog searchQuery={searchQuery} blogs={blogs} publicationId={pubIdFromUrl || publicationData?.id || currentPublication?.id} />
            <AllArticles
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              blogs={searchQuery ? blogs : blogs.slice(1)}
              publicationId={pubIdFromUrl || publicationData?.id || currentPublication?.id}
            />
          </>
        )}
      </div>
      <Footer publicationName={publicationName} />
      <ScrollToTop />
    </div>
  );
}

export default function ViewSitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <ViewSiteContent />
    </Suspense>
  );
}
