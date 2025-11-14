"use client"

import { useMemo } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import { useArticles } from "@/contexts/ArticlesContext"

export default function MyBlogsPage() {
  const { articles, moveToTrash } = useArticles()

  const myArticles = useMemo(() => {
    return articles.map(article => ({
      ...article,
      onDelete: () => moveToTrash(article.id)
    }))
  }, [articles, moveToTrash])

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PersonalArticles
        title="My Blogs"
        titleColor="#EC4899"
        articles={myArticles}
        emptyMessage="No Articles yet"
        showSelectAll={false}
        showActions={false}
        selectedArticles={[]}
      />
    </>
  )
}
