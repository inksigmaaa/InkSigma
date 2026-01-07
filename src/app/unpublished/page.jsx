"use client"

import { useState } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import ConfirmModal from "../components/confirmModal/ConfirmModal";
import { useArticles } from "@/contexts/ArticlesContext";

export default function Unpublished() {
  const { articles, loading, error, publishArticle, moveToDraft } = useArticles();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showRepublishModal, setShowRepublishModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isBulkAction, setIsBulkAction] = useState(false);

  const unpublishedArticles = articles.filter(article => article.status === 'unpublished');

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
      for (const articleId of selectedArticles) {
        await moveToDraft(articleId);
      }
      setSelectedArticles([]);
      setShowDraftModal(false);
    } catch (error) {
      console.error('Error moving articles to draft:', error);
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
        onClose={() => setShowRepublishModal(false)}
        onConfirm={confirmRepublish}
        title="Republish articles?"
        message={`${selectedArticles.length} article(s) will be republished`}
        confirmText="Republish"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        onConfirm={confirmDraft}
        title="Move to Draft?"
        message={`${selectedArticles.length} article(s) will be moved to drafts`}
        confirmText="Move to Draft"
        confirmStyle="normal"
      />
    </>
  )
}
