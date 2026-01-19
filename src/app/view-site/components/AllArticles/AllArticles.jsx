'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ShareMenu from '../ShareMenu/ShareMenu';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AllArticles({ searchQuery = '', selectedCategory = '', blogs = [] }) {
  const [commentCounts, setCommentCounts] = useState({});

  // Fetch comment counts for all blogs
  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (blogs.length === 0) return;
      
      try {
        const blogIds = blogs.map(b => b.id);
        const response = await fetch(`${API_URL}/api/comments/counts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blogIds })
        });
        
        if (response.ok) {
          const counts = await response.json();
          setCommentCounts(counts);
        }
      } catch (err) {
        console.error('Error fetching comment counts:', err);
      }
    };

    fetchCommentCounts();
  }, [blogs]);

  // Filter articles based on search query and selected category
  const filteredArticles = blogs.filter((article) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        (article.categories && article.categories.some(cat => cat.toLowerCase().includes(query))) ||
        article.author?.name.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Filter by selected category
    if (selectedCategory && (!article.categories || !article.categories.includes(selectedCategory))) {
      return false;
    }
    
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  return (
    <section className="w-full max-w-[90%] md:max-w-[70%] mx-auto py-6 md:py-12 px-4 md:px-0">
      <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-black">
        All Blog {searchQuery && `(${filteredArticles.length} results)`}
      </h2>
      
      {filteredArticles.length === 0 ? (
        <p className="text-gray-500">
          {searchQuery ? `No articles found for "${searchQuery}"` : 'No articles available yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20 md:mb-40 pb-10">
          {filteredArticles.map((article) => {
            const dateFormatted = formatDate(article.createdAt);
            const thumbnailUrl = (article.image && article.image.trim() !== '') 
              ? article.image 
              : "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop";
            
            return (
              <div key={article.id} className="border border-gray-200 rounded-md hover:shadow-lg transition-shadow bg-white p-3.5 flex flex-col">
                {/* Author and Date */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                      {article.author?.image ? (
                        <img
                          src={article.author.image.startsWith('http') ? article.author.image : `http://localhost:5000${article.author.image}`} 
                          alt={article.author.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div class="w-full h-full bg-purple-100 flex items-center justify-center"><span class="text-purple-600 font-semibold text-sm">${article.author?.name?.charAt(0).toUpperCase() || 'A'}</span></div>`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
                            {article.author?.name?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-800 font-medium text-sm md:text-base">{article.author?.name || 'Anonymous'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-700 text-xs md:text-sm font-medium whitespace-nowrap">
                      {dateFormatted}
                    </div>
                  </div>
                </div>

            {/* Blog Card */}
            <div className="relative w-full h-[200px] md:h-[280px] rounded-xl md:rounded-2xl group mb-3 md:mb-4">
              {/* Share Button */}
              <div className="absolute top-3 right-3 md:top-4 md:right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-50">
                <ShareMenu 
                  title={article.title}
                  slug={article.slug}
                  blogId={article.id}
                />
              </div>

              <Link href={`/view-site/blog/${article.slug}`} className="absolute inset-0 rounded-md md:rounded-md overflow-hidden cursor-pointer block">
                {/* Background Image */}
                <Image 
                  src={thumbnailUrl} 
                  alt={article.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </Link>
            </div>

            {/* Title and Description - Flex grow to push category down */}
            <div className="flex-grow mb-3 md:mb-4">
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-black line-clamp-2">{article.title}</h3>
              <p className="text-gray-700 text-xs md:text-sm line-clamp-2">{article.description}</p>
            </div>

            {/* Category - Always at bottom */}
            {article.categories && article.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-auto items-center">
                <span className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-xs md:text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                  {article.categories[0]}
                </span>
              </div>
            )}

            {/* Views and Comments */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs md:text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{article.views || 0} views</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs md:text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{commentCounts[article.id] || 0} comments</span>
              </div>
            </div>
          </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
