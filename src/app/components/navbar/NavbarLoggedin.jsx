"use client"
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";

export default function NavbarLoggedin() {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const router = useRouter();
    const { data: session } = useSession();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    const userImage = session?.user?.image || "/images/icons/profileuser.svg";
    const userName = session?.user?.name || "User";

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
                    <div className="flex items-center cursor-pointer">
                        <img
                            src="/images/icons/Notification.svg"
                            alt="notification"
                            className="w-6 h-6 max-md:w-[22px] max-md:h-[22px]"
                        />
                    </div>

                    {/* Profile Dropdown */}
                    <div ref={wrapperRef} className="relative">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setOpen((prev) => !prev)}
                        >
                            <img
                                src={userImage}
                                alt="usericon"
                                className="w-10 h-10 rounded-full object-cover max-md:w-9 max-md:h-9"
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
