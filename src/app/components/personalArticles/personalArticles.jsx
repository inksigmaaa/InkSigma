"use client"

import { useState } from 'react'
import styles from './personalArticles.module.css'
import PersonalArticleContainer from '../personalArticleContainer/PersonalArticleContainer'
import { ChevronDownIcon } from "@/components/icons/SvgIcons"
import { Button } from "@/components/ui/button"

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

export default function PersonalArticles({
    title = "All Articles",
    titleColor,
    articles = [],
    emptyMessage = "No Articles yet",
    showSelectAll = false,
    showActions = false,
    actionButtons = [],
    selectedArticles = [],
    onSelectAll,
    onArticleSelect,
    onArticleAction
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectAll = showSelectAll && selectedArticles.length === articles.length && articles.length > 0

    return (
        <div className={styles.articlesContainer}>
            <div className={styles.articlesContent}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title} style={titleColor ? { color: titleColor } : undefined}>
                            {title}
                        </h1>
                    </div>
                    <div className={styles.controlsRow}>
                        {showActions && (
                            <div className={styles.leftSection}>
                                {showSelectAll && (
                                    <label className={styles.selectAllLabel}>
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={(e) => onSelectAll?.(e.target.checked)}
                                            className={styles.checkbox}
                                        />
                                        <span className={styles.selectAllText}>Select all</span>
                                    </label>
                                )}
                                {actionButtons.map((button, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        size="icon"
                                        title={button.title}
                                        onClick={button.onClick}
                                        disabled={button.disabled}
                                    >
                                        <img src={button.icon} alt={button.title} className={styles.icon} />
                                    </Button>
                                ))}
                            </div>
                        )}
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
                    {articles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyStateText}>{emptyMessage}</p>
                        </div>
                    ) : (
                        articles.map((article) => (
                            <PersonalArticleContainer
                                key={article.id}
                                id={article.id}
                                status={article.status}
                                title={article.title}
                                description={article.description}
                                categories={article.categories}
                                postedTime={article.postedTime}
                                onDelete={article.onDelete}
                                onRestore={article.onRestore}
                                isSelected={selectedArticles.includes(article.id)}
                                onSelect={onArticleSelect}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
