"use client"

import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePublication } from "@/contexts/PublicationContext"
import { useArticles } from "@/contexts/ArticlesContext"

export default function PostsHomePage() {
  const router = useRouter()
  const [publication, setPublication] = useState(null)
  const [stats, setStats] = useState({ totalArticles: 0, publishedArticles: 0, totalViews: 0, totalLikes: 0 })
  const [recentArticles, setRecentArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPublicationData()
  }, [])

  const loadPublicationData = async () => {
    try {
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
        setPublication(firstPub)

        // Fetch stats for this publication
        const statsRes = await fetch(`http://localhost:5000/api/publication-stats/${firstPub.id}`, {
          credentials: "include",
        })

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        // Fetch recent published articles for this publication
        const articlesRes = await fetch(
          `http://localhost:5000/api/blogs?publicationId=${firstPub.id}&status=published&limit=4`,
          { credentials: "include" }
        )

        if (articlesRes.ok) {
          const articlesData = await articlesRes.json()
          setRecentArticles(articlesData)
        }
      }
    } catch (error) {
      console.error("Error loading publication data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWriting = () => {
    // Pass publicationId to editor so blogs are created for this publication
    if (publication?.id) {
      router.push(`/editor?publicationId=${publication.id}`)
    } else {
      router.push("/editor")
    }
  }

  const handleVisitSite = () => {
    window.open("/view-site", "_blank")
  }

  const handleEditPublication = () => {
    router.push("/dashboard/settings")
  }

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <MemberSidebar key="member-sidebar" />
        <div className="pt-[112px] min-h-screen max-md:pt-[90px] flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    )
  }

  if (!publication) {
    return (
      <>
        <NavbarLoggedin />
        <MemberSidebar key="member-sidebar" />
        <div className="pt-[112px] min-h-screen max-md:pt-[90px] flex items-center justify-center">
          <p className="text-gray-500">No joined publications found</p>
        </div>
      </>
    )
  }

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
                  {publication?.logoUrl ? (
                    <img 
                      src={`http://localhost:5000${publication.logoUrl}`} 
                      alt={publication.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/icons/nib.svg";
                      }}
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
                  <h1 className="text-lg font-semibold text-gray-900 mb-1 max-md:text-base max-md:font-bold">
                    {publication.name}
                  </h1>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-md max-md:text-xs max-md:line-clamp-1">
                    {publication.description || `${publication.subdomain}.inksigma.com`}
                  </p>
                  {publicationDetails && (
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {publicationDetails.memberCount} member{publicationDetails.memberCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-500">
                        {publicationDetails.postCount} post{publicationDetails.postCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="relative py-6 border-b border-gray-200 max-md:px-4 max-md:py-0 max-md:pb-4 max-md:border-b-0">
              <div className="px-8 max-md:px-0 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Monthly</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-4xl font-bold text-gray-900">{stats.totalArticles}</p>
                    <p className="text-sm text-purple-500 mt-1">Total no. Articles</p>
                  </div>
                  <div className="text-left">
                    <p className="text-4xl font-bold text-gray-900">{stats.totalViews}</p>
                    <p className="text-sm text-purple-500 mt-1">Views</p>
                  </div>
                  <div className="text-left">
                    <p className="text-4xl font-bold text-gray-900">{stats.totalLikes}</p>
                    <p className="text-sm text-purple-500 mt-1">Comments</p>
                  </div>
                  <div className="text-left">
                    <p className="text-4xl font-bold text-gray-900">{stats.publishedArticles}</p>
                    <p className="text-sm text-purple-500 mt-1">Shares</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's on your mind Section */}
            <div className="px-8 py-8 border-b border-gray-200 text-center max-md:p-0 max-md:border-b-0">
              <div className="max-md:bg-gray-50 max-md:border max-md:border-gray-200 max-md:rounded-l max-md:p-6 max-md:mx-4 max-md:mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2 max-md:text-lg max-md:mb-3">
                  What's on your mind?
                </h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed max-md:text-xs max-md:mb-5 max-md:text-gray-600">
                  Craft persuasive articles showcasing your novel ideas by publishing them on this publication
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
              <h3 className="text-lg font-bold text-gray-900 mb-6 max-md:text-base max-md:mb-4">Recent Published Articles</h3>

              {recentArticles.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                  <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">No published articles yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-4">
                  {recentArticles.map((article) => (
                    <div 
                      key={article.id} 
                      className="border border-gray-200 rounded-md hover:shadow-lg transition-shadow bg-white p-3.5 cursor-pointer"
                      onClick={() => router.push(`/posts/published`)}
                    >
                      {article.image && (
                        <div className="aspect-video bg-gray-100 overflow-hidden rounded-sm mb-4">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-lg leading-snug line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between">
                          {article.categories && article.categories.length > 0 && (
                            <span className="text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-lg">
                              {article.categories[0]}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            by {article.author?.name || 'Unknown'}
                          </span>
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

      {/* Fixed Visit Site Button - Mobile Only */}
      <button
        onClick={handleVisitSite}
        className="hidden max-md:flex fixed bottom-20 right-4 bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg z-50"
      >
        View site
      </button>
    </>
  )
}
