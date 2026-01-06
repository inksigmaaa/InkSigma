// services/publicationService.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const publicationService = {
  // Get user's publication
  async getUserPublication(userId) {
    const response = await fetch(`${API_URL}/api/publications/user/${userId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch publication");
    }

    return response.json();
  },

  // Create publication
  async createPublication(data) {
    const response = await fetch(`${API_URL}/api/publications`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create publication");
    }

    return response.json();
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
      const error = await response.json();
      throw new Error(error.error || "Failed to update publication");
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
      const error = await response.json();
      throw new Error(error.error || "Failed to upload logo");
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
      const error = await response.json();
      throw new Error(error.error || "Failed to upload favicon");
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
      const error = await response.json();
      throw new Error(error.error || "Failed to upload meta OG image");
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
      const error = await response.json();
      throw new Error(error.error || "Failed to remove image");
    }

    return response.json();
  },
};
