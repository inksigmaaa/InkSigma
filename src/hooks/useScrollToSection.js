import { useCallback } from 'react'

/**
 * Custom hook for smooth scrolling to sections
 * @param {string} sectionId - The ID of the section to scroll to
 * @returns {Function} - Function to trigger the scroll
 */
export const useScrollToSection = (sectionId) => {
  const scrollToSection = useCallback((e) => {
    if (e) {
      e.preventDefault()
    }
    
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, [sectionId])

  return scrollToSection
}