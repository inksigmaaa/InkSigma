'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function HomeHeader({ userName = 'The Nature Blog', userAvatar = null, searchQuery = '', onSearchChange }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200 py-6   max-md:py-4">
      <div className="max-w-[90%] md:max-w-[70%] mx-auto">
        {/* Single Row - Logo, Blog Name on left, Search on right */}
        <div className="flex items-center justify-between gap-4 max-md:justify-around">
          {/* Left Section - Logo and Blog Name */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo/Avatar */}
            <Avatar className="w-[33px] h-[33px] bg-gray-200 flex-shrink-0">
              <AvatarImage
                src={userAvatar || "/svg/logo.svg"}
                alt={userName}
                className="w-full h-full object-cover"
              />
              <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold text-sm">
                {userName?.charAt(0).toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
            
            {/* Blog Name */}
            <h1 className="font-semibold text-base leading-[100%] text-[#000000] whitespace-nowrap max-md:text-[12px] max-md:leading-[150%]">{userName}</h1>
          </div>

          {/* Right Section - Search Bar */}
          <div className="relative  max-md:w-[160px]">
            <input
              type="text"
              placeholder="Search Articles"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className=" px-4 py-2 pr-10 border border-[#EAEAEA] rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white font-normal text-sm leading-[150%] placeholder-[#C0C0C0] max-md:text-xs max-md:font-normal max-md:leading-normal max-md:tracking-normal max-md:w-[160px] max-md:h-[28px]"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-[14px] h-[14px] text-[#C0C0C0]"
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
