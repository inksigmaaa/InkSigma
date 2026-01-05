"use client"

import { createContext, useContext, useState } from 'react'

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

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([])

  const moveToTrash = (id) => {
    setArticles(prev => prev.map(article =>
      article.id === id ? { ...article, status: 'trash' } : article
    ))
  }

  const restoreFromTrash = (id) => {
    setArticles(prev => prev.map(article =>
      article.id === id ? { ...article, status: 'draft' } : article
    ))
  }

  const deleteArticle = (id) => {
    setArticles(prev => prev.filter(article => article.id !== id))
  }

  const publishArticle = (id) => {
    setArticles(prev => prev.map(article =>
      article.id === id ? { ...article, status: 'published' } : article
    ))
  }

  const unpublishArticle = (id) => {
    setArticles(prev => prev.map(article =>
      article.id === id ? { ...article, status: 'unpublished' } : article
    ))
  }

  const bulkMoveToTrash = (ids) => {
    setArticles(prev => prev.map(article =>
      ids.includes(article.id) ? { ...article, status: 'trash' } : article
    ))
  }

  const bulkRestore = (ids) => {
    setArticles(prev => prev.map(article =>
      ids.includes(article.id) ? { ...article, status: 'draft' } : article
    ))
  }

  const bulkDelete = (ids) => {
    setArticles(prev => prev.filter(article => !ids.includes(article.id)))
  }

  const bulkPublish = (ids) => {
    setArticles(prev => prev.map(article =>
      ids.includes(article.id) ? { ...article, status: 'published' } : article
    ))
  }

  return (
    <ArticlesContext.Provider value={{
      articles,
      moveToTrash,
      restoreFromTrash,
      deleteArticle,
      publishArticle,
      unpublishArticle,
      bulkMoveToTrash,
      bulkRestore,
      bulkDelete,
      bulkPublish
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
