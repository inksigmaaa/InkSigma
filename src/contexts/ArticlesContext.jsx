"use client";

/**
 * Backward-compatible wrapper around the Zustand articleStore.
 *
 * All state and logic now lives in @/stores/articleStore.
 * This file keeps the existing <ArticlesProvider> + useArticles() API
 * so consumers don't need any changes.
 *
 * The provider still exists to auto-load user articles when session changes —
 * but it no longer holds React state (Zustand does).
 */

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { usePublication } from "@/contexts/PublicationContext";
import { useArticleStore } from "@/stores/articleStore";

export function ArticlesProvider({ children }) {
  const { data: session } = useSession();

  let currentPublication = null;
  try {
    const pubContext = usePublication();
    currentPublication = pubContext?.currentPublication;
  } catch {
    // PublicationContext not available
  }

  const currentPubRef = useRef(currentPublication);
  useEffect(() => {
    currentPubRef.current = currentPublication;
  }, [currentPublication]);

  const loadUserArticles = useArticleStore((s) => s.loadUserArticles);

  // Auto-load user articles when session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadUserArticles(session, currentPubRef.current?.id);
    }
  }, [session?.user?.id, loadUserArticles, session]);

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

  let currentPublication = null;
  try {
    const pubContext = usePublication();
    currentPublication = pubContext?.currentPublication;
  } catch {
    // PublicationContext not available
  }

  // Wrap loadUserArticles to auto-inject session + publicationId (matching old API)
  const rawLoadUserArticles = store.loadUserArticles;
  const loadUserArticles = (
    publicationId = null,
    includeAllPublications = false,
    status = null,
    extraFilters = {},
  ) => {
    const effectivePubId = publicationId || currentPublication?.id;
    return rawLoadUserArticles(session, effectivePubId, includeAllPublications, status, extraFilters);
  };

  // Wrap createArticle to auto-inject currentPublicationId (matching old API)
  const rawCreateArticle = store.createArticle;
  const createArticle = (articleData) => {
    return rawCreateArticle(articleData, currentPublication?.id);
  };

  return {
    // State
    articles: store.articles,
    reviewArticles: store.reviewArticles,
    publicationArticles: store.publicationArticles,
    loading: store.loading,
    reviewLoading: store.reviewLoading,
    pubArticlesLoading: store.pubArticlesLoading,
    error: store.error,
    reviewError: store.reviewError,
    areUserArticlesLoaded: store.areUserArticlesLoaded,
    arePubArticlesLoaded: store.arePubArticlesLoaded,

    // Wrapped actions (inject session/publication automatically)
    loadUserArticles,
    createArticle,

    // Pass-through actions (no wrapping needed)
    loadReviewArticles: store.loadReviewArticles,
    loadPublicationArticles: store.loadPublicationArticles,
    getArticleById: store.getArticleById,
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
