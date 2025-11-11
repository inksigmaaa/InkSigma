'use client';

import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';
import mockData from '@/data/mockBlogs.json';

export default function AllArticles() {
  const articles = mockData.blogs.slice(1); // Skip the first blog (it's shown as latest)

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      day: days[date.getDay()],
      date: `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`,
    };
  };

  return (
    <section className="w-[70%] mx-auto py-12">
      <h2 className="text-4xl font-bold mb-8 text-black">All Articles</h2>
      
      {articles.length === 0 ? (
        <p className="text-gray-500">No articles available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-40 pb-10 border-b-1">
          {articles.map((article) => {
            const dateFormatted = formatDate(article.createdAt);
            return (
              <div key={article.id} className="flex flex-col">
                {/* Author and Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                      {article.author?.avatar && (
                        <Image src={article.author.avatar} alt={article.author.name} width={40} height={40} />
                      )}
                    </div>
                    <span className="text-gray-800 font-medium">{article.author?.name || 'Anonymous'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-700 text-sm font-medium">
                      {dateFormatted.day} | {dateFormatted.date}
                    </div>
                  </div>
                </div>

            {/* Blog Card */}
            <div className="relative w-full h-[280px] rounded-2xl group mb-4">
              {/* Share Button */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                <ShareMenu 
                  title={article.title}
                  slug={article.slug}
                />
              </div>

              <Link href={`/view_site/blog/${article.slug}`} className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer block">
                {/* Background Image */}
                <Image 
                  src={article.thumbnail} 
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </Link>
            </div>

            {/* Title and Description */}
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2 text-black">{article.title}</h3>
              <p className="text-gray-700 text-sm line-clamp-2">{article.description}</p>
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                {article.category}
              </span>
            </div>

            {/* Read Article Button */}
            <Link href={`/view_site/blog/${article.slug}`} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors w-fit mt-10">
              Read Article
              <Image 
                src="/svg/arrow-right.svg" 
                alt="Arrow"
                width={16}
                height={16}
              />
            </Link>
          </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
