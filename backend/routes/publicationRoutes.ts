// routes/publicationRoutes.js
import express from "express";
import { db } from "../config/database.js";
import {
  publication,
  publicationMember,
  blog,
  user,
} from "../models/schema.js";
import { eq, and, or, count } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { auth } from "../config/betterAuth.js";
import { redactEmail, redactUserId } from "../utils/redactPII.js";
import { fromNodeHeaders } from "better-auth/node";
// NOTE: Domain validation logic moved to frontend (src/utils/subdomainRules.js, src/utils/domainValidation.js)
// Backend now only checks database availability and handles data persistence
import {
  invalidatePublicationCache,
  resolvePublicationBySubdomain,
} from "../services/publicationResolver.js";
import { validate } from "../middleware/validate.js";
import * as publicationValidator from "../validators/publicationValidator.js";
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";

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
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/svg": ".svg",
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
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
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
    logger.info(`[getCurrentUser] Checking authentication... ${req.method}`);
    logger.info("[getCurrentUser] Request method:");
    logger.info(`[getCurrentUser] Request path: ${req.path}`);
    logger.info(
      `[getCurrentUser] Request headers: ${JSON.stringify({
        cookie: req.headers.cookie ? "present" : "missing",
        authorization: req.headers.authorization ? "present" : "missing",
        origin: req.headers.origin,
        referer: req.headers.referer,
        "content-type": req.headers["content-type"],
      })}`,
    );

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    logger.info(
      `[getCurrentUser] Session result: ${session ? "found" : "not found"}`,
    );
    if (session?.user) {
      logger.info(`[getCurrentUser] User ID: ${redactUserId(session.user.id)}`);
      logger.info(`[getCurrentUser] User email: ${redactEmail(session.user.email)}`);
    }

    if (!session?.user) {
      logger.info("[getCurrentUser] Unauthorized - no session or user");
      return res.status(401).json({ error: "Unauthorized - Please log in" });
    }

    req.user = session.user;
    logger.info(
      `[getCurrentUser] Authentication successful for user: ${redactUserId(req.user.id)}`,
    );
    next();
  } catch (error) {
    logger.error(error, "[getCurrentUser] Auth error:");
    logger.error(error.message, "[getCurrentUser] Error message:");
    logger.error(error.stack, "[getCurrentUser] Error stack:");
    return res.status(401).json({
      error: "Unauthorized - Authentication failed",
      details: error.message,
    });
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
    logger.error(error, "Error checking publication:");
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
      name: req.user?.name,
    });
  } catch (error) {
    logger.error(error, "Error in test-auth:");
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
    logger.error(error, "Error in auth check:");
    res.status(500).json({ error: "Failed to check authentication" });
  }
});

// Check subdomain availability
router.get(
  "/check-subdomain/:subdomain",
  validate(publicationValidator.bySubdomainSchema),
  async (req, res) => {
    try {
      const { subdomain } = req.params;

      if (!subdomain || subdomain.length < 3) {
        return res.status(400).json({ error: "Invalid subdomain" });
      }

      // Only check database availability - frontend handles format/reserved validation
      const existing = await db
        .select()
        .from(publication)
        .where(eq(publication.subdomain, subdomain.toLowerCase()))
        .limit(1);

      res.json({ available: existing.length === 0 });
    } catch (error) {
      logger.error(error, "Error checking subdomain:");
      res.status(500).json({ error: "Failed to check subdomain" });
    }
  },
);

// Get publication by subdomain
router.get(
  "/by-subdomain/:subdomain",
  validate(publicationValidator.bySubdomainSchema),
  async (req, res) => {
    try {
      const { subdomain } = req.params;

      if (!subdomain) {
        return res.status(400).json({ error: "Subdomain is required" });
      }

      const publication = await resolvePublicationBySubdomain(subdomain);

      if (!publication) {
        return res.status(404).json({ error: "Publication not found" });
      }

      res.json(publication);
    } catch (error) {
      logger.error(error, "Error fetching publication by subdomain:");
      res.status(500).json({ error: "Failed to fetch publication" });
    }
  },
);

