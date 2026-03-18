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
import { useEffect, useState, useRef } from "react";
import ClockIcon from "../../components/icons/ClockIcon";
import { useSnapshot } from "@/hooks/useSnapshot";
import { getApiBase } from "@/utils/apiBase";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentTenantHeaders } from "@/utils/apiHeaders";

const API_URL = getApiBase();

export default function BlogDetailPageClient({ slug }) {
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
  const [sections, setSections] = useState([]);

  const handleSnapshot = () => {
    if (contentRef.current) {
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
    }
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
    } else {
      const pubId =
        blog?.publication?.id || blog?.publicationId || blog?.publication_id;

      if (isSubdomain) {
        router.push("/");
      } else {
        router.push(pubId ? `/view-site?publicationId=${pubId}` : "/view-site");
      }
    }
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const tenantHeaders = getCurrentTenantHeaders();
        const response = await fetch(`${API_URL}/api/blogs/slug/${slug}`, {
          headers: tenantHeaders,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch blog");
        }

        const foundBlog = await response.json();

        if (!foundBlog || foundBlog.error) {
          setError("Blog not found");
        } else {
          if (foundBlog.content) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(foundBlog.content, "text/html");
            const images = doc.querySelectorAll("img");
            const backendUrl = API_URL;

            images.forEach((img, index) => {
              const src = img.getAttribute("src");
              if (src && src.startsWith("/")) {
                img.setAttribute("src", `${backendUrl}${src}`);
              }

              if (index === 0) {
                img.setAttribute("loading", "eager");
                img.setAttribute("fetchpriority", "high");
              } else {
                img.setAttribute("loading", "lazy");
              }
            });

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

          if (foundBlog.publicationId) {
            const pubResponse = await fetch(
              `${API_URL}/api/publications/${foundBlog.publicationId}`,
              {
                credentials: "include",
                headers: tenantHeaders,
              },
            );

            if (pubResponse.ok) {
              const pubData = await pubResponse.json();
              foundBlog.publication = pubData;
            }
          }

          setBlog(foundBlog);

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
                } catch {}
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
      footerPreviousTopRef.current =
        footerRef.current?.getBoundingClientRect().top ?? null;
    };

    const handleCommentDidAdd = () => {
      const previousTop = footerPreviousTopRef.current;
      const nextTop = footerRef.current?.getBoundingClientRect().top;

      if (
        previousTop !== null &&
        nextTop !== undefined &&
        nextTop < previousTop
      ) {
        window.scrollBy({
          top: nextTop - previousTop,
          behavior: "instant",
        });
      }

      footerPreviousTopRef.current = null;
    };

    window.addEventListener("blog:comment-will-add", handleCommentWillAdd);
    window.addEventListener("blog:comment-did-add", handleCommentDidAdd);

    return () => {
      window.removeEventListener("blog:comment-will-add", handleCommentWillAdd);
      window.removeEventListener("blog:comment-did-add", handleCommentDidAdd);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !blog) {
    return <div className="min-h-screen flex items-center justify-center">{error || "Blog not found"}</div>;
  }

  const publicationName = blog?.publication?.name || "Publication";
  const publicationLogo = blog?.publication?.logoUrl
    ? `${API_URL}${blog.publication.logoUrl}`
    : null;
  const authorName = blog?.author?.name || "Unknown Author";
  const authorImage = blog?.author?.image || null;
  const blogImage = blog?.image
    ? `${API_URL}${blog.image}`
    : null;

  return (
    <div className="min-h-screen bg-white">
      <ViewSiteHeader />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex gap-10">
            <aside className="hidden xl:block w-20">
              <SocialSidebar blog={blog} onSnapshot={handleSnapshot} />
            </aside>

            <article className="flex-1 max-w-3xl">
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-900 mb-6"
              >
                Back
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={publicationLogo || undefined} alt={publicationName} />
                    <AvatarFallback>{publicationName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{publicationName}</p>
                    <p className="text-sm text-gray-500">{authorName}</p>
                  </div>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
                <p className="text-lg text-gray-600 mb-6">{blog.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <ClockIcon />
                    <span>{blog.readTime || 5} min read</span>
                  </div>
                </div>
              </div>

              {blogImage ? (
                <div className="relative aspect-[16/9] mb-10 overflow-hidden rounded-2xl">
                  <Image
                    src={blogImage}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : null}

              <div
                ref={contentRef}
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content || "") }}
              />

              <div className="mt-10">
                <ShareMenu blog={blog} onSnapshot={handleSnapshot} />
              </div>

              <div className="mt-12">
                <CommentSection blogId={blog.id} />
              </div>
            </article>

            <aside className="hidden lg:block w-72">
              <div ref={tocStickyRef} className="sticky top-24 overflow-auto">
                <TableOfContents sections={sections} />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <div ref={footerRef}>
        <Footer publicationName={publicationName} />
      </div>
      <MobileBottomNav blog={blog} onSnapshot={handleSnapshot} />
      <ScrollToTop />
    </div>
  );
}
