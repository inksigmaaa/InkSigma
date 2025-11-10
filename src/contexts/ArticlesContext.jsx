"use client"

import { createContext, useContext, useState } from 'react'

const ArticlesContext = createContext()

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([
    {
      id: 1,
      status: 'draft',
      title: 'Title of the Blog will be in this area',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...',
      categories: ['Sports', 'Humour', 'History'],
      postedTime: 'Posted 2 mins ago',
      createdAt: new Date('2024-11-15')
    },
    {
      id: 2,
      status: 'published',
      title: 'Title of the Blog will be in this area',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...',
      categories: ['Sports', 'Humour', 'History'],
      postedTime: 'FRI | 15 NOV, 2024',
      createdAt: new Date('2024-11-15')
    },
    {
      id: 3,
      status: 'review',
      title: 'Title of the Blog will be in this area',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...',
      categories: ['Sports', 'Humour', 'History'],
      postedTime: 'FRI | 15 NOV, 2024',
      createdAt: new Date('2024-11-15')
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
