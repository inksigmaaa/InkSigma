'use client';

import { useState, useEffect } from 'react';
import HomeHeader from './components/Header/HomeHeader';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import mockData from './mockData.json';

export default function ViewSitePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Get unique categories from blogs, limit to 3
  const categories = [...new Set(mockData.blogs.map(blog => blog.category))].slice(0, 3);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
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
