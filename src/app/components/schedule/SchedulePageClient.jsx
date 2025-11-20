"use client"

import { useState } from "react"
import ScheduleHeader from "./ScheduleHeader"
import ScheduleControls from "./ScheduleControls"
import SchedulePostCard from "./SchedulePostCard"
import { useVerifyBanner } from "@/hooks/useVerifyBanner"

export default function SchedulePageClient({ posts }) {
  const [selectedPosts, setSelectedPosts] = useState([])
  const [category, setCategory] = useState("")
  
  // Check if verify banner should be shown
  const showVerifyBanner = useVerifyBanner()

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
    <div className={`absolute left-1/2 -translate-x-1/2 ${showVerifyBanner ? 'top-[215px]' : 'top-[160px]'} w-full max-w-[1034px] z-20 px-5 max-md:top-[120px]`}>
      <div className="ml-0 md:ml-[185px]">
        <div className="space-y-6">
          <ScheduleHeader 
            category={category}
            onCategoryChange={setCategory}
          />

          <ScheduleControls 
            selectedPosts={selectedPosts}
            totalPosts={posts.length}
            onSelectAll={handleSelectAll}
            category={category}
            onCategoryChange={setCategory}
          />

          {/* Posts List */}
          <div className="space-y-4">
            {posts.map((post) => (
              <SchedulePostCard
                key={post.id}
                post={post}
                isSelected={selectedPosts.includes(post.id)}
                onSelectPost={handleSelectPost}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}