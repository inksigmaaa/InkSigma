import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import { requireAuth } from "../middleware/auth.js";
import { trackBlogView } from "../services/viewTrackingService.js";
import { requirePublicationContext } from "../middleware/subdomainMiddleware.js";
import { blogService } from "../services/blogService.js";
import { validate } from "../middleware/validate.js";
import * as blogValidator from "../validators/blogValidator.js";
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";
import { config } from "../config/appConfig.js";

const router = express.Router();

// Configure multer for blog image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/blog-images";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.size > 10 * 1024 * 1024) {
      cb(new Error("File size exceeds 10MB limit") as any, false);
      return;
    }
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error("Only image files are allowed!") as any, false);
  },
});

const handleError = (res, error, defaultMsg) => {
  logger.error(error, `[Blog Route Error] ${defaultMsg}:`);
  if (error.message.includes("|")) {
    const [msg, status] = error.message.split("|");
    return res.status(parseInt(status)).json({ error: msg });
  }
  return res.status(500).json({ error: defaultMsg, details: error.message });
};

const hasSessionHint = (req) =>
  Boolean(req.headers.cookie || req.headers.authorization);

const getSessionUserId = async (req) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return session?.user?.id || null;
};

const shouldResolveUserForBlogList = (query) => {
  const status = String(query?.status || "").toLowerCase();
  const includeUnpublished = query?.includeUnpublished === "true";
  const draftScope = query?.draftScope;
  const includeReview = query?.includeReview === "true";
  const includeTrash = query?.includeTrash === "true";

  if (includeUnpublished || includeReview || includeTrash || draftScope) {
    return true;
  }

  return status !== BLOG_STATUS.PUBLISHED;
};

// GET /api/blogs
router.get("/", validate(blogValidator.getBlogsSchema), async (req, res) => {
  try {
    let currentUserId = null;
    if (shouldResolveUserForBlogList(req.query) && hasSessionHint(req)) {
      try {
        currentUserId = await getSessionUserId(req);
      } catch {
        currentUserId = null;
      }
    }

    const blogs = await blogService.getAllBlogs(
      req.query,
      currentUserId,
      req.tenant,
    );
    res.json(blogs);
  } catch (error) {
    handleError(res, error, "Failed to fetch blogs");
  }
});

// GET /api/blogs/public
router.get("/public", requirePublicationContext, async (req, res) => {
  try {
    const blogs = await blogService.getPublicBlogs(req.publication.id);
    res.json(blogs);
  } catch (error) {
    handleError(res, error, "Failed to fetch public blogs");
  }
});

// GET /api/blogs/publication/:publicationId
router.get(
  "/publication/:publicationId",
  requireAuth,
  validate(blogValidator.getPublicationBlogsSchema),
  async (req, res) => {
    try {
      const blogs = await blogService.getPublicationBlogs(
        req.params.publicationId,
        req.query,
        req.user,
      );
      res.json(blogs);
    } catch (error) {
      handleError(res, error, "Failed to fetch publication blogs");
    }
  },
);

// GET /api/blogs/:id
router.get("/:id", validate(blogValidator.byIdSchema), async (req, res) => {
  try {
    let currentUserId = null;
    if (hasSessionHint(req)) {
      try {
        currentUserId = await getSessionUserId(req);
      } catch {
        currentUserId = null;
      }
    }

    const blog = await blogService.getBlogById(
      req.params.id,
      currentUserId,
      req.tenant,
    );

    if (
      req.query.incrementView === "true" &&
      blog.status === BLOG_STATUS.PUBLISHED
    ) {
      const forwardedFor = req.headers["x-forwarded-for"];
      const realIp = req.headers["x-real-ip"];
      const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0].trim() ||
        (Array.isArray(realIp) ? realIp[0] : realIp) ||
        req.connection.remoteAddress ||
        req.ip ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      trackBlogView(blog.id, ip, userAgent).then((viewResult) => {
        if (viewResult?.isNewView)
          (blog as any).views = ((blog as any).views || 0) + 1;
      }).catch(() => {});
    }

    res.json(blog);
  } catch (error) {
    handleError(res, error, "Failed to fetch blog");
  }
});

