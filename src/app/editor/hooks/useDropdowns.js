import { useState, useEffect } from "react"

export function useDropdowns() {
  const [showListMenu, setShowListMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const closeAllDropdowns = () => {
    setShowListMenu(false)
    setShowAlignMenu(false)
    setShowHeadingMenu(false)
    setShowAdvancedOptions(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target
      const isInsideDropdown = target.closest('.dropdown-container')
      
      if (!isInsideDropdown) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return {
    showListMenu,
    setShowListMenu,
    showAlignMenu,
    setShowAlignMenu,
    showHeadingMenu,
    setShowHeadingMenu,
    showAdvancedOptions,
    setShowAdvancedOptions,
    closeAllDropdowns,
  }
}
