"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock } from "lucide-react";
import Image from "next/image";
import Verify from "@/components/features/verify/Verify";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import PublishOptionsModal from "@/components/features/review/PublishOptionsModal";
import CategoryFilter from "@/components/features/categoryFilter/CategoryFilter";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { formatTimeAgo } from "@/utils/timeFormatter";
import styles from "@/components/features/articles/Articles.module.css";

export default function ReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedArticleForPublish, setSelectedArticleForPublish] =
    useState(null);

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedArticleForAction, setSelectedArticleForAction] =
    useState(null);
  const [actionType, setActionType] = useState(null); // 'reject', 'revert', 'delete'
  const [isBulkAction, setIsBulkAction] = useState(false);

  const {
    reviewArticles,
    reviewLoading,
    reviewError,
    loadReviewArticles,
    acceptReviewArticle,
    rejectReviewArticle,
    revertReviewToDraft,
    bulkMoveToTrash,
  } = useArticles();

  const { currentPublication, getCurrentUserRole } = usePublication();

  // Get user role in this publication
  const userRole = getCurrentUserRole();
  const isEditor = userRole === "editor";
  const isAdmin = userRole === "admin" || currentPublication?.isOwner;

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

  // Load review articles when publication changes
  useEffect(() => {
    if (currentPublication?.id) {
      loadReviewArticles(currentPublication.id);
    }
  }, [currentPublication?.id, loadReviewArticles]);

  // On dashboard host, keep canonical URL shape: /{subdomain}/review
  useEffect(() => {
    if (!currentPublication?.subdomain) return;
    if (typeof window === "undefined") return;
    const isDashboardHost =
      window.location.hostname === "dashboard.localhost" ||
      window.location.hostname.startsWith("dashboard.");
    if (!isDashboardHost) return;

    const desired = withPub("/review");
    if (pathname === desired) return;

    // Preserve querystring (e.g. ?refresh=true)
    const qs = window.location.search || "";
    // Avoid infinite replace loops when already prefixed but deeper path
    if (pathname === "/review" || !pathname?.startsWith?.(pubPrefix + "/")) {
      router.replace(`${desired}${qs}`);
    }
  }, [currentPublication?.subdomain, pathname, pubPrefix, router, withPub]);

  // Filter articles by selected categories
  const filteredArticles =
    selectedCategories.length > 0
      ? reviewArticles.filter((article) =>
          article.categories?.some((cat) => selectedCategories.includes(cat)),
        )
      : reviewArticles;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPosts(filteredArticles.map((article) => article.id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleAccept = (article) => {
    setIsBulkAction(false);
    // Show publish options modal for admin
    setSelectedArticleForPublish(article);
    setShowPublishModal(true);
  };

  const handleBulkAction = () => {
    if (selectedPosts.length === 0) return;
    setIsBulkAction(true);
    // Editors and Admins reject, Authors revert to draft
    if (isEditor || isAdmin) {
      setActionType("reject");
    } else {
      setActionType("revert");
    }
    setShowConfirmModal(true);
  };

  const handlePublish = async () => {
    try {
      if (selectedArticleForPublish) {
        await acceptReviewArticle(selectedArticleForPublish.id, "published");
      }
      setShowPublishModal(false);
      setSelectedArticleForPublish(null);
      // Refresh the review articles list
      if (currentPublication?.id) {
        loadReviewArticles(currentPublication.id);
      }
    } catch (error) {
      console.error("[ReviewPage] Error publishing article:", error);
    }
  };

  const handleUnpublish = async () => {
    try {
      if (selectedArticleForPublish) {
        await acceptReviewArticle(selectedArticleForPublish.id, "unpublished");
      }
      setShowPublishModal(false);
      setSelectedArticleForPublish(null);
      // Refresh the review articles list
      if (currentPublication?.id) {
        loadReviewArticles(currentPublication.id);
      }
    } catch (error) {
      console.error("[ReviewPage] Error storing to unpublished:", error);
    }
  };

  const handleReject = (articleId) => {
    setIsBulkAction(false);
    setSelectedArticleForAction(articleId);
    setActionType("reject");
    setShowConfirmModal(true);
  };

  const handleRevertToDraft = (articleId) => {
    setIsBulkAction(false);
    setSelectedArticleForAction(articleId);
    setActionType("revert");
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (isBulkAction) {
        if (actionType === "reject") {
          for (const articleId of selectedPosts) {
            await rejectReviewArticle(articleId);
          }
        } else if (actionType === "revert") {
          for (const articleId of selectedPosts) {
            await revertReviewToDraft(articleId);
          }
        }
        setSelectedPosts([]);
      } else if (selectedArticleForAction) {
        if (actionType === "reject") {
          await rejectReviewArticle(selectedArticleForAction);
        } else if (actionType === "revert") {
          await revertReviewToDraft(selectedArticleForAction);
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
    }
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

  // Calculate select all state
  const isAllSelected =
    filteredArticles.length > 0 &&
    selectedPosts.length === filteredArticles.length;

  return (
    <>
                  <Verify />

      <div
        className={`absolute left-1/2 -translate-x-1/2 top-[160px] w-full max-w-[1034px] z-20 px-5 max-md:top-[120px]`}
      >
        <div className="ml-0 md:ml-[195px]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between gap-4">
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
                    className="flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50"
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "1px solid #EDEDED",
                      borderRadius: "4px",
                      background: "#FFFFFF",
                    }}
                    onClick={handleBulkAction}
                    title={isEditor || isAdmin ? "Reject" : "Revert to Draft"}
                  >
                    <img
                      src="/images/icons/trash2.svg"
                      alt={isEditor || isAdmin ? "Reject" : "Revert"}
                      className="w-4 h-4"
                    />
                  </button>
                )}
              </div>

              {/* Category Select */}
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                buttonText="Choose Category"
                disabled={reviewArticles.length === 0}
              />
            </div>

            {/* Posts List */}
            <div className="space-y-4 mt-6">
              {filteredArticles.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)] animate-fadeIn">
                  <p className="font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">
                    No articles pending review
                  </p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white border border-[#EDEDED] cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    onClick={(e) => handleCardClick(e, article.id)}
                    style={{
                      width: "786px",
                      maxWidth: "100%",
                      minHeight: "151px",
                      borderRadius: "8px",
                      padding: "24px",
                    }}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-start h-full gap-4 min-h-[103px]">
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

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-h-[103px]">
                        {/* Top row: Title, Author, and Buttons */}
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1 flex-1 pr-4">
                            <h3
                              className="font-semibold"
                              style={{
                                fontFamily: "Public Sans, sans-serif",
                                fontWeight: 600,
                                fontSize: "14px",
                                lineHeight: "100%",
                                color: "#000000",
                              }}
                            >
                              {article.title}
                            </h3>
                            <p
                              className="underline"
                              style={{
                                fontFamily: "Public Sans, sans-serif",
                                fontWeight: 400,
                                fontSize: "14px",
                                lineHeight: "150%",
                                color: "#A4A4A4",
                                textDecorationLine: "underline",
                              }}
                            >
                              {article.author?.name || "Unknown Author"}
                            </p>
                          </div>

                          {/* Buttons */}
                          <div className="flex gap-2 flex-shrink-0">
                            {/* Show different actions based on user role and article ownership */}
                            {article.author?.id === session?.user?.id ? (
                              /* If it's user's own article, only show Revert to Draft */
                              <Button
                                variant="outline"
                                className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevertToDraft(article.id);
                                }}
                              >
                                Revert to Draft
                              </Button>
                            ) : (
                              /* If it's another author's article, show Accept and Reject */
                              <>
                                <button
                                  className="hover:opacity-80 transition-opacity flex items-center justify-center"
                                  style={{
                                    width: "66px",
                                    height: "32px",
                                    borderRadius: "4px",
                                    padding: "8px",
                                    backgroundColor: "#FEECEC",
                                    fontFamily: "Public Sans, sans-serif",
                                    fontWeight: 400,
                                    fontSize: "14px",
                                    lineHeight: "20px",
                                    color: "#F53D3D",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "center",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(article.id);
                                  }}
                                >
                                  Reject
                                </button>
                                <button
                                  className="hover:opacity-80 transition-opacity flex items-center justify-center"
                                  style={{
                                    width: "71px",
                                    height: "32px",
                                    borderRadius: "4px",
                                    padding: "8px",
                                    backgroundColor: "#E6F7EA",
                                    fontFamily: "Public Sans, sans-serif",
                                    fontWeight: 400,
                                    fontSize: "14px",
                                    lineHeight: "20px",
                                    color: "#06AD2B",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "center",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAccept(article);
                                  }}
                                >
                                  Accept
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Bottom row: Categories and Date */}
                        <div className="flex items-center justify-between gap-4 mt-auto">
                          {/* Categories - Scrollable */}
                          <div
                            className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                            style={{
                              overflowY: "hidden",
                              maxWidth: "calc(100% - 200px)",
                            }}
                          >
                            <style jsx>{`
                              .scrollbar-hide::-webkit-scrollbar {
                                display: none;
                              }
                              .scrollbar-hide {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                              }
                            `}</style>
                            {(article.categories || []).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded whitespace-nowrap flex-shrink-0"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Date - aligned to right edge */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Clock
                              className="h-4 w-4"
                              style={{ color: "#A4A4A4" }}
                            />
                            <span
                              style={{
                                fontFamily: "Public Sans, sans-serif",
                                fontWeight: 400,
                                fontSize: "14px",
                                color: "#A4A4A4",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Sent {formatTimeAgo(article.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden overflow-hidden">
                      <div className="flex gap-3">
                        {/* Mobile Checkbox */}
                        <div className="pt-1">
                          <Checkbox
                            checked={selectedPosts.includes(article.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPosts([
                                  ...selectedPosts,
                                  article.id,
                                ]);
                              } else {
                                setSelectedPosts(
                                  selectedPosts.filter(
                                    (id) => id !== article.id,
                                  ),
                                );
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                          {/* Title, Author, and Buttons */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3
                                className="font-semibold mb-1"
                                style={{
                                  fontFamily: "Public Sans, sans-serif",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  lineHeight: "100%",
                                  color: "#000000",
                                }}
                              >
                                {article.title}
                              </h3>
                              <p
                                className="underline"
                                style={{
                                  fontFamily: "Public Sans, sans-serif",
                                  fontWeight: 400,
                                  fontSize: "14px",
                                  lineHeight: "150%",
                                  color: "#A4A4A4",
                                  textDecorationLine: "underline",
                                }}
                              >
                                {article.author?.name || "Unknown Author"}
                              </p>
                            </div>

                            <div className="flex gap-2 ml-4 flex-shrink-0">
                              {/* Show different actions based on user role and article ownership */}
                              {article.author?.id === session?.user?.id ? (
                                /* If it's user's own article, only show Revert to Draft */
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevertToDraft(article.id);
                                  }}
                                >
                                  Revert
                                </Button>
                              ) : (
                                /* If it's another author's article, show icon buttons for screens < 540px, text buttons for larger */
                                <>
                                  {/* Icon buttons for mobile (< 540px) */}
                                  <div className="flex gap-2 max-[540px]:flex min-[540px]:hidden">
                                    <button
                                      className="hover:opacity-80 transition-opacity flex items-center justify-center"
                                      style={{
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "4px",
                                        border: "1px solid #FFD6D6",
                                        backgroundColor: "transparent",
                                        cursor: "pointer",
                                        padding: "0",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReject(article.id);
                                      }}
                                    >
                                      <Image
                                        src="/images/icons/cross.svg"
                                        alt="Reject"
                                        width={14}
                                        height={14}
                                      />
                                    </button>
                                    <button
                                      className="hover:opacity-80 transition-opacity flex items-center justify-center"
                                      style={{
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "4px",
                                        border: "1px solid #D5F2D4",
                                        backgroundColor: "transparent",
                                        cursor: "pointer",
                                        padding: "0",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAccept(article);
                                      }}
                                    >
                                      <Image
                                        src="/images/icons/tick3.svg"
                                        alt="Accept"
                                        width={14}
                                        height={14}
                                      />
                                    </button>
                                  </div>

                                  {/* Text buttons for tablet/desktop (>= 540px) */}
                                  <div className="hidden min-[540px]:flex gap-2">
                                    <button
                                      className="hover:opacity-80 transition-opacity flex items-center justify-center"
                                      style={{
                                        width: "66px",
                                        height: "32px",
                                        borderRadius: "4px",
                                        padding: "8px",
                                        backgroundColor: "#FEECEC",
                                        fontFamily: "Public Sans, sans-serif",
                                        fontWeight: 400,
                                        fontSize: "14px",
                                        lineHeight: "20px",
                                        color: "#F53D3D",
                                        border: "none",
                                        cursor: "pointer",
                                        textAlign: "center",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReject(article.id);
                                      }}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      className="hover:opacity-80 transition-opacity flex items-center justify-center"
                                      style={{
                                        width: "71px",
                                        height: "32px",
                                        borderRadius: "4px",
                                        padding: "8px",
                                        backgroundColor: "#E6F7EA",
                                        fontFamily: "Public Sans, sans-serif",
                                        fontWeight: 400,
                                        fontSize: "14px",
                                        lineHeight: "20px",
                                        color: "#06AD2B",
                                        border: "none",
                                        cursor: "pointer",
                                        textAlign: "center",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAccept(article);
                                      }}
                                    >
                                      Accept
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Categories - scrollable */}
                          <div
                            className="flex gap-2 overflow-x-auto scrollbar-hide"
                            style={{
                              overflowY: "hidden",
                            }}
                          >
                            <style jsx>{`
                              .scrollbar-hide::-webkit-scrollbar {
                                display: none;
                              }
                              .scrollbar-hide {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                              }
                            `}</style>
                            {(article.categories || []).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded whitespace-nowrap flex-shrink-0"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-2">
                            <Clock
                              className="h-4 w-4"
                              style={{ color: "#A4A4A4" }}
                            />
                            <span
                              style={{
                                fontFamily: "Public Sans, sans-serif",
                                fontWeight: 400,
                                fontSize: "14px",
                                color: "#A4A4A4",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Sent {formatTimeAgo(article.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Options Modal */}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedArticleForAction(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
        title={
          actionType === "delete"
            ? "Delete Articles?"
            : actionType === "reject"
              ? "Reject Article?"
              : "Revert to Draft?"
        }
        description={
          actionType === "delete"
            ? "These articles will be moved to trash. You can restore them later."
            : actionType === "reject"
              ? "This article will be returned to the author's drafts. They can edit and resubmit it."
              : "This action will move the article back to your drafts. You can edit and resubmit it later."
        }
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </>
  );
}
