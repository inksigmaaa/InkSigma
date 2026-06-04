"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import PersonalArticleContainer from "../personalArticleContainer/PersonalArticleContainer";
import CategoryFilter from "../categoryFilter";
import { Button } from "@/components/ui/button";
import { NightTooltip } from "@/components/ui/tooltip";
import styles from "../articles/Articles.module.css";

// Ensure CategoryFilter is imported

export default function PersonalArticles({
  title = "All Articles",
  titleColor,
  articles = [],
  emptyMessage = "No Articles yet",
  showSelectAll = false,
  showActions = false,
  showCategoryInTitle = false,
  actionButtons = [],
  selectedArticles = [],
  selectedCategories = [],
  onCategoriesChange,
  onSelectAll,
  onArticleSelect,
  onArticleAction,
}) {
  // Use selectedCategories from props if provided, otherwise use local state
  const [localCategories, setLocalCategories] = useState([]);
  const canRenderPortal = typeof window !== "undefined";
  const categories =
    selectedCategories && selectedCategories.length > 0
      ? selectedCategories
      : localCategories;
  const handleCategoryChange = onCategoriesChange || setLocalCategories;

  // Add titleColor to articles so the container can use it for the dot
  const articlesWithTitleColor = articles.map((article) => ({
    ...article,
    titleColor: titleColor,
  }));

  // Filter articles based on selected categories
  const filteredArticles = articlesWithTitleColor.filter((article) => {
    if (categories.length === 0) return true;
    return article.categories?.some((cat) => categories.includes(cat));
  });

  const selectAll =
    showSelectAll &&
    selectedArticles.length === filteredArticles.length &&
    filteredArticles.length > 0;

  // Fixed top position (no verify banner)
  const topPosition = "top-[160px]";
  const mobileTopPosition =
    selectedArticles.length > 0 ? "max-md:top-[160px]" : "max-md:top-[120px]";

  return (
    <>
      {/* Mobile Action Bar - Fixed stripe below navbar using Portal */}
      {canRenderPortal &&
        showActions &&
        selectedArticles.length > 0 &&
        createPortal(
          <div
            className="md:hidden fixed left-0 right-0 z-[9999]"
            style={{
              top: "110px",
              width: "390px",
              height: "42px",
              paddingTop: "8px",
              paddingRight: "16px",
              paddingBottom: "8px",
              paddingLeft: "30px",
              background: "#FEFEFE",
              borderTop: "1px solid #EDEDED",
              borderBottom: "1px solid #EDEDED",
            }}
          >
            <div className="flex items-center gap-1">
              <div
                className="flex items-center cursor-pointer"
                style={{
                  width: "69px",
                  height: "26px",
                  borderRadius: "4px",
                  padding: "8px",
                  background: "#F8F8F8",
                  gap: "8px",
                }}
                onClick={() => onSelectAll?.(false)}
              >
                <span
                  style={{
                    fontFamily: "Public Sans",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#000000",
                  }}
                >
                  Select all
                </span>
              </div>
              {actionButtons
                .filter((button) => !button.hidden)
                .map((button, index) => {
                  const isDisabled =
                    selectedArticles.length === 0 || button.disabled;
                  return (
                    <NightTooltip key={index} content={button.title}>
                      <button
                        onClick={button.onClick}
                        className={`flex items-center justify-center transition-all bg-white active:bg-gray-50 ${isDisabled ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
                        style={{
                          width: "26px",
                          height: "26px",
                          border: "1px solid #EDEDED",
                          borderRadius: "4px",
                          marginLeft: index === 0 ? "4px" : "0",
                        }}
                        disabled={isDisabled}
                        aria-label={button.title}
                      >
                        <img
                          src={button.icon}
                          alt={button.title}
                          className="w-4 h-4"
                        />
                      </button>
                    </NightTooltip>
                  );
                })}
            </div>
          </div>,
          document.body,
        )}

      <div
        className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}
      >
        <div className="ml-[195px] max-md:ml-0">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-800 m-0 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: titleColor || "#8B5CF6" }}
              ></span>
              {title}
            </h1>
          </div>

          {/* Desktop Bulk Action Bar - Select All + Action Buttons + Category Filter */}
          {showSelectAll && showActions && (
            <div className="hidden md:flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label
                  className={`${styles.selectAllContainer} ${filteredArticles.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={() => onSelectAll?.(!selectAll)}
                    className={styles.selectAllCheckbox}
                    disabled={filteredArticles.length === 0}
                  />
                  <span className={styles.selectAllCheckboxBox}>
                    {selectAll && (
                      <img
                        src="/images/icons/tick2.svg"
                        alt="checked"
                        className={styles.selectAllCheckboxIcon}
                      />
                    )}
                  </span>
                  <span className={styles.selectAllText}>Select all</span>
                </label>
                {actionButtons
                  .filter((button) => !button.hidden)
                  .map((button, index) => {
                    const isDisabled =
                      selectedArticles.length === 0 || button.disabled;
                    return (
                      <NightTooltip key={index} content={button.title}>
                        <button
                          onClick={button.onClick}
                          className={`flex items-center justify-center transition-all hover:bg-gray-50 ${isDisabled ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
                          style={{
                            width: "32px",
                            height: "32px",
                            border: "1px solid #EDEDED",
                            borderRadius: "4px",
                            background: "#FFFFFF",
                          }}
                          disabled={isDisabled}
                          aria-label={button.title}
                        >
                          <img
                            src={button.icon}
                            alt={button.title}
                            className="w-4 h-4"
                          />
                        </button>
                      </NightTooltip>
                    );
                  })}
              </div>
              <CategoryFilter
                selectedCategories={categories}
                onCategoriesChange={handleCategoryChange}
                buttonText="Choose Category"
                disabled={articles.length === 0}
              />
            </div>
          )}

          {/* Mobile-only Category Filter (when showCategoryInTitle) */}
          {showCategoryInTitle && (
            <div className="md:hidden flex justify-end mb-4">
              <CategoryFilter
                selectedCategories={categories}
                onCategoriesChange={handleCategoryChange}
                buttonText="Choose Category"
                disabled={articles.length === 0}
              />
            </div>
          )}

          <div className="mt-6 space-y-4 pb-[85px] animate-fadeIn">
            {filteredArticles.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)] animate-fadeIn">
                <p className=" font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              filteredArticles.map((article, index) => (
                <div key={article.id}>
                  <PersonalArticleContainer
                    index={index}
                    id={article.id}
                    status={article.status}
                    title={article.title}
                    description={article.description}
                    categories={article.categories}
                    postedTime={article.postedTime}
                    createdAt={article.createdAt}
                    onDelete={article.onDelete}
                    onRestore={article.onRestore}
                    onDraft={article.onDraft}
                    onUnpublish={article.onUnpublish}
                    onRepublish={article.onRepublish}
                    onPublish={article.onPublish}
                    canPublishAction={article.canPublishArticle}
                    isSelected={selectedArticles.includes(article.id)}
                    onSelect={onArticleSelect}
                    canEdit={article.canEdit}
                    canDelete={article.canDelete}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
