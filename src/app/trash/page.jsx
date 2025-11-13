"use client"

import { useState, useMemo } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"

export default function TrashPage() {
  const { articles, restoreFromTrash, deleteArticle, bulkRestore, bulkDelete } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [singleArticleAction, setSingleArticleAction] = useState(null)

  const trashedArticles = useMemo(() => {
    return articles
      .filter(article => article.status === 'trash')
      .map(article => ({
        ...article,
        onRestore: () => handleSingleRestore(article.id),
        onDelete: () => handleSingleDelete(article.id)
      }))
  }, [articles])

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(trashedArticles.map(a => a.id))
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
      setSingleArticleAction(null)
      setShowDeleteModal(true)
    }
  }

  const handleBulkRestore = () => {
    if (selectedArticles.length > 0) {
      setSingleArticleAction(null)
      setShowRestoreModal(true)
    }
  }

  const handleSingleDelete = (id) => {
    setSingleArticleAction(id)
    setShowDeleteModal(true)
  }

  const handleSingleRestore = (id) => {
    setSingleArticleAction(id)
    setShowRestoreModal(true)
  }

  const confirmDelete = () => {
    if (singleArticleAction) {
      deleteArticle(singleArticleAction)
    } else {
      bulkDelete(selectedArticles)
      setSelectedArticles([])
    }
    setShowDeleteModal(false)
    setSingleArticleAction(null)
  }

  const confirmRestore = () => {
    if (singleArticleAction) {
      restoreFromTrash(singleArticleAction)
    } else {
      bulkRestore(selectedArticles)
      setSelectedArticles([])
    }
    setShowRestoreModal(false)
    setSingleArticleAction(null)
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
      icon: "/images/icons/trash1.svg",
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
        articles={trashedArticles}
        emptyMessage="No Articles Trashed yet"
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
          setSingleArticleAction(null)
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete?"
        message={singleArticleAction
          ? "This will permanently delete this article and cannot be restored"
          : `This will permanently delete ${selectedArticles.length} article(s) and cannot be restored`
        }
        confirmText="Delete permanently"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false)
          setSingleArticleAction(null)
        }}
        onConfirm={confirmRestore}
        title="Are you sure you want to Restore?"
        message={singleArticleAction
          ? "This article will be restored to drafts"
          : `${selectedArticles.length} article(s) will be restored to drafts`
        }
        confirmText="Restore"
        confirmStyle="normal"
      />
    </>
  )
}
