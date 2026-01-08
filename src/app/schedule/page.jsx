"use client"

import { useState, useMemo, useEffect } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import ConfirmModal from "../components/confirmModal/ConfirmModal";
import { useArticles } from "@/contexts/ArticlesContext";

export default function SchedulePage() {
  const { articles, loading, error, loadUserArticles, moveToTrashStatus, bulkMoveToTrashStatus, moveToDraft, bulkMoveToDraft } = useArticles();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [actionArticleId, setActionArticleId] = useState(null);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh articles when component mounts to ensure we have the latest data
  useEffect(() => {
    loadUserArticles();
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserArticles();
    } catch (error) {
      console.error('Error refreshing articles:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter scheduled articles and add action handlers
  const scheduledArticles = useMemo(() => {
    return articles
      .filter(article => article.status === 'scheduled')
      .map(article => ({
        ...article,
        onDelete: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowDeleteModal(true);
        },
        onDraft: () => {
          setActionArticleId(article.id);
          setIsBulkAction(false);
          setShowDraftModal(true);
        }
      }));
  }, [articles]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(scheduledArticles.map(a => a.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, id]);
    } else {
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedArticles.length > 0) {
      setIsBulkAction(true);
      setShowDeleteModal(true);
    }
  };

  const handleBulkDraft = () => {
    if (selectedArticles.length > 0) {
      setIsBulkAction(true);
      setShowDraftModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      if (isBulkAction) {
        await bulkMoveToTrashStatus(selectedArticles);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToTrashStatus(actionArticleId);
      }
      setShowDeleteModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error('Error moving to trash:', error);
    }
  };

  const confirmDraft = async () => {
    try {
      if (isBulkAction) {
        await bulkMoveToDraft(selectedArticles);
        setSelectedArticles([]);
      } else if (actionArticleId) {
        await moveToDraft(actionArticleId);
      }
      setShowDraftModal(false);
      setActionArticleId(null);
    } catch (error) {
      console.error('Error moving to draft:', error);
    }
  };

  const actionButtons = [
    {
      title: "Refresh",
      icon: "/images/icons/refresh.svg",
      onClick: handleRefresh,
      disabled: isRefreshing || loading
    },
    {
      title: "Move to Draft",
      icon: "/images/icons/edit.svg",
      onClick: handleBulkDraft,
      disabled: selectedArticles.length === 0
    },
    {
      title: "Delete",
      icon: "/images/icons/trash2.svg",
      onClick: handleBulkDelete,
      disabled: selectedArticles.length === 0
    }
  ];

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">Loading scheduled articles...</div>
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

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PersonalArticles
        title="Scheduled"
        titleColor="#0048B5"
        articles={scheduledArticles}
        emptyMessage="No scheduled articles yet"
        showSelectAll={true}
        showActions={true}
        actionButtons={actionButtons}
        selectedArticles={selectedArticles}
        onSelectAll={handleSelectAll}
        onArticleSelect={handleArticleSelect}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message={isBulkAction ? `${selectedArticles.length} scheduled article(s) will be moved to trash` : "This scheduled article will be moved to trash"}
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false);
          setActionArticleId(null);
        }}
        onConfirm={confirmDraft}
        title="Move to Draft?"
        message={isBulkAction ? `${selectedArticles.length} scheduled article(s) will be moved to drafts` : "This scheduled article will be moved to drafts"}
        confirmText="Move to Draft"
        confirmStyle="normal"
      />
    </>
  );
}