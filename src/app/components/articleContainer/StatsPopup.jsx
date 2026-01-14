"use client"

import { useEffect, useRef } from 'react'

export default function StatsPopup({ isOpen, onClose, position, stats }) {
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

    // Use provided stats or default to zeros
    const displayStats = stats || [
        { label: 'Views', value: 0, color: '#8B5CF6' },
        { label: 'Revisits', value: 0, color: '#8B5CF6' },
        { label: 'Comments', value: 0, color: '#8B5CF6' },
        { label: 'Shares', value: 0, color: '#8B5CF6' }
    ]

    return (
        <div
            ref={popupRef}
            className="fixed z-50 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateX(-100%)',
                width: '280px',
                height: '80px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                paddingTop: '16px',
                paddingRight: '16px',
                paddingBottom: '16px',
                paddingLeft: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
            }}
        >
            {displayStats.map((stat, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span 
                        style={{ 
                            fontFamily: 'Public Sans',
                            fontWeight: 600,
                            fontSize: '12px',
                            lineHeight: '100%',
                            letterSpacing: '0%',
                            backgroundImage: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            MozBackgroundClip: 'text',
                            MozTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            display: 'inline-block'
                        }}
                    >
                        {stat.label}
                    </span>
                    <span style={{ 
                        fontFamily: 'Public Sans',
                        fontWeight: 800,
                        fontSize: '32px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#292929'
                    }}>
                        {stat.value}
                    </span>
                </div>
            ))}
        </div>
    )
}
