// routes/profileRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../config/database.js";
import { user, account } from "../models/schema.js";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import logger from "../utils/logger.js";

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/avatars";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Middleware to get current user from session
const getCurrentUser = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    next();
  } catch (error) {
    logger.error(error, "Auth error:");
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// GET /api/profile - Get current user's profile
router.get("/", getCurrentUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userData] = await db.select().from(user).where(eq(user.id, userId));

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has a password account (not just social login)
    const [passwordAccount] = await db
      .select()
      .from(account)
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "credential")),
      );

    const hasPasswordAccount = !!passwordAccount;

    res.json({
      email: userData.email,
      name: userData.name,
      image: userData.image,
      profileName: userData.name,
      username: userData.username || "",
      bio: userData.bio || "",
      hasPasswordAccount,
    });
  } catch (error) {
    logger.error(error, "Error fetching profile:");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /api/profile - Update current user's profile
router.put("/", getCurrentUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileName, username, bio } = req.body;

    logger.info(
      `[PROFILE-UPDATE] Request received: ${JSON.stringify({ userId, profileName, username, bio })}`,
    );

    // Validate username format (alphanumeric and underscores only)
    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        error:
          "Username must be 3-20 characters, alphanumeric and underscores only",
      });
    }

    // Check if username is taken by another user
    if (username) {
      const [existingUser] = await db
        .select()
        .from(user)
        .where(and(eq(user.username, username), ne(user.id, userId)));

      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    // Build update object with only defined fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that have values or are explicitly being cleared
    if (profileName !== undefined && profileName !== null) {
      updateData.name = profileName;
    }
    if (username !== undefined && username !== null) {
      updateData.username = username;
    }
    if (bio !== undefined) {
      updateData.bio = bio;
    }

    logger.info(`[PROFILE-UPDATE] Update data: ${JSON.stringify(updateData)}`);

    // Update user profile
    await db.update(user).set(updateData).where(eq(user.id, userId));

    // Fetch updated user to verify
    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    logger.info(
      `[PROFILE-UPDATE] Updated user: ${JSON.stringify({
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
      })}`,
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    logger.error(error, "Error updating profile:");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/profile/image - Upload profile image
router.post(
  "/image",
  getCurrentUser,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const userId = req.user.id;
      const imageUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/${req.file.path.replace(/\\/g, "/")}`;

      // Get current user to delete old image
      const [userData] = await db
        .select()
        .from(user)
        .where(eq(user.id, userId));

      // Delete old image file if exists and is a local file
      if (userData?.image && userData.image.includes("/uploads/avatars/")) {
        const oldPath = userData.image.split("/uploads/avatars/")[1];
        const oldFilePath = `uploads/avatars/${oldPath}`;
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update user image in database
      await db
        .update(user)
        .set({
          image: imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      // Update the session with new image using better-auth
      try {
        // Better-auth automatically updates the session when user data changes
        // Just need to ensure the database is updated (which we did above)
        logger.info(`[Profile] Image updated for user ${userId}: ${imageUrl}`);
      } catch (sessionError) {
        logger.error(sessionError, "Failed to update session:");
        // Continue anyway as DB is updated
      }

      res.json({ success: true, imageUrl });
    } catch (error) {
      logger.error(error, "Error uploading image:");
      res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

// DELETE /api/profile/image - Remove profile image
router.delete("/image", getCurrentUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user to delete image file
    const [userData] = await db.select().from(user).where(eq(user.id, userId));

    // Delete image file if exists and is a local file
    if (userData?.image && userData.image.includes("/uploads/avatars/")) {
      const oldPath = userData.image.split("/uploads/avatars/")[1];
      const oldFilePath = `uploads/avatars/${oldPath}`;
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Remove image from database
    await db
      .update(user)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Update the session to remove image
    try {
      await auth.api.updateUser({
        userId: userId,
        image: null,
      } as any);
    } catch (sessionError) {
      logger.error(sessionError, "Failed to update session:");
      // Continue anyway as DB is updated
    }

    res.json({ success: true, message: "Image removed successfully" });
  } catch (error) {
    logger.error(error, "Error removing image:");
    res.status(500).json({ error: "Failed to remove image" });
  }
});

export default router;
