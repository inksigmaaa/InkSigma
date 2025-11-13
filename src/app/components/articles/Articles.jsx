"use client"

import { useState } from 'react'
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

    const filterStatus = props.filterStatus || null
    const showCreateButton = props.showCreateButton !== false

    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-[215px] w-full max-w-[1034px] z-20 px-5">

            <div className="ml-0 md:ml-[185px]">

                {/* Mobile header */}
                <div className="flex flex-col justify-between gap-4 mb-6 px-2 md:hidden">
                    <h1 className="font-bold text-lg leading-8 text-gray-800 m-0 flex items-center gap-3">
                        <span className="w-3 h-3 bg-violet-500 rounded-full shrink-0"></span>
                        {props.title || "All Articles"}
                    </h1>

                    <div className="flex items-center justify-between gap-4 max-[410px]:gap-2">

                        {showCreateButton && (
                            <button className="font-semibold text-base leading-6 text-white bg-black rounded-lg px-6 py-3 whitespace-nowrap transition-colors hover:bg-gray-800 active:bg-gray-900 max-[410px]:text-sm max-[410px]:px-4 max-[410px]:py-2.5 max-[360px]:text-xs max-[360px]:px-3 max-[360px]:py-2">
                                + Create Article
                            </button>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="min-w-[180px] flex items-center justify-between gap-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer transition hover:border-violet-500 max-[410px]:min-w-[120px] max-[410px]:text-xs max-[410px]:px-3 max-[410px]:py-2 max-[360px]:min-w-[100px] max-[360px]:px-2.5 max-[360px]:py-1.5"
                            >
                                Category
                                <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0 max-[410px]:w-3.5 max-[410px]:h-3.5">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100] max-[410px]:w-72 max-[360px]:w-64">
                                    <div className="p-4 flex gap-3 border-b border-gray-200 max-[410px]:p-3 max-[410px]:gap-2">
                                        <input
                                            type="text"
                                            placeholder="Search Category..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-violet-500 focus:bg-white placeholder:text-gray-400 max-[410px]:text-xs max-[410px]:px-2 max-[410px]:py-1.5"
                                        />
                                        <button
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="text-sm font-medium bg-violet-100 text-violet-600 rounded-lg px-6 py-2 whitespace-nowrap transition-colors hover:bg-violet-200 max-[410px]:text-xs max-[410px]:px-4 max-[410px]:py-1.5"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    <div className="p-3 overflow-y-auto flex-1 max-[410px]:p-2">
                                        {filteredCategories.map((category) => (
                                            <label
                                                key={category}
                                                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50 max-[410px]:gap-2 max-[410px]:px-2 max-[410px]:py-1.5"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category)}
                                                    onChange={() => handleCategoryToggle(category)}
                                                    className="w-5 h-5 cursor-pointer accent-violet-500 shrink-0 max-[410px]:w-4 max-[410px]:h-4"
                                                />
                                                <span className="text-sm text-gray-600 max-[410px]:text-xs">{category}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop header */}
                <div className="hidden md:flex flex-col gap-4">
                    <div className="flex items-center">
                        <h1 className="m-0 font-bold text-base leading-6 text-gray-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                            {props.title || "All Articles"}
                        </h1>
                    </div>

                    <div className="flex items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={() => setSelectAll(!selectAll)}
                                    className="w-[18px] h-[18px] cursor-pointer accent-violet-500"
                                />
                                <span className="font-bold text-base leading-6 text-gray-500">
                                    Select all
                                </span>
                            </label>

                            {[
                                { icon: "/images/icons/copy.svg", label: "Copy" },
                                { icon: "/images/icons/share.svg", label: "Send" },
                                { icon: "/images/icons/trash1.svg", label: "Delete" },
                            ].map((btn) => (
                                <button
                                    key={btn.label}
                                    title={btn.label}
                                    className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                                >
                                    <img src={btn.icon} alt={btn.label} className="w-5 h-5" />
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="min-w-[180px] flex items-center justify-between gap-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer transition hover:border-violet-500"
                            >
                                Choose Category
                                <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100]">
                                    <div className="p-4 flex gap-3 border-b border-gray-200">
                                        <input
                                            type="text"
                                            placeholder="Search Category..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-violet-500 focus:bg-white placeholder:text-gray-400"
                                        />
                                        <button
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="text-sm font-medium bg-violet-100 text-violet-600 rounded-lg px-6 py-2 whitespace-nowrap transition-colors hover:bg-violet-200"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    <div className="p-3 overflow-y-auto flex-1">
                                        {filteredCategories.map((category) => (
                                            <label
                                                key={category}
                                                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category)}
                                                    onChange={() => handleCategoryToggle(category)}
                                                    className="w-5 h-5 cursor-pointer accent-violet-500 shrink-0"
                                                />
                                                <span className="text-sm text-gray-600">{category}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-4 pb-[85px]">
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