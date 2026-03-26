"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ViewSiteHeader from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import TableOfContents from "../../components/TableOfContents/TableOfContents";
import SocialSidebar from "../../components/SocialSidebar/SocialSidebar";
import ShareMenu from "../../components/ShareMenu/ShareMenu";
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop";
import MobileBottomNav from "../../components/MobileBottomNav/MobileBottomNav";
import CommentSection from "../../components/CommentSection/CommentSection";
import ClockIcon from "../../components/icons/ClockIcon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSnapshot } from "@/hooks/useSnapshot";
import { fetchJsonWithRetry } from "@/lib/api/client";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { getApiBase } from "@/utils/apiBase";

const API_URL = getApiBase();
const BLOG_DETAIL_CACHE_TTL_MS = 60 * 1000;

const getBlogCacheKey = (slug, tenantSubdomain, tenantCustomDomain) => {
  return `view-site:blog:${tenantCustomDomain || tenantSubdomain || "root"}:${slug}`;
};

const readCachedBlog = (slug, tenantSubdomain, tenantCustomDomain) => {
  if (typeof window === "undefined" || !slug) return null;

  try {
    const raw = sessionStorage.getItem(
      getBlogCacheKey(slug, tenantSubdomain, tenantCustomDomain),
    );
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.blog) return null;

    if (Date.now() - parsed.savedAt > BLOG_DETAIL_CACHE_TTL_MS) {
      sessionStorage.removeItem(
        getBlogCacheKey(slug, tenantSubdomain, tenantCustomDomain),
      );
      return null;
    }

    return parsed.blog;
  } catch {
    return null;
  }
};

