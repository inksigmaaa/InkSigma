"use client"

import { useState, useMemo } from "react"
import AuthGuard from "@/components/AuthGuard"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"

export default function MyBlogsPage() {
  const { articles, moveToTrashStatus, publishArticle, moveToDraft, unpublishArticle } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [showUnpublishModal, setShowUnpublishModal] = useState(false)
  const [showRepublishModal, setShowRepublishModal] = useState(false)
  const [actionArticleId, setActionArticleId] = useState(null)

  const myArticles = useMemo(() => {
    return articles.map(article => ({
      ...article,
      onDelete: () => {
        setActionArticleId(article.id)
        setShowDeleteModal(true)
      },
      onPublish: () => {
        setActionArticleId(article.id)
        setShowPublishModal(true)
      },
      onDraft: () => {
        setActionArticleId(article.id)
        setShowDraftModal(true)
      },
      onUnpublish: () => {
        setActionArticleId(article.id)
        setShowUnpublishModal(true)
      },
      onRepublish: () => {
        setActionArticleId(article.id)
        setShowRepublishModal(true)
      },
      onRestore: async () => {
        try {
          await moveToDraft(article.id)
        } catch (error) {
          console.error('Error restoring article:', error)
        }
      }
    }))
  }, [articles, moveToDraft])

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, id])
    } else {
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id))
    }
  }

  const confirmDelete = async () => {
    try {
      if (actionArticleId) {
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
      if (actionArticleId) {
        await publishArticle(actionArticleId)
      }
      setShowPublishModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error publishing article:', error)
    }
  }

  const confirmDraft = async () => {
    try {
      if (actionArticleId) {
        await moveToDraft(actionArticleId)
      }
      setShowDraftModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error moving to draft:', error)
    }
  }

  const confirmUnpublish = async () => {
    try {
      if (actionArticleId) {
        await unpublishArticle(actionArticleId)
      }
      setShowUnpublishModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error unpublishing article:', error)
    }
  }

  const confirmRepublish = async () => {
    try {
      if (actionArticleId) {
        await publishArticle(actionArticleId)
      }
      setShowRepublishModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error republishing article:', error)
    }
  }

  return (
    <AuthGuard>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PersonalArticles
        title="My Blogs"
        titleColor="#EC4899"
        articles={myArticles}
        emptyMessage="No Articles yet"
        showSelectAll={false}
        showActions={false}
        selectedArticles={selectedArticles}
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
        message="This article will be published"
        confirmText="Publish"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false)
          setActionArticleId(null)
        }}
        onConfirm={confirmDraft}
        title="Move to Draft?"
        message="This article will be moved to drafts"
        confirmText="Move to Draft"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showUnpublishModal}
        onClose={() => {
          setShowUnpublishModal(false)
          setActionArticleId(null)
        }}
        onConfirm={confirmUnpublish}
        title="Unpublish this article?"
        message="This article will be unpublished and moved to unpublished section"
        confirmText="Unpublish"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showRepublishModal}
        onClose={() => {
          setShowRepublishModal(false)
          setActionArticleId(null)
        }}
        onConfirm={confirmRepublish}
        title="Republish article?"
        message="This article will be republished"
        confirmText="Republish"
        confirmStyle="normal"
      />
    </AuthGuard>
  )
}
