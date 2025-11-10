'use client';

import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';

export default function AllArticles() {
  const articles = [
    {
      id: 1,
      author: {
        name: 'Gugan',
        avatar: '/images/avatar.jpg',
      },
      date: {
        day: 'THU',
        date: '08 NOV, 2025',
      },
      title: 'Why Movies Feels Like a Warm Hug?',
      description: "There's something magical about sitting in a dark room, the lights dimming, and the screen coming alive with color, sound, and emotion. Cinema has an...",
      image: '/images/blog-2.jpg',
      categories: ['Climate &...', 'Finance ...', 'Parenti...'],
      slug: 'why-movies-feels-like-warm-hug',
    },
    {
      id: 2,
      author: {
        name: 'Gugan',
        avatar: '/images/avatar.jpg',
      },
      date: {
        day: 'THU',
        date: '08 NOV, 2025',
      },
      title: 'hi',
      description: 'hello...',
      image: '/images/blog-3.jpg',
      categories: ['Climate &...', 'Finance ...', 'Parenti...'],
      slug: 'hi',
    },
    {
      id: 3,
      author: {
        name: 'Gugan',
        avatar: '/images/avatar.jpg',
      },
      date: {
        day: 'FRI',
        date: '27 DEC, 2024',
      },
      title: 'DUDE',
      description: 'Songs',
      image: '/images/blog-4.jpg',
      categories: ['Music'],
      slug: 'dude',
    },
    {
      id: 4,
      author: {
        name: 'Gugan',
        avatar: '/images/avatar.jpg',
      },
      date: {
        day: 'FRI',
        date: '27 DEC, 2024',
      },
      title: 'Travel',
      description: 'Bike Trip',
      image: '/images/blog-5.jpg',
      categories: ['Travel'],
      slug: 'travel',
    },
  ];

  return (
    <section className="w-[70%] mx-auto py-12">
      <h2 className="text-4xl font-bold mb-8 text-black">All Articles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-40 pb-10 border-b-1">
        {articles.map((article) => (
          <div key={article.id} className="flex flex-col">
            {/* Author and Date */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                  <div className="w-full h-full bg-gray-400"></div>
                </div>
                <span className="text-gray-800 font-medium">{article.author.name}</span>
              </div>
              <div className="text-right">
                <div className="text-gray-700 text-sm font-medium">
                  {article.date.day} | {article.date.date}
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

              <Link href="/view_site/blog" className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer block">
                {/* Background Image Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300">
                  {/* Placeholder for actual image */}
                </div>
              </Link>
            </div>

            {/* Title and Description */}
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2 text-black">{article.title}</h3>
              <p className="text-gray-700 text-sm line-clamp-2">{article.description}</p>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* Read Article Button */}
            <Link href="/view_site/blog" className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors w-fit mt-10">
              Read Article
              <Image 
                src="/svg/arrow-right.svg" 
                alt="Arrow"
                width={16}
                height={16}
              />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
