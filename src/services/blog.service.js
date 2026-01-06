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

    const response = await fetch(`${API_URL}/api/blogs?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch blogs');
    }

    return response.json();
  },

  // Get published blogs only
  async getPublishedBlogs(filters = {}) {
    return this.getBlogs({ ...filters, published: true });
  },

  // Get user's blogs
  async getUserBlogs(authorId, filters = {}) {
    return this.getBlogs({ ...filters, authorId });
  },

  // Get single blog by ID
  async getBlog(id) {
    const response = await fetch(`${API_URL}/api/blogs/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch blog');
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
      const data = await response.json();
      throw new Error(data.error || 'Failed to create blog');
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
      const data = await response.json();
      throw new Error(data.error || 'Failed to update blog');
    }

    return response.json();
  },

  // Publish/unpublish blog
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
      const data = await response.json();
      throw new Error(data.error || 'Failed to update blog status');
    }

    return response.json();
  },

  // Delete blog
  async deleteBlog(id) {
    const response = await fetch(`${API_URL}/api/blogs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete blog');
    }

    return response.json();
  },

  // Upload blog thumbnail
  async uploadBlogImage(id, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_URL}/api/blogs/${id}/image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload image');
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