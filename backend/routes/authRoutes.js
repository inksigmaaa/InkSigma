// routes/authRoutes.js
import express from "express";
import { authService } from "../services/authService.js";
import { emailService } from "../services/emailService.js";
import { auth } from "../config/betterAuth.js";

const router = express.Router();

// Helper to get session from request
async function getSession(req) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
    }
    
    const session = await auth.api.getSession({ headers });
    return session;
}

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

        let credentialAccount = await authService.findCredentialAccount(user.id);
        
        // If no credential account exists (Google-only user), create one
        if (!credentialAccount) {
            const googleAccount = await authService.findGoogleAccount(user.id);
            if (googleAccount) {
                // Create credential account for Google user
                await authService.createCredentialAccountForGoogleUser(user.id, email, newPassword);
                await authService.deleteToken(validToken.id);
                console.log(`[AUTH] Password set for Google user via reset: ${email}`);
                return res.json({ success: true });
            }
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

// POST /api/custom/set-password - Set password for Google OAuth users
router.post("/set-password", async (req, res) => {
    try {
        // Check authentication
        const session = await getSession(req);
        if (!session?.user) {
            return res.status(401).json({ error: "Unauthorized. Please log in first." });
        }

        const { password, confirmPassword } = req.body;
        const userId = session.user.id;
        const userEmail = session.user.email;

        console.log(`[AUTH] Set password request for user: ${userEmail}`);

        // Validate password
        if (!password || !confirmPassword) {
            return res.status(400).json({ error: "Password and confirm password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // Check if user can set password
        const { canSet, hasGoogleAccount, hasCredentialAccount } = await authService.canSetPassword(userId);

        if (!hasGoogleAccount) {
            return res.status(400).json({ 
                error: "This feature is only available for Google OAuth users" 
            });
        }

        if (hasCredentialAccount) {
            return res.status(400).json({ 
                error: "Password already set. Use forgot password to reset it." 
            });
        }

        if (!canSet) {
            return res.status(400).json({ error: "Cannot set password for this account" });
        }

        // Create credential account with password
        await authService.createCredentialAccountForGoogleUser(userId, userEmail, password);

        console.log(`[AUTH] Password set successfully for Google user: ${userEmail}`);
        res.json({ 
            success: true, 
            message: "Password set successfully. You can now login with email and password." 
        });
    } catch (error) {
        console.error(`[AUTH] Set password error:`, error);
        res.status(500).json({ error: "Failed to set password" });
    }
});

// GET /api/custom/can-set-password - Check if current user can set password
router.get("/can-set-password", async (req, res) => {
    try {
        const session = await getSession(req);
        if (!session?.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await authService.canSetPassword(session.user.id);
        res.json(result);
    } catch (error) {
        console.error(`[AUTH] Can set password check error:`, error);
        res.status(500).json({ error: "Failed to check password status" });
    }
});
