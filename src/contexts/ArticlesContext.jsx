"use client";

/**
 * Backward-compatible wrapper around the Zustand articleStore.
 *
 * All state and logic now lives in @/stores/articleStore.
 * This file keeps the existing <ArticlesProvider> + useArticles() API
 * so consumers don't need any changes.
 *
 * The provider is intentionally a no-op pass-through. Each page owns its
 * own data fetch — having the provider also auto-fire loadUserArticles
 * caused its in-flight request to be aborted by the page-level loader
 * (different argument shape → different request key → abort path), which
 * showed up in DevTools as "first request canceled, second request succeeds".
 */

import { useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { usePublication } from "@/contexts/PublicationContext";
import { useArticleStore } from "@/stores/articleStore";

export function ArticlesProvider({ children }) {
  return children;
}

/**
 * Drop-in replacement hook — returns the same shape as the old context value.
 * Consumers that destructure specific fields (e.g. `const { articles, loading } = useArticles()`)
 * will only re-render when those specific Zustand slices change.
 */
export function useArticles() {
  const store = useArticleStore();
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id ?? null;

  let currentPublication = null;
  try {
    const pubContext = usePublication();
    currentPublication = pubContext?.currentPublication;
  } catch {
    // PublicationContext not available
  }

  // Wrap loadUserArticles to auto-inject session + publicationId (matching old API)
  const rawLoadUserArticles = store.loadUserArticles;
  const loadUserArticles = useCallback(
    (
      publicationId = null,
      includeAllPublications = false,
      status = null,
      extraFilters = {},
      options = {},
    ) => {
      if (!sessionUserId) {
        return Promise.resolve();
      }

      const effectivePubId = publicationId ?? currentPublication?.id ?? null;
      return rawLoadUserArticles(
        { user: { id: sessionUserId } },
        effectivePubId,
        includeAllPublications,
        status,
        extraFilters,
        options,
      );
    },
    [rawLoadUserArticles, sessionUserId, currentPublication?.id],
  );

  // Wrap createArticle to auto-inject currentPublicationId (matching old API)
  const rawCreateArticle = store.createArticle;
  const createArticle = useCallback(
    (articleData) => {
      return rawCreateArticle(articleData, currentPublication?.id);
    },
    [rawCreateArticle, currentPublication?.id],
  );

  return {
    // State
    articles: store.articles,
    reviewArticles: store.reviewArticles,
    publicationArticles: store.publicationArticles,
    loading: store.loading,
    refreshing: store.refreshing,
    reviewLoading: store.reviewLoading,
    reviewRefreshing: store.reviewRefreshing,
    pubArticlesLoading: store.pubArticlesLoading,
    pubArticlesRefreshing: store.pubArticlesRefreshing,
    error: store.error,
    reviewError: store.reviewError,
    areUserArticlesLoaded: store.areUserArticlesLoaded,
    arePubArticlesLoaded: store.arePubArticlesLoaded,
    areReviewArticlesLoaded: store.areReviewArticlesLoaded,

    // Wrapped actions (inject session/publication automatically)
    loadUserArticles,
    createArticle,

    // Pass-through actions (no wrapping needed)
    loadReviewArticles: store.loadReviewArticles,
    loadPublicationArticles: store.loadPublicationArticles,
    getArticleById: store.getArticleById,
    getArticleByIdUncached: store.getArticleByIdUncached,
    getCachedArticleById: store.getCachedArticleById,
    prefetchArticle: store.prefetchArticle,
    primeEditorArticle: store.primeEditorArticle,
    refreshArticle: store.refreshArticle,
    updateArticle: store.updateArticle,
    moveToTrash: store.moveToTrash,
    moveToDraft: store.moveToDraft,
    moveToTrashStatus: store.moveToTrashStatus,
    restoreFromTrash: store.restoreFromTrash,
    deleteArticle: store.deleteArticle,
    publishArticle: store.publishArticle,
    unpublishArticle: store.unpublishArticle,
    acceptReviewArticle: store.acceptReviewArticle,
    rejectReviewArticle: store.rejectReviewArticle,
    revertReviewToDraft: store.revertReviewToDraft,
    bulkMoveToTrash: store.bulkMoveToTrash,
    bulkMoveToTrashStatus: store.bulkMoveToTrashStatus,
    bulkMoveToDraft: store.bulkMoveToDraft,
    bulkRestore: store.bulkRestore,
    bulkDelete: store.bulkDelete,
    bulkPublish: store.bulkPublish,
    uploadArticleImage: store.uploadArticleImage,
    createDraftFromPublished: store.createDraftFromPublished,
    addComment: store.addComment,
  };
}
