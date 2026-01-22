"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function DashboardSidebar() {
    return (
        <>
            {/* SIDE CONTAINER / WRAPPER */}
            <div className="mobile-sidebar-scroll fixed left-1/2 -translate-x-1/2 top-[112px] w-full max-w-[1034px] h-[612px] bg-transparent z-30 px-5 pointer-events-none max-md:fixed max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:w-full max-md:max-w-full max-md:h-[70px] max-md:p-0 max-md:z-50 max-md:bg-white max-md:border-t max-md:border-gray-200 max-md:shadow-[0_-4px_12px_rgba(0,0,0,0.08)] max-md:overflow-x-auto max-md:overflow-y-hidden">
                {/* SIDEBAR CONTAINER */}
                <div className="relative w-[165px] h-[612px] bg-white border-r border-gray-200 p-[14px] pr-[10px] flex flex-col gap-[10px] overflow-hidden pointer-events-auto max-md:w-auto max-md:min-w-max max-md:h-[70px] max-md:px-4 max-md:py-2 max-md:flex-row max-md:gap-2 max-md:border-r-0 max-md:overflow-visible">
                    {/* MY SPACE */}
                    <div className="max-md:pb-0 max-md:border-none max-md:flex-shrink-0">
                        {(() => {
                            const [isHovered, setIsHovered] = useState(false);
                            return (
                        <div className={`flex items-center gap-2 px-2 py-[5px] rounded-md cursor-pointer max-md:flex-col max-md:py-1 max-md:px-3 max-md:gap-1 ${isHovered ? 'bg-[#F6F6F6]' : ''}`}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <img src="/images/icons/myspace.svg" className={`w-6 h-6 max-md:w-6 max-md:h-6 transition-all ${isHovered ? 'brightness-0' : ''}`} />
                            <Link href="/dashboard">
                                <p className={`text-[14px] font-normal leading-[150%] m-0 max-md:text-[11px] max-md:text-center tracking-[0%] ${isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                                    My Space
                                </p>
                            </Link>
                        </div>
                            );
                        })()}
                    </div>

                    {/* SETTINGS */}
                    <div className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0">
                        {(() => {
                            const [isHovered, setIsHovered] = useState(false);
                            return (
                        <a href="/profile-settings">
                            <div className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered ? 'bg-[#F6F6F6]' : ''}`}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                                    <img
                                        src="/images/icons/setings.svg"
                                        className={`w-6 h-6 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isHovered ? 'opacity-100 brightness-0' : 'opacity-60'}`}
                                    />
                                    <p className={`text-[14px] font-normal leading-[150%] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap  tracking-[0%] ${isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                                        Settings
                                    </p>
                                </div>
                            </div>
                        </a>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </>
    );
}
