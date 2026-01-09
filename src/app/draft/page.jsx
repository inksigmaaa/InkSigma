"use client"

import { useState, useMemo } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"

export default function DraftPage() {
  const { articles, moveToTrashStatus, bulkMoveToTrashStatus, bulkPublish, publishArticle } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [actionArticleId, setActionArticleId] = useState(null)
  const [isBulkAction, setIsBulkAction] = useState(false)

  const draftArticles = useMemo(() => {
    return articles
      .filter(article => article.status === 'draft')
      .map(article => ({
        ...article,
        onDelete: () => {
          setActionArticleId(article.id)
          setIsBulkAction(false)
          setShowDeleteModal(true)
        },
        onPublish: () => {
          setActionArticleId(article.id)
          setIsBulkAction(false)
          setShowPublishModal(true)
        }
      }))
  }, [articles])

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
      setIsBulkAction(true)
      setShowDeleteModal(true)
    }
  }

  const handleBulkPublish = () => {
    if (selectedArticles.length > 0) {
      setIsBulkAction(true)
      setShowPublishModal(true)
    }
  }

  const confirmDelete = async () => {
    try {
      if (isBulkAction) {
        await bulkMoveToTrashStatus(selectedArticles)
        setSelectedArticles([])
      } else if (actionArticleId) {
        await moveToTrashStatus(actionArticleId)
      }
      setShowDeleteModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error moving to trash:', error)
    }
  }

  const confirmPublish = async () => {
    try {
      console.log('=== PUBLISH FLOW START ===')
      console.log('Is bulk action:', isBulkAction)
      console.log('Action article ID:', actionArticleId)
      console.log('Selected articles:', selectedArticles)
      
      if (isBulkAction) {
        console.log('Calling bulkPublish with IDs:', selectedArticles)
        await bulkPublish(selectedArticles)
        setSelectedArticles([])
        alert(`${selectedArticles.length} article(s) published successfully!`)
      } else if (actionArticleId) {
        console.log('Calling publishArticle with ID:', actionArticleId)
        const result = await publishArticle(actionArticleId)
        console.log('Publish result:', result)
        alert('Article published successfully!')
      } else {
        console.error('No article ID to publish!')
        alert('Error: No article selected to publish')
      }
      
      setShowPublishModal(false)
      setActionArticleId(null)
      console.log('=== PUBLISH FLOW END ===')
    } catch (error) {
      console.error('=== PUBLISH ERROR ===')
      console.error('Error publishing:', error)
      console.error('Error details:', error.message, error.stack)
      alert(`Failed to publish: ${error.message}`)
    }
  }

  const actionButtons = [
    {
      title: "Publish",
      icon: "/images/icons/share.svg",
      onClick: handleBulkPublish,
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
        onClose={() => {
          setShowDeleteModal(false)
          setActionArticleId(null)
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message="This will be put into trash and can be restored later"
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false)
          setActionArticleId(null)
        }}
        onConfirm={confirmPublish}
        title="Publish article?"
        message={isBulkAction ? `${selectedArticles.length} article(s) will be published` : "This article will be published"}
        confirmText="Publish"
        confirmStyle="normal"
      />
    </>
  )
}