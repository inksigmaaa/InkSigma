const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.get('/session', authController.getSession);

// Protected routes
router.post('/refresh', requireAuth, authController.refreshSession);
router.delete('/sessions', requireAuth, authController.deleteAllSessions);

module.exports = router;
