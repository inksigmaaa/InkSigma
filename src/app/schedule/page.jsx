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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Trash2,
  TrendingUp,
  Edit,
  Clock,
  MoreVertical
} from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"

export default function SchedulePage() {
  const [selectedPosts, setSelectedPosts] = useState([])
  const [category, setCategory] = useState("")

  const posts = [
    {
      id: 1,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      tags: ["Sports", "Humour", "History"],
      postedTime: "Posted 2 mins ago"
    },
    {
      id: 2,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      tags: ["Sports", "Humour", "History"],
      postedTime: "Posted 2 mins ago"
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
                <h1 className="text-base font-bold text-gray-800">Scheduled</h1>
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
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
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
                <div key={post.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6 relative">
                  {/* Three-dot menu for mobile - positioned absolutely */}
                  <Button variant="ghost" size="icon" className="md:hidden text-gray-400 absolute top-4 right-4">
                    <MoreVertical className="h-5 w-5" />
                  </Button>

                  {/* Scheduled badge */}
                  <div className="mb-4">
                    <div className="bg-cyan-100 text-cyan-700 text-xs font-medium px-3 py-1 rounded inline-block">
                      Scheduled
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start gap-4 mt-0">
                    <Checkbox 
                      checked={selectedPosts.includes(post.id)}
                      onCheckedChange={(checked) => handleSelectPost(post.id, checked)}
                    />
                    
                    <div className="flex-1 -mt-4">
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

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-9 w-9">
                        <TrendingUp className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-9 w-9">
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-9 w-9">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden pr-8">

                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                      {post.excerpt}
                    </p>

                    <div className="flex gap-2 flex-wrap mb-3">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{post.postedTime}</span>
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
