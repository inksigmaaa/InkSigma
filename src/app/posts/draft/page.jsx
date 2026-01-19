"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import AuthGuard from "@/components/auth/AuthGuard"
import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import Verify from "../../components/verify/Verify"
import PersonalArticles from "../../components/personalArticles/personalArticles"
import ConfirmModal from "../../components/confirmModal/ConfirmModal"
import PageTransition from "@/components/PageTransition"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"

export default function PostsDraftPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { articles, moveToTrashStatus, moveToDraft, loadUserArticles, submitForReview } = useArticles()
  const { currentPublication } = usePublication()
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [actionArticleId, setActionArticleId] = useState(null)
  const hasLoadedRef = useRef(false)

  // Load articles filtered by current publication when page mounts or publication changes
  useEffect(() => {
    const needsRefresh = searchParams.get('refresh') === 'true'
    
    if (needsRefresh || (!hasLoadedRef.current && currentPublication?.id)) {
      console.log('[PostsDraftPage] Loading draft articles for publication:', currentPublication?.id)
      hasLoadedRef.current = true
      loadUserArticles(currentPublication?.id)
    }
  }, [loadUserArticles, currentPublication?.id, searchParams])

  // Clean up refresh param from URL if present
  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      router.replace('/posts/draft', { scroll: false })
    }
  }, [searchParams, router])

  // Filter draft articles
  const draftArticles = useMemo(() => {
    return articles
      .filter(article => article.status === 'draft')
      .map(article => ({
        ...article,
        onDelete: () => {
          setActionArticleId(article.id)
          setShowDeleteModal(true)
        },
        onReview: () => {
          setActionArticleId(article.id)
          setShowReviewModal(true)
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

  const confirmReview = async () => {
    try {
      if (actionArticleId) {
        await submitForReview(actionArticleId)
      }
      setShowReviewModal(false)
      setActionArticleId(null)
    } catch (error) {
      console.error('Error submitting for review:', error)
    }
  }

  return (
    <AuthGuard>
      <NavbarLoggedin />
      <MemberSidebar />
      <Verify />
      <PageTransition>
        <PersonalArticles
          title="Draft"
          titleColor="#A34200"
          articles={draftArticles}
          emptyMessage="No draft articles yet"
          showSelectAll={false}
          showActions={false}
          selectedArticles={selectedArticles}
          onArticleSelect={handleArticleSelect}
        />
      </PageTransition>

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
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setActionArticleId(null)
        }}
        onConfirm={confirmReview}
        title="Submit for Review?"
        message="This article will be submitted for review by editors/admins"
        confirmText="Submit for Review"
        confirmStyle="normal"
      />

    </AuthGuard>
  )
}