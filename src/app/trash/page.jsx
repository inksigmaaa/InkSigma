"use client"

import { useState, useMemo } from "react"
import styles from "../components/articles/Articles.module.css"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import ArticleContainer from "../components/articleContainer/ArticleContainer"
import ConfirmModal from "../components/confirmModal/ConfirmModal"
import { useArticles } from "@/contexts/ArticlesContext"

export default function TrashPage() {
  const { articles, restoreFromTrash, deleteArticle, bulkRestore, bulkDelete } = useArticles()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [singleArticleAction, setSingleArticleAction] = useState(null)

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

  const trashedArticles = useMemo(() => {
    return articles.filter(article => {
      if (article.status !== 'trash') return false
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
      setSelectedArticles(trashedArticles.map(a => a.id))
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
      setSingleArticleAction(null)
      setShowDeleteModal(true)
    }
  }

  const handleBulkRestore = () => {
    if (selectedArticles.length > 0) {
      setSingleArticleAction(null)
      setShowRestoreModal(true)
    }
  }

  const handleSingleDelete = (id) => {
    setSingleArticleAction(id)
    setShowDeleteModal(true)
  }

  const handleSingleRestore = (id) => {
    setSingleArticleAction(id)
    setShowRestoreModal(true)
  }

  const confirmDelete = () => {
    if (singleArticleAction) {
      deleteArticle(singleArticleAction)
    } else {
      bulkDelete(selectedArticles)
      setSelectedArticles([])
    }
    setShowDeleteModal(false)
    setSingleArticleAction(null)
  }

  const confirmRestore = () => {
    if (singleArticleAction) {
      restoreFromTrash(singleArticleAction)
    } else {
      bulkRestore(selectedArticles)
      setSelectedArticles([])
    }
    setShowRestoreModal(false)
    setSingleArticleAction(null)
  }

  const selectAll = selectedArticles.length === trashedArticles.length && trashedArticles.length > 0

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <div className={styles.articlesContainer}>
        <div className={styles.articlesContent}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h1 className={styles.title} style={{ color: '#EF4444' }}>Trash</h1>
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
                <button 
                  className={styles.iconButton} 
                  title="Restore" 
                  onClick={handleBulkRestore}
                  disabled={selectedArticles.length === 0}
                >
                  <img src="/images/icons/restore.svg" alt="restore" className={styles.icon} />
                </button>
                <button 
                  className={styles.iconButton} 
                  title="Delete" 
                  onClick={handleBulkDelete}
                  disabled={selectedArticles.length === 0}
                >
                  <img src="/images/icons/trash1.svg" alt="delete" className={styles.icon} />
                </button>
              </div>
              <div className={styles.rightSection}>
                <div className={styles.dropdownWrapper}>
                  <button
                    className={styles.categoryButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    Choose Category
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.chevron}>
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
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
            {trashedArticles.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>No Articles in Trash</p>
              </div>
            ) : (
              trashedArticles.map((article) => (
                <ArticleContainer
                  key={article.id}
                  id={article.id}
                  status={article.status}
                  title={article.title}
                  description={article.description}
                  categories={article.categories}
                  postedTime={article.postedTime}
                  onRestore={() => handleSingleRestore(article.id)}
                  onDelete={() => handleSingleDelete(article.id)}
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
        onClose={() => {
          setShowDeleteModal(false)
          setSingleArticleAction(null)
        }}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete?"
        message={singleArticleAction 
          ? "This will permanently delete this article and cannot be restored"
          : `This will permanently delete ${selectedArticles.length} article(s) and cannot be restored`
        }
        confirmText="Delete permanently"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false)
          setSingleArticleAction(null)
        }}
        onConfirm={confirmRestore}
        title="Are you sure you want to Restore?"
        message={singleArticleAction 
          ? "This article will be restored to drafts"
          : `${selectedArticles.length} article(s) will be restored to drafts`
        }
        confirmText="Restore"
        confirmStyle="normal"
      />
    </>
  )
}
