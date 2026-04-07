"use client"

import { useEffect, useState } from 'react'

/**
 * Page transition wrapper that fades in content smoothly
 * Prevents jarring rendering by animating the content appearance
 */
export default function PageTransition({ children, className = "" }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Small delay to ensure content is ready before animating
        const timer = setTimeout(() => {
            setMounted(true)
        }, 50)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div
            className={`transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${className}`}
        >
            {children}
        </div>
    )
}
