"use client"
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";
import UserAvatar from "@/components/ui/UserAvatar";
import { handleLogout } from "@/utils/auth";

export default function NavbarLoggedin() {
    const [open, setOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const wrapperRef = useRef(null);
    const notificationRef = useRef(null);
    const router = useRouter();
    const { data: session } = useSession();

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



    const userName = session?.user?.name || "User";

    // Sample notification data - replace with real data from your API
    const notifications = [
        {
            id: 1,
            avatar: "/images/icons/profileuser.svg",
            title: "Publication Name",
            message: "You have been invited to join their publication.",
            time: "5 mins ago"
        },
        {
            id: 2,
            avatar: "/images/icons/profileuser.svg",
            title: "Publication Name",
            message: "Has accepted your Blog.",
            time: "18 mins ago"
        },
        {
            id: 3,
            avatar: "/images/icons/profileuser.svg",
            title: "Publication Name",
            message: "Has rejected your Blog.",
            time: "1 hour ago"
        },
        {
            id: 4,
            avatar: "/images/icons/profileuser.svg",
            title: "Author Name",
            message: "Has sent you a Blog for a review.",
            time: "5 hours ago"
        },
        {
            id: 5,
            avatar: "/images/icons/profileuser.svg",
            title: "Author Name",
            message: "Has sent you a Blog for a review.",
            time: "5 hours ago"
        }
    ];

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
                            className="flex items-center cursor-pointer"
                            onClick={() => setNotificationOpen((prev) => !prev)}
                        >
                            <img
                                src={notificationOpen ? "/svg/color-bell.svg" : "/images/icons/Notification.svg"}
                                alt="notification"
                                className="w-6 h-6 max-md:w-[22px] max-md:h-[22px]"
                            />
                        </div>

                        {/* Notification Dropdown */}
                        {notificationOpen && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-[35px] right-0 w-[400px] max-h-[500px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-[#E5E5E5] rounded-xl overflow-hidden z-[99999] max-md:fixed max-md:top-[80px] max-md:right-5 max-md:w-[350px] max-md:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-[#F0F0F0]">
                                    <h3 className="text-[18px] font-semibold text-[#333]">Notification</h3>
                                    <button 
                                        onClick={() => setNotificationOpen(false)}
                                        className="text-[#999] hover:text-[#333] transition-colors"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                {/* Notifications List */}
                                <div className="max-h-[400px] overflow-y-auto scrollbar-hide"
                                     style={{
                                         scrollbarWidth: 'none', /* Firefox */
                                         msOverflowStyle: 'none'  /* Internet Explorer 10+ */
                                     }}>
                                    {notifications.map((notification) => (
                                        <div key={notification.id} className="flex items-start gap-3 p-4 hover:bg-[#F8F9FA] transition-colors border-b border-[#F0F0F0] last:border-b-0">
                                            <img 
                                                src={notification.avatar} 
                                                alt="avatar" 
                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[14px] font-semibold text-[#333] mb-1">
                                                    {notification.title}
                                                </h4>
                                                <p className="text-[13px] text-[#666] mb-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center text-[12px] text-[#999]">
                                                    <span className="w-1 h-1 bg-[#999] rounded-full mr-2"></span>
                                                    {notification.time}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                                user={session?.user} 
                                size="md"
                                className="max-md:w-9 max-md:h-9"
                            />

                            {/* Hide name on mobile */}
                            <div className="flex items-center gap-2 text-[14px] font-medium text-[#333] max-md:hidden">
                                {userName}
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
                                    className="px-2 py-1 rounded text-[12px] font-normal text-[#b0b0b0] hover:text-black">
                                    Profile Settings
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="px-2 py-1 rounded text-[12px] font-normal text-[#b0b0b0] hover:text-black text-left">
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