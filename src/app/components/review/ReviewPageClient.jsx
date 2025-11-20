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

  return (
    <>
      <div className={`pt-[112px] min-h-screen bg-white max-md:pt-[90px] pb-20 max-md:pb-24 relative z-[1] ${showVerifyBanner ? 'mt-[76px]' : ''}`}>
        <div className="max-w-[1034px] mx-auto px-5 max-md:px-0">
          <div className="ml-[155px] max-md:ml-0 bg-white  max-md:border-r-0 min-h-screen">
            {/* Header */}
            <div className={`flex items-center justify-between  py-6 px-8 max-md:px-4 bg-white sticky z-[20] ${showVerifyBanner ? 'top-[188px] max-md:top-[166px]' : 'top-[112px] max-md:top-[90px]'}`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h1 className="text-xl font-bold text-gray-900">Review</h1>
              </div>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="all">Choose Category</option>
                <option value="sports">Sports</option>
                <option value="humour">Humour</option>
                <option value="history">History</option>
              </select>
            </div>

            {/* Articles List */}
            <div className="py-6 px-8 space-y-6 max-md:px-4 bg-white">
              {articles.map((article) => (
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