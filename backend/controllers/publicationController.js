const Publication = require('../models/Publication');
const { processAndSaveImage } = require('../utils/imageProcessor');

// GET /api/publications/user/:userId
exports.getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const publication = await Publication.findByUserId(userId);
    
    if (!publication) {
      return res.status(404).json({ error: 'Publication not found' });
    }
    
    res.json(publication);
  } catch (error) {
    console.error('Get publication error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/publications/:id/settings
exports.getSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const publication = await Publication.findById(id);
    
    if (!publication) {
      return res.status(404).json({ error: 'Publication not found' });
    }
    
    res.json(publication);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/publications/:id/settings
exports.updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Validation
    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    
    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Name too long (max 100 chars)' });
    }
    
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description too long (max 500 chars)' });
    }
    
    const updated = await Publication.updateBasicInfo(id, { name, description });
    res.json(updated);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/publications/:id/subdomain
exports.updateSubdomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { subdomain } = req.body;
    
    // Validation
    if (!subdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }
    
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({ 
        error: 'Invalid subdomain. Use lowercase letters, numbers, and hyphens only.' 
      });
    }
    
    // Check reserved names
    const reserved = ['www', 'api', 'admin', 'blog', 'mail', 'app'];
    if (reserved.includes(subdomain.toLowerCase())) {
      return res.status(400).json({ error: 'This subdomain is reserved' });
    }
    
    // Check availability
    const isAvailable = await Publication.isSubdomainAvailable(subdomain, id);
    if (!isAvailable) {
      return res.status(409).json({ error: 'Subdomain already taken' });
    }
    
    const updated = await Publication.updateSubdomain(id, subdomain);
    res.json(updated);
  } catch (error) {
    console.error('Update subdomain error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/publications/check-subdomain/:subdomain
exports.checkSubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const isAvailable = await Publication.isSubdomainAvailable(subdomain);
    res.json({ subdomain, available: isAvailable });
  } catch (error) {
    console.error('Check subdomain error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/publications/:id/logo
exports.uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Process and save
    const url = await processAndSaveImage(req.file.buffer, {
      width: 400,
      height: 400,
      quality: 85,
      type: 'logo',
      publicationId: id
    });
    
    // Update database
    await Publication.updateImageUrl(id, 'logo', url);
    
    res.json({ url });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/publications/:id/favicon
exports.uploadFavicon = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const url = await processAndSaveImage(req.file.buffer, {
      width: 32,
      height: 32,
      quality: 85,
      type: 'favicon',
      publicationId: id
    });
    
    await Publication.updateImageUrl(id, 'favicon', url);
    res.json({ url });
  } catch (error) {
    console.error('Upload favicon error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/publications/:id/meta_og
exports.uploadMetaOg = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const url = await processAndSaveImage(req.file.buffer, {
      width: 1200,
      height: 630,
      quality: 85,
      type: 'meta_og',
      publicationId: id
    });
    
    await Publication.updateImageUrl(id, 'meta_og', url);
    res.json({ url });
  } catch (error) {
    console.error('Upload meta OG error:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/publications/:id/:imageType
exports.removeImage = async (req, res) => {
  try {
    const { id, imageType } = req.params;
    
    if (!['logo', 'favicon', 'meta_og'].includes(imageType)) {
      return res.status(400).json({ error: 'Invalid image type' });
    }
    
    await Publication.removeImage(id, imageType);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
