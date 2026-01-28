'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useState, useRef } from 'react';
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
import { useSnapshot } from '@/hooks/useSnapshot';


export default function BlogDetailPage({ params }) {
  const { slug } = use(params);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { captureSnapshot, isSnapshotting } = useSnapshot();
  const contentRef = useRef(null);

  const handleSnapshot = () => {
    if (contentRef.current) {
       // Get the bounding rectangle of the content element
       const rect = contentRef.current.getBoundingClientRect();
       
       // Calculate how much of the element is above the viewport
       // If rect.top is negative, we've scrolled past the top of the element
       let yOffset = 0;
       if (rect.top < 0) {
         yOffset = Math.abs(rect.top);
       }
       
       // Account for any fixed header (typically 80px on this site)
       const headerHeight = 80;
       
       // If the element starts below the viewport top (hasn't been scrolled yet),
       // we need to adjust the offset to start from where it's visible
       if (rect.top > 0) {
         yOffset = 0;
       } else {
         // Add any additional scroll that happened past the element top
         yOffset = Math.abs(rect.top);
       }
       
       // Calculate the height to capture (viewport height minus header)
       const captureHeight = window.innerHeight - headerHeight;
       
       // Ensure we don't try to capture beyond the element's total height
       const maxOffset = contentRef.current.scrollHeight - captureHeight;
       if (yOffset > maxOffset && maxOffset > 0) {
         yOffset = maxOffset;
       }
       if (yOffset < 0) yOffset = 0;

       captureSnapshot(contentRef, blog?.title || 'blog-snapshot', { 
         height: captureHeight,
         width: contentRef.current.scrollWidth,
         y: yOffset,
         x: 0
       });
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    const fromPub = searchParams.get('from');
    
    // Try browser history first
    if (window.history.length > 1) {
      router.back();
    } 
    // Fallback to explicit navigation
    else if (fromPub) {
      router.push(`/view-site?publicationId=${fromPub}`);
    }
    // Default fallback
    else {
      const pubId = blog?.publication?.id || blog?.publicationId || blog?.publication_id;
      router.push(pubId ? `/view-site?publicationId=${pubId}` : '/view-site');
    }
  };

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

  // Process content to inject IDs for Table of Contents
  const [processedContent, setProcessedContent] = useState('');
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (!blog?.content) return;

    // Use DOMParser to parse and modify content safely
    const parser = new DOMParser();
    const doc = parser.parseFromString(blog.content, 'text/html');
    const headings = doc.querySelectorAll('h2');
    
    const extractedSections = Array.from(headings).map((heading, index) => {
      // Create a consistent ID
      const id = heading.id || `section-${index + 1}`;
      heading.id = id; // Inject ID back into the DOM node
      
      return {
        id,
        title: heading.textContent,
      };
    });

    setSections(extractedSections);
    setProcessedContent(doc.body.innerHTML);
  }, [blog?.content]);

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
            onSnapshot={handleSnapshot}
          />
        }
      />

      <section className="flex-grow flex justify-center w-full pt-20 ">
        <div className="flex w-[90%] lg:w-[78%] max-w-[1600px] gap-6 relative">
          {/* Left Sidebar - Navigation & TOC */}
          <aside className="hidden lg:block w-[240px] flex-shrink-0 pt-5 sticky top-28 h-[calc(100vh-6rem)] overflow-y-auto z-30">
            <div className="flex flex-col gap-8">
              <button 
                onClick={handleBack}
                className="inline-flex items-center gap-1 px-4 py-3 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-[#696969] text-sm font-semibold leading-none tracking-normal rounded-3xl w-fit transition-colors"
                type="button"
              >

                <Image
                  src="/svg/arrow_back.svg"
                  alt="Arrow Left"
                  width={12}
                  height={5}
                />
                
                Go back
              </button>
              <TableOfContents sections={sections} />
            </div>
          </aside>

          {/* Main Content */}
          <div ref={contentRef} className="flex-1 max-w-[800px] w-full min-w-0 mx-auto pt-12 pb-20 px-12 border-l border-[#EAEAEA] max-md:border-none max-md:px-2 max-md:pt-6">
            {/* Blog Title */}
            <h1 className="text-[#202020] text-[40px] font-extrabold leading-[1.09] mb-6 tracking-normal break-words max-md:text-[24px] max-md:leading-[1.2] max-md:mb-3 ">
              {blog.title}
            </h1>

            {/* Blog Description */}
            <p className="text-base font-normal leading-7 tracking-[0.01em] text-[#696969] mb-6 break-words max-md:text-sm max-md:leading-[1.5] max-md:mb-3 max-md:text-[#808080]">
              {blog.description}
            </p>

            {/* Mobile Categories/Tags */}
            {/* Mobile Categories/Tags */}
            <div className="flex flex-wrap gap-2 mb-6 max-md:mb-3">
              {blog.categories && blog.categories.length > 0 ? (
                blog.categories.map((category, index) => (
                  <span key={index} className="text-[#7C7C7C] text-sm font-normal leading-normal tracking-normal px-4 py-1.5 border border-[#EAEAEA] rounded-lg max-md:text-[10px] max-md:px-3">
                    {category}
                  </span>
                ))
              ) : (
                <span className="text-[#7C7C7C] text-sm font-normal leading-normal tracking-normal px-4 py-1.5 border border-[#EAEAEA] rounded-lg max-md:text-[10px] max-md:px-3">
                  Uncategorized
                </span>
              )}
            </div>

            {/* Author and Date Meta */}
            <div className="flex items-center justify-between py-3 border-t border-b border-[#EAEAEA] mb-10 max-md:mb-6">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 max-md:w-7 max-md:h-7 ">
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
                <span className="text-[#404040] text-base font-normal italic leading-[1.88] tracking-normal max-md:text-[12px] max-md:leading-[1.5]">
                  {blog.author?.name || 'Anonymous'}
                </span>
              </div>
              
              {/* Date */}
              <div className="flex items-center gap-2 text-[#808080] text-sm font-normal leading-normal tracking-normal max-md:text-[12px] max-md:leading-[1.5]">
                <div className="flex-shrink-0">
                  <ClockIcon className="w-3.5 h-3.5 max-md:w-2.5 max-md:h-2.5" />
                </div>
                <span>Created on {dateFormatted.fullDate || dateFormatted.date}</span>
              </div>
            </div>

            {/* Blog Content */}
              <article
                className="prose prose-lg max-w-none prose-headings:font-bold prose-heading:text-xl prose-heading:leading-none prose-heading:tracking-normal prose-headings:text-[#000000] prose-p:text-[#404040] prose-p:text-base prose-p:font-normal prose-p:leading-7 prose-p:tracking-[0.01em] prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl max-md:[&_p]:text-[14px] max-md:[&_p]:leading-6 prose max-md:[&_h1]:text-[14px]"
                dangerouslySetInnerHTML={{ __html: (() => {
                  // Use processed content if available, otherwise original
                  const contentToRender = processedContent || blog.content;
                  
                  // Convert relative image URLs to full URLs for display
                  const apiUrl = 'http://localhost:5000';
                  return contentToRender.replace(/src="([^"]*)"/g, (match, src) => {
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
          <aside className="hidden xl:block w-16 pt-6 h-fit sticky top-28 z-30">
             <SocialSidebar 
               title={blog.title}
               slug={blog.slug}
               blogId={blog.id}
               onSnapshot={handleSnapshot}
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
        sections={sections}
        blogId={blog.id}
      />
    </div>
  );
}
