"use client"

import { useState, useRef, useEffect } from 'react'

const CATEGORIES = [
  "Technology", "Education", "Health & Wellness", "Lifestyle", "Finance", "Entertainment", "Business", "Personal Development", "Travel"
  , "Food & Recipes"]

export default function CategoryFilter({
  selectedCategories = [],
  onCategoriesChange,
  buttonText = "Choose Category",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between bg-white border border-gray-200 whitespace-nowrap w-[163px] h-8 rounded gap-[10px] px-4 py-[10px] font-normal text-sm leading-[150%] transition-all duration-200 ease-in-out ${disabled
            ? 'text-gray-300 cursor-not-allowed opacity-60'
            : 'text-[#2E2E2E] cursor-pointer hover:border-gray-300'
          }`}
      >
        <span className="md:inline max-md:hidden">{displayText}</span>
        <span className="md:hidden max-md:inline">
          {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Category'}
        </span>
        <img
          src="/images/icons/down.svg"
          alt="dropdown"
          className={`w-[9px] h-[9px] opacity-100 flex items-center justify-center transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-white flex flex-col z-[100] w-[201px] rounded-lg border border-[#EDEDED] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.07)] p-2 gap-1">
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 transition-colors font-normal text-sm leading-[150%] ${selectedCategories.includes(category) ? 'text-[#3400A3]' : 'text-[#B0B0B0]'
                  }`}
              >
                <span className="flex-1">{category}</span>
              </div>
            ))}

            {CATEGORIES.length === 0 && (
              <div className="text-center py-4  font-normal text-sm leading-[150%] text-[#B0B0B0]">
                No categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
