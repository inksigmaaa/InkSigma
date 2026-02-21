// routes/authRoutes.js
import express from "express";
import { authService } from "../services/authService.js";
import { emailService } from "../services/emailService.js";
import { auth } from "../config/betterAuth.js";
import { validate } from "../middleware/validate.js";
import * as authValidator from "../validators/authValidator.js";
import logger from "../utils/logger.js";

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
router.post(
  "/forgot-password",
  validate(authValidator.emailSchema),
  async (req, res) => {
    try {
      const { email, redirectTo } = req.body;
      logger.info(`[AUTH] Forgot password request for: ${email}`);

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await authService.findUserByEmail(email);

      if (!user) {
        // Security: Don't reveal if user exists
        logger.info(`[AUTH] User not found: ${email} (returning success)`);
        return res.json({ success: true });
      }

      const token = await authService.createResetToken(email);
      const resetUrl = `${redirectTo || "http://localhost:3000/reset-password"}?token=${token}&email=${encodeURIComponent(email)}`;

      await emailService.sendPasswordReset({
        email,
        name: user.name,
        resetUrl,
      });

      logger.info(`[AUTH] Password reset email sent to: ${email}`);
      res.json({ success: true });
    } catch (error) {
      logger.error(error, `[AUTH] Forgot password error:`);
      res.status(500).json({ error: "Failed to send reset email" });
    }
  },
);

// POST /api/custom/reset-password
router.post(
  "/reset-password",
  validate(authValidator.resetPasswordSchema),
  async (req, res) => {
    try {
      const { token, email, newPassword } = req.body;
      logger.info(`[AUTH] Reset password for: ${email}`);

      if (!token || !email || !newPassword) {
        return res
          .status(400)
          .json({ error: "Token, email, and new password are required" });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
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
          await authService.createCredentialAccountForGoogleUser(
            user.id,
            email,
            newPassword,
          );
          await authService.deleteToken(validToken.id);
          logger.info(
            `[AUTH] Password set for Google user via reset: ${email}`,
          );
          return res.json({ success: true });
        }
        return res.status(400).json({ error: "No password account found" });
      }

      await authService.updatePassword(credentialAccount.id, newPassword);
      await authService.deleteToken(validToken.id);

      logger.info(`[AUTH] Password reset successful for: ${email}`);
      res.json({ success: true });
    } catch (error) {
      logger.error(error, `[AUTH] Reset password error:`);
      res.status(500).json({ error: "Failed to reset password" });
    }
  },
);

// POST /api/custom/send-verification
router.post(
  "/send-verification",
  validate(authValidator.emailSchema),
  async (req, res) => {
    try {
      const { email, redirectTo } = req.body;
      logger.info(`[AUTH] Send verification for: ${email}`);

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

      logger.info(`[AUTH] Verification email sent to: ${email}`);
      res.json({ success: true });
    } catch (error) {
      logger.error(error, `[AUTH] Send verification error:`);
      res.status(500).json({ error: "Failed to send verification email" });
    }
  },
);

// POST /api/custom/verify-email
router.post(
  "/verify-email",
  validate(authValidator.verifyEmailSchema),
  async (req, res) => {
    try {
      const { token, email } = req.body;
      logger.info(`[AUTH] Verify email for: ${email}`);

      const validToken = await authService.validateVerificationToken(
        email,
        token,
      );
      if (!validToken) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      await authService.verifyUserEmail(email);
      await authService.deleteToken(validToken.id);

      logger.info(`[AUTH] Email verified for: ${email}`);
      res.json({ success: true });
    } catch (error) {
      logger.error(error, `[AUTH] Verify email error:`);
      res.status(500).json({ error: "Failed to verify email" });
    }
  },
);

// GET /api/custom/redis-health - Check Redis connection
router.get("/redis-health", async (req, res) => {
  try {
    const { getRedisClient } = await import("../config/redis.js");
    const client = getRedisClient();

    // Test Redis connection
    const testKey = `health-check:${Date.now()}`;
    await client.set(testKey, "OK", "EX"); // Expires in 10 seconds
    const result = await client.get(testKey);
    await client.del(testKey);

    if (result === "OK") {
      res.json({
        status: "healthy",
        redis: "connected",
        message: "Redis is working properly",
      });
    } else {
      res.status(500).json({
        status: "unhealthy",
        redis: "error",
        message: "Redis test failed",
      });
    }
  } catch (error) {
    logger.error(error, "[REDIS-HEALTH] Error:");
    res.status(500).json({
      status: "unhealthy",
      redis: "disconnected",
      error: error.message,
    });
  }
});

// POST /api/custom/check-email
router.post(
  "/check-email",
  validate(authValidator.emailSchema),
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await authService.findUserByEmail(email);

      // Return clear status
      res.json({
        exists: !!user,
        emailVerified: user ? user.emailVerified : false,
      });
    } catch (error) {
      logger.error(error, `[AUTH] Check email error:`);
      res.status(500).json({ error: "Failed to check email" });
    }
  },
);

export default router;

// POST /api/custom/set-password - Set password for Google OAuth users
router.post(
  "/set-password",
  validate(authValidator.setPasswordSchema),
  async (req, res) => {
    try {
      // Check authentication
      const session = await getSession(req);
      if (!session?.user) {
        return res
          .status(401)
          .json({ error: "Unauthorized. Please log in first." });
      }

      const { password, confirmPassword } = req.body;
      const userId = session.user.id;
      const userEmail = session.user.email;

      logger.info(`[AUTH] Set password request for user: ${userEmail}`);

      // Validate password
      if (!password || !confirmPassword) {
        return res
          .status(400)
          .json({ error: "Password and confirm password are required" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      // Check if user can set password
      const { canSet, hasGoogleAccount, hasCredentialAccount } =
        await authService.canSetPassword(userId);

      if (!hasGoogleAccount) {
        return res.status(400).json({
          error: "This feature is only available for Google OAuth users",
        });
      }

      if (hasCredentialAccount) {
        return res.status(400).json({
          error: "Password already set. Use forgot password to reset it.",
        });
      }

      if (!canSet) {
        return res
          .status(400)
          .json({ error: "Cannot set password for this account" });
      }

      // Create credential account with password
      await authService.createCredentialAccountForGoogleUser(
        userId,
        userEmail,
        password,
      );

      logger.info(
        `[AUTH] Password set successfully for Google user: ${userEmail}`,
      );
      res.json({
        success: true,
        message:
          "Password set successfully. You can now login with email and password.",
      });
    } catch (error) {
      logger.error(error, `[AUTH] Set password error:`);
      res.status(500).json({ error: "Failed to set password" });
    }
  },
);

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
    logger.error(error, `[AUTH] Can set password check error:`);
    res.status(500).json({ error: "Failed to check password status" });
  }
});
