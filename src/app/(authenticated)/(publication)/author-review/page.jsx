"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock } from "lucide-react";
import Verify from "@/components/features/verify/Verify";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import CategoryFilter from "@/components/features/categoryFilter/CategoryFilter";
import ReviewArticles from "@/components/features/review/ReviewArticles";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import PublishOptionsModal from "@/components/features/review/PublishOptionsModal";
import styles from "@/components/features/articles/Articles.module.css";
import Image from "next/image";

export default function AuthorReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedArticleForAction, setSelectedArticleForAction] =
    useState(null);
  const [actionType, setActionType] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedArticleForPublish, setSelectedArticleForPublish] =
    useState(null);

  // Bulk Action State
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [isBulkAction, setIsBulkAction] = useState(false);

  const {
    reviewArticles,
    reviewLoading,
    reviewError,
    loadReviewArticles,
    acceptReviewArticle,
    rejectReviewArticle,
    revertReviewToDraft,
  } = useArticles();

  const { currentPublication, getCurrentUserRole } = usePublication();
  const pubPrefix = currentPublication?.subdomain
    ? `/${currentPublication.subdomain}`
    : "";
  const withPub = useCallback(
    (path) => {
      if (!path?.startsWith?.("/")) return path;
      if (!pubPrefix) return path;
      return path.startsWith(pubPrefix) ? path : `${pubPrefix}${path}`;
    },
    [pubPrefix],
  );

  // Get user role in this publication
  const userRole = getCurrentUserRole();
  const isAuthor = userRole === "author";
  const isEditor = userRole === "editor";
  const isAdmin = userRole === "admin" || currentPublication?.isOwner;

  // Load review articles when publication changes
  useEffect(() => {
    if (currentPublication?.id) {
      loadReviewArticles(currentPublication.id);
    }
  }, [currentPublication?.id, loadReviewArticles]);

  // Filter articles based on user role
  const getFilteredArticles = () => {
    let articles = reviewArticles;

    // Authors only see their own articles
    if (isAuthor) {
      articles = articles.filter((a) => a.author?.id === session?.user?.id);
    }
    // Editors see all articles (but actions differ based on ownership)
    // Admins should use /review page, but show all if they come here

    // Apply category filter
    if (selectedCategories.length > 0) {
      articles = articles.filter((article) =>
        article.categories?.some((cat) => selectedCategories.includes(cat)),
      );
    }

    return articles;
  };

  const filteredArticles = getFilteredArticles();

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPosts(filteredArticles.map((article) => article.id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleBulkAction = () => {
    if (selectedPosts.length === 0) return;
    setIsBulkAction(true);
    setActionType("revert"); // Authors/this page context primarily reverts
    setShowConfirmModal(true);
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleRevertToDraft = (article) => {
    setIsBulkAction(false);
    setSelectedArticleForAction(article);
    setActionType("revert");
    setShowConfirmModal(true);
  };

  const handlePublish = async () => {
    if (selectedArticleForPublish) {
      try {
        await acceptReviewArticle(selectedArticleForPublish.id, "published");
        setShowPublishModal(false);
        setSelectedArticleForPublish(null);
        // Refresh the review articles list
        if (currentPublication?.id) {
          loadReviewArticles(currentPublication.id);
        }
      } catch (error) {
        console.error("Error publishing article:", error);
      }
    }
  };

  const handleUnpublish = async () => {
    if (selectedArticleForPublish) {
      try {
        await acceptReviewArticle(selectedArticleForPublish.id, "unpublished");
        setShowPublishModal(false);
        setSelectedArticleForPublish(null);
        // Refresh the review articles list
        if (currentPublication?.id) {
          loadReviewArticles(currentPublication.id);
        }
      } catch (error) {
        console.error("Error storing to unpublished:", error);
      }
    }
  };

  const handleAccept = (article) => {
    setSelectedArticleForPublish(article);
    setShowPublishModal(true);
  };

  const handleReject = (article) => {
    setIsBulkAction(false);
    setSelectedArticleForAction(article);
    setActionType("reject");
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (isBulkAction) {
        if (actionType === "revert") {
          for (const articleId of selectedPosts) {
            await revertReviewToDraft(articleId);
          }
        }
        setSelectedPosts([]);
      } else if (selectedArticleForAction) {
        if (actionType === "revert") {
          await revertReviewToDraft(selectedArticleForAction.id);
        } else if (actionType === "reject") {
          await rejectReviewArticle(selectedArticleForAction.id);
        }
      }

      // Refresh the review articles list
      if (currentPublication?.id) {
        loadReviewArticles(currentPublication.id);
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setShowConfirmModal(false);
      setSelectedArticleForAction(null);
      setActionType(null);
      setIsBulkAction(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedArticleForAction(null);
    setActionType(null);
    setIsBulkAction(false);
  };

  const handleCardClick = (e, articleId) => {
    // Don't navigate if clicking on buttons or checkboxes
    if (
      e.target.closest("button") ||
      e.target.closest('input[type="checkbox"]') ||
      e.target.closest('[role="checkbox"]')
    ) {
      return;
    }
    router.push(withPub(`/home/preview/${articleId}`));
  };

  // On dashboard host, keep canonical URL shape: /{subdomain}/author-review
  useEffect(() => {
    if (!currentPublication?.subdomain) return;
    if (typeof window === "undefined") return;
    const isDashboardHost =
      window.location.hostname === "dashboard.localhost" ||
      window.location.hostname.startsWith("dashboard.");
    if (!isDashboardHost) return;

    const desired = withPub("/author-review");
    if (pathname === desired) return;
    const qs = window.location.search || "";

    if (
      pathname === "/author-review" ||
      !pathname?.startsWith?.(pubPrefix + "/")
    ) {
      router.replace(`${desired}${qs}`);
    }
  }, [currentPublication?.subdomain, pathname, pubPrefix, router, withPub]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    return `${days[date.getDay()]} | ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const getModalTitle = () => {
    if (actionType === "revert") return "Revert to Draft?";
    if (actionType === "reject") return "Reject Article?";
    return "";
  };

  const getModalDescription = () => {
    if (actionType === "revert") {
      return "This action will move the article back to your drafts. You can edit and resubmit it later.";
    }
    if (actionType === "reject") {
      return "This article will be returned to the author's drafts. They can edit and resubmit it.";
    }
    return "";
  };

  // Calculate select all state
  const isAllSelected =
    filteredArticles.length > 0 &&
    selectedPosts.length === filteredArticles.length;

  if (reviewLoading) {
    return (
      <>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-pulse">
          <div className="text-gray-500">Loading review articles...</div>
        </div>
      </>
    );
  }

  if (reviewError) {
    return (
      <>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-red-500">Error: {reviewError}</div>
        </div>
      </>
    );
  }

  return (
    <>
                  <Verify />

      <div className="absolute left-1/2 -translate-x-1/2 top-[160px] max-md:top-[120px] w-full max-w-[1034px] z-20 px-5">
        <div className="ml-0 md:ml-[195px] flex items-center justify-between mb-4 max-md:mt-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#267F24" }}
            ></div>
            <h1 className="text-base font-bold text-gray-800">Review</h1>
            <span className="text-sm text-gray-500">
              ({filteredArticles.length})
            </span>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <div className="ml-0 md:ml-[195px] flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label
              className={`${styles.selectAllContainer} ${filteredArticles.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className={styles.selectAllCheckbox}
                disabled={filteredArticles.length === 0}
              />
              <span className={styles.selectAllCheckboxBox}>
                {isAllSelected && (
                  <img
                    src="/images/icons/tick2.svg"
                    alt="checked"
                    className={styles.selectAllCheckboxIcon}
                  />
                )}
              </span>
              <span className={styles.selectAllText}>Select all</span>
            </label>

            {selectedPosts.length > 0 && (
              <button
                className="flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50 bg-white"
                style={{
                  width: "32px",
                  height: "32px",
                  border: "1px solid #EDEDED",
                  borderRadius: "4px",
                }}
                onClick={handleBulkAction}
                title="Revert to Draft"
              >
                <img
                  src="/images/icons/trash2.svg"
                  alt="Revert"
                  className="w-4 h-4"
                />
              </button>
            )}
          </div>

          <div className="relative z-40">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
              buttonText="Choose Category"
              disabled={reviewArticles.length === 0}
            />
          </div>
        </div>

        {/* Articles List */}

        <div className="ml-0 md:ml-[195px] space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)] animate-fadeIn">
              <p className="font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">
                {isAuthor
                  ? "You have no articles pending review"
                  : "No articles pending review"}
              </p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={(e) => handleCardClick(e, article.id)}
              >
                {/* Desktop Layout */}

                <div className="hidden md:flex items-start justify-between gap-6">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox
                      checked={selectedPosts.includes(article.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPosts([...selectedPosts, article.id]);
                        } else {
                          setSelectedPosts(
                            selectedPosts.filter((id) => id !== article.id),
                          );
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Left side - Article info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-sm underline mb-3">
                        {article.author?.name || "Unknown Author"}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {(article.categories || []).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions and Date */}
                  <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      {/* Author sees only Revert to Draft */}
                      {isAuthor && (
                        <Button
                          variant="outline"
                          className="text-gray-700 border-gray-300 hover:bg-gray-50 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevertToDraft(article);
                          }}
                        >
                          Revert to Draft
                        </Button>
                      )}

                      {/* Editor/Admin sees different actions based on article ownership */}
                      {(isEditor || isAdmin) && (
                        <>
                          {/* If it's editor's own article, only show Revert to Draft */}
                          {article.author?.id === session?.user?.id ? (
                            <Button
                              variant="outline"
                              className="text-gray-700 border-gray-300 hover:bg-gray-50 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevertToDraft(article);
                              }}
                            >
                              Revert to Draft
                            </Button>
                          ) : (
                            /* If it's another author's article, show Accept and Reject */
                            <>
                              <Button
                                variant="outline"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(article);
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(article);
                                }}
                              >
                                Accept
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(article.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex gap-3">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedPosts.includes(article.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPosts([...selectedPosts, article.id]);
                          } else {
                            setSelectedPosts(
                              selectedPosts.filter((id) => id !== article.id),
                            );
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {article.title}
                          </h3>
                          <p className="text-gray-400 text-sm underline">
                            {article.author?.name || "Unknown Author"}
                          </p>
                        </div>

                        <div className="flex gap-2 ml-4">
                          {isAuthor && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-700 border-gray-300 hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevertToDraft(article);
                              }}
                            >
                              Revert
                            </Button>
                          )}
                          {(isEditor || isAdmin) && (
                            <>
                              {/* If it's editor's own article, only show Revert to Draft */}
                              {article.author?.id === session?.user?.id ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevertToDraft(article);
                                  }}
                                >
                                  Revert
                                </Button>
                              ) : (
                                /* If it's another author's article, show Accept and Reject */
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 h-10 w-10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(article);
                                    }}
                                  >
                                    ✕
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 h-10 w-10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAccept(article);
                                    }}
                                  >
                                    ✓
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap mb-4">
                        {(article.categories || []).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmAction}
        title={getModalTitle()}
        description={getModalDescription()}
        confirmText="Confirm"
        cancelText="Cancel"
      />

      <PublishOptionsModal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false);
          setSelectedArticleForPublish(null);
        }}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        articleTitle={selectedArticleForPublish?.title}
        userRole={currentPublication?.role}
      />
    </>
  );
}
