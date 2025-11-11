'use client';

import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';
import mockData from '@/data/mockBlogs.json';

export default function LatestBlog() {
  const latestBlog = mockData.blogs[0]; // Get the first blog as latest

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
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      day: days[date.getDay()],
      date: `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`,
    };
  };

  const dateFormatted = formatDate(latestBlog.createdAt);

  return (
    <section className="max-w-[70%] mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-black">Latest Blog</h1>
      
      {/* Author and Date - Outside Container */}
      <div className="flex items-center justify-between mb-4">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
            {latestBlog.author?.avatar && (
              <Image src={latestBlog.author.avatar} alt={latestBlog.author.name} width={40} height={40} />
            )}
          </div>
          <span className="text-gray-900 font-medium">{latestBlog.author?.name || 'Anonymous'}</span>
        </div>

        {/* Date */}
        <div className="text-right">
          <div className="text-gray-700 text-sm font-medium">{dateFormatted.day} | {dateFormatted.date}</div>
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
        
        <Link href={`/view_site/blog/${latestBlog.slug}`} className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer block">

        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src={latestBlog.thumbnail} 
            alt={latestBlog.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
