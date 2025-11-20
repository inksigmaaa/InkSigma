"use client"

import { useState, useEffect, useRef } from 'react'
import PersonalArticleContainer from '../personalArticleContainer/PersonalArticleContainer'
import { ChevronDownIcon } from "@/components/icons/SvgIcons"
import { Button } from "@/components/ui/button"
import { useVerifyBanner } from "@/hooks/useVerifyBanner"

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
    const dropdownRef = useRef(null)
    
    // Check if verify banner should be shown
    const showVerifyBanner = useVerifyBanner()

    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectAll = showSelectAll && selectedArticles.length === articles.length && articles.length > 0

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isDropdownOpen])

    // Dynamic top position based on verify banner visibility
    const topPosition = showVerifyBanner ? 'top-[200px]' : 'top-[160px]';
    const mobileTopPosition = showVerifyBanner ? 'max-md:top-[260px]' : 'max-md:top-[220px]';

    return (
        <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} w-full max-w-[1034px] z-20 px-5 ${mobileTopPosition}`}>
            <div className="ml-[185px] max-md:ml-0">
                {/* Title Row */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h1 className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-800 m-0 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: titleColor || '#8B5CF6' }}></span>
                        {title}
                    </h1>
                    {/* Category dropdown shows on mobile or when no actions */}
                    <div ref={dropdownRef} className={`relative ${showActions ? 'md:hidden' : ''}`}>
                        <Button
                            variant="outline"
                            className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-gray-500 bg-white border border-gray-300 rounded-lg px-4 py-1 h-8 flex items-center gap-2 cursor-pointer min-w-[180px] justify-between max-md:min-w-[120px] max-md:text-xs max-md:px-2.5 max-[480px]:min-w-[100px] max-[480px]:text-[11px] max-[480px]:px-2"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            Choose Category
                            <ChevronDownIcon className={`shrink-0 max-md:w-3.5 max-md:h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </Button>
                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100] max-md:w-[260px] max-md:h-[220px] max-[480px]:w-60 max-[480px]:h-[200px]">
                                <div className="p-2.5 flex gap-3 border-b border-gray-200 max-md:p-3 max-md:gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search Category..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 font-['Public_Sans'] font-normal text-sm leading-[150%] px-3.5 py-2.5 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-purple-600 focus:bg-white placeholder:text-gray-400 max-md:text-xs max-md:px-2.5 max-md:py-2 max-[480px]:text-[11px] max-[480px]:px-2 max-[480px]:py-1.5"
                                    />
                                    <Button
                                        className="font-['Public_Sans'] font-medium text-sm leading-[150%] bg-purple-100 text-purple-600 border-none rounded-lg px-6 py-2.5 cursor-pointer whitespace-nowrap hover:bg-purple-200 max-md:text-xs max-md:px-4 max-md:py-2 max-[480px]:text-[11px] max-[480px]:px-3 max-[480px]:py-1.5"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Apply
                                    </Button>
                                </div>
                                <div className="p-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50 hover:scrollbar-thumb-gray-400 max-md:p-2">
                                    {filteredCategories.map((category) => (
                                        <label key={category} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-gray-50 max-md:px-2.5 max-md:py-2">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 cursor-pointer accent-purple-600 shrink-0 max-md:w-[18px] max-md:h-[18px]"
                                            />
                                            <span className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-gray-600 max-md:text-[13px]">{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Row - Only shown on desktop/tablet when showActions is true (Draft/Trash pages) */}
                {showActions && (
                    <div className="flex items-center justify-between gap-4 mb-4 max-md:hidden">
                        <div className="flex items-center gap-4">
                            {showSelectAll && (
                                <label className="flex items-center gap-2 cursor-pointer w-[123px] h-10 bg-[#F8F8F8] rounded px-3 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={(e) => onSelectAll?.(e.target.checked)}
                                        className="w-[18px] h-[18px] cursor-pointer accent-purple-600"
                                    />
                                    <span className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-500">Select all</span>
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
                                    <img src={button.icon} alt={button.title} className="w-5 h-5" />
                                </Button>
                            ))}
                        </div>
                        <div ref={dropdownRef} className="relative">
                            <Button
                                variant="outline"
                                className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-gray-500 bg-white border border-gray-300 rounded-lg px-4 py-1 h-8 flex items-center gap-2 cursor-pointer min-w-[180px] justify-between"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                Choose Category
                                <ChevronDownIcon className={`shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </Button>
                            {isDropdownOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100]">
                                    <div className="p-2.5 flex gap-3 border-b border-gray-200">
                                        <input
                                            type="text"
                                            placeholder="Search Category..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="flex-1 font-['Public_Sans'] font-normal text-sm leading-[150%] px-3.5 py-2.5 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-purple-600 focus:bg-white placeholder:text-gray-400"
                                        />
                                        <Button
                                            className="font-['Public_Sans'] font-medium text-sm leading-[150%] bg-purple-100 text-purple-600 border-none rounded-lg px-6 py-2.5 cursor-pointer whitespace-nowrap hover:bg-purple-200"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    <div className="p-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50 hover:scrollbar-thumb-gray-400">
                                        {filteredCategories.map((category) => (
                                            <label key={category} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 cursor-pointer accent-purple-600 shrink-0"
                                                />
                                                <span className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-gray-600">{category}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-6 space-y-4 pb-[85px]">
                    {articles.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                            <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">{emptyMessage}</p>
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
