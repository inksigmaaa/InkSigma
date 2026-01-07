"use client"

import { useState, useEffect, useRef } from 'react'
import ArticleContainer from '../articleContainer/ArticleContainer'
import ConfirmModal from '../confirmModal/ConfirmModal'
import { useArticles } from '@/contexts/ArticlesContext'

const categories = [
    "Agriculture", "Art & Illustration", "Business", "Climate & Environment",
    "Comics and Anime", "Crypto & Web-3", "Design", "Education",
    "Entertainment", "Faith & Spiritual", "Fashion & Beauty", "Fiction",
    "Finance & Economics", "Food & Drink", "Games", "Health & Wellness",
    "History", "Humor", "Law", "Literature", "Marketing", "Music",
    "News", "NSFW", "Parenting & Family", "Philosophy", "Poetry",
    "Politics", "Psychology", "Relationships", "Romance", "Science",
    "Space", "Sports", "Startups & Companies", "Technology", "Travel"
]

export default function Articles(props) {
    const { articles, loading, error, moveToTrashStatus, bulkMoveToTrashStatus } = useArticles()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategories, setSelectedCategories] = useState([])
    const [selectAll, setSelectAll] = useState(false)
    const [selectedArticles, setSelectedArticles] = useState(new Set())
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteArticleId, setDeleteArticleId] = useState(null)
    const [isBulkAction, setIsBulkAction] = useState(false)
    const mobileDropdownRef = useRef(null)
    const desktopDropdownRef = useRef(null)

    const filterStatus = props.filterStatus || null
    const showCreateButton = props.showCreateButton !== false

    // Get real articles from context, excluding trash
    const allArticles = articles.filter(article => article.status !== 'trash')
    
    // Filter by status if specified
    const filteredArticles = filterStatus 
        ? allArticles.filter(article => article.status === filterStatus)
        : allArticles

    const articleIds = filteredArticles.map(article => article.id)

    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedArticles(new Set())
            setSelectAll(false)
        } else {
            setSelectedArticles(new Set(articleIds))
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

    const handleDeleteArticle = (articleId) => {
        setDeleteArticleId(articleId)
        setIsBulkAction(false)
        setShowDeleteModal(true)
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
                await moveToTrashStatus(deleteArticleId)
            }
            setShowDeleteModal(false)
            setDeleteArticleId(null)
        } catch (error) {
            console.error('Error moving articles to trash:', error)
        }
    }

    useEffect(() => {
        const allSelected = articleIds.length > 0 && articleIds.every(id => selectedArticles.has(id))
        setSelectAll(allSelected)
    }, [selectedArticles, articleIds.length])

    const hasSelectedArticles = selectedArticles.size > 0

    useEffect(() => {
        const handleClickOutside = (event) => {
            const mobileDropdown = mobileDropdownRef.current
            const desktopDropdown = desktopDropdownRef.current
            if (mobileDropdown && mobileDropdown.contains(event.target)) return
            if (desktopDropdown && desktopDropdown.contains(event.target)) return
            setIsDropdownOpen(false)
        }
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isDropdownOpen])

    const topPosition = 'top-[160px]'
    const mobileTopPosition = 'max-md:top-[120px]'

    if (loading) {
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
                        <div className="relative" ref={mobileDropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center justify-between bg-white border hover:bg-gray-50" style={{ minWidth: '163px', height: '32px', borderRadius: '4px', borderWidth: '1px', gap: '10px', padding: '6px 16px' }}>
                                <span style={{ fontFamily: 'Public Sans', fontWeight: 400, fontSize: '14px', color: '#6B7280' }}>Category</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#9CA3AF', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex flex-col gap-4">
                    <div className="flex items-center">
                        <h1 className="m-0 font-bold text-base leading-6 text-gray-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                            {props.title || "All Articles"}
                        </h1>
                    </div>
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer w-[123px] h-8 bg-[#F8F8F8] rounded px-3 py-2">
                                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="cursor-pointer accent-violet-500" style={{ width: '16px', height: '16px' }} />
                                <span className="font-bold text-base leading-6 text-gray-500">Select all</span>
                            </label>
                            <button title="Copy" disabled={!hasSelectedArticles} className={`w-8 h-8 border rounded-lg p-2 flex items-center justify-center transition ${hasSelectedArticles ? "bg-white border-gray-200 cursor-pointer hover:bg-gray-50" : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"}`}>
                                <img src="/images/icons/draft1.svg" alt="Copy" className={`w-5 h-5 ${!hasSelectedArticles ? "opacity-50" : ""}`} />
                            </button>
                            <button title="Send" disabled={!hasSelectedArticles} className={`w-8 h-8 border rounded-lg p-2 flex items-center justify-center transition ${hasSelectedArticles ? "bg-white border-gray-200 cursor-pointer hover:bg-gray-50" : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"}`}>
                                <img src="/images/icons/share.svg" alt="Send" className={`w-5 h-5 ${!hasSelectedArticles ? "opacity-50" : ""}`} />
                            </button>
                            <button title="Delete" disabled={!hasSelectedArticles} onClick={handleBulkDelete} className={`w-8 h-8 border rounded-lg p-2 flex items-center justify-center transition ${hasSelectedArticles ? "bg-white border-gray-200 cursor-pointer hover:bg-gray-50" : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"}`}>
                                <img src="/images/icons/trash2.svg" alt="Delete" className={`w-5 h-5 ${!hasSelectedArticles ? "opacity-50" : ""}`} />
                            </button>
                        </div>
                        <div className="relative" ref={desktopDropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center justify-between bg-white border hover:bg-gray-50" style={{ minWidth: '163px', height: '32px', borderRadius: '4px', borderWidth: '1px', gap: '10px', padding: '6px 16px' }}>
                                <span style={{ fontFamily: 'Public Sans', fontWeight: 400, fontSize: '14px', color: '#6B7280' }}>Choose Category</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#9CA3AF', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-4 pb-[85px]">
                    {filteredArticles.length === 0 ? (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <div className="text-gray-500">No articles found</div>
                        </div>
                    ) : (
                        filteredArticles.map(article => (
                            <ArticleContainer
                                key={article.id}
                                id={article.id}
                                status={article.status}
                                title={article.title}
                                description={article.description}
                                categories={article.categories || []}
                                postedTime={article.postedTime}
                                isSelected={selectedArticles.has(article.id)}
                                onSelect={handleArticleSelect}
                                onDelete={() => handleDeleteArticle(article.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            <ConfirmModal 
                isOpen={showDeleteModal} 
                onClose={() => { 
                    setShowDeleteModal(false); 
                    setDeleteArticleId(null) 
                }} 
                onConfirm={confirmDelete} 
                title="Are you sure you want to put it in trash?" 
                message={isBulkAction 
                    ? `${selectedArticles.size} article(s) will be put into trash and can be restored later`
                    : "This will be put into trash and can be restored later"
                } 
                confirmText="Move to Trash" 
                confirmStyle="danger" 
            />
        </div>
    )
}
