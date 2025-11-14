"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock } from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export default function AuthorReviewPage() {
  const [isSelected, setIsSelected] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const article = {
    id: 1,
    title: "Journey Beyond",
    author: "Mocas Nicota",
    tags: ["Sports", "Humour", "History"],
    date: "FRI | 15 NOV, 2024",
    status: "Draft"
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
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      
      <div className="absolute left-1/2 -translate-x-1/2 top-[220px] w-full max-w-[1034px] z-20 px-5">
        <div className="ml-0 md:ml-[185px]">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-start justify-between">
              {/* Left side - Checkbox and Article Info */}
              <div className="flex items-start gap-4 flex-1">
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={setIsSelected}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {article.author}
                  </p>
                  
                  <div className="flex gap-2 flex-wrap">
                    {article.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side - Button and Date */}
              <div className="flex flex-col items-end gap-8 ml-6">
                <Button 
                  variant="outline"
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  onClick={handleRevertToDraft}
                >
                  Revert to Draft
                </Button>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{article.date}</span>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {article.author}
                  </h1>
                </div>
                <div className="ml-4">
                  <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded border">
                    {article.status}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-medium text-gray-700 border-b border-[#fff] pb-1 mb-6">
                  {article.title}
                </h2>
                
                <div className="flex gap-3 flex-wrap mb-8">
                  {article.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="h-4 w-4" />
                <span>{article.date}</span>
              </div>
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