'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ViewSiteHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ShareButtons from '../../components/ShareButtons/ShareButtons';
import CommentSection from '../../components/CommentSection/CommentSection';
import TableOfContents from '../../components/TableOfContents/TableOfContents';
import BackToHomeButton from '../../components/BackToHomeButton/BackToHomeButton';
import ScrollToTop from '../../components/ScrollToTop/ScrollToTop';
import MobileBottomNav from '../../components/MobileBottomNav/MobileBottomNav';
import ClockIcon from '../../components/icons/ClockIcon';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug;
  const [sections, setSections] = useState([]);

  const blog = null;

  useEffect(() => {
    // Extract all h2 headings from the article content for mobile TOC
    const article = document.querySelector('article');
    if (article) {
      const headings = article.querySelectorAll('h2');
      const extractedSections = Array.from(headings).map((heading, index) => {
        if (!heading.id) {
          heading.id = `section-${index + 1}`;
        }
        return {
          id: heading.id,
          title: heading.textContent,
        };
      });
      setSections(extractedSections);
    }
  }, [blog]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
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
      day: days[date.getDay()],
      date: `${day} ${month}, ${year}`,
      fullDate: `${getOrdinal(parseInt(day))} ${month}`,
    };
  };

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `http://localhost:3000/view-site/blog/${slug}`;

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ViewSiteHeader userName="Guest" userAvatar={null} />
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ViewSiteHeader userName={blog.author.name} userAvatar={blog.author.avatar} />

      <section className="flex-grow flex  justify-center w-full px-4 md:px-6">
        <div className="flex max-w-[1400px] w-full justify-center gap-8">
          {/* Table of Contents - Left Sidebar */}
          <aside className="hidden lg:block flex-shrink-0 pt-20 space-y-0 w-[200px]">
            <BackToHomeButton />
            <TableOfContents />
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-[800px] pb-20 md:pb-12 pt-6 md:pt-20 lg:pl-12 lg:border-l-2 min-w-0">
          {/* Blog Title */}
          <h1 className="text-2xl leading-tight md:text-5xl font-bold text-black mb-4 md:mb-4 break-words">{blog.title}</h1>

          {/* Blog Description */}
          <p className="text-sm leading-relaxed md:text-xl text-gray-500 mb-6 md:mb-8 break-words">{blog.description}</p>

          {/* Categories - Mobile Only */}
          <div className="flex flex-wrap gap-2 mb-6 md:hidden">
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Category</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Category</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Category</span>
          </div>

          {/* Author and Date */}
          <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-8 py-3 md:py-4 md:px-2 md:border-y md:border-gray-200">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                {blog.author?.avatar && (
                  <Image src={blog.author.avatar} alt={blog.author.name} width={40} height={40} />
                )}
              </div>
              <span className="text-gray-800 font-medium text-sm md:text-base truncate">
                {blog.author?.name || 'Anonymous'}
              </span>
            </div>
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
              src={blog.thumbnail}
              alt={blog.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Blog Content */}
          <article
            className="prose prose-sm md:prose-lg max-w-none prose-headings:font-bold prose-headings:text-black prose-p:text-gray-700 prose-p:leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Comment and Discussion Section */}
          <CommentSection blogId={blog.id} />
        </div>

          {/* Share Buttons - Fixed on right side (Desktop only) */}
          <div className="hidden lg:block flex-shrink-0 w-[100px]">
            <ShareButtons
              title={blog.title}
              slug={blog.slug}
              url={currentUrl}
              description={blog.description}
            />
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        title={blog.title}
        slug={blog.slug}
        url={currentUrl}
        description={blog.description}
        sections={sections}
      />
    </div>
  );
}
