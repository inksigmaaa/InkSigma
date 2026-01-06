"use client"

import { useState } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"

export default function TrashPage() {
  const { articles, loading, error, moveToDraft, moveToTrash } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)

  // Filter trash articles
  const trashArticles = articles.filter(article => article.status === 'trash')

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(trashArticles.map(a => a.id))
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

  const handleIndividualDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this article? This action cannot be undone.')) {
      return
    }
    
    try {
      await moveToTrash(id)
      alert('Article permanently deleted successfully!')
    } catch (error) {
      console.error('Error permanently deleting article:', error)
      alert('Failed to delete article. Please try again.')
    }
  }

  const handleIndividualRestore = async (id) => {
    try {
      await moveToDraft(id)
      alert('Article restored to drafts successfully!')
    } catch (error) {
      console.error('Error restoring article:', error)
      alert('Failed to restore article. Please try again.')
    }
  }

  // Add handlers to articles
  const articlesWithHandlers = trashArticles.map(article => ({
    ...article,
    onDelete: () => handleIndividualDelete(article.id),
    onRestore: () => handleIndividualRestore(article.id)
  }))

  const confirmDelete = async () => {
    try {
      // Permanently delete selected articles
      for (const articleId of selectedArticles) {
        await moveToTrash(articleId)
      }
      
      setSelectedArticles([])
      setShowDeleteModal(false)
      alert(`${selectedArticles.length} article(s) permanently deleted successfully!`)
    } catch (error) {
      console.error('Error permanently deleting articles:', error)
      alert('Failed to delete articles. Please try again.')
    }
  }

  const confirmRestore = async () => {
    try {
      // Restore selected articles to draft
      for (const articleId of selectedArticles) {
        await moveToDraft(articleId)
      }
      
      setSelectedArticles([])
      setShowRestoreModal(false)
      alert(`${selectedArticles.length} article(s) restored to drafts successfully!`)
    } catch (error) {
      console.error('Error restoring articles:', error)
      alert('Failed to restore articles. Please try again.')
    }
  }

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">Loading trash articles...</div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </>
    )
  }

  const hasSelectedArticles = selectedArticles.length > 0

  const actionButtons = [
    {
      title: "Restore",
      icon: "/images/icons/restore.svg",
      onClick: handleBulkRestore,
      disabled: !hasSelectedArticles
    },
    {
      title: "Delete",
      icon: "/images/icons/trash2.svg",
      onClick: handleBulkDelete,
      disabled: !hasSelectedArticles
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
        articles={articlesWithHandlers}
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
        message={`${selectedArticles.length} article(s) will be permanently deleted and cannot be recovered`}
        confirmText="Delete permanently"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={confirmRestore}
        title="Restore articles?"
        message={`${selectedArticles.length} article(s) will be restored to drafts`}
        confirmText="Restore"
        confirmStyle="normal"
      />
    </>
  )
}
