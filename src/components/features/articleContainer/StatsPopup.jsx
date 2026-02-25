"use client"

import { useRef } from 'react'

export default function StatsPopup({ isOpen, onClose, stats }) {
    const popupRef = useRef(null)

    if (!isOpen || !stats) return null

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                ref={popupRef}
                className="bg-white rounded-lg border border-gray-200 shadow-xl p-6 w-full max-w-3xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center gap-4 w-full">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-center border border-gray-300 rounded-md p-6 bg-gray-50 min-h-24">
                            <div className="text-4xl font-bold text-gray-900 mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
