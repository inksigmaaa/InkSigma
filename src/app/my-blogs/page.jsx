"use client";

import { useState, useMemo, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";

export default function MyBlogsPage() {
  const {
    articles,
    moveToTrash, // Destructure persistent delete function
    moveToTrashStatus,

    moveToDraft,
    unpublishArticle,
    loadUserArticles,
    createDraftFromPublished,
  } = useArticles();
  const { currentPublication } = usePublication();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [showRepublishModal, setShowRepublishModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);

  // Load articles filtered by current publication when page mounts or publication changes
  useEffect(() => {
    loadUserArticles(currentPublication?.id);
  }, [loadUserArticles, currentPublication?.id]);

  const myArticles = useMemo(() => {
    let filtered = articles;

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = articles.filter((article) =>
        article.categories?.some((cat) => selectedCategories.includes(cat)),
      );
    }

    return filtered.map((article) => ({
      ...article,
      onDelete: () => {
        setIsBulkAction(false);
        setActionArticleId(article.id);
        setShowDeleteModal(true);
      },

      onDraft: () => {
        setIsBulkAction(false);
        setActionArticleId(article.id);
        setShowDraftModal(true);
      },
      onUnpublish: () => {
        setIsBulkAction(false);
        setActionArticleId(article.id);
        setShowUnpublishModal(true);
      },
      onRepublish: () => {
        setIsBulkAction(false);
        setActionArticleId(article.id);
        setShowRepublishModal(true);
      },
      onRestore: async () => {
        try {
          await moveToDraft(article.id);
        } catch (error) {
          console.error("Error restoring article:", error);
        }
      },
    }));
  }, [articles, moveToDraft, selectedCategories]);

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles((prev) => [...prev, id]);
    } else {
      setSelectedArticles((prev) =>
        prev.filter((articleId) => articleId !== id),
      );
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(myArticles.map((article) => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleBulkUnpublish = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowUnpublishModal(true);
  };

  const handleBulkRepublish = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowRepublishModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          const article = myArticles.find((a) => a.id === articleId);
          if (article?.status === "trash") {
            await moveToTrash(articleId);
          } else {
            await moveToTrashStatus(articleId);
          }
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        const article = myArticles.find((a) => a.id === actionArticleId);
        // If already in trash, delete permanently
        if (article?.status === "trash") {
          await moveToTrash(actionArticleId);
        } else {
          // Otherwise move to trash
          await moveToTrashStatus(actionArticleId);
        }
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  };

  const confirmDraft = async () => {
    try {
      if (actionArticleId) {
        const article = myArticles.find((a) => a.id === actionArticleId);
        if (article && article.status === "published") {
          await createDraftFromPublished(actionArticleId);
        } else {
          await moveToDraft(actionArticleId);
        }
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to draft:", error);
    }
  };

  const confirmUnpublish = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await unpublishArticle(articleId);
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await unpublishArticle(actionArticleId);
      }
      setShowUnpublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error unpublishing article:", error);
    }
  };

  const confirmRepublish = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await publishArticle(articleId);
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await publishArticle(actionArticleId);
      }
      setShowRepublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error republishing article:", error);
    }
  };

  const getDeleteModalProps = () => {
    const article = actionArticleId
      ? myArticles.find((a) => a.id === actionArticleId)
      : null;

    if (isBulkAction) {
      return {
        title: "Delete selected articles?",
        message:
          "Selected articles will be moved to trash or permanently deleted.",
        confirmText: "Delete",
        confirmStyle: "danger",
      };
    }

    const isTrash = article?.status === "trash";

    return {
      title: isTrash
        ? "Delete Permanently?"
        : "Are you sure you want to put it in trash?",
      message: isTrash
        ? "This will permanently delete this article and cannot be restored"
        : "This will be put into trash and can be restored later",
      confirmText: isTrash ? "Delete Permanently" : "Move to Trash",
      confirmStyle: "danger",
    };
  };

  const actionButtons = [
    {
      icon: "/images/icons/trash2.svg",
      title: "Delete",
      onClick: handleBulkDelete,
    },
  ];

  return (
    <AuthGuard>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PageTransition>
        <PersonalArticles
          title="My Blogs"
          titleColor="#F452E8"
          articles={myArticles}
          emptyMessage="No Articles yet"
          showSelectAll={true}
          showActions={true}
          showCategoryInTitle={true}
          actionButtons={actionButtons}
          selectedArticles={selectedArticles}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
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
        {...getDeleteModalProps()}
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDraft}
        title={
          isBulkAction
            ? "Move to Draft?"
            : actionArticleId &&
                myArticles.find((a) => a.id === actionArticleId)?.status ===
                  "published"
              ? "Create a Draft?"
              : "Move to Draft?"
        }
        message={
          isBulkAction
            ? `${selectedArticles.length} article(s) will be moved to drafts`
            : actionArticleId &&
                myArticles.find((a) => a.id === actionArticleId)?.status ===
                  "published"
              ? "A draft copy will be created. The original article will remain published."
              : "This article will be moved to drafts"
        }
        confirmText={
          isBulkAction
            ? "Move to Draft"
            : actionArticleId &&
                myArticles.find((a) => a.id === actionArticleId)?.status ===
                  "published"
              ? "Create Draft"
              : "Move to Draft"
        }
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showUnpublishModal}
        onClose={() => {
          setShowUnpublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmUnpublish}
        title={isBulkAction ? "Unpublish articles?" : "Unpublish this article?"}
        message={
          isBulkAction
            ? `${selectedArticles.length} article(s) will be unpublished`
            : "This article will be unpublished and moved to unpublished section"
        }
        confirmText="Unpublish"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showRepublishModal}
        onClose={() => {
          setShowRepublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmRepublish}
        title={isBulkAction ? "Republish articles?" : "Republish article?"}
        message={
          isBulkAction
            ? `${selectedArticles.length} article(s) will be republished`
            : "This article will be republished"
        }
        confirmText="Republish"
        confirmStyle="normal"
      />
    </AuthGuard>
  );
}
