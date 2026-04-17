import express from "express";
import { requireAuth } from "../middleware/auth.js";
import logger from "../utils/logger.js";
import {
  createMulterUpload,
  uploadToCloudinary,
  CLOUDINARY_FOLDERS,
} from "../utils/cloudinary.js";

const router = express.Router();

const upload = createMulterUpload(10 * 1024 * 1024); // 10MB limit

// POST /api/upload-image - Upload inline image for editor
router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: CLOUDINARY_FOLDERS.BLOG_INLINE,
      publicId: `inline-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      transformation: [{ width: 1200, crop: "limit" }],
    });

    res.json({
      success: true,
      imageUrl: result.secureUrl,
      url: result.secureUrl,
    });
  } catch (error) {
    logger.error(error, "Error uploading image:");
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
