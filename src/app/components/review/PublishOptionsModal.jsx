"use client"

import { useState } from "react"

/**
 * Modal for admin to choose between publishing or storing to unpublished when accepting a review article
 */
export default function PublishOptionsModal({ 
  isOpen, 
  onClose, 
  onPublish, 
  onUnpublish,
  articleTitle = "this article"
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handlePublish = async () => {
    setIsProcessing(true)
    try {
      console.log('[PublishOptionsModal] Calling onPublish')
      await onPublish()
      console.log('[PublishOptionsModal] onPublish completed')
      // Parent handler will close modal after success
    } catch (error) {
      console.error('[PublishOptionsModal] Error publishing article:', error)
      // Keep modal open on error so user can try again
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnpublish = async () => {
    setIsProcessing(true)
    try {
      console.log('[PublishOptionsModal] Calling onUnpublish')
      await onUnpublish()
      console.log('[PublishOptionsModal] onUnpublish completed')
      // Parent handler will close modal after success
    } catch (error) {
      console.error('[PublishOptionsModal] Error storing to unpublished:', error)
      // Keep modal open on error so user can try again
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
      <div 
        className="relative flex flex-col items-center bg-white rounded-lg shadow-xl"
        style={{
          width: '420px',
          padding: '32px 40px',
          gap: '24px'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Article Accepted</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            What would you like to do with<br/>
            <span className="font-medium text-gray-700">"{articleTitle}"</span>?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={handleUnpublish}
            disabled={isProcessing}
            className="flex-1 h-10 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Store to Unpublished'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className="flex-1 h-10 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)'
            }}
          >
            {isProcessing ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
