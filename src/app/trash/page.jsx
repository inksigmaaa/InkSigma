"use client"

import { useState } from "react"
import styles from "../components/articles/Articles.module.css"
import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import ArticleContainer from "../components/articleContainer/ArticleContainer"
import ConfirmModal from "../components/confirmModal/ConfirmModal"

export default function TrashPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)

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
                    onChange={() => setSelectAll(!selectAll)}
                    className={styles.checkbox}
                  />
                  <span className={styles.selectAllText}>Select all</span>
                </label>
                <button className={styles.iconButton} title="Restore" onClick={() => setShowRestoreModal(true)}>
                  <img src="/images/icons/restore.svg" alt="restore" className={styles.icon} />
                </button>
                <button className={styles.iconButton} title="Delete" onClick={() => setShowDeleteModal(true)}>
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
            <ArticleContainer
              status="trash"
              title="Title of the Blog will be in this area"
              description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
              categories={["Sports", "Humour", "History"]}
              postedTime="Posted 2 mins ago"
              onRestore={() => setShowRestoreModal(true)}
              onDelete={() => setShowDeleteModal(true)}
            />
            <ArticleContainer
              status="trash"
              title="Title of the Blog will be in this area"
              description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
              categories={["Sports", "Humour", "History"]}
              postedTime="Posted 2 mins ago"
              onRestore={() => setShowRestoreModal(true)}
              onDelete={() => setShowDeleteModal(true)}
            />
            <ArticleContainer
              status="trash"
              title="Title of the Blog will be in this area"
              description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
              categories={["Sports", "Humour", "History"]}
              postedTime="Posted 2 mins ago"
              onRestore={() => setShowRestoreModal(true)}
              onDelete={() => setShowDeleteModal(true)}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          // Handle delete logic here
          console.log('Delete confirmed')
          setShowDeleteModal(false)
        }}
        title="Are you sure you want to delete?"
        message="This will permanently delete this article and cannot be restored"
        confirmText="Delete permanelty"
        confirmStyle="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={() => {
          // Handle restore logic here
          console.log('Restore confirmed')
          setShowRestoreModal(false)
        }}
        title="Are you sure you want to Restore?"
        confirmText="Restore"
        confirmStyle="normal"
      />
    </>
  )
}
