"use client"

import { useState, useMemo } from "react"
import styles from "../components/articles/Articles.module.css"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import ArticleContainer from "../components/articleContainer/ArticleContainer"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"
import { ChevronDownIcon } from "@/components/icons/SvgIcons"
import { Button } from "@/components/ui/button"

export default function DraftPage() {
  const { articles, moveToTrash, bulkMoveToTrash, bulkPublish } = useArticles()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

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

  const draftArticles = useMemo(() => {
    return articles.filter(article => {
      if (article.status !== 'draft') return false
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

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(draftArticles.map(a => a.id))
    } else {
      setSelectedArticles([])
    }
  }

  const handleArticleSelect = (id, checked) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, id])
    } else {
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedArticles.length > 0) {
      setShowDeleteModal(true)
    }
  }

  const handleBulkPublish = () => {
    if (selectedArticles.length > 0) {
      setShowPublishModal(true)
    }
  }

  const confirmDelete = () => {
    bulkMoveToTrash(selectedArticles)
    setSelectedArticles([])
    setShowDeleteModal(false)
  }

  const confirmPublish = () => {
    bulkPublish(selectedArticles)
    setSelectedArticles([])
    setShowPublishModal(false)
  }

  const selectAll = selectedArticles.length === draftArticles.length && draftArticles.length > 0

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <div className={styles.articlesContainer}>
        <div className={styles.articlesContent}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h1 className={styles.title} style={{ color: '#F97316' }}>Drafts</h1>
            </div>
            <div className={styles.controlsRow}>
              <div className={styles.leftSection}>
                <label className={styles.selectAllLabel}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.selectAllText}>Select all</span>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Publish"
                  onClick={handleBulkPublish}
                  disabled={selectedArticles.length === 0}
                >
                  <img src="/images/icons/Publish.svg" alt="publish" className={styles.icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={handleBulkDelete}
                  disabled={selectedArticles.length === 0}
                >
                  <img src="/images/icons/trash1.svg" alt="delete" className={styles.icon} />
                </Button>
              </div>
              <div className={styles.rightSection}>
                <div className={styles.dropdownWrapper}>
                  <Button
                    variant="outline"
                    className={styles.categoryButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    Choose Category
                    <ChevronDownIcon className={styles.chevron} />
                  </Button>
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
                        <Button
                          className={styles.applyButton}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Apply
                        </Button>
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
            {draftArticles.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>No Articles Drafted yet</p>
              </div>
            ) : (
              draftArticles.map((article) => (
                <ArticleContainer
                  key={article.id}
                  id={article.id}
                  status={article.status}
                  title={article.title}
                  description={article.description}
                  categories={article.categories}
                  postedTime={article.postedTime}
                  onDelete={() => moveToTrash(article.id)}
                  isSelected={selectedArticles.includes(article.id)}
                  onSelect={handleArticleSelect}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Move to trash?"
        message={`${selectedArticles.length} article(s) will be moved to trash`}
        confirmText="Move to trash"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={confirmPublish}
        title="Publish articles?"
        message={`${selectedArticles.length} article(s) will be published`}
        confirmText="Publish"
        confirmStyle="normal"
      />
    </>
  )
}
