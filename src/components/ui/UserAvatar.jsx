'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};

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

function getInitialAndColor(identifier, name) {
  const seed = (identifier || name || '').trim();

  if (!seed) {
    return { initial: 'U', colorClass: 'bg-gray-300' };
  }

  const initial = (name || identifier).charAt(0).toUpperCase();

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colorClass = colors[Math.abs(hash) % colors.length];

  return { initial, colorClass };
}

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const UserAvatar = ({ 
    user, 
    size = 'md', 
    className = '' 
}) => {
    const [imageError, setImageError] = useState(false);
    const isMounted = useSyncExternalStore(
        subscribe,
        getClientSnapshot,
        getServerSnapshot
    );

    const sizeClass = sizeClasses[size] || sizeClasses.md;

    // Keep server render and first client render identical to avoid hydration drift.
    const userIdentifier = isMounted ? (user?.email || user?.name || "") : "";
    const userName = user?.name || "User";
    
    const avatarUrl = user?.avatar || user?.image || user?.picture || user?.photo;
    
    const hasAvatar = avatarUrl && avatarUrl.trim() !== '' && !imageError;
    
    const { initial, colorClass } = getInitialAndColor(userIdentifier, userName);

    // Show fallback on server or until mounted to prevent hydration mismatch
    if (!isMounted || !hasAvatar) {
        return (
            <Avatar className={`${sizeClass} ${colorClass} ${className}`}>
                <AvatarFallback className={`h-full w-full ${colorClass} text-white font-semibold`}>
                    {initial}
                </AvatarFallback>
            </Avatar>
        );
    }

    return (
        <Avatar className={`${sizeClass} ${className}`}>
            <AvatarImage 
                src={avatarUrl} 
                alt={`${userName}'s avatar`}
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
            />
            <AvatarFallback className={`h-full w-full ${colorClass} text-white font-semibold`}>
                {initial}
            </AvatarFallback>
        </Avatar>
    );
};

export default UserAvatar;