// Resolve publication by current host
router.get("/resolve", async (req, res) => {
  try {
    const tenant = req.tenant || {};
    if (!tenant.publication) {
      return res.status(404).json({ error: "Publication not found" });
    }

    return res.json({
      publication: tenant.publication,
      tenant: {
        host: tenant.host,
        subdomain: tenant.subdomain,
        isCustomDomain: tenant.isCustomDomain,
        isDashboard: tenant.isDashboard,
        type: tenant.type,
      },
    });
  } catch (error) {
    logger.error(error, "Error resolving publication:");
    res.status(500).json({ error: "Failed to resolve publication" });
  }
});

// Get user's publication
router.get(
  "/user/:userId",
  validate(publicationValidator.byUserIdSchema),
  async (req, res) => {
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
      logger.error(error, "Error fetching publication:");
      res.status(500).json({ error: "Failed to fetch publication" });
    }
  },
);

// Get publication by ID
router.get(
  "/:id",
  validate(publicationValidator.byIdSchema),
  async (req, res) => {
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
      logger.error(error, "Error fetching publication:");
      res.status(500).json({ error: "Failed to fetch publication" });
    }
  },
);

// Get publication details with stats (for members)
// Get publication details
router.get(
  "/:publicationId/details",
  getCurrentUser,
  validate(publicationValidator.byPublicationIdSchema),
  async (req, res) => {
    try {
      const { publicationId } = req.params;
      const userId = req.user.id;

      logger.info(
        `Publication details request: publicationId=${publicationId}, userId=${userId}`,
      );

      // Get publication
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(publicationId)));

      if (!pub) {
        logger.info(`Publication not found: ${publicationId}`);
        return res.status(404).json({ error: "Publication not found" });
      }

      logger.info(`Publication found:`);

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
              eq(publicationMember.userId, userId),
            ),
          );

        if (member) {
          isMember = true;
          userRole = member.role;
          logger.info(`User is member with role: ${userRole}`);
        } else {
          logger.info(`User is not a member of this publication`);
        }
      } else {
        userRole = "admin";
        logger.info(`User is owner/admin`);
      }

      if (!isOwner && !isMember) {
        logger.info(
          `Access denied for user ${userId} to publication ${publicationId}`,
        );
        return res.status(403).json({ error: "Access denied" });
      }

      // Get member count
      const members = await db
        .select()
        .from(publicationMember)
        .where(eq(publicationMember.publicationId, parseInt(publicationId)));

      const memberCount = members.length;

      // Get all member IDs including owner
      const memberIds = [pub.userId, ...members.map((m) => m.userId)];

      // Get post count from all members using SQL COUNT (much faster than fetching all posts)
      let postCount = 0;
      let publishedCount = 0;

      if (memberIds.length > 0) {
        // Use SQL COUNT for total posts
        const postCountResult = await db
          .select({ count: count() })
          .from(blog)
          .where(or(...memberIds.map((id) => eq(blog.authorId, id))));
        postCount = postCountResult[0]?.count || 0;

        // Use SQL COUNT for published posts only
        const publishedCountResult = await db
          .select({ count: count() })
          .from(blog)
          .where(
            and(
              or(...memberIds.map((id) => eq(blog.authorId, id))),
              eq(blog.status, BLOG_STATUS.PUBLISHED),
            ),
          );
        publishedCount = publishedCountResult[0]?.count || 0;
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

      logger.info(`Publication details response:`);
      res.json(response);
    } catch (error) {
      logger.error(error, "Error fetching publication details:");
      res.status(500).json({ error: "Failed to fetch publication details" });
    }
  },
);

