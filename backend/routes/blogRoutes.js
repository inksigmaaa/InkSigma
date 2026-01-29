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

const router = express.Router();

// Helper function to check if user can modify a blog
const canUserModifyBlog = async (userId, blogAuthorId) => {
  console.log(
    `Checking authorization: userId=${userId}, blogAuthorId=${blogAuthorId}`,
  );

  // If user is the author, they can always modify
  if (userId === blogAuthorId) {
    console.log("User is the author - authorized");
    return true;
  }

  // Check if the current user owns a publication and the blog author is a member of that publication
  const userOwnedPublications = await db
    .select()
    .from(publication)
    .where(eq(publication.userId, userId));

  for (const userPub of userOwnedPublications) {
    console.log(
      `Checking if blog author is member of user's publication: ${userPub.id}`,
    );

    const [authorMembership] = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, userPub.id),
          eq(publicationMember.userId, blogAuthorId),
        ),
      );

    if (authorMembership) {
      console.log(
        `Blog author is ${authorMembership.role} in user's publication ${userPub.id} - authorized`,
      );
      return true;
    }
  }

  // Check if both users are members of the same publication and current user is admin/editor
  const blogAuthorMemberships = await db
    .select()
    .from(publicationMember)
    .where(eq(publicationMember.userId, blogAuthorId));

  for (const authorMembership of blogAuthorMemberships) {
    console.log(
      `Author is member of publication: ${authorMembership.publicationId}`,
    );

    const [currentUserMembership] = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, authorMembership.publicationId),
          eq(publicationMember.userId, userId),
        ),
      );

    if (currentUserMembership) {
      console.log(
        `Current user is ${currentUserMembership.role} in same publication ${authorMembership.publicationId}`,
      );

      if (
        currentUserMembership.role === "admin" ||
        currentUserMembership.role === "editor"
      ) {
        console.log(
          `User is ${currentUserMembership.role} in same publication - authorized`,
        );
        return true;
      } else {
        console.log(
          `User role ${currentUserMembership.role} is not sufficient for modification`,
        );
      }
    } else {
      console.log(
        `Current user is not a member of publication ${authorMembership.publicationId}`,
      );
    }
  }

  // Check if current user is admin/editor in a publication where the blog author is also a member
  const currentUserMemberships = await db
    .select()
    .from(publicationMember)
    .where(eq(publicationMember.userId, userId));

  for (const userMembership of currentUserMemberships) {
    if (userMembership.role === "admin" || userMembership.role === "editor") {
      console.log(
        `User is ${userMembership.role} in publication ${userMembership.publicationId}`,
      );

      const [authorInSamePub] = await db
        .select()
        .from(publicationMember)
        .where(
          and(
            eq(publicationMember.publicationId, userMembership.publicationId),
            eq(publicationMember.userId, blogAuthorId),
          ),
        );

      if (authorInSamePub) {
        console.log(
          `Blog author is also in publication ${userMembership.publicationId} - authorized`,
        );
        return true;
      }
    }
  }

  console.log("User not authorized to modify this blog");
  return false;
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

