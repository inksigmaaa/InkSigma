"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const categories = [
  "Fashion",
  "Space", 
  "Sports",
  "Art",
  "Humor",
  "Climate & Environment"
]

export function CategoryDropdown({ selectedCategories = [], onCategoriesChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef(null)

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCategoryToggle = (category) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    
    onCategoriesChange(updatedCategories)
  }

  const handleApply = () => {
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        style={{
          width: '163px',
          height: '32px',
          borderRadius: '4px',
          borderWidth: '1px',
          opacity: 1,
          gap: '10px',
          padding: '6px 16px'
        }}
      >
        <span 
          style={{
            fontFamily: 'Public Sans',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '150%',
            letterSpacing: '0%',
            color: '#374151'
          }}
        >
          {selectedCategories.length > 0 
            ? `${selectedCategories.length} selected`
            : "Category"
          }
        </span>
        <ChevronDown 
          className="transition-transform"
          style={{
            width: '9px',
            height: '4.5px',
            strokeWidth: '1.4px',
            opacity: 1,
            color: '#9CA3AF',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* Search Input and Apply Button */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search Category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleApply}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm rounded-md"
              >
                Apply
              </Button>
            </div>

            {/* Category List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredCategories.map((category) => (
                <div key={category} className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <label 
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </label>
                </div>
              ))}
              
              {filteredCategories.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No categories found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}