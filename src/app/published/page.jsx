"use client"

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import ConfirmModal from "../components/confirmModal/ConfirmModal";
import { useArticles } from "@/contexts/ArticlesContext";

export default function Published() {
    const { articles, loading, error, moveToTrashStatus, bulkMoveToTrashStatus, moveToDraft, unpublishArticle, loadUserArticles } = useArticles();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Refresh articles when coming from editor with refresh param
    useEffect(() => {
        if (searchParams.get('refresh') === 'true') {
            loadUserArticles();
            // Clean up the URL
            router.replace('/published', { scroll: false });
        }
    }, [searchParams, loadUserArticles, router]);
    const [selectedArticles, setSelectedArticles] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [actionArticleId, setActionArticleId] = useState(null);
    const [isBulkAction, setIsBulkAction] = useState(false);

    const publishedArticles = articles
        .filter(article => article.status === 'published')
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

    if (loading) {
        return (
            <>
                <NavbarLoggedin />
                <Sidebar />
                <Verify />
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-gray-500">Loading published articles...</div>
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
            icon: "/images/icons/trash2.svg", 
            title: "Delete", 
            onClick: handleBulkDelete,
            disabled: !hasSelectedArticles 
        },
    ];

    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
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
