"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import FullPageErrorState from "@/components/common/FullPageErrorState";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { toast } from "sonner";
import { withPublicationPath } from "@/utils/dashboardUrl";

export default function PublishedPage() {
  const {
    articles,
    publicationArticles,
    pubArticlesLoading,
    error,
    moveToTrashStatus,
    bulkMoveToTrashStatus,
    createDraftFromPublished,
    unpublishArticle,
    loadPublicationArticles,
  } = useArticles();

  const { currentPublication, getCurrentUserRole } = usePublication();
  const currentPublicationSubdomain = currentPublication?.subdomain;
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const refreshParam = searchParams.get("refresh");
  const router = useRouter();
  const loadedRequestRef = useRef(null);
  const [pageError, setPageError] = useState(null);

  // Determine user role
  const userRole = getCurrentUserRole();
  const isAdmin =
    userRole === "admin" ||
    userRole === "editor" ||
    currentPublication?.isOwner;
  const isAuthor = userRole === "author";

  // IMPORTANT: Always use publicationArticles to show ALL published articles
  // But filter actions based on ownership
  const displayArticles = currentPublication?.id
    ? publicationArticles.filter(
        (article) =>
          String(article.publicationId) === String(currentPublication.id) &&
          article.status === "published",
      )
    : [];
  const isLoading = pubArticlesLoading;

  // Load appropriate articles - ALWAYS load publication articles to show all published blogs
  useEffect(() => {
    const needsRefresh = refreshParam === "true";

    const requestKey = currentPublication?.id
      ? `publication:${currentPublication.id}:status:published`
      : null;
    const shouldLoad =
      needsRefresh ||
      loadedRequestRef.current !== requestKey;

    if (!shouldLoad || !currentPublication?.id) return;

    let cancelled = false;

    const loadArticles = async () => {
      try {
        setPageError(null);
        loadedRequestRef.current = requestKey;
        await loadPublicationArticles(
          currentPublication.id,
          "published",
          {},
          {
            force: needsRefresh,
          },
        );
      } catch (loadError) {
        if (!cancelled) {
          setPageError(loadError?.message || "Failed to load published articles");
        }
      }
    };

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, [
    refreshParam,
    isLoading,
    loadPublicationArticles,
    currentPublication?.id,
  ]);

  const effectiveError = pageError || error;

  // Clean up refresh param from URL if present
  useEffect(() => {
    if (refreshParam === "true") {
      router.replace(
        withPublicationPath("/published", currentPublicationSubdomain),
        { scroll: false },
      );
    }
  }, [refreshParam, router, currentPublicationSubdomain]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);

  const publishedArticles = displayArticles
    .filter((article) => {
      return article.status === "published";
    })
    .map((article) => {
      // Check if current user is the author of this article
      // article.author is an object (not a plain ID), so use article.author.id
      const isOwnArticle =
        session?.user?.id &&
        article.author &&
        String(article.author.id) === String(session.user.id);

      // For authors, only show actions for their own articles
      // For admins/editors, show actions for all articles
      const canEdit = isAdmin || isOwnArticle;

      // Allow deletion only if user is owner/admin or if it's their own article
      // Editors cannot delete articles they didn't create
      const canDelete =
        currentPublication?.isOwner || userRole === "admin" || isOwnArticle;

      return {
        ...article,
        // Always pass the handlers, but PersonalArticleContainer will check canEdit
        onDelete: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowDeleteModal(true);
        },
        onDraft: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowDraftModal(true);
        },
        onUnpublish: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowUnpublishModal(true);
        },
        isOwnArticle, // Pass this flag to the component
        canEdit, // Pass this flag to control button visibility
        canDelete,
      };
    });

  const handleArticleSelect = (id, isSelected) => {
    // Only allow selection of own articles for authors
    const article = publishedArticles.find((a) => a.id === id);
    if (isAuthor && !article?.isOwnArticle) {
      return; // Don't allow selection of others' articles
    }

    setSelectedArticles((prev) =>
      isSelected ? [...prev, id] : prev.filter((articleId) => articleId !== id),
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // For authors, only select their own articles
      const selectableArticles = isAuthor
        ? publishedArticles.filter((a) => a.isOwnArticle)
        : publishedArticles;
      setSelectedArticles(selectableArticles.map((article) => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleBulkDraft = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowDraftModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (isBulkAction) {
        // Filter out articles that the user cannot delete
        const articlesToDelete = selectedArticles.filter((id) => {
          const article = publishedArticles.find((a) => a.id === id);
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
          toast.success(
            `${articlesToDelete.length} article(s) moved to trash successfully`,
          );
        } else {
          toast("No deletable articles selected.");
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToTrashStatus(actionArticleId);
        toast.success("Article moved to trash successfully");
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving article to trash:", error);
      toast.error("Failed to move article to trash");
    }
  };

  const confirmDraft = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          // For published articles, we create a draft copy
          await createDraftFromPublished(articleId);
        }
        toast.success(
          `${selectedArticles.length} draft copy/copies created successfully`,
        );
        setSelectedArticles([]);
      } else if (actionArticleId) {
        // For published articles, we create a draft copy
        await createDraftFromPublished(actionArticleId);
        toast.success("Draft copy created successfully");
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error creating draft copy:", error);
      toast.error("Failed to create draft copy");
    }
  };

  const confirmUnpublish = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await unpublishArticle(articleId);
        }
        toast.success(
          `${selectedArticles.length} article(s) moved to unpublished`,
        );
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await unpublishArticle(actionArticleId);
        toast.success("Article moved to unpublished");
      }
      setShowUnpublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error unpublishing article:", error);
      toast.error("Failed to unpublish article");
    }
  };

  // Only show loading state if we're loading AND have no articles yet
  if (isLoading && publicationArticles.length === 0) {
    return (
      <>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-pulse">
          <div className="text-gray-500">Loading published articles...</div>
        </div>
      </>
    );
  }

  if (effectiveError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[PublishedPage] load error:", effectiveError);
    }
    const handleRetry = () => {
      setPageError(null);
      loadedRequestRef.current = null;
      if (currentPublication?.id) {
        loadPublicationArticles(currentPublication.id, "published", {}, { force: true });
      }
    };
    return (
      <>
        <Verify />
        <FullPageErrorState
          title="We couldn't load your published articles"
          description="Something went wrong while loading this page. Please try again in a moment."
          onPrimaryAction={handleRetry}
          className="min-h-[70vh]"
        />
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
          title="Published"
          titleColor="#72D770"
          articles={publishedArticles}
          emptyMessage="No published articles yet"
          showSelectAll={true}
          showActions={true}
          actionButtons={actionButtons}
          selectedArticles={selectedArticles}
          onSelectAll={handleSelectAll}
          onArticleSelect={handleArticleSelect}
        />
      </PageTransition>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message="This will be put into trash and can be restored later"
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDraft}
        title="Create a Draft?"
        message={
          isBulkAction
            ? `Draft copies will be created for ${selectedArticles.length} article(s). Originals will remain published.`
            : "A draft copy will be created. The original article will remain published."
        }
        confirmText="Create Draft"
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
