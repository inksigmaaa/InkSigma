import { useState } from "react";

/**
 * Selection state for the article list pages (draft/trash/my-blogs/…).
 *
 * `allIds` is the id list of the currently displayed articles, used by
 * select-all. Returns the array-based selection model and the two handlers
 * PersonalArticles expects, matching the previous per-page implementation
 * exactly (no behavior change).
 *
 * @param {Array<string | number>} [allIds=[]]
 */
export function useArticleSelection(allIds = []) {
  const [selectedArticles, setSelectedArticles] = useState([]);

  const handleSelectAll = (checked) => {
    setSelectedArticles(checked ? allIds : []);
  };

  const handleArticleSelect = (id, checked) => {
    setSelectedArticles((prev) =>
      checked ? [...prev, id] : prev.filter((articleId) => articleId !== id),
    );
  };

  const clearSelection = () => setSelectedArticles([]);

  return {
    selectedArticles,
    setSelectedArticles,
    handleSelectAll,
    handleArticleSelect,
    clearSelection,
  };
}
