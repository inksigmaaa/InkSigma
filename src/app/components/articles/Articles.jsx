"use client"

import { useState } from 'react'
import styles from './Articles.module.css'
import ArticleContainer from '../articleContainer/ArticleContainer'

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

export default function Articles(props) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategories, setSelectedCategories] = useState([])
    const [selectAll, setSelectAll] = useState(false)

    // Filter articles based on status if filterStatus prop is provided
    const filterStatus = props.filterStatus || null
    const showCreateButton = props.showCreateButton !== false // default true

    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        )
    }

    return (
        <div className={styles.articlesContainer}>
            <div className={styles.articlesContent}>
                {/* Mobile header - visible only below 768px */}
                <div className={styles.mobileHeader}>
                    <h1 className={styles.mobileTitle}>{props.title || "All Articles"}</h1>
                    <div className={styles.mobileControls}>
                        {showCreateButton && (
                            <button className={styles.createArticleButton}>
                                + Create Article
                            </button>
                        )}
                        <div className={styles.dropdownWrapper}>
                            <button className={styles.categoryButton} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                Category
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.chevron}>
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isDropdownOpen && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <input type="text" placeholder="Search Category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
                                        <button className={styles.applyButton} onClick={() => setIsDropdownOpen(false)}>Apply</button>
                                    </div>
                                    <div className={styles.categoriesList}>
                                        {filteredCategories.map((category) => (
                                            <label key={category} className={styles.categoryItem}>
                                                <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCategoryToggle(category)} className={styles.categoryCheckbox} />
                                                <span className={styles.categoryLabel}>{category}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{props.title || "All Articles"}</h1>
                    </div>
                    <div className={styles.controlsRow}>
                        <div className={styles.leftSection}>
                            <label className={styles.selectAllLabel}>
                                <input type="checkbox" checked={selectAll} onChange={() => setSelectAll(!selectAll)} className={styles.checkbox} />
                                <span className={styles.selectAllText}>Select all</span>
                            </label>
                            <button className={styles.iconButton} title="Copy">
                                <img src="/images/icons/copy.svg" alt="copy" className={styles.icon} />
                            </button>
                            <button className={styles.iconButton} title="Send">
                                <img src="/images/icons/Publish.svg" alt="send" className={styles.icon} />
                            </button>
                            <button className={styles.iconButton} title="Delete">
                                <img src="/images/icons/trash1.svg" alt="delete" className={styles.icon} />
                            </button>
                        </div>
                        <div className={styles.rightSection}>
                            <div className={styles.dropdownWrapper}>
                                <button className={styles.categoryButton} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    Choose Category
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.chevron}>
                                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.dropdownHeader}>
                                            <input type="text" placeholder="Search Category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
                                            <button className={styles.applyButton} onClick={() => setIsDropdownOpen(false)}>Apply</button>
                                        </div>
                                        <div className={styles.categoriesList}>
                                            {filteredCategories.map((category) => (
                                                <label key={category} className={styles.categoryItem}>
                                                    <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCategoryToggle(category)} className={styles.categoryCheckbox} />
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
                    {/* Sample articles - filter by status if filterStatus prop is provided */}
                    {(!filterStatus || filterStatus === "published") && (
                        <ArticleContainer
                            status="published"
                            title="Title of the Blog will be in this area"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
                            categories={["Sports", "Humour", "History"]}
                            postedTime="Posted 2 mins ago"
                        />
                    )}
                    {(!filterStatus || filterStatus === "draft") && (
                        <ArticleContainer
                            status="draft"
                            title="Title of the Blog will be in this area"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
                            categories={["Sports", "Humour", "History"]}
                            postedTime="Posted 2 mins ago"
                        />
                    )}
                    {(!filterStatus || filterStatus === "scheduled") && (
                        <ArticleContainer
                            status="scheduled"
                            title="Title of the Blog will be in this area"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa..."
                            categories={["Sports", "Humour", "History"]}
                            postedTime="Posted 2 mins ago"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}