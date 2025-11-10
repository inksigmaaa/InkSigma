"use client"

import { useState } from "react"
import styles from "./ArticleDropdown.module.css"

export default function ArticleDropdown({ status, onEdit, onDelete, onRestore }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = (action) => {
    setIsOpen(false)
    action()
  }

  return (
    <div className={styles.dropdownContainer}>
      <button 
        className={styles.dotsButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="4" r="1.5" fill="#6B7280"/>
          <circle cx="10" cy="10" r="1.5" fill="#6B7280"/>
          <circle cx="10" cy="16" r="1.5" fill="#6B7280"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            {status === 'draft' && (
              <>
                <button className={styles.dropdownItem} onClick={() => handleAction(() => console.log('Publish'))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M16 9L2 2L5 9L2 16L16 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Publish
                </button>
                <button className={styles.dropdownItem} onClick={() => handleAction(() => console.log('Statics'))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 14L6 10L10 12L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Statics
                </button>
                <button className={styles.dropdownItem} onClick={() => handleAction(onEdit || (() => console.log('Edit')))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
                <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => handleAction(onDelete || (() => console.log('Move to Trash')))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H11C11.5304 17 12.0391 16.7893 12.4142 16.4142C12.7893 16.0391 13 15.5304 13 15L14 5M6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H11C11.2652 2 11.5196 2.10536 11.7071 2.29289C11.8946 2.48043 12 2.73478 12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Move to Trash
                </button>
              </>
            )}

            {status === 'trash' && (
              <>
                <button className={styles.dropdownItem} onClick={() => handleAction(onEdit || (() => console.log('Edit')))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
                <button className={styles.dropdownItem} onClick={() => handleAction(onRestore || (() => console.log('Restore')))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 9C3 7.4087 3.63214 5.88258 4.75736 4.75736C5.88258 3.63214 7.4087 3 9 3C10.5913 3 12.1174 3.63214 13.2426 4.75736C14.3679 5.88258 15 7.4087 15 9C15 10.5913 14.3679 12.1174 13.2426 13.2426C12.1174 14.3679 10.5913 15 9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12L3 9L6 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Restore
                </button>
                <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => handleAction(onDelete || (() => console.log('Delete Permanently')))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H11C11.5304 17 12.0391 16.7893 12.4142 16.4142C12.7893 16.0391 13 15.5304 13 15L14 5M6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H11C11.2652 2 11.5196 2.10536 11.7071 2.29289C11.8946 2.48043 12 2.73478 12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete Permanently
                </button>
              </>
            )}

            {(status === 'published' || status === 'review' || status === 'unpublished') && (
              <>
                <button className={styles.dropdownItem} onClick={() => handleAction(() => console.log('Statics'))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 14L6 10L10 12L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Statics
                </button>
                <button className={styles.dropdownItem} onClick={() => handleAction(onEdit || (() => console.log('Edit')))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
                <button className={styles.dropdownItem} onClick={() => handleAction(() => console.log('Copy'))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6V4C12 3.46957 11.7893 2.96086 11.4142 2.58579C11.0391 2.21071 10.5304 2 10 2H4C3.46957 2 2.96086 2.21071 2.58579 2.58579C2.21071 2.96086 2 3.46957 2 4V10C2 10.5304 2.21071 11.0391 2.58579 11.4142C2.96086 11.7893 3.46957 12 4 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copy
                </button>
                <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => handleAction(onDelete || (() => console.log('Move to Trash')))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H11C11.5304 17 12.0391 16.7893 12.4142 16.4142C12.7893 16.0391 13 15.5304 13 15L14 5M6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2H11C11.2652 2 11.5196 2.10536 11.7071 2.29289C11.8946 2.48043 12 2.73478 12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
