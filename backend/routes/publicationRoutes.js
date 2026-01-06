// routes/publicationRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { publication } from "../models/schema.js";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/publications");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
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
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Check if user has a publication
router.get("/check", async (req, res) => {
  try {
    // Get user from session (you'll need to add auth middleware)
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userPublication = await db
      .select()
      .from(publication)
      .where(eq(publication.userId, userId))
      .limit(1);

    res.json({ hasPublication: userPublication.length > 0 });
  } catch (error) {
    console.error("Error checking publication:", error);
    res.status(500).json({ error: "Failed to check publication" });
  }
});

// Get user's publication
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userPublication = await db
      .select()
      .from(publication)
      .where(eq(publication.userId, userId))
      .limit(1);

    if (userPublication.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json(userPublication[0]);
  } catch (error) {
    console.error("Error fetching publication:", error);
    res.status(500).json({ error: "Failed to fetch publication" });
  }
});

// Create publication
router.post("/", getCurrentUser, async (req, res) => {
  try {
    const { name, subdomain, description } = req.body;
    const userId = req.user.id;

    if (!name || !subdomain) {
      return res.status(400).json({ error: "Name and subdomain are required" });
    }

    // Check if user already has a publication
    const existingUserPub = await db
      .select()
      .from(publication)
      .where(eq(publication.userId, userId));

    if (existingUserPub.length > 0) {
      return res.status(400).json({ error: "User already has a publication" });
    }

    // Check if subdomain already exists
    const existing = await db
      .select()
      .from(publication)
      .where(eq(publication.subdomain, subdomain.toLowerCase()));

    if (existing.length > 0) {
      return res.status(400).json({ error: "Subdomain already taken" });
    }

    const newPublication = await db
      .insert(publication)
      .values({
        name,
        subdomain: subdomain.toLowerCase(),
        description: description || null,
        userId,
        logoUrl: null,
        faviconUrl: null,
        metaOgImageUrl: null,
      })
      .returning();

    res.status(201).json(newPublication[0]);
  } catch (error) {
    console.error("Error creating publication:", error);
    res.status(500).json({ error: "Failed to create publication" });
  }
});

// Update publication
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subdomain, description } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subdomain !== undefined) updateData.subdomain = subdomain.toLowerCase();
    if (description !== undefined) updateData.description = description;
    updateData.updatedAt = new Date();

    // Check if subdomain is being changed and if it's already taken
    if (subdomain) {
      const existing = await db
        .select()
        .from(publication)
        .where(eq(publication.subdomain, subdomain.toLowerCase()));

      if (existing.length > 0 && existing[0].id !== parseInt(id)) {
        return res.status(400).json({ error: "Subdomain already taken" });
      }
    }

    const updated = await db
      .update(publication)
      .set(updateData)
      .where(eq(publication.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating publication:", error);
    res.status(500).json({ error: "Failed to update publication" });
  }
});

// Upload logo
router.post("/:id/logo", upload.single("logo"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const logoUrl = `/uploads/publications/${req.file.filename}`;

    const updated = await db
      .update(publication)
      .set({ logoUrl, updatedAt: new Date() })
      .where(eq(publication.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json({ logoUrl, publication: updated[0] });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

// Upload favicon
router.post("/:id/favicon", upload.single("favicon"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const faviconUrl = `/uploads/publications/${req.file.filename}`;

    const updated = await db
      .update(publication)
      .set({ faviconUrl, updatedAt: new Date() })
      .where(eq(publication.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json({ faviconUrl, publication: updated[0] });
  } catch (error) {
    console.error("Error uploading favicon:", error);
    res.status(500).json({ error: "Failed to upload favicon" });
  }
});

// Upload meta OG image
router.post("/:id/meta-og", upload.single("metaOg"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const metaOgImageUrl = `/uploads/publications/${req.file.filename}`;

    const updated = await db
      .update(publication)
      .set({ metaOgImageUrl, updatedAt: new Date() })
      .where(eq(publication.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json({ metaOgImageUrl, publication: updated[0] });
  } catch (error) {
    console.error("Error uploading meta OG image:", error);
    res.status(500).json({ error: "Failed to upload meta OG image" });
  }
});

// Remove image (logo, favicon, or meta OG)
router.delete("/:id/image/:type", async (req, res) => {
  try {
    const { id, type } = req.params;

    const updateData = { updatedAt: new Date() };
    if (type === "logo") updateData.logoUrl = null;
    else if (type === "favicon") updateData.faviconUrl = null;
    else if (type === "meta-og") updateData.metaOgImageUrl = null;
    else return res.status(400).json({ error: "Invalid image type" });

    const updated = await db
      .update(publication)
      .set(updateData)
      .where(eq(publication.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error("Error removing image:", error);
    res.status(500).json({ error: "Failed to remove image" });
  }
});

export default router;
