"use client"
import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut, authClient } from "@/lib/auth-client";
import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/utils/timeFormatter";
import { getApiBase } from "@/utils/apiBase";
import { getPostLogoutPath } from "@/utils/auth";
import {
    buildGetJsonDedupeKey,
    dedupeJsonRequest,
} from "@/utils/jsonRequestDedupe";
import { useExclusivePopup } from "@/hooks/useExclusivePopup";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";

const formatJoinedDate = (dateValue) => {
    if (!dateValue) return null;
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
    }).format(parsedDate);
};

const getInitials = (name = "User") => {
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");

    return initials || "U";
};

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function NavbarLoggedin() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const wrapperRef = useRef(null);
    const notificationRef = useRef(null);
    const notificationIntervalRef = useRef(null);
    const hasLoadedNotificationsRef = useRef(false);
    const router = useRouter();
    const API_URL = getApiBase();
    const {
        isOpen,
        openPopup,
        closePopup,
        togglePopup,
        closeAllPopups,
    } = useExclusivePopup();

    // Get current user session
    const { data: session, isPending, refetch } = useSession();
    const [localUserData, setLocalUserData] = useState(null);
    const user = session?.user;
    const isMounted = useSyncExternalStore(
        subscribe,
        getClientSnapshot,
        getServerSnapshot,
    );

    // Check for locally stored fresh user data
    useEffect(() => {
        const checkLocalUserData = () => {
            const stored = localStorage.getItem('freshUserData');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setLocalUserData(parsed);
                } catch (e) {
                    console.error("Error parsing freshUserData:", e);
                }
            }
        };
        checkLocalUserData();
    }, [session]);

    // Merge session user with locally stored fresh user data
    const mergedUser = user ? {
        ...user,
        ...(localUserData && {
            name: localUserData.profileName || user.name,
            image: localUserData.image || user.image,
        })
    } : null;

    // Fetch notifications with useCallback to prevent unnecessary re-renders
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        const isInitialLoad = !hasLoadedNotificationsRef.current;
        if (isInitialLoad) {
            setLoading(true);
        }

        try {
            const requestUrl = `${API_URL}/api/notifications/${user.id}?limit=20`;
            const requestOptions = {
                credentials: "include",
                cache: "no-store",
            };
            const data = await dedupeJsonRequest(
                buildGetJsonDedupeKey(requestUrl, requestOptions),
                async () => {
                    const response = await fetch(requestUrl, requestOptions);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                },
            );
            hasLoadedNotificationsRef.current = true;
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error("Error fetching notifications:", error.message);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    }, [user?.id, API_URL]);

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
            const clickedInsideProfile = wrapperRef.current?.contains(event.target);
            const clickedInsideNotification = notificationRef.current?.contains(event.target);

            if (!clickedInsideProfile && !clickedInsideNotification) {
                closeAllPopups();
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [closeAllPopups]);

    // Listen for profile updates from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'profileUpdated') {
                // Refresh session data and router
                refetch();
                router.refresh();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refetch, router]);

    // Handle scroll behavior for mobile - hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Only apply this behavior on mobile (screen width < 768px)
            if (window.innerWidth < 768) {
                if (currentScrollY > lastScrollY && currentScrollY > 50) {
                    // Scrolling down & past 50px
                    setIsVisible(false);
                } else {
                    // Scrolling up or at top
                    setIsVisible(true);
                }
            } else {
                // Always visible on desktop
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
                method: "PATCH",
                credentials: "include",
                cache: "no-store",
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
        closePopup("notification");

        // Navigate to the appropriate page
        if (notification.navigationUrl) {
            router.push(notification.navigationUrl);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace(getPostLogoutPath());
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Logout failed. Please try again.");
        }
    };

    const userName = mergedUser?.name || user?.name || "User";
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const isNotificationOpen = isOpen("notification");
    const isProfileDropdownOpen = isOpen("profileDropdown");
    const isProfileHoverOpen = isOpen("profileHover");
    const userEmail = mergedUser?.email || user?.email || "";
    const userDescription = localUserData?.bio?.trim()
        || (localUserData?.username ? `@${localUserData.username}` : "")
        || (userEmail ? `Signed in as ${userEmail}` : "InkSigma member");
    const userAvatar =
        mergedUser?.image
        || user?.image
        || mergedUser?.avatar
        || user?.avatar
        || mergedUser?.picture
        || user?.picture
        || null;
    const displayUserName = isMounted ? userName : "User";
    const displayUserDescription = isMounted ? userDescription : "InkSigma member";
    const displayUserAvatar = isMounted ? userAvatar : null;
    const joinedDateText = `Joined ${formatJoinedDate(mergedUser?.createdAt || user?.createdAt || localUserData?.createdAt) || "recently"}`;
    const displayJoinedDateText = isMounted ? joinedDateText : "Joined recently";
    const avatarFallback = getInitials(displayUserName);

    return (
        <div className={`fixed left-0 right-0 top-0 z-50 transition-transform duration-300 sm:bg-white sm:border-b sm:border-gray-200 md:bg-white md:border-0 ${!isVisible ? 'sm:-translate-y-full' : 'sm:translate-y-0'}`}>
            <div className="w-full max-w-[1034px] mx-auto mt-[22px] md:mt-[15px] sm:mt-0 px-4 md:px-2 sm:px-4 sm:pb-2 md:pb-0 max-md:mt-0 max-md:px-0">
                <div className="w-full h-[82px] flex justify-between items-center rounded-[8px] pt-[16px] pr-[24px] pb-[16px] pl-[24px] bg-[#FFFFFF] shadow-[0px_4px_25px_0px_rgba(0,0,0,0.07)] md:px-4 md:py-3 md:h-[70px] sm:px-6 sm:py-4 sm:h-[70px] sm:rounded-none sm:shadow-none sm:pt-4 sm:pb-4 md:rounded-[8px] md:shadow-[0px_4px_25px_0px_rgba(0,0,0,0.07)]">

                    {/* Logo */}
                    <Link href="/" className="flex items-center border-0 outline-none flex-shrink-0 ml-3">
                        <img src="/icons/inksigma-logo.svg" alt="Inksigma logo"
                            className="h-8 w-auto md:h-8 sm:w-[98px] sm:h-[32px] border-0" />
                    </Link>

                    {/* Profile Section */}
                    <div className="flex items-center gap-[16px] opacity-100 md:gap-4 mr-3">
                        {/* Notification */}
                        <div ref={notificationRef} className="relative">
                            <div
                                className="flex items-center cursor-pointer relative"
                                onClick={() => togglePopup("notification")}
                            >
                                <img
                                    src={isNotificationOpen ? "/svg/color-bell.svg" : "/images/icons/Notification.svg"}
                                    alt="notification"
                                    className="w-6 h-6 md:w-6 md:h-6 sm:w-6 sm:h-6"
                                />
                                {unreadCount > 0 && (
                                    <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 flex items-center justify-center ${unreadCount > 9 ? 'px-1.5 min-w-[1rem]' : 'w-4'}`}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>

                            {/* Notification Dropdown */}
                            {isNotificationOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-[35px] right-0 w-[392px] max-h-[511px] bg-white overflow-hidden z-[99999] rounded-[10px] border border-[#e5e5e5] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex flex-col max-[414px]:fixed max-[414px]:top-[80px] max-[414px]:left-4 max-[414px]:right-4 max-[414px]:w-auto max-[414px]:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                                >
                                    {/* Header */}
                                    <div
                                        className="flex items-center justify-between w-full h-[50px] px-3 py-2 bg-white border-b border-[#e5e5e5] gap-2 max-[414px]:h-[44px] max-[414px]:p-2.5"
                                    >
                                        <h3
                                            className="font-sans font-semibold text-sm leading-none text-black max-[414px]:text-xs"
                                        >
                                            Notification
                                        </h3>
                                        <button
                                            onClick={() => closePopup("notification")}
                                            className="flex items-center justify-center w-7 h-7 rounded hover:bg-[#f5f5f5] transition-colors bg-white border-none cursor-pointer max-[414px]:w-6 max-[414px]:h-6"
                                        >
                                            <img
                                                src="/images/icons/close.svg"
                                                alt="close"
                                                className="w-3 h-3 max-[414px]:w-2.5 max-[414px]:h-2.5"
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
                                                // Normalize avatar payload so publication and user notifications render consistently.
                                                const avatarUser = {
                                                    ...(notification.avatarUser || {}),
                                                    name: notification.avatarUser?.name || notification.title || "Notification",
                                                    email: notification.avatarUser?.email || notification.avatarUser?.name || notification.title || "Notification",
                                                    image: notification.avatar || notification.avatarUser?.image || null,
                                                };

                                                return (
                                                    <div
                                                        key={notification.id}
                                                        className={`flex items-start gap-3 p-4 hover:bg-[#F8F9FA] border-b border-[#F0F0F0] last:border-b-0 cursor-pointer max-[414px]:p-2.5 max-[414px]:gap-2 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                        onClick={() => handleNotificationClick(notification)}
                                                    >
                                                        <UserAvatar
                                                            user={avatarUser}
                                                            size="sm"
                                                            className="flex-shrink-0 max-[414px]:w-8 max-[414px]:h-8"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            {/* Mobile (0-414px) - time below with dot separator */}
                                                            <div className="min-[415px]:hidden">
                                                                <h4
                                                                    className="font-sans font-semibold text-xs leading-none text-black mb-0.5"
                                                                >
                                                                    {notification.title}
                                                                </h4>
                                                                <p
                                                                    className="font-sans font-normal text-xs leading-[150%] text-[#808080] mb-0.5 line-clamp-2"
                                                                >
                                                                    {notification.message}
                                                                </p>
                                                                <div className="flex items-center gap-1 h-[14px]">
                                                                    <span
                                                                        className="w-1 h-1 rounded-full bg-[#A4A4A4] flex-shrink-0"
                                                                    ></span>
                                                                    <span
                                                                        className="font-sans font-normal text-[10px] leading-[150%] text-[#808080]"
                                                                    >
                                                                        {formatTimeAgo(notification.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Tablet (415-767px) - time on right with message */}
                                                            <div className="hidden min-[415px]:block min-[768px]:hidden">
                                                                <h4
                                                                    className="font-sans font-semibold text-sm leading-none text-black mb-1"
                                                                >
                                                                    {notification.title}
                                                                </h4>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p
                                                                        className="font-sans font-normal text-sm leading-[150%] text-[#808080]"
                                                                    >
                                                                        {notification.message}
                                                                    </p>
                                                                    <span
                                                                        className="font-sans font-normal text-xs leading-[150%] text-[#808080] flex-shrink-0 whitespace-nowrap"
                                                                    >
                                                                        {formatTimeAgo(notification.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Desktop (768px+) - time below with dot separator */}
                                                            <div className="hidden min-[768px]:block">
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
                                className="flex items-center gap-[12px] cursor-pointer px-[12px] py-[8px] rounded-[4px] opacity-100"
                                onClick={() => togglePopup("profileDropdown")}
                            >
                                <HoverCard
                                    open={isProfileHoverOpen}
                                    onOpenChange={(nextOpen) => {
                                        if (nextOpen) {
                                            openPopup("profileHover");
                                            return;
                                        }
                                        closePopup("profileHover");
                                    }}
                                    openDelay={120}
                                    closeDelay={80}
                                >
                                    <HoverCardTrigger asChild>
                                        <Button
                                            variant="link"
                                            className="h-auto border-0 p-0 no-underline hover:border-0 hover:no-underline"
                                        >
                                            <Avatar className="w-[34px] h-[34px] opacity-100 md:w-[34px] md:h-[34px] sm:w-[40px] sm:h-[40px]">
                                                {displayUserAvatar ? <AvatarImage src={displayUserAvatar} alt={displayUserName} /> : null}
                                                <AvatarFallback>{avatarFallback}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </HoverCardTrigger>
                                    <HoverCardContent align="center" sideOffset={24} className="w-80">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="size-10 shrink-0">
                                                {displayUserAvatar ? <AvatarImage src={displayUserAvatar} alt={displayUserName} /> : null}
                                                <AvatarFallback>{avatarFallback}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <h4 className="text-sm font-semibold leading-none">{isPending || !isMounted ? "Loading..." : userName}</h4>
                                                <p className="text-muted-foreground text-sm break-words">
                                                    {displayUserDescription}
                                                </p>
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <CalendarDays className="text-muted-foreground size-3" />
                                                    <span className="text-muted-foreground text-xs">{displayJoinedDateText}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>

                                {/* User name with dropdown arrow - Only show on desktop (1024px+) */}
                                <div className="hidden xl:flex items-center gap-[8px]">
                                    <span className="font-bold text-[14px] leading-[100%] tracking-[0%] text-[#2E2E2E] whitespace-nowrap" style={{ fontFamily: 'Public Sans' }}>
                                        {isPending || !isMounted ? "Loading..." : userName}
                                    </span>
                                    <span className="flex items-center">
                                        <svg width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0.700195 0.700195L5.2002 5.2002L9.7002 0.700195" stroke="#2E2E2E" strokeWidth="1.4" strokeLinecap="round" />
                                        </svg>

                                    </span>
                                </div>
                            </div>

                            {/* Dropdown */}
                            {isProfileDropdownOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-full -right-6 mt-4 w-[201px] h-auto bg-[#FEFEFE] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.07)] border border-[#EDEDED] rounded-[8px] flex flex-col gap-[4px] p-[8px] z-50"
                                >
                                    <Link href="/profile-settings"
                                        className="w-[185px] h-[29px] opacity-100 font-normal text-[14px] leading-[150%] tracking-[0%] text-[#B0B0B0] hover:text-black rounded-[4px] gap-[10px] pt-[4px] pr-[8px] pb-[4px] pl-[8px] bg-[#FEFEFE] whitespace-nowrap flex items-center">
                                        My Profile
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="w-[185px] h-[29px] opacity-100 font-normal text-[14px] leading-[150%] tracking-[0%] text-[#B0B0B0] hover:text-black text-left rounded-[4px] gap-[10px] pt-[4px] pr-[8px] pb-[4px] pl-[8px] bg-[#FEFEFE] whitespace-nowrap flex items-center">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
