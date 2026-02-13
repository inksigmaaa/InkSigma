"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import ConfirmModal from "../components/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import AuthGuard from "@/components/auth/AuthGuard";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/contexts/ToastContext";

export default function DraftPage() {
  const {
    articles,
    loading,
    moveToTrashStatus,
    bulkMoveToTrashStatus,
    bulkPublish,
    publishArticle,
    loadUserArticles,
  } = useArticles();
  const { currentPublication } = usePublication();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  const { data: session } = useSession();

  // Only load articles if they haven't been loaded yet or if refresh param is present
  useEffect(() => {
    const needsRefresh = searchParams.get("refresh") === "true";

    // Only load if session is available and we haven't loaded yet
    if (
      !hasLoadedRef.current &&
      session?.user?.id &&
      (needsRefresh || articles.length === 0)
    ) {
      console.log(
        "[DraftPage] Loading articles with context:",
        currentPublication?.id,
      );
      hasLoadedRef.current = true;
      loadUserArticles(currentPublication?.id, false);
    }
  }, [
    searchParams,
    session?.user?.id,
    currentPublication?.id,
    articles.length,
    loadUserArticles,
  ]);

  // Clean up refresh param from URL if present
  useEffect(() => {
    if (searchParams.get("refresh") === "true") {
      router.replace("/draft", { scroll: false });
    }
  }, [searchParams, router]);
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
        return {
          ...article,
          canDelete: true, // No delete restriction for drafts
          onDelete: () => {
            setActionArticleId(article.id);
            setIsBulkAction(false);
            setShowDeleteModal(true);
          },
          onPublish: () => {
            setActionArticleId(article.id);
            setIsBulkAction(false);
            setShowPublishModal(true);
          },
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
      console.log("=== PUBLISH FLOW START ===");
      console.log("Is bulk action:", isBulkAction);
      console.log("Action article ID:", actionArticleId);
      console.log("Selected articles:", selectedArticles);

      if (isBulkAction) {
        console.log("Calling bulkPublish with IDs:", selectedArticles);

        const results = await Promise.allSettled(
          selectedArticles.map((id) => publishArticle(id)),
        );

        const successes = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failures = results.filter((r) => r.status === "rejected").length;
        const failedIds = selectedArticles.filter(
          (_, index) => results[index].status === "rejected",
        );

        if (failures === 0) {
          showToast(
            `${successes} article(s) published successfully`,
            "success",
          );
          setSelectedArticles([]);
        } else {
          showToast(
            `${successes} published successfully. ${failures} failed.`,
            "error",
          );
          setSelectedArticles(failedIds);
        }
      } else if (actionArticleId) {
        console.log("Calling publishArticle with ID:", actionArticleId);
        try {
          const result = await publishArticle(actionArticleId);
          console.log("Publish result:", result);
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
      console.log("=== PUBLISH FLOW END ===");
    } catch (error) {
      console.error("=== PUBLISH ERROR ===");
      console.error("Error publishing:", error);
      console.error("Error details:", error.message, error.stack);
      showToast("An unexpected error occurred during publishing", "error");
    }
  };

  const canPublish =
    currentPublication?.isOwner ||
    currentPublication?.role === "admin" ||
    currentPublication?.role === "editor";

  const actionButtons = [
    ...(canPublish
      ? [
          {
            title: "Publish",
            icon: "/images/icons/share.svg",
            onClick: handleBulkPublish,
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
        title="Publish article?"
        message={
          isBulkAction
            ? `${selectedArticles.length} article(s) will be published`
            : "This article will be published"
        }
        confirmText="Publish"
        confirmStyle="normal"
      />
    </>
  );
}
