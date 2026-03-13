"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Info, Bell } from "lucide-react";
import { formatTimeAgo } from "@/utils/timeFormatter";
import { getImageUrl } from "@/utils/imageUrl";
import { getApiBase } from "@/utils/apiBase";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PreviewPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const publicationId = searchParams.get("publicationId");
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const apiBase = getApiBase();
        const url = `${apiBase}/api/blogs/${id}`;

        const response = await fetch(url, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch article");
        }

        const data = await response.json();

        // Fetch publication details if publicationId exists
        if (data.publicationId) {
          const pubResponse = await fetch(
            `${apiBase}/api/publications/${data.publicationId}`,
            {
              credentials: "include",
            },
          );

          if (pubResponse.ok) {
            const pubData = await pubResponse.json();
            data.publication = pubData;
          }
        }

        setArticle(data);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading preview...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Article not found"}</p>
          <button
            onClick={handleClose}
            className="text-purple-600 hover:text-purple-700 underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="h-[80px] max-md:h-[50px] bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          {/* Logo/Publication Name - Mobile only */}
          <div className="flex items-center gap-2 md:hidden">
            {article.publication?.logoUrl ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 bg-gray-200">
                  <AvatarImage
                    src={`${getApiBase()}${article.publication.logoUrl}`}
                    alt={article.publication.name}
                    className="w-full h-full object-cover"
                  />
                  <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold text-xs">
                    {article.publication?.name?.charAt(0).toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-lg font-bold text-black">
                  {article.publication.name}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold">
                <span className="text-purple-600 italic">ink</span>
                <span className="text-black">SIGMA</span>
              </span>
            )}
          </div>

          {/* Right side icons - Mobile only */}
          <div className="flex items-center gap-4 md:hidden">
            {/* Notification Bell */}
            <button className="text-gray-600 hover:text-gray-900">
              <Bell className="w-6 h-6" />
            </button>

            {/* User Avatar */}
            <Avatar className="w-9 h-9 bg-gray-300">
              {article.author?.image && (
                <AvatarImage
                  src={
                    article.author.image.startsWith("http")
                      ? article.author.image
                      : `${getApiBase()}${article.author.image}`
                  }
                  alt={article.author.name || "User"}
                  className="w-full h-full object-cover"
                />
              )}
              <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold text-sm">
                {article.author?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col justify-center md:flex-row">
        {/* Left Sidebar - Close Preview Button */}
        <div className="   px-6 py-2  flex-shrink-0  md:border-b-0 border-gray-200">
          <button
            onClick={handleClose}
            className="flex items-center px-2 py-1 gap-2 text-[#696969] hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm text-nowrap font-semibold leading-none">
              Close Preview
            </span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className=" bg-white min-h-[calc(100vh-80px)] max-md:min-h-[calc(100vh-50px)] border-x border-[#EAEAEA] flex flex-col">
          {/* Preview Banner */}
          <div className="bg-[#F3EEFF] border-b border-purple-100 px-4 md:px-8 py-3 mx-4 md:mx-0 mt-4 md:mt-0 rounded-lg md:rounded-none">
            <div className="flex items-center gap-2 text-[#7A37AE] font-medium text-[14px] leading-normal tracking-normal">
              <img
                src="/svg/preview_icon.svg"
                alt=""
                className="w-5 h-5 flex-shrink-0"
              />
              <span className="text-sm">
                This is a preview of your draft article
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div className="w-full max-w-[900px] mx-auto flex-grow">
            {/* Title */}
            <h1 className="text-2xl md:text-4xl px-4 md:px-11 py-6 font-bold text-black leading-tight break-words">
              {article.title}
            </h1>

            <div className="px-4 md:pl-11 md:pr-6 py-4 border-y border-gray-200">
              {/* Categories and Date - Mobile */}
              <div className="md:hidden mb-6">
                {article.categories && article.categories.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {article.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Created {formatTimeAgo(article.createdAt)}</span>
                </div>
              </div>

              {/* Categories and Date - Desktop */}
              <div className="hidden md:flex items-center justify-between  ">
                {/* Left side - Categories */}
                <div className="flex items-center gap-4">
                  {article.categories && article.categories.length > 0 && (
                    <div className="flex items-center gap-2">
                      {article.categories.map((category, index) => (
                        <span
                          key={index}
                          className="px-[12px] py-[6px] bg-gray-100 font-normal text-[#808080] text-sm leading-normal tracking-normal rounded"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side - Created Date */}
                <div className="flex items-center gap-1 text-[#808080] font-normal text-xs leading-normal tracking-normal flex-shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="whitespace-nowrap">
                    Created {formatTimeAgo(article.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 md:px-11 py-8">
              {/* Article Body */}
              <article
                className="prose prose-sm md:prose-lg max-w-none prose-headings:mt-0 prose-headings:mb-3 md:prose-headings:mb-4 [&_:is(h1,h2,h3,h4,h5,h6)]:!font-bold [&_:is(h1,h2,h3,h4,h5,h6)]:!text-[20px] [&_:is(h1,h2,h3,h4,h5,h6)]:!leading-[100%] [&_:is(h1,h2,h3,h4,h5,h6)]:!tracking-[0%] [&_:is(h1,h2,h3,h4,h5,h6)]:!text-black [&_:is(h1,h2,h3,h4,h5,h6)_span]:!font-bold [&_:is(h1,h2,h3,h4,h5,h6)_span]:!text-[20px] [&_:is(h1,h2,h3,h4,h5,h6)_span]:!leading-[100%] [&_:is(h1,h2,h3,h4,h5,h6)_span]:!tracking-[0%] [&_:is(h1,h2,h3,h4,h5,h6)_span]:!text-black [&_p]:!text-[#404040] [&_p_span]:!text-[#404040] [&_p_span]:!font-normal [&_p_span]:!text-[16px] [&_p_span]:!leading-[28px] [&_p_span]:!tracking-[0.01em] prose-p:font-normal prose-p:text-[16px] prose-p:leading-[28px] prose-p:tracking-[0.01em] prose-p:mb-4 md:prose-p:mb-6 prose-img:rounded-lg prose-img:my-6 md:prose-img:my-8 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 text-[#404040] [&_img]:!max-w-full [&_img]:!h-auto break-words overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml((() => {
                    if (!article.content) return "";
                    const apiUrl = getApiBase();
                    return article.content.replace(
                      /src="([^"]*)"/g,
                      (match, src) => {
                        if (!src) return match;
                        if (
                          src.startsWith("http://") ||
                          src.startsWith("https://")
                        )
                          return match;
                        if (src.startsWith("/")) return `src="${apiUrl}${src}"`;
                        return `src="${apiUrl}/${src}"`;
                      },
                    );
                  })()),
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center py-8 px-4">
            <p className="text-sm text-gray-300">
              Copyright © 2023 designed & developed by{" "}
              <a
                href="https://inksigma.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-gray-400 underline"
              >
                Inksigma
              </a>
              , a{" "}
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
