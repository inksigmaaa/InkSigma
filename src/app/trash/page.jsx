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

  const [articles, setArticles] = useState([])

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
    setSelectedArticles([id])
    setShowDeleteModal(true)
  }

  const handleIndividualRestore = (id) => {
    console.log('Restore article:', id)
    setArticles(prev => prev.filter(article => article.id !== id))
  }

  // Add handlers to articles
  const articlesWithHandlers = articles.map(article => ({
    ...article,
    onDelete: () => handleIndividualDelete(article.id),
    onRestore: () => handleIndividualRestore(article.id)
  }))

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