const writeCachedBlog = (slug, tenantSubdomain, tenantCustomDomain, blog) => {
  if (typeof window === "undefined" || !slug || !blog) return;

  try {
    sessionStorage.setItem(
      getBlogCacheKey(slug, tenantSubdomain, tenantCustomDomain),
      JSON.stringify({
        savedAt: Date.now(),
        blog,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
};

export default function BlogDetailPageClient({
  slug,
  initialHostContext,
  initialPublication = null,
}) {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [retryNonce, setRetryNonce] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSubdomain = initialHostContext?.subdomain || null;
  const tenantCustomDomain = initialHostContext?.customDomain || null;
  const { captureSnapshot } = useSnapshot();
  const contentRef = useRef(null);
  const tocStickyRef = useRef(null);
  const footerRef = useRef(null);
  const footerPreviousTopRef = useRef(null);

  const handleSnapshot = () => {
    if (!contentRef.current) return;

    const rect = contentRef.current.getBoundingClientRect();
    let yOffset = 0;
    if (rect.top < 0) {
      yOffset = Math.abs(rect.top);
    }

    const headerHeight = 80;

    if (rect.top > 0) {
      yOffset = 0;
    } else {
      yOffset = Math.abs(rect.top);
    }

    const captureHeight = window.innerHeight - headerHeight;
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
  };

  const handleBack = (e) => {
    e.preventDefault();
    const fromPub = searchParams.get("from");
    const isSubdomain =
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/view-site");

    if (fromPub) {
      router.push(
        isSubdomain
          ? `/?from=${fromPub}`
          : `/view-site?publicationId=${fromPub}`,
      );
      return;
    }

    const pubId =
      blog?.publication?.id || blog?.publicationId || blog?.publication_id;

    if (isSubdomain) {
      router.push("/");
      return;
    }

    router.push(pubId ? `/view-site?publicationId=${pubId}` : "/view-site");
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError(null);
        const tenantHeaders = {};

        const cachedBlog = readCachedBlog(slug, tenantSubdomain, tenantCustomDomain);
        if (cachedBlog) {
          setBlog(cachedBlog);
          setLoading(false);
        }

        if (tenantCustomDomain) {
          tenantHeaders["X-Custom-Domain"] = tenantCustomDomain;
          delete tenantHeaders["X-Subdomain"];
        } else if (tenantSubdomain) {
          tenantHeaders["X-Subdomain"] = tenantSubdomain;
        }

        const foundBlog = await fetchJsonWithRetry(
          `${API_URL}/api/blogs/slug/${slug}`,
          {
            headers: tenantHeaders,
            signal: controller.signal,
          },
          {
            attempts: 4,
            delayMs: 350,
          },
        );

        if (!foundBlog || foundBlog.error) {
          setError("Blog not found");
          return;
        }

        if (foundBlog.content) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(foundBlog.content, "text/html");
          const images = doc.querySelectorAll("img");

          images.forEach((img, index) => {
            const src = img.getAttribute("src");
            if (src && src.startsWith("/")) {
              img.setAttribute("src", `${API_URL}${src}`);
            }

            if (index === 0) {
              img.setAttribute("loading", "eager");
              img.setAttribute("fetchpriority", "high");
            } else {
              img.setAttribute("loading", "lazy");
            }
          });

          const headings = doc.querySelectorAll("h2");
          const extractedSections = Array.from(headings).map((heading, index) => {
            const id = heading.id || `section-${index + 1}`;
            heading.id = id;
            return {
              id,
              title: heading.textContent,
            };
          });

          setSections(extractedSections);
          foundBlog.content = doc.body.innerHTML;
        }

        if (!foundBlog.publication && initialPublication) {
          foundBlog.publication = initialPublication;
        }

        if (!foundBlog.publication && foundBlog.publicationId) {
          try {
            const publicationData = await fetchJsonWithRetry(
              `${API_URL}/api/publications/${foundBlog.publicationId}`,
              {
                credentials: "include",
                headers: tenantHeaders,
                signal: controller.signal,
              },
            );
            foundBlog.publication = publicationData;
          } catch {
            foundBlog.publication = initialPublication;
          }
        }

        setBlog(foundBlog);
        writeCachedBlog(slug, tenantSubdomain, tenantCustomDomain, foundBlog);

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
                // Fall back to server-side dedupe if storage is unavailable.
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
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }

        console.error("Error fetching blog:", err);
        setError("This blog is still syncing after the domain change. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBlog();

    return () => {
      controller.abort();
    };
  }, [
    slug,
    tenantSubdomain,
    tenantCustomDomain,
    retryNonce,
    initialPublication,
  ]);

  useEffect(() => {
    if (loading) return;

    const topOffset = 96;
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

  useEffect(() => {
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

    const getOrdinal = (n) => {
      const suffixes = ["th", "st", "nd", "rd"];
      const value = n % 100;
      return n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
    };

    return {
      date: `${day} ${month}, ${year}`,
      fullDate: `${getOrdinal(parseInt(day, 10))} ${month}`,
    };
  };

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `http://localhost:3000/view-site/blog/${slug}`;
  const fallbackHomePath =
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/view-site")
      ? "/"
      : "/view-site";

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
        <div className="flex flex-grow items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <Alert variant="destructive">
              <AlertTitle>Blog unavailable right now</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>{error || "We could not load this blog."}</p>
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setRetryNonce((prev) => prev + 1)}>
                    Try again
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={fallbackHomePath}>Back to home</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const dateFormatted = formatDate(blog.createdAt);

  return (
    <div className="min-h-screen bg-white flex flex-col">
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

      <section className="flex-grow flex justify-center w-full pt-20">
        <div className="flex w-[90%] lg:w-[78%] max-w-[1600px] gap-6 relative">
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

          <div
            ref={contentRef}
            className="flex-1 max-w-[800px] w-full min-w-0 mx-auto pt-12 pb-20 px-12 border-l border-[#EAEAEA] max-md:border-none max-md:px-2 max-md:pt-6"
          >
            <h1 className="text-[#202020] text-[40px] font-extrabold leading-[1.09] mb-6 tracking-normal break-words max-md:text-[24px] max-md:leading-[1.2] max-md:mb-3">
              {blog.title}
            </h1>

            <p className="text-base font-normal leading-7 tracking-[0.01em] text-[#696969] mb-6 break-words max-md:text-sm max-md:leading-[1.5] max-md:mb-3 max-md:text-[#808080]">
              {blog.description}
            </p>

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

            <div className="flex items-center justify-between py-3 border-t border-b border-[#EAEAEA] mb-10 max-md:mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 bg-gray-200 flex-shrink-0 max-md:w-7 max-md:h-7">
                  {blog.author?.image && (
                    <AvatarImage
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
                    />
                  )}
                  <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold text-sm">
                    {blog.author?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[#404040] text-base font-normal italic leading-[1.88] tracking-normal max-md:text-[12px] max-md:leading-[1.5]">
                  {blog.author?.name || "Anonymous"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#808080] text-sm font-normal leading-normal tracking-normal max-md:text-[12px] max-md:leading-[1.5]">
                <div className="flex-shrink-0">
                  <ClockIcon className="w-3.5 h-3.5 max-md:w-2.5 max-md:h-2.5" />
                </div>
                <span>Created on {dateFormatted.fullDate || dateFormatted.date}</span>
              </div>
            </div>

            <article
              className="prose prose-lg max-w-none prose-headings:font-bold prose-heading:text-xl prose-heading:leading-none prose-heading:tracking-normal prose-headings:text-[#000000] prose-p:text-[#404040] prose-p:text-base prose-p:font-normal prose-p:leading-7 prose-p:tracking-[0.01em] prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl max-md:[&_p]:text-[14px] max-md:[&_p]:leading-6 prose max-md:[&_h1]:text-[14px] break-words overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(blog.content),
              }}
            />

            <div>
              <CommentSection blogId={blog.id} />
            </div>
          </div>

          <aside className="hidden xl:block w-16 pt-6 h-fit sticky top-28 z-30">
            <SocialSidebar
              title={blog.title}
              slug={blog.slug}
              blogId={blog.id}
              url={currentUrl}
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
