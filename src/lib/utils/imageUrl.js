export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://api.inksigma.xyz' : 'http://localhost:5000');
  return imagePath.startsWith('/') ? `${apiUrl}${imagePath}` : `${apiUrl}/${imagePath}`;
};
