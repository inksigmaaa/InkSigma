// routes/blogRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../config/database.js";
import {
  blog,
  user,
  publication,
  publicationMember,
  comment,
  blogShare,
} from "../models/schema.js";
import { eq, desc, and, or, ilike, count, isNull } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import notificationService from "../services/notificationService.js";
import schedulerService from "../services/schedulerService.js";
import {
  trackBlogView,
  getBlogViewCount,
} from "../services/viewTrackingService.js";
import { requirePublicationContext } from "../middleware/subdomainMiddleware.js";

const router = express.Router();

// Helper function to check if user can modify a blog
// Rules:
// 1) Author can always modify.
// 2) Publication owner can modify any blog in that publication.
// 3) Publication admin/editor can modify any blog in that publication.
const canUserModifyBlog = async (userId, blogAuthorId, blogPublicationId) => {
  if (!userId || !blogAuthorId) return false;

  if (userId === blogAuthorId) {
    return true;
  }

  if (!blogPublicationId) {
    return false;
  }

  const [pub] = await db
    .select({
      id: publication.id,
      ownerId: publication.userId,
    })
    .from(publication)
    .where(eq(publication.id, blogPublicationId));

  if (!pub) {
    return false;
  }

  if (pub.ownerId === userId) {
    return true;
  }

  const [membership] = await db
    .select({
      role: publicationMember.role,
    })
    .from(publicationMember)
    .where(
      and(
        eq(publicationMember.publicationId, blogPublicationId),
        eq(publicationMember.userId, userId),
      ),
    );

  return membership?.role === "admin" || membership?.role === "editor";
};

// Configure multer for blog image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/blog-images";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `blog-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for blog images
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
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
};

// Helper function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = db.select().from(blog).where(eq(blog.slug, slug));
    if (excludeId) {
      query.where(and(eq(blog.slug, slug), eq(blog.id, excludeId)));
    }

    const [existing] = await query;
    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Helper function to sync status and published fields according to strict rules
const syncStatusAndPublished = (status) => {
  // Validate status
  if (
    ![
      "draft",
      "published",
      "unpublished",
      "trash",
      "scheduled",
      "review",
    ].includes(status)
  ) {
    throw new Error(
      `Invalid status: ${status}. Must be 'draft', 'published', 'unpublished', 'trash', 'scheduled', or 'review'`,
    );
  }

  // Apply strict synchronization rules:
  // - Status 'published' = published TRUE (visible)
  // - Status 'draft' = published FALSE (hidden)
  // - Status 'unpublished' = published FALSE (hidden)
  // - Status 'trash' = published FALSE (hidden)
  // - Status 'scheduled' = published FALSE (hidden until scheduled time)
  // - Status 'review' = published FALSE (hidden, pending review)
  return {
    status,
    published: status === "published",
  };
};

const runInBackground = (label, task) => {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error(`[BLOG BACKGROUND] ${label} failed:`, error);
    });
};

const notifyReviewSubmission = async ({
  publicationId,
  authorId,
  actorId,
  actorName,
  blogId,
}) => {
  if (!publicationId) return;

  const [pub] = await db
    .select()
    .from(publication)
    .where(eq(publication.id, publicationId));

  if (!pub) return;

  await notificationService.notifyBlogSubmittedForReview({
    authorId,
    publicationName: pub.name,
    blogId,
    publicationId,
  });

  const admins = await db
    .select({ userId: publicationMember.userId })
    .from(publicationMember)
    .where(
      and(
        eq(publicationMember.publicationId, publicationId),
        or(
          eq(publicationMember.role, "admin"),
          eq(publicationMember.role, "editor"),
        ),
      ),
    );

  const recipients = new Set();

  for (const admin of admins) {
    if (admin.userId && admin.userId !== actorId) {
      recipients.add(admin.userId);
    }
  }

  if (pub.userId && pub.userId !== actorId) {
    recipients.add(pub.userId);
  }

  if (recipients.size === 0) return;

  await Promise.allSettled(
    Array.from(recipients).map((recipientId) =>
      notificationService.notifyBlogReview({
        recipientId,
        authorName: actorName || "Author",
        authorId: actorId,
        blogId,
      }),
    ),
  );
};

