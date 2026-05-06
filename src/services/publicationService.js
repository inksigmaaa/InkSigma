// services/publicationService.js
import { getApiBase } from "@/utils/apiBase";
import {
  buildGetJsonDedupeKey,
  dedupeJsonRequest,
} from "@/utils/jsonRequestDedupe";

const API_URL = getApiBase();

const readErrorMessage = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    const error = await response.json();
    return error.error || error.message || fallbackMessage;
  }

  return `Server error (${response.status}): ${response.statusText}`;
};

const getJson = (url, fallbackMessage = "Request failed") => {
  const options = {
    credentials: "include",
    cache: "no-store",
  };
  const requestKey = buildGetJsonDedupeKey(url, options);

  return dedupeJsonRequest(requestKey, async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, fallbackMessage));
    }

    return response.json();
  });
};

export const publicationService = {
  // Get user's publication
  async getUserPublication(userId) {
    return getJson(
      `${API_URL}/api/publications/user/${userId}`,
      "Failed to fetch publication",
    );
  },

  // Get publication by ID
  async getPublication(publicationId) {
    if (!publicationId) {
      throw new Error("Publication ID is required");
    }

    return getJson(
      `${API_URL}/api/publications/${publicationId}`,
      "Failed to fetch publication",
    );
  },

  // Get publication details with stats (for members)
  async getPublicationDetails(publicationId) {
    if (!publicationId) {
      throw new Error('Publication ID is required');
    }
    
    try {
      return getJson(
        `${API_URL}/api/publications/${publicationId}/details`,
        "Failed to fetch publication details",
      );
    } catch (error) {
      console.error('Publication details service error:', error);
      throw error;
    }
  },

  // Create publication
  async createPublication(data) {
    try {
      console.log("Creating publication with data:", data);
      console.log("API URL:", API_URL);
      
      const response = await fetch(`${API_URL}/api/publications`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Read response as text first to see what we're getting
        const responseText = await response.text();
        console.error("Error response text:", responseText);
        
        // Try to parse as JSON
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          console.error("Parsed error data:", errorData);
        } catch (e) {
          console.error("Failed to parse error response as JSON:", e);
          errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Extract error message with fallbacks
        const errorMessage = 
          errorData?.error || 
          errorData?.message || 
          errorData?.details || 
          responseText || 
          `Server error (${response.status}: ${response.statusText})`;
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorData;
        throw error;
      }

      const result = await response.json();
      console.log("Publication created successfully:", result);
      return result;
    } catch (error) {
      console.error("Create publication error:", error);
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error status:", error.status);
      console.error("Error details:", error.details);
      throw error;
    }
  },

  // Update publication
  async updatePublication(id, data) {
    const response = await fetch(`${API_URL}/api/publications/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update publication");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Upload logo
  async uploadLogo(id, file) {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await fetch(`${API_URL}/api/publications/${id}/logo`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload logo");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Upload favicon
  async uploadFavicon(id, file) {
    const formData = new FormData();
    formData.append("favicon", file);

    const response = await fetch(`${API_URL}/api/publications/${id}/favicon`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload favicon");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Upload meta OG image
  async uploadMetaOg(id, file) {
    const formData = new FormData();
    formData.append("metaOg", file);

    const response = await fetch(`${API_URL}/api/publications/${id}/meta-og`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload meta OG image");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Remove image
  async removeImage(id, type) {
    const response = await fetch(`${API_URL}/api/publications/${id}/image/${type}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove image");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },
};
