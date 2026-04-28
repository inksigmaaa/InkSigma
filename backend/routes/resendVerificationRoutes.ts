import express from "express";
import { db } from "../config/database.js";
import { user, verification } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { emailService } from "../services/emailService.js";
import crypto from "crypto";
import logger from "../utils/logger.js";
import { redactEmail } from "../utils/redactPII.js";
import { hashToken } from "../utils/tokenHash.js";

const router = express.Router();

const getFrontendUrl = () =>
    (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

// Resend verification email
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

        // Generate new verification token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Delete old verification tokens for this user. The plain email
        // identifier is legacy; new tokens use the same identifier shape as
        // /api/custom/verify-email.
        await db.delete(verification).where(eq(verification.identifier, email));
        await db.delete(verification).where(eq(verification.identifier, `verify:${email}`));

        // Create new verification token
        await db.insert(verification).values({
            id: crypto.randomUUID(),
            identifier: `verify:${email}`,
            value: hashToken(token),
            expiresAt,
        });

        // Send verification email
        const verifyUrl = `${getFrontendUrl()}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
        await emailService.sendVerification({
            email: foundUser.email,
            name: foundUser.name,
            verifyUrl,
        });

        logger.info(`[RESEND-VERIFICATION] Sent to ${redactEmail(email)}`);
        res.json({ message: "Verification email sent successfully" });
    } catch (error) {
        logger.error(error, "[RESEND-VERIFICATION] Error:");
        res.status(500).json({ error: "Failed to resend verification email" });
    }
});

export default router;
