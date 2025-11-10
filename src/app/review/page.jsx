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
import { AlertCircle, Clock } from "lucide-react"

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

  const handleSelectPost = (postId, checked) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, postId])
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== postId))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h1 className="text-2xl font-semibold">Review</h1>
          </div>
          
          {/* Category Select */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px] md:w-[180px]">
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
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
              {/* Desktop Layout */}
              <div className="hidden md:flex items-start gap-4">
                <Checkbox 
                  checked={selectedPosts.includes(post.id)}
                  onCheckedChange={(checked) => handleSelectPost(post.id, checked)}
                />
                
                <div className="flex-1">
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
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {post.author}
                    </h3>
                    <p className="text-gray-400 text-sm underline">
                      {post.title}
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                  >
                    Draft
                  </Button>
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
