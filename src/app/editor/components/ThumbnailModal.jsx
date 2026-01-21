"use client"

import { useState, useRef, useEffect } from "react"

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={handleClose}
    >
      <div 
        className="w-[355px] h-[618px] rounded bg-white flex flex-col pt-6 pr-12 pb-12 pl-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner Content Area */}
        <div className="w-[258.5px] flex flex-col">
          {/* Title */}
          <div className="mb-6">
            <h2 className="font-['Public_Sans'] font-bold text-lg text-gray-900 mb-2">
              Add Thumbnail Image
            </h2>
            <p className="font-['Public_Sans'] font-normal text-sm text-gray-500 leading-[150%]">
              This thumbnail will be your Articles display image
            </p>
          </div>

          {/* Upload Area */}
          <div 
            onClick={handleUploadClick}
            className="w-[254px] h-[152px] border border-gray-200 rounded-lg flex flex-col items-center justify-center bg-gray-50 cursor-pointer mb-2 hover:border-gray-300 transition-colors"
          >
            {previewUrl ? (
              <div className="text-center">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-[100px] rounded"
                />
                <p className="text-xs text-gray-500 mt-2">Click to change</p>
              </div>
            ) : (
              <>
                <svg 
                  className="w-12 h-12 text-gray-300 mb-2"
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-['Public_Sans'] text-sm text-gray-400">
                  + Upload Thumbnail here
                </span>
              </>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Image Ratio */}
          <p className="font-['Public_Sans'] text-xs text-gray-400 mb-6">
            Image Ratio: 1.91:1 (W: 1200px H: 630px)
          </p>

          {/* Image Title */}
          <div className="w-[258.5px] flex flex-col mb-6">
            <label className="font-['Public_Sans'] font-semibold text-sm text-gray-900 mb-2">
              Image Title
            </label>
            <input
              type="text"
              placeholder="Enter your Image Title"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              className="w-full py-2 border-0 border-b border-gray-200 font-['Public_Sans'] text-sm text-gray-700 outline-none bg-transparent focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Alt Text */}
          <div className="w-[258.5px] flex flex-col mb-6">
            <label className="font-['Public_Sans'] font-semibold text-sm text-gray-900 mb-2">
              Alt text
            </label>
            <input
              type="text"
              placeholder="Enter alt Text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full py-2 border-0 border-b border-gray-200 font-['Public_Sans'] text-sm text-gray-700 outline-none bg-transparent focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex w-[259px] h-8 gap-2 mt-auto">
          <button
            onClick={handleClose}
            className="w-[104px] h-8 rounded bg-gray-100 border border-gray-200 font-['Public_Sans'] font-medium text-sm text-gray-600 cursor-pointer flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleAddImage}
            disabled={!selectedFile}
            className={`w-[151px] h-8 rounded border-none font-['Public_Sans'] font-medium text-sm text-white cursor-pointer flex items-center justify-center hover:opacity-80 transition-colors ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: '#000000' }}
          >
            Add image
          </button>
        </div>
      </div>
    </div>
  )
}
