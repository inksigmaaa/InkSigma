"use client"

import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import BlogStatsComponent from "../../components/BlogStatsComponent/BlogStatsComponent"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function PostsHomePage() {
  const router = useRouter()
  const [publication, setPublication] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPublication = async () => {
      try {
        const response = await fetch("/api/publication/get")
        if (response.ok) {
          const data = await response.json()
          setPublication(data.publication)
        }
      } catch (error) {
        console.error("Error fetching publication:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPublication()
  }, [])

  const handleStartWriting = () => {
    router.push("/editor")
  }

  const handleVisitSite = () => {
    window.open("/view-site", "_blank")
  }

  const handleEditPublication = () => {
    router.push("/dashboard/settings")
  }

  // Sample articles data
  const articles = [
    {
      id: 1,
      title: "Title of the Blog will be in this area",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      category: "Category",
      thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=600&fit=crop"
    },
    {
      id: 2,
      title: "Title of the Blog will be in this area",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      category: "Category",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
    },
    {
      id: 3,
      title: "Title of the Blog will be in this area",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      category: "Category",
      thumbnail: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&h=600&fit=crop"
    },
    {
      id: 4,
      title: "Title of the Blog will be in this area",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      category: "Category",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop"
    }
  ]

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar key="member-sidebar" />
      
      {/* Main Content */}
      <div className="pt-[112px] min-h-screen max-md:pt-[90px]">
        <div className="max-w-[1034px] mx-auto px-5 max-md:p-0">
          <div className="ml-[165px] bg-white border-r p-8 border-gray-200 max-md:ml-0 max-md:border-r-0 max-md:p-0">
          
          {/* Publication Header */}
          <div className="border-b border-gray-200 px-8 py-6 flex items-start justify-between max-md:border-b-0 max-md:px-4 max-md:py-4 max-md:pb-3">
            <div className="flex items-start gap-4 max-md:gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 max-md:w-14 max-md:h-14 overflow-hidden">
                {publication?.image ? (
                  <img src={publication.image} alt={publication.name} className="w-full h-full object-cover" />
                ) : (
                  <img src="/icons/nib.svg" alt="publication" className="w-10 h-10 opacity-40 max-md:w-8 max-md:h-8" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900 mb-1 max-md:text-base max-md:font-bold">
                  {loading ? "Loading..." : publication?.name || "Publication Name"}
                </h1>
                <p className="text-sm text-gray-400 leading-relaxed max-w-md max-md:text-xs max-md:line-clamp-1">
                  {publication?.description || `${publication?.subdomain || "subdomain"}.inksigma.com`}
                </p>
              </div>
            </div>
            <button 
              onClick={handleEditPublication}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-md transition-colors max-md:px-3 max-md:py-1.5 max-md:text-xs flex-shrink-0 max-md:rounded-lg"
            >
              Edit
            </button>
          </div>

          {/* Statistics Section */}
          <div className="relative py-6 border-b border-gray-200 max-md:px-4 max-md:py-0 max-md:pb-4 max-md:border-b-0">
            <BlogStatsComponent />
          </div>

          {/* What's on your mind Section */}
          <div className="px-8 py-8 border-b border-gray-200 text-center max-md:p-0 max-md:border-b-0">
            <div className="max-md:bg-gray-50 max-md:border max-md:border-gray-200 max-md:rounded-l max-md:p-6 max-md:mx-4 max-md:mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2 max-md:text-lg max-md:mb-3">
                What's on your mind?
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed max-md:text-xs max-md:mb-5 max-md:text-gray-600">
                Craft persuasive articles showcasing your novel ideas by publishing them on your very own website
              </p>
              
              <button 
                onClick={handleStartWriting}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors max-md:px-6 max-md:py-2.5 max-md:text-sm max-md:rounded-lg"
              >
                <Pencil className="w-4 h-4" />
                Start Writing
              </button>
            </div>
          </div>

          {/* Recent Articles Section */}
          <div className="px-8 py-6 pb-12 max-md:px-4 max-md:py-4 max-md:pb-20">
            <h3 className="text-lg font-bold text-gray-900 mb-6 max-md:text-base max-md:mb-4">Recent Articles</h3>
            
            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-4">
              {articles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-md hover:shadow-lg transition-shadow bg-white p-3.5">
                  <div className="aspect-video bg-gray-100 overflow-hidden rounded-sm mb-4">
                    <img 
                      src={article.thumbnail} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg leading-snug">
                      {article.title}
                    </h4>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-lg">
                        {article.category}
                      </span>
                      <button className="text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          </div>
        </div>
      </div>

      {/* Fixed Visit Site Button - Mobile Only */}
      <button 
        onClick={handleVisitSite}
        className="hidden max-md:flex fixed bottom-20 right-4 bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg z-50"
      >
        Visit site
      </button>
    </>
  )
}
