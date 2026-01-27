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
    
    // Special case for home - scroll to top
    if (sectionId === 'home') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    
    const element = document.getElementById(sectionId)
    if (element) {
      const headerHeight = 84; // Fixed header height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [sectionId])

  return scrollToSection
}