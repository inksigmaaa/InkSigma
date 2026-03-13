"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { memberService } from "@/services/memberService";
import { usePublication } from "@/contexts/PublicationContext";
import { hasPermission } from "@/utils/permissions";
import { toast } from "sonner";
import ConfirmModal from "../confirmModal/ConfirmModal";
import UserAvatar from "@/components/ui/UserAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Members() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    currentPublication,
    refreshCurrentPublication,
    loadUserPublications,
    getCurrentUserRole,
    isCurrentUserAdmin,
    loading: publicationLoading,
  } = usePublication();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isRoleDropdownOpen &&
        !event.target.closest(".role-dropdown-container")
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isRoleDropdownOpen]);

  // Memoized admin check to prevent flickering during state updates
  // Only rely on context's isCurrentUserAdmin() to avoid showing admin view when switching publications
  const isAdmin = useMemo(() => {
    return isCurrentUserAdmin();
  }, [isCurrentUserAdmin]);

  // Get current user's effective role for permission checks
  const currentUserRole = useMemo(() => {
    if (!currentPublication) return null;
    if (currentPublication.isOwner) return "admin";
    return currentPublication.role || "author";
  }, [currentPublication]);

  // Permission-based checks for member management
  const canInvite = useMemo(() => {
    return hasPermission(currentUserRole, "inviteMembers");
  }, [currentUserRole]);

  const canRemove = useMemo(() => {
    return hasPermission(currentUserRole, "removeMembers");
  }, [currentUserRole]);

  const canChangeAnyRole = useMemo(() => {
    return hasPermission(currentUserRole, "changeAnyRole");
  }, [currentUserRole]);

  // Modal states
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Reset state when switching publications to prevent showing stale data
  useEffect(() => {
    // Clear old data when publication changes
    setMembers([]);
    setPendingInvitations([]);
    setUserRole(null);
  }, [currentPublication?.id]);

  // Handle publication loading state independently of data fetching
  useEffect(() => {
    if (!publicationLoading && !currentPublication) {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [publicationLoading, currentPublication]);

  // Initial and periodic data loading
  useEffect(() => {
    if (currentPublication?.id && session?.user?.id) {
      loadData(isInitialLoad ? false : true);
      if (isInitialLoad) setIsInitialLoad(false);

      const interval = setInterval(() => {
        if (currentPublication?.id) {
          loadData(true);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentPublication?.id, session?.user?.id]);

  const loadData = async (silent = false) => {
    if (!currentPublication) {
      // No publication - don't set error, let the UI handle it gracefully
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }

      const membersData = await memberService.getMembers(currentPublication.id);

      // De-duplicate members by userId to fix "admin in twice" issue
      const uniqueMembers = Array.from(
        new Map(membersData.members.map((m) => [m.userId, m])).values(),
      );

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

      setMembers((prev) =>
        JSON.stringify(prev) === JSON.stringify(sortedMembers)
          ? prev
          : sortedMembers,
      );
      setPendingInvitations((prev) =>
        JSON.stringify(prev) === JSON.stringify(membersData.pendingInvitations)
          ? prev
          : membersData.pendingInvitations,
      );
      setUserRole((prev) =>
        prev === membersData.userRole ? prev : membersData.userRole,
      );
    } catch (error) {
      console.error("Error loading data:", error);
      if (!silent) {
        toast.error(error.message || "Failed to load members data");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleSendInvite = async () => {
    if (!email || !role) {
      toast.error("Please enter email and select a role");
      return;
    }

    if (!currentPublication || !currentPublication.id) {
      toast.error("No publication selected. Please select a publication first.");
      return;
    }

    // Check if member already exists (either as existing member or pending invitation)
    const emailLower = email.toLowerCase().trim();
    const existingMember = members.find(
      (m) => m.userEmail?.toLowerCase() === emailLower,
    );
    const pendingInvitation = pendingInvitations.find(
      (i) => i.email?.toLowerCase() === emailLower,
    );

    if (existingMember || pendingInvitation) {
      toast.error("Member already exists in this publication");
      return;
    }

    // Check if trying to add a second editor (only 1 editor allowed per publication)
    if (role.toLowerCase() === "editor") {
      const existingEditors = members.filter((m) => m.role === "editor");
      const pendingEditors = pendingInvitations.filter(
        (i) => i.role === "editor" && i.status === "pending",
      );

      if (existingEditors.length > 0 || pendingEditors.length > 0) {
        toast.error("Only one editor is allowed per publication");
        return;
      }
    }

    // Check if maximum member limit reached (6 total: 1 admin + 1 editor + 4 authors)
    const totalMembers =
      members.length +
      pendingInvitations.filter((i) => i.status === "pending").length;
    if (totalMembers >= 6) {
      toast.error("Maximum of 6 members allowed per publication");
      return;
    }

    setSending(true);

    try {
      await memberService.sendInvitation(
        currentPublication.id,
        email,
        role.toLowerCase(),
      );

      // Show custom invitation sent toast
      toast.success("Invitation sent successfully");

      setEmail("");
      setRole(null);
      setIsRoleDropdownOpen(false);
      await loadData();
      await refreshCurrentPublication();
    } catch (error) {
      // Show custom error toast for network/server issues
      toast.error(error.message || "Failed to send invitation. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleResendInvite = async (invitationId) => {
    try {
      await memberService.resendInvitation(currentPublication.id, invitationId);
      toast.success("Invitation resent successfully!");
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      await memberService.removeMember(
        currentPublication.id,
        selectedMember.id,
      );
      setShowRemoveModal(false);
      setSelectedMember(null);
      toast.success("Member removed successfully");
      await loadData();
    } catch (error) {
      toast.error(error.message);
      setShowRemoveModal(false);
    }
  };

  const handleLeavePublication = async () => {
    try {
      await memberService.leavePublication(currentPublication.id);
      setShowLeaveModal(false);
      toast.success("You have left the publication");
      await loadUserPublications();
    } catch (error) {
      toast.error(error.message || "Failed to leave publication");
      setShowLeaveModal(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await memberService.cancelInvitation(currentPublication.id, invitationId);
      toast.success("Invitation cancelled!");
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const topPosition = "top-[160px]";
  const mobileTopPosition = "max-md:top-[120px]";

  if (loading || publicationLoading) {
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}
      >
        <div className="ml-[220px] max-[767px]:ml-0">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-gray-500">Loading members...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPublication) {
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5`}
      >
        <div className="ml-[220px] max-[767px]:ml-0">
          <div className="flex flex-col justify-center items-center min-h-[400px] text-center">
            <button
              onClick={() => router.push("/")}
              className="bg-violet-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-violet-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Author View - Simple member list (Editors with canInvite permission see the full Admin view)
  if (!canInvite) {
    return (
      <>
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5 pb-20 max-[767px]:px-4.5 max-md:pb-32`}
        >
          <div className="ml-[220px] max-[767px]:ml-0">
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4">
                Members
              </h2>

              <div
                className={
                  members && members.length > 0
                    ? "border-y border-[#EDEDED]"
                    : ""
                }
              >
                {members &&
                  members.length > 0 &&
                  members.map((member, index) => (
                    <div key={`member-${member.id}`}>
                      <div className="flex items-center justify-between py-6 max-[767px]:py-4 ">
                        <div className="flex items-center gap-4 flex-1 max-[767px]:gap-3">
                          <UserAvatar
                            user={{
                              name: member.userName,
                              email: member.userEmail,
                              image: member.userImage,
                            }}
                            size="md"
                          />
                          <p className="text-sm font-semibold text-gray-900">
                            {member.userName}
                          </p>
                        </div>

                        <div className="flex-1 flex justify-center">
                          <span className="text-sm text-gray-500 capitalize">
                            {member.role}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center justify-end">
                          {member.userId === session?.user?.id &&
                          member.role !== "admin" ? (
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
                      {index < members.length - 1 && (
                        <hr className="border-[#EDEDED]" />
                      )}
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
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${topPosition} ${mobileTopPosition} w-full max-w-[1034px] z-20 px-5 pb-20 max-[767px]:px-4.5 max-md:pb-32`}
      >
        <div className="ml-[220px] max-[767px]:ml-0">
          

          {/* Add Member Section */}
          <div className="mb-8 max-[767px]:mb-6">
            <h2 className="text-xl font-bold text-gray-900 pb-4 mb-4 max-[767px]:text-lg max-[767px]:mb-4 max-[767px]:text-center border-b border-#EDEDED">
              Add Members
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Email
              </label>
              <div className="flex gap-4 items-end justify-between max-[767px]:gap-3 max-[639px]:flex-col max-[639px]:justify-start">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the Email"
                  className="w-[258px] px-0 py-2 border-0 border-b-2 border-gray-300 text-sm focus:outline-none focus:border-gray-900 focus:ring-0 placeholder:text-gray-400 max-[639px]:w-full"
                />
                <div className="flex gap-6 max-[639px]:w-full">
                  <div className="relative min-w-[130px] max-[639px]:flex-1 role-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none cursor-pointer text-left flex items-center justify-between"
                    >
                      <span
                        style={{
                          fontFamily: "Public Sans, sans-serif",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "150%",
                          letterSpacing: "0%",
                          color: "#2E2E2E",
                        }}
                      >
                        {role || "Select Role"}
                      </span>
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "#2E2E2E" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isRoleDropdownOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 z-50 flex flex-col"
                        style={{
                          width: "130px",
                          borderBottomRightRadius: "4px",
                          borderBottomLeftRadius: "4px",
                          padding: "8px",
                          background: "#FEFEFE",
                          border: "1px solid #EDEDED",
                          boxShadow: "0px 4px 24px 0px rgba(0, 0, 0, 0.07)",
                          gap: "4px",
                        }}
                      >
                        {isAdmin && (
                          <div
                            onClick={() => {
                              setRole("Editor");
                              setIsRoleDropdownOpen(false);
                            }}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            style={{
                              width: "110px",
                              height: "29px",
                              borderRadius: "4px",
                              paddingTop: "4px",
                              paddingRight: "8px",
                              paddingBottom: "4px",
                              paddingLeft: "8px",
                              background: "#FEFEFE",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "Public Sans, sans-serif",
                                fontWeight: 400,
                                fontSize: "14px",
                                lineHeight: "150%",
                                color: "#696969",
                              }}
                            >
                              Editor
                            </span>
                          </div>
                        )}
                        <div
                          onClick={() => {
                            setRole("Author");
                            setIsRoleDropdownOpen(false);
                          }}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          style={{
                            width: "110px",
                            height: "29px",
                            borderRadius: "4px",
                            paddingTop: "4px",
                            paddingRight: "8px",
                            paddingBottom: "4px",
                            paddingLeft: "8px",
                            background: "#FEFEFE",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Public Sans, sans-serif",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "150%",
                              color: "#696969",
                            }}
                          >
                            Author
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendInvite}
                    disabled={sending}
                    className="px-6 py-2 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 max-[639px]:flex-1"
                    style={{
                      background:
                        "linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)",
                      boxShadow: "0px 4px 8px 0px #EADBF9",
                    }}
                  >
                    {sending ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 max-[767px]:text-lg max-[767px]:mb-4">
              Members
            </h2>

            <div
              className={
                members && members.length > 0 ? "border-y border-[#EDEDED]" : ""
              }
            >
              {members &&
                members.length > 0 &&
                members.map((member, index) => (
                  <div key={`member-${member.id}`}>
                    <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                      <div className="flex items-center gap-4 w-1/3 max-[767px]:gap-2 max-[639px]:flex-1">
                        <UserAvatar
                          user={{
                            name: member.userName,
                            email: member.userEmail,
                            image: member.userImage,
                          }}
                          size="md"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {member.userName}
                            {member.userId === session?.user?.id && " (You)"}
                          </p>
                          <p className="hidden max-[639px]:block text-sm text-gray-500 mt-1 capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      <div className="w-1/3 flex justify-center max-[639px]:hidden">
                        <span className="text-sm text-gray-500 capitalize">
                          {member.role}
                        </span>
                      </div>

                      <div className="w-1/3 flex items-center justify-end gap-3 max-[639px]:w-auto">
                        {/* Remove button: Admin can remove anyone except self, Editor can only remove Authors */}
                        {canRemove &&
                          member.role !== "admin" &&
                          member.userId !== session?.user?.id &&
                          (isAdmin || member.role === "author") && (
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowRemoveModal(true);
                              }}
                              className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors max-[639px]:px-4"
                            >
                              Remove
                            </button>
                          )}
                        {member.userId === session?.user?.id &&
                          member.role !== "admin" && (
                            <button
                              onClick={() => setShowLeaveModal(true)}
                              className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                            >
                              Exit
                            </button>
                          )}
                      </div>
                    </div>
                    {(index < members.length - 1 ||
                      pendingInvitations.length > 0) && (
                      <hr className="border-[#EDEDED]" />
                    )}
                  </div>
                ))}

              {/* Pending Invitations */}
              {pendingInvitations &&
                pendingInvitations.length > 0 &&
                pendingInvitations.map((invitation, index) => (
                  <div key={`invitation-${invitation.id}`}>
                    <div className="flex items-center justify-between py-6 max-[767px]:py-4">
                      <div className="flex items-center gap-4 w-1/3 max-[767px]:gap-2 max-[639px]:flex-1">
                        <Avatar className="w-12 h-12 max-[767px]:w-10 max-[767px]:h-10">
                          <AvatarImage
                            src="/icons/nib.svg"
                            alt="Invited"
                            className="w-full h-full object-cover"
                          />
                          <AvatarFallback className="w-full h-full bg-violet-100 text-violet-600 font-semibold">
                            I
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold text-gray-900">
                          {invitation.email}
                        </p>
                      </div>

                      <div className="w-1/3 flex justify-center max-[639px]:hidden">
                        <span
                          className={`px-2 py-0 text-sm font-medium border-2 rounded-full ${
                            invitation.status === "pending"
                              ? "text-[#72D770] border-[#D5F2D4]"
                              : invitation.status === "declined"
                                ? "text-red-500 border-red-200"
                                : "text-gray-400 border-gray-400"
                          }`}
                        >
                          {invitation.status === "pending"
                            ? "Pending"
                            : invitation.status === "declined"
                              ? "Declined"
                              : "Expired"}
                        </span>
                      </div>

                      <div className="w-1/3 flex items-center justify-end gap-3 max-[639px]:w-auto">
                        {invitation.status !== "declined" && (
                          <button
                            onClick={() => handleResendInvite(invitation.id)}
                            className="px-6 py-1.5 text-sm font-medium text-[#06AD2B] border-2 border-[#D5F2D4] rounded-md hover:bg-green-50"
                          >
                            {invitation.status === "pending"
                              ? "Resend"
                              : "Re-invite"}
                          </button>
                        )}
                        {/* Cancel button: Admin can cancel any, Editor can only cancel Author invitations */}
                        {canRemove &&
                          (isAdmin || invitation.role === "author") && (
                            <button
                              onClick={() =>
                                handleCancelInvitation(invitation.id)
                              }
                              className="px-6 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100"
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </div>
                    {index < pendingInvitations.length - 1 && (
                      <hr className="border-[#EDEDED]" />
                    )}
                  </div>
                ))}

              {(!members || members.length === 0) &&
                (!pendingInvitations || pendingInvitations.length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No members yet. Start by inviting someone!
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setSelectedMember(null);
        }}
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
    </>
  );
}
