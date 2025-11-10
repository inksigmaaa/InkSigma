import ViewSiteHeader from '../components/Header/Header';
import ShareButtons from '../components/ShareButtons/ShareButtons';
import CommentSection from '../components/CommentSection/CommentSection';
import TableOfContents from '../components/TableOfContents/TableOfContents';
import BackToHomeButton from '../components/BackToHomeButton/BackToHomeButton';
import { blogData } from './blogData';
import Link from 'next/link';
import Image from 'next/image';

export async function generateMetadata() {
  const blog = blogData['vaccine-for-a-virus'];

  return {
    title: `${blog.title} - Techan Chronicle`,
    description: blog.description,
    openGraph: {
      title: blog.title,
      description: blog.description,
      url: `http://localhost:3000/blog`,
      siteName: 'Techan Chronicle',
      images: [
        {
          url: blog.image,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.description,
      images: [blog.image],
    },
  };
}

export default function BlogDetailPage() {
  const blog = blogData['vaccine-for-a-virus'];

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `http://localhost:3000/blog`;

  return (
    <div className="min-h-screen bg-white">
      <ViewSiteHeader userName="Rajeswari" />

      <section className="flex max-w-[1400px] mx-auto px-6 gap-8 pt-8">
        {/* Table of Contents - Left Sidebar */}
        <aside className="hidden lg:block flex-shrink-0">
          <BackToHomeButton />
          <TableOfContents />
        </aside>

        {/* Main Content */}
        <div className="flex-1 max-w-[800px] pb-12">

          {/* Blog Title */}
          <h1 className="text-5xl font-bold text-black mb-4">{blog.title}</h1>

          {/* Blog Description */}
          <p className="text-xl text-gray-600 mb-8">{blog.description}</p>

          {/* Author and Date */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                <div className="w-full h-full bg-gray-400"></div>
              </div>
              <span className="text-gray-800 font-medium">
                {blog.author.name}
              </span>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-sm">
                {blog.date.day} | {blog.date.date}
              </div>
            </div>
          </div>

          {/* Blog Image */}
          <div className="w-full h-[400px] bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 rounded-2xl mb-12 flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <div className="text-6xl">🦠</div>
            </div>
          </div>

          {/* Blog Content */}
          <article
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Comment and Discussion Section */}
          <CommentSection />
        </div>

        {/* Share Buttons - Fixed on right side */}
        <ShareButtons
          title={blog.title}
          slug={blog.slug}
          url={currentUrl}
          description={blog.description}
        />
      </section>

      {/* Footer CTA */}
      <div className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="w-full max-w-[745px] mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Having ideas? Get started in writing your own Article!
          </h2>
          <a
            href="/write"
            className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Start Writing
          </a>
          <p className="text-sm text-gray-500 mt-6">
            Made with{' '}
            <a
              href="https://inksigma.com"
              className="text-purple-600 hover:text-purple-700"
            >
              Inksigma
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="w-full max-w-[745px] mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:text-gray-700">
              Terms and Conditions
            </a>
            <span>•</span>
            <a href="/privacy" className="hover:text-gray-700">
              Privacy Policy
            </a>
          </div>
          <div>
            <p>
              Copyright © 2024 designed & developed by{' '}
              <a
                href="https://inksigma.com"
                className="text-purple-600 hover:text-purple-700"
              >
                Inksigma
              </a>
              , a{' '}
              <a
                href="https://zemuria.inc"
                className="text-purple-600 hover:text-purple-700"
              >
                Zemuria Inc
              </a>
              . brand
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
