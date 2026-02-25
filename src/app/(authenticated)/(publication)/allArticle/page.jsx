"use client";

import { useState, useEffect, useRef } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Verify from "@/components/features/verify/Verify";
import Articles from "@/components/features/articles/Articles";
import CategoryBadgeList from "@/components/CategoryBadgeList";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function AllArticlePage() {
  const {
    articles,
    publicationArticles,
    loading,
    pubArticlesLoading,
    loadUserArticles,
    loadPublicationArticles,
  } = useArticles();

  const { currentPublication, getCurrentUserRole } = usePublication();
  const searchParams = useSearchParams();

  // Refs to track loading state
  const hasLoadedRef = useRef(false);
  const loadedContextRef = useRef(null); // 'user' or 'publication'

  // Determine user role and which articles to show
  const userRole = getCurrentUserRole();
  const isAdmin =
    userRole === "admin" ||
    userRole === "editor" ||
    currentPublication?.isOwner;

  // Use publicationArticles for admins/editors, otherwise use user articles
  const displayArticles =
    isAdmin && currentPublication ? publicationArticles : articles;
  const isLoading =
    isAdmin && currentPublication ? pubArticlesLoading : loading;

  // Load appropriate articles on mount or when context changes
  useEffect(() => {
    const needsRefresh = searchParams.get("refresh") === "true";

    // Target context based on current state
    const targetContext =
      isAdmin && currentPublication?.id ? "publication" : "user";

    // Always load on first mount or context change
    const isWrongContext =
      hasLoadedRef.current && loadedContextRef.current !== targetContext;

    const shouldLoad = needsRefresh || !hasLoadedRef.current || isWrongContext;

    if (shouldLoad) {
      hasLoadedRef.current = true;
      loadedContextRef.current = targetContext;

      if (targetContext === "publication") {
        loadPublicationArticles(currentPublication.id); // No status filter for "All Articles"
      } else {
        loadUserArticles();
      }
    }
  }, [
    searchParams,
    loadUserArticles,
    loadPublicationArticles,
    isAdmin,
    currentPublication?.id,
  ]);

  const { data: session } = useSession();

  // Calculate permissions for each article
  const articlesWithPermissions = displayArticles.map((article) => {
    // Only restrict deletion for published articles
    let canDelete = true;
    if (article.status === "published") {
      const isOwnArticle =
        session?.user?.id &&
        article.author &&
        String(article.author.id) === String(session.user.id);

      canDelete =
        currentPublication?.isOwner || userRole === "admin" || isOwnArticle;
    }

    return {
      ...article,
      canDelete,
    };
  });

  return (
    <AuthGuard>
                  <Verify />
      <Articles
        title={"All Articles"}
        articles={articlesWithPermissions}
        loading={isLoading}
      />
    </AuthGuard>
  );
}
