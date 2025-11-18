'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import HomeHeader from './components/Header/HomeHeader';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import mockData from './mockData.json';

export default function ViewSitePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const router = useRouter();

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
        userName="Your Publication Name" 
        userAvatar={null}
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
