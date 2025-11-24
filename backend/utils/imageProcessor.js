const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

async function processAndSaveImage(buffer, options) {
  const { width, height, quality = 85, type, publicationId } = options;
  
  // Process image
  const processed = await sharp(buffer)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .webp({ quality })
    .toBuffer();
  
  // Create upload directory
  const uploadDir = path.join(__dirname, '../../uploads', type);
  await fs.mkdir(uploadDir, { recursive: true });
  
  // Save file
  const filename = `${type}_${publicationId}_${Date.now()}.webp`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, processed);
  
  // Return URL
  return `/uploads/${type}/${filename}`;
}

module.exports = { processAndSaveImage };
