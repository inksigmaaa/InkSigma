// services/publicationService.js
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const publicationService = {
  // Get user's publication
  async getUserPublication(userId) {
    const response = await fetch(`${API_URL}/api/publications/user/${userId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch publication");
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Get publication details with stats (for members)
  async getPublicationDetails(publicationId) {
    if (!publicationId) {
      throw new Error('Publication ID is required');
    }
    
    try {
      const url = `${API_URL}/api/publications/${publicationId}/details`;
      
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Publication details API error (${response.status}):`, errorText);
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        
        throw new Error(errorData.error || `Failed to fetch publication details (${response.status})`);
      }

      const data = await response.json();
      return data;
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
        
        const errorMessage = errorData.error || errorData.message || errorData.details || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Publication created successfully:", result);
      return result;
    } catch (error) {
      console.error("Create publication error:", error);
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
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
