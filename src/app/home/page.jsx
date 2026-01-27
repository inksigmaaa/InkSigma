"use client"

import { useEffect, useState } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import EditorSidebar from "../components/sidebar/EditorSidebar"
import Verify from "../components/verify/Verify"
import BlogStatsComponent from "../components/BlogStatsComponent/BlogStatsComponent"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/auth/AuthGuard"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"
import { getImageUrl } from "@/utils/imageUrl"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function HomePage() {
  const router = useRouter()
  const { currentPublication, publicationDetails, loading } = usePublication()
  const { articles: allArticles, publicationArticles, loadUserArticles, loadPublicationArticles } = useArticles()
  const [commentCounts, setCommentCounts] = useState({})
  const [viewStats, setViewStats] = useState({})

  // Refresh articles when home page loads
  useEffect(() => {
    if (currentPublication?.id) {
      loadPublicationArticles(currentPublication.id, 'published')
    }
  }, [currentPublication?.id, loadPublicationArticles])

  // Get recent published articles (limit to 4)
  const recentArticles = publicationArticles
    .filter(article => article.status === 'published')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)
    .map(article => {
      // Check if article has an image - use fallback if not
      const thumbnailUrl = article.image 
        ? getImageUrl(article.image)
        : "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop";
      
      return {
        id: article.id,
        title: article.title,
        description: article.description,
        categories: article.categories?.length > 0 ? article.categories : ['Uncategorized'],
        thumbnail: thumbnailUrl,
        views: viewStats[article.id]?.views || article.views || 0
      };
    })

  // Fetch comment counts and view stats for recent articles
  useEffect(() => {
    const fetchStats = async () => {
      console.log('[Home] publicationArticles length:', publicationArticles.length);
      
      // Get published article IDs
      const publishedArticles = publicationArticles.filter(article => article.status === 'published');
      console.log('[Home] Published articles:', publishedArticles);
      
      if (publishedArticles.length === 0) {
        console.log('[Home] No published articles found');
        return;
      }
      
      try {
        const blogIds = publishedArticles.map(a => a.id);
        console.log('[Home] Fetching stats for:', blogIds);
        
        // Fetch comment counts
        const commentResponse = await fetch(`${API_URL}/api/comments/counts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blogIds })
        });
        
        if (commentResponse.ok) {
          const counts = await commentResponse.json();
          console.log('[Home] Comment counts:', counts);
          setCommentCounts(counts);
        } else {
          console.error('[Home] Failed to fetch comment counts:', commentResponse.status);
        }

        // Fetch view stats
        const viewResponse = await fetch(`${API_URL}/api/views/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blogIds })
        });
        
        if (viewResponse.ok) {
          const stats = await viewResponse.json();
          console.log('[Home] View stats:', stats);
          setViewStats(stats);
        } else {
          console.error('[Home] Failed to fetch view stats:', viewResponse.status);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [publicationArticles]);

  const handleStartWriting = () => {
    // Pass current publication ID to editor
    if (currentPublication?.id) {
      router.push(`/editor?publicationId=${currentPublication.id}`)
    } else {
      router.push("/editor")
    }
  }

  const handleVisitSite = () => {
    // Pass the current publication ID to view-site
    if (currentPublication?.id) {
      window.open(`/view-site?publicationId=${currentPublication.id}`, "_blank")
    } else {
      window.open("/view-site", "_blank")
    }
  }

  const handleEditPublication = () => {
    router.push("/dashboard/settings")
  }

  return (
    <AuthGuard>
      <NavbarLoggedin />
      {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
      <Verify />
      
      {/* Main Content */}
      <div className="pt-[112px] min-h-screen max-md:pt-[90px]">
        <div className="max-w-[1034px] mx-auto px-5 max-md:p-0">
          <div className={`ml-[165px] bg-white  p-8  max-md:ml-0 max-md:p-0`}>
          
          {/* Publication Header */}
          <div className=" px-6 py-12 flex items-center justify-between max-md:border-b max-md:border-[#EDEDED] max-md:mx-4 max-md:py-4 max-md:pb-3 max-md:mt-4">
            <div className="flex items-center gap-6 max-md:gap-3">
              <div className="w-[66px] h-[68px] rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 max-md:w-14 max-md:h-14 overflow-hidden">
                {currentPublication?.logoUrl ? (
                  <img 
                    src={`http://localhost:5000${currentPublication.logoUrl}`} 
                    alt={currentPublication.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-violet-100 rounded-full flex items-center justify-center">
                    <span className="text-violet-600 font-bold text-xl">
                      {currentPublication?.name?.charAt(0).toUpperCase() || "P"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base  leading-normal tracking-normal text-[#2E2E2E] max-md:text-base max-md:font-bold">
                    {loading ? "Loading..." : currentPublication?.name || "Publication Name"}
                  </h1>
                  {currentPublication && !currentPublication.isOwner && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      currentPublication.role === 'editor' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {currentPublication.role?.charAt(0).toUpperCase() + currentPublication.role?.slice(1)}
                    </span>
                  )}
                </div>
                {currentPublication?.description && (
                  <p className="font-normal text-sm leading-normal tracking-normal text-[#A4A4A4] max-w-md max-md:text-xs max-md:line-clamp-2">
                    {currentPublication.description}
                  </p>
                )}
              </div>
            </div>
            {currentPublication?.isOwner && (
              <button 
                onClick={handleEditPublication}
                className="text-sm text-gray-600 bg-[#f4f4f4] hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-sm transition-colors max-md:px-3 max-md:py-1.5 max-md:text-xs flex-shrink-0 max-md:rounded-lg"
              >
                Edit
              </button>
            )}
          </div>

          {/* Statistics Section */}
          <div className="relative py-6 border-y border-gray-200 max-md:px-4 max-md:py-0 max-md:pb-4 max-md:border-0">
            <BlogStatsComponent />
          </div>

          {/* What's on your mind Section */}
          <div className="px-20 py-10 border border-gray-200 text-center mt-10 max-md:p-0 max-md:border-0">
            <div className="max-md:bg-gray-50 flex flex-col items-center max-md:border max-md:border-gray-200 max-md:rounded-sm max-md:p-6 max-md:mx-4 max-md:mb-4 gap-2">
              <h2 className="font-bold text-[16px] leading-[28px] tracking-normal text-[#2E2E2E] max-md:text-lg max-md:mb-3">
                What's on your mind?
              </h2>
              <p className="text-sm text-[#A4A4A4] max-w-[425px] leading-normal max-md:text-xs max-md:mb-5 max-md:text-gray-600">
                Craft persuasive articles showcasing your novel ideas by publishing them on your very own website
              </p>
              
              <button 
                onClick={handleStartWriting}
                className="inline-flex items-center gap-2 bg-[#080808] text-[#EDEDED] px-6 py-2 rounded-md hover:bg-gray-800 transition-colors max-md:px-6 max-md:py-2.5 max-md:text-sm max-md:rounded-lg"
              >
                <Pencil className="w-4 h-4" />
                Start Writing
              </button>
            </div>
          </div>

          {/* Recent Articles Section */}
          <div className="my-10 pb-12 max-md:px-4 max-md:py-4 max-md:pb-20">
            <h3 className="text-lg font-bold text-[#000000] mb-6 max-md:text-base max-md:mb-4">Recent Articles</h3>
            
            {recentArticles.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">No published articles yet. Start writing to see them here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-4">
                {recentArticles.map((article) => (
                <div 
                  key={article.id} 
                  className="border border-[#EAEAEA] rounded-lg hover:shadow-lg transition-shadow bg-white p-4 cursor-pointer"
                  onClick={() => router.push(`/home/preview/${article.id}`)}
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden rounded-sm mb-4 relative">
                    <img 
                      src={article.thumbnail} 
                      alt={article.title}
                      className="w-full h-full object-cover rounded-sm"
                      onError={(e) => {
                        // Prevent infinite loop
                        if (e.target.src !== "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop") {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#000000] mb-3 text-lg leading-snug">
                      {article.title}
                    </h4>
                    <p className="font-normal text-[14px] h-[42px] text-[#A4A4A4] mb-4 leading-normal line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center  justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.categories.map((cat, idx) => (
                          <span key={idx} className="text-sm text-[#808080] bg-[#F4F4F4] px-4 py-2 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                      <button 
                        className="text-[#4A4A4A] hover:text-gray-900 border border-[#EAEAEA] rounded-lg p-2 hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/editor?status=published&id=${article.id}`);
                        }}
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                    
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          </div>
        </div>
      </div>

    </AuthGuard>
  )
}
