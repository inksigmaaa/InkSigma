// routes/publicationRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { publication, publicationMember, blog, user } from "../models/schema.js";
import { eq, and, or } from "drizzle-orm";
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
    
    // Map MIME types to proper file extensions
    const extensionMap = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/svg': '.svg'
    };
    
    // Get extension from MIME type or fall back to original extension
    const ext = extensionMap[file.mimetype] || path.extname(file.originalname);
    
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
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
    console.log("[getCurrentUser] Checking authentication...");
    console.log("[getCurrentUser] Request method:", req.method);
    console.log("[getCurrentUser] Request path:", req.path);
    console.log("[getCurrentUser] Request headers:", JSON.stringify({
      cookie: req.headers.cookie ? "present" : "missing",
      authorization: req.headers.authorization ? "present" : "missing",
      origin: req.headers.origin,
      referer: req.headers.referer,
      'content-type': req.headers['content-type']
    }));
    
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    console.log("[getCurrentUser] Session result:", session ? "found" : "not found");
    if (session?.user) {
      console.log("[getCurrentUser] User ID:", session.user.id);
      console.log("[getCurrentUser] User email:", session.user.email);
    }

    if (!session?.user) {
      console.log("[getCurrentUser] Unauthorized - no session or user");
      return res.status(401).json({ error: "Unauthorized - Please log in" });
    }

    req.user = session.user;
    console.log("[getCurrentUser] Authentication successful for user:", req.user.id);
    next();
  } catch (error) {
    console.error("[getCurrentUser] Auth error:", error);
    console.error("[getCurrentUser] Error message:", error.message);
    console.error("[getCurrentUser] Error stack:", error.stack);
    return res.status(401).json({ error: "Unauthorized - Authentication failed", details: error.message });
  }
};

// Check if user has a publication
router.get("/check", getCurrentUser, async (req, res) => {
  try {
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

// Test endpoint to verify authentication
router.get("/test-auth", getCurrentUser, async (req, res) => {
  try {
    res.json({ 
      authenticated: true, 
      userId: req.user?.id,
      email: req.user?.email,
      name: req.user?.name
    });
  } catch (error) {
    console.error("Error in test-auth:", error);
    res.status(500).json({ error: "Test failed" });
  }
});

// Diagnostic endpoint to check authentication
router.get("/debug/auth-check", getCurrentUser, async (req, res) => {
  try {
    res.json({
      authenticated: true,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in auth check:", error);
    res.status(500).json({ error: "Failed to check authentication" });
  }
});

// Check subdomain availability
router.get("/check-subdomain/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    if (!subdomain || subdomain.length < 3) {
      return res.status(400).json({ error: "Invalid subdomain" });
    }

    const existing = await db
      .select()
      .from(publication)
      .where(eq(publication.subdomain, subdomain.toLowerCase()))
      .limit(1);

    res.json({ available: existing.length === 0 });
  } catch (error) {
    console.error("Error checking subdomain:", error);
    res.status(500).json({ error: "Failed to check subdomain" });
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

// Get publication by ID (public endpoint for view-site)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(id)));

    if (!pub) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json(pub);
  } catch (error) {
    console.error("Error fetching publication:", error);
    res.status(500).json({ error: "Failed to fetch publication" });
  }
});

// Get publication details with stats (for members)
router.get("/:publicationId/details", getCurrentUser, async (req, res) => {
  try {
    const { publicationId } = req.params;
    const userId = req.user.id;

    console.log(`Publication details request: publicationId=${publicationId}, userId=${userId}`);

    // Get publication
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      console.log(`Publication not found: ${publicationId}`);
      return res.status(404).json({ error: "Publication not found" });
    }

    console.log(`Publication found:`, pub);

    // Check if user is owner or member
    const isOwner = pub.userId === userId;
    
    let userRole = null;
    let isMember = false;
    
    if (!isOwner) {
      const [member] = await db
        .select()
        .from(publicationMember)
        .where(
          and(
            eq(publicationMember.publicationId, parseInt(publicationId)),
            eq(publicationMember.userId, userId)
          )
        );
      
      if (member) {
        isMember = true;
        userRole = member.role;
        console.log(`User is member with role: ${userRole}`);
      } else {
        console.log(`User is not a member of this publication`);
      }
    } else {
      userRole = "admin";
      console.log(`User is owner/admin`);
    }

    if (!isOwner && !isMember) {
      console.log(`Access denied for user ${userId} to publication ${publicationId}`);
      return res.status(403).json({ error: "Access denied" });
    }

    // Get member count
    const members = await db
      .select()
      .from(publicationMember)
      .where(eq(publicationMember.publicationId, parseInt(publicationId)));

    const memberCount = members.length;

    // Get all member IDs including owner
    const memberIds = [pub.userId, ...members.map(m => m.userId)];

    // Get post count from all members - handle case where there are no members
    let postCount = 0;
    let publishedCount = 0;
    
    if (memberIds.length > 0) {
      const posts = await db
        .select()
        .from(blog)
        .where(or(...memberIds.map(id => eq(blog.authorId, id))));

      postCount = posts.length;
      publishedCount = posts.filter(p => p.status === 'published').length;
    }

    // Get owner info
    const [owner] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, pub.userId));

    const response = {
      ...pub,
      isOwner,
      userRole,
      memberCount,
      postCount,
      publishedCount,
      owner,
    };

    console.log(`Publication details response:`, response);
    res.json(response);
  } catch (error) {
    console.error("Error fetching publication details:", error);
    res.status(500).json({ error: "Failed to fetch publication details" });
  }
});

