import React from 'react';

const UserAvatar = ({ 
    user, 
    size = 'md', 
    className = '' 
}) => {
    // Size classes
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg'
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;

    // If no user data, show default
    if (!user) {
        return (
            <div className={`${sizeClass} rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold ${className}`}>
                U
            </div>
        );
    }

    const userEmail = user.email || "";
    const userName = user.name || "User";
    
    // Check for avatar in multiple possible field names
    const avatarUrl = user.avatar || user.image || user.picture || user.photo;
    
    // Check if user has any avatar URL
    const hasAvatar = avatarUrl && avatarUrl.trim() !== '';
    
    // Show email initial only for users without any avatar
    if (!hasAvatar && userEmail) {
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
        
        return (
            <div className={`${sizeClass} rounded-full ${colorClass} flex items-center justify-center text-white font-semibold ${className}`}>
                {initial}
            </div>
        );
    }

    // For users with avatars, show the image
    return (
        <img
            src={avatarUrl || "/images/icons/profileuser.svg"}
            alt={`${userName}'s avatar`}
            className={`${sizeClass} rounded-full object-cover ${className}`}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
                // If it's a Google image and first attempt failed, try alternative URL
                if (e.target.src.includes('googleusercontent.com') && !e.target.dataset.retried) {
                    e.target.dataset.retried = 'true';
                    const baseUrl = e.target.src.split('=')[0];
                    e.target.src = `${baseUrl}=s96-c`;
                    return;
                }
                
                // If image fails to load and user has email, show initial
                if (userEmail) {
                    const initial = userEmail.charAt(0).toUpperCase();
                    let hash = 0;
                    for (let i = 0; i < userEmail.length; i++) {
                        hash = userEmail.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'];
                    const colorClass = colors[Math.abs(hash) % colors.length];
                    
                    e.target.outerHTML = `<div class="${sizeClass} rounded-full ${colorClass} flex items-center justify-center text-white font-semibold ${className}">${initial}</div>`;
                } else {
                    // Fallback to default icon
                    e.target.src = "/images/icons/profileuser.svg";
                }
            }}
        />
    );
};

export default UserAvatar;