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

  // Filter scheduled articles and add action handlers - MUST be defined before useEffects that use it
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

  // Refresh articles when component mounts to ensure we have the latest data
  useEffect(() => {
    loadUserArticles();
  }, []);

  // Auto-refresh to check for published scheduled articles
  useEffect(() => {
    // Check every 30 seconds for scheduled articles that should have been published
    const interval = setInterval(() => {
      loadUserArticles();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Smart auto-refresh: set timer for the next scheduled article
  useEffect(() => {
    if (scheduledArticles.length === 0) return;

    const now = new Date();
    
    // Find articles that are due to be published in the future
    const upcomingArticles = scheduledArticles
      .filter(article => article.scheduledAt)
      .map(article => ({
        id: article.id,
        scheduledTime: new Date(article.scheduledAt)
      }))
      .filter(article => article.scheduledTime > now)
      .sort((a, b) => a.scheduledTime - b.scheduledTime);

    // If no upcoming articles, don't set any timer (the 30-second interval will handle it)
    if (upcomingArticles.length === 0) return;

    // Set a timer for the next scheduled article
    const nextArticle = upcomingArticles[0];
    const timeUntilPublish = nextArticle.scheduledTime.getTime() - now.getTime();

    // If within 2 minutes, set a precise timer
    if (timeUntilPublish <= 120000 && timeUntilPublish > 0) {
      const timer = setTimeout(() => {
        // Refresh after the scheduled time + 3 seconds buffer for backend processing
        loadUserArticles();
      }, timeUntilPublish + 3000);

      return () => clearTimeout(timer);
    }
  }, [scheduledArticles.length]); // Only depend on length to avoid infinite loops

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