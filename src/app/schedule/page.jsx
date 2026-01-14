"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import ConfirmModal from "../components/confirmModal/ConfirmModal";
import { useArticles } from "@/contexts/ArticlesContext";

export default function SchedulePage() {
  const { articles, loading, error, loadUserArticles, moveToTrashStatus, bulkMoveToTrashStatus, moveToDraft, bulkMoveToDraft } = useArticles();
  const searchParams = useSearchParams();
  const router = useRouter();
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

  // Refresh articles when coming from editor with refresh param
  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      loadUserArticlesRef.current();
      // Clean up the URL
      router.replace('/schedule', { scroll: false });
    }
  }, [searchParams, router]);

  // Refresh articles only once when component mounts
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      console.log('[SchedulePage] Loading articles on mount...');
      loadUserArticlesRef.current();
    }
  }, []);

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

  // Smart refresh: set a single timer for the next scheduled article to publish
  useEffect(() => {
    if (scheduledArticles.length === 0) return;

    const now = new Date();
    
    // Find the next article that will be published
    const upcomingArticles = scheduledArticles
      .filter(article => article.scheduledAt)
      .map(article => ({
        id: article.id,
        title: article.title,
        scheduledTime: new Date(article.scheduledAt)
      }))
      .filter(article => article.scheduledTime > now)
      .sort((a, b) => a.scheduledTime - b.scheduledTime);

    if (upcomingArticles.length === 0) return;

    const nextArticle = upcomingArticles[0];
    const timeUntilPublish = nextArticle.scheduledTime.getTime() - now.getTime();

    // Set a timer to refresh after the scheduled time + 2 seconds buffer
    const timer = setTimeout(() => {
      console.log(`[SCHEDULE] Article "${nextArticle.title}" should be published now, refreshing...`);
      loadUserArticlesRef.current();
    }, timeUntilPublish + 2000);

    console.log(`[SCHEDULE] Next publish: "${nextArticle.title}" in ${Math.round(timeUntilPublish / 1000)}s`);

    return () => clearTimeout(timer);
  }, [scheduledArticles]);

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

  // Only show loading state if we're loading AND have no articles yet
  if (loading && articles.length === 0) {
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
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
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