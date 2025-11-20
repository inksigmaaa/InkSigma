"use client"

import { useEffect, useRef } from 'react'

export default function StatsPopup({ isOpen, onClose, position }) {
    const popupRef = useRef(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                // Check if click is on stats button (has stats icon or is stats button)
                const isStatsButton = event.target.closest('button[title="Stats"]')
                if (!isStatsButton) {
                    onClose()
                }
            }
        }

        if (isOpen) {
            // Add slight delay to prevent immediate close on open
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside)
            }, 100)
            
            return () => {
                clearTimeout(timer)
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const stats = [
        { label: 'Views', value: 7, color: '#8B5CF6' },
        { label: 'Revisits', value: 13, color: '#8B5CF6' },
        { label: 'Comments', value: 143, color: '#8B5CF6' },
        { label: 'Shares', value: 69, color: '#8B5CF6' }
    ]

    return (
        <div
            ref={popupRef}
            className="fixed z-50 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateX(-100%)',
                width: '260px',
                height: '60px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                paddingTop: '12px',
                paddingRight: '16px',
                paddingBottom: '12px',
                paddingLeft: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px'
            }}
        >
            {stats.map((stat, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span 
                        style={{ 
                            fontFamily: 'Public Sans',
                            fontWeight: 600,
                            fontSize: '11px',
                            lineHeight: '14px',
                            color: stat.color
                        }}
                    >
                        {stat.label}
                    </span>
                    <span style={{ 
                        fontFamily: 'Public Sans',
                        fontWeight: 700,
                        fontSize: '18px',
                        lineHeight: '22px',
                        color: '#000000'
                    }}>
                        {stat.value}
                    </span>
                </div>
            ))}
        </div>
    )
}
