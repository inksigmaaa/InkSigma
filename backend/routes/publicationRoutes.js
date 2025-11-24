const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController');
const upload = require('../middleware/upload');

// Get publication by user ID
router.get('/publications/user/:userId', publicationController.getByUserId);

// Get publication settings
router.get('/publications/:id/settings', publicationController.getSettings);

// Update name & description
router.put('/publications/:id/settings', publicationController.updateSettings);

// Update subdomain
router.put('/publications/:id/subdomain', publicationController.updateSubdomain);

// Check subdomain availability
router.get('/publications/check-subdomain/:subdomain', publicationController.checkSubdomain);

// Upload images
router.post('/publications/:id/logo', upload.single('logo'), publicationController.uploadLogo);
router.post('/publications/:id/favicon', upload.single('favicon'), publicationController.uploadFavicon);
router.post('/publications/:id/meta_og', upload.single('meta_og'), publicationController.uploadMetaOg);

// Remove images
router.delete('/publications/:id/:imageType', publicationController.removeImage);

module.exports = router;
