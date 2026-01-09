"use client"

import { useState, useEffect } from "react"
import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import Verify from "../../components/verify/Verify"
import ArticleContainer from "../../components/articleContainer/ArticleContainer"

export default function PostsPublished() {
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [publicationId, setPublicationId] = useState(null)

    useEffect(() => {
        loadPublishedArticles()
    }, [])

    const loadPublishedArticles = async () => {
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
                setPublicationId(firstPub.id)

                // Fetch published articles for this publication
                const articlesRes = await fetch(
                    `http://localhost:5000/api/blogs?publicationId=${firstPub.id}&status=published`,
                    { credentials: "include" }
                )

                if (articlesRes.ok) {
                    const articlesData = await articlesRes.json()
                    setArticles(articlesData)
                }
            }
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
                            <div className="flex justify-center items-center min-h-[200px]">
                                <div className="text-gray-500">No published articles found</div>
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
