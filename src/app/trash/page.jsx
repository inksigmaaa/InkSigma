"use client"

import { useState } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"

export default function TrashPage() {
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)

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

  const today = new Date()
  const todayFormatted = formatDate(today)

  // Mock articles for demo - using state so we can delete them
  const [articles, setArticles] = useState([
    { 
      id: "1", 
      status: "trash",
      title: "Title of the Blog will be in this area", 
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...", 
      categories: ["Sports", "Humour", "History"], 
      postedTime: todayFormatted,
      onDelete: () => handleIndividualDelete("1"),
      onRestore: () => handleIndividualRestore("1")
    },
    { 
      id: "2", 
      status: "trash",
      title: "Title of the Blog will be in this area", 
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...", 
      categories: ["Sports", "Humour", "History"], 
      postedTime: todayFormatted,
      onDelete: () => handleIndividualDelete("2"),
      onRestore: () => handleIndividualRestore("2")
    },
    { 
      id: "3", 
      status: "trash",
      title: "Title of the Blog will be in this area", 
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...", 
      categories: ["Sports", "Humour", "History"], 
      postedTime: todayFormatted,
      onDelete: () => handleIndividualDelete("3"),
      onRestore: () => handleIndividualRestore("3")
    }
  ])

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(articles.map(a => a.id))
    } else {
      setSelectedArticles([])
    }
  }

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, id])
    } else {
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedArticles.length > 0) {
      setShowDeleteModal(true)
    }
  }

  const handleBulkRestore = () => {
    if (selectedArticles.length > 0) {
      setShowRestoreModal(true)
    }
  }

  const handleIndividualDelete = (id) => {
    // For individual delete, set selected to just this article
    setSelectedArticles([id])
    setShowDeleteModal(true)
  }

  const handleIndividualRestore = (id) => {
    console.log('Restore article:', id)
    // Remove from trash (in real app, this would call an API)
    setArticles(prev => prev.filter(article => article.id !== id))
  }

  const confirmDelete = () => {
    // Delete selected articles
    setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)))
    setSelectedArticles([])
    setShowDeleteModal(false)
  }

  const confirmRestore = () => {
    console.log('Restore articles:', selectedArticles)
    // Remove restored articles from trash
    setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)))
    setSelectedArticles([])
    setShowRestoreModal(false)
  }

  const actionButtons = [
    {
      title: "Restore",
      icon: "/images/icons/restore.svg",
      onClick: handleBulkRestore,
      disabled: selectedArticles.length === 0
    },
    {
      title: "Delete",
      icon: "/images/icons/trash2.svg",
      onClick: handleBulkDelete,
      disabled: selectedArticles.length === 0
    }
  ]

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PersonalArticles
        title="Trash"
        titleColor="#EF4444"
        articles={articles}
        emptyMessage="No trash articles yet"
        showSelectAll={true}
        showActions={true}
        actionButtons={actionButtons}
        selectedArticles={selectedArticles}
        onSelectAll={handleSelectAll}
        onArticleSelect={handleArticleSelect}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedArticles([])
        }}
        onConfirm={confirmDelete}
        title="Delete permanently?"
        message={`${selectedArticles.length} article(s) will be permanently deleted`}
        confirmText="Delete permanently"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={confirmRestore}
        title="Restore articles?"
        message={`${selectedArticles.length} article(s) will be restored`}
        confirmText="Restore"
        confirmStyle="normal"
      />
    </>
  )
}
