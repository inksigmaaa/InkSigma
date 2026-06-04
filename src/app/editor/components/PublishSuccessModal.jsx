"use client"

import { motion } from "motion/react"
import { EASE_INK, SPRING } from "@/lib/motion"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// Publishing is the emotional payoff of the whole product, so it gets a
// choreographed beat: the paper-plane lifts off, a green seal stamps in and
// draws its check, then the copy + actions rise into place.
const rise = (delay) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: EASE_INK, delay },
})

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
            {/* Icon — paper plane lifts off, seal stamps in */}
            <motion.div
              className="relative mb-4 h-[68px] w-[64px]"
              initial={{ opacity: 0, y: 14, rotate: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 17, delay: 0.04 }}
            >
              <img
                src="/images/icons/paper-plane.svg"
                alt=""
                aria-hidden="true"
                className="h-[60px] w-[60px] object-contain"
              />
              <motion.div
                className="absolute bottom-[2px] right-[4px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#6ED564] shadow-[0px_4px_10px_rgba(110,213,100,0.22)]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...SPRING, stiffness: 480, damping: 18, delay: 0.26 }}
              >
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                  <motion.path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, ease: EASE_INK, delay: 0.38 }}
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div {...rise(0.18)}>
              <DialogTitle className="text-2xl font-bold text-black mb-2">
                Successfully Published
              </DialogTitle>
            </motion.div>

            {/* Description */}
            <motion.div {...rise(0.26)}>
              <DialogDescription className="text-gray-500 text-base mb-6">
                Your blog is successfully Published, Click the below button to view in site
              </DialogDescription>
            </motion.div>

            {/* Buttons container */}
            <motion.div
              className="flex gap-2 justify-center w-full max-w-[229px]"
              {...rise(0.34)}
            >
              {/* See Later button */}
              <motion.button
                onClick={onSeeLater}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
                className="flex items-center justify-center bg-[#F8F8F8] border border-[#ECECEC] text-gray-700 hover:bg-gray-200 transition-colors rounded text-sm font-medium text-center leading-none"
                style={{
                  width: '111px',
                  height: '32px'
                }}
              >
                See Later
              </motion.button>

              {/* View in Site button */}
              <motion.button
                onClick={onViewInSite}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
                className="flex items-center justify-center text-white hover:opacity-90 transition-opacity rounded text-sm font-medium text-center leading-none"
                style={{
                  width: '110px',
                  height: '32px',
                  background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                  boxShadow: '0px 4px 8px 0px #EADBF9'
                }}
              >
                View in Site
              </motion.button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
