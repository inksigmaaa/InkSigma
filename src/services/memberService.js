// services/memberService.js
import { getApiBase } from "@/utils/apiBase";
const API_URL = getApiBase();

const getRequestBases = () => {
  const bases = [];

  if (typeof window !== "undefined") {
    bases.push("");
  }

  if (API_URL) {
    bases.push(API_URL);
  }

  return Array.from(new Set(bases));
};

const isNetworkFetchError = (error) => {
  if (!error) return false;

  return (
    error instanceof TypeError ||
    error.message === "Failed to fetch" ||
    error.message === "NetworkError when attempting to fetch resource." ||
    error.message === "Load failed"
  );
};

const shouldRetryDirectBackend = (base, status, message) => {
  if (base !== "") return false;

  return (
    status === 502 ||
    (status === 500 &&
      (message.includes("BACKEND_URL") ||
        message.includes("Backend URL is not configured")))
  );
};

const readErrorMessage = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    const error = await response.json();
    return error.error || error.message || fallbackMessage;
  }

  return `Server error (${response.status}): ${response.statusText}`;
};

const requestJson = async (path, options = {}, fallbackMessage = "Request failed") => {
  const bases = getRequestBases();
  let lastNetworkError = null;

  for (const [index, base] of bases.entries()) {
    try {
      const response = await fetch(`${base}${path}`, {
        credentials: "include",
        ...options,
        headers: {
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, fallbackMessage);

        if (
          index < bases.length - 1 &&
          shouldRetryDirectBackend(base, response.status, message)
        ) {
          continue;
        }

        throw new Error(message);
      }

      return response.json();
    } catch (error) {
      if (isNetworkFetchError(error) && index < bases.length - 1) {
        lastNetworkError = error;
        continue;
      }

      if (isNetworkFetchError(error)) {
        const target = base || "the app API proxy";
        throw new Error(
          `Cannot connect to backend through ${target}. Make sure the backend server is running and reachable.`,
        );
      }

      throw error;
    }
  }

  throw lastNetworkError || new Error(fallbackMessage);
};

export const memberService = {
  // Get all members of a publication
  async getMembers(publicationId) {
    return requestJson(
      `/api/members/${publicationId}/members`,
      {},
      "Failed to fetch members",
    );
  },

  // Send invitation to join publication
  async sendInvitation(publicationId, email, role) {
    return requestJson(
      `/api/members/${publicationId}/invite`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      },
      "Failed to send invitation",
    );
  },

  // Resend invitation
  async resendInvitation(publicationId, invitationId) {
    return requestJson(
      `/api/members/${publicationId}/invite/${invitationId}/resend`,
      { method: "POST" },
      "Failed to resend invitation",
    );
  },

  // Cancel invitation
  async cancelInvitation(publicationId, invitationId) {
    return requestJson(
      `/api/members/${publicationId}/invite/${invitationId}`,
      { method: "DELETE" },
      "Failed to cancel invitation",
    );
  },

  // Remove member from publication
  async removeMember(publicationId, memberId) {
    return requestJson(
      `/api/members/${publicationId}/members/${memberId}`,
      { method: "DELETE" },
      "Failed to remove member",
    );
  },

  // Leave publication
  async leavePublication(publicationId) {
    return requestJson(
      `/api/members/${publicationId}/leave`,
      { method: "POST" },
      "Failed to leave publication",
    );
  },

  // Get user's publications (owned + joined)
  async getUserPublications() {
    // Only run on client side
    if (typeof window === 'undefined') {
      console.warn('[memberService] getUserPublications called on server side, skipping');
      return [];
    }

    try {
      return requestJson(
        `/api/members/user/publications`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
        "Failed to fetch user publications",
      );
    } catch (error) {
      // If it's a network error (Failed to fetch), provide more context
      if (isNetworkFetchError(error)) {
        throw new Error(`Cannot connect to backend at ${API_URL}. Make sure the backend server is running.`);
      }
      throw error;
    }
  },

  // Get invitation details
  async getInvitationDetails(token) {
    return requestJson(
      `/api/members/invite/${token}`,
      {},
      "Failed to fetch invitation details",
    );
  },

  // Accept invitation
  async acceptInvitation(token) {
    return requestJson(
      `/api/members/invite/${token}/accept`,
      { method: "POST" },
      "Failed to accept invitation",
    );
  },

  // Decline invitation
  async declineInvitation(token) {
    return requestJson(
      `/api/members/invite/${token}/decline`,
      { method: "POST" },
      "Failed to decline invitation",
    );
  },
};
