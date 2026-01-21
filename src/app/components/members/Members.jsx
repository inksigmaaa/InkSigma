"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { memberService } from "@/services/memberService";
import { usePublication } from "@/contexts/PublicationContext";
import ConfirmModal from "../confirmModal/ConfirmModal";
import UserAvatar from "@/components/ui/UserAvatar";

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
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // Memoized admin check to prevent flickering during state updates
    // Only rely on context's isCurrentUserAdmin() to avoid showing admin view when switching publications
    const isAdmin = useMemo(() => {
        return isCurrentUserAdmin();
    }, [isCurrentUserAdmin]);
    
    // Toast visibility states for smooth animations
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    
    // Modal states
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showInviteSentToast, setShowInviteSentToast] = useState(false);
    const [showInviteErrorToast, setShowInviteErrorToast] = useState(false);
    const [showMemberExistsToast, setShowMemberExistsToast] = useState(false);
    const [showMaxMembersToast, setShowMaxMembersToast] = useState(false);
    const [showSingleEditorToast, setShowSingleEditorToast] = useState(false);

    // Smooth toast animation for success
    useEffect(() => {
        if (success) {
            setShowSuccessToast(true);
            const hideTimer = setTimeout(() => setShowSuccessToast(false), 2500);
            const clearTimer = setTimeout(() => setSuccess(""), 3000);
            return () => {
                clearTimeout(hideTimer);
                clearTimeout(clearTimer);
            };
        }
    }, [success]);

    // Smooth toast animation for error
    useEffect(() => {
        if (error) {
            setShowErrorToast(true);
            const hideTimer = setTimeout(() => setShowErrorToast(false), 4500);
            const clearTimer = setTimeout(() => setError(""), 5000);
            return () => {
                clearTimeout(hideTimer);
                clearTimeout(clearTimer);
            };
        }
    }, [error]);

    // Reset state when switching publications to prevent showing stale data
    useEffect(() => {
        // Clear old data when publication changes
        setMembers([]);
        setPendingInvitations([]);
        setUserRole(null);
    }, [currentPublication?.id]);

    // Initial and periodic data loading
    useEffect(() => {
        if (currentPublication?.id && session?.user?.id) {
            loadData(isInitialLoad ? false : true);
            if (isInitialLoad) setIsInitialLoad(false);
            
            const interval = setInterval(() => {
                loadData(true);
            }, 30000);

            return () => clearInterval(interval);
        } else if (!publicationLoading && !currentPublication) {
            setLoading(false);
            setIsInitialLoad(false);
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
            
            // De-duplicate members by userId to fix "admin in twice" issue
            const uniqueMembers = Array.from(new Map(membersData.members.map(m => [m.userId, m])).values());
            
            // Sort members by role: Admin first, then Editor, then Authors (maintaining order within each role)
            const sortedMembers = uniqueMembers.sort((a, b) => {
                const roleOrder = { admin: 1, editor: 2, author: 3 };
                const roleA = roleOrder[a.role.toLowerCase()] || 999;
                const roleB = roleOrder[b.role.toLowerCase()] || 999;
                
                if (roleA !== roleB) {
                    return roleA - roleB;
                }
                
                // If same role, maintain original order (by id or createdAt if available)
                return (a.id || 0) - (b.id || 0);
            });
            
            setMembers(prev => JSON.stringify(prev) === JSON.stringify(sortedMembers) ? prev : sortedMembers);
            setPendingInvitations(prev => JSON.stringify(prev) === JSON.stringify(membersData.pendingInvitations) ? prev : membersData.pendingInvitations);
            setUserRole(prev => prev === membersData.userRole ? prev : membersData.userRole);
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

        if (!currentPublication || !currentPublication.id) {
            setError("No publication selected. Please select a publication first.");
            return;
        }

        // Check if member already exists (either as existing member or pending invitation)
        const emailLower = email.toLowerCase().trim();
        const existingMember = members.find(m => m.userEmail?.toLowerCase() === emailLower);
        const pendingInvitation = pendingInvitations.find(i => i.email?.toLowerCase() === emailLower);
        
        if (existingMember || pendingInvitation) {
            setShowMemberExistsToast(true);
            setTimeout(() => setShowMemberExistsToast(false), 3000);
            return;
        }

        // Check if trying to add a second editor (only 1 editor allowed per publication)
        if (role.toLowerCase() === "editor") {
            const existingEditors = members.filter(m => m.role === "editor");
            const pendingEditors = pendingInvitations.filter(i => i.role === "editor" && i.status === "pending");
            
            if (existingEditors.length > 0 || pendingEditors.length > 0) {
                setShowSingleEditorToast(true);
                setTimeout(() => setShowSingleEditorToast(false), 3000);
                return;
            }
        }

        // Check if maximum member limit reached (5 total: 1 admin + 1 editor + 3 authors)
        const totalMembers = members.length + pendingInvitations.filter(i => i.status === "pending").length;
        if (totalMembers >= 5) {
            setShowMaxMembersToast(true);
            setTimeout(() => setShowMaxMembersToast(false), 3000);
            return;
        }

        setSending(true);
        setError("");
        setSuccess("");

        try {
            await memberService.sendInvitation(currentPublication.id, email, role.toLowerCase());
            
            // Show custom invitation sent toast
            setShowInviteSentToast(true);
            setTimeout(() => setShowInviteSentToast(false), 3000);
            
            setEmail("");
            setRole("Select Role");
            await loadData();
            await refreshCurrentPublication();
        } catch (error) {
            // Show custom error toast for network/server issues
            setShowInviteErrorToast(true);
            setTimeout(() => setShowInviteErrorToast(false), 3000);
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
                            <div className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center transition-all duration-300 ease-in-out ${showErrorToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4">
                                Members
                            </h2>

                            <div>
                                {members && members.length > 0 && members.map((member, index) => (
                                    <div key={`member-${member.id}`}>
                                        <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                                            <div className="flex items-center gap-4 flex-1 max-[767px]:gap-3">
                                                <UserAvatar 
                                                    user={{ name: member.userName, email: member.userEmail, image: member.userImage }}
                                                    size="md"
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

                                {(!members || members.length === 0) && (
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
                        <div className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center transition-all duration-300 ease-in-out ${showErrorToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className={`mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center transition-all duration-300 ease-in-out ${showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
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
                            {members && members.length > 0 && members.map((member, index) => (
                                <div key={`member-${member.id}`}>
                                    <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                                        <div className="flex items-center gap-4 w-1/3 max-[767px]:gap-2 max-[639px]:flex-1">
                                            <UserAvatar 
                                                user={{ name: member.userName, email: member.userEmail, image: member.userImage }}
                                                size="md"
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
                            {pendingInvitations && pendingInvitations.length > 0 && pendingInvitations.map((invitation, index) => (
                                <div key={`invitation-${invitation.id}`}>
                                    <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                                        <div className="flex items-center gap-4 w-1/3 max-[767px]:gap-2 max-[639px]:flex-1">
                                            <img src="/images/icons/profileuser.svg" alt="Invited" className="w-12 h-12 rounded-full max-[767px]:w-10 max-[767px]:h-10" />
                                            <p className="text-sm font-semibold text-gray-900">{invitation.email}</p>
                                        </div>

                                        <div className="w-1/3 flex justify-center max-[639px]:hidden">
                                            <span className={`px-2 py-0 text-sm font-medium border-2 rounded-full ${
                                                invitation.status === "pending" ? "text-[#72D770] border-[#D5F2D4]" : 
                                                invitation.status === "declined" ? "text-red-500 border-red-200" : 
                                                "text-gray-400 border-gray-400"
                                            }`}>
                                                {invitation.status === "pending" ? "Pending" : invitation.status === "declined" ? "Declined" : "Expired"}
                                            </span>
                                        </div>

                                        <div className="w-1/3 flex items-center justify-end gap-3 max-[639px]:w-auto">
                                            {invitation.status !== "declined" && (
                                                <button onClick={() => handleResendInvite(invitation.id)} className="px-6 py-1.5 text-sm font-medium text-[#06AD2B] border-2 border-[#D5F2D4] rounded-md hover:bg-green-50">
                                                    {invitation.status === "pending" ? "Resend" : "Re-invite"}
                                                </button>
                                            )}
                                            <button onClick={() => handleCancelInvitation(invitation.id)} className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                    {index < pendingInvitations.length - 1 && <hr className="border-[#EDEDED]" />}
                                </div>
                            ))}

                            {(!members || members.length === 0) && (!pendingInvitations || pendingInvitations.length === 0) && (
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
                title="Do you want to remove the member?"
                message="The member will be removed from the publication."
                confirmText="Remove"
                confirmStyle="normal"
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

            {/* Custom Invitation Sent Toast */}
            {showInviteSentToast && (
                <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-black/50">
                    <div 
                        className="bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center gap-6 animate-fade-in relative"
                        style={{
                            width: '353px',
                            minHeight: '218px',
                            paddingTop: '48px',
                            paddingRight: '56px',
                            paddingBottom: '48px',
                            paddingLeft: '56px',
                        }}
                    >
                        <button 
                            onClick={() => setShowInviteSentToast(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div 
                            className="rounded-full flex items-center justify-center"
                            style={{
                                width: '64px',
                                height: '64px',
                                background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
                            }}
                        >
                            <svg className="text-white" width="25" height="25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Mail Sent</h3>
                            <p className="text-sm text-gray-500">An invitation link has been sent to the registered Email ID</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Invitation Error Toast */}
            {showInviteErrorToast && (
                <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-black/50">
                    <div 
                        className="bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center gap-6 animate-fade-in relative"
                        style={{
                            width: '353px',
                            minHeight: '218px',
                            paddingTop: '48px',
                            paddingRight: '56px',
                            paddingBottom: '48px',
                            paddingLeft: '56px',
                        }}
                    >
                        <button 
                            onClick={() => setShowInviteErrorToast(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Oops!</h3>
                            <p className="text-sm text-gray-500">Something went wrong. Your email wasn't sent. Please try again.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Already Exists Toast */}
            {showMemberExistsToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-slide-down">
                    <div 
                        className="flex items-center gap-2.5 rounded"
                        style={{
                            width: '227px',
                            height: '45px',
                            paddingTop: '12px',
                            paddingRight: '16px',
                            paddingBottom: '12px',
                            paddingLeft: '16px',
                            background: '#F9F9F9',
                            boxShadow: '0px 4px 25px 0px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        <div 
                            className="flex-shrink-0 rounded-full flex items-center justify-center"
                            style={{
                                width: '20px',
                                height: '20px',
                                background: '#FC6161',
                            }}
                        >
                            <svg className="text-white" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 1V7M6 9V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <p 
                            style={{
                                fontFamily: 'Public Sans, sans-serif',
                                fontWeight: 400,
                                fontSize: '14px',
                                lineHeight: '150%',
                                color: '#808080',
                            }}
                        >
                            Member already exists.
                        </p>
                    </div>
                </div>
            )}

            {/* Single Editor Access Only Toast */}
            {showSingleEditorToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-slide-down">
                    <div 
                        className="flex items-center gap-2.5 rounded"
                        style={{
                            width: '227px',
                            height: '45px',
                            paddingTop: '12px',
                            paddingRight: '16px',
                            paddingBottom: '12px',
                            paddingLeft: '16px',
                            background: '#F9F9F9',
                            boxShadow: '0px 4px 25px 0px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        <div 
                            className="flex-shrink-0 rounded-full flex items-center justify-center"
                            style={{
                                width: '20px',
                                height: '20px',
                                background: '#FC6161',
                            }}
                        >
                            <svg className="text-white" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 1V7M6 9V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <p 
                            style={{
                                fontFamily: 'Public Sans, sans-serif',
                                fontWeight: 400,
                                fontSize: '14px',
                                lineHeight: '150%',
                                color: '#808080',
                            }}
                        >
                            Single editor access only.
                        </p>
                    </div>
                </div>
            )}

            {/* Maximum Members Reached Toast */}
            {showMaxMembersToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-slide-down">
                    <div 
                        className="flex items-center gap-2.5 rounded"
                        style={{
                            width: '270px',
                            height: '45px',
                            paddingTop: '12px',
                            paddingRight: '16px',
                            paddingBottom: '12px',
                            paddingLeft: '16px',
                            background: '#F9F9F9',
                            boxShadow: '0px 4px 25px 0px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        <div 
                            className="flex-shrink-0 rounded-full flex items-center justify-center"
                            style={{
                                width: '20px',
                                height: '20px',
                                background: '#FC6161',
                            }}
                        >
                            <svg className="text-white" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 1V7M6 9V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <p 
                            style={{
                                fontFamily: 'Public Sans, sans-serif',
                                fontWeight: 400,
                                fontSize: '14px',
                                lineHeight: '150%',
                                color: '#808080',
                            }}
                        >
                            Reached the maximum invite.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}