"use client"

import { useState, useEffect, useRef } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Verify from "../components/verify/Verify"
import ReviewPageClient from "../components/review/ReviewPageClient"
import MemberSidebar from "../membersidebar/MemberSidebar"
import { useVerifyBanner } from "@/hooks/useVerifyBanner"

const categories = [
  "Agriculture", "Art & Illustration", "Business", "Climate & Environment",
  "Comics and Anime", "Crypto & Web-3", "Design", "Education",
  "Entertainment", "Faith & Spiritual", "Fashion & Beauty", "Fiction",
  "Finance & Economics", "Food & Drink", "Games", "Health & Wellness",
  "History", "Humor", "Law", "Literature", "Marketing", "Music",
  "News", "NSFW", "Parenting & Family", "Philosophy", "Poetry",
  "Politics", "Psychology", "Relationships", "Romance", "Science",
  "Space", "Sports", "Startups & Companies", "Technology", "Travel"
]

export default function AuthorReviewPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const dropdownRef = useRef(null)
  
  // Check if verify banner should be shown
  const showVerifyBanner = useVerifyBanner()
  // This could come from props, API call, or database in a real app
  const articles = [
    {
      id: 1,
      title: "Journey Beyond",
      author: "Mocas Nicota",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
      status: "Draft",
      avatar: "S"
    },
    {
      id: 2,
      title: "Wanderlust Diaries",
      author: "John Cena",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
      status: "Draft"
    },
    {
      id: 3,
      title: "Globe Trotter",
      author: "Randy Ortan",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
      status: "Draft"
    }
  ]

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Dynamic top position for Review header based on verify banner visibility
  // Verify banner is at top-[128px] with ~70px height, so header should be at ~205px
  const headerTopPosition = showVerifyBanner ? 'top-[205px]' : 'top-[120px]'
  const mobileHeaderTopPosition = showVerifyBanner ? 'max-md:top-[185px]' : 'max-md:top-[120px]'

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <Verify />
      
      {/* Review Header */}
      <div className={`fixed ${headerTopPosition} ${mobileHeaderTopPosition} left-0 right-0 bg-white `}>
        <div className="max-w-[1034px] mx-auto px-5">
          <div className="ml-0 md:ml-[185px] py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h1 className="text-lg font-semibold text-gray-900">Review</h1>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between bg-white border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                style={{
                  minWidth: '163px',
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
                    color: '#6B7280'
                  }}
                >
                  Choose Category
                </span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  className="transition-transform flex-shrink-0"
                  style={{
                    strokeWidth: '1.4px',
                    opacity: 1,
                    color: '#9CA3AF',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100]">
                  <div className="p-4 flex gap-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search Category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-violet-500 focus:bg-white placeholder:text-gray-400"
                    />
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-sm font-medium bg-violet-100 text-violet-600 rounded-lg px-6 py-2 whitespace-nowrap transition-colors hover:bg-violet-200"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="p-3 overflow-y-auto flex-1">
                    {filteredCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="cursor-pointer accent-violet-500 shrink-0"
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span className="text-sm text-gray-600">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReviewPageClient articles={articles} />
    </>
  )
}