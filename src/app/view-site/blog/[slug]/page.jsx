'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import ViewSiteHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import TableOfContents from '../../components/TableOfContents/TableOfContents';
import BackToHomeButton from '../../components/BackToHomeButton/BackToHomeButton';
import ScrollToTop from '../../components/ScrollToTop/ScrollToTop';
import MobileBottomNav from '../../components/MobileBottomNav/MobileBottomNav';
import CommentSection from '../../components/CommentSection/CommentSection';
import ClockIcon from '../../components/icons/ClockIcon';
import { getImageUrl } from '@/utils/imageUrl';

export default function BlogDetailPage({ params }) {
  const { slug } = use(params);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        // Fetch blog by slug (without incrementing view here)
        const response = await fetch(`http://localhost:5000/api/blogs/slug/${slug}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog');
        }
        
        const foundBlog = await response.json();
        
        if (!foundBlog || foundBlog.error) {
          setError('Blog not found');
        } else {
          // Fetch publication details if publicationId exists
          if (foundBlog.publicationId) {
            const pubResponse = await fetch(`http://localhost:5000/api/publications/${foundBlog.publicationId}`, {
              credentials: 'include'
            });
            
            if (pubResponse.ok) {
              const pubData = await pubResponse.json();
              foundBlog.publication = pubData;
            }
          }
          
          setBlog(foundBlog);
          
          // Track view separately using the new tracking system
          if (foundBlog.status === 'published') {
            try {
              await fetch('http://localhost:5000/api/views/track', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ blogId: foundBlog.id }),
              });
            } catch (viewError) {
              console.error('Error tracking view:', viewError);
              // Don't fail the page load if view tracking fails
            }
          }
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  // Scroll to top when blog page loads
  useEffect(() => {
    // Always scroll to top when opening a blog post
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    // Get ordinal suffix for day
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return {
      date: `${day} ${month}, ${year}`,
      fullDate: `${getOrdinal(parseInt(day))} ${month}`,
    };
  };

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `http://localhost:3000/view-site/blog/${slug}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ViewSiteHeader userName="Loading..." userAvatar={null} />
        <div className="flex-grow max-w-[800px] mx-auto px-6 py-12 flex items-center justify-center">
          <p className="text-gray-500">Loading blog...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ViewSiteHeader userName="Publication" userAvatar={null} />
        <div className="flex-grow max-w-[800px] mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-black mb-4">Blog not found</h1>
          <Link href="/view-site" className="text-purple-600 hover:text-purple-700">
            Back to home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const dateFormatted = formatDate(blog.createdAt);
  const thumbnailUrl = getImageUrl(blog.image) || "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Section - Full Width */}
      <div className="w-full h-[92px] bg-white flex items-center justify-center gap-2.5">
        <div className="max-w-[1920px] w-full px-6 flex items-center justify-between">
          <ViewSiteHeader 
            userName={blog.publication?.name || "Your Publication"} 
            userAvatar={blog.publication?.logoUrl ? `http://localhost:5000${blog.publication.logoUrl}` : null} 
          />
        </div>
      </div>

      <section className="flex-grow flex justify-center w-full px-4 md:px-6 pt-6 md:pt-8">
        <div className="flex max-w-[1400px] w-full ml-12 gap-8">
          {/* Left Sidebar - Back Button and Table of Contents */}
          <aside className="hidden lg:block flex-shrink-0 pt-8 w-[300px]">
            <div className="sticky flex item-start top-28">
              <BackToHomeButton />
              <TableOfContents />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-[800px] pb-40 max-md:pb-12 pt-0 md:pt-0 lg:pl-12 min-w-0">
          {/* Blog Title */}
          <h1 className="text-2xl leading-tight md:text-3xl font-bold text-black mb-4 md:mb-4 break-words">{blog.title}</h1>

          {/* Blog Description */}
          <p className="text-sm leading-relaxed md:text-xl text-gray-500 mb-6 md:mb-8 break-words">{blog.description}</p>

          {/* Categories - Mobile Only */}
          <div className="flex flex-wrap gap-2 mb-6 md:hidden">
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Category</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Category</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Category</span>
          </div>

          {/* Author and Date */}
          <div className="flex items-center justify-between gap-3 mb-6 md:mb-8 py-3 md:py-4 md:px-2">
            {/* Left side - Author */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                {blog.author?.image ? (
                  <img
                    src={
                      blog.author.image.startsWith('http') || blog.author.image.startsWith('https')
                        ? blog.author.image 
                        : blog.author.image.startsWith('/') 
                          ? `http://localhost:5000${blog.author.image}`
                          : `http://localhost:5000/${blog.author.image}`
                    } 
                    alt={blog.author?.name || 'Author'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const initial = blog.author?.name?.charAt(0).toUpperCase() || 'A';
                      e.target.parentElement.innerHTML = `<div class="w-full h-full bg-purple-100 flex items-center justify-center"><span class="text-purple-600 font-semibold text-sm">${initial}</span></div>`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">
                      {blog.author?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-gray-800 font-medium text-sm md:text-base truncate">
                {blog.author?.name || 'Anonymous'}
              </span>
            </div>
            
            {/* Right side - Date */}
            <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
              <ClockIcon className="md:w-4 md:h-4 flex-shrink-0" />
              <span className="text-xs md:text-sm whitespace-nowrap">
                Created on {dateFormatted.fullDate || dateFormatted.date}
              </span>
            </div>
          </div>

          {/* Blog Image */}
          <div className="relative w-full h-[220px] md:h-[400px] rounded-lg md:rounded-2xl mb-6 md:mb-12 overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={blog.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Blog Content */}
          <article
            className="prose prose-sm md:prose-lg max-w-none prose-headings:font-bold prose-headings:text-black prose-p:text-gray-700 prose-p:leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Comment Section */}
          <CommentSection blogId={blog.id} />
        </div>
        </div>
      </section>

      <Footer publicationName={blog.publication?.name} />
      <ScrollToTop />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        title={blog.title}
        slug={blog.slug}
        url={currentUrl}
        description={blog.description}
        sections={[]}
        blogId={blog.id}
      />
    </div>
  );
}
