"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock } from "lucide-react"

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

export default function ReviewArticles({ title = "Review" }) {
  const [selectedPosts, setSelectedPosts] = useState([])
  const [category, setCategory] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])

  // Mock data - replace with actual data fetching
  const posts = [
    {
      id: 1,
      title: "Journey Beyond",
      author: "Mocas Nicota",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024"
    },
    {
      id: 2,
      title: "Wanderlust Diaries",
      author: "John Cena",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024"
    },
    {
      id: 3,
      title: "Globe Trotter",
      author: "Randy Ortan",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024"
    }
  ]

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPosts(posts.map(p => p.id))
    } else {
      setSelectedPosts([])
    }
  }

  const handleSelectPost = (postId, checked) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, postId])
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== postId))
    }
  }

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleAccept = (postId) => {
    console.log("Accepting post:", postId)
    // Add accept logic here
  }

  const handleReject = (postId) => {
    console.log("Rejecting post:", postId)
    // Add reject logic here
  }

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-[215px] w-full max-w-[1034px] z-20 px-5">
      <div className="ml-0 md:ml-[185px]">
        
        {/* Mobile header */}
        <div className="flex flex-col justify-between gap-4 mb-6 px-2 md:hidden">
          <h1 className="font-bold text-lg leading-8 text-gray-800 m-0 flex items-center gap-3">
            <span className="w-3 h-3 bg-violet-500 rounded-full shrink-0"></span>
            {title}
          </h1>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="min-w-[180px] flex items-center justify-between gap-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer transition hover:border-violet-500 max-[410px]:min-w-[120px] max-[410px]:text-xs max-[410px]:px-3 max-[410px]:py-2 max-[360px]:min-w-[100px] max-[360px]:px-2.5 max-[360px]:py-1.5"
            >
              Category
              <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0 max-[410px]:w-3.5 max-[410px]:h-3.5">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100] max-[410px]:w-72 max-[360px]:w-64">
                <div className="p-4 flex gap-3 border-b border-gray-200 max-[410px]:p-3 max-[410px]:gap-2">
                  <input
                    type="text"
                    placeholder="Search Category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-violet-500 focus:bg-white placeholder:text-gray-400 max-[410px]:text-xs max-[410px]:px-2 max-[410px]:py-1.5"
                  />
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-sm font-medium bg-violet-100 text-violet-600 rounded-lg px-6 py-2 whitespace-nowrap transition-colors hover:bg-violet-200 max-[410px]:text-xs max-[410px]:px-4 max-[410px]:py-1.5"
                  >
                    Apply
                  </button>
                </div>

                <div className="p-3 overflow-y-auto flex-1 max-[410px]:p-2">
                  {filteredCategories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50 max-[410px]:gap-2 max-[410px]:px-2 max-[410px]:py-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-5 h-5 cursor-pointer accent-violet-500 shrink-0 max-[410px]:w-4 max-[410px]:h-4"
                      />
                      <span className="text-sm text-gray-600 max-[410px]:text-xs">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex flex-col gap-4">
          <div className="flex items-center">
            <h1 className="m-0 font-bold text-base leading-6 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
              {title}
            </h1>
          </div>

          <div className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPosts.length === posts.length && posts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-[18px] h-[18px] cursor-pointer accent-violet-500"
                />
                <span className="font-bold text-base leading-6 text-gray-500">
                  Select all
                </span>
              </label>
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
                      <label
                        key={category}
                        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50"
                      >
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
        </div>

        {/* Posts List */}
        <div className="mt-6 space-y-4 pb-[85px]">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
              {/* Desktop Layout */}
              <div className="hidden md:flex items-start gap-4">
                <Checkbox 
                  checked={selectedPosts.includes(post.id)}
                  onCheckedChange={(checked) => handleSelectPost(post.id, checked)}
                />
                
                <div className="flex-1 mt-[-5px]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 text-sm underline">
                        {post.author}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleReject(post.id)}
                      >
                        Reject
                      </Button>
                      <Button 
                        variant="outline" 
                        className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                        onClick={() => handleAccept(post.id)}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-2 flex-wrap">
                      {post.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-sm underline">
                      {post.author}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 h-12 w-12"
                      onClick={() => handleReject(post.id)}
                    >
                      ✕
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 h-12 w-12"
                      onClick={() => handleAccept(post.id)}
                    >
                      ✓
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-4">
                  {post.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}