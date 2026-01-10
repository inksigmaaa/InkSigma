"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { memberService } from "@/services/memberService";
import { usePublication } from "@/contexts/PublicationContext";
import ConfirmModal from "../confirmModal/ConfirmModal";

export default function Members() {
    const { data: session } = useSession();
    const { currentPublication, refreshCurrentPublication, getCurrentUserRole, isCurrentUserAdmin, loading: publicationLoading } = usePublication();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Select Role");
    const [members, setMembers] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Modal states
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    // Auto-refresh interval for real-time updates
    useEffect(() => {
        if (currentPublication && session?.user?.id) {
            loadData();
            
            const interval = setInterval(() => {
                loadData(true);
            }, 30000);

            return () => clearInterval(interval);
        } else if (!publicationLoading && !currentPublication) {
            // Publication context finished loading but no publication found
            setLoading(false);
        }
    }, [currentPublication?.id, session?.user?.id, publicationLoading]);

    const loadData = async (silent = false) => {
        if (!currentPublication) {
            // No publication - don't set error, let the UI handle it gracefully
            setLoading(false);
            return;
        }

        try {
            if (!silent) {
                setLoading(true);
                setError("");
            }
            
            const membersData = await memberService.getMembers(currentPublication.id);
            setMembers(membersData.members);
            setPendingInvitations(membersData.pendingInvitations);
            setUserRole(membersData.userRole);
        } catch (error) {
            console.error("Error loading data:", error);
            if (!silent) {
                setError(error.message || "Failed to load members data");
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleSendInvite = async () => {
        if (!email || role === "Select Role") {
            setError("Please enter email and select a role");
            return;
        }

        setSending(true);
        setError("");
        setSuccess("");

        try {
            const result = await memberService.sendInvitation(currentPublication.id, email, role.toLowerCase());
            setSuccess(result.message || "Invitation sent successfully!");
            setEmail("");
            setRole("Select Role");
            await loadData();
            await refreshCurrentPublication();
        } catch (error) {
            setError(error.message);
        } finally {
            setSending(false);
        }
    };

    const handleResendInvite = async (invitationId) => {
        try {
            await memberService.resendInvitation(currentPublication.id, invitationId);
            setSuccess("Invitation resent successfully!");
            await loadData();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleRemoveMember = async () => {
        if (!selectedMember) return;

        try {
            await memberService.removeMember(currentPublication.id, selectedMember.id);
            setSuccess("Member removed successfully!");
            setShowRemoveModal(false);
            setSelectedMember(null);
            await loadData();
        } catch (error) {
            setError(error.message);
            setShowRemoveModal(false);
        }
    };

    const handleLeavePublication = async () => {
        try {
            await memberService.leavePublication(currentPublication.id);
            setShowLeaveModal(false);
            await refreshCurrentPublication();
            window.location.href = "/dashboard";
        } catch (error) {
            setError(error.message);
            setShowLeaveModal(false);
        }
    };

    const handleCancelInvitation = async (invitationId) => {
        try {
            await memberService.cancelInvitation(currentPublication.id, invitationId);
            setSuccess("Invitation cancelled!");
            await loadData();
        } catch (error) {
            setError(error.message);
        }
    };

    const isAdmin = userRole === "admin" || isCurrentUserAdmin();
    const topPosition = 'top-[160px]';
    const mobileTopPosition = 'max-md:top-[120px]';

    if (loading || publicationLoading) {
        return (
            <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
                <div className="ml-[185px] max-[767px]:ml-0">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="text-gray-500">Loading members...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentPublication) {
        return (
            <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}>
                <div className="ml-[185px] max-[767px]:ml-0">
                    <div className="flex flex-col justify-center items-center min-h-[400px] text-center">
                        <div className="text-red-500 mb-4">{error}</div>
                        <button onClick={() => window.location.href = '/dashboard'} className="bg-violet-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-violet-700">
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Editor/Author View - Simple member list with Exit button for current user only
    if (!isAdmin) {
        return (
            <>
                <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5 pb-20 max-[767px]:px-4.5 max-md:pb-32`}>
                    <div className="ml-[185px] max-[767px]:ml-0">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4">
                                Members
                            </h2>

                            <div>
                                {members.map((member, index) => (
                                    <div key={`member-${member.id}`}>
                                        <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                                            <div className="flex items-center gap-4 flex-1 max-[767px]:gap-3">
                                                <img
                                                    src={member.userImage || "/images/icons/profileuser.svg"}
                                                    alt={member.userName}
                                                    className="w-12 h-12 rounded-full object-cover max-[767px]:w-10 max-[767px]:h-10 flex-shrink-0"
                                                />
                                                <p className="text-sm font-semibold text-gray-900">{member.userName}</p>
                                            </div>

                                            <div className="flex-1 flex justify-center">
                                                <span className="text-sm text-gray-500 capitalize">{member.role}</span>
                                            </div>

                                            <div className="flex-1 flex items-center justify-end">
                                                {member.userId === session?.user?.id && member.role !== "admin" ? (
                                                    <button 
                                                        onClick={() => setShowLeaveModal(true)}
                                                        className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                                    >
                                                        Exit
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </div>
                                        {index < members.length - 1 && <hr className="border-[#EDEDED]" />}
                                    </div>
                                ))}

                                {members.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No members found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <ConfirmModal
                    isOpen={showLeaveModal}
                    onClose={() => setShowLeaveModal(false)}
                    onConfirm={handleLeavePublication}
                    title="Leave Publication"
                    message="Are you sure you want to leave this publication?"
                    confirmText="Leave"
                    confirmStyle="danger"
                />
            </>
        );
    }


    // Admin View - Full member management
    return (
        <>
            <div className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5 pb-20 max-[767px]:px-4.5 max-md:pb-32`}>
                <div className="ml-[185px] max-[767px]:ml-0">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-600 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Add Member Section */}
                    <div className="mb-8 max-[767px]:mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4">
                            Add Members
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="flex gap-4 items-end max-[767px]:gap-3 max-[639px]:flex-col">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter the Email"
                                    className="flex-1 px-0 py-2 border-0 border-b border-gray-300 text-sm focus:outline-none focus:border-gray-900 focus:ring-0 placeholder:text-gray-400 max-[639px]:w-full"
                                />
                                <div className="flex gap-3 max-[639px]:w-full">
                                    <div className="relative min-w-[130px] max-[639px]:flex-1">
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer appearance-none"
                                        >
                                            <option value="Select Role">Select Role</option>
                                            <option value="Editor">Editor</option>
                                            <option value="Author">Author</option>
                                        </select>
                                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    <button 
                                        onClick={handleSendInvite}
                                        disabled={sending}
                                        className="px-6 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-700 transition-colors whitespace-nowrap disabled:opacity-50 max-[639px]:flex-1"
                                    >
                                        {sending ? "Sending..." : "Send Invite"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Members List */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4">Members</h2>

                        <div>
                            {members.map((member, index) => (
                                <div key={`member-${member.id}`}>
                                    <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                                        <div className="flex items-center gap-4 w-1/3 max-[767px]:gap-2 max-[639px]:flex-1">
                                            <img
                                                src={member.userImage || "/images/icons/profileuser.svg"}
                                                alt={member.userName}
                                                className="w-12 h-12 rounded-full object-cover max-[767px]:w-10 max-[767px]:h-10 flex-shrink-0"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {member.userName}
                                                    {member.userId === session?.user?.id && " (You)"}
                                                </p>
                                                <p className="hidden max-[639px]:block text-sm text-gray-500 mt-1 capitalize">{member.role}</p>
                                            </div>
                                        </div>

                                        <div className="w-1/3 flex justify-center max-[639px]:hidden">
                                            <span className="text-sm text-gray-500 capitalize">{member.role}</span>
                                        </div>

                                        <div className="w-1/3 flex items-center justify-end gap-3 max-[639px]:w-auto">
                                            {member.role !== "admin" && member.userId !== session?.user?.id && (
                                                <button 
                                                    onClick={() => { setSelectedMember(member); setShowRemoveModal(true); }}
                                                    className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors max-[639px]:px-4"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                            {member.userId === session?.user?.id && member.role !== "admin" && (
                                                <button 
                                                    onClick={() => setShowLeaveModal(true)}
                                                    className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                                >
                                                    Leave
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {(index < members.length - 1 || pendingInvitations.length > 0) && <hr className="border-[#EDEDED]" />}
                                </div>
                            ))}

                            {/* Pending Invitations */}
                            {pendingInvitations.map((invitation, index) => (
                                <div key={`invitation-${invitation.id}`}>
                                    <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                                        <div className="flex items-center gap-4 w-1/3 max-[767px]:gap-2 max-[639px]:flex-1">
                                            <img src="/images/icons/profileuser.svg" alt="Invited" className="w-12 h-12 rounded-full max-[767px]:w-10 max-[767px]:h-10" />
                                            <p className="text-sm font-semibold text-gray-900">{invitation.email}</p>
                                        </div>

                                        <div className="w-1/3 flex justify-center max-[639px]:hidden">
                                            <span className={`px-2 py-0 text-sm font-medium border-2 rounded-full ${invitation.status === "pending" ? "text-[#72D770] border-[#D5F2D4]" : "text-gray-400 border-gray-400"}`}>
                                                {invitation.status === "pending" ? "Pending" : "Expired"}
                                            </span>
                                        </div>

                                        <div className="w-1/3 flex items-center justify-end gap-3 max-[639px]:w-auto">
                                            <button onClick={() => handleResendInvite(invitation.id)} className="px-6 py-1.5 text-sm font-medium text-[#06AD2B] border-2 border-[#D5F2D4] rounded-md hover:bg-green-50">
                                                {invitation.status === "pending" ? "Resend" : "Re-invite"}
                                            </button>
                                            <button onClick={() => handleCancelInvitation(invitation.id)} className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                    {index < pendingInvitations.length - 1 && <hr className="border-[#EDEDED]" />}
                                </div>
                            ))}

                            {members.length === 0 && pendingInvitations.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No members yet. Start by inviting someone!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showRemoveModal}
                onClose={() => { setShowRemoveModal(false); setSelectedMember(null); }}
                onConfirm={handleRemoveMember}
                title="Remove Member"
                message={`Are you sure you want to remove ${selectedMember?.userName}?`}
                confirmText="Remove"
                confirmStyle="danger"
            />

            <ConfirmModal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                onConfirm={handleLeavePublication}
                title="Leave Publication"
                message="Are you sure you want to leave this publication?"
                confirmText="Leave"
                confirmStyle="danger"
            />
        </>
    );
}