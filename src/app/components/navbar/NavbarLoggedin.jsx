"use client"
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import UserAvatar from "@/components/ui/UserAvatar";

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Less than 1 minute
    if (diffInSeconds < 60) return "Just now";
    
    // 1-59 minutes
    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }
    
    // 1-23 hours
    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;
    }
    
    // Yesterday
    if (diffInDays === 1) {
        return "Yesterday";
    }
    
    // 2-6 days ago
    if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    }
    
    // 1-4 weeks ago
    if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Format as date for older notifications
    const options = { month: 'short', day: 'numeric' };
    // Add year if it's not current year
    if (notificationDate.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
    }
    return notificationDate.toLocaleDateString('en-US', options);
}

export default function NavbarLoggedin() {
    const [open, setOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const wrapperRef = useRef(null);
    const notificationRef = useRef(null);
    const router = useRouter();
    
    // Get current user session
    const { data: session, isPending } = useSession();
    const user = session?.user;

    // Fetch notifications when user is available
    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user?.id]);

    // Auto-refresh notifications every 30 seconds
    useEffect(() => {
        if (!user?.id) return;

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user?.id]);

    // Update current time every minute to refresh "time ago" displays
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${user.id}`);
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
                method: "PATCH",
            });
            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleLogout = async () => {
        // Clear local data first
        localStorage.clear();
        sessionStorage.clear();
        
        try {
            // Try to sign out from server (but don't wait for it)
            signOut().catch(() => {
                // Silently ignore server errors
            });
        } catch (error) {
            // Silently ignore any errors
        }
        
        // Redirect immediately
        router.push("/");
    };

    const userName = user?.name || "User";
    const userEmail = user?.email || "";
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="fixed top-0 left-0 w-full flex justify-center bg-white p-5 z-[100]">
            <div className="w-full max-w-[1034px] flex justify-between items-center h-[85px] px-6 py-4 bg-white shadow-[0_4px_25px_0_#00000012] rounded-lg max-md:px-4 max-md:py-3 max-md:h-[70px]">

                {/* Logo */}
                <a href="/" className="flex items-center">
                    <img src="/icons/inksigma-logo.svg" alt="Inksigma logo"
                        className="h-8 w-auto max-md:h-7" />
                </a>

                {/* Profile Section */}
                <div className="flex items-center gap-4 max-md:gap-3">
                    {/* Notification */}
                    <div ref={notificationRef} className="relative">
                        <div 
                            className="flex items-center cursor-pointer relative"
                            onClick={() => setNotificationOpen((prev) => !prev)}
                        >
                            <img
                                src={notificationOpen ? "/svg/color-bell.svg" : "/images/icons/Notification.svg"}
                                alt="notification"
                                className="w-6 h-6 max-md:w-[22px] max-md:h-[22px]"
                            />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>

                        {/* Notification Dropdown */}
                        {notificationOpen && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-[35px] right-0 w-[400px] max-h-[500px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-[#E5E5E5] rounded-xl overflow-hidden z-[99999] max-md:fixed max-md:top-[80px] max-md:left-4 max-md:right-4 max-md:w-auto max-md:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-[#F0F0F0] max-md:p-3">
                                    <h3 className="text-[18px] font-semibold text-[#333] max-md:text-[16px]">Notification</h3>
                                    <button 
                                        onClick={() => setNotificationOpen(false)}
                                        className="text-[#999] hover:text-[#333] transition-colors"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="max-md:w-5 max-md:h-5">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                {/* Notifications List */}
                                <div className="max-h-[400px] overflow-y-auto scrollbar-hide max-md:max-h-[60vh]"
                                     style={{
                                         scrollbarWidth: 'none', /* Firefox */
                                         msOverflowStyle: 'none'  /* Internet Explorer 10+ */
                                     }}>
                                    {loading ? (
                                        <div className="p-8 text-center text-[#999]">
                                            Loading notifications...
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-8 text-center text-[#999]">
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div 
                                                key={notification.id} 
                                                className={`flex items-start gap-3 p-4 hover:bg-[#F8F9FA] transition-colors border-b border-[#F0F0F0] last:border-b-0 max-md:p-3 max-md:gap-2.5 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                onClick={() => !notification.isRead && markAsRead(notification.id)}
                                            >
                                                <img 
                                                    src={notification.avatar} 
                                                    alt="avatar" 
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 max-md:w-9 max-md:h-9"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[14px] font-semibold text-[#333] mb-1 max-md:text-[13px]">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-[13px] text-[#666] mb-2 leading-relaxed max-md:text-[12px] max-md:mb-1.5">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[12px] text-[#999] max-md:text-[11px]">
                                                        {!notification.isRead && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                        )}
                                                        <span key={currentTime.getTime()}>{formatTimeAgo(notification.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div ref={wrapperRef} className="relative">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setOpen((prev) => !prev)}
                        >
                            <UserAvatar 
                                user={user}
                                size="md"
                                className="max-md:w-9 max-md:h-9"
                            />

                            {/* Hide name on mobile */}
                            <div className="flex items-center gap-2 text-[14px] font-medium text-[#333] max-md:hidden">
                                {isPending ? "Loading..." : userName}
                                <span className="flex items-center">
                                    <img src="/images/icons/down.svg" className="w-4 h-4" />
                                </span>
                            </div>
                        </div>

                        {/* Dropdown */}
                        {open && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-[50px] right-0 w-[200px] bg-white shadow-[0_4px_24px_rgb(0,0,0,0.1)] border border-[#EDEDED] rounded-lg flex flex-col gap-1 p-2 z-[99999] max-md:fixed max-md:top-[80px] max-md:right-5 max-md:w-[180px] max-md:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                            >
                                <a href="/profile-settings"
                                    className="px-2 py-1 rounded text-[12px] font-normal text-gray-700 hover:text-black">
                                    Profile Settings
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="px-2 py-1 rounded text-[12px] font-normal text-text-gray-700 hover:text-black text-left">
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}