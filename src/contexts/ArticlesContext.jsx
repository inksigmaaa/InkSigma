"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { blogService } from '@/services/blog.service'
import { useSession } from '@/lib/auth-client'
import { usePublication } from '@/contexts/PublicationContext'

const ArticlesContext = createContext()

// Helper function to format date
const formatDate = (date) => {
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()

  const suffix = (day) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  return `${day}${suffix(day)} ${month}, ${year}`
}

// Helper function to convert database blog to article format
const convertBlogToArticle = (blog) => {
  // Use the status field if available, otherwise derive from published field
  let status = blog.status || (blog.published ? 'published' : 'draft');
  
  // Ensure consistency with the publishing logic rules
  if (blog.status) {
    status = blog.status;
  } else {
    // Fallback for backward compatibility
    status = blog.published ? 'published' : 'draft';
  }

  return {
    id: blog.id,
    title: blog.title,
    description: blog.description,
    content: blog.content,
    categories: blog.categories || [],
    image: blog.image,
    status: status,
    published: blog.published,
    postedTime: `Posted ${formatDate(new Date(blog.createdAt))}`,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    scheduledAt: blog.scheduledAt,
    author: blog.author,
    slug: blog.slug,
    publicationId: blog.publicationId,
    // Use actual values from database, default to 0 if not present
    views: blog.views || 0,
    revisits: blog.revisits || 0,
    comments: blog.comments || 0,
    shares: blog.shares || 0
  }
}

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([])
  const [reviewArticles, setReviewArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reviewError, setReviewError] = useState(null)
  const { data: session } = useSession()
  
  // Refs to track current values without causing re-renders
  const sessionRef = useRef(session)
  const isLoadingRef = useRef(false)
  
  // Try to get publication context, but handle case where it might not be available
  let currentPublication = null
  try {
    const pubContext = usePublication()
    currentPublication = pubContext?.currentPublication
  } catch (e) {
    // PublicationContext not available, will use default behavior
  }
  
  const currentPublicationRef = useRef(currentPublication)
  
  // Update refs when values change
  useEffect(() => {
    sessionRef.current = session
  }, [session])
  
  useEffect(() => {
    currentPublicationRef.current = currentPublication
  }, [currentPublication])

  // Memoized loadUserArticles to prevent unnecessary re-renders
  const loadUserArticles = useCallback(async (publicationId = null, includeAllPublications = false) => {
    // Prevent concurrent loads
    if (isLoadingRef.current) return
    
    // Use current session from ref, but also check the actual session state
    const currentSession = sessionRef.current || session
    
    console.log('[ArticlesContext] loadUserArticles called')
    console.log('[ArticlesContext] currentSession:', currentSession?.user?.id)
    
    // If no session yet, wait a bit and retry (session might still be loading)
    if (!currentSession?.user?.id) {
      console.log('[ArticlesContext] No session yet, will retry when session loads')
      return
    }
    
    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)
      
      console.log('[ArticlesContext] Loading user blogs for:', currentSession.user.id, 'publicationId:', publicationId, 'includeAllPublications:', includeAllPublications)
      
      // If includeAllPublications is true, don't filter by publicationId at all
      // If publicationId is provided, filter by that publication
      // If NOT provided, explicitly filter for PERSONAL articles (publicationId = null)
      // This prevents "Joined Publication" articles from showing up in "My Blogs"
      const filters = includeAllPublications ? {} : (publicationId ? { publicationId } : { publicationId: 'null' })
      const blogs = await blogService.getUserBlogs(currentSession.user.id, filters)
      
      console.log('[ArticlesContext] Blogs received:', blogs?.length, blogs)
      
      const convertedArticles = blogs.map(convertBlogToArticle)
      console.log('[ArticlesContext] Converted articles:', convertedArticles?.length)
      console.log('[ArticlesContext] Published articles:', convertedArticles?.filter(a => a.status === 'published'))
      
      setArticles(convertedArticles)
    } catch (err) {
      console.error('Error loading articles:', err)
      setError(err.message)
      
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        console.log('Auth error detected, you may need to log in again')
      }
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [session]) // Only depend on session

  // Load articles when session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadUserArticles()
    }
  }, [session?.user?.id, loadUserArticles])

  // Memoize all functions to prevent unnecessary re-renders
  const getArticleById = useCallback(async (id) => {
    try {
      const blog = await blogService.getBlog(id)
      return convertBlogToArticle(blog)
    } catch (err) {
      console.error('Error loading article:', err)
      throw err
    }
  }, [])

  const createArticle = useCallback(async (articleData) => {
    try {
      const currentPub = currentPublicationRef.current;
      
      // publicationId is optional
      const publicationId = articleData.publicationId || currentPub?.id;

      // Determine status based on published flag, defaulting to draft
      let status = 'draft';
      if (articleData.published === true) {
        status = 'published';
      } else if (articleData.status) {
        status = articleData.status;
      }

      const blogData = {
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        categories: articleData.categories || [],
        status: status,
        scheduledAt: articleData.scheduledAt
      }
      
      // Add publicationId only if available
      if (publicationId) {
        blogData.publicationId = publicationId
      }

      const blog = await blogService.createBlog(blogData)
      
      const newArticle = convertBlogToArticle(blog)
      setArticles(prev => [newArticle, ...prev])
      return newArticle
    } catch (err) {
      console.error('Error creating article:', err)
      throw err
    }
  }, [])

  const updateArticle = useCallback(async (id, articleData) => {
    try {
      // Determine status based on published flag or explicit status
      let status = articleData.status;
      if (!status && articleData.published !== undefined) {
        status = articleData.published ? 'published' : 'draft';
      }

      const blog = await blogService.updateBlog(id, {
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        categories: articleData.categories,
        status: status,
        scheduledAt: articleData.scheduledAt
      })
      
      const updatedArticle = convertBlogToArticle(blog)
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      setPublicationArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      return updatedArticle
    } catch (err) {
      console.error('Error updating article:', err)
      throw err
    }
  }, [])

  const moveToTrash = useCallback(async (id) => {
    try {
      await blogService.deleteBlog(id)
      setArticles(prev => prev.filter(article => article.id !== id))
      setPublicationArticles(prev => prev.filter(article => article.id !== id))
    } catch (err) {
      console.error('Error deleting article:', err)
      // Still remove from local state if it's a "not found" error
      if (err.message?.includes('not found')) {
        setArticles(prev => prev.filter(article => article.id !== id))
        setPublicationArticles(prev => prev.filter(article => article.id !== id))
      } else {
        throw err
      }
    }
  }, [])

  const moveToDraft = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, 'draft')
      const updatedArticle = convertBlogToArticle(blog)
      
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      setPublicationArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      return updatedArticle
    } catch (err) {
      console.error('Error moving article to draft:', err)
      throw err
    }
  }, [])

  const moveToTrashStatus = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, 'trash')
      const updatedArticle = convertBlogToArticle(blog)
      
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      setPublicationArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      return updatedArticle
    } catch (err) {
      console.error('Error moving article to trash:', err)
      throw err
    }
  }, [])

  const publishArticle = useCallback(async (id) => {
    try {
      console.log('Publishing article with ID:', id)
      const blog = await blogService.updateBlogStatus(id, 'published')
      console.log('Article published successfully:', blog)
      const updatedArticle = convertBlogToArticle(blog)
      
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      setPublicationArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      return updatedArticle
    } catch (err) {
      console.error('Error publishing article:', err)
      throw err
    }
  }, [])

  const unpublishArticle = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, 'unpublished')
      const updatedArticle = convertBlogToArticle(blog)
      
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      setPublicationArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      return updatedArticle
    } catch (err) {
      console.error('Error unpublishing article:', err)
      throw err
    }
  }, [])

  // Load articles with 'review' status for a publication
  const loadReviewArticles = useCallback(async (publicationId) => {
    if (!publicationId) {
      console.warn('[ArticlesContext] No publicationId provided for loadReviewArticles')
      return []
    }

    try {
      setReviewLoading(true)
      setReviewError(null)
      console.log('[ArticlesContext] Loading review articles for publication:', publicationId)
      
      const blogs = await blogService.getReviewArticles(publicationId)
      const convertedArticles = blogs.map(convertBlogToArticle)
      
      console.log('[ArticlesContext] Review articles loaded:', convertedArticles.length)
      setReviewArticles(convertedArticles)
      return convertedArticles
    } catch (err) {
      console.error('Error loading review articles:', err)
      setReviewError(err.message)
      throw err
    } finally {
      setReviewLoading(false)
    }
  }, [])

  // Accept a review article (admin: choose published/unpublished, editor: unpublished only)
  const acceptReviewArticle = useCallback(async (id, targetStatus = 'unpublished') => {
    try {
      console.log('[ArticlesContext] Accepting review article:', id, 'with target status:', targetStatus)
      const blog = await blogService.acceptReviewArticle(id, targetStatus)
      const updatedArticle = convertBlogToArticle(blog)
      
      // Remove from review articles
      setReviewArticles(prev => prev.filter(article => article.id !== id))
      
      // Add to main articles list (or update if already exists)
      setArticles(prev => {
        const exists = prev.some(article => article.id === id)
        if (exists) {
          return prev.map(article =>
            article.id === id ? updatedArticle : article
          )
        } else {
          // Add to the beginning of the list
          return [updatedArticle, ...prev]
        }
      })
      
      // Also update publication articles if they exist
      setPublicationArticles(prev => {
        const exists = prev.some(article => article.id === id)
        if (exists) {
          return prev.map(article =>
            article.id === id ? updatedArticle : article
          )
        } else {
          return [updatedArticle, ...prev]
        }
      })
      
      return updatedArticle
    } catch (err) {
      console.error('Error accepting review article:', err)
      throw err
    }
  }, [])

  // Reject a review article (returns to author's draft)
  const rejectReviewArticle = useCallback(async (id) => {
    try {
      console.log('[ArticlesContext] Rejecting review article:', id)
      const blog = await blogService.rejectReviewArticle(id)
      const updatedArticle = convertBlogToArticle(blog)
      
      // Remove from review articles
      setReviewArticles(prev => prev.filter(article => article.id !== id))
      
      // Add to main articles list (or update if already exists)
      setArticles(prev => {
        const exists = prev.some(article => article.id === id)
        if (exists) {
          return prev.map(article =>
            article.id === id ? updatedArticle : article
          )
        } else {
          return [updatedArticle, ...prev]
        }
      })
      
      // Also update publication articles if they exist
      setPublicationArticles(prev => {
        const exists = prev.some(article => article.id === id)
        if (exists) {
          return prev.map(article =>
            article.id === id ? updatedArticle : article
          )
        } else {
          return [updatedArticle, ...prev]
        }
      })
      
      return updatedArticle
    } catch (err) {
      console.error('Error rejecting review article:', err)
      throw err
    }
  }, [])

  // Revert article from review back to draft (for author)
  const revertReviewToDraft = useCallback(async (id) => {
    try {
      console.log('[ArticlesContext] Reverting review article to draft:', id)
      const blog = await blogService.revertReviewToDraft(id)
      const updatedArticle = convertBlogToArticle(blog)
      
      // Remove from review articles
      setReviewArticles(prev => prev.filter(article => article.id !== id))
      
      // Update in main articles
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      
      return updatedArticle
    } catch (err) {
      console.error('Error reverting review article to draft:', err)
      throw err
    }
  }, [])

  const bulkMoveToTrash = useCallback(async (ids) => {
    try {
      // Delete each blog, but continue even if some fail (already deleted)
      const results = await Promise.allSettled(ids.map(id => blogService.deleteBlog(id)))
      
      // Log any failures but don't throw
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Failed to delete blog ${ids[index]}:`, result.reason?.message)
        }
      })
      
      // Remove all from local state regardless of API result
      setArticles(prev => prev.filter(article => !ids.includes(article.id)))
    } catch (err) {
      console.error('Error bulk deleting articles:', err)
      throw err
    }
  }, [])

  const bulkMoveToTrashStatus = useCallback(async (ids) => {
    try {
      const updatedBlogs = await Promise.all(
        ids.map(id => blogService.updateBlogStatus(id, 'trash'))
      )
      const updatedArticles = updatedBlogs.map(convertBlogToArticle)
      
      setArticles(prev => prev.map(article => {
        const updated = updatedArticles.find(ua => ua.id === article.id)
        return updated || article
      }))
    } catch (err) {
      console.error('Error bulk moving articles to trash:', err)
      throw err
    }
  }, [])

  const bulkPublish = useCallback(async (ids) => {
    try {
      const updatedBlogs = await Promise.all(
        ids.map(id => blogService.updateBlogStatus(id, 'published'))
      )
      const updatedArticles = updatedBlogs.map(convertBlogToArticle)
      
      setArticles(prev => prev.map(article => {
        const updated = updatedArticles.find(ua => ua.id === article.id)
        return updated || article
      }))
    } catch (err) {
      console.error('Error bulk publishing articles:', err)
      throw err
    }
  }, [])

  const bulkMoveToDraft = useCallback(async (ids) => {
    try {
      const updatedBlogs = await Promise.all(
        ids.map(id => blogService.updateBlogStatus(id, 'draft'))
      )
      const updatedArticles = updatedBlogs.map(convertBlogToArticle)
      
      setArticles(prev => prev.map(article => {
        const updated = updatedArticles.find(ua => ua.id === article.id)
        return updated || article
      }))
    } catch (err) {
      console.error('Error bulk moving articles to draft:', err)
      throw err
    }
  }, [])

  const uploadArticleImage = useCallback(async (id, imageFile) => {
    try {
      // Validate that imageFile is actually a File object
      if (!imageFile || !(imageFile instanceof File)) {
        throw new Error('Invalid image file provided')
      }
      
      const result = await blogService.uploadBlogImage(id, imageFile)
      const updatedArticle = convertBlogToArticle(result.blog)
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      return result.imageUrl
    } catch (err) {
      console.error('Error uploading article image:', err)
      throw err
    }
  }, [])

  // Legacy methods for backward compatibility (now just update status locally)
  const restoreFromTrash = useCallback((id) => {
    setArticles(prev => prev.map(article =>
      article.id === id ? { ...article, status: 'draft' } : article
    ))
  }, [])

  const deleteArticle = useCallback((id) => {
    setArticles(prev => prev.filter(article => article.id !== id))
  }, [])

  const bulkRestore = useCallback((ids) => {
    setArticles(prev => prev.map(article =>
      ids.includes(article.id) ? { ...article, status: 'draft' } : article
    ))
  }, [])

  const bulkDelete = useCallback((ids) => {
    setArticles(prev => prev.filter(article => !ids.includes(article.id)))
  }, [])

  // Publication articles state (for admins/editors to see all articles in publication)
  const [publicationArticles, setPublicationArticles] = useState([])
  const [pubArticlesLoading, setPubArticlesLoading] = useState(false)

  // Load all articles for a publication (for admins/editors)
  const loadPublicationArticles = useCallback(async (publicationId, status = null) => {
    try {
      setPubArticlesLoading(true)
      const filters = status ? { status } : {}
      const blogs = await blogService.getPublicationBlogs(publicationId, filters)
      const convertedArticles = blogs.map(convertBlogToArticle)
      setPublicationArticles(convertedArticles)
      return convertedArticles
    } catch (err) {
      console.error('Error loading publication articles:', err)
      throw err
    } finally {
      setPubArticlesLoading(false)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    articles,
    reviewArticles,
    publicationArticles, // New
    loading,
    reviewLoading,
    pubArticlesLoading, // New
    error,
    reviewError,
    loadUserArticles,
    loadReviewArticles,
    loadPublicationArticles, // New
    getArticleById,
    createArticle,
    updateArticle,
    moveToTrash,
    moveToDraft,
    moveToTrashStatus,
    restoreFromTrash,
    deleteArticle,
    publishArticle,
    unpublishArticle,
    acceptReviewArticle,
    rejectReviewArticle,
    revertReviewToDraft,
    bulkMoveToTrash,
    bulkMoveToTrashStatus,
    bulkMoveToDraft,
    bulkRestore,
    bulkDelete,
    bulkPublish,
    uploadArticleImage
  }), [
    articles, 
    reviewArticles, 
    publicationArticles, // New
    loading, 
    reviewLoading, 
    pubArticlesLoading, // New
    error, 
    reviewError, 
    loadUserArticles, 
    loadReviewArticles,
    loadPublicationArticles, // New
    getArticleById, 
    createArticle, 
    updateArticle, 
    moveToTrash, 
    moveToDraft, 
    moveToTrashStatus,
    restoreFromTrash,
    deleteArticle,
    publishArticle, 
    unpublishArticle,
    acceptReviewArticle,
    rejectReviewArticle,
    revertReviewToDraft,
    bulkMoveToTrash,
    bulkMoveToTrashStatus,
    bulkMoveToDraft,
    bulkRestore,
    bulkDelete,
    bulkPublish,
    uploadArticleImage
  ])

  return (
    <ArticlesContext.Provider value={contextValue}>
      {children}
    </ArticlesContext.Provider>
  )
}

export function useArticles() {
  const context = useContext(ArticlesContext)
  if (!context) {
    throw new Error('useArticles must be used within ArticlesProvider')
  }
  return context
}
