"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock } from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import MemberSidebar from "../membersidebar/MemberSidebar"
import Verify from "../components/verify/Verify"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

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

export default function AuthorReviewPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedArticles, setSelectedArticles] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedArticleForAction, setSelectedArticleForAction] = useState(null)
  const [actionType, setActionType] = useState(null) // 'revert', 'accept', 'reject'
  const dropdownRef = useRef(null)
  
  const { 
    reviewArticles, 
    reviewLoading, 
    reviewError, 
    loadReviewArticles, 
    acceptReviewArticle, 
    rejectReviewArticle,
    revertReviewToDraft 
  } = useArticles()
  
  const { currentPublication, getCurrentUserRole } = usePublication()
  
  // Get user role in this publication
  const userRole = getCurrentUserRole()
  const isAuthor = userRole === 'author'
  const isEditor = userRole === 'editor'
  const isAdmin = userRole === 'admin' || currentPublication?.isOwner

  // Load review articles when publication changes
  useEffect(() => {
    if (currentPublication?.id) {
      loadReviewArticles(currentPublication.id)
    }
  }, [currentPublication?.id, loadReviewArticles])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter articles based on user role
  // - Author: sees only their own articles
  // - Editor: sees all author articles (not their own if they're author)
  // - Admin: handled in /review page, but if accessed here, show all
  const getFilteredArticles = () => {
    let articles = reviewArticles

    // Authors only see their own articles
    if (isAuthor) {
      articles = articles.filter(a => a.author?.id === session?.user?.id)
    }
    // Editors see all articles (including their own if submitted for review)
    // Admins should use /review page, but show all if they come here

    // Apply category filter
    if (selectedCategories.length > 0) {
      articles = articles.filter(article => 
        article.categories?.some(cat => selectedCategories.includes(cat))
      )
    }

    return articles
  }

  const filteredArticles = getFilteredArticles()

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSelectionChange = (articleId, isSelected) => {
    setSelectedArticles(prev => ({
      ...prev,
      [articleId]: isSelected
    }))
  }

  const handleRevertToDraft = (article) => {
    setSelectedArticleForAction(article)
    setActionType('revert')
    setShowConfirmModal(true)
  }

  const handleAccept = (article) => {
    setSelectedArticleForAction(article)
    setActionType('accept')
    setShowConfirmModal(true)
  }

  const handleReject = (article) => {
    setSelectedArticleForAction(article)
    setActionType('reject')
    setShowConfirmModal(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedArticleForAction) return

    try {
      if (actionType === 'revert') {
        await revertReviewToDraft(selectedArticleForAction.id)
        alert('Article reverted to draft successfully!')
      } else if (actionType === 'accept') {
        // Editor can only unpublish, not publish
        await acceptReviewArticle(selectedArticleForAction.id, 'unpublished')
        alert('Article accepted and stored to unpublished!')
      } else if (actionType === 'reject') {
        await rejectReviewArticle(selectedArticleForAction.id)
        alert('Article rejected and returned to author\'s draft.')
      }
      // Refresh the review articles list
      if (currentPublication?.id) {
        loadReviewArticles(currentPublication.id)
      }
    } catch (error) {
      console.error('Error performing action:', error)
      alert('Failed to perform action: ' + error.message)
    } finally {
      setShowConfirmModal(false)
      setSelectedArticleForAction(null)
      setActionType(null)
    }
  }

  const handleCloseModal = () => {
    setShowConfirmModal(false)
    setSelectedArticleForAction(null)
    setActionType(null)
  }

  const handleCardClick = (e, articleId) => {
    // Don't navigate if clicking on buttons or checkboxes
    if (e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.closest('[role="checkbox"]')) {
      return
    }
    router.push(`/editor?status=review&id=${articleId}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${days[date.getDay()]} | ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`
  }

  const getModalTitle = () => {
    if (actionType === 'revert') return 'Revert to Draft?'
    if (actionType === 'accept') return 'Accept Article?'
    if (actionType === 'reject') return 'Reject Article?'
    return ''
  }

  const getModalDescription = () => {
    if (actionType === 'revert') {
      return 'This action will move the article back to your drafts. You can edit and resubmit it later.'
    }
    if (actionType === 'accept') {
      return 'This article will be accepted and stored in the unpublished section. The publication admin can publish it later.'
    }
    if (actionType === 'reject') {
      return 'This article will be returned to the author\'s drafts. They can edit and resubmit it.'
    }
    return ''
  }

  // Fixed top position (no verify banner)
  const headerTopPosition = 'top-[120px]'
  const mobileHeaderTopPosition = 'max-md:top-[120px]'

  if (reviewLoading) {
    return (
      <>
        <NavbarLoggedin />
        <MemberSidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-pulse">
          <div className="text-gray-500">Loading review articles...</div>
        </div>
      </>
    )
  }

  if (reviewError) {
    return (
      <>
        <NavbarLoggedin />
        <MemberSidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-red-500">Error: {reviewError}</div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <Verify />
      
      {/* Review Header */}
      <div className={`fixed ${headerTopPosition} ${mobileHeaderTopPosition} left-0 right-0 bg-white `}>
        <div className="max-w-[1034px] mx-auto px-5">
          <div className="ml-0 md:ml-[185px] py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h1 className="text-lg font-semibold text-gray-900">Review</h1>
              <span className="text-sm text-gray-500">({filteredArticles.length})</span>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between bg-white border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                style={{
                  minWidth: '163px',
                  height: '32px',
                  borderRadius: '4px',
                  borderWidth: '1px',
                  opacity: 1,
                  gap: '10px',
                  padding: '6px 16px'
                }}
              >
                <span
                  style={{
                    fontFamily: 'Public Sans',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#6B7280'
                  }}
                >
                  Choose Category
                </span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  className="transition-transform flex-shrink-0"
                  style={{
                    strokeWidth: '1.4px',
                    opacity: 1,
                    color: '#9CA3AF',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100]">
                  <div className="p-4 flex gap-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search Category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-violet-500 focus:bg-white placeholder:text-gray-400"
                    />
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-sm font-medium bg-violet-100 text-violet-600 rounded-lg px-6 py-2 whitespace-nowrap transition-colors hover:bg-violet-200"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="p-3 overflow-y-auto flex-1">
                    {filteredCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="cursor-pointer accent-violet-500 shrink-0"
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span className="text-sm text-gray-600">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[200px] max-md:top-[170px] w-full max-w-[1034px] z-20 px-5">
        <div className="ml-0 md:ml-[185px] space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {isAuthor 
                ? "You have no articles pending review" 
                : "No articles pending review"}
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div 
                key={article.id}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={(e) => handleCardClick(e, article.id)}
              >
                {/* Desktop Layout */}
                <div className="hidden md:flex items-start justify-between gap-6">
                  {/* Left side - Article info */}
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox 
                      checked={selectedArticles[article.id] || false}
                      onCheckedChange={(checked) => handleSelectionChange(article.id, checked)}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-sm underline mb-3">
                        {article.author?.name || 'Unknown Author'}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {(article.categories || []).map((tag, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions and Date */}
                  <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      {/* Author sees only Revert to Draft */}
                      {isAuthor && (
                        <Button 
                          variant="outline"
                          className="text-gray-700 border-gray-300 hover:bg-gray-50 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRevertToDraft(article)
                          }}
                        >
                          Revert to Draft
                        </Button>
                      )}
                      
                      {/* Editor sees Accept (unpublish only) and Reject */}
                      {isEditor && (
                        <>
                          <Button 
                            variant="outline" 
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(article)
                            }}
                          >
                            Reject
                          </Button>
                          <Button 
                            variant="outline" 
                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAccept(article)
                            }}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(article.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-sm underline">
                        {article.author?.name || 'Unknown Author'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {isAuthor && (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-gray-700 border-gray-300 hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRevertToDraft(article)
                          }}
                        >
                          Revert
                        </Button>
                      )}
                      {isEditor && (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 h-10 w-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(article)
                            }}
                          >
                            ✕
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 h-10 w-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAccept(article)
                            }}
                          >
                            ✓
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mb-4">
                    {(article.categories || []).map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(article.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmAction}
        title={getModalTitle()}
        description={getModalDescription()}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </>
  )
}