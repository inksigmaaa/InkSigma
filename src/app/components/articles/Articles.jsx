"use client";

import { useState } from "react";
import ArticleContainer from "../articleContainer/ArticleContainer";
import ConfirmModal from "../confirmModal/ConfirmModal";
import CategoryFilter from "../categoryFilter/CategoryFilter";
import { useArticles } from "@/contexts/ArticlesContext";
import styles from "./Articles.module.css";

export default function Articles(props) {
  const {
    articles: contextArticles,
    loading,
    error,
    moveToTrashStatus,
    bulkMoveToTrashStatus,
    moveToDraft,
    publishArticle,
    unpublishArticle,
    createDraftFromPublished,
  } = useArticles();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);

  const filterStatus = props.filterStatus || null;
  const showCreateButton = props.showCreateButton !== false;

  // Use passed articles or context articles
  const sourceArticles = props.articles || contextArticles || [];

  // Get real articles, excluding trash
  const allArticles = sourceArticles.filter(
    (article) => article.status !== "trash",
  );

  // Filter by status if specified
  const filteredArticles = filterStatus
    ? allArticles.filter((article) => article.status === filterStatus)
    : allArticles;

  const articleIds = filteredArticles.map((article) => article.id);
  const isAllSelected =
    articleIds.length > 0 &&
    articleIds.every((id) => selectedArticles.has(id));

  const handleDeleteArticle = (articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowDeleteModal(true);
  };

  const handlePublishArticle = (articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowPublishModal(true);
  };

  const handleDraftArticle = (articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowDraftModal(true);
  };

  const handleUnpublishArticle = (articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowUnpublishModal(true);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articleIds));
    }
  };

  const handleArticleSelect = (articleId, isSelected) => {
    const newSelected = new Set(selectedArticles);
    if (isSelected) {
      newSelected.add(articleId);
    } else {
      newSelected.delete(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedArticles.size > 0) {
      setIsBulkAction(true);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      if (isBulkAction) {
        // Filter out articles that the user cannot delete
        // We need to look up the full article objects to check permissions
        const articlesToDelete = Array.from(selectedArticles).filter((id) => {
          const article = allArticles.find((a) => a.id === id);
          return (
            article &&
            (article.canDelete !== undefined ? article.canDelete : true)
          );
        });

        if (articlesToDelete.length !== selectedArticles.size) {
          console.warn(
            "Some selected articles could not be deleted due to permissions.",
          );
        }

        if (articlesToDelete.length > 0) {
          await bulkMoveToTrashStatus(articlesToDelete);
        }
        setSelectedArticles(new Set());
      } else {
        await moveToTrashStatus(actionArticleId);
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving articles to trash:", error);
    }
  };

  const confirmPublish = async () => {
    try {
      await publishArticle(actionArticleId);
      setShowPublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error publishing article:", error);
    }
  };

  const confirmDraft = async () => {
    try {
      const article = allArticles.find((a) => a.id === actionArticleId);
      if (article && article.status === "published") {
        await createDraftFromPublished(actionArticleId);
      } else {
        await moveToDraft(actionArticleId);
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to draft:", error);
    }
  };

  const confirmUnpublish = async () => {
    try {
      await unpublishArticle(actionArticleId);
      setShowUnpublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error unpublishing article:", error);
    }
  };

  const topPosition = "top-[160px]";
  const mobileTopPosition = "max-md:top-[120px]";
  const isLoading = props.loading !== undefined ? props.loading : loading;

  if (isLoading) {
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}
      >
        <div className="ml-0 md:ml-[195px]">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-gray-500">Loading articles...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}
      >
        <div className="ml-0 md:ml-[195px]">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-red-500">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}
      >
        <div className="ml-0 md:ml-[195px]">
          <div className="flex flex-col justify-between gap-4 mb-6 px-2 md:hidden max-md:mt-3">
            <h1 className="font-bold text-lg leading-8 text-gray-800 m-0 flex items-center gap-3">
              <span className="w-3 h-3 bg-violet-500 rounded-full shrink-0"></span>
              {props.title || "All Articles"}
            </h1>
            <div className="flex items-center justify-between gap-4 max-[410px]:gap-2">
              <div className="flex items-center gap-3">
                {filteredArticles.length > 0 && (
                  <label className={styles.selectAllContainer}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className={styles.selectAllCheckbox}
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
                )}
              </div>
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                buttonText="Category"
                disabled={filteredArticles.length === 0}
              />
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="m-0 font-bold text-base leading-6 text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                {props.title || "All Articles"}
              </h1>
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                buttonText="Choose Category"
                disabled={filteredArticles.length === 0}
              />
            </div>
            <div className="flex items-center gap-5">
              {filteredArticles.length > 0 && (
                <label className={styles.selectAllContainer}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className={styles.selectAllCheckbox}
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
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4 pb-[85px]">
            {filteredArticles.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">
                  No articles found
                </p>
              </div>
            ) : (
              filteredArticles.map((article) => {
                // Create stats array with mock data for now

                return (
                  <ArticleContainer
                    key={article.id}
                    id={article.id}
                    status={article.status}
                    title={article.title}
                    description={article.description}
                    categories={article.categories || []}
                    postedTime={article.postedTime}
                    image={article.image}
                    isSelected={selectedArticles.has(article.id)}
                    onSelect={handleArticleSelect}
                    onDelete={() => handleDeleteArticle(article.id)}
                    onDraft={() => handleDraftArticle(article.id)}
                    onPublish={() => handlePublishArticle(article.id)}
                    onRepublish={() => handlePublishArticle(article.id)}
                    onUnpublish={() => handleUnpublishArticle(article.id)}
                    onRestore={() => handleDraftArticle(article.id)}
                    canDelete={
                      article.canDelete !== undefined ? article.canDelete : true
                    }
                    // stats prop removed to hide stats button as requested
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message={
          isBulkAction
            ? `${selectedArticles.size} article(s) will be put into trash and can be restored later`
            : "This will be put into trash and can be restored later"
        }
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmPublish}
        title="Publish article?"
        message="This article will be published"
        confirmText="Publish"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDraft}
        title={
          actionArticleId &&
          allArticles.find((a) => a.id === actionArticleId)?.status ===
            "published"
            ? "Create a Draft?"
            : "Move to Draft?"
        }
        message={
          actionArticleId &&
          allArticles.find((a) => a.id === actionArticleId)?.status ===
            "published"
            ? "A draft copy will be created. The original article will remain published."
            : "This article will be moved to drafts"
        }
        confirmText={
          actionArticleId &&
          allArticles.find((a) => a.id === actionArticleId)?.status ===
            "published"
            ? "Create Draft"
            : "Move to Draft"
        }
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showUnpublishModal}
        onClose={() => {
          setShowUnpublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmUnpublish}
        title="Unpublish this article?"
        message="This article will be unpublished and moved to unpublished section"
        confirmText="Unpublish"
        confirmStyle="normal"
      />
    </>
  );
}
