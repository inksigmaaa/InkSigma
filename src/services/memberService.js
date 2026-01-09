// services/memberService.js
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const memberService = {
  // Get all members of a publication
  async getMembers(publicationId) {
    const response = await fetch(`${API_URL}/api/publication-members/${publicationId}/members`, {
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch members");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Send invitation to join publication
  async sendInvitation(publicationId, email, role) {
    const response = await fetch(`${API_URL}/api/publication-members/${publicationId}/invite`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Resend invitation
  async resendInvitation(publicationId, invitationId) {
    const response = await fetch(`${API_URL}/api/publication-members/${publicationId}/invite/${invitationId}/resend`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resend invitation");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Cancel invitation
  async cancelInvitation(publicationId, invitationId) {
    const response = await fetch(`${API_URL}/api/publication-members/${publicationId}/invite/${invitationId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel invitation");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Remove member from publication
  async removeMember(publicationId, memberId) {
    const response = await fetch(`${API_URL}/api/publication-members/${publicationId}/members/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Leave publication
  async leavePublication(publicationId) {
    const response = await fetch(`${API_URL}/api/publication-members/${publicationId}/leave`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to leave publication");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Get user's publications (owned + joined)
  async getUserPublications() {
    const response = await fetch(`${API_URL}/api/publication-members/my-publications`, {
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user publications");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Accept invitation
  async acceptInvitation(token) {
    const response = await fetch(`${API_URL}/api/publication-members/invite/${token}/accept`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invitation");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Decline invitation
  async declineInvitation(token) {
    const response = await fetch(`${API_URL}/api/publication-members/invite/${token}/decline`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to decline invitation");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },
};