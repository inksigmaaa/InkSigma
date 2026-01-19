"use client"

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import EditorSidebar from "../components/sidebar/EditorSidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import ConfirmModal from "../components/confirmModal/ConfirmModal";
import PageTransition from "@/components/PageTransition";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";

export default function Published() {
    const { 
        articles, 
        publicationArticles, 
        loading, 
        pubArticlesLoading,
        error, 
        moveToTrashStatus, 
        bulkMoveToTrashStatus, 
        moveToDraft, 
        unpublishArticle, 
        loadUserArticles,
        loadPublicationArticles
    } = useArticles();
    
    const { currentPublication, getCurrentUserRole } = usePublication();
    const searchParams = useSearchParams();
    const router = useRouter();
    const hasLoadedRef = useRef(false);
    const loadedContextRef = useRef(null); // 'user' or 'publication'

    // Determine user role and which articles to show
    const userRole = getCurrentUserRole();
    const isAdmin = userRole === 'admin' || userRole === 'editor' || currentPublication?.isOwner;
    
    // Use publicationArticles for admins/editors, otherwise use user articles
    // Note: for published page, we might ideally want to use same data source
    const displayArticles = (isAdmin && currentPublication) ? publicationArticles : articles;
    const isLoading = (isAdmin && currentPublication) ? pubArticlesLoading : loading;

    // Load appropriate articles
    useEffect(() => {
        const needsRefresh = searchParams.get('refresh') === 'true';
        
        // Target context based on current state
        const targetContext = (isAdmin && currentPublication?.id) ? 'publication' : 'user';

        // Helper to check if we need to load
        // Re-load if:
        // 1. Refresh requested
        // 2. Data is empty AND not loading AND (not loaded OR loaded wrong context)
        // 3. Context changed (e.g. from user to publication) - critical for switching to admin view
        const isWrongContext = hasLoadedRef.current && loadedContextRef.current !== targetContext;
        
        const shouldLoad = needsRefresh || 
                          (displayArticles.length === 0 && !isLoading && !hasLoadedRef.current) ||
                          isWrongContext;

        if (shouldLoad) {
            console.log(`[PublishedPage] Loading articles... Target: ${targetContext}, Prev: ${loadedContextRef.current}`);
            hasLoadedRef.current = true;
            loadedContextRef.current = targetContext;
            
            if (targetContext === 'publication') {
                loadPublicationArticles(currentPublication.id, 'published');
            } else {
                loadUserArticles();
            }
        }
    }, [searchParams, displayArticles.length, isLoading, loadUserArticles, loadPublicationArticles, isAdmin, currentPublication?.id]);

    // Clean up refresh param from URL if present
    useEffect(() => {
        if (searchParams.get('refresh') === 'true') {
            router.replace('/published', { scroll: false });
        }
    }, [searchParams, router]);
    const [selectedArticles, setSelectedArticles] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [actionArticleId, setActionArticleId] = useState(null);
    const [isBulkAction, setIsBulkAction] = useState(false);

    // Debug logging
    console.log('[PublishedPage] Display articles count:', displayArticles?.length);
    console.log('[PublishedPage] Loading state:', isLoading);

    const publishedArticles = displayArticles
        .filter(article => {
            const isPublished = article.status === 'published';
            console.log('[PublishedPage] Article:', article.id, 'title:', article.title, 'status:', article.status, 'isPublished:', isPublished);
            return isPublished;
        })
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
            },
            onUnpublish: () => {
                setActionArticleId(article.id);
                setIsBulkAction(false);
                setShowUnpublishModal(true);
            }
        }));

    console.log('[PublishedPage] Filtered published articles count:', publishedArticles.length);

    const handleArticleSelect = (id, isSelected) => {
        setSelectedArticles(prev =>
            isSelected
                ? [...prev, id]
                : prev.filter(articleId => articleId !== id)
        );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedArticles(publishedArticles.map(article => article.id));
        } else {
            setSelectedArticles([]);
        }
    };

    const handleCopy = () => {
        console.log("Copy articles:", selectedArticles);
    };

    const handleBulkDraft = () => {
        if (selectedArticles.length === 0) return;
        setIsBulkAction(true);
        setShowDraftModal(true);
    };

    const handleBulkDelete = () => {
        if (selectedArticles.length === 0) return;
        setIsBulkAction(true);
        setShowDeleteModal(true);
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
            console.error('Error moving article to trash:', error);
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
            console.error('Error moving article to draft:', error);
        }
    };

    const confirmUnpublish = async () => {
        try {
            if (actionArticleId) {
                await unpublishArticle(actionArticleId);
            }
            setShowUnpublishModal(false);
            setActionArticleId(null);
        } catch (error) {
            console.error('Error unpublishing article:', error);
        }
    };

    // Only show loading state if we're loading AND have no articles yet
    if (loading && articles.length === 0) {
        return (
            <>
          
                <NavbarLoggedin />
                {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
                <Verify />
                <div className="flex justify-center items-center min-h-[400px] animate-pulse">
                    <div className="text-gray-500">Loading published articles...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <NavbarLoggedin />
                {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
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
            disabled: !hasSelectedArticles
        },
        {
            icon: "/images/icons/trash2.svg",
            title: "Delete",
            onClick: handleBulkDelete,
            disabled: !hasSelectedArticles
        },
    ];

    return (
        <>
            <NavbarLoggedin />
            {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
            <Verify />
            <PageTransition>
                <PersonalArticles
                    title="Published"
                    titleColor="#267F24"
                    articles={publishedArticles}
                    emptyMessage="No published articles yet"
                    showSelectAll={true}
                    showActions={true}
                    actionButtons={actionButtons}
                    selectedArticles={selectedArticles}
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
                title="Are you sure you want to put it in trash?"
                message="This will be put into trash and can be restored later"
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
                message={isBulkAction ? `${selectedArticles.length} article(s) will be moved to drafts` : "This article will be moved to drafts"}
                confirmText="Move to Draft"
                confirmStyle="normal"
            />

            <ConfirmModal
                isOpen={showUnpublishModal}
                onClose={() => {
                    setShowUnpublishModal(false);
                    setActionArticleId(null);
                }}
                onConfirm={confirmUnpublish}
                title="Unpublish this article?"
                message="This article will be unpublished and moved to unpublished section"
                confirmText="Unpublish"
                confirmStyle="normal"
            />
        </>
    );
}
