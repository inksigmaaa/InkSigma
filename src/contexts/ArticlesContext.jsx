"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { blogService } from '@/services/blog.service'
import { useSession } from '@/lib/auth-client'

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
    author: blog.author,
    slug: blog.slug
  }
}

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { data: session } = useSession()

  // Load user's articles on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadUserArticles()
    }
  }, [session?.user?.id])

  const loadUserArticles = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      const blogs = await blogService.getUserBlogs(session.user.id)
      const convertedArticles = blogs.map(convertBlogToArticle)
      setArticles(convertedArticles)
    } catch (err) {
      console.error('Error loading articles:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getArticleById = async (id) => {
    try {
      const blog = await blogService.getBlog(id)
      return convertBlogToArticle(blog)
    } catch (err) {
      console.error('Error loading article:', err)
      throw err
    }
  }

  const createArticle = async (articleData) => {
    try {
      // Determine status based on published flag, defaulting to draft
      let status = 'draft';
      if (articleData.published === true) {
        status = 'published';
      } else if (articleData.status) {
        status = articleData.status;
      }

      const blog = await blogService.createBlog({
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        categories: articleData.categories || [],
        status: status,
        scheduledAt: articleData.scheduledAt
      })
      
      const newArticle = convertBlogToArticle(blog)
      setArticles(prev => [newArticle, ...prev])
      return newArticle
    } catch (err) {
      console.error('Error creating article:', err)
      throw err
    }
  }

  const updateArticle = async (id, articleData) => {
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
  }

  const moveToTrash = async (id) => {
    try {
      await blogService.deleteBlog(id)
      setArticles(prev => prev.filter(article => article.id !== id))
    } catch (err) {
      console.error('Error deleting article:', err)
      throw err
    }
  }

  const moveToDraft = async (id) => {
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
  }

  const moveToTrashStatus = async (id) => {
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
  }

  const publishArticle = async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, 'published')
      const updatedArticle = convertBlogToArticle(blog)
      setArticles(prev => prev.map(article =>
        article.id === id ? updatedArticle : article
      ))
      return updatedArticle
    } catch (err) {
      console.error('Error publishing article:', err)
      throw err
    }
  }

  const unpublishArticle = async (id) => {
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
  }

  const bulkMoveToTrash = async (ids) => {
    try {
      await Promise.all(ids.map(id => blogService.deleteBlog(id)))
      setArticles(prev => prev.filter(article => !ids.includes(article.id)))
    } catch (err) {
      console.error('Error bulk deleting articles:', err)
      throw err
    }
  }

  const bulkMoveToTrashStatus = async (ids) => {
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
  }

  const bulkPublish = async (ids) => {
    try {
      const updatedBlogs = await Promise.all(
        ids.map(id => blogService.togglePublishStatus(id, true))
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
  }

  const uploadArticleImage = async (id, imageFile) => {
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
  }

  // Legacy methods for backward compatibility (now just update status locally)
  const restoreFromTrash = (id) => {
    setArticles(prev => prev.map(article =>
      article.id === id ? { ...article, status: 'draft' } : article
    ))
  }

  const deleteArticle = (id) => {
    setArticles(prev => prev.filter(article => article.id !== id))
  }

  const bulkRestore = (ids) => {
    setArticles(prev => prev.map(article =>
      ids.includes(article.id) ? { ...article, status: 'draft' } : article
    ))
  }

  const bulkDelete = (ids) => {
    setArticles(prev => prev.filter(article => !ids.includes(article.id)))
  }

  return (
    <ArticlesContext.Provider value={{
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
      bulkRestore,
      bulkDelete,
      bulkPublish,
      uploadArticleImage
    }}>
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
