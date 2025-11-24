const { db } = require('../config/db');
const { user, account } = require('../db/schema.cjs');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');

/**
 * User Model
 * Handles user-related database operations
 */
class User {
    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const users = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);
        
        return users.length > 0 ? users[0] : null;
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const users = await db
            .select()
            .from(user)
            .where(eq(user.id, id))
            .limit(1);
        
        return users.length > 0 ? users[0] : null;
    }

    /**
     * Create new user
     */
    static async create({ name, email, password }) {
        const userId = crypto.randomUUID();
        
        // Create user
        await db.insert(user).values({
            id: userId,
            name,
            email,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Create account with password
        const accountId = crypto.randomUUID();
        await db.insert(account).values({
            id: accountId,
            accountId: email,
            providerId: 'credential',
            userId,
            password, // TODO: Hash this with bcrypt
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return await this.findById(userId);
    }

    /**
     * Get user's password from account table
     */
    static async getPassword(userId) {
        const accounts = await db
            .select()
            .from(account)
            .where(eq(account.userId, userId))
            .limit(1);
        
        return accounts.length > 0 ? accounts[0].password : null;
    }

    /**
     * Update user
     */
    static async update(id, data) {
        await db
            .update(user)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(user.id, id));
        
        return await this.findById(id);
    }

    /**
     * Delete user
     */
    static async delete(id) {
        await db.delete(user).where(eq(user.id, id));
    }
}

module.exports = User;
