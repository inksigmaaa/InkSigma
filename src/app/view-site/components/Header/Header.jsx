'use client';

import Image from 'next/image';

export default function ViewSiteHeader({ userName = 'The Nature Blog', userAvatar = null, searchQuery = '', onSearchChange }) {
  return (
    <header className="bg-white border-b border-gray-200 py-4 md:py-5 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Single Row - Logo, Blog Name on left, Search on right */}
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Logo and Blog Name */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo/Avatar */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
              {userAvatar ? (
                <Image 
                  src={userAvatar} 
                  alt={userName}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <Image 
                  src="/svg/logo.svg" 
                  alt="Logo"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              )}
            </div>
            
            {/* Blog Name */}
            <h1 className="font-bold text-base md:text-xl text-gray-900 whitespace-nowrap">{userName}</h1>
          </div>

          {/* Right Section - Search Bar */}
          <div className="relative w-full max-w-[200px] md:max-w-xs">
            <input
              type="text"
              placeholder="Search Articles"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full px-4 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white text-sm text-gray-600 placeholder-gray-400"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
