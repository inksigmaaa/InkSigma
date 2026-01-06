// routes/blogRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../config/database.js";
import { blog, user } from "../models/schema.js";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";

const router = express.Router();

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
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
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

// GET /api/blogs - Get all blogs with filters
router.get("/", async (req, res) => {
    try {
        const { 
            published, 
            authorId, 
            categories, 
            search, 
            limit = 50, 
            offset = 0 
        } = req.query;

        let query = db
            .select({
                id: blog.id,
                slug: blog.slug,
                title: blog.title,
                description: blog.description,
                content: blog.content,
                image: blog.image,
                categories: blog.categories,
                published: blog.published,
                createdAt: blog.createdAt,
                updatedAt: blog.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    image: user.image,
                    username: user.username
                }
            })
            .from(blog)
            .leftJoin(user, eq(blog.authorId, user.id))
            .orderBy(desc(blog.createdAt));

        // Apply filters
        const conditions = [];
        
        if (published !== undefined) {
            conditions.push(eq(blog.published, published === 'true'));
        }
        
        if (authorId) {
            conditions.push(eq(blog.authorId, authorId));
        }
        
        if (search) {
            conditions.push(
                or(
                    ilike(blog.title, `%${search}%`),
                    ilike(blog.description, `%${search}%`)
                )
            );
        }
        
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        const blogs = await query.limit(parseInt(limit)).offset(parseInt(offset));

        // Filter by categories if provided (since categories is an array field)
        let filteredBlogs = blogs;
        if (categories) {
            const categoryArray = Array.isArray(categories) ? categories : [categories];
            filteredBlogs = blogs.filter(b => 
                b.categories && b.categories.some(cat => 
                    categoryArray.includes(cat)
                )
            );
        }

        res.json(filteredBlogs);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Failed to fetch blogs" });
    }
});

// GET /api/blogs/:id - Get single blog
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [blogData] = await db
            .select({
                id: blog.id,
                slug: blog.slug,
                title: blog.title,
                description: blog.description,
                content: blog.content,
                image: blog.image,
                categories: blog.categories,
                published: blog.published,
                createdAt: blog.createdAt,
                updatedAt: blog.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    image: user.image,
                    username: user.username
                }
            })
            .from(blog)
            .leftJoin(user, eq(blog.authorId, user.id))
            .where(eq(blog.id, parseInt(id)));

        if (!blogData) {
            return res.status(404).json({ error: "Blog not found" });
        }

        res.json(blogData);
    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).json({ error: "Failed to fetch blog" });
    }
});

// POST /api/blogs - Create new blog
router.post("/", getCurrentUser, async (req, res) => {
    try {
        const { title, description, content, categories, published = false } = req.body;
        
        if (!title || !description || !content) {
            return res.status(400).json({ 
                error: "Title, description, and content are required" 
            });
        }

        const slug = await ensureUniqueSlug(generateSlug(title));

        const [newBlog] = await db
            .insert(blog)
            .values({
                slug,
                title,
                description,
                content,
                categories: categories || [],
                published,
                authorId: req.user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        res.status(201).json(newBlog);
    } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ error: "Failed to create blog" });
    }
});

// PUT /api/blogs/:id - Update blog
router.put("/:id", getCurrentUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, content, categories, published } = req.body;

        // Check if blog exists and user owns it
        const [existingBlog] = await db
            .select()
            .from(blog)
            .where(eq(blog.id, parseInt(id)));

        if (!existingBlog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        if (existingBlog.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this blog" });
        }

        // Generate new slug if title changed
        let slug = existingBlog.slug;
        if (title && title !== existingBlog.title) {
            slug = await ensureUniqueSlug(generateSlug(title), parseInt(id));
        }

        const updateData = {
            updatedAt: new Date(),
        };

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (content !== undefined) updateData.content = content;
        if (categories !== undefined) updateData.categories = categories;
        if (published !== undefined) updateData.published = published;
        if (slug !== existingBlog.slug) updateData.slug = slug;

        const [updatedBlog] = await db
            .update(blog)
            .set(updateData)
            .where(eq(blog.id, parseInt(id)))
            .returning();

        res.json(updatedBlog);
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ error: "Failed to update blog" });
    }
});

// PATCH /api/blogs/:id/publish - Publish/unpublish blog
router.patch("/:id/publish", getCurrentUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        if (typeof published !== 'boolean') {
            return res.status(400).json({ error: "Published must be a boolean" });
        }

        // Check if blog exists and user owns it
        const [existingBlog] = await db
            .select()
            .from(blog)
            .where(eq(blog.id, parseInt(id)));

        if (!existingBlog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        if (existingBlog.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to modify this blog" });
        }

        const [updatedBlog] = await db
            .update(blog)
            .set({
                published,
                updatedAt: new Date(),
            })
            .where(eq(blog.id, parseInt(id)))
            .returning();

        res.json(updatedBlog);
    } catch (error) {
        console.error("Error updating blog status:", error);
        res.status(500).json({ error: "Failed to update blog status" });
    }
});

// DELETE /api/blogs/:id - Delete blog
router.delete("/:id", getCurrentUser, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if blog exists and user owns it
        const [existingBlog] = await db
            .select()
            .from(blog)
            .where(eq(blog.id, parseInt(id)));

        if (!existingBlog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        if (existingBlog.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this blog" });
        }

        // Delete associated image file if exists
        if (existingBlog.image && existingBlog.image.includes("/uploads/blog-images/")) {
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
router.post("/:id/image", getCurrentUser, upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        // Check if blog exists and user owns it
        const [existingBlog] = await db
            .select()
            .from(blog)
            .where(eq(blog.id, parseInt(id)));

        if (!existingBlog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        if (existingBlog.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to modify this blog" });
        }

        const imageUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/${req.file.path.replace(/\\/g, "/")}`;

        // Delete old image file if exists
        if (existingBlog.image && existingBlog.image.includes("/uploads/blog-images/")) {
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
});

export default router;