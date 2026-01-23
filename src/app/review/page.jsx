"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock } from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import EditorSidebar from "../components/sidebar/EditorSidebar"
import Verify from "../components/verify/Verify"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import PublishOptionsModal from "../components/review/PublishOptionsModal"
import CategoryFilter from "../components/categoryFilter/CategoryFilter"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"
import { useSession } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"

export default function ReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [selectedPosts, setSelectedPosts] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [selectedArticleForPublish, setSelectedArticleForPublish] = useState(null)
  
  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedArticleForAction, setSelectedArticleForAction] = useState(null)
  const [actionType, setActionType] = useState(null) // 'reject' or 'revert'
  
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
  const isEditor = userRole === 'editor'
  const isAdmin = userRole === 'admin' || currentPublication?.isOwner

  // Load review articles when publication changes
  useEffect(() => {
    if (currentPublication?.id) {
      loadReviewArticles(currentPublication.id)
      
      // Ensure URL has the publication ID so refresh works correctly
      if (searchParams && !searchParams.get('pub')) {
        const urlArgs = new URLSearchParams(window.location.search)
        urlArgs.set('pub', currentPublication.id)
        window.history.replaceState(null, '', `/review?${urlArgs.toString()}`)
      }
    }
  }, [currentPublication?.id, loadReviewArticles, searchParams])

  // Filter articles by selected categories
  const filteredArticles = selectedCategories.length > 0
    ? reviewArticles.filter(article => 
        article.categories?.some(cat => selectedCategories.includes(cat))
      )
    : reviewArticles

  const handleAccept = (article) => {
    // Show publish options modal for admin
    setSelectedArticleForPublish(article)
    setShowPublishModal(true)
  }

  const handlePublish = async () => {
    console.log('[ReviewPage] handlePublish called, article:', selectedArticleForPublish)
    if (selectedArticleForPublish) {
      try {
        console.log('[ReviewPage] Calling acceptReviewArticle with published status')
        await acceptReviewArticle(selectedArticleForPublish.id, 'published')
        console.log('[ReviewPage] acceptReviewArticle succeeded')
        setShowPublishModal(false)
        setSelectedArticleForPublish(null)
        console.log('Article published successfully!')
        // Refresh the review articles list
        if (currentPublication?.id) {
          loadReviewArticles(currentPublication.id)
        }
      } catch (error) {
        console.error('[ReviewPage] Error publishing article:', error)
      }
    }
  }

  const handleUnpublish = async () => {
    console.log('[ReviewPage] handleUnpublish called, article:', selectedArticleForPublish)
    if (selectedArticleForPublish) {
      try {
        console.log('[ReviewPage] Calling acceptReviewArticle with unpublished status')
        await acceptReviewArticle(selectedArticleForPublish.id, 'unpublished')
        console.log('[ReviewPage] acceptReviewArticle succeeded')
        setShowPublishModal(false)
        setSelectedArticleForPublish(null)
        console.log('Article stored to unpublished!')
        // Refresh the review articles list
        if (currentPublication?.id) {
          loadReviewArticles(currentPublication.id)
        }
      } catch (error) {
        console.error('[ReviewPage] Error storing to unpublished:', error)
      }
    }
  }

  const handleReject = (articleId) => {
    setSelectedArticleForAction(articleId)
    setActionType('reject')
    setShowConfirmModal(true)
  }

  const handleRevertToDraft = (articleId) => {
    setSelectedArticleForAction(articleId)
    setActionType('revert')
    setShowConfirmModal(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedArticleForAction) return

    try {
      if (actionType === 'reject') {
        await rejectReviewArticle(selectedArticleForAction)
        console.log('Article rejected and returned to draft.')
      } else if (actionType === 'revert') {
        await revertReviewToDraft(selectedArticleForAction)
        console.log('Article reverted to draft successfully!')
      }
      
      // Refresh the review articles list
      if (currentPublication?.id) {
        loadReviewArticles(currentPublication.id)
      }
    } catch (error) {
      console.error('Error performing action:', error)
    } finally {
      setShowConfirmModal(false)
      setSelectedArticleForAction(null)
      setActionType(null)
    }
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

  if (reviewLoading) {
    return (
      <>
        <NavbarLoggedin />
        {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
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
        {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
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
      {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
      <Verify />
      
      <div className={`absolute left-1/2 -translate-x-1/2 top-[160px] w-full max-w-[1034px] z-20 px-5 max-md:top-[120px]`}>
        <div className="ml-0 md:ml-[195px]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#267F24' }}></div>
                <h1 className="text-base font-bold text-gray-800">Review</h1>
                <span className="text-sm text-gray-500">({filteredArticles.length})</span>
              </div>
              
              {/* Category Select */}
              <CategoryFilter 
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                buttonText="Choose Category"
              />
            </div>

            

            {/* Posts List */}
            <div className="space-y-4 mt-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No articles pending review
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-start gap-4">
                      
                      
                      <div className="flex-1 mt-[-5px]">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {article.title}
                            </h3>
                            <p className="text-gray-400 text-sm underline">
                              {article.author?.name || 'Unknown Author'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {/* Show different actions based on user role and article ownership */}
                            {article.author?.id === session?.user?.id ? (
                              /* If it's user's own article, only show Revert to Draft */
                              <Button 
                                variant="outline"
                                className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRevertToDraft(article.id)
                                }}
                              >
                                Revert to Draft
                              </Button>
                            ) : (
                              /* If it's another author's article, show Accept and Reject */
                              <>
                                <Button 
                                  variant="outline" 
                                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleReject(article.id)
                                  }}
                                >
                                  Reject
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
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
                        </div>
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
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
                          
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(article.createdAt)}</span>
                          </div>
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
                          {/* Show different actions based on user role and article ownership */}
                          {article.author?.id === session?.user?.id ? (
                            /* If it's user's own article, only show Revert to Draft */
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-gray-700 border-gray-300 hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRevertToDraft(article.id)
                              }}
                            >
                              Revert
                            </Button>
                          ) : (
                            /* If it's another author's article, show Accept and Reject */
                            <>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 h-12 w-12"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReject(article.id)
                                }}
                              >
                                ✕
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 h-12 w-12"
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
        </div>
      </div>

      {/* Publish Options Modal */}
      <PublishOptionsModal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false)
          setSelectedArticleForPublish(null)
        }}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        articleTitle={selectedArticleForPublish?.title}
        userRole={currentPublication?.role}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setSelectedArticleForAction(null)
          setActionType(null)
        }}
        onConfirm={handleConfirmAction}
        title={actionType === 'reject' ? 'Reject Article?' : 'Revert to Draft?'}
        description={
          actionType === 'reject' 
            ? "This article will be returned to the author's drafts. They can edit and resubmit it."
            : "This action will move the article back to your drafts. You can edit and resubmit it later."
        }
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </>
  )
}