// GET /api/blogs - Get all blogs with filters
router.get("/", async (req, res) => {
  try {
    if (
      req.tenant?.type === "subdomain" ||
      req.tenant?.type === "custom-domain"
    ) {
      if (!req.tenant.publication) {
        return res.status(404).json({ error: "Publication not found" });
      }
      req.query.publicationId = String(req.tenant.publication.id);
    }

    const {
      published,
      status,
      authorId,
      publicationId,
      categories,
      search,
      limit = 50,
      offset = 0,
      includeUnpublished, // Only for authenticated requests
      includeStats, // Optional: include expensive per-blog stats
    } = req.query;

    // Check if user is authenticated (for viewing their own unpublished posts)
    let currentUserId = null;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      currentUserId = session?.user?.id;
    } catch (e) {
      // Not authenticated, that's fine for public requests
    }

    let query = db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        image: blog.image,
        publicationId: blog.publicationId,
        categories: blog.categories,
        status: blog.status,
        published: blog.published,
        scheduledAt: blog.scheduledAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        authorId: blog.authorId,
        masterId: blog.masterId,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .orderBy(desc(blog.createdAt));

    // Apply filters
    const conditions = [];

    // PUBLIC ACCESS: Only show published blogs by default
    // Unless user is authenticated AND requesting their own posts OR includeUnpublished is set
    if (status !== undefined) {
      // Explicit status filter requested
      conditions.push(eq(blog.status, status));
    } else if (published !== undefined) {
      // Explicit published filter requested
      conditions.push(eq(blog.published, published === "true"));
    } else if (!includeUnpublished || includeUnpublished !== "true") {
      // Default: only show published blogs for public access
      conditions.push(eq(blog.status, "published"));
    }

    if (authorId) {
      conditions.push(eq(blog.authorId, authorId));
    }

    if (publicationId) {
      if (publicationId === "null") {
        conditions.push(isNull(blog.publicationId));
      } else {
        conditions.push(eq(blog.publicationId, parseInt(publicationId)));
      }
    }

    if (search) {
      conditions.push(
        or(
          ilike(blog.title, `%${search}%`),
          ilike(blog.description, `%${search}%`),
        ),
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    let blogs = await query.limit(parseInt(limit)).offset(parseInt(offset));

    // Filter by categories if provided (since categories is an array field)
    if (categories) {
      const categoryArray = Array.isArray(categories)
        ? categories
        : [categories];
      blogs = blogs.filter(
        (b) =>
          b.categories &&
          b.categories.some((cat) => categoryArray.includes(cat)),
      );
    }

    // Security: If not authenticated or not the author, filter out non-published posts.
    // This is a safety net in case someone bypasses the query filters.

    // Only apply security filters if status is NOT explicitly set to 'published'
    // If status=published is explicitly requested, trust the database filter
    const statusExplicitlyPublished = status === "published";

    if (!statusExplicitlyPublished) {
      if (!currentUserId) {
        blogs = blogs.filter((b) => b.status === "published");
      } else if (includeUnpublished === "true") {
        // User is requesting with includeUnpublished
        if (authorId && authorId === currentUserId) {
          // User is requesting their own blogs - show all
          // No filtering needed
        } else {
          // User is requesting all blogs with includeUnpublished - show published + own posts
          blogs = blogs.filter(
            (b) => b.status === "published" || b.authorId === currentUserId,
          );
        }
      } else {
        // Authenticated but not requesting unpublished - show published + own posts
        blogs = blogs.filter(
          (b) => b.status === "published" || b.authorId === currentUserId,
        );
      }
    }

    // Most dashboard pages do not display list stats. Skip expensive N+1 work unless explicitly requested.
    if (includeStats !== "true") {
      return res.json(
        blogs.map((b) => ({
          ...b,
          views: 0,
          comments: 0,
          shares: 0,
          revisits: 0,
        })),
      );
    }

    // Add stats to each blog (limit to first 50 to avoid performance issues)
    const blogsToProcess = blogs.slice(0, 50);
    const blogsWithStats = await Promise.all(
      blogsToProcess.map(async (b) => {
        try {
          // Get view count
          const viewCount = await getBlogViewCount(b.id);

          // Get comment count
          const [commentData] = await db
            .select({ count: count() })
            .from(comment)
            .where(eq(comment.blogId, b.id));
          const commentCount = parseInt(commentData?.count || 0);

          // Get share count
          const [shareData] = await db
            .select({ count: count() })
            .from(blogShare)
            .where(eq(blogShare.blogId, b.id));
          const shareCount = parseInt(shareData?.count || 0);

          return {
            ...b,
            views: viewCount,
            comments: commentCount,
            shares: shareCount,
            revisits: 0, // Not tracked separately, using 0
          };
        } catch (statsError) {
          console.warn(`Failed to fetch stats for blog ${b.id}:`, statsError);
          // Return blog without stats if there's an error
          return {
            ...b,
            views: 0,
            comments: 0,
            shares: 0,
            revisits: 0,
          };
        }
      }),
    );

    res.json(blogsWithStats);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Failed to fetch blogs", details: error.message });
  }
});

// GET /api/blogs/public - Get all published blogs for current host publication
router.get("/public", requirePublicationContext, async (req, res) => {
  try {
    const { publication } = req;
    const blogs = await db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        image: blog.image,
        publicationId: blog.publicationId,
        categories: blog.categories,
        status: blog.status,
        published: blog.published,
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        authorId: blog.authorId,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(
        and(
          eq(blog.publicationId, publication.id),
          eq(blog.status, "published"),
        ),
      )
      .orderBy(desc(blog.publishedAt));

    res.json({ publication, blogs });
  } catch (error) {
    console.error("Error fetching public blogs:", error);
    res.status(500).json({ error: "Failed to fetch public blogs" });
  }
});

// GET /api/blogs/publication/:publicationId - Get all blogs for a publication
router.get("/publication/:publicationId", getCurrentUser, async (req, res) => {
  try {
    const { publicationId } = req.params;
    const { status, limit = 50, offset = 0, includeStats } = req.query;

    // Check if user has access to this publication
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      return res.status(404).json({ error: "Publication not found" });
    }

    // Check if user is owner or member
    const isOwner = pub.userId === req.user.id;

    let isMember = false;
    if (!isOwner) {
      const [member] = await db
        .select()
        .from(publicationMember)
        .where(
          and(
            eq(publicationMember.publicationId, parseInt(publicationId)),
            eq(publicationMember.userId, req.user.id),
          ),
        );
      isMember = !!member;
    }

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all blogs that belong to this publication (using publicationId directly)
    const conditions = [eq(blog.publicationId, parseInt(publicationId))];

    // Apply status filter if provided
    if (status) {
      conditions.push(eq(blog.status, status));
    }

    const blogs = await db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        image: blog.image,
        publicationId: blog.publicationId,
        categories: blog.categories,
        status: blog.status,
        published: blog.published,
        scheduledAt: blog.scheduledAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        masterId: blog.masterId,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(and(...conditions))
      .orderBy(desc(blog.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (includeStats !== "true") {
      return res.json(
        blogs.map((b) => ({
          ...b,
          views: 0,
          comments: 0,
          shares: 0,
          revisits: 0,
        })),
      );
    }

    // Add stats to each blog
    const blogsWithStats = await Promise.all(
      blogs.map(async (b) => {
        try {
          // Get view count
          const viewCount = await getBlogViewCount(b.id);

          // Get comment count
          const [commentData] = await db
            .select({ count: count() })
            .from(comment)
            .where(eq(comment.blogId, b.id));
          const commentCount = parseInt(commentData?.count || 0);

          // Get share count
          const [shareData] = await db
            .select({ count: count() })
            .from(blogShare)
            .where(eq(blogShare.blogId, b.id));
          const shareCount = parseInt(shareData?.count || 0);

          return {
            ...b,
            views: viewCount,
            comments: commentCount,
            shares: shareCount,
            revisits: 0, // Not tracked separately, using 0
          };
        } catch (statsError) {
          console.warn(`Failed to fetch stats for blog ${b.id}:`, statsError);
          // Return blog without stats if there's an error
          return {
            ...b,
            views: 0,
            comments: 0,
            shares: 0,
            revisits: 0,
          };
        }
      }),
    );

    res.json(blogsWithStats);
  } catch (error) {
    console.error("Error fetching publication blogs:", error);
    res.status(500).json({ error: "Failed to fetch publication blogs" });
  }
});

// GET /api/blogs/:id - Get single blog
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is authenticated
    let currentUserId = null;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      currentUserId = session?.user?.id;
    } catch (e) {
      // Not authenticated
    }

    const [blogData] = await db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        image: blog.image,
        categories: blog.categories,
        status: blog.status,
        published: blog.published,
        publicationId: blog.publicationId,
        scheduledAt: blog.scheduledAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        authorId: blog.authorId,
        masterId: blog.masterId,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(eq(blog.id, parseInt(id)));

    if (!blogData) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (
      req.tenant?.type === "subdomain" ||
      req.tenant?.type === "custom-domain"
    ) {
      if (!req.tenant.publication) {
        return res.status(404).json({ error: "Blog not found" });
      }
      if (blogData.publicationId !== req.tenant.publication.id) {
        return res.status(404).json({ error: "Blog not found" });
      }
    }

    // Security: Only show non-published blogs to authorized users (author, admin, editor)
    if (blogData.status !== "published") {
      if (!currentUserId) {
        return res.status(404).json({ error: "Blog not found" });
      }

      // Check if user is author OR has permission to modify (Admin/Editor)
      // This aligns with the PUT permissions so editors can view the drafts they are allowed to edit
      const canView = await canUserModifyBlog(
        currentUserId,
        blogData.authorId,
        blogData.publicationId,
      );

      if (!canView) {
        // Special check: If it's in review, current logic might still apply?
        // canUserModifyBlog covers Admin/Editor roles which are the reviewers.
        // So we can rely on it.
        return res.status(404).json({ error: "Blog not found" });
      }
    }

    res.json(blogData);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

// GET /api/blogs/slug/:slug - Get single blog by slug (public route)
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { incrementView } = req.query;

    // Check if user is authenticated
    let currentUserId = null;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      currentUserId = session?.user?.id;
    } catch (e) {
      // Not authenticated
    }

    const [blogData] = await db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        image: blog.image,
        categories: blog.categories,
        status: blog.status,
        published: blog.published,
        publicationId: blog.publicationId,
        scheduledAt: blog.scheduledAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        authorId: blog.authorId,
        masterId: blog.masterId,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(eq(blog.slug, slug));

    if (!blogData) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (
      req.tenant?.type === "subdomain" ||
      req.tenant?.type === "custom-domain"
    ) {
      if (!req.tenant.publication) {
        return res.status(404).json({ error: "Blog not found" });
      }
      if (blogData.publicationId !== req.tenant.publication.id) {
        return res.status(404).json({ error: "Blog not found" });
      }
    }

    // Get view count from blog_view table
    const viewCount = await getBlogViewCount(blogData.id);
    blogData.views = viewCount;

    // Security: Only show non-published blogs to the author
    if (blogData.status !== "published") {
      if (!currentUserId || blogData.authorId !== currentUserId) {
        return res.status(404).json({ error: "Blog not found" });
      }
    }

    // Track view with Redis and 24-hour deduplication
    if (incrementView === "true" && blogData.status === "published") {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.headers["x-real-ip"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const viewResult = await trackBlogView(blogData.id, ip, userAgent);

      // Update the view count in response if it was a new view
      if (viewResult.isNewView) {
        blogData.views = blogData.views + 1;
      }
    }

    res.json(blogData);
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

// POST /api/blogs - Create new blog
router.post("/", getCurrentUser, async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      categories,
      published = false,
      status,
      scheduledAt,
      publicationId,
    } = req.body;

    // For drafts, only require at least a title to save
    // For publishing, require all fields
    const isDraft = status === "draft" || (!status && !published);

    if (isDraft) {
      // For drafts, only require a title to save
      if (!title || !title.trim()) {
        return res.status(400).json({
          error: "Title is required to save as draft",
        });
      }
    } else {
      // For publishing/scheduling, require all fields
      if (!title || !description || !content) {
        return res.status(400).json({
          error: "Title, description, and content are required",
        });
      }
    }

    // publicationId is optional - verify access only if provided
    if (publicationId) {
      // Verify user has access to this publication
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(publicationId)));

      if (!pub) {
        return res.status(404).json({ error: "Publication not found" });
      }

      // Check if user is owner or member
      const isOwner = pub.userId === req.user.id;
      let isMember = false;

      if (!isOwner) {
        const [member] = await db
          .select()
          .from(publicationMember)
          .where(
            and(
              eq(publicationMember.publicationId, parseInt(publicationId)),
              eq(publicationMember.userId, req.user.id),
            ),
          );
        isMember = !!member;
      }

      if (!isOwner && !isMember) {
        return res
          .status(403)
          .json({ error: "You don't have access to this publication" });
      }
    }

    const slug = await ensureUniqueSlug(generateSlug(title));

    // Determine status: use status if provided, otherwise use published for backward compatibility
    let targetStatus = "draft";

    if (status) {
      targetStatus = status;
    } else if (published) {
      targetStatus = "published";
    }

    // Apply strict synchronization rules
    const syncedFields = syncStatusAndPublished(targetStatus);

    const blogData = {
      slug,
      title,
      description,
      content,
      categories: categories || [],
      ...syncedFields, // This ensures both status and published are always in sync
      authorId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add publicationId only if provided
    if (publicationId) {
      blogData.publicationId = parseInt(publicationId);
    }

    // Add scheduledAt if provided
    if (scheduledAt) {
      blogData.scheduledAt = new Date(scheduledAt);
    }

    const [newBlog] = await db.insert(blog).values(blogData).returning();

    // Notify scheduler if blog is scheduled
    if (newBlog.status === "scheduled" && newBlog.scheduledAt) {
      schedulerService.onBlogScheduled(newBlog.id);
    }

    // Run review notifications asynchronously so article actions return fast.
    if (newBlog.status === "review" && newBlog.publicationId) {
      runInBackground("create-review-notifications", () =>
        notifyReviewSubmission({
          publicationId: newBlog.publicationId,
          authorId: newBlog.authorId,
          actorId: req.user.id,
          actorName: req.user.name,
          blogId: newBlog.id,
        }),
      );
    }

    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res
      .status(500)
      .json({ error: "Failed to create blog", details: error.message });
  }
});

