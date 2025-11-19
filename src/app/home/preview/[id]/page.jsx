'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Info, Bell } from 'lucide-react';

export default function PreviewPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    // Mock article data - replace with actual API call
    const mockArticle = {
      id: id,
      title: 'Title of the blog will ( Heading 1)',
      author: {
        name: 'Author Name',
        avatar: '/icons/nib.svg',
      },
      categories: ['Category'],
      createdAt: '24th January',
      content: `
        <h2>Title of the blog will added in this area ( Heading 2)</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        
        <h2>Title of the blog will added in this area ( Heading 2)</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        
        <img src="https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop" alt="Article image" style="width: 100%; border-radius: 8px; margin: 24px 0;" />
        
        <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 24px 0; color: #6b7280; font-style: italic;">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </blockquote>
      `,
    };

    setArticle(mockArticle);
  }, [id]);

  const handleClose = () => {
    router.back();
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white md:bg-gray-100">
      {/* Header */}
      <div className="h-[80px] max-md:h-[50px] bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          {/* Logo - Mobile only */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xl font-bold">
              <span className="text-purple-600 italic">ink</span>
              <span className="text-black">SIGMA</span>
            </span>
          </div>

          {/* Right side icons - Mobile only */}
          <div className="flex items-center gap-4 md:hidden">
            {/* Notification Bell */}
            <button className="text-gray-600 hover:text-gray-900">
              <Bell className="w-6 h-6" />
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
              <Image src={article.author.avatar} alt="User" width={36} height={36} className="object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col justify-center
 md:flex-row">
        {/* Left Sidebar - Close Preview Button */}
        <div className="w-full md:w-[160px] bg-white md:bg-gray-100 px-4 py-4 md:p-6 flex-shrink-0  md:border-b-0 border-gray-200">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm text-nowrap
 font-medium">Close Preview</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className=" bg-white md:shadow-lg min-h-screen">
          {/* Preview Banner */}
          <div className="bg-purple-50 border-b border-purple-100 px-4 md:px-8 py-3 mx-4 md:mx-0 mt-4 md:mt-0 rounded-lg md:rounded-none">
            <div className="flex items-center gap-2 text-purple-700">
              <Info className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">This is a preview of your draft article</span>
            </div>
          </div>

          {/* Article Content */}
          <div className="px-4 md:px-8 py-6 md:py-8 max-w-[900px]">
            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-bold text-black mb-4 md:mb-8 leading-tight">
              {article.title}
            </h1>

            {/* Categories - Mobile */}
            <div className="flex items-center gap-2 mb-4 md:hidden">
              {article.categories.map((category, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                  {category}
                </span>
              ))}
            </div>

            {/* Created Date - Mobile */}
            <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-6 md:hidden">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Created on {article.createdAt}</span>
            </div>

            {/* Categories, Author Avatar, and Date - Desktop */}
            <div className="hidden md:flex items-center justify-between mb-10 pb-6 border-b border-gray-200">
              {/* Left side - Categories and Author */}
              <div className="flex items-center gap-4">
                {/* Categories */}
                <div className="flex items-center gap-2">
                  {article.categories.map((category, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right side - Created Date */}
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Created on {article.createdAt}</span>
              </div>
            </div>

            {/* Article Body */}
            <article
              className="prose prose-sm md:prose-lg max-w-none prose-headings:font-bold prose-headings:text-black prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-0 prose-h2:mb-3 md:prose-h2:mb-4 prose-p:text-gray-600 md:prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 md:prose-p:mb-6 prose-img:rounded-lg prose-img:my-6 md:prose-img:my-8 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* Footer */}
          <footer className="text-center py-8 px-4">
            <p className="text-sm text-gray-300">
              Copyright © 2023 designed & developed by{' '}
              <a
                href="https://inksigma.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-gray-400 underline"
              >
                Inksigma
              </a>
              , a{' '}
              <a
                href="https://zemuria.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-gray-400 underline"
              >
                Zemuria Inc
              </a>
              . brand
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
