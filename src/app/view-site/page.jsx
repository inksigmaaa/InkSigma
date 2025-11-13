'use client';

import { useState } from 'react';
import ViewSiteHeader from './components/Header/Header';
import LatestBlog from './components/LatestBlog/LatestBlog';
import AllArticles from './components/AllArticles/AllArticles';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

export default function ViewSitePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ViewSiteHeader 
        userName="Guest" 
        userAvatar={null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-grow">
        <LatestBlog searchQuery={searchQuery} />
        <AllArticles searchQuery={searchQuery} />
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
