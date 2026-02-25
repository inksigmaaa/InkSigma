"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import SchedulePageClient from "@/components/features/schedule/SchedulePageClient";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import AuthGuard from "@/components/auth/AuthGuard";

export default function SchedulePage() {
  const {
    articles,
    publicationArticles,
    loading,
    pubArticlesLoading,
    error,
    loadUserArticles,
    loadPublicationArticles,
    moveToTrashStatus,
    bulkMoveToTrashStatus,
    moveToDraft,
    bulkMoveToDraft,
  } = useArticles();
  const { currentPublication, getCurrentUserRole } = usePublication();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine user role and which articles to show
  const userRole = getCurrentUserRole();
  const isAdmin =
    userRole === "admin" ||
    userRole === "editor" ||
    currentPublication?.isOwner;

  // Use publicationArticles for admins/editors, otherwise use user articles
  const allArticles =
    isAdmin && currentPublication ? publicationArticles : articles;
  const isLoading =
    isAdmin && currentPublication ? pubArticlesLoading : loading;

  // Refs to prevent stale closures and unnecessary re-renders
  const loadUserArticlesRef = useRef(loadUserArticles);
  const loadPublicationArticlesRef = useRef(loadPublicationArticles);
  const hasMountedRef = useRef(false);
  const loadedContextRef = useRef(null); // 'user' or 'publication'

  // Update refs when functions change
  useEffect(() => {
    loadUserArticlesRef.current = loadUserArticles;
    loadPublicationArticlesRef.current = loadPublicationArticles;
  }, [loadUserArticles, loadPublicationArticles]);

  // Refresh articles when coming from editor with refresh param or when component mounts
  useEffect(() => {
    const needsRefresh = searchParams.get("refresh") === "true";

    // Target context based on current state
    const targetContext =
      isAdmin && currentPublication?.id ? "publication" : "user";

    // Check if context changed
    const isWrongContext =
      hasMountedRef.current && loadedContextRef.current !== targetContext;

    const shouldLoad = needsRefresh || !hasMountedRef.current || isWrongContext;

    if (shouldLoad) {
      hasMountedRef.current = true;
      loadedContextRef.current = targetContext;

      if (targetContext === "publication") {
        loadPublicationArticlesRef.current(currentPublication.id);
      } else {
        loadUserArticlesRef.current(null, true); // Load all publications for scheduled articles
      }

      // Clean up the URL if refresh param was present
      if (needsRefresh) {
        router.replace("/schedule", { scroll: false });
      }
    }
  }, [searchParams, router, isAdmin, currentPublication?.id]);

  // Filter scheduled articles - separate from action handlers to prevent re-renders
  const scheduledArticleIds = useMemo(() => {
    const scheduled = allArticles.filter(
      (article) => article.status === "scheduled",
    );
    return scheduled.map((article) => article.id);
  }, [allArticles]);

  // Memoized action handlers
  const handleDeleteAction = useCallback((articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowDeleteModal(true);
  }, []);

  const handleDraftAction = useCallback((articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowDraftModal(true);
  }, []);

  // Create scheduled articles with stable action handlers
  const scheduledArticles = useMemo(() => {
    const scheduled = allArticles.filter(
      (article) => article.status === "scheduled",
    );
    return scheduled.map((article) => {
      return {
        ...article,
        canDelete: true, // No delete restriction for scheduled articles
        onDelete: () => handleDeleteAction(article.id),
        onDraft: () => handleDraftAction(article.id),
      };
    });
  }, [
    allArticles,
    handleDeleteAction,
    handleDraftAction,
    session?.user?.id,
    currentPublication,
    userRole,
  ]);

  // Smart refresh: set a single timer for the next scheduled article to publish
  useEffect(() => {
    if (scheduledArticles.length === 0) return;

    const now = new Date();

    // Find the next article that will be published
    const upcomingArticles = scheduledArticles
      .filter((article) => article.scheduledAt)
      .map((article) => ({
        id: article.id,
        title: article.title,
        scheduledTime: new Date(article.scheduledAt),
      }))
      .filter((article) => article.scheduledTime > now)
      .sort((a, b) => a.scheduledTime - b.scheduledTime);

    if (upcomingArticles.length === 0) return;

    const nextArticle = upcomingArticles[0];
    const timeUntilPublish =
      nextArticle.scheduledTime.getTime() - now.getTime();

    // Set a timer to refresh after the scheduled time + 2 seconds buffer
    const timer = setTimeout(() => {
      const targetContext =
        isAdmin && currentPublication?.id ? "publication" : "user";
      if (targetContext === "publication") {
        loadPublicationArticlesRef.current(currentPublication.id);
      } else {
        loadUserArticlesRef.current(null, true); // Load all publications for scheduled articles
      }
    }, timeUntilPublish + 2000);

    return () => clearTimeout(timer);
  }, [scheduledArticles, isAdmin, currentPublication?.id]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const targetContext =
        isAdmin && currentPublication?.id ? "publication" : "user";
      if (targetContext === "publication") {
        await loadPublicationArticlesRef.current(currentPublication.id);
      } else {
        await loadUserArticlesRef.current(null, true); // Load all publications for scheduled articles
      }
    } catch (error) {
      console.error("Error refreshing articles:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAdmin, currentPublication?.id]);

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedArticles(scheduledArticleIds);
      } else {
        setSelectedArticles([]);
      }
    },
    [scheduledArticleIds],
  );

  const handleArticleSelect = useCallback((id, checked) => {
    if (checked) {
      setSelectedArticles((prev) => [...prev, id]);
    } else {
      setSelectedArticles((prev) =>
        prev.filter((articleId) => articleId !== id),
      );
    }
  }, []);

  const handleBulkDelete = useCallback(() => {
    setIsBulkAction(true);
    setShowDeleteModal(true);
  }, []);

  const handleBulkDraft = useCallback(() => {
    setIsBulkAction(true);
    setShowDraftModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      if (isBulkAction) {
        // Filter out articles that the user cannot delete
        const articlesToDelete = selectedArticles.filter((id) => {
          const article = scheduledArticles.find((a) => a.id === id);
          return article && article.canDelete;
        });

        if (articlesToDelete.length !== selectedArticles.length) {
          console.warn(
            "Some selected articles could not be deleted due to permissions.",
          );
        }

        if (articlesToDelete.length > 0) {
          await bulkMoveToTrashStatus(articlesToDelete);
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToTrashStatus(actionArticleId);
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to trash:", error);
    }
  }, [
    isBulkAction,
    selectedArticles,
    actionArticleId,
    bulkMoveToTrashStatus,
    moveToTrashStatus,
    scheduledArticles,
  ]);

  const confirmDraft = useCallback(async () => {
    try {
      if (isBulkAction) {
        await bulkMoveToDraft(selectedArticles);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToDraft(actionArticleId);
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to draft:", error);
    }
  }, [
    isBulkAction,
    selectedArticles,
    actionArticleId,
    bulkMoveToDraft,
    moveToDraft,
  ]);

  const actionButtons = useMemo(
    () => [
      {
        title: "Move to Draft",
        icon: "/images/icons/edit.svg",
        onClick: handleBulkDraft,
      },
      {
        title: "Delete",
        icon: "/images/icons/trash2.svg",
        onClick: handleBulkDelete,
      },
    ],
    [handleBulkDraft, handleBulkDelete],
  );

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setActionArticleId(null);
  }, []);

  const handleCloseDraftModal = useCallback(() => {
    setShowDraftModal(false);
    setActionArticleId(null);
  }, []);

  // Only show loading state if we're loading AND have no articles yet
  if (isLoading && allArticles.length === 0) {
    return (
      <AuthGuard>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">Loading scheduled articles...</div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
                  <Verify />
      <PersonalArticles
        title="Scheduled"
        titleColor="#0048B5"
        articles={scheduledArticles}
        emptyMessage="No scheduled articles yet"
        showSelectAll={true}
        showActions={true}
        actionButtons={actionButtons}
        selectedArticles={selectedArticles}
        onSelectAll={handleSelectAll}
        onArticleSelect={handleArticleSelect}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message={
          isBulkAction
            ? `${selectedArticles.length} scheduled article(s) will be moved to trash`
            : "This scheduled article will be moved to trash"
        }
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={handleCloseDraftModal}
        onConfirm={confirmDraft}
        title="Move to Draft?"
        message={
          isBulkAction
            ? `${selectedArticles.length} scheduled article(s) will be moved to drafts`
            : "This scheduled article will be moved to drafts"
        }
        confirmText="Move to Draft"
        confirmStyle="normal"
      />
    </AuthGuard>
  );
}
