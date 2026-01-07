"use client"

import { useState } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import ConfirmModal from "../components/confirmModal/ConfirmModal";
import { useArticles } from "@/contexts/ArticlesContext";

export default function Unpublished() {
  const { articles, loading, error, publishArticle, moveToDraft, moveToTrashStatus } = useArticles();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showRepublishModal, setShowRepublishModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);

  // Filter unpublished articles and add individual action handlers
  const unpublishedArticles = articles
    .filter(article => article.status === 'unpublished')
    .map(article => ({
      ...article,
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
      }
    }));

  const handleArticleSelect = (id, isSelected) => {
    setSelectedArticles(prev =>
      isSelected
        ? [...prev, id]
        : prev.filter(articleId => articleId !== id)
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(unpublishedArticles.map(article => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleCopy = () => {
    console.log("Copy articles:", selectedArticles);
  };

  const handleBulkRepublish = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowRepublishModal(true);
  };

  const handleBulkDraft = () => {
    if (selectedArticles.length === 0) return;
    setIsBulkAction(true);
    setShowDraftModal(true);
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
      console.error('Error republishing articles:', error);
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
      console.error('Error moving articles to draft:', error);
    }
  };

  const confirmTrash = async () => {
    try {
      if (actionArticleId) {
        await moveToTrashStatus(actionArticleId);
      }
      setShowTrashModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error('Error moving article to trash:', error);
    }
  };

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
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
        <div className="flex justify-center items-center min-h-[400px]">
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
      disabled: !hasSelectedArticles
    },
    {
      icon: "/images/icons/publish.svg",
      title: "Republish",
      onClick: handleBulkRepublish,
      disabled: !hasSelectedArticles
    },
    {
      icon: "/images/icons/trash2.svg",
      title: "Delete",
      onClick: () => {}, // Add bulk delete handler if needed
      disabled: !hasSelectedArticles
    },
  ];

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PersonalArticles
        title="Unpublished"
        titleColor="#D97706"
        articles={unpublishedArticles}
        emptyMessage="No unpublished articles yet"
        showSelectAll={true}
        showActions={true}
        actionButtons={actionButtons}
        selectedArticles={selectedArticles}
        onSelectAll={handleSelectAll}
        onArticleSelect={handleArticleSelect}
      />

      <ConfirmModal
        isOpen={showRepublishModal}
        onClose={() => {
          setShowRepublishModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmRepublish}
        title="Republish article?"
        message={isBulkAction ? `${selectedArticles.length} article(s) will be republished` : "This article will be republished"}
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
        message={isBulkAction ? `${selectedArticles.length} article(s) will be moved to drafts` : "This article will be moved to drafts"}
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
        message="This will be put into trash and can be restored later"
        confirmText="Move to Trash"
        confirmStyle="danger"
      />
    </>
  )
}