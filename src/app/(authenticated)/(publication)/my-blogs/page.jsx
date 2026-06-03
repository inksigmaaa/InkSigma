"use client";

import { useState, useMemo, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { toast } from "sonner";
import { useArticleSelection } from "@/hooks/useArticleSelection";
import {
  DEFAULT_DRAFT_TITLE,
  isArticlePublishable,
  isMissingRealTitle,
} from "@/utils/articlePublishability";

export default function MyBlogsPage() {
  const {
    articles,
    moveToTrash, // Destructure persistent delete function
    moveToTrashStatus,

    moveToDraft,
    unpublishArticle,
    publishArticle,
    loadUserArticles,
    createDraftFromPublished,
  } = useArticles();
  const { currentPublication } = usePublication();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [showRepublishModal, setShowRepublishModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const currentPublicationId = currentPublication?.id;

  // Load articles filtered by current publication when page mounts or publication changes
  useEffect(() => {
    if (!currentPublicationId) return;
    loadUserArticles(currentPublicationId);
  }, [loadUserArticles, currentPublicationId]);

  const myArticles = useMemo(() => {
    let filtered = currentPublicationId
      ? articles.filter(
          (article) =>
            String(article.publicationId) === String(currentPublicationId),
        )
      : [];

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = articles.filter((article) =>
        article.categories?.some((cat) => selectedCategories.includes(cat)),
      );
    }

    return filtered.map((article) => {
      const hasRealTitle = !isMissingRealTitle(article.title);
      const canPublishArticle = isArticlePublishable(article);
      const displayTitle =
        article.status === "draft" && !hasRealTitle
          ? DEFAULT_DRAFT_TITLE
          : article.title;

      return {
        ...article,
        title: displayTitle,
        canPublishArticle,
        onDelete: () => {
          setIsBulkAction(false);
          setActionArticleId(article.id);
          setShowDeleteModal(true);
        },
        onPublish:
          article.status === "draft" && !canPublishArticle
            ? undefined
            : () => {
                setIsBulkAction(false);
                setActionArticleId(article.id);
                setShowPublishModal(true);
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
            toast.success("Article restored to drafts");
          } catch (error) {
            console.error("Error restoring article:", error);
            toast.error("Failed to restore article");
          }
        },
      };
    });
  }, [articles, currentPublicationId, moveToDraft, selectedCategories]);

  const {
    selectedArticles,
    setSelectedArticles,
    handleSelectAll,
    handleArticleSelect,
  } = useArticleSelection(myArticles.map((article) => article.id));

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
        toast.success(`${selectedArticles.length} article(s) moved successfully`);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        const article = myArticles.find((a) => a.id === actionArticleId);
        // If already in trash, delete permanently
        if (article?.status === "trash") {
          await moveToTrash(actionArticleId);
          toast.success("Article deleted permanently");
        } else {
          // Otherwise move to trash
          await moveToTrashStatus(actionArticleId);
          toast.success("Article moved to trash");
        }
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Failed to delete article");
    }
  };

  const confirmDraft = async () => {
    try {
      if (actionArticleId) {
        const article = myArticles.find((a) => a.id === actionArticleId);
        if (article && article.status === "published") {
          await createDraftFromPublished(actionArticleId);
          toast.success("Draft created from published article");
        } else {
          await moveToDraft(actionArticleId);
          toast.success("Article moved to drafts");
        }
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving to draft:", error);
      toast.error("Failed to move article to drafts");
    }
  };

  const confirmUnpublish = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await unpublishArticle(articleId);
        }
        toast.success(`${selectedArticles.length} article(s) unpublished`);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await unpublishArticle(actionArticleId);
        toast.success("Article unpublished");
      }
      setShowUnpublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error unpublishing article:", error);
      toast.error("Failed to unpublish article");
    }
  };

  const confirmRepublish = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await publishArticle(articleId);
        }
        toast.success(`${selectedArticles.length} article(s) published`);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await publishArticle(actionArticleId);
        toast.success("Article published");
      }
      setShowRepublishModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error republishing article:", error);
      toast.error("Failed to publish article");
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

      <ConfirmModal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={async () => {
          try {
            if (actionArticleId) {
              await publishArticle(actionArticleId);
              toast.success("Article published");
            }
            setShowPublishModal(false);
            setActionArticleId(null);
          } catch (error) {
            console.error("Error publishing article:", error);
            toast.error("Failed to publish article");
          }
        }}
        title="Publish article?"
        message="This article will be published"
        confirmText="Publish"
        confirmStyle="normal"
      />
    </AuthGuard>
  );
}
