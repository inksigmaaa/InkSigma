"use client"

import { useState, useMemo } from "react"
import styles from "../components/articles/Articles.module.css"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import ArticleContainer from "../components/articleContainer/ArticleContainer"
import { useArticles } from "@/contexts/ArticlesContext"
import { ChevronDownIcon } from "@/components/icons/SvgIcons"

export default function MyBlogsPage() {
  const { articles, moveToTrash } = useArticles()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])

  const categories = [
    "Agriculture", "Art & Illustration", "Business", "Climate & Environment",
    "Comics and Anime", "Crypto & Web-3", "Design", "Education",
    "Entertainment", "Faith & Spiritual", "Fashion & Beauty", "Fiction",
    "Finance & Economics", "Food & Drink", "Games", "Health & Wellness",
    "History", "Humor", "Law", "Literature", "Marketing", "Music",
    "News", "NSFW", "Parenting & Family", "Philosophy", "Poetry",
    "Politics", "Psychology", "Relationships", "Romance", "Science",
    "Space", "Sports", "Startups & Companies", "Technology", "Travel"
  ]

  const myArticles = useMemo(() => {
    return articles.filter(article => {
      if (selectedCategories.length > 0) {
        return article.categories.some(cat => selectedCategories.includes(cat))
      }
      return true
    })
  }, [articles, selectedCategories])

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <div className={styles.articlesContainer}>
        <div className={styles.articlesContent}>
          <div className={styles.header}>
            <div className={styles.controlsRow}>
              <div className={styles.titleRow}>
                <h1 className={styles.title} style={{ color: '#EC4899' }}>My Blogs</h1>
              </div>
              <div className={styles.rightSection}>
                <div className={styles.dropdownWrapper}>
                  <button
                    className={styles.categoryButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    Choose Category
                    <ChevronDownIcon className={styles.chevron} />
                  </button>
                  {isDropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <input
                          type="text"
                          placeholder="Search Category..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={styles.searchInput}
                        />
                        <button
                          className={styles.applyButton}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Apply
                        </button>
                      </div>
                      <div className={styles.categoriesList}>
                        {filteredCategories.map((category) => (
                          <label key={category} className={styles.categoryItem}>
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={() => handleCategoryToggle(category)}
                              className={styles.categoryCheckbox}
                            />
                            <span className={styles.categoryLabel}>{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.articlesList}>
            {myArticles.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>No Articles yet</p>
              </div>
            ) : (
              myArticles.map((article) => (
                <ArticleContainer
                  key={article.id}
                  id={article.id}
                  status={article.status}
                  title={article.title}
                  description={article.description}
                  categories={article.categories}
                  postedTime={article.postedTime}
                  onDelete={() => moveToTrash(article.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