// Create publication
router.post("/", getCurrentUser, async (req, res) => {
  try {
    console.log("Create publication request received");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", JSON.stringify(req.user, null, 2));
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    
    const { name, subdomain, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      console.log("Validation failed: no user ID");
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!name || !subdomain) {
      console.log("Validation failed: missing name or subdomain");
      return res.status(400).json({ error: "Name and subdomain are required" });
    }

    // Validate publication name length
    if (name.length < 2 || name.length > 50) {
      console.log("Validation failed: invalid name length");
      return res.status(400).json({ error: "Publication name must be between 2 and 50 characters" });
    }

    // Validate subdomain length
    if (subdomain.length < 3 || subdomain.length > 63) {
      console.log("Validation failed: invalid subdomain length");
      return res.status(400).json({ error: "Subdomain must be between 3 and 63 characters" });
    }

    // Validate subdomain format (alphanumeric and hyphens only, no consecutive hyphens, no leading/trailing hyphens)
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(subdomain)) {
      console.log("Validation failed: invalid subdomain format");
      return res.status(400).json({ error: "Subdomain can only contain letters, numbers, and hyphens. Cannot start or end with hyphens or contain consecutive hyphens." });
    }

    // Validate description length (max 100 characters)
    if (description && description.length > 100) {
      console.log("Validation failed: description too long");
      return res.status(400).json({ error: "Description must not exceed 100 characters" });
    }

    console.log("Checking for existing user publication...");
    // Check if user already has a publication
    const existingUserPub = await db
      .select()
      .from(publication)
      .where(eq(publication.userId, userId));

    if (existingUserPub.length > 0) {
      console.log("User already has a publication:", existingUserPub[0]);
      return res.status(400).json({ error: "User already has a publication" });
    }

    console.log("Checking if subdomain is available...");
    // Check if subdomain already exists
    const existing = await db
      .select()
      .from(publication)
      .where(eq(publication.subdomain, subdomain.toLowerCase()));

    if (existing.length > 0) {
      console.log("Subdomain already taken:", subdomain);
      return res.status(400).json({ error: "Subdomain already taken" });
    }

    console.log("Creating publication in transaction...");
    // Create publication and add creator as admin member in a transaction
    const result = await db.transaction(async (tx) => {
      try {
        // Create the publication
        console.log("Inserting publication with data:", { name, subdomain: subdomain.toLowerCase(), userId });
        const [newPublication] = await tx
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

        console.log("Publication created:", newPublication);

        // Add creator as admin member
        console.log("Adding admin member:", { publicationId: newPublication.id, userId });
        await tx
          .insert(publicationMember)
          .values({
            publicationId: newPublication.id,
            userId: userId,
            role: "admin",
          });

        console.log("Admin member added for publication:", newPublication.id);

        return newPublication;
      } catch (txError) {
        console.error("Transaction error:", txError);
        console.error("Transaction error details:", {
          message: txError.message,
          code: txError.code,
          detail: txError.detail,
          name: txError.name,
        });
        throw txError;
      }
    });

    console.log("Publication creation successful:", result);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating publication:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      name: error.name,
    });
    
    // Provide more specific error messages based on error type
    let statusCode = 500;
    let errorMessage = "Failed to create publication";
    
    if (error.code === '23505') {
      // Unique constraint violation
      if (error.detail && error.detail.includes('subdomain')) {
        errorMessage = "Subdomain already taken";
        statusCode = 400;
      } else if (error.detail && error.detail.includes('userId')) {
        errorMessage = "User already has a publication";
        statusCode = 400;
      }
    } else if (error.code === '23503') {
      // Foreign key constraint violation
      errorMessage = "Invalid user ID or publication reference";
      statusCode = 400;
    }
    
    // Ensure we always return a JSON response
    if (!res.headersSent) {
      res.status(statusCode).json({ 
        error: errorMessage, 
        details: error.message,
        code: error.code 
      });
    }
  }
});

// Update publication
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subdomain, description } = req.body;

    // Validate description length (max 100 characters)
    if (description && description.length > 100) {
      return res.status(400).json({ error: "Description must not exceed 100 characters" });
    }

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

    console.log('Logo upload request for publication:', id);
    console.log('File received:', req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const logoUrl = `/uploads/publications/${req.file.filename}`;
    console.log('Logo URL to save:', logoUrl);

    const updated = await db
      .update(publication)
      .set({ logoUrl, updatedAt: new Date() })
      .where(eq(publication.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    console.log('Publication updated with logo:', updated[0]);

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
