/**
 * Converts a relative image path to a full URL
 * @param {string} imagePath - The image path (can be relative or absolute URL)
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path (starts with /), prepend the API URL
  if (imagePath.startsWith('/')) {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `${apiUrl}${imagePath}`;
  }

  // Otherwise, assume it's a relative path and prepend the API URL
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  return `${apiUrl}/${imagePath}`;
};
