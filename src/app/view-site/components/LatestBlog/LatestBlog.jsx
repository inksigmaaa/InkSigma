'use client';

import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';
import { formatTimeAgo } from '@/utils/timeFormatter';

export default function LatestBlog({ searchQuery = '', blogs = [] }) {
  // Get the latest blog (first one in the array, sorted by date)
  const latestBlog = blogs.length > 0
    ? blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

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
  const thumbnailUrl = (latestBlog.image && latestBlog.image.trim() !== '') 
    ? latestBlog.image 
    : "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop";

  return (
    <section className="w-full max-w-[90%] md:max-w-[70%] mx-auto py-6 md:py-12 px-4 md:px-0">
      {/* Start Writing Button */}
      <div className="mb-6 md:mb-8">
        <a
          href="/editor"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors font-medium"
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

      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-black">Latest Blog</h1>
        <div className="w-full h-px bg-gray-200 mt-4"></div>
      </div>
      <div className="flex items-center justify-between mb-4">
        {/* Author Info */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
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
          <span className="text-gray-900 font-medium text-sm md:text-base">{latestBlog.author?.name || 'Anonymous'}</span>
        </div>

        {/* Date */}
        <div className="text-right">
          <div className="text-gray-700 text-xs md:text-sm font-medium whitespace-nowrap">
            {dateFormatted}
          </div>
        </div>
      </div>

      <div className="relative w-full h-[400px] md:h-[600px] rounded-xl md:rounded-2xl group">
        {/* Share Button - Top Right */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-50">
          <ShareMenu
            title={latestBlog.title}
            slug={latestBlog.slug}
          />
        </div>

        <Link href={`/view-site/blog/${latestBlog.slug}`} className="absolute inset-0 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer block">

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
          <div className="absolute bottom-0 left-0 right-0 flex flex-col md:flex-row md:items-end md:justify-between p-4 md:p-6 gap-3 md:gap-0">
            {/* Left - Title, Description and Category */}
            <div className="flex-1">
              <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-white drop-shadow-lg line-clamp-2">{latestBlog.title}</h2>
              <p className="text-white text-sm md:text-base drop-shadow-md line-clamp-2 md:line-clamp-none mb-3">{latestBlog.description}</p>
              {/* Category */}
              {latestBlog.categories && latestBlog.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-md text-xs md:text-sm font-medium">
                    {latestBlog.categories[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Right - Read Article Button */}
            <span className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded-full font-medium hover:bg-gray-100 transition-colors text-sm md:text-base whitespace-nowrap self-start md:self-auto">
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
    </section>
  );
}
