"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function PublishSuccessModal({ isOpen, onClose, onSeeLater, onViewInSite }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[489px] max-h-[90vh] p-0 border-none"
        showClose={true}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div 
          className="bg-[#FEFEFE] rounded border border-gray-200 shadow-lg relative flex flex-col items-center justify-center"
          style={{ 
            width: '100%',
            height: '323.63px',
            padding: '56px 40px'
          }}
        >
          {/* Content container */}
          <div 
            className="flex flex-col items-center justify-center text-center"
            style={{ 
              width: '357px', 
              gap: '16px'
            }}
          >
            {/* Icon */}
            <div className="relative mb-4 h-[68px] w-[64px]">
              <img
                src="/images/icons/paper-plane.svg"
                alt=""
                aria-hidden="true"
                className="h-[60px] w-[60px] object-contain"
              />
              <div className="absolute bottom-[2px] right-[4px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#6ED564] shadow-[0px_4px_10px_rgba(110,213,100,0.22)]">
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
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
            <DialogTitle className="text-2xl font-bold text-black mb-2">
              Successfully Published
            </DialogTitle>

            {/* Description */}
            <DialogDescription className="text-gray-500 text-base mb-6">
              Your blog is successfully Published, Click the below button to view in site
            </DialogDescription>

            {/* Buttons container */}
            <div className="flex gap-2 justify-center w-full max-w-[229px]">
              {/* See Later button */}
              <button
                onClick={onSeeLater}
                className="flex items-center justify-center bg-[#F8F8F8] border border-[#ECECEC] text-gray-700 hover:bg-gray-200 transition-colors rounded text-sm font-medium text-center leading-none"
                style={{
                  width: '111px',
                  height: '32px'
                }}
              >
                See Later
              </button>

              {/* View in Site button */}
              <button
                onClick={onViewInSite}
                className="flex items-center justify-center text-white hover:opacity-90 transition-opacity rounded text-sm font-medium text-center leading-none"
                style={{
                  width: '110px',
                  height: '32px',
                  background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                  boxShadow: '0px 4px 8px 0px #EADBF9'
                }}
              >
                View in Site
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
