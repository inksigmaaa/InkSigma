"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock } from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"

export default function ReviewPage() {
  const [selectedPosts, setSelectedPosts] = useState([])
  const [category, setCategory] = useState("")

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

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      
      <div className="absolute left-1/2 -translate-x-1/2 top-[220px] w-full max-w-[1034px] z-20 px-5">
        <div className="ml-0 md:ml-[185px]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <h1 className="text-base font-bold text-gray-800">Review</h1>
              </div>
              
              {/* Category Select - Mobile only */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[140px] md:hidden">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="humour">Humour</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Controls Row - Desktop only */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer w-[123px] h-10 bg-[#F8F8F8] rounded px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === posts.length && posts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-[18px] h-[18px] cursor-pointer accent-purple-600"
                  />
                  <span className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-500">Select all</span>
                </label>
              </div>
              
              {/* Category Select - Desktop */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="humour">Humour</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posts List */}
            <div className="space-y-4 mt-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                      className="w-[18px] h-[18px] cursor-pointer accent-purple-600 mt-1 shrink-0"
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
                          >
                            Reject
                          </Button>
                          <Button 
                            variant="outline" 
                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
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
                        >
                          ✕
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 h-12 w-12"
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
      </div>
    </>
  )
}
