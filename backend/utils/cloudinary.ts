import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { config } from "../config/appConfig.js";
import logger from "./logger.js";

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Shared memory storage — files stay in RAM, get pushed to Cloudinary, then GC'd
const memoryStorage = multer.memoryStorage();

const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;

export function createMulterUpload(maxSize: number) {
  return multer({
    storage: memoryStorage,
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
      const mimeOk = allowedTypes.test(file.mimetype);
      const extOk = allowedTypes.test(ext);
      if (mimeOk && extOk) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    },
  });
}

// Cloudinary folder constants
export const CLOUDINARY_FOLDERS = {
  AVATARS: "inksigma/avatars",
  BLOG_IMAGES: "inksigma/blog-images",
  BLOG_INLINE: "inksigma/blog-inline",
  PUB_LOGOS: "inksigma/publications/logos",
  PUB_FAVICONS: "inksigma/publications/favicons",
  PUB_OG: "inksigma/publications/og",
} as const;

interface UploadOptions {
  folder: string;
  publicId: string;
  transformation?: Record<string, unknown>[];
  overwrite?: boolean;
  resourceType?: "image" | "video" | "raw" | "auto";
}

interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export function uploadToCloudinary(
  buffer: Buffer,
  options: UploadOptions,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder: options.folder,
      public_id: options.publicId,
      overwrite: options.overwrite ?? true,
      resource_type: options.resourceType ?? "image",
      format: "auto",
      quality: "auto",
    };

    if (options.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error(error, "Cloudinary upload failed");
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary returned no result"));
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    logger.error(error, `Cloudinary delete failed for ${publicId}`);
    return false;
  }
}

export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;

  // Cloudinary URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
  // or with transforms: https://res.cloudinary.com/{cloud}/image/upload/{transforms}/v{version}/{public_id}.{ext}
  const match = url.match(
    /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z]+)?$/,
  );
  if (!match) return null;

  let publicId = match[1];
  // Strip leading transform segments (they contain commas or known prefixes like w_, h_, c_, f_, q_)
  // The actual public_id starts after the version or after transforms
  // Re-parse if we matched transforms instead of the public_id
  const transformMatch = url.match(
    /\/upload\/[^/]+\/v\d+\/(.+?)(?:\.[a-zA-Z]+)?$/,
  );
  if (transformMatch) {
    publicId = transformMatch[1];
  }

  return publicId || null;
}

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && url.includes("res.cloudinary.com");
}

export function isLegacyLocalUrl(url: string | null | undefined): boolean {
  return !!url && url.includes("/uploads/");
}
export { cloudinary };
