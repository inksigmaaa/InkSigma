"use client"

import { useState } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import ArticleContainer from "../components/articleContainer/ArticleContainer"
import Verify from "../components/verify/Verify"

export default function DraftPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectAll, setSelectAll] = useState(false)

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

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <div className="absolute left-1/2 -translate-x-1/2 top-[215px] w-full max-w-[1034px] z-20 px-5">
        <div className="ml-0 md:ml-[185px]">
          <div className="flex items-center mb-4">
            <h1 className="m-0 font-bold text-base leading-6 text-orange-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Drafts
            </h1>
          </div>

          <div className="flex items-center justify-between gap-5 mb-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => setSelectAll(!selectAll)}
                  className="w-[18px] h-[18px] cursor-pointer accent-violet-500"
                />
                <span className="font-bold text-base leading-6 text-gray-500">Select all</span>
              </label>
              <button title="Send" className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300">
                <img src="/images/icons/Publish.svg" alt="send" className="w-5 h-5" />
              </button>
              <button title="Delete" className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300">
                <img src="/images/icons/trash1.svg" alt="delete" className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="min-w-[180px] flex items-center justify-between gap-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer transition hover:border-violet-500"
              >
                Choose Category
                <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                      <label key={category} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="w-5 h-5 cursor-pointer accent-violet-500 shrink-0"
                        />
                        <span className="text-sm text-gray-600">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4 pb-[85px]">
            <ArticleContainer
              status="draft"
              title="Title of the Blog will be in this area"
              description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
              categories={["Sports", "Humour", "History"]}
              postedTime="Posted 2 mins ago"
            />
            <ArticleContainer
              status="draft"
              title="Title of the Blog will be in this area"
              description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
              categories={["Sports", "Humour", "History"]}
              postedTime="Posted 2 mins ago"
            />
            <ArticleContainer
              status="draft"
              title="Title of the Blog will be in this area"
              description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
              categories={["Sports", "Humour", "History"]}
              postedTime="Posted 2 mins ago"
            />
          </div>
        </div>
      </div>
    </>
  )
}