// POST /api/blogs/auto-save - Auto-save blog as draft (for sendBeacon)
router.post("/auto-save", async (req, res) => {
  try {
    // Get session from cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, description, content, categories, publicationId } = req.body;

    // Only save if there's meaningful content
    if (!title || !description || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const slug = await ensureUniqueSlug(generateSlug(title));

    const blogData = {
      slug,
      title,
      description,
      content,
      categories: categories || [],
      status: "draft",
      published: false,
      authorId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (publicationId) {
      blogData.publicationId = parseInt(publicationId);
    }

    const [newBlog] = await db.insert(blog).values(blogData).returning();

    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error auto-saving blog:", error);
    res.status(500).json({ error: "Failed to auto-save blog" });
  }
});

// POST /api/blogs/:id/edit-draft - Create a draft from a published blog
router.post("/:id/edit-draft", getCurrentUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the original blog
    const [originalBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));

    if (!originalBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check permission
    const authorized = await canUserModifyBlog(
      req.user.id,
      originalBlog.authorId,
      originalBlog.publicationId,
    );
    if (!authorized) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Must be published
    if (originalBlog.status !== "published") {
      return res
        .status(400)
        .json({ error: "Only published blogs can be edited as drafts" });
    }

    // Check if a draft already exists
    const [existingDraft] = await db
      .select()
      .from(blog)
      .where(eq(blog.masterId, originalBlog.id));

    if (existingDraft) {
      return res.json(existingDraft);
    }

    // Get optional overrides from request body (to save current editor state)
    const { title, description, content, categories, image } = req.body;

    // Create new draft
    const draftSlug = await ensureUniqueSlug(`${originalBlog.slug}-draft`);
    const draftData = {
      slug: draftSlug,
      // Use provided title or append [update draft] to original
      title: title || `${originalBlog.title} [Update draft]`,
      description:
        description !== undefined ? description : originalBlog.description,
      content: content !== undefined ? content : originalBlog.content,
      image: image !== undefined ? image : originalBlog.image,
      categories:
        categories !== undefined ? categories : originalBlog.categories,
      status: "draft",
      published: false,
      authorId: originalBlog.authorId, // Original author remains author of draft
      publicationId: originalBlog.publicationId, // Keep same publication
      masterId: originalBlog.id, // Link to original
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newDraft] = await db.insert(blog).values(draftData).returning();

    res.json(newDraft);
  } catch (error) {
    console.error("Error creating draft copy:", error);
    res.status(500).json({ error: "Failed to create draft" });
  }
});

