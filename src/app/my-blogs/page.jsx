"use client"

import { useState, useMemo } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"

export default function MyBlogsPage() {
  const { articles, moveToTrash } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionArticleId, setActionArticleId] = useState(null)

  const myArticles = useMemo(() => {
    return articles.map(article => ({
      ...article,
      onDelete: () => {
        setActionArticleId(article.id)
        setShowDeleteModal(true)
      }
    }))
  }, [articles])

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
        await moveToTrash(actionArticleId)
      }
      setShowDeleteModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error moving to trash:', error)
    }
  }

  return (
    <>
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
    </>
  )
}
