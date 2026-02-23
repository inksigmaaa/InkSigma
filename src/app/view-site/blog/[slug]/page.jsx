"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ViewSiteHeader from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import TableOfContents from "../../components/TableOfContents/TableOfContents";
import SocialSidebar from "../../components/SocialSidebar/SocialSidebar";
import ShareMenu from "../../components/ShareMenu/ShareMenu";
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop";
import MobileBottomNav from "../../components/MobileBottomNav/MobileBottomNav";
import CommentSection from "../../components/CommentSection/CommentSection";
import { use, useEffect, useState, useRef } from "react";
import ClockIcon from "../../components/icons/ClockIcon";
import { useSnapshot } from "@/hooks/useSnapshot";
import { getApiBase } from "@/utils/apiBase";

const API_URL = getApiBase();

export default function BlogDetailPage({ params }) {
  const { slug } = use(params);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { captureSnapshot } = useSnapshot();
  const contentRef = useRef(null);
  const tocStickyRef = useRef(null);
  const footerRef = useRef(null);
  const footerPreviousTopRef = useRef(null);

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

      captureSnapshot(contentRef, blog?.title || "blog-snapshot", {
        height: captureHeight,
        width: contentRef.current.scrollWidth,
        y: yOffset,
        x: 0,
      });
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    const fromPub = searchParams.get("from");

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
      const pubId =
        blog?.publication?.id || blog?.publicationId || blog?.publication_id;
      router.push(pubId ? `/view-site?publicationId=${pubId}` : "/view-site");
    }
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        // Fetch blog by slug (without incrementing view here)
        const response = await fetch(`${API_URL}/api/blogs/slug/${slug}`);

        if (!response.ok) {
          throw new Error("Failed to fetch blog");
        }

        const foundBlog = await response.json();

        if (!foundBlog || foundBlog.error) {
          setError("Blog not found");
        } else {
          // Process content immediately
          if (foundBlog.content) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(foundBlog.content, "text/html");

            // Fix Images
            const images = doc.querySelectorAll("img");
            const backendUrl = API_URL;

            images.forEach((img, index) => {
              const src = img.getAttribute("src");
              if (src && src.startsWith("/")) {
                img.setAttribute("src", `${backendUrl}${src}`);
              }

              // Optimize LCP
              if (index === 0) {
                img.setAttribute("loading", "eager");
                img.setAttribute("fetchpriority", "high");
              } else {
                img.setAttribute("loading", "lazy");
              }
            });

            // Process TOC
            const headings = doc.querySelectorAll("h2");
            const extractedSections = Array.from(headings).map(
              (heading, index) => {
                const id = heading.id || `section-${index + 1}`;
                heading.id = id;
                return {
                  id,
                  title: heading.textContent,
                };
              },
            );

            setSections(extractedSections);
            foundBlog.content = doc.body.innerHTML;
          }

          // Fetch publication details if publicationId exists
          if (foundBlog.publicationId) {
            const pubResponse = await fetch(
              `${API_URL}/api/publications/${foundBlog.publicationId}`,
              {
                credentials: "include",
              },
            );

            if (pubResponse.ok) {
              const pubData = await pubResponse.json();
              foundBlog.publication = pubData;
            }
          }

          setBlog(foundBlog);

          // Track view separately using the new tracking system
          if (foundBlog.status === "published") {
            try {
              let shouldTrack = true;
              if (typeof window !== "undefined") {
                try {
                  const viewKey = `viewed:${foundBlog.id}`;
                  if (localStorage.getItem(viewKey)) {
                    shouldTrack = false;
                  } else {
                    localStorage.setItem(viewKey, "1");
                  }
                } catch {
                  // If storage is unavailable, fall back to server-side dedupe only
                }
              }

              if (shouldTrack) {
                await fetch(`${API_URL}/api/views/track`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify({ blogId: foundBlog.id }),
                });
              }
            } catch (viewError) {
              console.error("Error tracking view:", viewError);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (loading) return;

    const topOffset = 96; // matches top-28
    let rafId = null;
    let lastHeight = null;

    const updateTocHeight = () => {
      rafId = null;
      if (!tocStickyRef.current) return;

      const defaultHeight = window.innerHeight - topOffset;
      let nextHeight = defaultHeight;

      if (footerRef.current) {
        const footerTop = footerRef.current.getBoundingClientRect().top;
        nextHeight = Math.min(defaultHeight, footerTop - topOffset);
      }

      const clampedHeight = Math.max(0, Math.round(nextHeight));
      if (clampedHeight === lastHeight) return;

      lastHeight = clampedHeight;
      tocStickyRef.current.style.height = `${clampedHeight}px`;
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateTocHeight);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
    };
  }, [loading]);

  useEffect(() => {
    const handleCommentWillAdd = () => {
      if (!footerRef.current) return;
      footerPreviousTopRef.current =
        footerRef.current.getBoundingClientRect().top;
    };

    const handleCommentDidAdd = () => {
      if (!footerRef.current || footerPreviousTopRef.current === null) return;

      const footerEl = footerRef.current;
      const nextTop = footerEl.getBoundingClientRect().top;
      const deltaY = footerPreviousTopRef.current - nextTop;
      footerPreviousTopRef.current = null;

      if (Math.abs(deltaY) < 1) return;

      footerEl.style.transition = "none";
      footerEl.style.transform = `translateY(${deltaY}px)`;
      footerEl.style.willChange = "transform";
      footerEl.getBoundingClientRect();

      requestAnimationFrame(() => {
        footerEl.style.transition =
          "transform 1550ms cubic-bezier(0.16, 1, 0.3, 1)";
        footerEl.style.transform = "translateY(0)";
      });

      const cleanup = (event) => {
        if (event.target !== footerEl || event.propertyName !== "transform") {
          return;
        }
        footerEl.style.transition = "";
        footerEl.style.transform = "";
        footerEl.style.willChange = "";
        footerEl.removeEventListener("transitionend", cleanup);
      };

      footerEl.addEventListener("transitionend", cleanup);
    };

    window.addEventListener("blog:comment-will-add", handleCommentWillAdd);
    window.addEventListener("blog:comment-did-add", handleCommentDidAdd);

    return () => {
      window.removeEventListener("blog:comment-will-add", handleCommentWillAdd);
      window.removeEventListener("blog:comment-did-add", handleCommentDidAdd);
    };
  }, []);

  // Content processing moved to fetchBlog
  const [sections, setSections] = useState([]);

  // Scroll to top when blog page loads
  useEffect(() => {
    // Always scroll to top when opening a blog post
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Get ordinal suffix for day
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return {
      date: `${day} ${month}, ${year}`,
      fullDate: `${getOrdinal(parseInt(day))} ${month}`,
    };
  };

  const currentUrl =
    typeof window !== "undefined"
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
          <Link
            href="/view-site"
            className="text-purple-600 hover:text-purple-700"
          >
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
      {/* Header Section */}
      <ViewSiteHeader
        userName={
          blog.publication?.name ||
          (blog.author?.name ? `${blog.author.name}'s Blog` : "InkSigma")
        }
        userAvatar={
          blog.publication?.logoUrl
            ? `${API_URL}${blog.publication.logoUrl}`
            : blog.author?.image
              ? blog.author.image.startsWith("http")
                ? blog.author.image
                : `${API_URL}${blog.author.image}`
              : null
        }
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
          <aside className="hidden lg:block w-[240px] flex-shrink-0 pt-8">
            <div
              ref={tocStickyRef}
              className="sticky top-28 z-30 h-[calc(100vh-6rem)]"
            >
              <div className="flex flex-col gap-8 h-full min-h-0 pt-4">
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
                  Go to homepage
                </button>
                <TableOfContents sections={sections} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div
            ref={contentRef}
            className="flex-1 max-w-[800px] w-full min-w-0 mx-auto pt-12 pb-20 px-12 border-l border-[#EAEAEA] max-md:border-none max-md:px-2 max-md:pt-6"
          >
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
                  <span
                    key={index}
                    className="text-[#7C7C7C] text-sm font-normal leading-normal tracking-normal px-4 py-1.5 border border-[#EAEAEA] rounded-lg max-md:text-[10px] max-md:px-3"
                  >
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
                        blog.author.image.startsWith("http") ||
                        blog.author.image.startsWith("https")
                          ? blog.author.image
                          : blog.author.image.startsWith("/")
                            ? `${API_URL}${blog.author.image}`
                            : `${API_URL}/${blog.author.image}`
                      }
                      alt={blog.author?.name || "Author"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-purple-100 flex items-center justify-center"><span class="text-purple-600 font-semibold text-sm">${blog.author?.name?.charAt(0).toUpperCase() || "A"}</span></div>`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">
                        {blog.author?.name?.charAt(0).toUpperCase() || "A"}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[#404040] text-base font-normal italic leading-[1.88] tracking-normal max-md:text-[12px] max-md:leading-[1.5]">
                  {blog.author?.name || "Anonymous"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-[#808080] text-sm font-normal leading-normal tracking-normal max-md:text-[12px] max-md:leading-[1.5]">
                <div className="flex-shrink-0">
                  <ClockIcon className="w-3.5 h-3.5 max-md:w-2.5 max-md:h-2.5" />
                </div>
                <span>
                  Created on {dateFormatted.fullDate || dateFormatted.date}
                </span>
              </div>
            </div>

            {/* Blog Content */}
            <article
              className="prose prose-lg max-w-none prose-headings:font-bold prose-heading:text-xl prose-heading:leading-none prose-heading:tracking-normal prose-headings:text-[#000000] prose-p:text-[#404040] prose-p:text-base prose-p:font-normal prose-p:leading-7 prose-p:tracking-[0.01em] prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl max-md:[&_p]:text-[14px] max-md:[&_p]:leading-6 prose max-md:[&_h1]:text-[14px]"
              dangerouslySetInnerHTML={{
                __html: blog.content,
              }}
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

      <div ref={footerRef} className="relative z-40 bg-white">
        <div
          aria-hidden="true"
          className="footer-top-fade pointer-events-none absolute -top-14 inset-x-0 z-10 h-14"
        />
        <Footer publicationName={blog.publication?.name} />
      </div>
      <ScrollToTop />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        title={blog.title}
        slug={blog.slug}
        url={currentUrl}
        description={blog.description}
        sections={sections}
        blogId={blog.id}
        onSnapshot={handleSnapshot}
      />
    </div>
  );
}
