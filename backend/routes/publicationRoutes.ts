// routes/publicationRoutes.js
import express from "express";
import { db } from "../config/database.js";
import {
  publication,
  publicationMember,
  blog,
  user,
} from "../models/schema.js";
import { eq, and, count, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
// NOTE: Domain validation logic moved to frontend (src/utils/subdomainRules.js, src/utils/domainValidation.js)
// Backend now only checks database availability and handles data persistence
import {
  invalidatePublicationCache,
  resolvePublicationBySubdomain,
  resolvePublicationByCustomDomain,
} from "../services/publicationResolver.js";
import {
  assertPublicationHostnamesAvailable,
  isPublicationHostnameAvailable,
  syncPublicationHostnames,
  PUBLICATION_HOSTNAME_KIND,
} from "../services/publicationHostnameService.js";
import {
  attachCustomDomainToHostingProvider,
  buildCustomDomainLifecycleFields,
  buildCustomDomainSetupPlanWithProvider,
  verifyCustomDomainLifecycle,
  validateCustomDomainInput,
  normalizeCustomDomainValue,
  CUSTOM_DOMAIN_STATUS,
} from "../services/customDomainService.js";
import {
  isVercelDomainError,
  removeVercelProjectDomain,
} from "../services/vercelDomainService.js";
import { requirePublicationRole } from "../middleware/authorization.js";
import { validate } from "../middleware/validate.js";
import * as publicationValidator from "../validators/publicationValidator.js";
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";
import {
  createMulterUpload,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  isCloudinaryUrl,
  CLOUDINARY_FOLDERS,
} from "../utils/cloudinary.js";

const router = express.Router();

const upload = createMulterUpload(5 * 1024 * 1024); // 5MB limit

// Check if user has a publication
router.get("/check", requireAuth, async (req, res) => {
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
router.get("/test-auth", requireAuth, async (req, res) => {
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
router.get("/debug/auth-check", requireAuth, async (req, res) => {
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

      const availableInHistory = await isPublicationHostnameAvailable(db, {
        kind: PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
        value: subdomain,
      });

      res.json({ available: existing.length === 0 && availableInHistory });
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

// Get publication by custom domain
router.get(
  "/by-custom-domain/:domain",
  async (req, res) => {
    try {
      const { domain } = req.params;

      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      const validation = validateCustomDomainInput(domain);
      if (validation.valid === false) {
        return res.status(400).json({ error: validation.error });
      }

      const normalizedDomain = validation.normalizedDomain;
      const publication = await resolvePublicationByCustomDomain(normalizedDomain);

      if (!publication) {
        return res.status(404).json({ error: "Publication not found" });
      }

      res.json(publication);
    } catch (error) {
      logger.error(error, "Error fetching publication by custom domain:");
      res.status(500).json({ error: "Failed to fetch publication" });
    }
  },
);

// Verify custom domain configuration
router.get(
  "/verify-domain/:domain",
  async (req, res) => {
    try {
      const { domain } = req.params;

      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      const validation = validateCustomDomainInput(domain);
      if (validation.valid === false) {
        return res.status(400).json({ error: validation.error });
      }

      const normalizedDomain = validation.normalizedDomain;
      const publication = await resolvePublicationByCustomDomain(normalizedDomain);

      if (!publication) {
        return res.json({
          verified: false,
          message: "No publication found for this domain",
        });
      }

      res.json({
        verified: true,
        publicationId: publication.id,
        publicationName: publication.name,
        customDomain: publication.customDomain,
      });
    } catch (error) {
      logger.error(error, "Error verifying domain:");
      res.status(500).json({ error: "Failed to verify domain" });
    }
  },
);

router.get(
  "/:id/custom-domain/setup-plan",
  requireAuth,
  validate(publicationValidator.customDomainSetupPlanSchema),
  requirePublicationRole(["admin"], { publicationIdParam: "id" }),
  async (req, res) => {
    try {
      const publicationId = parseInt(req.params.id, 10);
      const requestedDomain =
        typeof req.query.domain === "string" ? req.query.domain : undefined;

      const [currentPublication] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, publicationId))
        .limit(1);

      if (!currentPublication) {
        return res.status(404).json({ error: "Publication not found" });
      }

      const targetDomain = requestedDomain || currentPublication.customDomain;
      if (!targetDomain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      const plan = await buildCustomDomainSetupPlanWithProvider(targetDomain);
      return res.json({
        publicationId,
        customDomain: currentPublication.customDomain,
        customDomainStatus: currentPublication.customDomainStatus,
        ...plan,
      });
    } catch (error: any) {
      logger.error(error, "Error building custom domain setup plan:");
      if (isVercelDomainError(error)) {
        return res
          .status(error.statusCode && error.statusCode < 500 ? 400 : 502)
          .json({
            error: error.message || "Failed to load Vercel DNS setup plan",
            code: error.code,
          });
      }

      return res.status(400).json({
        error: error?.message || "Failed to build custom domain setup plan",
      });
    }
  },
);

router.get("/resolve-host", async (req, res) => {
  try {
    const rawHost =
      typeof req.query.host === "string" ? req.query.host : String(req.query.host || "");
    const rawSubdomain =
      typeof req.query.subdomain === "string"
        ? req.query.subdomain.trim().toLowerCase()
        : "";
    const rawCustomDomain =
      typeof req.query.customDomain === "string"
        ? req.query.customDomain.trim().toLowerCase()
        : "";
    const rawPublicationId =
      typeof req.query.publicationId === "string"
        ? Number.parseInt(req.query.publicationId, 10)
        : Number.parseInt(String(req.query.publicationId || ""), 10);

    if (!rawHost && !rawSubdomain && !rawCustomDomain && !Number.isFinite(rawPublicationId)) {
      return res.status(400).json({ error: "Host or publication identifier is required" });
    }

    const { resolvePublicationRoutingByHost } = await import(
      "../services/publicationResolver.js"
    );
    const routing = rawHost
      ? await resolvePublicationRoutingByHost(rawHost)
      : {
          host: "",
          publication: null,
          matchedHostname: null,
          canonicalHost: null,
          shouldRedirect: false,
          type: "root",
        };

    let resolvedPublication = routing.publication || null;

    if (!resolvedPublication && rawCustomDomain) {
      resolvedPublication = await resolvePublicationByCustomDomain(rawCustomDomain);
    }

    if (!resolvedPublication && rawSubdomain) {
      resolvedPublication = await resolvePublicationBySubdomain(rawSubdomain);
    }

    if (!resolvedPublication && Number.isFinite(rawPublicationId)) {
      const [publicationById] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, rawPublicationId))
        .limit(1);
      resolvedPublication = publicationById || null;
    }

    return res.json({
      ...routing,
      publication: resolvedPublication,
      hostContext: {
        subdomain: rawSubdomain || resolvedPublication?.subdomain || null,
        customDomain:
          rawCustomDomain ||
          (routing.type === "custom-domain" ? routing.host : null) ||
          null,
      },
      publicationId:
        resolvedPublication?.id ||
        (Number.isFinite(rawPublicationId) ? rawPublicationId : null),
    });
  } catch (error) {
    logger.error(error, "Error resolving host routing:");
    return res.status(500).json({ error: "Failed to resolve host routing" });
  }
});

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
  requireAuth,
  validate(publicationValidator.byPublicationIdSchema),
  async (req, res) => {
    try {
      const { publicationId } = req.params;
      const userId = req.user.id;

      logger.info(
        `Publication details request: publicationId=${publicationId}, userId=${userId}`,
      );

      // Get publication and member check in parallel
      const [[pub], memberResult] = await Promise.all([
        db.select().from(publication).where(eq(publication.id, parseInt(publicationId))),
        db.select().from(publicationMember).where(
          and(
            eq(publicationMember.publicationId, parseInt(publicationId)),
            eq(publicationMember.userId, userId),
          ),
        ).then(m => m[0])
      ]);

      if (!pub) {
        logger.info(`Publication not found: ${publicationId}`);
        return res.status(404).json({ error: "Publication not found" });
      }

      logger.info(`Publication found:`);

      // Check if user is owner or member
      const isOwner = pub.userId === userId;
      const member = memberResult;

      let userRole = null;
      let isMember = false;

      if (!isOwner && member) {
        isMember = true;
        userRole = member.role;
        logger.info(`User is member with role: ${userRole}`);
      } else if (!isOwner) {
        logger.info(`User is not a member of this publication`);
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

      // Get members, post counts, and owner info in parallel
      const [members, owner] = await Promise.all([
        db.select().from(publicationMember).where(eq(publicationMember.publicationId, parseInt(publicationId))),
        db.select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }).from(user).where(eq(user.id, pub.userId)).then(u => u[0])
      ]);

      const memberCount = members.length;
      const memberIds = [pub.userId, ...members.map((m) => m.userId)];

      // Get post count from all members using SQL COUNT (much faster than fetching all posts)
      let postCount = 0;
      let publishedCount = 0;

      if (memberIds.length > 0) {
        const [postCountResult, publishedCountResult] = await Promise.all([
          db.select({ count: count() }).from(blog).where(inArray(blog.authorId, memberIds)),
          db.select({ count: count() }).from(blog).where(
            and(
              inArray(blog.authorId, memberIds),
              eq(blog.status, BLOG_STATUS.PUBLISHED),
            ),
          )
        ]);
        postCount = postCountResult[0]?.count || 0;
        publishedCount = publishedCountResult[0]?.count || 0;
      }

      const response = {
        ...pub,
        isOwner,
        userRole,
        memberCount,
        postCount,
        publishedCount,
        owner,
      };

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
  requireAuth,
  validate(publicationValidator.createPublicationSchema),
  async (req, res) => {
    try {
      const { name, subdomain, description, customDomain } = req.body;

      logger.info({ subdomain }, "Create publication request received");
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!name || !subdomain) {
        return res
          .status(400)
          .json({ error: "Name and subdomain are required" });
      }

      // Check if user already has a publication
      const existingUserPub = await db
        .select()
        .from(publication)
        .where(eq(publication.userId, userId));

      if (existingUserPub.length > 0) {
        return res
          .status(400)
          .json({ error: "User already has a publication" });
      }

      // Check if subdomain already exists in database
      // Frontend handles format and reserved subdomain validation
      const existing = await db
        .select()
        .from(publication)
        .where(eq(publication.subdomain, subdomain.toLowerCase()));

      if (existing.length > 0) {
        return res.status(400).json({ error: "Subdomain already taken" });
      }

      // Check custom domain availability if provided
      let normalizedCustomDomain = null;
      if (customDomain) {
        const customDomainValidation = validateCustomDomainInput(customDomain);
        if (customDomainValidation.valid === false) {
          return res.status(400).json({ error: customDomainValidation.error });
        }

        normalizedCustomDomain = customDomainValidation.normalizedDomain;
        const existingCustom = await db
          .select()
          .from(publication)
          .where(eq(publication.customDomain, normalizedCustomDomain));

        if (existingCustom.length > 0) {
          return res.status(400).json({ error: "Custom domain already taken" });
        }
      }

      await assertPublicationHostnamesAvailable(db, {
        subdomain,
        customDomain: normalizedCustomDomain,
      });

      const customDomainLifecycle = buildCustomDomainLifecycleFields({
        nextCustomDomain: normalizedCustomDomain,
      });
      const providerFields = customDomainLifecycle.customDomain
        ? await attachCustomDomainToHostingProvider(
            customDomainLifecycle.customDomain,
          )
        : null;
      if (providerFields) {
        Object.assign(customDomainLifecycle, providerFields);
      }

      // Create publication and add creator as admin member in a transaction
      const result = await db.transaction(async (tx) => {
        try {
          // Create the publication
          const [newPublication] = await tx
            .insert(publication)
            .values({
              name,
              subdomain: subdomain.toLowerCase(),
              customDomain: customDomainLifecycle.customDomain,
              customDomainStatus: customDomainLifecycle.customDomainStatus,
              customDomainVerificationToken:
                customDomainLifecycle.customDomainVerificationToken,
              customDomainVerificationError:
                customDomainLifecycle.customDomainVerificationError,
              customDomainVerifiedAt:
                customDomainLifecycle.customDomainVerifiedAt,
              customDomainLastCheckedAt:
                customDomainLifecycle.customDomainLastCheckedAt,
              description: description || null,
              userId,
              logoUrl: null,
              faviconUrl: null,
              metaOgImageUrl: null,
            })
            .returning();

          await syncPublicationHostnames(tx, {
            nextPublication: newPublication,
          });

          // Add creator as admin member
          await tx.insert(publicationMember).values({
            publicationId: newPublication.id,
            userId: userId,
            role: "admin",
          });

          return newPublication;
        } catch (txError) {
          logger.error(txError, "Publication transaction error");
          throw txError;
        }
      });

      logger.info({ publicationId: result.id }, "Publication created successfully");
      await invalidatePublicationCache({
        subdomain: result.subdomain,
        customDomain: result.customDomain,
      });
      return res.status(201).json(result);
    } catch (error) {
      logger.error(error, "Error creating publication");
      logger.error(error, "Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        name: error.name,
      });

      // Provide more specific error messages based on error type
      let statusCode = 500;
      let errorMessage = "Failed to create publication";

      if (isVercelDomainError(error)) {
        errorMessage =
          error.message || "Failed to attach custom domain to Vercel";
        statusCode = error.statusCode && error.statusCode < 500 ? 400 : 502;
      } else if (error.code === "23505") {
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
      } else if (
        error.message === "Subdomain is already reserved" ||
        error.message === "Custom domain is already reserved"
      ) {
        errorMessage = error.message;
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
  requireAuth,
  validate(publicationValidator.updatePublicationSchema),
  requirePublicationRole(["admin"], { publicationIdParam: "id" }),
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

      const [currentPublication] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(id)))
        .limit(1);

      if (!currentPublication) {
        return res.status(404).json({ error: "Publication not found" });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (subdomain !== undefined)
        updateData.subdomain = subdomain.toLowerCase();
      let normalizedIncomingCustomDomain: string | null | undefined = undefined;
      if (customDomain !== undefined) {
        if (customDomain === null || customDomain === "") {
          normalizedIncomingCustomDomain = null;
        } else {
          const customDomainValidation = validateCustomDomainInput(customDomain);
          if (customDomainValidation.valid === false) {
            return res.status(400).json({ error: customDomainValidation.error });
          }

          normalizedIncomingCustomDomain = customDomainValidation.normalizedDomain;
        }

        const nextCustomDomain = normalizedIncomingCustomDomain;
        const lifecycleFields = buildCustomDomainLifecycleFields({
          currentPublication,
          nextCustomDomain,
        });
        const isCustomDomainChange =
          normalizeCustomDomainValue(currentPublication.customDomain) !==
          lifecycleFields.customDomain;
        const shouldRetryProviderAttach =
          lifecycleFields.customDomain &&
          !new Set<string>([
            CUSTOM_DOMAIN_STATUS.ACTIVE,
            CUSTOM_DOMAIN_STATUS.VERIFIED,
            CUSTOM_DOMAIN_STATUS.SSL_PENDING,
          ]).has(currentPublication.customDomainStatus || "");
        const providerFields =
          lifecycleFields.customDomain &&
          (isCustomDomainChange || shouldRetryProviderAttach)
            ? await attachCustomDomainToHostingProvider(
                lifecycleFields.customDomain,
              )
            : null;
        if (providerFields) {
          Object.assign(lifecycleFields, providerFields);
        }

        updateData.customDomain = lifecycleFields.customDomain;
        updateData.customDomainStatus = lifecycleFields.customDomainStatus;
        updateData.customDomainVerificationToken =
          lifecycleFields.customDomainVerificationToken;
        updateData.customDomainVerificationError =
          lifecycleFields.customDomainVerificationError;
        updateData.customDomainVerifiedAt =
          lifecycleFields.customDomainVerifiedAt;
        updateData.customDomainLastCheckedAt =
          lifecycleFields.customDomainLastCheckedAt;
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
      if (normalizedIncomingCustomDomain) {
        const normalizedCustomDomain = normalizedIncomingCustomDomain;
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

      const nextSubdomain = updateData.subdomain ?? currentPublication.subdomain;
      const nextCustomDomain =
        updateData.customDomain !== undefined
          ? updateData.customDomain
          : currentPublication.customDomain;

      await assertPublicationHostnamesAvailable(db, {
        publicationId: currentPublication.id,
        subdomain: nextSubdomain,
        customDomain: nextCustomDomain,
      });

      const updated = await db.transaction(async (tx) => {
        const result = await tx
          .update(publication)
          .set(updateData)
          .where(eq(publication.id, parseInt(id)))
          .returning();

        if (result.length === 0) {
          return result;
        }

        await syncPublicationHostnames(tx, {
          previousPublication: currentPublication,
          nextPublication: result[0],
        });

        return result;
      });

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

      const oldCustomDomain = normalizeCustomDomainValue(
        currentPublication.customDomain,
      );
      const nextSavedCustomDomain = normalizeCustomDomainValue(
        updated[0].customDomain,
      );
      if (oldCustomDomain && oldCustomDomain !== nextSavedCustomDomain) {
        removeVercelProjectDomain(oldCustomDomain).catch((cleanupError) => {
          logger.warn(
            cleanupError,
            "Failed to remove previous custom domain from Vercel project",
          );
        });
      }

      res.json(updated[0]);
    } catch (error) {
      logger.error(error, "Error updating publication:");

      if (isVercelDomainError(error)) {
        const statusCode =
          error.statusCode && error.statusCode < 500 ? 400 : 502;
        return res.status(statusCode).json({
          error: error.message || "Failed to attach custom domain to Vercel",
          code: error.code,
        });
      }

      if (
        error.message === "Subdomain is already reserved" ||
        error.message === "Custom domain is already reserved"
      ) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to update publication" });
    }
  },
);

router.post(
  "/:id/custom-domain/verify",
  requireAuth,
  validate(publicationValidator.byIdSchema),
  requirePublicationRole(["admin"], { publicationIdParam: "id" }),
  async (req, res) => {
    try {
      const publicationId = parseInt(req.params.id, 10);

      const [currentPublication] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, publicationId))
        .limit(1);

      if (!currentPublication) {
        return res.status(404).json({ error: "Publication not found" });
      }

      if (!currentPublication.customDomain) {
        return res.status(400).json({ error: "Custom domain is not configured" });
      }

      const verificationFields =
        await verifyCustomDomainLifecycle(currentPublication);

      const updated = await db.transaction(async (tx) => {
        const result = await tx
          .update(publication)
          .set({
            ...verificationFields,
            updatedAt: new Date(),
          })
          .where(eq(publication.id, currentPublication.id))
          .returning();

        if (result.length === 0) {
          return result;
        }

        await syncPublicationHostnames(tx, {
          previousPublication: currentPublication,
          nextPublication: result[0],
        });

        return result;
      });

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      await invalidatePublicationCache({
        subdomain: currentPublication.subdomain,
        customDomain: currentPublication.customDomain,
      });
      await invalidatePublicationCache({
        subdomain: updated[0].subdomain,
        customDomain: updated[0].customDomain,
      });

      return res.json({
        ...updated[0],
        verificationState: {
          isActive:
            updated[0].customDomainStatus === CUSTOM_DOMAIN_STATUS.ACTIVE,
          requiresDnsUpdate:
            updated[0].customDomainStatus ===
              CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION ||
            updated[0].customDomainStatus === CUSTOM_DOMAIN_STATUS.FAILED,
          requiresHostingUpdate:
            updated[0].customDomainStatus === CUSTOM_DOMAIN_STATUS.VERIFIED ||
            updated[0].customDomainStatus === CUSTOM_DOMAIN_STATUS.SSL_PENDING,
        },
      });
    } catch (error) {
      logger.error(error, "Error verifying custom domain:");
      return res.status(500).json({ error: "Failed to verify custom domain" });
    }
  },
);

// Upload logo
router.post(
  "/:id/logo",
  requireAuth,
  validate(publicationValidator.byIdSchema),
  requirePublicationRole(["admin"], { publicationIdParam: "id" }),
  upload.single("logo"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: CLOUDINARY_FOLDERS.PUB_LOGOS,
        publicId: `pub-${id}-logo`,
        transformation: [{ width: 512, height: 512, crop: "fit" }],
        overwrite: true,
      });

      const logoUrl = result.secureUrl;

      const updated = await db
        .update(publication)
        .set({ logoUrl, updatedAt: new Date() })
        .where(eq(publication.id, parseInt(id as string)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      await invalidatePublicationCache({
        subdomain: updated[0].subdomain,
        customDomain: updated[0].customDomain,
      });

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
  requireAuth,
  validate(publicationValidator.byIdSchema),
  requirePublicationRole(["admin"], { publicationIdParam: "id" }),
  upload.single("favicon"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: CLOUDINARY_FOLDERS.PUB_FAVICONS,
        publicId: `pub-${id}-favicon`,
        transformation: [{ width: 180, height: 180, crop: "fill" }],
        overwrite: true,
      });

      const faviconUrl = result.secureUrl;

      const updated = await db
        .update(publication)
        .set({ faviconUrl, updatedAt: new Date() })
        .where(eq(publication.id, parseInt(id as string)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      await invalidatePublicationCache({
        subdomain: updated[0].subdomain,
        customDomain: updated[0].customDomain,
      });

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
  requireAuth,
  validate(publicationValidator.byIdSchema),
  requirePublicationRole(["admin"], { publicationIdParam: "id" }),
  upload.single("metaOg"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: CLOUDINARY_FOLDERS.PUB_OG,
        publicId: `pub-${id}-og`,
        transformation: [{ width: 1200, height: 630, crop: "fill" }],
        overwrite: true,
      });

      const metaOgImageUrl = result.secureUrl;

      const updated = await db
        .update(publication)
        .set({ metaOgImageUrl, updatedAt: new Date() })
        .where(eq(publication.id, parseInt(id as string)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      await invalidatePublicationCache({
        subdomain: updated[0].subdomain,
        customDomain: updated[0].customDomain,
      });

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
  requireAuth,
  validate(publicationValidator.deleteImageSchema),
  requirePublicationRole(["admin"], { publicationIdParam: "id" }),
  async (req, res) => {
    try {
      const { id, type } = req.params;

      // Get current publication to clean up Cloudinary asset
      const [currentPub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(id)));

      if (!currentPub) {
        return res.status(404).json({ error: "Publication not found" });
      }

      let imageUrl: string | null = null;
      const updateData: any = { updatedAt: new Date() };

      if (type === "logo") {
        imageUrl = currentPub.logoUrl;
        updateData.logoUrl = null;
      } else if (type === "favicon") {
        imageUrl = currentPub.faviconUrl;
        updateData.faviconUrl = null;
      } else if (type === "meta-og") {
        imageUrl = currentPub.metaOgImageUrl;
        updateData.metaOgImageUrl = null;
      } else {
        return res.status(400).json({ error: "Invalid image type" });
      }

      // Delete from Cloudinary if applicable
      if (imageUrl && isCloudinaryUrl(imageUrl)) {
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId);
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

      await invalidatePublicationCache({
        subdomain: updated[0].subdomain,
        customDomain: updated[0].customDomain,
      });

      res.json(updated[0]);
    } catch (error) {
      logger.error(error, "Error removing image:");
      res.status(500).json({ error: "Failed to remove image" });
    }
  },
);

export default router;
