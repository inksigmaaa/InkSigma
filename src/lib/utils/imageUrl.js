export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  return imagePath.startsWith('/') ? `${apiUrl}${imagePath}` : `${apiUrl}/${imagePath}`;
};

export const getCloudinaryThumbnail = (url, { width = 400, height = 300, crop = 'fill' } = {}) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_${crop},f_auto,q_auto/`);
};
