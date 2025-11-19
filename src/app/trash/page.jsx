"use client"

import { useState } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import PersonalArticleContainer from "../components/personalArticleContainer/PersonalArticleContainer"
import Verify from "../components/verify/Verify"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { Button } from "@/components/ui/button"

export default function TrashPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // 'bulk' or specific article id

  // Helper function to format date
  const formatDate = (date) => {
    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()

    const suffix = (day) => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
      }
    }

    return `${day}${suffix(day)} ${month}, ${year}`
  }

  const today = new Date()
  const todayFormatted = formatDate(today)

  // Mock articles for demo - using state so we can delete them
  const [articles, setArticles] = useState([
    { id: "1", title: "Title of the Blog will be in this area", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...", categories: ["Sports", "Humour", "History"], postedTime: todayFormatted },
    { id: "2", title: "Title of the Blog will be in this area", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...", categories: ["Sports", "Humour", "History"], postedTime: todayFormatted },
    { id: "3", title: "Title of the Blog will be in this area", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...", categories: ["Sports", "Humour", "History"], postedTime: todayFormatted }
  ])

  const selectAll = selectedArticles.length === articles.length && articles.length > 0

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

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(articles.map(a => a.id))
    }
  }

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, id])
    } else {
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedArticles.length > 0) {
      setDeleteTarget('bulk')
      setShowDeleteModal(true)
    }
  }

  const handleBulkRestore = () => {
    if (selectedArticles.length > 0) {
      setShowRestoreModal(true)
    }
  }

  const handleIndividualDelete = (id) => {
    setDeleteTarget(id)
    setShowDeleteModal(true)
  }

  const handleIndividualRestore = (id) => {
    console.log('Restore article:', id)
    // Remove from trash (in real app, this would call an API)
    setArticles(prev => prev.filter(article => article.id !== id))
  }

  const confirmDelete = () => {
    if (deleteTarget === 'bulk') {
      // Delete all selected articles
      setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)))
      setSelectedArticles([])
    } else {
      // Delete single article
      setArticles(prev => prev.filter(article => article.id !== deleteTarget))
      setSelectedArticles(prev => prev.filter(id => id !== deleteTarget))
    }
    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  const confirmRestore = () => {
    console.log('Restore articles:', selectedArticles)
    // Remove restored articles from trash
    setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)))
    setSelectedArticles([])
    setShowRestoreModal(false)
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <div className="absolute left-1/2 -translate-x-1/2 top-[215px] w-full max-w-[1034px] z-20 px-5">
        <div className="ml-0 md:ml-[185px]">
          <div className="flex items-center mb-4">
            <h1 className="m-0 font-bold text-base leading-6 text-red-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Trash
            </h1>
          </div>

          <div className="flex items-center justify-between gap-5 mb-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer w-[123px] h-8 bg-[#F8F8F8] rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-[18px] h-[18px] cursor-pointer accent-purple-600"
                />
                <span className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-500">Select all</span>
              </label>
              <Button
                variant="ghost"
                size="icon"
                title="Restore"
                disabled={selectedArticles.length === 0}
                onClick={handleBulkRestore}
              >
                <img src="/images/icons/restore.svg" alt="restore" className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                disabled={selectedArticles.length === 0}
                onClick={handleBulkDelete}
              >
                <img src="/images/icons/trash1.svg" alt="delete" className="w-5 h-5" />
              </Button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="min-w-[180px] flex items-center justify-between gap-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer transition hover:border-violet-500"
              >
                Choose Category
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
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
            {articles.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">No trash articles yet</p>
              </div>
            ) : (
              articles.map((article) => (
                <PersonalArticleContainer
                  key={article.id}
                  id={article.id}
                  status="trash"
                  title={article.title}
                  description={article.description}
                  categories={article.categories}
                  postedTime={article.postedTime}
                  isSelected={selectedArticles.includes(article.id)}
                  onSelect={handleArticleSelect}
                  onRestore={() => handleIndividualRestore(article.id)}
                  onDelete={() => handleIndividualDelete(article.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
        title="Delete permanently?"
        message={deleteTarget === 'bulk'
          ? `${selectedArticles.length} article(s) will be permanently deleted`
          : "This article will be permanently deleted"}
        confirmText="Delete permanently"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={confirmRestore}
        title="Restore articles?"
        message={`${selectedArticles.length} article(s) will be restored`}
        confirmText="Restore"
        confirmStyle="normal"
      />
    </>
  )
}