// Create publication
// Create publication
router.post(
  "/",
  getCurrentUser,
  validate(publicationValidator.createPublicationSchema),
  async (req, res) => {
    try {
      const { name, subdomain, description, customDomain } = req.body;

      logger.info(`Create publication request received: ${subdomain}`);
      logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
      logger.info(`User: ${JSON.stringify(req.user, null, 2)}`);
      logger.info(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
      const userId = req.user?.id;

      if (!userId) {
        logger.info("Validation failed: no user ID");
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!name || !subdomain) {
        logger.info("Validation failed: missing name or subdomain");
        return res
          .status(400)
          .json({ error: "Name and subdomain are required" });
      }

      logger.info("Checking for existing user publication...");
      // Check if user already has a publication
      const existingUserPub = await db
        .select()
        .from(publication)
        .where(eq(publication.userId, userId));

      if (existingUserPub.length > 0) {
        logger.info(
          `User already has a publication: ${JSON.stringify(existingUserPub[0])}`,
        );
        return res
          .status(400)
          .json({ error: "User already has a publication" });
      }

      logger.info("Checking if subdomain is available...");
      // Check if subdomain already exists in database
      // Frontend handles format and reserved subdomain validation
      const existing = await db
        .select()
        .from(publication)
        .where(eq(publication.subdomain, subdomain.toLowerCase()));

      if (existing.length > 0) {
        logger.info("Subdomain already taken:");
        return res.status(400).json({ error: "Subdomain already taken" });
      }

      // Check custom domain availability if provided
      let normalizedCustomDomain = null;
      if (customDomain) {
        normalizedCustomDomain = String(customDomain).trim().toLowerCase();
        const existingCustom = await db
          .select()
          .from(publication)
          .where(eq(publication.customDomain, normalizedCustomDomain));

        if (existingCustom.length > 0) {
          return res.status(400).json({ error: "Custom domain already taken" });
        }
      }

      logger.info("Creating publication in transaction...");
      // Create publication and add creator as admin member in a transaction
      const result = await db.transaction(async (tx) => {
        try {
          // Create the publication
          logger.info(
            `Inserting publication with data: ${JSON.stringify({
              name,
              subdomain: subdomain.toLowerCase(),
              userId,
            })}`,
          );
          const [newPublication] = await tx
            .insert(publication)
            .values({
              name,
              subdomain: subdomain.toLowerCase(),
              customDomain: normalizedCustomDomain,
              description: description || null,
              userId,
              logoUrl: null,
              faviconUrl: null,
              metaOgImageUrl: null,
            })
            .returning();

          logger.info("Publication created:");

          // Add creator as admin member
          logger.info(
            `Adding admin member: ${JSON.stringify({
              publicationId: newPublication.id,
              userId,
            })}`,
          );
          await tx.insert(publicationMember).values({
            publicationId: newPublication.id,
            userId: userId,
            role: "admin",
          });

          logger.info(
            `Admin member added for publication: ${newPublication.id}`,
          );

          return newPublication;
        } catch (txError) {
          logger.error(txError, "Transaction error:");
          logger.error(txError, "Transaction error details:");
          throw txError;
        }
      });

      logger.info(`Publication creation successful: ${result.id}`);
      await invalidatePublicationCache({
        subdomain: result.subdomain,
        customDomain: result.customDomain,
      });
      return res.status(201).json(result);
    } catch (error) {
      logger.error(error, "Error creating publication:");
      logger.error(error.stack, "Error stack:");
      logger.error(error, "Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        name: error.name,
      });

      // Provide more specific error messages based on error type
      let statusCode = 500;
      let errorMessage = "Failed to create publication";

      if (error.code === "23505") {
        // Unique constraint violation
        if (error.detail && error.detail.includes("subdomain")) {
          errorMessage = "Subdomain already taken";
          statusCode = 400;
        } else if (error.detail && error.detail.includes("userId")) {
          errorMessage = "User already has a publication";
          statusCode = 400;
        }
      } else if (error.code === "23503") {
        // Foreign key constraint violation
        errorMessage = "Invalid user ID or publication reference";
        statusCode = 400;
      }

      // Ensure we always return a JSON response
      if (!res.headersSent) {
        res.status(statusCode).json({
          error: errorMessage,
          details: error.message,
          code: error.code,
        });
      }
    }
  },
);

