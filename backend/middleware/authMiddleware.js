const { db } = require('../config/db');
const { session, user } = require('../db/schema.cjs');
const { eq, and, gt } = require('drizzle-orm');

/**
 * Get session token from request
 */
const getSessionToken = (req) => {
    const sessionToken = req.cookies?.['better-auth.session_token'];
    
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
 */
const verifySessionToken = async (token) => {
    if (!token) return null;
    
    try {
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
                    gt(session.expiresAt, new Date())
                )
            )
            .limit(1);
        
        return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
        console.error('Error verifying session token:', error);
        return null;
    }
};

/**
 * Middleware to require authentication
 */
const requireAuth = async (req, res, next) => {
    const token = getSessionToken(req);
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Authentication required' 
        });
    }
    
    const sessionData = await verifySessionToken(token);
    
    if (!sessionData) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Invalid or expired session' 
        });
    }
    
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

module.exports = {
    requireAuth,
    optionalAuth,
    getSessionToken,
    verifySessionToken,
};
