"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
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
  
  // Refs to prevent stale closures and unnecessary re-renders
  const loadUserArticlesRef = useRef(loadUserArticles);
  const hasMountedRef = useRef(false);
  
  // Update ref when loadUserArticles changes
  useEffect(() => {
    loadUserArticlesRef.current = loadUserArticles;
  }, [loadUserArticles]);

  // Filter scheduled articles - separate from action handlers to prevent re-renders
  const scheduledArticleIds = useMemo(() => {
    return articles
      .filter(article => article.status === 'scheduled')
      .map(article => article.id);
  }, [articles]);

  // Memoized action handlers
  const handleDeleteAction = useCallback((articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowDeleteModal(true);
  }, []);

  const handleDraftAction = useCallback((articleId) => {
    setActionArticleId(articleId);
    setIsBulkAction(false);
    setShowDraftModal(true);
  }, []);

  // Create scheduled articles with stable action handlers
  const scheduledArticles = useMemo(() => {
    return articles
      .filter(article => article.status === 'scheduled')
      .map(article => ({
        ...article,
        onDelete: () => handleDeleteAction(article.id),
        onDraft: () => handleDraftAction(article.id)
      }));
  }, [articles, handleDeleteAction, handleDraftAction]);

  // Refresh articles only once when component mounts
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      loadUserArticlesRef.current();
    }
  }, []);

  // Auto-refresh to check for published scheduled articles - only when there are scheduled articles
  useEffect(() => {
    // Only set up auto-refresh if there are scheduled articles
    if (scheduledArticleIds.length === 0) return;

    // Check every 30 seconds for scheduled articles that should have been published
    const interval = setInterval(() => {
      loadUserArticlesRef.current();
    }, 30000);

    return () => clearInterval(interval);
  }, [scheduledArticleIds.length]); // Depend on length to start/stop based on presence of articles

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
        loadUserArticlesRef.current();
      }, timeUntilPublish + 3000);

      return () => clearTimeout(timer);
    }
  }, [scheduledArticles.length]); // Only depend on length to avoid infinite loops

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadUserArticlesRef.current();
    } catch (error) {
      console.error('Error refreshing articles:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedArticles(scheduledArticleIds);
    } else {
      setSelectedArticles([]);
    }
  }, [scheduledArticleIds]);

  const handleArticleSelect = useCallback((id, checked) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, id]);
    } else {
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id));
    }
  }, []);

  const handleBulkDelete = useCallback(() => {
    setIsBulkAction(true);
    setShowDeleteModal(true);
  }, []);

  const handleBulkDraft = useCallback(() => {
    setIsBulkAction(true);
    setShowDraftModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
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
  }, [isBulkAction, selectedArticles, actionArticleId, bulkMoveToTrashStatus, moveToTrashStatus]);

  const confirmDraft = useCallback(async () => {
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
  }, [isBulkAction, selectedArticles, actionArticleId, bulkMoveToDraft, moveToDraft]);

  const actionButtons = useMemo(() => [
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
  ], [handleBulkDraft, handleBulkDelete, selectedArticles.length]);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setActionArticleId(null);
  }, []);

  const handleCloseDraftModal = useCallback(() => {
    setShowDraftModal(false);
    setActionArticleId(null);
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">Loading scheduled articles...</div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
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
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message={isBulkAction ? `${selectedArticles.length} scheduled article(s) will be moved to trash` : "This scheduled article will be moved to trash"}
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={handleCloseDraftModal}
        onConfirm={confirmDraft}
        title="Move to Draft?"
        message={isBulkAction ? `${selectedArticles.length} scheduled article(s) will be moved to drafts` : "This scheduled article will be moved to drafts"}
        confirmText="Move to Draft"
        confirmStyle="normal"
      />
    </AuthGuard>
  );
}