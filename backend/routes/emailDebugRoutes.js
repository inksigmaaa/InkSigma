// routes/emailDebugRoutes.js
import express from "express";
import { emailService } from "../services/emailService.js";
import { db } from "../config/database.js";
import { verification, user } from "../models/schema.js";
import { eq, desc } from "drizzle-orm";

const router = express.Router();

// Test email sending
router.post("/test-email", async (req, res) => {
    try {
        const { email, type = "verification" } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        console.log(`[EMAIL-DEBUG] Testing ${type} email to: ${email}`);

        if (type === "verification") {
            const testUrl = "http://localhost:5000/api/auth/verify-email?token=test-token&callbackURL=http://localhost:3000/login";
            await emailService.sendVerification({
                email,
                name: "Test User",
                verifyUrl: testUrl,
            });
        } else if (type === "reset") {
            const testUrl = "http://localhost:5000/api/auth/reset-password?token=test-token&callbackURL=http://localhost:3000/reset-password";
            await emailService.sendPasswordReset({
                email,
                name: "Test User",
                resetUrl: testUrl,
            });
        }

        res.json({ 
            success: true, 
            message: `${type} email sent successfully to ${email}` 
        });
    } catch (error) {
        console.error(`[EMAIL-DEBUG] Failed to send test email:`, error);
        res.status(500).json({ 
            error: "Failed to send email", 
            details: error.message 
        });
    }
});

// Check verification records
router.get("/verification-records", async (req, res) => {
    try {
        const records = await db
            .select()
            .from(verification)
            .orderBy(desc(verification.createdAt))
            .limit(10);

        res.json({ 
            success: true, 
            records: records.map(record => ({
                id: record.id,
                identifier: record.identifier,
                expiresAt: record.expiresAt,
                createdAt: record.createdAt,
                isExpired: new Date() > record.expiresAt
            }))
        });
    } catch (error) {
        console.error("[EMAIL-DEBUG] Failed to fetch verification records:", error);
        res.status(500).json({ 
            error: "Failed to fetch records", 
            details: error.message 
        });
    }
});

// Check recent users and their verification status
router.get("/recent-users", async (req, res) => {
    try {
        const users = await db
            .select({
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt
            })
            .from(user)
            .orderBy(desc(user.createdAt))
            .limit(10);

        res.json({ success: true, users });
    } catch (error) {
        console.error("[EMAIL-DEBUG] Failed to fetch users:", error);
        res.status(500).json({ 
            error: "Failed to fetch users", 
            details: error.message 
        });
    }
});

// Manually trigger verification email for a user
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Find user
        const [foundUser] = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (!foundUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (foundUser.emailVerified) {
            return res.status(400).json({ error: "Email already verified" });
        }

        // Generate a verification URL (this is a simplified version)
        const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=manual-${Date.now()}&callbackURL=http://localhost:3000/login`;
        
        await emailService.sendVerification({
            email: foundUser.email,
            name: foundUser.name,
            verifyUrl: verificationUrl,
        });

        res.json({ 
            success: true, 
            message: `Verification email sent to ${email}` 
        });
    } catch (error) {
        console.error("[EMAIL-DEBUG] Failed to resend verification:", error);
        res.status(500).json({ 
            error: "Failed to resend verification", 
            details: error.message 
        });
    }
});

export default router;