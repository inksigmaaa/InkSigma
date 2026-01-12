"use client"

import { useState, useEffect } from "react"
import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import Verify from "../../components/verify/Verify"
import ArticleContainer from "../../components/articleContainer/ArticleContainer"
import { useSession } from "@/lib/auth-client"

export default function PostsPublished() {
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [publicationId, setPublicationId] = useState(null)
    const { data: session } = useSession()

    useEffect(() => {
        if (session?.user?.id) {
            loadPublishedArticles()
        }
    }, [session?.user?.id])

    const loadPublishedArticles = async () => {
        try {
            setLoading(true)
            
            // First, try to get user's joined publications
            const membershipsRes = await fetch("http://localhost:5000/api/publication-members/my-publications", {
                credentials: "include",
            })

            let articlesData = []

            if (membershipsRes.ok) {
                const memberships = await membershipsRes.json()
                
                // If user has joined publications, fetch articles for the first one
                // API returns flat array of publications, not nested structure
                if (memberships.length > 0) {
                    const firstPub = memberships[0]
                    setPublicationId(firstPub.id)

                    const articlesRes = await fetch(
                        `http://localhost:5000/api/blogs?publicationId=${firstPub.id}&status=published`,
                        { credentials: "include" }
                    )

                    if (articlesRes.ok) {
                        articlesData = await articlesRes.json()
                        console.log('Published articles from publication:', articlesData)
                    } else {
                        console.error('Failed to fetch publication articles:', articlesRes.status)
                    }
                }
            }

            // If no publication articles, fetch user's personal published articles
            if (articlesData.length === 0 && session?.user?.id) {
                const personalArticlesRes = await fetch(
                    `http://localhost:5000/api/blogs?authorId=${session.user.id}&status=published`,
                    { credentials: "include" }
                )

                if (personalArticlesRes.ok) {
                    articlesData = await personalArticlesRes.json()
                    console.log('Published personal articles:', articlesData)
                } else {
                    console.error('Failed to fetch personal articles:', personalArticlesRes.status)
                }
            }

            setArticles(articlesData)
        } catch (error) {
            console.error("Error loading published articles:", error)
        } finally {
            setLoading(false)
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
                            <span className="w-3 h-3 bg-violet-500 rounded-full shrink-0"></span>
                            Published
                        </h1>
                    </div>

                    <div className="mt-6 space-y-4 pb-[85px]">
                        {loading ? (
                            <div className="flex justify-center items-center min-h-[200px]">
                                <div className="text-gray-500">Loading articles...</div>
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                                <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">No published articles found</p>
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
                                    postedTime={article.createdAt}
                                    isSelected={false}
                                    onSelect={() => {}}
                                    showActions={false}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
