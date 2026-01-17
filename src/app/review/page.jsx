"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock } from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import EditorSidebar from "../components/sidebar/EditorSidebar"
import Verify from "../components/verify/Verify"
import PublishOptionsModal from "../components/review/PublishOptionsModal"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"
import { useRouter, useSearchParams } from "next/navigation"

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

export default function ReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPosts, setSelectedPosts] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [selectedArticleForPublish, setSelectedArticleForPublish] = useState(null)
  const dropdownRef = useRef(null)

  const { 
    reviewArticles, 
    reviewLoading, 
    reviewError, 
    loadReviewArticles, 
    acceptReviewArticle, 
    rejectReviewArticle 
  } = useArticles()
  
  const { currentPublication } = usePublication()

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

  // Filter articles by selected categories
  const filteredArticles = selectedCategories.length > 0
    ? reviewArticles.filter(article => 
        article.categories?.some(cat => selectedCategories.includes(cat))
      )
    : reviewArticles

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPosts(filteredArticles.map(a => a.id))
    } else {
      setSelectedPosts([])
    }
  }

  const handleSelectPost = (postId, checked) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, postId])
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== postId))
    }
  }

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

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

  const handleReject = async (articleId) => {
    if (confirm('Are you sure you want to reject this article? It will be returned to the author\'s drafts.')) {
      try {
        await rejectReviewArticle(articleId)
        console.log('Article rejected and returned to draft.')
        // Refresh the review articles list
        if (currentPublication?.id) {
          loadReviewArticles(currentPublication.id)
        }
      } catch (error) {
        console.error('Error rejecting article:', error)
      }
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
        <div className="ml-0 md:ml-[185px]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <h1 className="text-base font-bold text-gray-800">Review</h1>
                <span className="text-sm text-gray-500">({filteredArticles.length})</span>
              </div>
              
              {/* Category Select */}
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
                    padding: '6px 16px',
                    fontFamily: 'Public Sans',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#6B7280'
                  }}
                >
                  <span>Choose Category</span>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none"
                    className={`shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
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

            {/* Select All */}
            {filteredArticles.length > 0 && (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === filteredArticles.length && filteredArticles.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="cursor-pointer accent-violet-500"
                    style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                  />
                  <span className="font-bold text-base leading-6 text-gray-500">Select all</span>
                </label>
              </div>
            )}

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
                    onClick={(e) => handleCardClick(e, article.id)}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-start gap-4">
                      <Checkbox 
                        checked={selectedPosts.includes(article.id)}
                        onCheckedChange={(checked) => handleSelectPost(article.id, checked)}
                      />
                      
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
    </>
  )
}
