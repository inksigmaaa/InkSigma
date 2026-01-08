"use client"

import { useState } from "react"
import ScheduleHeader from "./ScheduleHeader"
import ScheduleControls from "./ScheduleControls"
import SchedulePostCard from "./SchedulePostCard"
import ConfirmModal from "../confirmModal/ConfirmModal"

export default function SchedulePageClient({ posts }) {
  const [selectedPosts, setSelectedPosts] = useState([])
  const [category, setCategory] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [deletePostId, setDeletePostId] = useState(null)
  const [isBulkAction, setIsBulkAction] = useState(false)

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPosts(posts.map(p => p.id))
    } else {
      setSelectedPosts([])
    }
  }

  const handleSelectPost = (postId, checked) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, postId])
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== postId))
    }
  }

  const handleDeletePost = (postId) => {
    setDeletePostId(postId)
    setIsBulkAction(false)
    setShowDeleteModal(true)
  }

  const handleBulkDelete = () => {
    if (selectedPosts.length > 0) {
      setIsBulkAction(true)
      setShowDeleteModal(true)
    }
  }

  const handleBulkDraft = () => {
    if (selectedPosts.length > 0) {
      setIsBulkAction(true)
      setShowDraftModal(true)
    }
  }

  const confirmDelete = () => {
    if (isBulkAction) {
      console.log("Bulk deleting posts:", selectedPosts)
      setSelectedPosts([])
    } else {
      console.log("Deleting post:", deletePostId)
    }
    setShowDeleteModal(false)
    setDeletePostId(null)
  }

  const confirmDraft = () => {
    console.log("Moving to draft:", selectedPosts)
    setSelectedPosts([])
    setShowDraftModal(false)
  }

  const topPosition = 'top-[160px]';
  const mobileTopPosition = 'max-md:top-[120px]';

  return (
    <>
      <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
        <div className="ml-0 md:ml-[185px]">
          <div className="space-y-6">
            <ScheduleHeader 
              category={category}
              onCategoryChange={setCategory}
            />

            <ScheduleControls 
              selectedPosts={selectedPosts}
              totalPosts={posts.length}
              onSelectAll={handleSelectAll}
              category={category}
              onCategoryChange={setCategory}
              onBulkDraft={handleBulkDraft}
              onBulkDelete={handleBulkDelete}
            />

            <div className="space-y-4">
              {posts.map((post) => (
                <SchedulePostCard
                  key={post.id}
                  post={post}
                  isSelected={selectedPosts.includes(post.id)}
                  onSelectPost={handleSelectPost}
                  onDelete={() => handleDeletePost(post.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletePostId(null)
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to put it in trash?"
        message={isBulkAction ? `${selectedPosts.length} post(s) will be put into trash and can be restored later` : "This will be put into trash and can be restored later"}
        confirmText="Move to Trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false)
        }}
        onConfirm={confirmDraft}
        title="Move to Draft?"
        message={`${selectedPosts.length} post(s) will be moved to drafts`}
        confirmText="Move to Draft"
        confirmStyle="normal"
      />
    </>
  )
}
