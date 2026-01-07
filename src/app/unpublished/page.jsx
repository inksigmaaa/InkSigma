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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);

  const unpublishedArticles = articles.filter(article => article.status === 'unpublished');

  // Add handlers to articles
  const articlesWithHandlers = unpublishedArticles.map(article => ({
    ...article,
    onDraft: () => handleIndividualDraft(article.id),
    onDelete: () => handleIndividualDelete(article.id)
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
    setActionArticleId(null);
    setShowDraftModal(true);
  };

  const handleIndividualDraft = (id) => {
    setIsBulkAction(false);
    setActionArticleId(id);
    setShowDraftModal(true);
  };

  const handleIndividualDelete = (id) => {
    setIsBulkAction(false);
    setActionArticleId(id);
    setShowDeleteModal(true);
  };

  const confirmRepublish = async () => {
    try {
      for (const articleId of selectedArticles) {
        await publishArticle(articleId);
      }
      setSelectedArticles([]);
      setShowRepublishModal(false);
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
      } else {
        await moveToDraft(actionArticleId);
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error('Error moving articles to draft:', error);
    }
  };

  const confirmDelete = async () => {
    try {
      if (isBulkAction) {
        for (const articleId of selectedArticles) {
          await moveToTrashStatus(articleId);
        }
        setSelectedArticles([]);
      } else {
        await moveToTrashStatus(actionArticleId);
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error('Error moving articles to trash:', error);
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
      title: "Copy",
      onClick: handleCopy,
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
      title: "Move to Draft",
      onClick: handleBulkDraft,
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
        articles={articlesWithHandlers}
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
        onClose={() => setShowRepublishModal(false)}
        onConfirm={confirmRepublish}
        title="Republish articles?"
        message={`${selectedArticles.length} article(s) will be republished`}
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
        message={isBulkAction 
          ? `${selectedArticles.length} article(s) will be moved to drafts`
          : "This article will be moved to drafts"
        }
        confirmText="Move to Draft"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message={isBulkAction 
          ? `${selectedArticles.length} article(s) will be put into trash and can be restored later`
          : "This will be put into trash and can be restored later"
        }
        confirmText="Move to Trash"
        confirmStyle="danger"
      />
    </>
  )
}
