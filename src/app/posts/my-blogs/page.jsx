"use client"

import { useState, useEffect } from "react"
import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import Verify from "../../components/verify/Verify"
import ArticleContainer from "../../components/articleContainer/ArticleContainer"

export default function PostsMyBlogsPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [publicationId, setPublicationId] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    loadMyBlogs()
  }, [])

  const loadMyBlogs = async () => {
    try {
      // Get current user session
      const sessionRes = await fetch("http://localhost:5000/api/auth/get-session", {
        credentials: "include",
      })

      if (!sessionRes.ok) {
        console.error("Failed to fetch session")
        setLoading(false)
        return
      }

      const sessionData = await sessionRes.json()
      const currentUserId = sessionData.user.id
      setUserId(currentUserId)

      // Get user's joined publications
      const membershipsRes = await fetch("http://localhost:5000/api/publication-members/my-publications", {
        credentials: "include",
      })

      if (!membershipsRes.ok) {
        console.error("Failed to fetch memberships")
        setLoading(false)
        return
      }

      const memberships = await membershipsRes.json()
      
      // For now, use the first joined publication
      if (memberships.length > 0) {
        const firstPub = memberships[0].publication
        setPublicationId(firstPub.id)

        // Fetch user's blogs for this publication
        const articlesRes = await fetch(
          `http://localhost:5000/api/blogs?publicationId=${firstPub.id}&authorId=${currentUserId}`,
          { credentials: "include" }
        )

        if (articlesRes.ok) {
          const articlesData = await articlesRes.json()
          setArticles(articlesData)
        }
      }
    } catch (error) {
      console.error("Error loading my blogs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArticle = async (articleId) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${articleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        // Refresh the articles list
        await loadMyBlogs()
      } else {
        alert('Failed to delete article')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Failed to delete article')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      })
    }
  }

  const topPosition = 'top-[160px]'
  const mobileTopPosition = 'max-md:top-[120px]'

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <Verify />
      
      <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
        <div className="ml-0 md:ml-[185px]">
          <div className="flex flex-col gap-4 mb-6 px-2 max-md:mt-3">
            <h1 className="font-bold text-lg leading-8 text-gray-800 m-0 flex items-center gap-3 max-md:text-base">
              <span className="w-3 h-3 bg-pink-500 rounded-full shrink-0"></span>
              My Blogs
            </h1>
          </div>

          <div className="mt-6 space-y-4 pb-[85px]">
            {loading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-gray-500">Loading articles...</div>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-gray-500">No articles yet</div>
              </div>
            ) : (
              articles.map(article => (
                <ArticleContainer
                  key={article.id}
                  id={article.id}
                  status={article.status}
                  title={article.title}
                  description={article.description}
                  categories={article.categories || []}
                  postedTime={formatDate(article.createdAt)}
                  isSelected={false}
                  onSelect={() => {}}
                  onDelete={() => handleDeleteArticle(article.id)}
                  publicationId={publicationId}
                  showActions={true}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
