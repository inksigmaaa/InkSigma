"use client";

import { useState, useEffect } from "react";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";

import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  DEFAULT_DRAFT_TITLE,
  isArticlePublishable,
  isMissingRealTitle,
} from "@/utils/articlePublishability";

export default function Unpublished() {
  const {
    articles,
    publicationArticles,
    loading,
    pubArticlesLoading,
    error,
    publishArticle,
    moveToDraft,
    moveToTrashStatus,
    loadUserArticles,
    loadPublicationArticles,
  } = useArticles();

  const { data: session } = useSession();
  const { currentPublication, getCurrentUserRole } = usePublication();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showRepublishModal, setShowRepublishModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [pageError, setPageError] = useState(null);

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

  // Load appropriate articles on mount or when publication changes
  useEffect(() => {
    let cancelled = false;

    const loadArticles = async () => {
      try {
        setPageError(null);

        if (isAdmin && currentPublication?.id) {
          await loadPublicationArticles(currentPublication.id);
        } else {
          await loadUserArticles(currentPublication?.id);
        }
      } catch (loadError) {
        if (!cancelled) {
          setPageError(loadError?.message || "Failed to load unpublished articles");
        }
      }
    };

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, [
    isAdmin,
    currentPublication?.id,
    loadPublicationArticles,
    loadUserArticles,
  ]);

  const effectiveError = isAdmin && currentPublication ? pageError : error;

  // Filter unpublished articles (api already filters for pubArticles, but safety check)
  const unpublishedArticles = displayArticles
    .filter((article) => article.status === "unpublished")
    .map((article) => {
      const hasRealTitle = !isMissingRealTitle(article.title);
      const canPublishArticle = isArticlePublishable(article);
      const displayTitle = !hasRealTitle
        ? DEFAULT_DRAFT_TITLE
        : article.title;

      return {
        ...article,
        title: displayTitle,
        canPublishArticle,
        canDelete: true, // No delete restriction for unpublished articles
        onRepublish: canPublishArticle
          ? () => {
              setActionArticleId(article.id);
              setIsBulkAction(false);
              setShowRepublishModal(true);
            }
          : undefined,
        onDraft: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowDraftModal(true);
        },
        onDelete: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowTrashModal(true);
        },
      };
    });

  // Add handlers to articles
  const articlesWithHandlers = unpublishedArticles.map((article) => ({
    ...article,
    canPublishArticle: article.canPublishArticle,
    onDraft: () => handleIndividualDraft(article.id),
    onDelete: () => handleIndividualDelete(article.id),
  }));

  const handleArticleSelect = (id, isSelected) => {
    setSelectedArticles((prev) =>
      isSelected ? [...prev, id] : prev.filter((articleId) => articleId !== id),
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(unpublishedArticles.map((article) => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleBulkRepublish = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowRepublishModal(true);
  };

  const handleBulkDraft = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setActionArticleId(null);
    setShowDraftModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setActionArticleId(null);
    setShowTrashModal(true);
  };

  const handleIndividualDraft = (id) => {
    setIsBulkAction(false);
    setActionArticleId(id);
    setShowDraftModal(true);
  };

  const handleIndividualDelete = (id) => {
    setIsBulkAction(false);
    setActionArticleId(id);
    setShowTrashModal(true);
  };

  const confirmRepublish = async () => {
    try {
      if (isBulkAction) {
        const publishableSelectedIds = selectedArticles.filter((id) => {
          const article = articlesWithHandlers.find((a) => a.id === id);
          return article?.canPublishArticle;
        });

        if (publishableSelectedIds.length !== selectedArticles.length) {
          toast(
            `${selectedArticles.length - publishableSelectedIds.length} article(s) skipped due to missing title.`,
          );
        }

        for (const articleId of publishableSelectedIds) {
          await publishArticle(articleId);
        }
        if (publishableSelectedIds.length > 0) {
          toast.success(
            `${publishableSelectedIds.length} article(s) republished successfully`,
          );
        } else {
          toast("No publishable articles selected.");
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await publishArticle(actionArticleId);
        toast.success("Article republished successfully");
      }
      setShowRepublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error republishing articles:", error);
      toast.error("Failed to republish article(s)");
    }
  };

  const confirmDraft = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await moveToDraft(articleId);
        }
        toast.success(`${selectedArticles.length} article(s) moved to drafts`);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToDraft(actionArticleId);
        toast.success("Article moved to drafts");
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving articles to draft:", error);
      toast.error("Failed to move article(s) to drafts");
    }
  };

  const confirmTrash = async () => {
    try {
      if (isBulkAction) {
        // Filter out articles that the user cannot delete
        const articlesToDelete = selectedArticles.filter((id) => {
          const article = articlesWithHandlers.find((a) => a.id === id);
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

        for (const articleId of articlesToDelete) {
          await moveToTrashStatus(articleId);
        }
        if (articlesToDelete.length > 0) {
          toast.success(
            `${articlesToDelete.length} article(s) moved to trash successfully`,
          );
        } else {
          toast("No deletable articles selected.");
        }
        setSelectedArticles([]);
      } else {
        await moveToTrashStatus(actionArticleId);
        toast.success("Article moved to trash successfully");
      }
      setShowTrashModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving articles to trash:", error);
      toast.error("Failed to move article(s) to trash");
    }
  };

  if (isLoading) {
    return (
      <>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-pulse">
          <div className="text-gray-500">Loading unpublished articles...</div>
        </div>
      </>
    );
  }

  if (effectiveError) {
    return (
      <>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-fadeIn">
          <div className="text-red-500">Error: {effectiveError}</div>
        </div>
      </>
    );
  }

  const hasSelectedArticles = selectedArticles.length > 0;

  const actionButtons = [
    {
      icon: "/images/icons/draft1.svg",
      title: "Move to Draft",
      onClick: handleBulkDraft,
    },
    {
      icon: "/images/icons/publish-ideal.svg",
      title: "Republish",
      onClick: handleBulkRepublish,
      disabled: !selectedArticles.some((id) => {
        const article = articlesWithHandlers.find((a) => a.id === id);
        return article?.canPublishArticle;
      }),
    },
    {
      icon: "/images/icons/trash2.svg",
      title: "Delete",
      onClick: handleBulkDelete,
    },
  ];

  return (
    <>
                  <Verify />
      <PageTransition>
        <PersonalArticles
          title="Unpublished"
          titleColor="#D97706"
          articles={articlesWithHandlers}
          emptyMessage="No unpublished articles yet"
          showSelectAll={true}
          showActions={true}
          actionButtons={actionButtons}
          selectedArticles={selectedArticles}
          onSelectAll={handleSelectAll}
          onArticleSelect={handleArticleSelect}
        />
      </PageTransition>

      <ConfirmModal
        isOpen={showRepublishModal}
        onClose={() => {
          setShowRepublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmRepublish}
        title="Republish article?"
        message={
          isBulkAction
            ? `${selectedArticles.length} article(s) will be republished`
            : "This article will be republished"
        }
        confirmText="Republish"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDraft}
        title="Move to Draft?"
        message={
          isBulkAction
            ? `${selectedArticles.length} article(s) will be moved to drafts`
            : "This article will be moved to drafts"
        }
        confirmText="Move to Draft"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showTrashModal}
        onClose={() => {
          setShowTrashModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmTrash}
        title="Are you sure you want to put it in trash?"
        message={
          isBulkAction
            ? `${selectedArticles.length} article(s) will be put into trash and can be restored later`
            : "This will be put into trash and can be restored later"
        }
        confirmText="Move to Trash"
        confirmStyle="danger"
      />
    </>
  );
}
