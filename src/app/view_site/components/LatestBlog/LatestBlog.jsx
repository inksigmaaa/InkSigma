'use client';

import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';

export default function LatestBlog() {
  const latestBlog = {
    id: 1,
    author: {
      name: 'Gugan',
      avatar: '/images/avatar.jpg', // You can replace with actual avatar
    },
    date: {
      day: 'THU',
      date: '08 NOV, 2025',
    },
    title: 'Naresh',
    description: 'ehehehhfgjryjyjhmh...',
    image: '/images/blog-1.jpg', // You can replace with actual blog image
    slug: 'naresh',
  };

  return (
    <section className="max-w-[70%] mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-black">Latest Blog</h1>
      
      {/* Author and Date - Outside Container */}
      <div className="flex items-center justify-between mb-4">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
            {/* Avatar placeholder */}
            <div className="w-full h-full bg-gray-400"></div>
          </div>
          <span className="text-gray-900 font-medium">{latestBlog.author.name}</span>
        </div>

        {/* Date */}
        <div className="text-right">
          <div className="text-gray-700 text-sm font-medium">{latestBlog.date.day} | {latestBlog.date.date}</div>
        </div>
      </div>

      <div className="relative w-full h-[500px] rounded-2xl group">
        {/* Share Button - Top Right (visible on hover) */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
          <ShareMenu 
            title={latestBlog.title}
            slug={latestBlog.slug}
          />
        </div>
        
        <Link href="/view_site/blog" className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer block">

        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-400">
          {/* You can replace this with actual image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-48 h-64 bg-black/20 rounded-lg mx-auto mb-4"></div>
              <div className="w-32 h-32 bg-white rounded-full mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Title, Description and Read Button */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6">
          {/* Left - Title and Description */}
          <div>
            <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">{latestBlog.title}</h2>
            <p className="text-white drop-shadow-md">{latestBlog.description}</p>
          </div>

          {/* Right - Read Article Button */}
          <span className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
            READ ARTICLE
            <Image 
              src="/svg/arrow-right.svg" 
              alt="Arrow"
              width={20}
              height={20}
              className="text-black"
            />
          </span>
        </div>
        </Link>
      </div>
    </section>
  );
}
