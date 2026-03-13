"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/icons/SvgIcons";

import PersonalArticleContainer from "../personalArticleContainer/PersonalArticleContainer";

const CATEGORIES = [
    "Agriculture",
    "Art & Illustration",
    "Business",
    "Climate & Environment",
    "Comics and Anime",
    "Crypto & Web-3",
    "Design",
    "Education",
    "Entertainment",
    "Faith & Spiritual",
    "Fashion & Beauty",
    "Fiction",
    "Finance & Economics",
    "Food & Drink",
    "Games",
    "Health & Wellness",
    "History",
    "Humor",
    "Law",
    "Literature",
    "Marketing",
    "Music",
    "News",
    "NSFW",
    "Parenting & Family",
    "Philosophy",
    "Poetry",
    "Politics",
    "Psychology",
    "Relationships",
    "Romance",
    "Science",
    "Space",
    "Sports",
    "Startups & Companies",
    "Technology",
    "Travel",
];

export default function PersonalArticles({
    actionButtons = [],
    articles = [],
    emptyMessage = "No articles yet",
    loading = false,
    onArticleSelect,
    onSelectAll,
    selectedArticles = [],
    showActions = false,
    showSelectAll = false,
    title = "All Articles",
    titleColor = "#8B5CF6",
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCategories = useMemo(
        () =>
            CATEGORIES.filter((category) =>
                category.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [searchTerm]
    );

    const selectAll = showSelectAll && articles.length > 0 && selectedArticles.length === articles.length;

    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-[200px] w-full max-w-[1034px] z-20 px-5 max-md:top-[260px]">
            <div className="ml-[185px] max-md:ml-0">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h1 className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-800 m-0 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: titleColor }} />
                        {title}
                    </h1>

                    <div className={`relative ${showActions ? "md:hidden" : ""}`}>
                        <Button
                            variant="outline"
                            className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-gray-500 bg-white border border-gray-300 rounded-lg px-4 py-1 h-8 flex items-center gap-2 cursor-pointer min-w-[180px] justify-between"
                            onClick={() => setIsDropdownOpen((currentValue) => !currentValue)}
                        >
                            Choose Category
                            <ChevronDownIcon className="shrink-0" />
                        </Button>

                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] w-80 h-64 flex flex-col z-[100]">
                                <div className="p-2.5 flex gap-3 border-b border-gray-200">
                                    <input
                                        type="text"
                                        placeholder="Search Category..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        className="flex-1 font-['Public_Sans'] font-normal text-sm leading-[150%] px-3.5 py-2.5 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-purple-600 focus:bg-white placeholder:text-gray-400"
                                    />
                                    <Button
                                        className="font-['Public_Sans'] font-medium text-sm leading-[150%] bg-purple-100 text-purple-600 border-none rounded-lg px-6 py-2.5 cursor-pointer whitespace-nowrap hover:bg-purple-200"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Apply
                                    </Button>
                                </div>
                                <div className="p-3 overflow-y-auto flex-1">
                                    {filteredCategories.map((category) => (
                                        <label
                                            key={category}
                                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-gray-50"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 cursor-pointer accent-purple-600 shrink-0"
                                            />
                                            <span className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-gray-600">
                                                {category}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showActions && (
                    <div className="flex items-center justify-between gap-4 mb-4 max-md:hidden">
                        <div className="flex items-center gap-4">
                            {showSelectAll && (
                                <label className="flex items-center gap-2 cursor-pointer w-[123px] h-8 bg-[#F8F8F8] rounded px-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={(event) => onSelectAll?.(event.target.checked)}
                                        className="w-[18px] h-[18px] cursor-pointer accent-purple-600"
                                    />
                                    <span className="font-['Public_Sans'] font-bold text-base leading-6 text-gray-500">
                                        Select all
                                    </span>
                                </label>
                            )}

                            {actionButtons.map((button) => (
                                <Button
                                    key={button.title}
                                    variant="ghost"
                                    size="icon"
                                    title={button.title}
                                    onClick={button.onClick}
                                    disabled={button.disabled}
                                >
                                    <img src={button.icon} alt="" className="w-5 h-5" />
                                </Button>
                            ))}
                        </div>

                        <div className="relative">
                            <Button
                                variant="outline"
                                className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-gray-500 bg-white border border-gray-300 rounded-lg px-4 py-1 h-8 flex items-center gap-2 cursor-pointer min-w-[180px] justify-between"
                                onClick={() => setIsDropdownOpen((currentValue) => !currentValue)}
                            >
                                Choose Category
                                <ChevronDownIcon className="shrink-0" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-4">
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                            <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">
                                Loading articles...
                            </p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[200px] py-20 px-10 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,#E5E7EB_10px,#E5E7EB_11px)]">
                            <p className="font-['Public_Sans'] font-normal text-base leading-6 text-gray-400 text-center bg-white px-6 py-3 relative z-[1]">
                                {emptyMessage}
                            </p>
                        </div>
                    ) : (
                        articles.map((article) => (
                            <PersonalArticleContainer
                                key={article.id}
                                id={article.id}
                                categories={article.categories}
                                description={article.description}
                                isSelected={selectedArticles.includes(article.id)}
                                onDelete={article.onDelete}
                                onEdit={article.onEdit}
                                onPublish={article.onPublish}
                                onRestore={article.onRestore}
                                onSelect={onArticleSelect}
                                onUnpublish={article.onUnpublish}
                                postedTime={article.postedTime}
                                status={article.status}
                                title={article.title}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