// PUT /api/blogs/:id - Update blog
router.put("/:id", getCurrentUser, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      content,
      categories,
      image,
      published,
      status,
      scheduledAt,
      publicationId,
    } = req.body;

    // Check if blog exists
    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user can modify this blog (author, admin, or editor)
    const canModify = await canUserModifyBlog(
      req.user.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this blog" });
    }

    // Generate new slug if title changed
    let slug = existingBlog.slug;
    if (title && title !== existingBlog.title) {
      slug = await ensureUniqueSlug(generateSlug(title), parseInt(id));
    }

    const updateData = {
      updatedAt: new Date(),
    };

    // Validate title - required for new blogs but allow updates without title change
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      // Allow empty description for updates - just trim it
      if (typeof description === "string") {
        updateData.description = description.trim();
      }
    }

    if (content !== undefined) {
      // Only validate if content is being explicitly set to something
      // Allow empty content for updates (user might be clearing it temporarily)
      if (typeof content === "string") {
        updateData.content = content.trim();
      }
    }

    if (categories !== undefined) updateData.categories = categories;
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    if (image !== undefined) {
      updateData.image = image || null;

      if (
        (image === null || image === "") &&
        existingBlog.image &&
        existingBlog.image.includes("/uploads/blog-images/")
      ) {
        const imagePath = existingBlog.image.split("/uploads/blog-images/")[1];
        const filePath = `uploads/blog-images/${imagePath}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Handle publicationId update
    if (publicationId !== undefined) {
      updateData.publicationId = publicationId ? parseInt(publicationId) : null;
    }

    // Handle status update with strict synchronization
    if (status !== undefined) {
      const syncedFields = syncStatusAndPublished(status);
      Object.assign(updateData, syncedFields);
    } else if (published !== undefined) {
      // Convert published boolean to status for backward compatibility
      const targetStatus = published ? "published" : "draft";
      const syncedFields = syncStatusAndPublished(targetStatus);
      Object.assign(updateData, syncedFields);
    }

    if (slug !== existingBlog.slug) updateData.slug = slug;

    // MERGE LOGIC: If this is a draft of a published article and it is being published
    if (existingBlog.masterId) {
      // Determine the target status
      let targetStatus = existingBlog.status;
      if (status) targetStatus = status;
      else if (published !== undefined)
        targetStatus = published ? "published" : "draft";

      if (targetStatus === "published") {
        // Get Master Blog to ensure it exists
        const [masterBlog] = await db
          .select()
          .from(blog)
          .where(eq(blog.id, existingBlog.masterId));

        if (masterBlog) {
          // Prepare data to update master
          // We use the draft's current data, overridden by any incoming updates in updateData
          const mergeData = {
            title: (updateData.title || existingBlog.title).replace(
              /\s*\[Update draft\]$/i,
              "",
            ),
            description: updateData.description || existingBlog.description,
            content: updateData.content || existingBlog.content,
            // Use updateData.image if set (including null/empty), otherwise fall back to existingBlog.image
            image: updateData.hasOwnProperty("image")
              ? updateData.image
              : existingBlog.image,
            categories: updateData.categories || existingBlog.categories,
            updatedAt: new Date(),
          };

          // Update Master
          const [updatedMaster] = await db
            .update(blog)
            .set(mergeData)
            .where(eq(blog.id, existingBlog.masterId))
            .returning();

          // Delete the Draft
          await db.delete(blog).where(eq(blog.id, parseInt(id)));

          // Return the master blog as the result
          return res.json(updatedMaster);
        } else {
          console.error(
            `[PUT BLOG ERROR] Master blog ${existingBlog.masterId} not found for draft ${id}. Cannot merge.`,
          );
          return res.status(404).json({
            error:
              "Original article not found. Cannot publish this draft as an update.",
          });
        }
      }
    }

    const [updatedBlog] = await db
      .update(blog)
      .set(updateData)
      .where(eq(blog.id, parseInt(id)))
      .returning();

    // Notify scheduler if blog is scheduled or rescheduled
    if (updatedBlog.status === "scheduled" && updatedBlog.scheduledAt) {
      schedulerService.onBlogScheduled(updatedBlog.id);
    } else if (
      existingBlog.status === "scheduled" &&
      updatedBlog.status !== "scheduled"
    ) {
      // Blog was unscheduled
      schedulerService.onBlogUnscheduled(updatedBlog.id);
    }

    // Run notifications asynchronously to avoid delaying user actions.
    if (status !== undefined && status !== existingBlog.status) {
      if (status === "review" && existingBlog.publicationId) {
        runInBackground("put-review-notifications", () =>
          notifyReviewSubmission({
            publicationId: existingBlog.publicationId,
            authorId: existingBlog.authorId,
            actorId: req.user.id,
            actorName: req.user.name,
            blogId: parseInt(id),
          }),
        );
      }

      if (status === "published" && existingBlog.status !== "published") {
        runInBackground("put-published-notification", () =>
          notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedBlog.title,
            blogId: parseInt(id),
            publicationId: updatedBlog.publicationId,
          }),
        );
      }
    }

    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);

    // Provide more specific error messages
    if (error.code === "23502") {
      // NOT NULL violation
      return res.status(400).json({ error: "Required fields cannot be empty" });
    }
    if (error.code === "23505") {
      // UNIQUE violation
      return res
        .status(400)
        .json({ error: "Blog with this slug already exists" });
    }
    if (error.message.includes("invalid input syntax")) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    res.status(500).json({ error: "Failed to update blog" });
  }
});

// PATCH /api/blogs/:id/review-action - Accept or reject blog review
router.patch("/:id/review-action", getCurrentUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, targetStatus: requestedTargetStatus } = req.body; // 'accept' or 'reject', optional targetStatus for accept

    if (!["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Action must be 'accept' or 'reject'" });
    }

    // Check if blog exists
    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user can modify this blog (admin or editor)
    const canModify = await canUserModifyBlog(
      req.user.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) {
      return res
        .status(403)
        .json({ error: "Not authorized to review this blog" });
    }

    // Determine target status based on action and optional targetStatus parameter
    let targetStatus;
    if (action === "accept") {
      // If targetStatus is provided and valid, use it. Otherwise default to 'unpublished'
      // This allows admin to choose 'published' or 'unpublished', while editors typically use 'unpublished'
      if (
        requestedTargetStatus &&
        ["published", "unpublished"].includes(requestedTargetStatus)
      ) {
        targetStatus = requestedTargetStatus;
      } else {
        targetStatus = "unpublished"; // Default to unpublished for safety
      }
    } else {
      // Reject action returns to draft
      targetStatus = "draft";
    }
    const syncedFields = syncStatusAndPublished(targetStatus);

    const [updatedBlog] = await db
      .update(blog)
      .set({
        ...syncedFields,
        updatedAt: new Date(),
      })
      .where(eq(blog.id, parseInt(id)))
      .returning();

    runInBackground("review-action-notifications", async () => {
      if (!existingBlog.publicationId) return;

      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, existingBlog.publicationId));

      if (!pub) return;

      if (action === "accept") {
        if (targetStatus === "published") {
          await notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedBlog.title,
            blogId: parseInt(id),
            publicationId: existingBlog.publicationId,
          });
        } else {
          await notificationService.notifyBlogAccepted({
            authorId: existingBlog.authorId,
            publicationName: pub.name,
            blogId: parseInt(id),
            publicationId: existingBlog.publicationId,
          });
        }
      } else {
        await notificationService.notifyBlogRejected({
          authorId: existingBlog.authorId,
          publicationName: pub.name,
          blogId: parseInt(id),
          publicationId: existingBlog.publicationId,
        });
      }
    });

    res.json(updatedBlog);
  } catch (error) {
    console.error("Error reviewing blog:", error);
    res.status(500).json({ error: "Failed to review blog" });
  }
});

// PATCH /api/blogs/:id/publish - Publish/unpublish blog
router.patch("/:id/publish", getCurrentUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { published, status } = req.body;

    // Determine target status with strict validation
    let targetStatus;

    if (status !== undefined) {
      targetStatus = status;
    } else if (published !== undefined) {
      if (typeof published !== "boolean") {
        return res.status(400).json({ error: "Published must be a boolean" });
      }
      targetStatus = published ? "published" : "unpublished";
    } else {
      return res
        .status(400)
        .json({ error: "Either 'published' or 'status' must be provided" });
    }

    // Check if blog exists
    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user can modify this blog (author, admin, or editor)
    const canModify = await canUserModifyBlog(
      req.user.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this blog" });
    }

    // Apply strict synchronization rules
    const syncedFields = syncStatusAndPublished(targetStatus);

    const updateData = {
      ...syncedFields,
      updatedAt: new Date(),
    };

    // MERGE LOGIC: If this is a draft of a published article and it is being published
    if (existingBlog.masterId && targetStatus === "published") {
      // Get Master Blog to ensure it exists
      const [masterBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, existingBlog.masterId));

      if (masterBlog) {
        // Prepare data to update master
        // We use the draft's current data (existingBlog) as the source of truth
        // since PATCH usually only updates status, but we want to merge the draft's content
        const mergeData = {
          title: existingBlog.title.replace(/\s*\[Update draft\]$/i, ""),
          description: existingBlog.description,
          content: existingBlog.content,
          image: existingBlog.image,
          categories: existingBlog.categories,
          updatedAt: new Date(),
          ...syncedFields, // Ensure master gets 'published' status if it wasn't already (though it should be)
        };

        // Update Master
        const [updatedMaster] = await db
          .update(blog)
          .set(mergeData)
          .where(eq(blog.id, existingBlog.masterId))
          .returning();

        // Delete the draft after merge.
        await db.delete(blog).where(eq(blog.id, parseInt(id)));

        // Return the master blog as the result
        return res.json(updatedMaster);
      } else {
        console.error(
          `[PATCH BLOG ERROR] Master blog ${existingBlog.masterId} not found for draft ${id}. Cannot merge.`,
        );
        return res.status(404).json({
          error:
            "Original article not found. Cannot publish this draft as an update.",
        });
      }
    }

    const [updatedBlog] = await db
      .update(blog)
      .set(updateData)
      .where(eq(blog.id, parseInt(id)))
      .returning();

    // Run notifications asynchronously to avoid slowing action responses.
    if (targetStatus !== existingBlog.status) {
      if (targetStatus === "published" && existingBlog.status !== "published") {
        runInBackground("publish-status-notification", () =>
          notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedBlog.title,
            blogId: parseInt(id),
            publicationId: updatedBlog.publicationId,
          }),
        );
      }

      if (targetStatus === "review" && existingBlog.publicationId) {
        runInBackground("publish-review-notifications", () =>
          notifyReviewSubmission({
            publicationId: existingBlog.publicationId,
            authorId: existingBlog.authorId,
            actorId: req.user.id,
            actorName: req.user.name,
            blogId: parseInt(id),
          }),
        );
      }
    }

    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog status:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Ensure we always send a proper JSON response
    const errorMessage = error.message || "Failed to update blog status";
    return res.status(500).json({ error: errorMessage });
  }
});

// DELETE /api/blogs/:id - Delete blog
router.delete("/:id", getCurrentUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if blog exists
    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user can modify this blog (author, admin, or editor)
    const canModify = await canUserModifyBlog(
      req.user.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this blog" });
    }

    // Delete associated image file if exists
    try {
      if (
        existingBlog.image &&
        existingBlog.image.includes("/uploads/blog-images/")
      ) {
        const imagePath = existingBlog.image.split("/uploads/blog-images/")[1];
        const filePath = `uploads/blog-images/${imagePath}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (fileError) {
      console.error("Error deleting image file:", fileError);
      // Continue with blog deletion even if image deletion fails
    }

    await db.delete(blog).where(eq(blog.id, parseInt(id)));

    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

// POST /api/blogs/:id/image - Upload blog thumbnail
router.post(
  "/:id/image",
  getCurrentUser,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Check if blog exists
      const [existingBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, parseInt(id)));

      if (!existingBlog) {
        return res.status(404).json({ error: "Blog not found" });
      }

      // Check if user can modify this blog (author, admin, or editor)
      const canModify = await canUserModifyBlog(
        req.user.id,
        existingBlog.authorId,
        existingBlog.publicationId,
      );
      if (!canModify) {
        return res
          .status(403)
          .json({ error: "Not authorized to modify this blog" });
      }

      const imageUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/${req.file.path.replace(/\\/g, "/")}`;

      // Delete old image file if exists
      if (
        existingBlog.image &&
        existingBlog.image.includes("/uploads/blog-images/")
      ) {
        const oldPath = existingBlog.image.split("/uploads/blog-images/")[1];
        const oldFilePath = `uploads/blog-images/${oldPath}`;
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update blog image in database
      const [updatedBlog] = await db
        .update(blog)
        .set({
          image: imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(blog.id, parseInt(id)))
        .returning();

      res.json({ success: true, imageUrl, blog: updatedBlog });
    } catch (error) {
      console.error("Error uploading blog image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

// Debug endpoint to check publication memberships
router.get("/debug/memberships/:userId", getCurrentUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's owned publications
    const ownedPublications = await db
      .select()
      .from(publication)
      .where(eq(publication.userId, userId));

    // Get user's memberships
    const memberships = await db
      .select({
        publicationId: publicationMember.publicationId,
        role: publicationMember.role,
        joinedAt: publicationMember.joinedAt,
        publicationName: publication.name,
      })
      .from(publicationMember)
      .innerJoin(
        publication,
        eq(publicationMember.publicationId, publication.id),
      )
      .where(eq(publicationMember.userId, userId));

    res.json({
      userId,
      ownedPublications,
      memberships,
    });
  } catch (error) {
    console.error("Error fetching debug memberships:", error);
    res.status(500).json({ error: "Failed to fetch memberships" });
  }
});

export default router;
