"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import EditorSidebar from "../components/sidebar/EditorSidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import PageTransition from "@/components/PageTransition"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"
import AuthGuard from "@/components/auth/AuthGuard" 

export default function DraftPage() {
  const { articles, loading, moveToTrashStatus, bulkMoveToTrashStatus, bulkPublish, publishArticle, loadUserArticles } = useArticles()
  const { currentPublication } = usePublication()
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasLoadedRef = useRef(false)

  // Only load articles if they haven't been loaded yet or if refresh param is present
  useEffect(() => {
    const needsRefresh = searchParams.get('refresh') === 'true';

    if (needsRefresh || (articles.length === 0 && !loading && !hasLoadedRef.current)) {
      console.log('[DraftPage] Loading articles...');
      hasLoadedRef.current = true;
      loadUserArticles();
    }
  }, [searchParams, articles.length, loading, loadUserArticles]);

  // Clean up refresh param from URL if present
  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      router.replace('/draft', { scroll: false });
    }
  }, [searchParams, router]);
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [actionArticleId, setActionArticleId] = useState(null)
  const [isBulkAction, setIsBulkAction] = useState(false)

  const draftArticles = useMemo(() => {
    return articles
      .filter(article => {
        const isDraft = article.status === 'draft'
        
        // If we are in a publication context, only show articles for that publication
        if (currentPublication?.id) {
          return isDraft && article.publicationId === currentPublication.id
        }
        
        // If not in a publication context (e.g. dashboard), show all drafts
        return isDraft
      })
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
  }, [articles, currentPublication])

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
      } else if (actionArticleId) {
        console.log('Calling publishArticle with ID:', actionArticleId)
        const result = await publishArticle(actionArticleId)
        console.log('Publish result:', result)
      } else {
        console.error('No article ID to publish!')
      }

      setShowPublishModal(false)
      setActionArticleId(null)
      console.log('=== PUBLISH FLOW END ===')
    } catch (error) {
      console.error('=== PUBLISH ERROR ===')
      console.error('Error publishing:', error)
      console.error('Error details:', error.message, error.stack)
    }
  }


  const canPublish = currentPublication?.isOwner || currentPublication?.role === 'admin'

  const actionButtons = [
    ...(canPublish ? [{
      title: "Publish",
      icon: "/images/icons/share.svg",
      onClick: handleBulkPublish,
      disabled: selectedArticles.length === 0
    }] : []),
    {
      title: "Delete",
      icon: "/images/icons/trash2.svg",
      onClick: handleBulkDelete,
      disabled: selectedArticles.length === 0
    }
  ]

  return (
    <>
    <AuthGuard />
      <NavbarLoggedin />
      {canPublish ? <Sidebar /> : <EditorSidebar />}
      <Verify />
      <PageTransition>
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