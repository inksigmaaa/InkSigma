"use client"

import { useState } from "react"

export default function ArticleDropdown({ status, onEdit, onDelete, onRestore }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = (action) => {
    setIsOpen(false)
    action()
  }

  return (
    <div className="relative">
      <button
        className="w-8 h-8 bg-transparent border border-gray-200 cursor-pointer flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="4" r="1.5" fill="#6B7280" />
          <circle cx="10" cy="10" r="1.5" fill="#6B7280" />
          <circle cx="10" cy="16" r="1.5" fill="#6B7280" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-10 right-0 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-w-[220px] z-[100] overflow-hidden py-2 px-1">
            {status === 'draft' && (
              <>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(() => console.log('Publish'))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M16 9L2 2L5 9L2 16L16 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Publish
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(() => console.log('Statics'))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M2 14L6 10L10 12L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Statics
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(onEdit || (() => console.log('Edit')))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(onDelete || (() => console.log('Move to Trash')))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H11C11.5304 17 12.0391 16.7893 12.4142 16.4142C12.7893 16.0391 13 15.5304 13 15L14 5M6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H11C11.2652 2 11.5196 2.10536 11.7071 2.29289C11.8946 2.48043 12 2.73478 12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Move to Trash
                </button>
              </>
            )}

            {status === 'trash' && (
              <>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(() => console.log('Publish'))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M16 9L2 2L5 9L2 16L16 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Publish
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(onEdit || (() => console.log('Edit')))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(onRestore || (() => console.log('Restore')))}>
                  <img src="/images/icons/restore.svg" alt="restore" className="shrink-0" width="24" height="24" />
                  Restore
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(onDelete || (() => console.log('Delete Permanently')))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H11C11.5304 17 12.0391 16.7893 12.4142 16.4142C12.7893 16.0391 13 15.5304 13 15L14 5M6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H11C11.2652 2 11.5196 2.10536 11.7071 2.29289C11.8946 2.48043 12 2.73478 12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Delete
                </button>
              </>
            )}

            {(status === 'published' || status === 'review' || status === 'unpublished') && (
              <>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(() => console.log('Statics'))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M2 14L6 10L10 12L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Statics
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(onEdit || (() => console.log('Edit')))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(() => console.log('Copy'))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 6V4C12 3.46957 11.7893 2.96086 11.4142 2.58579C11.0391 2.21071 10.5304 2 10 2H4C3.46957 2 2.96086 2.21071 2.58579 2.58579C2.21071 2.96086 2 3.46957 2 4V10C2 10.5304 2.21071 11.0391 2.58579 11.4142C2.96086 11.7893 3.46957 12 4 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copy
                </button>
                <button className="flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] text-gray-700 bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" onClick={() => handleAction(onDelete || (() => console.log('Move to Trash')))}>
                  <svg width="24" height="24" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H11C11.5304 17 12.0391 16.7893 12.4142 16.4142C12.7893 16.0391 13 15.5304 13 15L14 5M6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H11C11.2652 2 11.5196 2.10536 11.7071 2.29289C11.8946 2.48043 12 2.73478 12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Move to Trash
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}