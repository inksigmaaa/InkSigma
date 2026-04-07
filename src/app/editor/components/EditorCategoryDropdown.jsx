"use client"

import { useState, useRef, useEffect } from 'react'

const CATEGORIES = [
  "Technology", "Education", "Health & Wellness", "Lifestyle", "Finance", "Entertainment", "Business", "Personal Development", "Travel"
  , "Food & Recipes"
]

export default function EditorCategoryDropdown({
  selectedCategories = [],
  onCategoriesChange,
  buttonText = "Choose Category"
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
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
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border border-[#EAEAEA] rounded whitespace-nowrap w-[115px] h-8 gap-[10px] px-4 py-[10px] text-sm font-normal leading-normal tracking-normal text-[#2E2E2E] cursor-pointer transition-all duration-200 ease-in-out hover:border-gray-300"
      >
        <span>{displayText}</span>
        <img
          src="/images/icons/down.svg"
          alt="dropdown"
          className={`flex items-center justify-center w-[9px] h-[9px] opacity-100 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-white flex flex-col w-[283px] rounded-lg border border-[#EDEDED] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.07)] p-2 gap-1 z-[9999]"
        >
          <div className="flex gap-1 w-[267px] h-[30px]">
            <input
              type="text"
              placeholder="Search Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 w-[204px] h-[30px] rounded border border-[#EAEAEA] px-4 py-1 bg-[#F8F8F8] font-normal text-sm leading-[150%] text-[#2E2E2E] outline-none focus:border-gray-400 transition-colors"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="w-[59px] h-[30px] rounded px-[10px] py-[10px] bg-[#F3EEFF] border-none cursor-pointer font-medium text-sm leading-[80%] text-[#A941FB] hover:bg-[#E8D5FF] transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {filteredCategories.map((category) => {
              const isSelected = selectedCategories.includes(category)
              return (
                <div
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 transition-colors font-normal text-sm leading-[150%] ${isSelected ? 'text-[#3400A3]' : 'text-[#2E2E2E]'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 rounded border border-[#C0C0C0] accent-[#3400A3] flex-shrink-0 cursor-pointer"
                  />
                  <span className="flex-1">{category}</span>
                </div>
              )
            })}

            {filteredCategories.length === 0 && (
              <div className="text-center py-4 font-normal text-sm leading-[150%] text-[#2E2E2E]">
                No categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
