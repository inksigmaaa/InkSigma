"use client"

import { useState, useEffect } from "react"
import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import Verify from "../../components/verify/Verify"
import ArticleContainer from "../../components/articleContainer/ArticleContainer"
import ConfirmModal from "../../components/confirmModal/ConfirmModal"
import { useSession } from "@/lib/auth-client"
import { usePublication } from "@/contexts/PublicationContext"

export default function PostsMyBlogsPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const { currentPublication } = usePublication()
  const [showTrashModal, setShowTrashModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showUnpublishModal, setShowUnpublishModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [actionArticleId, setActionArticleId] = useState(null)

  useEffect(() => {
    if (session?.user?.id && currentPublication?.id) {
      loadMyBlogs()
    }
  }, [session?.user?.id, currentPublication?.id])

  const loadMyBlogs = async () => {
    try {
      setLoading(true)
      
      // Fetch user's blogs for the current publication context
      const articlesRes = await fetch(
        `http://localhost:5000/api/blogs?publicationId=${currentPublication.id}&authorId=${session.user.id}&includeUnpublished=true&includeTrash=true&includeReview=true`,
        { credentials: "include" }
      )

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json()
        setArticles(articlesData)
      } else {
        console.error("Failed to fetch articles")
        setArticles([])
      }
    } catch (error) {
      console.error("Error loading my blogs:", error)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleMoveToTrash = (articleId) => {
    setActionArticleId(articleId)
    setShowTrashModal(true)
  }

  const confirmMoveToTrash = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${actionArticleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'trash' }),
      })

      if (response.ok) {
        await loadMyBlogs()
      }
      setShowTrashModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error moving to trash:', error)
      setShowTrashModal(false)
      setActionArticleId(null)
    }
  }

  const handleDeleteArticle = (articleId) => {
    setActionArticleId(articleId)
    setShowDeleteModal(true)
  }

  const confirmDeleteArticle = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${actionArticleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        await loadMyBlogs()
      }
      setShowDeleteModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error deleting article:', error)
      setShowDeleteModal(false)
      setActionArticleId(null)
    }
  }

  const handleMoveToDraft = (articleId) => {
    setActionArticleId(articleId)
    setShowDraftModal(true)
  }

  const confirmMoveToDraft = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${actionArticleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'draft' }),
      })

      if (response.ok) {
        await loadMyBlogs()
      }
      setShowDraftModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error moving to draft:', error)
      setShowDraftModal(false)
      setActionArticleId(null)
    }
  }

  const handlePublish = (articleId) => {
    setActionArticleId(articleId)
    setShowPublishModal(true)
  }

  const confirmPublish = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${actionArticleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'published' }),
      })

      if (response.ok) {
        await loadMyBlogs()
      }
      setShowPublishModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error publishing article:', error)
      setShowPublishModal(false)
      setActionArticleId(null)
    }
  }

  const handleUnpublish = (articleId) => {
    setActionArticleId(articleId)
    setShowUnpublishModal(true)
  }

  const confirmUnpublish = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${actionArticleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'unpublished' }),
      })

      if (response.ok) {
        await loadMyBlogs()
      }
      setShowUnpublishModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error unpublishing article:', error)
      setShowUnpublishModal(false)
      setActionArticleId(null)
    }
  }

  const handleRestore = (articleId) => {
    setActionArticleId(articleId)
    setShowRestoreModal(true)
  }

  const confirmRestore = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${actionArticleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'draft' }),
      })

      if (response.ok) {
        await loadMyBlogs()
      }
      setShowRestoreModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error restoring article:', error)
      setShowRestoreModal(false)
      setActionArticleId(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    // Just now (< 1 minute)
    if (diffInSeconds < 60) {
      return 'Just now'
    }
    
    // 1 min ago - 59 mins ago
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`
    }
    
    // 1 hour ago - 24 hours ago
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    }
    
    // Yesterday
    if (diffInDays === 1) {
      return 'Yesterday'
    }
    
    // 2 days ago - 6 days ago
    if (diffInDays < 7) {
      return `${diffInDays} days ago`
    }
    
    // Last week (7-29 days)
    if (diffInDays < 30) {
      return 'Last week'
    }
    
    // Last month (30+ days)
    return 'Last month'
  }

  const topPosition = 'top-[160px]'
  const mobileTopPosition = 'max-md:top-[120px]'

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <Verify />
      
      <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
        <div className="ml-0 md:ml-[195px]">
          <div className="flex flex-col gap-4 mb-6 px-2 max-md:mt-3">
            <h1 className="font-bold text-lg leading-8 text-gray-800 m-0 flex items-center gap-3 max-md:text-base">
              <span className="w-3 h-3 bg-pink-500 rounded-full shrink-0"></span>
              My Blogs
            </h1>
          </div>

          <div className="mt-6 space-y-4 pb-[85px]">
            {loading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-gray-500">Loading articles...</div>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">No articles yet</p>
              </div>
            ) : (
              articles.map(article => (
                <ArticleContainer
                  key={article.id}
                  id={article.id}
                  status={article.status}
                  title={article.title}
                  description={article.description}
                  categories={article.categories || []}
                  postedTime={formatDate(article.createdAt)}
                  isSelected={false}
                  onSelect={() => {}}
                  onDelete={article.status === 'trash' ? () => handleDeleteArticle(article.id) : () => handleMoveToTrash(article.id)}
                  onRestore={() => handleRestore(article.id)}
                  onDraft={() => handleMoveToDraft(article.id)}
                  onPublish={() => handlePublish(article.id)}
                  onUnpublish={() => handleUnpublish(article.id)}
                  publicationId={currentPublication?.id}
                  showActions={true}
                  stats={[
                    { label: 'Views', value: article.views ?? 0 },
                    { label: 'Revisits', value: article.revisits ?? 0 },
                    { label: 'Comments', value: article.comments ?? 0 },
                    { label: 'Shares', value: article.shares ?? 0 }
                  ]}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        onConfirm={confirmMoveToTrash}
        title="Move to Trash"
        message="Are you sure you want to move this article to trash?"
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteArticle}
        title="Delete Permanently"
        message="Are you sure you want to permanently delete this article? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        onConfirm={confirmMoveToDraft}
        title="Move to Draft"
        message="Are you sure you want to move this article to draft?"
        confirmText="Move to Draft"
        confirmStyle="primary"
      />

      <ConfirmModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={confirmPublish}
        title="Publish Article"
        message="Are you sure you want to publish this article?"
        confirmText="Publish"
        confirmStyle="primary"
      />

      <ConfirmModal
        isOpen={showUnpublishModal}
        onClose={() => setShowUnpublishModal(false)}
        onConfirm={confirmUnpublish}
        title="Unpublish Article"
        message="Are you sure you want to unpublish this article?"
        confirmText="Unpublish"
        confirmStyle="primary"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={confirmRestore}
        title="Restore Article"
        message="Are you sure you want to restore this article from trash?"
        confirmText="Restore"
        confirmStyle="primary"
      />
    </>
  )
}
