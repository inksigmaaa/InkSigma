/**
 * Backend Authentication Utilities
 * Server-side authentication helpers using database sessions
 */

const { db } = require('../db/index.cjs');
const { session, user } = require('../db/schema.cjs');
const { eq, and, gt } = require('drizzle-orm');

/**
 * Verify session token from request cookies
 * @param {Object} req - Express request object
 * @returns {string|null} - Session token or null
 */
const getSessionToken = (req) => {
    // Check for session token in cookies
    const sessionToken = req.cookies?.['better-auth.session_token'];
    
    // Also check Authorization header as fallback
    if (!sessionToken && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
    }
    
    return sessionToken || null;
};

/**
 * Verify session token against database
 * @param {string} token - Session token
 * @returns {Object|null} - Session object with user data or null
 */
const verifySessionToken = async (token) => {
    if (!token) return null;
    
    try {
        // Query database for session with this token
        const sessions = await db
            .select({
                sessionId: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt,
                userName: user.name,
                userEmail: user.email,
                userImage: user.image,
            })
            .from(session)
            .innerJoin(user, eq(session.userId, user.id))
            .where(
                and(
                    eq(session.token, token),
                    gt(session.expiresAt, new Date()) // Check if not expired
                )
            )
            .limit(1);
        
        if (sessions.length === 0) {
            return null;
        }
        
        return sessions[0];
    } catch (error) {
        console.error('Error verifying session token:', error);
        return null;
    }
};

/**
 * Middleware to verify user authentication using database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAuth = async (req, res, next) => {
    const token = getSessionToken(req);
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Authentication required' 
        });
    }
    
    // Verify token against database
    const sessionData = await verifySessionToken(token);
    
    if (!sessionData) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Invalid or expired session' 
        });
    }
    
    // Attach session data to request
    req.sessionToken = token;
    req.userId = sessionData.userId;
    req.user = {
        id: sessionData.userId,
        name: sessionData.userName,
        email: sessionData.userEmail,
        image: sessionData.userImage,
    };
    
    next();
};

/**
 * Middleware to optionally check authentication
 * Doesn't block request if not authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
    const token = getSessionToken(req);
    
    if (token) {
        const sessionData = await verifySessionToken(token);
        
        if (sessionData) {
            req.sessionToken = token;
            req.userId = sessionData.userId;
            req.user = {
                id: sessionData.userId,
                name: sessionData.userName,
                email: sessionData.userEmail,
                image: sessionData.userImage,
            };
            req.isAuthenticated = true;
        } else {
            req.isAuthenticated = false;
        }
    } else {
        req.isAuthenticated = false;
    }
    
    next();
};

/**
 * Get user ID from session token by querying database
 * @param {string} token - Session token
 * @returns {string|null} - User ID or null
 */
const getUserIdFromToken = async (token) => {
    if (!token) return null;
    
    try {
        const sessionData = await verifySessionToken(token);
        return sessionData ? sessionData.userId : null;
    } catch (error) {
        console.error('Error extracting user ID from token:', error);
        return null;
    }
};

/**
 * Get full user data from session token
 * @param {string} token - Session token
 * @returns {Object|null} - User object or null
 */
const getUserFromToken = async (token) => {
    if (!token) return null;
    
    try {
        const sessionData = await verifySessionToken(token);
        return sessionData ? {
            id: sessionData.userId,
            name: sessionData.userName,
            email: sessionData.userEmail,
            image: sessionData.userImage,
        } : null;
    } catch (error) {
        console.error('Error getting user from token:', error);
        return null;
    }
};

/**
 * Verify if user has admin privileges
 * @param {string} userId - User ID
 * @returns {boolean} - True if user is admin
 */
const isAdmin = async (userId) => {
    // TODO: Implement admin check based on your user roles
    // This could check a roles table or user.role field
    // For now, you could check against a list of admin user IDs
    
    try {
        // Example: Check if user has admin role in database
        // const adminUsers = await db.select().from(user).where(eq(user.id, userId));
        // return adminUsers.length > 0 && adminUsers[0].role === 'admin';
        
        // Placeholder - implement based on your needs
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

/**
 * Middleware to require admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = async (req, res, next) => {
    // First check if user is authenticated
    if (!req.userId) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Authentication required' 
        });
    }
    
    // Check if user is admin
    const adminStatus = await isAdmin(req.userId);
    
    if (!adminStatus) {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Admin privileges required' 
        });
    }
    
    next();
};

/**
 * Delete expired sessions from database (cleanup utility)
 * @returns {number} - Number of sessions deleted
 */
const cleanupExpiredSessions = async () => {
    try {
        const result = await db
            .delete(session)
            .where(gt(new Date(), session.expiresAt));
        
        return result.rowCount || 0;
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
        return 0;
    }
};

module.exports = {
    getSessionToken,
    verifySessionToken,
    requireAuth,
    optionalAuth,
    getUserIdFromToken,
    getUserFromToken,
    isAdmin,
    requireAdmin,
    cleanupExpiredSessions,
};