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
import PageTransition from "@/components/PageTransition";
import { toast } from "sonner";
import { withPublicationPath } from "@/utils/dashboardUrl";

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
  const currentPublicationSubdomain = currentPublication?.subdomain;
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
  const currentPublicationId = currentPublication?.id;
  const isAdmin =
    userRole === "admin" ||
    userRole === "editor" ||
    currentPublication?.isOwner;

  // Use publicationArticles for admins/editors, otherwise use user articles
  const allArticles = useMemo(
    () =>
      currentPublicationId
        ? (isAdmin ? publicationArticles : articles).filter(
            (article) =>
              String(article.publicationId) === String(currentPublicationId),
          )
        : [],
    [articles, currentPublicationId, isAdmin, publicationArticles],
  );
  const isLoading =
    isAdmin && currentPublication ? pubArticlesLoading : loading;

  // Refs to prevent stale closures and unnecessary re-renders
  const loadUserArticlesRef = useRef(loadUserArticles);
  const loadPublicationArticlesRef = useRef(loadPublicationArticles);
  const loadedRequestRef = useRef(null);

  // Update refs when functions change
  useEffect(() => {
    loadUserArticlesRef.current = loadUserArticles;
    loadPublicationArticlesRef.current = loadPublicationArticles;
  }, [loadUserArticles, loadPublicationArticles]);

  // Refresh articles when coming from editor with refresh param or when component mounts
  useEffect(() => {
    const needsRefresh = searchParams.get("refresh") === "true";
    if (!currentPublication?.id) return;

    // Target context based on current state
    const targetContext =
      isAdmin && currentPublication?.id ? "publication" : "user";
    const requestKey =
      targetContext === "publication"
        ? `publication:${currentPublication.id}`
        : `user:${session?.user?.id || "anonymous"}`;
    const shouldLoad =
      needsRefresh || loadedRequestRef.current !== requestKey;

    if (shouldLoad) {
      loadedRequestRef.current = requestKey;

      if (targetContext === "publication") {
        loadPublicationArticlesRef.current(currentPublication.id, "scheduled");
      } else {
        loadUserArticlesRef.current(currentPublication.id, false, "scheduled");
      }

      // Clean up the URL if refresh param was present
      if (needsRefresh) {
        router.replace(
          withPublicationPath("/schedule", currentPublicationSubdomain),
          { scroll: false },
        );
      }
    }
  }, [
    searchParams,
    router,
    isAdmin,
    currentPublication?.id,
    currentPublicationSubdomain,
    session?.user?.id,
  ]);

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
        loadPublicationArticlesRef.current(currentPublication.id, "scheduled");
      } else {
        loadUserArticlesRef.current(currentPublication.id, false, "scheduled");
      }
    }, timeUntilPublish + 2000);

    return () => clearTimeout(timer);
  }, [scheduledArticles, isAdmin, currentPublication?.id]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    if (!currentPublication?.id) return;

    setIsRefreshing(true);
    try {
      const targetContext =
        isAdmin && currentPublication?.id ? "publication" : "user";
      if (targetContext === "publication") {
        await loadPublicationArticlesRef.current(currentPublication.id, "scheduled");
      } else {
        await loadUserArticlesRef.current(currentPublication.id, false, "scheduled");
      }
    } catch (error) {
      console.error("Error refreshing articles:", error);
      toast.error("Failed to refresh scheduled articles");
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
          toast.warning(
            "Some selected articles could not be deleted due to permissions.",
          );
        }

        if (articlesToDelete.length > 0) {
          await bulkMoveToTrashStatus(articlesToDelete);
          toast.success(`${articlesToDelete.length} article(s) moved to trash`);
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToTrashStatus(actionArticleId);
        toast.success("Article moved to trash");
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to trash:", error);
      toast.error("Failed to move article(s) to trash");
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
        toast.success(`${selectedArticles.length} article(s) moved to drafts`);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToDraft(actionArticleId);
        toast.success("Article moved to drafts");
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to draft:", error);
      toast.error("Failed to move article(s) to drafts");
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
      <PageTransition>
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
      </PageTransition>

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
