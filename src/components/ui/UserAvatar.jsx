'use client';

import React, { useState, useEffect } from 'react';

const UserAvatar = ({ 
    user, 
    size = 'md', 
    className = '' 
}) => {
    const [imageError, setImageError] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Size classes
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg'
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;

    const userEmail = user?.email || "";
    const userName = user?.name || "User";
    
    // Check for avatar in multiple possible field names
    const avatarUrl = user?.avatar || user?.image || user?.picture || user?.photo;
    
    // Check if user has any avatar URL
    const hasAvatar = avatarUrl && avatarUrl.trim() !== '' && !imageError;
    
    // Generate initial and color for fallback
    const getInitialAndColor = () => {
        if (!userEmail) {
            return { initial: 'U', colorClass: 'bg-gray-300' };
        }
        
        const initial = userEmail.charAt(0).toUpperCase();
        
        // Generate color based on email
        let hash = 0;
        for (let i = 0; i < userEmail.length; i++) {
            hash = userEmail.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colors = [
            'bg-blue-500',
            'bg-green-500', 
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-red-500',
            'bg-yellow-500',
            'bg-teal-500'
        ];
        
        const colorClass = colors[Math.abs(hash) % colors.length];
        
        return { initial, colorClass };
    };

    const { initial, colorClass } = getInitialAndColor();

    // Show fallback on server or until mounted to prevent hydration mismatch
    if (!isMounted || !hasAvatar) {
        return (
            <div className={`${sizeClass} rounded-full ${colorClass} flex items-center justify-center text-white font-semibold ${className}`}>
                {initial}
            </div>
        );
    }

    // For users with avatars, show the image
    return (
        <img
            src={avatarUrl}
            alt={`${userName}'s avatar`}
            className={`${sizeClass} rounded-full object-cover ${className}`}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => {
                setImageError(true);
            }}
        />
    );
};

export default UserAvatar;