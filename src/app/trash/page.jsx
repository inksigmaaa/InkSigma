"use client"

import { useState } from "react"
import AuthGuard from "@/components/auth/AuthGuard"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import PageTransition from "@/components/PageTransition"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"
import EditorSidebar from "../components/sidebar/EditorSidebar"

export default function TrashPage() {
  const { currentPublication } = usePublication()
  const isSidebarAdmin = currentPublication?.isOwner || currentPublication?.role === 'admin'
  const { articles, loading, error, moveToDraft, moveToTrash, bulkMoveToTrash } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [deleteArticleId, setDeleteArticleId] = useState(null)

  // Filter trash articles
  const trashArticles = articles.filter(article => {
    const isTrash = article.status === 'trash'
    
    // If we are in a publication context, only show articles for that publication
    if (currentPublication?.id) {
      return isTrash && article.publicationId === currentPublication.id
    }
    
    // If not in a publication context (e.g. dashboard), show all trash
    return isTrash
  })

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
      setDeleteArticleId(null)
      setShowDeleteModal(true)
    }
  }

  const handleBulkRestore = () => {
    if (selectedArticles.length > 0) {
      setShowRestoreModal(true)
    }
  }

  const handleIndividualDelete = (id) => {
    setDeleteArticleId(id)
    setShowDeleteModal(true)
  }

  const handleIndividualRestore = async (id) => {
    try {
      await moveToDraft(id)
    } catch (error) {
      console.error('Error restoring article:', error)
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
      if (deleteArticleId) {
        // Single article permanent delete
        await moveToTrash(deleteArticleId)
      } else {
        // Bulk permanent delete
        await bulkMoveToTrash(selectedArticles)
        setSelectedArticles([])
      }

      setShowDeleteModal(false)
      setDeleteArticleId(null)
    } catch (error) {
      console.error('Error permanently deleting articles:', error)
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
    } catch (error) {
      console.error('Error restoring articles:', error)
    }
  }

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px] animate-pulse">
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
        <div className="flex justify-center items-center min-h-[400px] animate-fadeIn">
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
      onClick: handleBulkRestore
    },
    {
      title: "Delete",
      icon: "/images/icons/trash2.svg",
      onClick: handleBulkDelete
    }
  ]

  return (
    <AuthGuard>
      <NavbarLoggedin />
      {isSidebarAdmin ? <Sidebar /> : <EditorSidebar />}
      <Verify />
      <PageTransition>
        <PersonalArticles
          title="Trash"
          titleColor="#F13434"
          articles={articlesWithHandlers}
          emptyMessage="No trash articles yet"
          showSelectAll={true}
          showActions={true}
          actionButtons={actionButtons}
          selectedArticles={selectedArticles}
          onSelectAll={handleSelectAll}
          onArticleSelect={handleArticleSelect}
        />
      </PageTransition>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteArticleId(null)
          if (!deleteArticleId) setSelectedArticles([])
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete permanently?"
        message="This will permanently delete this article and cannot be restored"
        confirmText="Delete permanently"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={confirmRestore}
        title="Are you sure you want to Restore?"
        confirmText="Restore"
        confirmStyle="normal"
      />
    </AuthGuard>
  )
}
