"use client"

import { useState, useRef, useEffect } from 'react'

const CATEGORIES = [
  "Sports", "Fashion", "Education", "Art", "Boxing", "Stocks"
]

export default function CategoryFilter({ 
  selectedCategories = [], 
  onCategoriesChange,
  buttonText = "Choose Category",
  showLabel = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  const filteredCategories = CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCategoryToggle = (category) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    onCategoriesChange(updated)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const displayText = selectedCategories.length > 0 
    ? `${selectedCategories.length} selected`
    : buttonText

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border whitespace-nowrap"
        style={{
          width: '163px',
          height: '32px',
          borderRadius: '4px',
          borderWidth: '1px',
          borderColor: '#E5E7EB',
          opacity: 1,
          gap: '10px',
          padding: '10px 16px',
          fontFamily: 'Public Sans',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '150%',
          letterSpacing: '0%',
          color: '#2E2E2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <span className="md:inline max-md:hidden">{displayText}</span>
        <span className="md:hidden max-md:inline">
          {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Category'}
        </span>
        <img 
          src="/images/icons/down.svg" 
          alt="dropdown" 
          style={{
            width: '9px',
            height: '9px',
            opacity: 1,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </button>

      {isOpen && (
        <div 
          className="absolute top-[calc(100%+8px)] right-0 bg-white flex flex-col z-[100]"
          style={{
            width: '201px',
            borderRadius: '8px',
            border: '1px solid #EDEDED',
            boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.07)',
            padding: '8px',
            gap: '4px'
          }}
        >
          <div 
            className="flex flex-col gap-1"
          >
            {filteredCategories.map((category) => (
              <div
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  fontFamily: 'Public Sans',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  color: selectedCategories.includes(category) ? '#3400A3' : '#B0B0B0'
                }}
              >
                <span className="flex-1">{category}</span>
              </div>
            ))}
            
            {filteredCategories.length === 0 && (
              <div 
                className="text-center py-4"
                style={{
                  fontFamily: 'Public Sans',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '150%',
                  color: '#B0B0B0'
                }}
              >
                No categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
