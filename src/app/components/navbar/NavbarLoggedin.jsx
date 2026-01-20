"use client"
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut, authClient } from "@/lib/auth-client";
import UserAvatar from "@/components/ui/UserAvatar";
import { formatTimeAgo } from "@/utils/timeFormatter";

export default function NavbarLoggedin() {
    const [open, setOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const notificationRef = useRef(null);
    const notificationIntervalRef = useRef(null);
    const router = useRouter();
    
    // Get current user session
    const { data: session, isPending } = useSession();
    const user = session?.user;

    // Fetch notifications with useCallback to prevent unnecessary re-renders
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        
        const isInitialLoad = notifications.length === 0;
        if (isInitialLoad) {
            setLoading(true);
        }
        
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${user.id}`);
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    }, [user?.id, notifications.length]);

    // Fetch notifications when user is available
    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user?.id, fetchNotifications]);

    // Auto-refresh notifications every 30 seconds for real-time updates
    useEffect(() => {
        if (!user?.id) return;

        notificationIntervalRef.current = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => {
            if (notificationIntervalRef.current) {
                clearInterval(notificationIntervalRef.current);
            }
        };
    }, [user?.id, fetchNotifications]);

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

    // Listen for profile updates from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'profileUpdated') {
                // Reload page when profile is updated in another tab
                window.location.reload();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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

    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        
        // Close notification dropdown
        setNotificationOpen(false);
        
        // Navigate to the appropriate page
        if (notification.navigationUrl) {
            router.push(notification.navigationUrl);
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
                                className="absolute top-[35px] right-0 w-[392px] h-[511px] bg-white overflow-hidden z-[99999] rounded-[10px] border border-[#e5e5e5] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex flex-col max-md:fixed max-md:top-[80px] max-md:left-4 max-md:right-4 max-md:w-auto max-md:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                            >
                                {/* Header */}
                                <div 
                                    className="flex items-center justify-between w-full h-[50px] px-3 py-2 bg-white border-b border-[#e5e5e5] gap-2 max-md:p-3"
                                >
                                    <h3 
                                        className="font-sans font-semibold text-sm leading-none text-black max-md:text-base"
                                    >
                                        Notification
                                    </h3>
                                    <button 
                                        onClick={() => setNotificationOpen(false)}
                                        className="flex items-center justify-center w-7 h-7 rounded hover:bg-[#f5f5f5] transition-colors bg-white border-none cursor-pointer"
                                    >
                                        <img 
                                            src="/images/icons/close.svg" 
                                            alt="close"
                                            className="w-3 h-3"
                                        />
                                    </button>
                                </div>

                                {/* Notifications List */}
                                <div 
                                    className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                                >
                                    {loading ? (
                                        <div className="p-8 text-center text-[#999]">
                                            Loading notifications...
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-8 text-center text-[#999]">
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.map((notification) => {
                                            // For publication-related notifications, create an avatar object with publication logo
                                            let avatarUser = notification.avatarUser || { image: notification.avatar };
                                            
                                            // If this is a publication notification and we have a publication logo, use it
                                            if (notification.relatedPublicationId && notification.avatar && notification.avatar.includes('localhost:5000')) {
                                                avatarUser = {
                                                    name: notification.title,
                                                    image: notification.avatar,
                                                    email: notification.title
                                                };
                                            }
                                            
                                            return (
                                                <div 
                                                    key={notification.id} 
                                                    className={`flex items-start gap-3 p-4 hover:bg-[#F8F9FA] border-b border-[#F0F0F0] last:border-b-0 cursor-pointer max-md:p-3 max-md:gap-2.5 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <UserAvatar 
                                                        user={avatarUser}
                                                        size="sm"
                                                        className="flex-shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 
                                                            className="font-sans font-semibold text-sm leading-none text-black mb-1"
                                                        >
                                                            {notification.title}
                                                        </h4>
                                                        <p 
                                                            className="font-sans font-normal text-sm leading-[150%] text-[#808080] mb-1"
                                                        >
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-1 h-[18px]">
                                                            <span 
                                                                className="w-1 h-1 rounded-full bg-[#A4A4A4] flex-shrink-0"
                                                            ></span>
                                                            <span 
                                                                className="font-sans font-normal text-xs leading-[150%] text-[#808080]"
                                                            >
                                                                {formatTimeAgo(notification.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
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
                            <div className="flex items-center gap-2 text-sm font-medium text-[#333] max-md:hidden">
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
                                className="absolute top-[50px] right-0 w-[200px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-[#EDEDED] rounded-lg flex flex-col gap-1 p-2 z-[99999] max-md:fixed max-md:top-[80px] max-md:right-5 max-md:w-[180px] max-md:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                            >
                                <a href="/profile-settings"
                                    className="px-2 py-1 rounded text-xs font-normal text-gray-700 hover:text-black">
                                    Profile Settings
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="px-2 py-1 rounded text-xs font-normal text-gray-700 hover:text-black text-left">
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