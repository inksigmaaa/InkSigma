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
    slug: blog.slug
  }
}

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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
  const loadUserArticles = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) return
    
    const currentSession = sessionRef.current
    const currentPub = currentPublicationRef.current
    
    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)
      
      let blogs;
      if (currentSession?.user?.id) {
        // If we have a current publication, load articles for that publication
        if (currentPub?.id) {
          blogs = await blogService.getPublicationBlogs(currentPub.id)
        } else {
          blogs = await blogService.getUserBlogs(currentSession.user.id)
        }
      } else {
        blogs = await blogService.getAllBlogs()
      }
      
      const convertedArticles = blogs.map(convertBlogToArticle)
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
  }, []) // Empty deps - uses refs internally

  // Load articles when session or publication changes
  useEffect(() => {
    if (session?.user?.id) {
      loadUserArticles()
    }
  }, [session?.user?.id, currentPublication?.id, loadUserArticles])

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
      
      // publicationId is now required
      const publicationId = articleData.publicationId || currentPub?.id;
      
      if (!publicationId) {
        throw new Error('Publication ID is required to create an article');
      }

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
        scheduledAt: articleData.scheduledAt,
        publicationId: publicationId
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
    } catch (err) {
      console.error('Error deleting article:', err)
      throw err
    }
  }, [])

  const moveToDraft = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, 'draft')
      const updatedArticle = convertBlogToArticle(blog)
      setArticles(prev => prev.map(article =>
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
      return updatedArticle
    } catch (err) {
      console.error('Error unpublishing article:', err)
      throw err
    }
  }, [])

  const bulkMoveToTrash = useCallback(async (ids) => {
    try {
      await Promise.all(ids.map(id => blogService.deleteBlog(id)))
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    articles,
    loading,
    error,
    loadUserArticles,
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
    bulkMoveToTrash,
    bulkMoveToTrashStatus,
    bulkMoveToDraft,
    bulkRestore,
    bulkDelete,
    bulkPublish,
    uploadArticleImage
  }), [
    articles,
    loading,
    error,
    loadUserArticles,
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
