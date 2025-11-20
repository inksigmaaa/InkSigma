"use client"

import { X } from "lucide-react"
import { Button } from "./button"

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  confirmText = "Confirm",
  cancelText = "Close"
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Content */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pr-8">
            {title}
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {description}
          </p>
          
          {/* Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              {cancelText}
            </Button>
            
            <Button
              onClick={onConfirm}
              className="px-8 py-2 bg-black text-white hover:bg-gray-800"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}