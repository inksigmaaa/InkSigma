"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Verify from "@/components/features/verify/Verify";
import BlogStatsComponent from "@/components/features/BlogStatsComponent/BlogStatsComponent";
import { Pencil } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { useSession } from "@/lib/auth-client";
import CategoryBadgeList from "@/components/CategoryBadgeList";
import { getPublicationLogoUrl } from "@/utils/imageUrl";
import { getThumbnailWithFallback } from "@/utils/fallbackThumbnail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublicationUrl } from "@/utils/publicationDomain";
import { withPublicationPath } from "@/utils/dashboardUrl";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function HomePage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { currentPublication } = usePublication();
  const {
    publicationArticles,
    loadPublicationArticles,
    prefetchArticle,
  } = useArticles();
  const [commentCounts, setCommentCounts] = useState({});
  const [viewStats, setViewStats] = useState({});
  const publicationLogoSrc = getPublicationLogoUrl(
    currentPublication?.logoUrl,
  );

  // Check if this is a refresh from editor
  const refreshParam = searchParams.get("refresh");
  const shouldRefresh = refreshParam === "true";

  // Refresh articles when home page loads (especially after exiting editor)
  useEffect(() => {
    if (currentPublication?.id) {
      loadPublicationArticles(
        currentPublication.id,
        "published",
        {},
        {
          force: shouldRefresh,
        },
      );
    }

    // Remove refresh param from URL after handling
    if (shouldRefresh) {
      const url = window.location.pathname;
      window.history.replaceState({}, document.title, url);
    }
  }, [currentPublication?.id, shouldRefresh, loadPublicationArticles]);

  // Get recent published articles (limit to 4)
  const recentArticles = publicationArticles
    .filter(
      (article) =>
        currentPublication?.id &&
        String(article.publicationId) === String(currentPublication.id) &&
        article.status === "published",
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)
    .map((article) => {
      // Check if article has an image - use fallback if not
      const thumbnailUrl = getThumbnailWithFallback(
        article.image,
        article.id,
      );

      // Check if current user is the author of this article
      const isOwnArticle = article.authorId === session?.user?.id;

      return {
        id: article.id,
        title: article.title,
        description: article.description,
        categories:
          article.categories?.length > 0
            ? article.categories
            : ["Uncategorized"],
        thumbnail: thumbnailUrl,
        views: viewStats[article.id]?.views || article.views || 0,
        isOwnArticle, // Add this flag
      };
    });

  // Stable key of published blog ids — changes only when the SET of published
  // posts changes, not on every unrelated store mutation (each of which yields
  // a fresh `publicationArticles` array reference).
  const publishedBlogIdsKey = useMemo(
    () =>
      publicationArticles
        .filter((article) => article.status === "published")
        .map((article) => article.id)
        .sort()
        .join(","),
    [publicationArticles],
  );

  // Read live articles inside the stats effect without widening its deps, so
  // blog ids keep their original type (the key above is only for change
  // detection). The ref is synced in its own effect (declared first) so it is
  // current before the stats effect below reads it.
  const publicationArticlesRef = useRef(publicationArticles);
  useEffect(() => {
    publicationArticlesRef.current = publicationArticles;
  });

  // Fetch publication stats and share them with child analytics widgets.
  useEffect(() => {
    const fetchStats = async () => {
      const blogIds = publicationArticlesRef.current
        .filter((article) => article.status === "published")
        .map((article) => article.id);

      if (blogIds.length === 0) {
        return;
      }

      try {
        const [commentResponse, viewResponse] = await Promise.all([
          fetch(`${API_URL}/api/comments/counts`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blogIds }),
          }),
          fetch(`${API_URL}/api/views/stats`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blogIds }),
          }),
        ]);

        if (commentResponse.ok) {
          const counts = await commentResponse.json();
          setCommentCounts(counts || {});
        } else {
          console.error(
            "[Home] Failed to fetch comment counts:",
            commentResponse.status,
          );
        }

        if (viewResponse.ok) {
          const stats = await viewResponse.json();
          setViewStats(stats || {});
        } else {
          console.error(
            "[Home] Failed to fetch view stats:",
            viewResponse.status,
          );
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, [publishedBlogIdsKey]);

  const handleStartWriting = () => {
    // Pass current publication ID to editor - navigate using router
    if (currentPublication?.id) {
      router.push(
        withPublicationPath(
          `/editor?publicationId=${currentPublication.id}`,
          currentPublication,
        ),
      );
    } else {
      router.push("/editor");
    }
  };

  const handleVisitSite = () => {
    const publicationUrl = getPublicationUrl(currentPublication);

    if (publicationUrl) {
      window.open(publicationUrl, "_blank");
    } else if (currentPublication?.id) {
      window.open(
        `/view-site?publicationId=${currentPublication.id}`,
        "_blank",
      );
    } else {
      window.open("/view-site", "_blank");
    }
  };

  const handleEditPublication = () => {
    const sub = currentPublication?.subdomain;
    router.push(sub ? `/${sub}/settings` : "/dashboard/settings");
  };

  return (
    <AuthGuard>
      <Verify />

      {/* Main Content */}
      <div className="pt-[90px] min-h-screen max-md:pt-[80px]">
        <div className="max-w-[1034px] mx-auto px-5 max-md:p-0">
          <div className={`ml-[165px] bg-white  pl-8  max-md:ml-0 max-md:p-0`}>
            {/* Publication Header */}
            <div className=" px-6 py-12 flex items-center justify-between max-md:border-b max-md:border-[#EDEDED] max-md:mx-4 max-md:py-4 max-md:pb-3 max-md:mt-4">
              <div className="flex items-center gap-6 max-md:gap-3">
                <Avatar className="w-[66px] h-[68px] bg-gray-100 flex-shrink-0 max-md:w-14 max-md:h-14">
                  <AvatarImage
                    src={publicationLogoSrc}
                    alt={currentPublication?.name || "Publication"}
                    className="w-full h-full object-cover"
                  />
                  <AvatarFallback className="w-full h-full bg-violet-100 text-violet-600 font-bold text-xl">
                    {currentPublication?.name?.charAt(0).toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-xl leading-normal tracking-normal text-[#2E2E2E] max-md:text-lg">
                    {currentPublication?.name || "My Publication"}
                  </h2>
                  {currentPublication?.description && (
                    <p className="font-normal text-sm leading-normal tracking-normal text-[#A4A4A4] max-w-md max-md:text-xs max-md:line-clamp-2">
                      {currentPublication.description}
                    </p>
                  )}
                </div>
              </div>
              {currentPublication?.isOwner && (
                <button
                  onClick={handleEditPublication}
                  className="text-sm text-gray-600 bg-[#F8F8F8] hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-sm transition-colors max-md:px-3 max-md:py-1.5 max-md:text-xs flex-shrink-0 max-md:rounded-lg"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Statistics Section */}
            <div className="relative py-6 border-y border-gray-200 max-md:px-4 max-md:py-0 max-md:pb-4 max-md:border-0">
              <BlogStatsComponent
                commentCounts={commentCounts}
                viewStats={viewStats}
              />
            </div>

            {/* What's on your mind Section */}
            <div className="px-20 py-10 border border-gray-200 text-center mt-10 max-md:p-0 max-md:border-0">
              <div className="max-md:bg-gray-50 flex flex-col items-center max-md:border max-md:border-gray-200 max-md:rounded-sm max-md:p-6 max-md:mx-4 max-md:mb-4 gap-2">
                <h2 className="font-bold text-[16px] leading-[28px] tracking-normal text-[#2E2E2E] max-md:text-lg max-md:mb-3">
                  What&apos;s on your mind?
                </h2>
                <p className="text-sm text-[#A4A4A4] max-w-[425px] leading-normal max-md:text-xs max-md:mb-5 max-md:text-gray-600">
                  Craft persuasive articles showcasing your novel ideas by
                  publishing them on your very own website
                </p>

                <button
                  onClick={handleStartWriting}
                  className="inline-flex items-center gap-2 bg-[#080808] text-[#EDEDED] px-6 py-2 rounded-md hover:bg-gray-800 transition-colors max-md:px-6 max-md:py-2.5 max-md:text-sm max-md:rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                  Start Writing
                </button>
              </div>
            </div>

            {/* Recent Articles Section */}
            <div className="my-10 pb-12 max-md:px-4 max-md:py-4 max-md:pb-20">
              <h3 className="text-lg font-bold text-[#000000] mb-6 max-md:text-base max-md:mb-4">
                Recent Articles
              </h3>

              {recentArticles.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                  <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">
                    No published articles yet. Start writing to see them here!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-4">
                  {recentArticles.map((article) => (
                    <div
                      key={article.id}
                      className="border border-[#EAEAEA] rounded-lg hover:shadow-lg transition-shadow bg-white p-4 cursor-pointer flex flex-col"
                      onClick={() =>
                        router.push(
                          withPublicationPath(
                            `/home/preview/${article.id}`,
                            currentPublication,
                          ),
                        )
                      }
                    >
                      <div className="aspect-video bg-gray-100 overflow-hidden rounded-sm mb-4 relative flex-shrink-0">
                        <img
                          src={article.thumbnail}
                          alt={article.title}
                          className="w-full h-full object-cover rounded-sm"
                        />
                      </div>
                      <div className="flex flex-col flex-grow">
                        <h4 className="font-semibold text-[#000000] mb-3 text-lg leading-snug">
                          {article.title}
                        </h4>
                        <p className="font-normal text-[14px] h-[42px] text-[#A4A4A4] mb-4 leading-normal line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-auto">
                          <div className="flex-1 overflow-hidden">
                            <CategoryBadgeList
                              categories={
                                article.categories &&
                                article.categories.length > 0
                                  ? article.categories
                                  : ["Uncategorized"]
                              }
                            />
                          </div>
                          {/* Show edit button only for:
                              1. Admins/Editors (not authors)
                              2. Authors but only for their own articles */}
                          {(currentPublication?.role !== "author" ||
                            article.isOwnArticle) && (
                            <button
                              className="text-[#4A4A4A] hover:text-gray-900 border border-[#EAEAEA] rounded-lg p-2 hover:bg-gray-50 transition-colors flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                prefetchArticle(article.id, article).catch(() => {});
                                router.push(
                                  withPublicationPath(
                                    `/editor?status=published&id=${article.id}&source=${pathname}`,
                                    currentPublication,
                                  ),
                                );
                              }}
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
