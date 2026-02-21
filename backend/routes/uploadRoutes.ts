import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import logger from "../utils/logger.js";

const router = express.Router();

// Configure multer for image uploads
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
        logger.error(error, "Auth error:");
        return res.status(401).json({ error: "Unauthorized" });
    }
};

// POST /api/upload-image - Upload inline image for editor
router.post("/", getCurrentUser, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        const imageUrl = `/uploads/blog-images/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            imageUrl,
            url: imageUrl
        });
    } catch (error) {
        logger.error(error, "Error uploading image:");
        res.status(500).json({ error: "Failed to upload image" });
    }
});

export default router;
