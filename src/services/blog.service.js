const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const blogService = {
  // Get all blogs with optional filters
  async getBlogs(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    });

    try {
      const response = await fetch(`${API_URL}/api/blogs?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch blogs');
        } else {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
      }

      return response.json();
    } catch (error) {
      console.error("Get blogs error:", error);
      throw error;
    }
  },

  // Get published blogs only
  async getPublishedBlogs(filters = {}) {
    return this.getBlogs({ ...filters, published: true });
  },

  // Get all blogs (fallback method)
  async getAllBlogs() {
    const response = await fetch(`${API_URL}/api/blogs`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch blogs');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Get user's blogs (includes all statuses for the author)
  async getUserBlogs(authorId, filters = {}) {
    return this.getBlogs({ ...filters, authorId, includeUnpublished: 'true' });
  },

  // Get publication's blogs
  async getPublicationBlogs(publicationId, filters = {}) {
    const response = await fetch(`${API_URL}/api/blogs/publication/${publicationId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch publication blogs');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Get single blog by ID
  async getBlog(id) {
    const response = await fetch(`${API_URL}/api/blogs/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch blog');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Create new blog
  async createBlog(blogData) {
    const response = await fetch(`${API_URL}/api/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create blog');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Update blog
  async updateBlog(id, blogData) {
    const response = await fetch(`${API_URL}/api/blogs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update blog');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Publish/unpublish blog (backward compatibility)
  async togglePublishStatus(id, published) {
    const response = await fetch(`${API_URL}/api/blogs/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ published }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update blog status');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Update blog status (new method)
  async updateBlogStatus(id, status) {
    console.log(`[blogService] Updating blog ${id} to status: ${status}`)
    const response = await fetch(`${API_URL}/api/blogs/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    console.log(`[blogService] Response status: ${response.status}`)
    
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.error(`[blogService] Error response:`, data)
        throw new Error(data.error || 'Failed to update blog status');
      } else {
        console.error(`[blogService] Non-JSON error response`)
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    const result = await response.json();
    console.log(`[blogService] Success result:`, result)
    return result;
  },

  // Delete blog
  async deleteBlog(id) {
    const response = await fetch(`${API_URL}/api/blogs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete blog');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Upload blog thumbnail
  async uploadBlogImage(id, imageFile) {
    // Validate inputs
    if (!id) {
      throw new Error('Blog ID is required');
    }
    
    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error('A valid image file is required');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      throw new Error('File size too large. Please upload an image smaller than 10MB.');
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_URL}/api/blogs/${id}/image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      } else {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
    }

    return response.json();
  },

  // Helper methods for different blog statuses
  async getDraftBlogs(authorId) {
    return this.getBlogs({ authorId, published: false });
  },

  async getPublishedBlogsByAuthor(authorId) {
    return this.getBlogs({ authorId, published: true });
  },
};