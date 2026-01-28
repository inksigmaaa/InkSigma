'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';
import { formatTimeAgo } from '@/utils/timeFormatter';
import { getImageUrl } from '@/utils/imageUrl';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function LatestBlog({ searchQuery = '', blogs = [], publicationId }) {
  const [commentCount, setCommentCount] = useState(0);
  
  // Get the latest blog (first one in the array, sorted by date)
  const latestBlog = blogs.length > 0
    ? blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  // Fetch comment count for latest blog
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!latestBlog) return;
      
      try {
        const response = await fetch(`${API_URL}/api/comments/count/${latestBlog.id}`);
        if (response.ok) {
          const data = await response.json();
          setCommentCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching comment count:', err);
      }
    };

    fetchCommentCount();
  }, [latestBlog]);

  // Hide latest blog section if there's a search query
  if (searchQuery) {
    return null;
  }

  if (!latestBlog) {
    return (
      <section className="max-w-[70%] mx-auto py-12">
        <h1 className="text-4xl font-bold mb-8 text-black">Latest Blog</h1>
        <p className="text-gray-500">No blogs available yet.</p>
      </section>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const dateFormatted = formatDate(latestBlog.createdAt);
  const thumbnailUrl = getImageUrl(latestBlog.image) || "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop";

  return (
    <section className="w-full max-w-[90%] md:max-w-[70%] mx-auto py-6 md:py-0 max-md:px-0 ">
      {/* Start Writing Button */}
      <div className="mt-10 max-md:mt-0">
        <a
          href="/editor"
          className="inline-flex justify-center items-center gap-2 px-6 h-[40px] bg-[#080808] text-[#EDEDED] rounded font-medium text-[14px] leading-[150%] max-md:w-full max-md:h-[32px] max-md:text-[12px]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          Start Writing
        </a>
      </div>

      <div className="mt-6 max-md:mt-0">
        <h1 className="font-extrabold text-[32px] leading-[120%] text-[#202020] max-md:text-[18px] max-md:mt-6">Latest Blog</h1>
        <div className="w-full h-px bg-[#EDEDED] mt-4 max-md:hidden"></div>
      </div>
      <div className="flex items-center justify-between mt-9 mb-4 max-md:hidden">
        {/* Desktop View Author Info */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            {latestBlog.author?.image ? (
              <img
                src={latestBlog.author.image.startsWith('http') ? latestBlog.author.image : `http://localhost:5000${latestBlog.author.image}`} 
                alt={latestBlog.author.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="w-full h-full bg-purple-100 flex items-center justify-center"><span class="text-purple-600 font-semibold text-sm">${latestBlog.author?.name?.charAt(0).toUpperCase() || 'A'}</span></div>`;
                }}
              />
            ) : (
              <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-sm">
                  {latestBlog.author?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            )}
          </div>
          <span className="text-[#000000] font-normal text-[16px] leading-[136%]">{latestBlog.author?.name || 'Anonymous'}</span>
        </div>

        {/* Desktop View Date */}
        <div className="hidden md:block text-right">
          <div className="text-[#808080] font-light text-[16px] leading-[136%] whitespace-nowrap">
            {dateFormatted}
          </div>
        </div>
      </div>

      {/* Desktop View Card */}
      <div className="hidden md:block relative w-full h-[600px] rounded-lg group">
        {/* Share Button - Top Right */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
          <ShareMenu
            title={latestBlog.title}
            slug={latestBlog.slug}
            blogId={latestBlog.id}
          />
        </div>

        <Link href={`/view-site/blog/${latestBlog.slug}${publicationId ? `?from=${publicationId}&view=site` : ''}`} className="absolute inset-0 rounded-lg overflow-hidden cursor-pointer block">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={thumbnailUrl}
              alt={latestBlog.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          </div>

          {/* Bottom Section - Title, Description, Category and Read Button */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-12 gap-0">
            {/* Left - Title, Description and Category */}
            <div className="flex-1">
              <h2 className="font-extrabold leading-none text-2xl text-[#FFFFFF] drop-shadow-lg line-clamp-2 mb-4">{latestBlog.title}</h2>
              <p className="text-[#F8F8F8] font-light text-sm leading-[150%] drop-shadow-md line-clamp-none mb-4">{latestBlog.description}</p>
              {/* Category */}
              {latestBlog.categories && latestBlog.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {latestBlog.categories.map((category, index) => (
                    <span key={index} className="px-4 py-2 bg-[#A4A4A4]/60 backdrop-blur-sm  border border-white/30 rounded-lg text-[#F8F8F8] font-normal text-sm leading-[150%]">
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Read Article Button */}
            <span className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors text-base whitespace-nowrap">
              Read Article
              <Image
                src="/svg/arrow-right.svg"
                alt="Arrow"
                width={16}
                height={16}
                className="text-black"
              />
            </span>
          </div>
        </Link>
      </div>

      {/* Mobile View Card - Matches AllArticles style */}
      <div className="block md:hidden border border-gray-200 rounded-md bg-white p-3.5 flex flex-col mt-4">
        {/* Author and Date Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-[29px] h-[29px] rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
              {latestBlog.author?.image ? (
                <img
                  src={latestBlog.author.image.startsWith('http') ? latestBlog.author.image : `http://localhost:5000${latestBlog.author.image}`} 
                  alt={latestBlog.author.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full bg-purple-100 flex items-center justify-center"><span class="text-purple-600 font-semibold text-sm">${latestBlog.author?.name?.charAt(0).toUpperCase() || 'A'}</span></div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">
                    {latestBlog.author?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[#000000] font-medium text-[12px]">{latestBlog.author?.name || 'Anonymous'}</span>
          </div>
          <div className="text-right">
            <div className="text-[#808080] text-xs font-medium whitespace-nowrap">
              {dateFormatted}
            </div>
          </div>
        </div>

        {/* Image Card */}
        <div className="relative w-full h-[200px] rounded-xl group mb-3">
          {/* Share Button */}
          <div className="absolute top-3 right-3 z-50">
            <ShareMenu
              title={latestBlog.title}
              slug={latestBlog.slug}
              blogId={latestBlog.id}
            />
          </div>

          <Link href={`/view-site/blog/${latestBlog.slug}${publicationId ? `?from=${publicationId}&view=site` : ''}`} className="absolute inset-0 rounded-md overflow-hidden cursor-pointer block">
            <Image
              src={thumbnailUrl}
              alt={latestBlog.title}
              fill
              className="object-cover"
              unoptimized
            />
          </Link>
        </div>

        {/* Content */}
        <div className="flex-grow mb-3">
          <h3 className="text-[16px] font-bold text-[#080808] leading-none mb-1">{latestBlog.title}</h3>
          <p className="text-[#808080] font-normal text-xs leading-[150%]">{latestBlog.description}</p>
        </div>

        {/* Category */}
        {latestBlog.categories && latestBlog.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto items-center">
            {latestBlog.categories.map((category, index) => (
              <span key={index} className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-xs hover:bg-gray-50 transition-colors cursor-pointer">
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
