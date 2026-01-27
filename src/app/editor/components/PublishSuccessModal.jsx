"use client"

import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export default function PublishSuccessModal({ isOpen, onClose, blogSlug, blogTitle }) {
  const router = useRouter()

  if (!isOpen) return null

  const handleSeeLateer = () => {
    onClose()
    router.push('/published')
  }

  const handleViewInSite = () => {
    onClose()
    // Navigate to blog read page
    router.push(`/view-site/blog/${blogSlug}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] px-4">
      <div 
        className="bg-[#FEFEFE] rounded border border-gray-200 shadow-lg relative flex flex-col items-center justify-center"
        style={{ 
          width: '489px', 
          height: '323.62744140625px',
          padding: '56px 40px'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Content container */}
        <div 
          className="flex flex-col items-center justify-center text-center h-full"
          style={{ 
            width: '357px', 
            height: '147.62744140625px',
            gap: '16px',
            margin: '0 auto'
          }}
        >
          {/* Icon - Paper plane with checkmark */}
          <div className="relative mb-4">
            {/* Paper plane icon */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-gray-400">
              <path 
                d="M46 2L20 28L14 22" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                transform="translate(8, 8) scale(0.8)"
              />
              <path 
                d="M2 2L22 12L12 32L2 2Z" 
                fill="currentColor"
                transform="translate(8, 8) scale(0.8)"
              />
            </svg>
            {/* Green checkmark */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path 
                  d="M2 6L5 9L10 3" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-black mb-2">
            Successfully Published
          </h2>

          {/* Description */}
          <p className="text-gray-500 text-base mb-6">
            Your blog is successfully Published, Click the below button to view in site
          </p>

          {/* Buttons container */}
          <div 
            className="flex gap-2 justify-center"
            style={{ 
              width: '229px', 
              height: '32px'
            }}
          >
            {/* See Later button */}
            <button
              onClick={handleSeeLateer}
              className="bg-[#F8F8F8] border border-[#ECECEC] text-gray-700 hover:bg-gray-200 transition-colors rounded text-sm font-medium flex items-center justify-center"
              style={{
                width: '111px',
                height: '32px',
                padding: '8px 16px'
              }}
            >
              See Later
            </button>

            {/* View in Site button */}
            <button
              onClick={handleViewInSite}
              className="text-white hover:opacity-90 transition-opacity rounded text-sm font-medium flex items-center justify-center"
              style={{
                width: '110px',
                height: '32px',
                padding: '8px 12px',
                background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                boxShadow: '0px 4px 8px 0px #EADBF9'
              }}
            >
              View in Site
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}