// Update publication
router.put(
  "/:id",
  validate(publicationValidator.updatePublicationSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, subdomain, description, customDomain } = req.body;

      // Validate description length (max 100 characters)
      if (description && description.length > 100) {
        return res
          .status(400)
          .json({ error: "Description must not exceed 100 characters" });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (subdomain !== undefined)
        updateData.subdomain = subdomain.toLowerCase();
      if (customDomain !== undefined) {
        updateData.customDomain =
          customDomain === null || customDomain === ""
            ? null
            : String(customDomain).trim().toLowerCase();
      }
      if (description !== undefined) updateData.description = description;
      updateData.updatedAt = new Date();

      // Check if subdomain is being changed and if it's already taken
      // Frontend handles format and reserved subdomain validation
      if (subdomain) {
        const existing = await db
          .select()
          .from(publication)
          .where(eq(publication.subdomain, subdomain.toLowerCase()));

        if (existing.length > 0 && existing[0].id !== parseInt(id)) {
          return res.status(400).json({ error: "Subdomain already taken" });
        }
      }

      // Check custom domain availability if being changed
      if (customDomain) {
        const normalizedCustomDomain = String(customDomain)
          .trim()
          .toLowerCase();
        const existingCustom = await db
          .select()
          .from(publication)
          .where(eq(publication.customDomain, normalizedCustomDomain));
        if (
          existingCustom.length > 0 &&
          existingCustom[0].id !== parseInt(id)
        ) {
          return res.status(400).json({ error: "Custom domain already taken" });
        }
      }

      const [currentPublication] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(id)))
        .limit(1);

      const updated = await db
        .update(publication)
        .set(updateData)
        .where(eq(publication.id, parseInt(id)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      await invalidatePublicationCache({
        subdomain: currentPublication?.subdomain,
        customDomain: currentPublication?.customDomain,
      });
      await invalidatePublicationCache({
        subdomain: updated[0].subdomain,
        customDomain: updated[0].customDomain,
      });

      res.json(updated[0]);
    } catch (error) {
      logger.error("Error updating publication:");
      res.status(500).json({ error: "Failed to update publication" });
    }
  },
);

// Upload logo
router.post(
  "/:id/logo",
  validate(publicationValidator.byIdSchema),
  upload.single("logo"),
  async (req, res) => {
    try {
      const { id } = req.params;

      logger.info("Logo upload request for publication:");
      logger.info(`File received: ${req.file?.originalname}`);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const logoUrl = `/uploads/publications/${req.file.filename}`;
      logger.info(`Logo URL to save: ${logoUrl}`);

      const updated = await db
        .update(publication)
        .set({ logoUrl, updatedAt: new Date() })
        .where(eq(publication.id, parseInt(id as string)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      logger.info(
        `Publication updated with logo: ${JSON.stringify(updated[0])}`,
      );

      res.json({ logoUrl, publication: updated[0] });
    } catch (error) {
      logger.error(error, "Error uploading logo:");
      res.status(500).json({ error: "Failed to upload logo" });
    }
  },
);

// Upload favicon
router.post(
  "/:id/favicon",
  validate(publicationValidator.byIdSchema),
  upload.single("favicon"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const faviconUrl = `/uploads/publications/${req.file.filename}`;

      const updated = await db
        .update(publication)
        .set({ faviconUrl, updatedAt: new Date() })
        .where(eq(publication.id, parseInt(id as string)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      res.json({ faviconUrl, publication: updated[0] });
    } catch (error) {
      logger.error(error, "Error uploading favicon:");
      res.status(500).json({ error: "Failed to upload favicon" });
    }
  },
);

// Upload meta OG image
router.post(
  "/:id/meta-og",
  validate(publicationValidator.byIdSchema),
  upload.single("metaOg"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const metaOgImageUrl = `/uploads/publications/${req.file.filename}`;

      const updated = await db
        .update(publication)
        .set({ metaOgImageUrl, updatedAt: new Date() })
        .where(eq(publication.id, parseInt(id as string)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      res.json({ metaOgImageUrl, publication: updated[0] });
    } catch (error) {
      logger.error(error, "Error uploading meta OG image:");
      res.status(500).json({ error: "Failed to upload meta OG image" });
    }
  },
);

// Remove image (logo, favicon, or meta OG)
router.delete(
  "/:id/image/:type",
  validate(publicationValidator.deleteImageSchema),
  async (req, res) => {
    try {
      const { id, type } = req.params;

      const updateData: any = { updatedAt: new Date() };
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
      logger.error(error, "Error removing image:");
      res.status(500).json({ error: "Failed to remove image" });
    }
  },
);

export default router;
