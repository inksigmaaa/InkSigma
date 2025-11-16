"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Upload } from "lucide-react"

export function ThumbnailModal({ isOpen, onClose, onImageAdd }) {
  const [imageTitle, setImageTitle] = useState("")
  const [altText, setAltText] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleAddImage = () => {
    if (selectedFile) {
      onImageAdd({
        file: selectedFile,
        title: imageTitle,
        altText: altText,
        previewUrl: previewUrl
      })
      handleClose()
    }
  }

  const handleClose = () => {
    setImageTitle("")
    setAltText("")
    setSelectedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Thumbnail Image</h2>
            <p className="text-sm text-gray-500 mt-1">This thumbnail will be your Articles display image</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div className="space-y-2">
            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              {previewUrl ? (
                <div className="space-y-2">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-32 mx-auto rounded"
                  />
                  <p className="text-sm text-gray-600">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">+ Upload Thumbnail here</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">Image Ratio: 1.9:1 (W: 1200px H: 630px)</p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Image Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Image Title</label>
            <Input
              type="text"
              placeholder="Enter your Image Title"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Alt Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Alt text</label>
            <Input
              type="text"
              placeholder="Enter alt text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-6"
          >
            Close
          </Button>
          <Button
            onClick={handleAddImage}
            disabled={!selectedFile}
            className="bg-black text-white hover:bg-gray-800 px-6"
          >
            Add image
          </Button>
        </div>
      </div>
    </div>
  )
}