// GET /api/blogs/slug/:slug
router.get(
  "/slug/:slug",
  validate(blogValidator.bySlugSchema),
  async (req, res) => {
    try {
      let blog;

      try {
        blog = await blogService.getBlogBySlug(req.params.slug, null, req.tenant);
      } catch (error) {
        if (!hasSessionHint(req)) {
          throw error;
        }

        const currentUserId = await getSessionUserId(req);
        blog = await blogService.getBlogBySlug(
          req.params.slug,
          currentUserId,
          req.tenant,
        );
      }

      if (
        req.query.incrementView === "true" &&
        blog.status === BLOG_STATUS.PUBLISHED
      ) {
        const forwardedFor = req.headers["x-forwarded-for"];
        const realIp = req.headers["x-real-ip"];
        const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0].trim() ||
          (Array.isArray(realIp) ? realIp[0] : realIp) ||
          req.connection.remoteAddress ||
          req.ip ||
          "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        trackBlogView(blog.id, ip, userAgent).then((viewResult) => {
          if (viewResult?.isNewView)
            (blog as any).views = ((blog as any).views || 0) + 1;
        }).catch(() => {});
      }

      res.json(blog);
    } catch (error) {
      handleError(res, error, "Failed to fetch blog");
    }
  },
);

// POST /api/blogs
router.post(
  "/",
  requireAuth,
  validate(blogValidator.createBlogSchema),
  async (req, res) => {
    try {
      const newBlog = await blogService.createBlog(req.body, req.user);
      res.status(201).json(newBlog);
    } catch (error) {
      handleError(res, error, "Failed to create blog");
    }
  },
);

// POST /api/blogs/auto-save
router.post(
  "/auto-save",
  requireAuth,
  validate(blogValidator.autoSaveSchema),
  async (req, res) => {
    try {
      const newBlog = await blogService.autoSaveDraft(req.body, req.user);
      res.status(201).json(newBlog);
    } catch (error) {
      handleError(res, error, "Failed to auto-save blog");
    }
  },
);

// POST /api/blogs/:id/edit-draft
router.post(
  "/:id/edit-draft",
  requireAuth,
  validate(blogValidator.byIdSchema),
  async (req, res) => {
    try {
      const newDraft = await blogService.createDraftFromPublished(
        req.params.id,
        req.body,
        req.user,
      );
      res.json(newDraft);
    } catch (error) {
      handleError(res, error, "Failed to create draft");
    }
  },
);

// PUT /api/blogs/:id
router.put(
  "/:id",
  requireAuth,
  validate(blogValidator.updateBlogSchema),
  async (req, res) => {
    try {
      const updatedBlog = await blogService.updateBlog(
        req.params.id,
        req.body,
        req.user,
      );
      res.json(updatedBlog);
    } catch (error) {
      if (error.code === "23502")
        return res
          .status(400)
          .json({ error: "Required fields cannot be empty" });
      if (error.code === "23505")
        return res
          .status(400)
          .json({ error: "Blog with this slug already exists" });
      handleError(res, error, "Failed to update blog");
    }
  },
);

// PATCH /api/blogs/:id/review-action
router.patch(
  "/:id/review-action",
  requireAuth,
  validate(blogValidator.reviewActionSchema),
  async (req, res) => {
    try {
      const updatedBlog = await blogService.reviewAction(
        req.params.id,
        req.body,
        req.user,
      );
      res.json(updatedBlog);
    } catch (error) {
      handleError(res, error, "Failed to review blog");
    }
  },
);

// PATCH /api/blogs/:id/publish
router.patch(
  "/:id/publish",
  requireAuth,
  validate(blogValidator.publishSchema),
  async (req, res) => {
    try {
      const updatedBlog = await blogService.publishBlog(
        req.params.id,
        req.body,
        req.user,
      );
      res.json(updatedBlog);
    } catch (error) {
      handleError(res, error, "Failed to publish blog");
    }
  },
);

// DELETE /api/blogs/:id
router.delete(
  "/:id",
  requireAuth,
  validate(blogValidator.byIdSchema),
  async (req, res) => {
    try {
      const result = await blogService.deleteBlog(req.params.id, req.user);
      res.json(result);
    } catch (error) {
      handleError(res, error, "Failed to delete blog");
    }
  },
);

// POST /api/blogs/:id/image
router.post(
  "/:id/image",
  requireAuth,
  validate(blogValidator.byIdSchema),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No image provided" });

      const blogId = req.params.id;
      try {
        await blogService.getBlogById(blogId, req.user.id, req.tenant);
      } catch (e) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return handleError(
          res,
          e,
          "Not authorized to upload image for this blog",
        );
      }

      const imageUrl = `${config.backend.url}/uploads/blog-images/${req.file.filename}`;

      const updatedBlog = await blogService.updateBlog(
        blogId,
        { image: imageUrl },
        req.user,
      );

      res.json({ success: true, blog: updatedBlog, image: updatedBlog.image });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      handleError(res, error, "Failed to upload image");
    }
  },
);

export default router;
