"use client"

import { useState, useMemo } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"

export default function DraftPage() {
  const { articles, moveToTrash, bulkMoveToTrash, bulkPublish } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

  const draftArticles = useMemo(() => {
    return articles
      .filter(article => article.status === 'draft')
      .map(article => ({
        ...article,
        onDelete: () => moveToTrash(article.id)
      }))
  }, [articles, moveToTrash])

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(draftArticles.map(a => a.id))
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

  const handleBulkPublish = () => {
    if (selectedArticles.length > 0) {
      setShowPublishModal(true)
    }
  }

  const confirmDelete = () => {
    bulkMoveToTrash(selectedArticles)
    setSelectedArticles([])
    setShowDeleteModal(false)
  }

  const confirmPublish = () => {
    bulkPublish(selectedArticles)
    setSelectedArticles([])
    setShowPublishModal(false)
  }

  const actionButtons = [
    {
      title: "Publish",
      icon: "/images/icons/Publish.svg",
      onClick: handleBulkPublish,
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
        title="Drafts"
        titleColor="#F97316"
        articles={draftArticles}
        emptyMessage="No Articles Drafted yet"
        showSelectAll={true}
        showActions={true}
        actionButtons={actionButtons}
        selectedArticles={selectedArticles}
        onSelectAll={handleSelectAll}
        onArticleSelect={handleArticleSelect}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Move to trash?"
        message={`${selectedArticles.length} article(s) will be moved to trash`}
        confirmText="Move to trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={confirmPublish}
        title="Publish articles?"
        message={`${selectedArticles.length} article(s) will be published`}
        confirmText="Publish"
        confirmStyle="normal"
      />
    </>
  )
}
