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
import { 
  Trash2, 
  TrendingUp, 
  Edit, 
  Send, 
  Copy,
  AlertCircle,
  Clock,
  MoreVertical
} from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"

export default function SchedulePage() {
  const [selectedPosts, setSelectedPosts] = useState([])
  const [category, setCategory] = useState("")

  const posts = [
    {
      id: 1,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, ctetur ipiscing asdasda eqwateghjj6rrth...",
      tags: ["Climate & Environment", "Finance & Economics"],
      postedTime: "2nd Feb, 2023"
    },
    {
      id: 2,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, ctetur ipiscing asdasda eqwateghjj6rrth...",
      tags: ["Climate & Environment", "Finance & Economics"],
      postedTime: "2nd Feb, 2023"
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
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-gray-50">
          {/* Verification Alert - Full Width */}
          <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-purple-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm md:text-base">Your Account hasn't been verified yet.</span>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base whitespace-nowrap">
            Verify your Account
          </Button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto space-y-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <h1 className="text-2xl font-semibold">Scheduled</h1>
          </div>
          
          {/* Category Select - Mobile */}
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

        {/* Controls - Desktop only */}
        <div className="hidden md:flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all"
                checked={selectedPosts.length === posts.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
                Select all
              </label>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Choose Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="humour">Humour</SelectItem>
              <SelectItem value="history">History</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-cyan-100 text-cyan-700 text-xs font-medium px-3 py-1 rounded">
                  Scheduled
                </div>
                
                {/* Three-dot menu for mobile */}
                <Button variant="ghost" size="icon" className="md:hidden text-gray-400">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-start gap-4">
                <Checkbox 
                  checked={selectedPosts.includes(post.id)}
                  onCheckedChange={(checked) => handleSelectPost(post.id, checked)}
                />
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
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
                      <span>Posted {post.postedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                    <TrendingUp className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                    <Send className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                    <Copy className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {post.excerpt}
                </p>
                
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
                  <span>Posted on {post.postedTime}</span>
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
