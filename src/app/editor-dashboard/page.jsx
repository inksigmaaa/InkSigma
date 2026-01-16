"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import EditorSidebar from "../components/sidebar/EditorSidebar"
import AuthGuard from "@/components/auth/AuthGuard"
import { useArticles } from "@/contexts/ArticlesContext"
import { usePublication } from "@/contexts/PublicationContext"

export default function EditorDashboardPage() {
  const router = useRouter()
  const { currentPublication, loading: pubLoading } = usePublication()
  const { articles, loading: articlesLoading, loadUserArticles } = useArticles()

  // Refresh articles on load
  useEffect(() => {
    loadUserArticles()
  }, [loadUserArticles])

  // Calculate stats
  const draftCount = articles.filter(a => a.status === 'draft').length
  const publishedCount = articles.filter(a => a.status === 'published').length
  const scheduledCount = articles.filter(a => a.status === 'scheduled').length
  const totalCount = articles.length

  // Get recent drafts
  const recentDrafts = articles
    .filter(a => a.status === 'draft')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 3)

  const handleStartWriting = () => {
    if (currentPublication?.id) {
      router.push(`/editor?publicationId=${currentPublication.id}`)
    } else {
      router.push("/editor")
    }
  }

  return (
    <AuthGuard>
      <NavbarLoggedin />
      <EditorSidebar />
      
      {/* Main Content */}
      <div className="pt-[112px] min-h-screen max-md:pt-[90px]">
        <div className="max-w-[1034px] mx-auto px-5 max-md:p-0">
          <div className="ml-[165px] bg-white border-r border-gray-200 p-8 max-md:ml-0 max-md:border-r-0 max-md:p-4">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Editor Dashboard</h1>
              <p className="text-gray-500">Manage your content and track your writing progress</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8 max-md:grid-cols-2">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-sm text-gray-500">Total Posts</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-3xl font-bold text-gray-900">{draftCount}</p>
                <p className="text-sm text-gray-500">Drafts</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-3xl font-bold text-gray-900">{publishedCount}</p>
                <p className="text-sm text-gray-500">Published</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-3xl font-bold text-gray-900">{scheduledCount}</p>
                <p className="text-sm text-gray-500">Scheduled</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-6 mb-8 border border-violet-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to write?</h2>
              <p className="text-gray-600 mb-4">Start creating your next masterpiece</p>
              <button 
                onClick={handleStartWriting}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                New Post
              </button>
            </div>

            {/* Recent Drafts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Drafts</h2>
                <button 
                  onClick={() => router.push('/draft')}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  View all →
                </button>
              </div>

              {articlesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : recentDrafts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-500">No drafts yet. Start writing to see them here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDrafts.map((draft) => (
                    <div 
                      key={draft.id}
                      onClick={() => router.push(`/editor?status=draft&id=${draft.id}`)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {draft.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {draft.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-gray-400">
                          {new Date(draft.updatedAt || draft.createdAt).toLocaleDateString()}
                        </span>
                        <Pencil className="w-4 h-4 text-gray-400" />
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
