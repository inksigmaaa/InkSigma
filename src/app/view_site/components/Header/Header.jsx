'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ViewSiteHeader({ userName = 'Gugan', userAvatar = null }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleShare = async () => {
    const currentUrl = window.location.href;
    
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality will be implemented later
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto py-7">
        {/* Left Section - User Info */}
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div className="w-[34px] h-[34px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {userAvatar ? (
              <Image 
                src={userAvatar} 
                alt={userName}
                width={34}
                height={34}
                className="object-cover"
              />
            ) : (
              <Image 
                src="/svg/logo.svg" 
                alt="Default Logo"
                width={34}
                height={34}
                className="object-cover"
              />
            )}
          </div>
          
          {/* User Name */}
          <span className="font-semibold text-base text-gray-900">{userName}</span>
          
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-end gap-1 px-4 py-2 text-m text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-md ml-8"
            aria-label="Share page"
          >
            <Image 
              src="/svg/share.svg" 
              alt="Share"
              width={20}
              height={20}
            />
            <span className="leading-none">Share</span>
          </button>
        </div>

        {/* Right Section - Search and Start Writing */}
        <div className="flex items-center gap-12">
          {/* Search Form - Always Visible */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Articles here..."
              className="px-4 py-2 border border-gray-300 rounded-md text-m focus:outline-none placeholder:text-gray-400 w-84"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-m hover:bg-gray-200 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Start Writing Button */}
          <a
            href="/write"
            className="px-4 py-2 bg-black text-white rounded-md text-m hover:bg-gray-800 transition-colors flex items-center"
          >
            Start Writing
          </a>
        </div>
      </div>
    </header>
  );
}
