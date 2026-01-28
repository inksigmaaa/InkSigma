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

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function ViewSiteContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicationData, setPublicationData] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentPublication } = usePublication();
  
  // Get subdomain from URL params (set by middleware)
  const subdomain = searchParams.get('subdomain');
  const pubIdFromUrl = searchParams.get('publicationId');
  
  // Fetch publication data and update meta tags
  const { publication } = usePublicationMeta(subdomain);

  // Fetch publication details if publicationId is in URL
  useEffect(() => {
    const fetchPublicationDetails = async () => {
      // Use publicationId from URL or currentPublication
      const publicationId = pubIdFromUrl || currentPublication?.id;
      
      if (publicationId) {
        try {
          console.log('[ViewSite] Fetching publication:', publicationId);
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
      }
    };

    fetchPublicationDetails();
  }, [pubIdFromUrl, currentPublication?.id]);

  // Fetch published blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        // Use publicationId from URL query parameter if available, otherwise use currentPublication
        // Remove parseInt to support UUIDs and avoid NaN issues
        const publicationId = pubIdFromUrl || currentPublication?.id;
        
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
  }, [currentPublication?.id, pubIdFromUrl]);

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
            <LatestBlog searchQuery={searchQuery} blogs={blogs} publicationId={pubIdFromUrl || currentPublication?.id} />
            <AllArticles 
              searchQuery={searchQuery} 
              selectedCategory={selectedCategory} 
              blogs={searchQuery ? blogs : blogs.slice(1)} 
              publicationId={pubIdFromUrl || currentPublication?.id}
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
