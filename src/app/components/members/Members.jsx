"use client";

import { useState } from "react";

export default function Members() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Select Role");

    const members = [
        { name: "Special Batista", role: "Editor", status: null },
        { name: "Special Batista", role: "Author", status: null },
        { name: "Mocas Nicota", role: null, status: "Pending" },
        { name: "Mocas Nicota", role: null, status: "Expired" },
    ];

    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-[215px] w-full max-w-[1034px] z-20 px-5 pb-20 max-[767px]:top-[230px] max-[767px]:px-4.5">
            <div className="ml-[185px] max-[767px]:ml-0">
                {/* Add Member Section */}
                <div className="mb-8 max-[767px]:mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4 max-[639px]:text-center">
                        Add Members
                    </h2>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 max-[767px]:text-xs max-[639px]:text-base max-[639px]:font-semibold">
                            Email
                        </label>
                        {/* Desktop/Tablet: All in one row, Mobile: Email separate */}
                        <div className="max-[639px]:mb-4">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter the Email"
                                className="w-full px-0 py-2 border-0 border-b border-gray-300 text-sm focus:outline-none focus:border-gray-900 focus:ring-0 placeholder:text-gray-400 max-[767px]:text-xs min-[640px]:hidden"
                            />
                        </div>
                        {/* Desktop/Tablet: All in one row */}
                        <div className="flex gap-4 items-end max-[767px]:gap-3 max-[639px]:hidden">
                            <input
                                type="email"
                                id="email-desktop"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter the Email"
                                className="flex-1 px-0 py-2 border-0 border-b border-gray-300 text-sm focus:outline-none focus:border-gray-900 focus:ring-0 placeholder:text-gray-400 max-[767px]:text-xs"
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer min-w-[160px] max-[767px]:min-w-[120px] max-[767px]:px-3 max-[767px]:py-1.5 max-[767px]:text-xs"
                            >
                                <option value="Select Role">Select Role</option>
                                <option value="Editor">Editor</option>
                                <option value="Author">Author</option>
                            </select>
                            <button className="px-6 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-700 transition-colors whitespace-nowrap max-[767px]:px-4 max-[767px]:py-1.5 max-[767px]:text-xs">
                                Send Invite
                            </button>
                        </div>
                        {/* Mobile: Dropdown and Button side by side */}
                        <div className="hidden max-[639px]:flex gap-3">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
                            >
                                <option value="Select Role">Select Role</option>
                                <option value="Editor">Editor</option>
                                <option value="Author">Author</option>
                            </select>
                            <button className="flex-1 py-3 bg-violet-600 text-white rounded-md text-base font-medium hover:bg-violet-700 transition-colors">
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>

                {/* Members List Section */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4">
                        Members
                    </h2>

                    <div>
                        {members.map((member, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                                    {/* Profile Section - Left */}
                                    <div className="flex items-center gap-4 w-1/3 max-[767px]:gap-2">
                                        <img
                                            src="/images/icons/profileuser.svg"
                                            alt={member.name}
                                            className="w-12 h-12 rounded-full object-cover max-[767px]:w-10 max-[767px]:h-10"
                                        />
                                        <p className="text-base font-semibold text-gray-900 max-[767px]:text-sm">
                                            {member.name}
                                        </p>
                                    </div>

                                    {/* Role/Status - Middle */}
                                    <div className="w-1/3 flex justify-center">
                                        {member.role && (
                                            <span className="text-sm text-gray-500 max-[767px]:text-xs">
                                                {member.role}
                                            </span>
                                        )}
                                        {member.status === "Pending" && (
                                            <span className="px-2 py-0 text-sm font-medium text-[#72D770] border-2 border-[#D5F2D4] rounded-full max-[767px]:text-xs max-[767px]:px-1.5">
                                                Pending
                                            </span>
                                        )}
                                        {member.status === "Expired" && (
                                            <span className="px-2 py-0 text-sm font-medium text-gray-400 border-2 border-gray-400 rounded-full max-[767px]:text-xs max-[767px]:px-1.5">
                                                Expired
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons - Right */}
                                    <div className="w-1/3 flex items-center justify-end gap-3 max-[767px]:gap-2">
                                        {member.status === "Pending" && (
                                            <button className="px-6 py-1.5 text-sm font-medium text-[#06AD2B] border-2 border-[#D5F2D4] rounded-md hover:bg-green-50 transition-colors max-[767px]:px-4 max-[767px]:py-1 max-[767px]:text-xs">
                                                Resend
                                            </button>
                                        )}
                                        {member.status === "Expired" && (
                                            <button className="px-6 py-1.5 text-sm font-medium text-[#06AD2B] border-2 border-[#D5F2D4] rounded-md hover:bg-green-50 transition-colors max-[767px]:px-4 max-[767px]:py-1 max-[767px]:text-xs">
                                                Re-invite
                                            </button>
                                        )}
                                        <button className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors max-[767px]:px-4 max-[767px]:py-1.5 max-[767px]:text-xs">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                {index < members.length - 1 && (
                                    <hr className="border-[#EDEDED]" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
