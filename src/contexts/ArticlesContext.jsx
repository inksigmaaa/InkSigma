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
  const today = new Date()
  
  const [articles, setArticles] = useState([
    {
      id: 1,
      status: 'draft',
      title: 'Title of the Blog will be in this area',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...',
      categories: ['Sports', 'Humour', 'History'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    },
    {
      id: 2,
      status: 'published',
      title: 'Title of the Blog will be in this area',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...',
      categories: ['Sports', 'Humour', 'History'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    },
    {
      id: 3,
      status: 'review',
      title: 'Title of the Blog will be in this area',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...',
      categories: ['Sports', 'Humour', 'History'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    },
    {
      id: 4,
      status: 'trash',
      title: 'Deleted Article About Technology Trends',
      description: 'This article was moved to trash and can be restored or permanently deleted...',
      categories: ['Technology', 'Innovation'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    },
    {
      id: 5,
      status: 'trash',
      title: 'Old Marketing Strategy Post',
      description: 'An outdated marketing article that needs to be reviewed before permanent deletion...',
      categories: ['Marketing', 'Business'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    },
    {
      id: 6,
      status: 'trash',
      title: 'Draft About Climate Change',
      description: 'Incomplete draft about environmental issues, moved to trash for cleanup...',
      categories: ['Environment', 'Science'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    },
    {
      id: 7,
      status: 'trash',
      title: 'Travel Guide to Europe',
      description: 'Travel article that was replaced with updated version, ready for deletion...',
      categories: ['Travel', 'Lifestyle'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    },
    {
      id: 8,
      status: 'trash',
      title: 'Recipe Collection for Summer',
      description: 'Seasonal recipes that are no longer relevant, can be permanently removed...',
      categories: ['Food', 'Cooking'],
      createdAt: today,
      get postedTime() { return formatDate(this.createdAt) }
    }
  ])

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
