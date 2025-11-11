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
    <section className="w-full max-w-[90%] md:max-w-[70%] mx-auto py-6 md:py-12 px-4 md:px-0">
      <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-black">Latest Blog</h1>
      
      {/* Author and Date - Outside Container */}
      <div className="flex items-center justify-between mb-4">
        {/* Author Info */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            {latestBlog.author?.avatar && (
              <Image src={latestBlog.author.avatar} alt={latestBlog.author.name} width={40} height={40} />
            )}
          </div>
          <span className="text-gray-900 font-medium text-sm md:text-base">{latestBlog.author?.name || 'Anonymous'}</span>
        </div>

        {/* Date */}
        <div className="text-right">
          <div className="text-gray-700 text-xs md:text-sm font-medium whitespace-nowrap">
            {dateFormatted.date.split(',')[0]}
          </div>
        </div>
      </div>

      <div className="relative w-full h-[300px] md:h-[500px] rounded-xl md:rounded-2xl group">
        {/* Share Button - Top Right */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-50">
          <ShareMenu 
            title={latestBlog.title}
            slug={latestBlog.slug}
          />
        </div>
        
        <Link href={`/view_site/blog/${latestBlog.slug}`} className="absolute inset-0 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer block">

        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src={latestBlog.thumbnail} 
            alt={latestBlog.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        </div>

        {/* Bottom Section - Title, Description and Read Button */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col md:flex-row md:items-end md:justify-between p-4 md:p-6 gap-3 md:gap-0">
          {/* Left - Title and Description */}
          <div className="flex-1">
            <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-white drop-shadow-lg line-clamp-2">{latestBlog.title}</h2>
            <p className="text-white text-sm md:text-base drop-shadow-md line-clamp-2 md:line-clamp-none">{latestBlog.description}</p>
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
