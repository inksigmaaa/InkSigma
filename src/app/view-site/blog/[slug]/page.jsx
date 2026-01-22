'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import ViewSiteHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import TableOfContents from '../../components/TableOfContents/TableOfContents';
import SocialSidebar from '../../components/SocialSidebar/SocialSidebar';
import ShareMenu from '../../components/ShareMenu/ShareMenu';
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
      {/* Header Section */}
      <ViewSiteHeader 
        userName={blog.publication?.name || (blog.author?.name ? `${blog.author.name}'s Blog` : "InkSigma")} 
        userAvatar={blog.publication?.logoUrl ? `http://localhost:5000${blog.publication.logoUrl}` : (blog.author?.image ? (blog.author.image.startsWith('http') ? blog.author.image : `http://localhost:5000${blog.author.image}`) : null)} 
        shareButton={
          <ShareMenu 
            title={blog.title}
            slug={blog.slug}
            blogId={blog.id}
            variant="outline"
          />
        }
      />

      <section className="flex-grow flex justify-center w-full pt-20 pb-20">
        <div className="flex w-[90%] lg:w-[78%] max-w-[1600px] gap-6 relative">
          {/* Left Sidebar - Navigation & TOC */}
          <aside className="hidden lg:block w-[240px] flex-shrink-0 pt-8 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto ">
            <div className="flex flex-col gap-8">
              <Link 
                href={
                  blog?.publication?.id 
                    ? `/view-site?publicationId=${blog.publication.id}` 
                    : (blog?.publicationId || blog?.publication_id
                        ? `/view-site?publicationId=${blog.publicationId || blog.publication_id}` 
                        : '/view-site')
                }
                className="inline-flex items-center gap-1 px-4 py-3 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-[#696969] text-sm font-semibold leading-none tracking-normal rounded-3xl w-fit transition-colors"
              >

                <Image
                  src="/svg/arrow_back.svg"
                  alt="Arrow Left"
                  width={12}
                  height={5}
                />
                
                Go to homepage
              </Link>
              <TableOfContents content={blog.content} />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-[800px] w-full min-w-0 mx-auto pt-12 px-12 border-l border-[#EAEAEA]">
            {/* Blog Title */}
            <h1 className="text-[#202020] text-[40px] font-extrabold leading-[1.09] mb-6 tracking-normal break-words">
              {blog.title}
            </h1>

            {/* Blog Description */}
            <p className="text-base font-normal leading-7 tracking-[0.01em] text-[#696969] mb-6 break-words">
              {blog.description}
            </p>

            {/* Mobile Categories/Tags */}
            <div className="flex flex-wrap gap-2 mb-6 md:hidden">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Category</span>
            </div>

            {/* Author and Date Meta */}
            <div className="flex items-center justify-between py-3 border-t border-b border-[#EAEAEA] mb-10">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
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
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-purple-100 flex items-center justify-center"><span class="text-purple-600 font-semibold text-sm">${blog.author?.name?.charAt(0).toUpperCase() || 'A'}</span></div>`;
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
                <span className="text-[#404040] text-base font-normal italic leading-[1.88] tracking-normal">
                  {blog.author?.name || 'Anonymous'}
                </span>
              </div>
              
              {/* Date */}
              <div className="flex items-center gap-2 text-[#808080] text-sm font-normal leading-normal tracking-normal">
                <ClockIcon className="w-3.5 h-3.5" />
                <span>Created on {dateFormatted.fullDate || dateFormatted.date}</span>
              </div>
            </div>

            {/* Blog Image */}
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-10 bg-gray-100">
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
              className="prose prose-lg max-w-none prose-headings:font-bold prose-heading:text-xl prose-heading:leading-none prose-heading:tracking-normal prose-headings:text-[#000000] prose-p:text-[#404040] prose-p:text-base prose-p:font-normal prose-p:leading-7 prose-p:tracking-[0.01em] prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: (() => {
                // Convert relative image URLs to full URLs for display
                const apiUrl = 'http://localhost:5000';
                return blog.content.replace(/src="([^"]*)"/g, (match, src) => {
                  if (!src) return match;
                  if (src.startsWith('http://') || src.startsWith('https://')) return match;
                  if (src.startsWith('/')) return `src="${apiUrl}${src}"`;
                  return `src="${apiUrl}/${src}"`;
                });
              })() }}
            />

            {/* Comment Section */}
            <div className="">
              <CommentSection blogId={blog.id} />
            </div>
          </div>

          {/* Right Sidebar - Social Share */}
          <aside className="hidden xl:block w-16 pt-16 h-fit sticky top-0">
             <SocialSidebar 
               title={blog.title}
               slug={blog.slug}
               blogId={blog.id}
             />
          </aside>
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
