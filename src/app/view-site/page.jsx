'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePublicationMeta } from '@/hooks/usePublicationMeta';
import HomeHeader from './components/Header/HomeHeader';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import mockData from './mockData.json';

function ViewSiteContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get subdomain from URL params (set by middleware)
  const subdomain = searchParams.get('subdomain');
  
  // Fetch publication data and update meta tags
  const { publication, loading } = usePublicationMeta(subdomain);

  // Get unique categories from blogs, limit to 3
  const categories = [...new Set(mockData.blogs.map(blog => blog.category))].slice(0, 3);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HomeHeader 
        userName={publication?.name || "Your Publication Name"} 
        userAvatar={publication?.logoUrl ? `http://localhost:3001${publication.logoUrl}` : null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-grow pt-20 md:pt-24">
        <LatestBlog searchQuery={searchQuery} />
        <AllArticles searchQuery={searchQuery} selectedCategory={selectedCategory} />
      </div>
      <Footer />
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
