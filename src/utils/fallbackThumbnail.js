/**
 * Get a random fallback thumbnail from the local thumbnails folder
 * Used when a blog post doesn't have a custom thumbnail image
 */

const FALLBACK_THUMBNAILS = [
  '/images/thumbnails/building.png',
  '/images/thumbnails/night-sky.png',
  '/images/thumbnails/pencil.png',
  '/images/thumbnails/pencils.png'
];

/**
 * Returns a random fallback thumbnail path
 * Uses a deterministic approach based on blog ID if provided for consistency
 * @param {string|number} blogId - Optional blog ID for consistent thumbnail selection
 * @returns {string} Path to a fallback thumbnail
 */
export function getFallbackThumbnail(blogId = null) {
  if (blogId) {
    // Use blog ID to consistently select the same thumbnail for the same blog
    const index = Math.abs(parseInt(blogId) || 0) % FALLBACK_THUMBNAILS.length;
    return FALLBACK_THUMBNAILS[index];
  }
  
  // Random selection if no blog ID provided
  const randomIndex = Math.floor(Math.random() * FALLBACK_THUMBNAILS.length);
  return FALLBACK_THUMBNAILS[randomIndex];
}

/**
 * Get thumbnail URL with fallback support
 * Automatically optimizes Cloudinary images for card display
 * @param {string} imageUrl - The blog's image URL
 * @param {string|number} blogId - Optional blog ID for consistent fallback
 * @returns {string} Image URL or fallback thumbnail path
 */
export function getThumbnailWithFallback(imageUrl, blogId = null) {
  if (!imageUrl) return getFallbackThumbnail(blogId);
  // Auto-optimize Cloudinary images for card thumbnails (400x250)
  if (imageUrl.includes('res.cloudinary.com')) {
    return imageUrl.replace('/upload/', '/upload/w_400,h_250,c_fill,f_auto,q_auto/');
  }
  return imageUrl;
}
