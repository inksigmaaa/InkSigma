const { db } = require('../config/db');
const { session } = require('../db/schema.cjs');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');
const User = require('../models/User');

/**
 * POST /api/auth/login
 * Login with email and password
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user by email
        const foundUser = await User.findByEmail(email);

        if (!foundUser) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        // Get user's password
        const storedPassword = await User.getPassword(foundUser.id);

        if (!storedPassword) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        // TODO: Implement proper password hashing verification with bcrypt
        const isPasswordValid = storedPassword === password;

        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        // Create session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await db.insert(session).values({
            id: sessionId,
            token: sessionToken,
            userId: foundUser.id,
            expiresAt: expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Set cookie
        res.cookie('better-auth.session_token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({
            success: true,
            user: {
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                image: foundUser.image,
            },
            session: {
                token: sessionToken,
                expiresAt: expiresAt,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/auth/logout
 * Logout and destroy session
 */
exports.logout = async (req, res) => {
    try {
        const token = req.cookies?.['better-auth.session_token'];

        if (token) {
            // Delete session from database
            await db
                .delete(session)
                .where(eq(session.token, token));
        }

        // Clear cookie
        res.clearCookie('better-auth.session_token');

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/auth/session
 * Get current session and user data
 */
exports.getSession = async (req, res) => {
    try {
        const token = req.cookies?.['better-auth.session_token'];

        if (!token) {
            return res.status(401).json({ 
                error: 'Not authenticated',
                session: null 
            });
        }

        // Verify session
        const { verifySessionToken } = require('../middleware/authMiddleware');
        const sessionData = await verifySessionToken(token);

        if (!sessionData) {
            return res.status(401).json({ 
                error: 'Invalid session',
                session: null 
            });
        }

        // Check if expired
        if (new Date(sessionData.expiresAt) < new Date()) {
            // Delete expired session
            await db
                .delete(session)
                .where(eq(session.token, token));

            res.clearCookie('better-auth.session_token');

            return res.status(401).json({ 
                error: 'Session expired',
                session: null 
            });
        }

        res.json({
            session: {
                id: sessionData.sessionId,
                expiresAt: sessionData.expiresAt,
            },
            user: {
                id: sessionData.userId,
                name: sessionData.userName,
                email: sessionData.userEmail,
                image: sessionData.userImage,
                emailVerified: sessionData.userEmailVerified,
            },
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/auth/register
 * Register new user
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Name, email, and password are required' 
            });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);

        if (existingUser) {
            return res.status(409).json({ 
                error: 'User already exists' 
            });
        }

        // Create user (TODO: Hash password with bcrypt)
        const newUser = await User.create({ name, email, password });
        const userId = newUser.id;

        // Create session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db.insert(session).values({
            id: sessionId,
            token: sessionToken,
            userId: userId,
            expiresAt: expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Set cookie
        res.cookie('better-auth.session_token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            success: true,
            user: {
                id: userId,
                name: name,
                email: email,
            },
            session: {
                token: sessionToken,
                expiresAt: expiresAt,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/auth/refresh
 * Refresh session token
 */
exports.refreshSession = async (req, res) => {
    try {
        const oldToken = req.cookies?.['better-auth.session_token'];

        if (!oldToken) {
            return res.status(401).json({ 
                error: 'No session to refresh' 
            });
        }

        // Get current session
        const sessions = await db
            .select()
            .from(session)
            .where(eq(session.token, oldToken))
            .limit(1);

        if (sessions.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid session' 
            });
        }

        const currentSession = sessions[0];

        // Delete old session
        await db
            .delete(session)
            .where(eq(session.token, oldToken));

        // Create new session
        const newToken = crypto.randomBytes(32).toString('hex');
        const newSessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db.insert(session).values({
            id: newSessionId,
            token: newToken,
            userId: currentSession.userId,
            expiresAt: expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Set new cookie
        res.cookie('better-auth.session_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            session: {
                token: newToken,
                expiresAt: expiresAt,
            },
        });
    } catch (error) {
        console.error('Refresh session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * DELETE /api/auth/sessions
 * Delete all sessions for current user (logout from all devices)
 */
exports.deleteAllSessions = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ 
                error: 'Not authenticated' 
            });
        }

        // Delete all sessions for this user
        await db
            .delete(session)
            .where(eq(session.userId, req.userId));

        // Clear cookie
        res.clearCookie('better-auth.session_token');

        res.json({ 
            success: true, 
            message: 'All sessions deleted' 
        });
    } catch (error) {
        console.error('Delete all sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = exports;
