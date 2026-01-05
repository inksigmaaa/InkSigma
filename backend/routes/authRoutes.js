// routes/authRoutes.js
import express from "express";
import { authService } from "../services/authService.js";
import { emailService } from "../services/emailService.js";

const router = express.Router();

// POST /api/custom/forgot-password
router.post("/forgot-password", async (req, res) => {
    try {
        const { email, redirectTo } = req.body;
        console.log(`[AUTH] Forgot password request for: ${email}`);

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await authService.findUserByEmail(email);
        
        if (!user) {
            // Security: Don't reveal if user exists
            console.log(`[AUTH] User not found: ${email} (returning success)`);
            return res.json({ success: true });
        }

        const token = await authService.createResetToken(email);
        const resetUrl = `${redirectTo || "http://localhost:3000/reset-password"}?token=${token}&email=${encodeURIComponent(email)}`;

        await emailService.sendPasswordReset({
            email,
            name: user.name,
            resetUrl,
        });

        console.log(`[AUTH] Password reset email sent to: ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[AUTH] Forgot password error:`, error);
        res.status(500).json({ error: "Failed to send reset email" });
    }
});

// POST /api/custom/reset-password
router.post("/reset-password", async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;
        console.log(`[AUTH] Reset password for: ${email}`);

        if (!token || !email || !newPassword) {
            return res.status(400).json({ error: "Token, email, and new password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const validToken = await authService.validateResetToken(email, token);
        if (!validToken) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const user = await authService.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const credentialAccount = await authService.findCredentialAccount(user.id);
        if (!credentialAccount) {
            return res.status(400).json({ error: "No password account found" });
        }

        await authService.updatePassword(credentialAccount.id, newPassword);
        await authService.deleteToken(validToken.id);

        console.log(`[AUTH] Password reset successful for: ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[AUTH] Reset password error:`, error);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

// POST /api/custom/send-verification
router.post("/send-verification", async (req, res) => {
    try {
        const { email, redirectTo } = req.body;
        console.log(`[AUTH] Send verification for: ${email}`);

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await authService.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.emailVerified) {
            return res.json({ success: true, message: "Email already verified" });
        }

        const token = await authService.createVerificationToken(email);
        const verifyUrl = `${redirectTo || "http://localhost:3000/verify-email"}?token=${token}&email=${encodeURIComponent(email)}`;

        await emailService.sendVerification({
            email,
            name: user.name,
            verifyUrl,
        });

        console.log(`[AUTH] Verification email sent to: ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[AUTH] Send verification error:`, error);
        res.status(500).json({ error: "Failed to send verification email" });
    }
});

// POST /api/custom/verify-email
router.post("/verify-email", async (req, res) => {
    try {
        const { token, email } = req.body;
        console.log(`[AUTH] Verify email for: ${email}`);

        const validToken = await authService.validateVerificationToken(email, token);
        if (!validToken) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        await authService.verifyUserEmail(email);
        await authService.deleteToken(validToken.id);

        console.log(`[AUTH] Email verified for: ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[AUTH] Verify email error:`, error);
        res.status(500).json({ error: "Failed to verify email" });
    }
});

export default router;