// GET /api/blogs - Get all blogs with filters
router.get("/", async (req, res) => {
  try {
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
    } = req.query;

    console.log("[GET /api/blogs] Query params:", {
      published,
      status,
      authorId,
      publicationId,
      includeUnpublished,
    });

    // Check if user is authenticated (for viewing their own unpublished posts)
    let currentUserId = null;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      currentUserId = session?.user?.id;
      console.log("[GET /api/blogs] Current user ID:", currentUserId);
    } catch (e) {
      // Not authenticated, that's fine for public requests
      console.log("[GET /api/blogs] Not authenticated");
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

    console.log("[GET /api/blogs] Raw blogs count:", blogs.length);

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

    // Security: If not authenticated or not the author, filter out non-published posts
    // This is a safety net in case someone bypasses the query filters
    console.log(
      "[GET /api/blogs] Security check - currentUserId:",
      currentUserId,
      "authorId:",
      authorId,
      "includeUnpublished:",
      includeUnpublished,
    );

    // Only apply security filters if status is NOT explicitly set to 'published'
    // If status=published is explicitly requested, trust the database filter
    const statusExplicitlyPublished = status === "published";

    if (!statusExplicitlyPublished) {
      if (!currentUserId) {
        console.log("[GET /api/blogs] No user - filtering to published only");
        blogs = blogs.filter((b) => b.status === "published");
      } else if (includeUnpublished === "true") {
        // User is requesting with includeUnpublished
        if (authorId && authorId === currentUserId) {
          // User is requesting their own blogs - show all
          console.log(
            "[GET /api/blogs] User requesting own blogs with includeUnpublished - showing all",
          );
          // No filtering needed
        } else {
          // User is requesting all blogs with includeUnpublished - show published + own posts
          console.log(
            "[GET /api/blogs] includeUnpublished but not own blogs - showing published + own",
          );
          blogs = blogs.filter(
            (b) => b.status === "published" || b.authorId === currentUserId,
          );
        }
      } else {
        // Authenticated but not requesting unpublished - show published + own posts
        console.log("[GET /api/blogs] Filtering to published + own posts");
        blogs = blogs.filter(
          (b) => b.status === "published" || b.authorId === currentUserId,
        );
      }
    } else {
      console.log(
        "[GET /api/blogs] Status explicitly set to published - trusting database filter",
      );
    }

    console.log("[GET /api/blogs] Final blogs count:", blogs.length);
    console.log(
      "[GET /api/blogs] Blog statuses:",
      blogs.map((b) => ({ id: b.id, status: b.status, authorId: b.authorId })),
    );

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

// GET /api/blogs/publication/:publicationId - Get all blogs for a publication
router.get("/publication/:publicationId", getCurrentUser, async (req, res) => {
  try {
    const { publicationId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    console.log("[Publication Blogs] Request:", {
      publicationId,
      status,
      limit,
      offset,
      userId: req.user.id,
    });

    // Check if user has access to this publication
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      console.log("[Publication Blogs] Publication not found:", publicationId);
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

    console.log("[Publication Blogs] Access check:", { isOwner, isMember });

    if (!isOwner && !isMember) {
      console.log("[Publication Blogs] Access denied for user:", req.user.id);
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all blogs that belong to this publication (using publicationId directly)
    const conditions = [eq(blog.publicationId, parseInt(publicationId))];

    // Apply status filter if provided
    if (status) {
      conditions.push(eq(blog.status, status));
    }

    console.log("[Publication Blogs] Query conditions:", {
      publicationId,
      status,
    });

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

    console.log("[Publication Blogs] Blogs found:", blogs.length);

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

    // Security: Only show non-published blogs to the author or reviewers
    if (blogData.status !== "published") {
      if (
        !currentUserId ||
        (blogData.authorId !== currentUserId && blogData.status !== "review")
      ) {
        return res.status(404).json({ error: "Blog not found" });
      }

      // If blog is in review status, check if user is a reviewer (admin/editor) in the publication
      if (blogData.status === "review" && blogData.authorId !== currentUserId) {
        // Need to fetch the blog with publication info to check reviewer status
        const [blogWithPub] = await db
          .select({
            publicationId: blog.publicationId,
          })
          .from(blog)
          .where(eq(blog.id, parseInt(id)));

        if (blogWithPub?.publicationId) {
          const [member] = await db
            .select()
            .from(publicationMember)
            .where(
              and(
                eq(publicationMember.publicationId, blogWithPub.publicationId),
                eq(publicationMember.userId, currentUserId),
                or(
                  eq(publicationMember.role, "admin"),
                  eq(publicationMember.role, "editor"),
                ),
              ),
            );

          if (!member) {
            return res.status(404).json({ error: "Blog not found" });
          }
        } else {
          return res.status(404).json({ error: "Blog not found" });
        }
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

    if (!title || !description || !content) {
      return res.status(400).json({
        error: "Title, description, and content are required",
      });
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

    console.log("[CREATE BLOG] Creating blog with data:", blogData);

    const [newBlog] = await db.insert(blog).values(blogData).returning();

    // Notify scheduler if blog is scheduled
    if (newBlog.status === "scheduled" && newBlog.scheduledAt) {
      schedulerService.onBlogScheduled(newBlog.id);
    }

    // Send notifications if blog is created with review status
    if (newBlog.status === "review" && newBlog.publicationId) {
      console.log(
        `[CREATE BLOG] Blog created with review status, sending notifications for blog ${newBlog.id}`,
      );
      try {
        const [pub] = await db
          .select()
          .from(publication)
          .where(eq(publication.id, newBlog.publicationId));

        console.log(`[CREATE BLOG] Found publication: ${pub?.name}`);

        if (pub) {
          // Notify author that their blog has been submitted for review
          console.log(
            `[CREATE BLOG] Notifying author ${newBlog.authorId} about review submission`,
          );
          await notificationService.notifyBlogSubmittedForReview({
            authorId: newBlog.authorId,
            publicationName: pub.name,
            blogId: newBlog.id,
            publicationId: newBlog.publicationId,
          });

          // Notify publication owner/admins
          const admins = await db
            .select({ userId: publicationMember.userId })
            .from(publicationMember)
            .where(
              and(
                eq(publicationMember.publicationId, newBlog.publicationId),
                or(
                  eq(publicationMember.role, "admin"),
                  eq(publicationMember.role, "editor"),
                ),
              ),
            );

          console.log(
            `[CREATE BLOG] Found ${admins.length} admins/editors to notify`,
          );

          // Notify each admin/editor
          for (const admin of admins) {
            if (admin.userId !== req.user.id) {
              // Don't notify yourself
              console.log(
                `[CREATE BLOG] Notifying admin/editor ${admin.userId} about review`,
              );
              await notificationService.notifyBlogReview({
                recipientId: admin.userId,
                authorName: req.user.name,
                authorId: req.user.id,
                blogId: newBlog.id,
              });
            }
          }

          // Also notify publication owner if not already notified
          if (
            pub.userId !== req.user.id &&
            !admins.some((a) => a.userId === pub.userId)
          ) {
            console.log(
              `[CREATE BLOG] Notifying publication owner ${pub.userId} about review`,
            );
            await notificationService.notifyBlogReview({
              recipientId: pub.userId,
              authorName: req.user.name,
              authorId: req.user.id,
              blogId: newBlog.id,
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to create review notifications:", notifError);
      }
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

    const { title, description, content, categories } = req.body;

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

    const [newBlog] = await db.insert(blog).values(blogData).returning();

    console.log("[AUTO-SAVE] Blog saved as draft:", newBlog.id);
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

    // Create new draft
    const draftSlug = await ensureUniqueSlug(`${originalBlog.slug}-draft`);
    const draftData = {
      slug: draftSlug,
      title: `[copy] ${originalBlog.title}`,
      description: originalBlog.description,
      content: originalBlog.content,
      image: originalBlog.image,
      categories: originalBlog.categories,
      status: "draft",
      published: false,
      authorId: req.user.id, // Current user becomes author of draft (usually same person)
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
      published,
      status,
      scheduledAt,
      publicationId,
    } = req.body;

    console.log(
      `[PUT BLOG] Updating blog ${id} with status: ${status}, publicationId: ${publicationId}, existing status will be checked`,
    );

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

    // Validate and set required fields
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim() === "") {
        return res.status(400).json({ error: "Description cannot be empty" });
      }
      updateData.description = description.trim();
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
      console.log(
        `[BLOG] Scheduling blog ${id} for: ${updateData.scheduledAt.toISOString()}`,
      );
    }

    // Handle publicationId update
    if (publicationId !== undefined) {
      updateData.publicationId = publicationId ? parseInt(publicationId) : null;
      console.log(
        `[PUT BLOG] Setting publicationId to: ${updateData.publicationId}`,
      );
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
      console.log(
        `[PUT BLOG DEBUG] Blog ${id} has masterId ${existingBlog.masterId}. Checking for merge...`,
      );

      // Determine the target status
      let targetStatus = existingBlog.status;
      if (status) targetStatus = status;
      else if (published !== undefined)
        targetStatus = published ? "published" : "draft";

      console.log(
        `[PUT BLOG DEBUG] Target status: ${targetStatus}, Existing status: ${existingBlog.status}`,
      );

      if (targetStatus === "published") {
        console.log(
          `[PUT BLOG] Merging draft ${id} into master ${existingBlog.masterId}`,
        );

        // Get Master Blog to ensure it exists
        const [masterBlog] = await db
          .select()
          .from(blog)
          .where(eq(blog.id, existingBlog.masterId));

        if (masterBlog) {
          // Prepare data to update master
          // We use the draft's current data, overridden by any incoming updates in updateData
          const mergeData = {
            title: updateData.title || existingBlog.title,
            description: updateData.description || existingBlog.description,
            content: updateData.content || existingBlog.content,
            // Use updateData.image if set (including null/empty), otherwise fall back to existingBlog.image
            image: updateData.hasOwnProperty("image")
              ? updateData.image
              : existingBlog.image,
            categories: updateData.categories || existingBlog.categories,
            updatedAt: new Date(),
          };

          console.log("[PUT BLOG] Updating master with merged data");

          // Update Master
          const [updatedMaster] = await db
            .update(blog)
            .set(mergeData)
            .where(eq(blog.id, existingBlog.masterId))
            .returning();

          // Delete the Draft
          console.log(`[PUT BLOG] Deleting draft ${id} after merge`);
          await db.delete(blog).where(eq(blog.id, parseInt(id)));

          // Return the master blog as the result
          return res.json(updatedMaster);
        } else {
          console.warn(
            `[PUT BLOG] Master blog ${existingBlog.masterId} not found, proceeding with normal update`,
          );
          // If master not found, maybe just treat this as a normal blog now?
          // Or strip the masterId? Let's just proceed as normal update for now to avoid data loss.
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
      console.log(`[BLOG] Notifying scheduler for blog ${id}`);
      schedulerService.onBlogScheduled(updatedBlog.id);
    } else if (
      existingBlog.status === "scheduled" &&
      updatedBlog.status !== "scheduled"
    ) {
      // Blog was unscheduled
      console.log(`[BLOG] Cancelling schedule for blog ${id}`);
      schedulerService.onBlogUnscheduled(updatedBlog.id);
    }

    // Create notifications based on status change
    if (status !== undefined && status !== existingBlog.status) {
      console.log(
        `[PUT BLOG] Status changed from ${existingBlog.status} to ${status}, checking for notifications`,
      );
      try {
        // If blog was submitted for review
        if (status === "review" && existingBlog.publicationId) {
          console.log(
            `[PUT BLOG] Blog submitted for review, publicationId: ${existingBlog.publicationId}`,
          );
          const [pub] = await db
            .select()
            .from(publication)
            .where(eq(publication.id, existingBlog.publicationId));

          console.log(`[PUT BLOG] Found publication: ${pub?.name}`);

          if (pub) {
            // Notify author that their blog has been submitted for review
            console.log(
              `[PUT BLOG] Notifying author ${existingBlog.authorId} about review submission`,
            );
            await notificationService.notifyBlogSubmittedForReview({
              authorId: existingBlog.authorId,
              publicationName: pub.name,
              blogId: parseInt(id),
              publicationId: existingBlog.publicationId,
            });

            // Notify publication owner/admins
            const admins = await db
              .select({ userId: publicationMember.userId })
              .from(publicationMember)
              .where(
                and(
                  eq(
                    publicationMember.publicationId,
                    existingBlog.publicationId,
                  ),
                  or(
                    eq(publicationMember.role, "admin"),
                    eq(publicationMember.role, "editor"),
                  ),
                ),
              );

            console.log(
              `[PUT BLOG] Found ${admins.length} admins/editors to notify`,
            );

            // Notify each admin/editor
            for (const admin of admins) {
              if (admin.userId !== req.user.id) {
                // Don't notify yourself
                console.log(
                  `[PUT BLOG] Notifying admin/editor ${admin.userId} about review`,
                );
                await notificationService.notifyBlogReview({
                  recipientId: admin.userId,
                  authorName: req.user.name,
                  authorId: req.user.id,
                  blogId: parseInt(id),
                });
              }
            }

            // Also notify publication owner if not already notified
            if (
              pub.userId !== req.user.id &&
              !admins.some((a) => a.userId === pub.userId)
            ) {
              console.log(
                `[PUT BLOG] Notifying publication owner ${pub.userId} about review`,
              );
              await notificationService.notifyBlogReview({
                recipientId: pub.userId,
                authorName: req.user.name,
                authorId: req.user.id,
                blogId: parseInt(id),
              });
            }
          }
        }

        // If blog was published
        if (status === "published" && existingBlog.status !== "published") {
          // Notify author when blog is published
          await notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedBlog.title,
            blogId: parseInt(id),
            publicationId: updatedBlog.publicationId,
          });
        }
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
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

    // Create notification for author
    try {
      if (existingBlog.publicationId) {
        const [pub] = await db
          .select()
          .from(publication)
          .where(eq(publication.id, existingBlog.publicationId));

        if (action === "accept") {
          // If blog is being published, send published notification
          if (targetStatus === "published") {
            await notificationService.notifyBlogPublished({
              authorId: existingBlog.authorId,
              blogTitle: updatedBlog.title,
              blogId: parseInt(id),
              publicationId: existingBlog.publicationId,
            });
          } else {
            // Otherwise send accepted notification
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
      }
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

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

    console.log(`[PATCH /api/blogs/${id}/publish] Request received`);
    console.log("Request body:", { published, status });
    console.log("User:", req.user?.id);

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

    console.log("Target status:", targetStatus);

    // Check if blog exists
    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));

    if (!existingBlog) {
      console.error("Blog not found:", id);
      return res.status(404).json({ error: "Blog not found" });
    }

    console.log("Existing blog:", {
      id: existingBlog.id,
      authorId: existingBlog.authorId,
      currentStatus: existingBlog.status,
    });

    // Check if user can modify this blog (author, admin, or editor)
    const canModify = await canUserModifyBlog(
      req.user.id,
      existingBlog.authorId,
    );
    if (!canModify) {
      console.error(
        "Authorization failed. Blog author:",
        existingBlog.authorId,
        "User:",
        req.user.id,
      );
      return res
        .status(403)
        .json({ error: "Not authorized to modify this blog" });
    }

    // Apply strict synchronization rules
    const syncedFields = syncStatusAndPublished(targetStatus);
    console.log("Synced fields:", syncedFields);

    const updateData = {
      ...syncedFields,
      updatedAt: new Date(),
    };

    const [updatedBlog] = await db
      .update(blog)
      .set(updateData)
      .where(eq(blog.id, parseInt(id)))
      .returning();

    console.log("Blog updated successfully:", {
      id: updatedBlog.id,
      status: updatedBlog.status,
      published: updatedBlog.published,
    });

    // Create notifications based on status change
    console.log(
      "[Notification Check] targetStatus:",
      targetStatus,
      "existingBlog.status:",
      existingBlog.status,
    );
    if (targetStatus !== existingBlog.status) {
      console.log(
        "[Notification] Status changed, checking notification triggers...",
      );
      try {
        // If blog was published
        if (
          targetStatus === "published" &&
          existingBlog.status !== "published"
        ) {
          console.log(
            "[Notification] Creating blog published notification for author:",
            existingBlog.authorId,
          );
          // Notify author when blog is published
          await notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedBlog.title,
            blogId: parseInt(id),
            publicationId: updatedBlog.publicationId,
          });
          console.log(
            "[Notification] Blog published notification created successfully",
          );
        }

        // If blog was submitted for review
        if (targetStatus === "review" && existingBlog.publicationId) {
          const [pub] = await db
            .select()
            .from(publication)
            .where(eq(publication.id, existingBlog.publicationId));

          if (pub) {
            // Notify author that their blog has been submitted for review
            await notificationService.notifyBlogSubmittedForReview({
              authorId: existingBlog.authorId,
              publicationName: pub.name,
              blogId: parseInt(id),
              publicationId: existingBlog.publicationId,
            });

            // Notify publication owner/admins
            const admins = await db
              .select({ userId: publicationMember.userId })
              .from(publicationMember)
              .where(
                and(
                  eq(
                    publicationMember.publicationId,
                    existingBlog.publicationId,
                  ),
                  or(
                    eq(publicationMember.role, "admin"),
                    eq(publicationMember.role, "editor"),
                  ),
                ),
              );

            // Notify each admin/editor
            for (const admin of admins) {
              if (admin.userId !== req.user.id) {
                await notificationService.notifyBlogReview({
                  recipientId: admin.userId,
                  authorName: req.user.name,
                  authorId: req.user.id,
                  blogId: parseInt(id),
                });
              }
            }

            // Also notify publication owner
            if (
              pub.userId !== req.user.id &&
              !admins.some((a) => a.userId === pub.userId)
            ) {
              await notificationService.notifyBlogReview({
                recipientId: pub.userId,
                authorName: req.user.name,
                authorId: req.user.id,
                blogId: parseInt(id),
              });
            }
          }
        }
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
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
    );
    if (!canModify) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this blog" });
    }

    // Delete associated image file if exists
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
