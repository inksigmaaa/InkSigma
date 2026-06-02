"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock } from "lucide-react";
import CategoryFilter from "../categoryFilter";

export default function ReviewArticles({ title = "Review" }) {
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Mock data - replace with actual data fetching
  const posts = [
    {
      id: 1,
      title: "Journey Beyond",
      author: "Mocas Nicota",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
    },
    {
      id: 2,
      title: "Wanderlust Diaries",
      author: "John Cena",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
    },
    {
      id: 3,
      title: "Globe Trotter",
      author: "Randy Ortan",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
    },
  ];

  const filteredPosts = posts.filter((post) => {
    if (selectedCategories.length === 0) return true;
    return post.tags?.some((tag) => selectedCategories.includes(tag));
  });

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPosts(filteredPosts.map((p) => p.id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (postId, checked) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, postId]);
    } else {
      setSelectedPosts(selectedPosts.filter((id) => id !== postId));
    }
  };

  const handleAccept = (postId) => {
    console.log("Accepting post:", postId);
    // Add accept logic here
  };

  const handleReject = (postId) => {
    console.log("Rejecting post:", postId);
    // Add reject logic here
  };

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-[215px] w-full max-w-[1034px] z-20 px-5">
      <div className="ml-0 md:ml-[195px]">
        {/* Mobile header */}
        <div className="flex flex-col justify-between gap-4 mb-6 px-2 md:hidden">
          <h1 className="font-bold text-lg leading-8 text-gray-800 m-0 flex items-center gap-3">
            <span className="w-3 h-3 bg-violet-500 rounded-full shrink-0"></span>
            {title}
          </h1>

          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            buttonText="Category"
            disabled={posts.length === 0}
          />
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
                  checked={
                    selectedPosts.length === filteredPosts.length &&
                    filteredPosts.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="cursor-pointer accent-violet-500"
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    borderWidth: "1px",
                    opacity: 1,
                  }}
                />
                <span className="font-bold text-base leading-6 text-gray-500">
                  Select all
                </span>
              </label>
            </div>

            <CategoryFilter
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
              buttonText="Choose Category"
              disabled={posts.length === 0}
            />
          </div>
        </div>

        {/* Posts List */}
        <div className="mt-6 space-y-4 pb-[85px]">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200"
            >
              {/* Desktop Layout */}
              <div className="hidden md:flex items-start gap-4">
                <Checkbox
                  checked={selectedPosts.includes(post.id)}
                  onCheckedChange={(checked) =>
                    handleSelectPost(post.id, checked)
                  }
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
  );
}
