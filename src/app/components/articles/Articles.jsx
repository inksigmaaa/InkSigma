"use client"

import { useState, useEffect, useRef } from 'react'
import ArticleContainer from '../articleContainer/ArticleContainer'
import ConfirmModal from '../confirmModal/ConfirmModal'
import CategoryFilter from '../categoryFilter/CategoryFilter'
import { useArticles } from '@/contexts/ArticlesContext'

export default function Articles(props) {
    const { articles: contextArticles, loading, error, moveToTrashStatus, bulkMoveToTrashStatus, moveToDraft, publishArticle, unpublishArticle } = useArticles()
    const [selectedCategories, setSelectedCategories] = useState([])
    const [selectAll, setSelectAll] = useState(false)
    const [selectedArticles, setSelectedArticles] = useState(new Set())
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [showDraftModal, setShowDraftModal] = useState(false)
    const [showUnpublishModal, setShowUnpublishModal] = useState(false)
    const [actionArticleId, setActionArticleId] = useState(null)
    const [isBulkAction, setIsBulkAction] = useState(false)

    const filterStatus = props.filterStatus || null
    const showCreateButton = props.showCreateButton !== false

    // Use passed articles or context articles
    const sourceArticles = props.articles || contextArticles || []

    // Get real articles, excluding trash
    const allArticles = sourceArticles.filter(article => article.status !== 'trash')
    
    // Filter by status if specified
    const filteredArticles = filterStatus 
        ? allArticles.filter(article => article.status === filterStatus)
        : allArticles

    const articleIds = filteredArticles.map(article => article.id)

    const handleDeleteArticle = (articleId) => {
        setActionArticleId(articleId)
        setIsBulkAction(false)
        setShowDeleteModal(true)
    }

    const handlePublishArticle = (articleId) => {
        setActionArticleId(articleId)
        setIsBulkAction(false)
        setShowPublishModal(true)
    }

    const handleDraftArticle = (articleId) => {
        setActionArticleId(articleId)
        setIsBulkAction(false)
        setShowDraftModal(true)
    }

    const handleUnpublishArticle = (articleId) => {
        setActionArticleId(articleId)
        setIsBulkAction(false)
        setShowUnpublishModal(true)
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedArticles(new Set())
            setSelectAll(false)
        } else {
            const allArticles = sourceArticles.filter(article => article.status !== 'trash')
            const filteredArticles = filterStatus 
                ? allArticles.filter(article => article.status === filterStatus)
                : allArticles
            setSelectedArticles(new Set(filteredArticles.map(article => article.id)))
            setSelectAll(true)
        }
    }

    const handleArticleSelect = (articleId, isSelected) => {
        const newSelected = new Set(selectedArticles)
        if (isSelected) {
            newSelected.add(articleId)
        } else {
            newSelected.delete(articleId)
        }
        setSelectedArticles(newSelected)
    }

    const handleBulkDelete = () => {
        if (selectedArticles.size > 0) {
            setIsBulkAction(true)
            setShowDeleteModal(true)
        }
    }

    const confirmDelete = async () => {
        try {
            if (isBulkAction) {
                await bulkMoveToTrashStatus(Array.from(selectedArticles))
                setSelectedArticles(new Set())
            } else {
                await moveToTrashStatus(actionArticleId)
            }
            setShowDeleteModal(false)
            setActionArticleId(null)
        } catch (error) {
            console.error('Error moving articles to trash:', error)
        }
    }

    const confirmPublish = async () => {
        try {
            await publishArticle(actionArticleId)
            setShowPublishModal(false)
            setActionArticleId(null)
        } catch (error) {
            console.error('Error publishing article:', error)
        }
    }

    const confirmDraft = async () => {
        try {
            await moveToDraft(actionArticleId)
            setShowDraftModal(false)
            setActionArticleId(null)
        } catch (error) {
            console.error('Error moving to draft:', error)
        }
    }

    const confirmUnpublish = async () => {
        try {
            await unpublishArticle(actionArticleId)
            setShowUnpublishModal(false)
            setActionArticleId(null)
        } catch (error) {
            console.error('Error unpublishing article:', error)
        }
    }

    useEffect(() => {
        const allSelected = articleIds.length > 0 && articleIds.every(id => selectedArticles.has(id))
        setSelectAll(allSelected)
    }, [selectedArticles, articleIds.length])

    const topPosition = 'top-[160px]'
    const mobileTopPosition = 'max-md:top-[120px]'
    const isLoading = props.loading !== undefined ? props.loading : loading

    if (isLoading) {
        return (
            <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
                <div className="ml-0 md:ml-[185px]">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="text-gray-500">Loading articles...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
                <div className="ml-0 md:ml-[185px]">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="text-red-500">Error: {error}</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
                <div className="ml-0 md:ml-[185px]">
                    <div className="flex flex-col justify-between gap-4 mb-6 px-2 md:hidden max-md:mt-3">
                        <h1 className="font-bold text-lg leading-8 text-gray-800 m-0 flex items-center gap-3">
                            <span className="w-3 h-3 bg-violet-500 rounded-full shrink-0"></span>
                            {props.title || "All Articles"}
                        </h1>
                        <div className="flex items-center justify-between gap-4 max-[410px]:gap-2">
                            {showCreateButton && (
                                <button className="font-semibold text-base leading-6 text-white bg-black rounded-lg px-6 py-3 whitespace-nowrap transition-colors hover:bg-gray-800 active:bg-gray-900 max-[410px]:text-sm max-[410px]:px-4 max-[410px]:py-2.5 max-[360px]:text-xs max-[360px]:px-3 max-[360px]:py-2">
                                    + Create Article
                                </button>
                            )}
                            <CategoryFilter 
                                selectedCategories={selectedCategories}
                                onCategoriesChange={setSelectedCategories}
                                buttonText="Category"
                            />
                        </div>
                    </div>

                    <div className="hidden md:flex flex-col gap-4">
                        <div className="flex items-center">
                            <h1 className="m-0 font-bold text-base leading-6 text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                                {props.title || "All Articles"}
                            </h1>
                        </div>
                        <div className="flex items-center justify-end gap-5">
                            <CategoryFilter 
                                selectedCategories={selectedCategories}
                                onCategoriesChange={setSelectedCategories}
                                buttonText="Choose Category"
                            />
                        </div>
                    </div>

                <div className="mt-6 space-y-4 pb-[85px]">
                    {filteredArticles.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                            <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">No articles found</p>
                        </div>
                    ) : (
                        filteredArticles.map(article => {
                            // Create stats array with mock data for now
                            
                            return (
                                <ArticleContainer
                                    key={article.id}
                                    id={article.id}
                                    status={article.status}
                                    title={article.title}
                                    description={article.description}
                                    categories={article.categories || []}
                                    postedTime={article.postedTime}
                                    image={article.image}
                                    isSelected={selectedArticles.has(article.id)}
                                    onSelect={handleArticleSelect}
                                    onDelete={() => handleDeleteArticle(article.id)}
                                    onDraft={() => handleDraftArticle(article.id)}
                                    onPublish={() => handlePublishArticle(article.id)}
                                    onUnpublish={() => handleUnpublishArticle(article.id)}
                                    // stats prop removed to hide stats button as requested
                                />
                            )
                        })
                    )}
                </div>
            </div>
        </div>

            <ConfirmModal 
                isOpen={showDeleteModal} 
                onClose={() => { setShowDeleteModal(false); setActionArticleId(null) }} 
                onConfirm={confirmDelete} 
                title="Are you sure you want to put it in trash?" 
                message={isBulkAction 
                    ? `${selectedArticles.size} article(s) will be put into trash and can be restored later`
                    : "This will be put into trash and can be restored later"
                } 
                confirmText="Move to Trash" 
                confirmStyle="danger" 
            />

            <ConfirmModal 
                isOpen={showPublishModal} 
                onClose={() => { setShowPublishModal(false); setActionArticleId(null) }} 
                onConfirm={confirmPublish} 
                title="Publish article?" 
                message="This article will be published" 
                confirmText="Publish" 
                confirmStyle="normal" 
            />

            <ConfirmModal 
                isOpen={showDraftModal} 
                onClose={() => { setShowDraftModal(false); setActionArticleId(null) }} 
                onConfirm={confirmDraft} 
                title="Move to Draft?" 
                message="This article will be moved to drafts" 
                confirmText="Move to Draft" 
                confirmStyle="normal" 
            />

            <ConfirmModal 
                isOpen={showUnpublishModal} 
                onClose={() => { setShowUnpublishModal(false); setActionArticleId(null) }} 
                onConfirm={confirmUnpublish} 
                title="Unpublish this article?" 
                message="This article will be unpublished and moved to unpublished section" 
                confirmText="Unpublish" 
                confirmStyle="normal" 
            />
        </>
    )
}