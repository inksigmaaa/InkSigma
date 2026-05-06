"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { toast } from "sonner";

export default function TrashPage() {
  const { currentPublication } = usePublication();
  const {
    articles,
    loading,
    error,
    moveToDraft,
    moveToTrash,
    bulkMoveToTrash,
    loadUserArticles,
  } = useArticles();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState(null);

  // Load articles filtered by current publication when page mounts or publication changes
  useEffect(() => {
    if (!currentPublication?.id) return;
    loadUserArticles(currentPublication.id, false, "trash");
  }, [loadUserArticles, currentPublication?.id]);

  // Filter trash articles
  const trashArticles = articles.filter((article) => {
    const isTrash = article.status === "trash";

    // If we are in a publication context, only show articles for that publication
    if (currentPublication?.id) {
      return (
        isTrash &&
        String(article.publicationId) === String(currentPublication.id)
      );
    }

    return false;
  });

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(trashArticles.map((a) => a.id));
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
      setDeleteArticleId(null);
      setShowDeleteModal(true);
    }
  };

  const handleBulkRestore = () => {
    if (selectedArticles.length > 0) {
      setShowRestoreModal(true);
    }
  };

  const handleIndividualDelete = (id) => {
    setDeleteArticleId(id);
    setShowDeleteModal(true);
  };

  const handleIndividualRestore = async (id) => {
    try {
      await moveToDraft(id);
      toast.success("Article restored to drafts");
    } catch (error) {
      console.error("Error restoring article:", error);
      toast.error("Failed to restore article");
    }
  };

  // Add handlers to articles
  const articlesWithHandlers = trashArticles.map((article) => {
    return {
      ...article,
      canDelete: true, // No delete restriction for trashed articles
      onDelete: (e) => {
        e?.stopPropagation();
        handleIndividualDelete(article.id);
      },
      onRestore: (e) => {
        e?.stopPropagation();
        handleIndividualRestore(article.id);
      },
    };
  });
  const confirmDelete = async () => {
    try {
      if (deleteArticleId) {
        // Single article permanent delete
        try {
          await moveToTrash(deleteArticleId);
          toast.success("Article deleted permanently");
        } catch (error) {
          toast.error("Failed to delete article");
          console.error(error);
        }
      } else {
        // Bulk permanent delete
        // Filter out articles that the user cannot delete
        const articlesToDelete = selectedArticles.filter((id) => {
          const article = articlesWithHandlers.find((a) => a.id === id);
          return article && article.canDelete;
        });

        if (articlesToDelete.length !== selectedArticles.length) {
          toast.error("Some articles could not be deleted due to permissions");
        }

        if (articlesToDelete.length > 0) {
          const results = await Promise.allSettled(
            articlesToDelete.map((id) => moveToTrash(id)),
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
            toast.success(`${successes} article(s) deleted permanently`);
            setSelectedArticles([]);
          } else {
            toast.error(`${successes} deleted. ${failures} failed.`);
            setSelectedArticles(failedIds);
          }
        } else {
          toast("No deletable articles selected.");
        }
      }

      setShowDeleteModal(false);
      setDeleteArticleId(null);
    } catch (error) {
      console.error("Error permanently deleting articles:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const confirmRestore = async () => {
    try {
      if (selectedArticles.length === 0) {
        toast("No articles selected for restore.");
        setShowRestoreModal(false);
        return;
      }

      // Restore selected articles to draft
      const results = await Promise.allSettled(
        selectedArticles.map((id) => moveToDraft(id)),
      );

      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;
      const failedIds = selectedArticles.filter(
        (_, index) => results[index].status === "rejected",
      );

      if (failures === 0) {
        toast.success(`${successes} article(s) restored to drafts`);
        setSelectedArticles([]);
      } else {
        toast.error(`${successes} restored. ${failures} failed.`);
        setSelectedArticles(failedIds);
      }

      setShowRestoreModal(false);
    } catch (error) {
      console.error("Error restoring articles:", error);
      toast.error("An unexpected error occurred during restore");
    }
  };

  if (loading && articles.length === 0) {
    return (
      <>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-pulse">
          <div className="text-gray-500">Loading trash articles...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
                        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-fadeIn">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </>
    );
  }

  const hasSelectedArticles = selectedArticles.length > 0;

  const actionButtons = [
    {
      title: "Restore",
      icon: "/images/icons/restore.svg",
      onClick: handleBulkRestore,
    },
    {
      title: "Delete",
      icon: "/images/icons/trash2.svg",
      onClick: handleBulkDelete,
    },
  ];

  return (
    <AuthGuard>
                  <Verify />
      <PageTransition>
        <PersonalArticles
          title="Trash"
          titleColor="#F13434"
          articles={articlesWithHandlers}
          emptyMessage="No trash articles yet"
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
          setDeleteArticleId(null);
          if (!deleteArticleId) setSelectedArticles([]);
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete permanently?"
        message="This will permanently delete this article and cannot be restored"
        confirmText="Delete permanently"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={confirmRestore}
        title="Are you sure you want to Restore?"
        confirmText="Restore"
        confirmStyle="normal"
      />
    </AuthGuard>
  );
}
