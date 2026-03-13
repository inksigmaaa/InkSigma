"use client";

import { useState } from "react";

export default function ArticleDropdown({ items = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuItems = items.filter((item) => !item.hidden);

    return (
        <div className="relative">
            <button
                className="w-8 h-8 bg-transparent border border-gray-200 cursor-pointer flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen((currentValue) => !currentValue)}
                aria-label="More options"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="4" r="1.5" fill="#6B7280" />
                    <circle cx="10" cy="10" r="1.5" fill="#6B7280" />
                    <circle cx="10" cy="16" r="1.5" fill="#6B7280" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[99]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-10 right-0 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-w-[220px] z-[100] overflow-hidden py-2 px-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                className={`flex items-center gap-4 px-4 py-3 font-['Public_Sans'] font-normal text-base leading-[150%] bg-white border-none w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-lg ${
                                    item.danger ? "text-red-600" : "text-gray-700"
                                }`}
                                onClick={() => {
                                    setIsOpen(false);
                                    item.onClick?.();
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
