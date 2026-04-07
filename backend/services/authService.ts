// services/authService.js
import crypto from "crypto";
import { eq, and, lt, inArray } from "drizzle-orm";
import { db } from "../config/database.js";
import { user, account, verification } from "../models/schema.js";
import { hashPassword as betterAuthHashPassword, verifyPassword as betterAuthVerifyPassword } from "better-auth/crypto";
import { userCache } from "../config/redis.js";
import logger from "../utils/logger.js";

interface UserRow {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
    username: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface AccountRow {
    id: string;
    accountId: string;
    providerId: string;
    userId: string;
    accessToken: string | null;
    refreshToken: string | null;
    idToken: string | null;
    accessTokenExpiresAt: Date | null;
    refreshTokenExpiresAt: Date | null;
    scope: string | null;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface VerificationRow {
    id: string;
    identifier: string;
    value: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

class AuthService {
    async hashPassword(password: string): Promise<string> {
        return await betterAuthHashPassword(password);
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await betterAuthVerifyPassword({ password, hash });
    }

    generateToken(length = 32): string {
        return crypto.randomBytes(length).toString("hex");
    }

    async findUserByEmail(email: string): Promise<UserRow | null> {
        try {
            const cacheKey = `user:email:${email}`;
            const cached = await userCache.get(cacheKey);
            
            if (cached) {
                logger.info(`[AUTH-CACHE] User found in cache: [REDACTED]`);
                return cached as UserRow;
            }

            logger.info(`[AUTH-CACHE] User not in cache, fetching from DB: [REDACTED]`);
            const users = await db.select().from(user).where(eq(user.email, email));
            const foundUser = users[0] || null;

            if (foundUser) {
                await userCache.set(cacheKey, foundUser, 3600);
            }

            return foundUser;
        } catch (error) {
            logger.error(error, '[AUTH-CACHE] Error in findUserByEmail:');
            const users = await db.select().from(user).where(eq(user.email, email));
            return users[0] || null;
        }
    }

    async findUserById(userId: string): Promise<UserRow | null> {
        try {
            const cached = await userCache.get(userId);
            
            if (cached) {
                logger.info(`[AUTH-CACHE] User found in cache: ${userId.slice(0, 8)}...`);
                return cached as UserRow;
            }

            logger.info(`[AUTH-CACHE] User not in cache, fetching from DB: ${userId.slice(0, 8)}...`);
            const users = await db.select().from(user).where(eq(user.id, userId));
            const foundUser = users[0] || null;

            if (foundUser) {
                await userCache.set(userId, foundUser, 3600);
            }

            return foundUser;
        } catch (error) {
            logger.error(error, '[AUTH-CACHE] Error in findUserById:');
            const users = await db.select().from(user).where(eq(user.id, userId));
            return users[0] || null;
        }
    }

    async invalidateUserCache(userId: string, email?: string): Promise<void> {
        try {
            await userCache.delete(userId);
            if (email) {
                await userCache.delete(`user:email:${email}`);
            }
            logger.info(`[AUTH-CACHE] Cache invalidated for user: ${userId.slice(0, 8)}...`);
        } catch (error) {
            logger.error(error, '[AUTH-CACHE] Error invalidating cache:');
        }
    }

    async findCredentialAccount(userId: string): Promise<AccountRow | null> {
        const accounts = await db.select().from(account).where(eq(account.userId, userId));
        return accounts.find(a => a.providerId === "credential") || null;
    }

    async createResetToken(email: string): Promise<string> {
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

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

    async validateResetToken(email: string, token: string): Promise<VerificationRow | null> {
        const tokens = await db.select().from(verification)
            .where(eq(verification.identifier, `reset:${email}`));
        
        return tokens.find(t => t.value === token && new Date(t.expiresAt) > new Date()) || null;
    }

    async updatePassword(accountId: string, newPassword: string): Promise<void> {
        const hashedPassword = await this.hashPassword(newPassword);
        await db.update(account)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(account.id, accountId));
    }

    async deleteToken(tokenId: string): Promise<void> {
        await db.delete(verification).where(eq(verification.id, tokenId));
    }

    async createVerificationToken(email: string): Promise<string> {
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

    async validateVerificationToken(email: string, token: string): Promise<VerificationRow | null> {
        const tokens = await db.select().from(verification)
            .where(eq(verification.identifier, `verify:${email}`));
        
        return tokens.find(t => t.value === token && new Date(t.expiresAt) > new Date()) || null;
    }

    async verifyUserEmail(email: string): Promise<void> {
        await db.update(user)
            .set({ emailVerified: true, updatedAt: new Date() })
            .where(eq(user.email, email));
        
        const foundUser = await this.findUserByEmail(email);
        if (foundUser) {
            await this.invalidateUserCache(foundUser.id, email);
        }
    }

    async getAllUsers(): Promise<Pick<UserRow, 'id' | 'name' | 'email' | 'emailVerified' | 'createdAt'>[]> {
        return db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
        }).from(user);
    }

    async findGoogleAccount(userId: string): Promise<AccountRow | null> {
        const accounts = await db.select().from(account).where(eq(account.userId, userId));
        return accounts.find(a => a.providerId === "google") || null;
    }

    async hasCredentialAccount(userId: string): Promise<boolean> {
        const credentialAccount = await this.findCredentialAccount(userId);
        return credentialAccount !== null;
    }

    async createCredentialAccountForGoogleUser(userId: string, email: string, password: string): Promise<string> {
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

        await this.invalidateUserCache(userId, email);

        return accountId;
    }

    async canSetPassword(userId: string): Promise<{ canSet: boolean; hasGoogleAccount: boolean; hasCredentialAccount: boolean }> {
        const googleAccount = await this.findGoogleAccount(userId);
        const credentialAccount = await this.findCredentialAccount(userId);
        
        return {
            canSet: googleAccount !== null && credentialAccount === null,
            hasGoogleAccount: googleAccount !== null,
            hasCredentialAccount: credentialAccount !== null,
        };
    }

    async cleanupUnverifiedUsers(): Promise<number> {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Single query with WHERE filter — no client-side filtering needed
        const oldUnverifiedUsers = await db.select({ id: user.id, email: user.email })
            .from(user)
            .where(
                and(
                    eq(user.emailVerified, false),
                    lt(user.createdAt, oneDayAgo),
                )
            );

        if (oldUnverifiedUsers.length === 0) return 0;

        logger.info(`[CLEANUP] Removing ${oldUnverifiedUsers.length} unverified users`);

        const ids = oldUnverifiedUsers.map(u => u.id);
        const verificationIds = oldUnverifiedUsers.map(u => `verify:${u.email}`);

        try {
            // Batch delete: 3 queries total instead of 3 × N
            await db.transaction(async (tx) => {
                await tx.delete(account).where(inArray(account.userId, ids));
                await tx.delete(verification).where(inArray(verification.identifier, verificationIds));
                await tx.delete(user).where(inArray(user.id, ids));
            });

            // Invalidate caches in parallel
            await Promise.allSettled(
                oldUnverifiedUsers.map(u => this.invalidateUserCache(u.id, u.email))
            );
        } catch (error) {
            logger.error(error, `[CLEANUP] Error batch-deleting ${ids.length} unverified users`);
        }

        return oldUnverifiedUsers.length;
    }
}

export const authService = new AuthService();

