"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import AuthGuard from "@/components/auth/AuthGuard";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useArticleSelection } from "@/hooks/useArticleSelection";
import {
  DEFAULT_DRAFT_TITLE,
  isArticlePublishable,
  isMissingRealTitle,
} from "@/utils/articlePublishability";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BULK_PUBLISH_TOAST_TYPE = "info";

export default function DraftPage() {
  const {
    articles,
    moveToTrashStatus,
    bulkMoveToTrashStatus,
    bulkPublish,
    publishArticle,
    loadUserArticles,
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
    const publicationId = currentPublication?.id;
    if (!session?.user?.id || !publicationId) return;

    const requestKey = `publication:${publicationId}:draft`;
    if (needsRefresh || hasLoadedRef.current !== requestKey) {
      hasLoadedRef.current = requestKey;
      loadUserArticles(publicationId, false, "draft", {}, { force: needsRefresh });
    }
  }, [
    searchParams,
    session?.user?.id,
    currentPublication?.id,
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
    if (!session?.user?.id || !currentPublication?.id) return;

    const refreshDrafts = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        await loadUserArticles(currentPublication.id, false, "draft");
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
          return (
            isDraft &&
            String(article.publicationId) === String(currentPublication.id)
          );
        }

        return false;
      })
      .map((article) => {
        const hasRealTitle = !isMissingRealTitle(article.title);
        const canPublishArticle = isArticlePublishable(article);
        const displayTitle = hasRealTitle
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

  const {
    selectedArticles,
    setSelectedArticles,
    handleSelectAll,
    handleArticleSelect,
  } = useArticleSelection(draftArticles.map((a) => a.id));

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
          toast.warning("Some articles could not be deleted due to permissions.");
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
            toast.success(`${successes} article(s) moved to trash successfully`);
            setSelectedArticles([]);
          } else {
            toast.error(`${successes} moved to trash. ${failures} failed.`);
            setSelectedArticles(failedIds);
          }
        } else {
          toast("No deletable articles selected.");
        }
      } else if (actionArticleId) {
        try {
          await moveToTrashStatus(actionArticleId);
          toast.success("Article moved to trash successfully");
        } catch (error) {
          toast.error("Failed to move article to trash");
          console.error(error);
        }
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to trash:", error);
      toast.error("An unexpected error occurred");
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
          toast("No selected articles are complete enough to publish.");
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
          toast(`${skippedIds.length} incomplete article(s) were skipped.`);
          await delay(300);
        }

        if (failures === 0) {
          toast.success(`${successes} article(s) published successfully`);
          setSelectedArticles(skippedIds);
        } else {
          toast.error(`${successes} published successfully. ${failures} failed.`);
          setSelectedArticles([...skippedIds, ...failedIds]);
        }
      } else if (actionArticleId) {
        const targetArticle = draftArticles.find(
          (a) => a.id === actionArticleId,
        );
        if (!targetArticle?.canPublishArticle) {
          toast.error(
            "Cannot publish this draft without title, description, and content.",
          );
          setShowPublishModal(false);
          setActionArticleId(null);
          return;
        }
        try {
          await publishArticle(actionArticleId);
          toast.success("Article published successfully");
        } catch (error) {
          console.error("Publish failed:", error);
          toast.error("Failed to publish article");
        }
      } else {
        console.error("No article ID to publish!");
      }

      setShowPublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error publishing:", error);
      toast.error("An unexpected error occurred during publishing");
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
              ? `${publishableSelectedCount} article(s) will be published. ${skippedUntitledCount} incomplete draft(s) will be skipped.`
              : `${publishableSelectedCount} article(s) will be published.`
            : "This article will be published"
        }
        confirmText="Publish"
        confirmStyle="normal"
      />
    </>
  );
}
