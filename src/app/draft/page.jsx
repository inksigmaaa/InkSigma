"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import AuthGuard from "@/components/auth/AuthGuard";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/contexts/ToastContext";

const DEFAULT_DRAFT_TITLE = "[Untitled]";
const LEGACY_DRAFT_TITLE = "untitle";

const isMissingRealTitle = (title) => {
  const normalized =
    typeof title === "string" ? title.trim().toLowerCase() : "";
  return (
    !normalized ||
    normalized === DEFAULT_DRAFT_TITLE.toLowerCase() ||
    normalized === LEGACY_DRAFT_TITLE
  );
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BULK_PUBLISH_TOAST_TYPE = "info";

export default function DraftPage() {
  const {
    articles,
    loading,
    moveToTrashStatus,
    bulkMoveToTrashStatus,
    bulkPublish,
    publishArticle,
    loadUserArticles,
    areUserArticlesLoaded,
  } = useArticles();
  const { currentPublication } = usePublication();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasLoadedRef = useRef(false);
  const pollIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const { data: session } = useSession();

  // Only load articles if they haven't been loaded yet or if refresh param is present
  useEffect(() => {
    const needsRefresh = searchParams.get("refresh") === "true";

    // Only load if session is available and we haven't loaded yet
    if (
      !hasLoadedRef.current &&
      session?.user?.id &&
      (needsRefresh || !areUserArticlesLoaded)
    ) {
      hasLoadedRef.current = true;
      loadUserArticles(currentPublication?.id);
    }
  }, [
    searchParams,
    session?.user?.id,
    currentPublication?.id,
    areUserArticlesLoaded,
    loadUserArticles,
  ]);

  // Clean up refresh param from URL if present (preserve publication prefix)
  useEffect(() => {
    if (searchParams.get("refresh") === "true") {
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  // Auto-refresh draft list on an interval (stay on draft page)
  useEffect(() => {
    if (!session?.user?.id) return;

    const refreshDrafts = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        await loadUserArticles(currentPublication?.id);
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      } finally {
        isPollingRef.current = false;
      }
    };

    const startPolling = () => {
      if (pollIntervalRef.current) return;
      pollIntervalRef.current = setInterval(async () => {
        await refreshDrafts();
      }, 20000);
    };

    startPolling();
    refreshDrafts();

    const handleVisibility = () => {
      if (!document.hidden) {
        refreshDrafts();
      }
    };
    const handleFocus = () => refreshDrafts();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [session?.user?.id, currentPublication?.id, loadUserArticles]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);

  const draftArticles = useMemo(() => {
    return articles
      .filter((article) => {
        const isDraft = article.status === "draft";

        // If we are in a publication context, only show articles for that publication
        if (currentPublication?.id) {
          return isDraft && article.publicationId === currentPublication.id;
        }

        // If not in a publication context (e.g. dashboard), show all drafts
        return isDraft;
      })
      .map((article) => {
        const canPublishArticle = !isMissingRealTitle(article.title);
        const displayTitle = canPublishArticle
          ? article.title
          : DEFAULT_DRAFT_TITLE;

        return {
          ...article,
          title: displayTitle,
          canPublishArticle,
          canDelete: true, // No delete restriction for drafts
          onDelete: () => {
            setActionArticleId(article.id);
            setIsBulkAction(false);
            setShowDeleteModal(true);
          },
          onPublish: canPublishArticle
            ? () => {
                setActionArticleId(article.id);
                setIsBulkAction(false);
                setShowPublishModal(true);
              }
            : undefined,
        };
      });
  }, [articles, currentPublication]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(draftArticles.map((a) => a.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles((prev) => [...prev, id]);
    } else {
      setSelectedArticles((prev) =>
        prev.filter((articleId) => articleId !== id),
      );
    }
  };

  const handleBulkDelete = () => {
    if (selectedArticles.length > 0) {
      setIsBulkAction(true);
      setShowDeleteModal(true);
    }
  };

  const handleBulkPublish = () => {
    if (selectedArticles.length > 0) {
      setIsBulkAction(true);
      setShowPublishModal(true);
    }
  };

  const { showToast } = useToast();

  const confirmDelete = async () => {
    try {
      if (isBulkAction) {
        // Filter out articles that the user cannot delete
        const articlesToDelete = selectedArticles.filter((id) => {
          const article = draftArticles.find((a) => a.id === id);
          return article && article.canDelete;
        });

        if (articlesToDelete.length !== selectedArticles.length) {
          console.warn(
            "Some selected articles could not be deleted due to permissions.",
          );
          showToast(
            "Some articles could not be deleted due to permissions.",
            "warning",
          );
        }

        if (articlesToDelete.length > 0) {
          const results = await Promise.allSettled(
            articlesToDelete.map((id) => moveToTrashStatus(id)),
          );

          const successes = results.filter(
            (r) => r.status === "fulfilled",
          ).length;
          const failures = results.filter(
            (r) => r.status === "rejected",
          ).length;
          const failedIds = articlesToDelete.filter(
            (_, index) => results[index].status === "rejected",
          );

          if (failures === 0) {
            showToast(
              `${successes} article(s) moved to trash successfully`,
              "success",
            );
            setSelectedArticles([]);
          } else {
            showToast(
              `${successes} moved to trash. ${failures} failed.`,
              "error",
            );
            setSelectedArticles(failedIds);
          }
        } else {
          showToast("No deletable articles selected.", "info");
        }
      } else if (actionArticleId) {
        try {
          await moveToTrashStatus(actionArticleId);
          showToast("Article moved to trash successfully", "success");
        } catch (error) {
          showToast("Failed to move article to trash", "error");
          console.error(error);
        }
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to trash:", error);
      showToast("An unexpected error occurred", "error");
    }
  };

  const confirmPublish = async () => {
    try {
      if (isBulkAction) {
        const publishableSelectedIds = selectedArticles.filter((id) => {
          const article = draftArticles.find((a) => a.id === id);
          return article?.canPublishArticle;
        });

        const skippedIds = selectedArticles.filter(
          (id) => !publishableSelectedIds.includes(id),
        );

        if (publishableSelectedIds.length === 0) {
          showToast(
            "No selected articles have a valid title to publish.",
            "info",
          );
          setShowPublishModal(false);
          return;
        }

        const results = await Promise.allSettled(
          publishableSelectedIds.map((id) => publishArticle(id)),
        );

        const successes = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failures = results.filter((r) => r.status === "rejected").length;
        const failedIds = publishableSelectedIds.filter(
          (_, index) => results[index].status === "rejected",
        );

        if (skippedIds.length > 0) {
          showToast(
            `${skippedIds.length} Untitled article(s) were skipped.`,
            BULK_PUBLISH_TOAST_TYPE,
          );
          await delay(300);
        }

        if (failures === 0) {
          showToast(
            `${successes} article(s) published successfully`,
            BULK_PUBLISH_TOAST_TYPE,
          );
          setSelectedArticles(skippedIds);
        } else {
          showToast(
            `${successes} published successfully. ${failures} failed.`,
            BULK_PUBLISH_TOAST_TYPE,
          );
          setSelectedArticles([...skippedIds, ...failedIds]);
        }
      } else if (actionArticleId) {
        const targetArticle = draftArticles.find(
          (a) => a.id === actionArticleId,
        );
        if (!targetArticle?.canPublishArticle) {
          showToast("Cannot publish an Untitled draft.", "error");
          setShowPublishModal(false);
          setActionArticleId(null);
          return;
        }
        try {
          await publishArticle(actionArticleId);
          showToast("Article published successfully", "success");
        } catch (error) {
          console.error("Publish failed:", error);
          showToast("Failed to publish article", "error");
        }
      } else {
        console.error("No article ID to publish!");
      }

      setShowPublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error publishing:", error);
      showToast("An unexpected error occurred during publishing", "error");
    }
  };

  const canPublish =
    currentPublication?.isOwner ||
    currentPublication?.role === "admin" ||
    currentPublication?.role === "editor";

  const hasPublishableSelection = selectedArticles.some((id) => {
    const article = draftArticles.find((a) => a.id === id);
    return article?.canPublishArticle;
  });
  const publishableSelectedCount = selectedArticles.filter((id) => {
    const article = draftArticles.find((a) => a.id === id);
    return article?.canPublishArticle;
  }).length;
  const skippedUntitledCount =
    selectedArticles.length - publishableSelectedCount;

  const actionButtons = [
    ...(canPublish
      ? [
          {
            title: "Publish",
            icon: "/images/icons/share.svg",
            onClick: handleBulkPublish,
            disabled: !hasPublishableSelection,
          },
        ]
      : []),
    {
      title: "Delete",
      icon: "/images/icons/trash2.svg",
      onClick: handleBulkDelete,
    },
  ];

  return (
    <>
      <AuthGuard />
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PageTransition>
        <PersonalArticles
          title="Drafts"
          titleColor="#FF9247"
          articles={draftArticles}
          emptyMessage="No Articles Drafted yet"
          showSelectAll={true}
          showActions={true}
          showCategoryInTitle={true}
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
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmPublish}
        title={isBulkAction ? "Publish selected drafts?" : "Publish article?"}
        message={
          isBulkAction
            ? skippedUntitledCount > 0
              ? `${publishableSelectedCount} article(s) will be published. ${skippedUntitledCount} Untitled draft(s) will be skipped.`
              : `${publishableSelectedCount} article(s) will be published.`
            : "This article will be published"
        }
        confirmText="Publish"
        confirmStyle="normal"
      />
    </>
  );
}
