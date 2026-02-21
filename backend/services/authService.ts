// services/authService.js
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { user, account, verification } from "../models/schema.js";
import { hashPassword as betterAuthHashPassword, verifyPassword as betterAuthVerifyPassword } from "better-auth/crypto";
import { userCache } from "../config/redis.js";
import logger from "../utils/logger.js";

class AuthService {
    // Hash password using Better Auth's exact implementation
    async hashPassword(password) {
        return await betterAuthHashPassword(password);
    }

    // Verify password using Better Auth's exact implementation
    async verifyPassword(password, hash) {
        return await betterAuthVerifyPassword({ password, hash });
    }

    // Generate token
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString("hex");
    }

    // Find user by email with Redis caching
    async findUserByEmail(email) {
        try {
            // Try to get from cache first
            const cacheKey = `user:email:${email}`;
            const cached = await userCache.get(cacheKey);
            
            if (cached) {
                logger.info(`[AUTH-CACHE] User found in cache: ${email}`);
                return cached;
            }

            // If not in cache, get from database
            logger.info(`[AUTH-CACHE] User not in cache, fetching from DB: ${email}`);
            const users = await db.select().from(user).where(eq(user.email, email));
            const foundUser = users[0] || null;

            // Cache the result if user found
            if (foundUser) {
                await userCache.set(cacheKey, foundUser, 3600); // Cache for 1 hour
            }

            return foundUser;
        } catch (error) {
            logger.error(error, '[AUTH-CACHE] Error in findUserByEmail:');
            // Fallback to database only
            const users = await db.select().from(user).where(eq(user.email, email));
            return users[0] || null;
        }
    }

    // Find user by ID with Redis caching
    async findUserById(userId) {
        try {
            // Try to get from cache first
            const cached = await userCache.get(userId);
            
            if (cached) {
                logger.info(`[AUTH-CACHE] User found in cache: ${userId}`);
                return cached;
            }

            // If not in cache, get from database
            logger.info(`[AUTH-CACHE] User not in cache, fetching from DB: ${userId}`);
            const users = await db.select().from(user).where(eq(user.id, userId));
            const foundUser = users[0] || null;

            // Cache the result if user found
            if (foundUser) {
                await userCache.set(userId, foundUser, 3600); // Cache for 1 hour
            }

            return foundUser;
        } catch (error) {
            logger.error(error, '[AUTH-CACHE] Error in findUserById:');
            // Fallback to database only
            const users = await db.select().from(user).where(eq(user.id, userId));
            return users[0] || null;
        }
    }

    // Invalidate user cache when user data changes
    async invalidateUserCache(userId, email) {
        try {
            await userCache.delete(userId);
            if (email) {
                await userCache.delete(`user:email:${email}`);
            }
            logger.info(`[AUTH-CACHE] Cache invalidated for user: ${userId}`);
        } catch (error) {
            logger.error(error, '[AUTH-CACHE] Error invalidating cache:');
        }
    }

    // Find credential account for user
    async findCredentialAccount(userId) {
        const accounts = await db.select().from(account).where(eq(account.userId, userId));
        return accounts.find(a => a.providerId === "credential") || null;
    }

    // Create password reset token
    async createResetToken(email) {
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.insert(verification).values({
            id: this.generateToken(16),
            identifier: `reset:${email}`,
            value: token,
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return token;
    }

    // Validate reset token
    async validateResetToken(email, token) {
        const tokens = await db.select().from(verification)
            .where(eq(verification.identifier, `reset:${email}`));
        
        return tokens.find(t => t.value === token && new Date(t.expiresAt) > new Date()) || null;
    }

    // Update password
    async updatePassword(accountId, newPassword) {
        const hashedPassword = await this.hashPassword(newPassword);
        await db.update(account)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(account.id, accountId));
    }

    // Delete token
    async deleteToken(tokenId) {
        await db.delete(verification).where(eq(verification.id, tokenId));
    }

    // Create verification token
    async createVerificationToken(email) {
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.insert(verification).values({
            id: this.generateToken(16),
            identifier: `verify:${email}`,
            value: token,
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return token;
    }

    // Validate verification token
    async validateVerificationToken(email, token) {
        const tokens = await db.select().from(verification)
            .where(eq(verification.identifier, `verify:${email}`));
        
        return tokens.find(t => t.value === token && new Date(t.expiresAt) > new Date()) || null;
    }

    // Verify user email
    async verifyUserEmail(email) {
        await db.update(user)
            .set({ emailVerified: true, updatedAt: new Date() })
            .where(eq(user.email, email));
        
        // Invalidate cache after email verification
        const foundUser = await this.findUserByEmail(email);
        if (foundUser) {
            await this.invalidateUserCache(foundUser.id, email);
        }
    }

    // Get all users (for debug)
    async getAllUsers() {
        return db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
        }).from(user);
    }

    // Find Google OAuth account for user (no password set)
    async findGoogleAccount(userId) {
        const accounts = await db.select().from(account).where(eq(account.userId, userId));
        return accounts.find(a => a.providerId === "google") || null;
    }

    // Check if user has any credential account (email/password)
    async hasCredentialAccount(userId) {
        const credentialAccount = await this.findCredentialAccount(userId);
        return credentialAccount !== null;
    }

    // Create credential account for Google user (set password)
    async createCredentialAccountForGoogleUser(userId, email, password) {
        const hashedPassword = await this.hashPassword(password);
        const accountId = this.generateToken(16);
        
        await db.insert(account).values({
            id: accountId,
            accountId: email,
            providerId: "credential",
            userId: userId,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Invalidate cache after creating credential account
        await this.invalidateUserCache(userId, email);

        return accountId;
    }

    // Check if user can set password (Google user without credential account)
    async canSetPassword(userId) {
        const googleAccount = await this.findGoogleAccount(userId);
        const credentialAccount = await this.findCredentialAccount(userId);
        
        return {
            canSet: googleAccount !== null && credentialAccount === null,
            hasGoogleAccount: googleAccount !== null,
            hasCredentialAccount: credentialAccount !== null,
        };
    }

    // Clean up unverified users older than 24 hours
    async cleanupUnverifiedUsers() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const unverifiedUsers = await db.select()
            .from(user)
            .where(
                eq(user.emailVerified, false)
            );
        
        const oldUnverifiedUsers = unverifiedUsers.filter(u => 
            new Date(u.createdAt) < oneDayAgo
        );

        if (oldUnverifiedUsers.length > 0) {
            logger.info(`[CLEANUP] Removing ${oldUnverifiedUsers.length} unverified users`);
            
            for (const u of oldUnverifiedUsers) {
                // Delete associated accounts first
                await db.delete(account).where(eq(account.userId, u.id));
                // Delete verification tokens
                await db.delete(verification).where(eq(verification.identifier, `verify:${u.email}`));
                // Delete user
                await db.delete(user).where(eq(user.id, u.id));
                // Invalidate cache
                await this.invalidateUserCache(u.id, u.email);
            }
        }

        return oldUnverifiedUsers.length;
    }
}

export const authService = new AuthService();

