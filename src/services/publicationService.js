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
      const response = await fetch(`${API_URL}/api/publications`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Clone the response so we can read it multiple times if needed
        const clonedResponse = response.clone();
        
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get("content-type");
          
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            console.error("Create publication error response:", error);
            const errorMessage = error.error || error.message || "Failed to create publication";
            throw new Error(errorMessage);
          } else {
            // If not JSON, read as text
            const text = await response.text();
            console.error("Non-JSON response:", text.substring(0, 500));
            throw new Error(`Server error (${response.status}): ${response.statusText}`);
          }
        } catch (parseError) {
          // If JSON parsing fails, try reading as text from cloned response
          console.error("Error parsing response:", parseError);
          try {
            const text = await clonedResponse.text();
            console.error("Response text:", text.substring(0, 500));
            throw new Error(`Server error (${response.status}): ${text.substring(0, 100) || response.statusText}`);
          } catch {
            throw new Error(`Server error (${response.status}): ${response.statusText}`);
          }
        }
      }

      return response.json();
    } catch (error) {
      console.error("Create publication error:", error);
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
