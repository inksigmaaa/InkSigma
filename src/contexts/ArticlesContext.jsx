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
import { useShallow } from "zustand/react/shallow";
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
  // Subscribe only to the slices this hook exposes. A bare `useArticleStore()`
  // re-renders every consumer on ANY store change — including editorArticleCache
  // writes from hover-prefetch and the internal `_*` refs set on every request —
  // which was a major source of dashboard re-renders. Zustand action identities
  // are stable, so listing them here adds no extra renders; useShallow re-renders
  // only when one of the selected values actually changes.
  const store = useArticleStore(
    useShallow((s) => ({
      articles: s.articles,
      reviewArticles: s.reviewArticles,
      publicationArticles: s.publicationArticles,
      loading: s.loading,
      refreshing: s.refreshing,
      reviewLoading: s.reviewLoading,
      reviewRefreshing: s.reviewRefreshing,
      pubArticlesLoading: s.pubArticlesLoading,
      pubArticlesRefreshing: s.pubArticlesRefreshing,
      error: s.error,
      reviewError: s.reviewError,
      areUserArticlesLoaded: s.areUserArticlesLoaded,
      arePubArticlesLoaded: s.arePubArticlesLoaded,
      areReviewArticlesLoaded: s.areReviewArticlesLoaded,
      loadUserArticles: s.loadUserArticles,
      createArticle: s.createArticle,
      loadReviewArticles: s.loadReviewArticles,
      loadPublicationArticles: s.loadPublicationArticles,
      getArticleById: s.getArticleById,
      getArticleByIdUncached: s.getArticleByIdUncached,
      getCachedArticleById: s.getCachedArticleById,
      prefetchArticle: s.prefetchArticle,
      primeEditorArticle: s.primeEditorArticle,
      primeArticleFromBlog: s.primeArticleFromBlog,
      refreshArticle: s.refreshArticle,
      updateArticle: s.updateArticle,
      moveToTrash: s.moveToTrash,
      moveToDraft: s.moveToDraft,
      moveToTrashStatus: s.moveToTrashStatus,
      restoreFromTrash: s.restoreFromTrash,
      deleteArticle: s.deleteArticle,
      publishArticle: s.publishArticle,
      unpublishArticle: s.unpublishArticle,
      acceptReviewArticle: s.acceptReviewArticle,
      rejectReviewArticle: s.rejectReviewArticle,
      revertReviewToDraft: s.revertReviewToDraft,
      bulkMoveToTrash: s.bulkMoveToTrash,
      bulkMoveToTrashStatus: s.bulkMoveToTrashStatus,
      bulkMoveToDraft: s.bulkMoveToDraft,
      bulkRestore: s.bulkRestore,
      bulkDelete: s.bulkDelete,
      bulkPublish: s.bulkPublish,
      uploadArticleImage: s.uploadArticleImage,
      createDraftFromPublished: s.createDraftFromPublished,
      addComment: s.addComment,
    })),
  );
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
    primeArticleFromBlog: store.primeArticleFromBlog,
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
