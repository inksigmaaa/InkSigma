"use client"

import { useState, useMemo } from "react"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import PersonalArticles from "../components/personalArticles/personalArticles"
import { useArticles } from "@/contexts/ArticlesContext"

export default function MyBlogsPage() {
  const { articles, moveToTrash } = useArticles()
  const [selectedArticles, setSelectedArticles] = useState([])

  const myArticles = useMemo(() => {
    return articles.map(article => ({
      ...article,
      onDelete: () => moveToTrash(article.id)
    }))
  }, [articles, moveToTrash])

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, id])
    } else {
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id))
    }
  }

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
        selectedArticles={selectedArticles}
        onArticleSelect={handleArticleSelect}
      />
    </>
  )
}
