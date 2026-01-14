"use client"

import { useEffect, useRef } from 'react'

export default function StatsPopup({ isOpen, onClose, position, stats }) {
    const popupRef = useRef(null)

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                const isStatsButton = event.target.closest('button[title="Stats"]')
                if (!isStatsButton) {
                    onClose()
                }
            }
        }

        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 100)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    if (!isOpen || !stats) return null

    return (
        <div
            ref={popupRef}
            className="fixed z-[9999] bg-white rounded-lg border border-gray-200 shadow-xl p-6"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
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
    )
}
