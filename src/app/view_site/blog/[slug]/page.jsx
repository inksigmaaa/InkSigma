'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ViewSiteHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ShareButtons from '../../components/ShareButtons/ShareButtons';
import CommentSection from '../../components/CommentSection/CommentSection';
import TableOfContents from '../../components/TableOfContents/TableOfContents';
import BackToHomeButton from '../../components/BackToHomeButton/BackToHomeButton';
import ScrollToTop from '../../components/ScrollToTop/ScrollToTop';
import mockData from '@/data/mockBlogs.json';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug;

  const blog = mockData.blogs.find(b => b.slug === slug);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      day: days[date.getDay()],
      date: `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`,
    };
  };

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `http://localhost:3000/view_site/blog/${slug}`;

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ViewSiteHeader userName="Guest" userAvatar={null} />
        <div className="flex-grow max-w-[800px] mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-black mb-4">Blog not found</h1>
          <Link href="/view_site" className="text-purple-600 hover:text-purple-700">
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

      <section className="flex-grow flex max-w-[1400px] mx-auto  px-6 gap-8">
        {/* Table of Contents - Left Sidebar */}
        <aside className="hidden lg:block flex-shrink-0 pt-20">
          <BackToHomeButton />
          <TableOfContents />
        </aside>

        {/* Main Content */}
        <div className="flex-1 max-w-[900px] pb-12 pt-20">
          {/* Blog Title */}
          <h1 className="text-5xl font-bold text-black mb-4">{blog.title}</h1>

          {/* Blog Description */}
          <p className="text-xl text-gray-600 mb-8">{blog.description}</p>

          {/* Author and Date */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                {blog.author?.avatar && (
                  <Image src={blog.author.avatar} alt={blog.author.name} width={40} height={40} />
                )}
              </div>
              <span className="text-gray-800 font-medium">
                {blog.author?.name || 'Anonymous'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-sm">
                {dateFormatted.day} | {dateFormatted.date}
              </div>
            </div>
          </div>

          {/* Blog Image */}
          <div className="relative w-full h-[400px] rounded-2xl mb-12 overflow-hidden">
            <Image
              src={blog.thumbnail}
              alt={blog.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Blog Content */}
          <article
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Comment and Discussion Section */}
          <CommentSection blogId={blog.id} />
        </div>

        {/* Share Buttons - Fixed on right side */}
        <div>
          <ShareButtons
            title={blog.title}
            slug={blog.slug}
            url={currentUrl}
            description={blog.description}
          />
        </div>

      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
