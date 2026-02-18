"use client";

import { useState, useEffect } from "react";
import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import Verify from "@/components/features/verify/Verify";
import PersonalArticles from "@/components/features/personalArticles/personalArticles";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";

import { useSession } from "@/lib/auth-client";

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
    if (isAdmin && currentPublication?.id) {
      loadPublicationArticles(currentPublication.id, "unpublished");
    } else {
      loadUserArticles(currentPublication?.id, false, "unpublished");
    }
  }, [
    isAdmin,
    currentPublication?.id,
    loadPublicationArticles,
    loadUserArticles,
  ]);

  // Filter unpublished articles (api already filters for pubArticles, but safety check)
  const unpublishedArticles = displayArticles
    .filter((article) => article.status === "unpublished")
    .map((article) => {
      return {
        ...article,
        canDelete: true, // No delete restriction for unpublished articles
        onRepublish: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowRepublishModal(true);
        },
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
      console.error("Error republishing articles:", error);
    }
  };

  const confirmDraft = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await moveToDraft(articleId);
        }
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToDraft(actionArticleId);
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving articles to draft:", error);
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
        }

        for (const articleId of articlesToDelete) {
          await moveToTrashStatus(articleId);
        }
        setSelectedArticles([]);
      } else {
        await moveToTrashStatus(actionArticleId);
      }
      setShowTrashModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error("Error moving articles to trash:", error);
    }
  };

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-pulse">
          <div className="text-gray-500">Loading unpublished articles...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
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
      icon: "/images/icons/draft1.svg",
      title: "Move to Draft",
      onClick: handleBulkDraft,
    },
    {
      icon: "/images/icons/publish.svg",
      title: "Republish",
      onClick: handleBulkRepublish,
    },
    {
      icon: "/images/icons/trash2.svg",
      title: "Delete",
      onClick: handleBulkDelete,
    },
  ];

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
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
