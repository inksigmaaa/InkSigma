"use client"

import { useState } from "react"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import ReviewCard from "./ReviewCard"
import { useVerifyBanner } from "@/hooks/useVerifyBanner"

export default function ReviewPageClient({ articles }) {
  const [selectedArticles, setSelectedArticles] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // Check if verify banner should be shown
  const showVerifyBanner = useVerifyBanner()

  const handleSelectionChange = (articleId, isSelected) => {
    setSelectedArticles(prev => ({
      ...prev,
      [articleId]: isSelected
    }))
  }

  const handleRevertToDraft = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmRevert = () => {
    // Add your revert to draft logic here
    console.log("Reverting to draft...")
    setShowConfirmModal(false)
    // You can add actual API call or state update logic here
  }

  const handleCloseModal = () => {
    setShowConfirmModal(false)
  }

  // Dynamic top position based on verify banner visibility (added 60px for Review header)
  const topPosition = showVerifyBanner ? 'top-[235px]' : 'top-[180px]';
  const mobileTopPosition = showVerifyBanner ? 'max-md:top-[240px]' : 'max-md:top-[140px]';

  return (
    <>
      <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
        <div className="ml-0 md:ml-[185px] space-y-4">
          {articles && articles.map((article) => (
            <ReviewCard 
              key={article.id}
              article={article}
              isSelected={selectedArticles[article.id] || false}
              onSelectionChange={(isSelected) => handleSelectionChange(article.id, isSelected)}
              onRevertToDraft={handleRevertToDraft}
            />
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmRevert}
        title="Are you sure you want to move the blog back to Draft?"
        description="This action will save the blog as a draft and make it unavailable for publishing until further updates are made."
        confirmText="Confirm"
        cancelText="Close"
      />
    </>
  )
}