#!/usr/bin/env node
/**
 * One-time migration: re-upload local /uploads/ images to Cloudinary.
 *
 * Covers:
 *   - publication.logoUrl
 *   - publication.faviconUrl
 *   - publication.metaOgImageUrl
 *   - user.image  (avatars)
 *   - blog.image  (cover images)
 *
 * Usage:
 *   # Dry run (default) — shows what would change, touches nothing
 *   node backend/scripts/migrate-images-to-cloudinary.mjs
 *
 *   # Live run — actually uploads and updates the DB
 *   node backend/scripts/migrate-images-to-cloudinary.mjs --execute
 *
 * Requires these env vars (same as the backend):
 *   DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   BACKEND_URL  (or RENDER_EXTERNAL_URL) — the production backend origin
 */

import "dotenv/config";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";

// ─── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN = !process.argv.includes("--execute");

const BACKEND_ORIGIN =
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "https://api.inksigma.xyz";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isLocalUrl = (url) => url && url.includes("/uploads/");

async function uploadFromUrl(sourceUrl, folder, publicId) {
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
    format: "auto",
    quality: "auto",
  });
  return result.secure_url;
}

function toAbsoluteUrl(localPath) {
  return localPath.startsWith("http")
    ? localPath
    : `${BACKEND_ORIGIN}${localPath.startsWith("/") ? "" : "/"}${localPath}`;
}

// ─── Publication images ──────────────────────────────────────────────────────

async function migratePublications() {
  const { rows } = await pool.query(
    `SELECT id, "logoUrl", "faviconUrl", "metaOgImageUrl" FROM publication`,
  );

  let migrated = 0;

  for (const pub of rows) {
    const updates = {};

    if (isLocalUrl(pub.logoUrl)) {
      const url = toAbsoluteUrl(pub.logoUrl);
      console.log(`  [pub ${pub.id}] logo: ${pub.logoUrl} → Cloudinary`);
      if (!DRY_RUN) {
        try {
          updates.logoUrl = await uploadFromUrl(
            url,
            "inksigma/publications/logos",
            `pub-${pub.id}-logo`,
          );
        } catch (err) {
          console.error(`    ✗ upload failed: ${err.message}`);
        }
      }
    }

    if (isLocalUrl(pub.faviconUrl)) {
      const url = toAbsoluteUrl(pub.faviconUrl);
      console.log(`  [pub ${pub.id}] favicon: ${pub.faviconUrl} → Cloudinary`);
      if (!DRY_RUN) {
        try {
          updates.faviconUrl = await uploadFromUrl(
            url,
            "inksigma/publications/favicons",
            `pub-${pub.id}-favicon`,
          );
        } catch (err) {
          console.error(`    ✗ upload failed: ${err.message}`);
        }
      }
    }

    if (isLocalUrl(pub.metaOgImageUrl)) {
      const url = toAbsoluteUrl(pub.metaOgImageUrl);
      console.log(`  [pub ${pub.id}] og: ${pub.metaOgImageUrl} → Cloudinary`);
      if (!DRY_RUN) {
        try {
          updates.metaOgImageUrl = await uploadFromUrl(
            url,
            "inksigma/publications/og",
            `pub-${pub.id}-og`,
          );
        } catch (err) {
          console.error(`    ✗ upload failed: ${err.message}`);
        }
      }
    }

    if (Object.keys(updates).length > 0 && !DRY_RUN) {
      const setClauses = [];
      const values = [];
      let i = 1;
      for (const [col, val] of Object.entries(updates)) {
        setClauses.push(`"${col}" = $${i}`);
        values.push(val);
        i++;
      }
      setClauses.push(`"updatedAt" = NOW()`);
      values.push(pub.id);

      await pool.query(
        `UPDATE publication SET ${setClauses.join(", ")} WHERE id = $${i}`,
        values,
      );
      migrated++;
      console.log(`    ✓ DB updated`);
    }
  }

  return migrated;
}

// ─── User avatars ────────────────────────────────────────────────────────────

async function migrateUserAvatars() {
  const { rows } = await pool.query(
    `SELECT id, image FROM "user" WHERE image IS NOT NULL`,
  );

  let migrated = 0;

  for (const u of rows) {
    if (!isLocalUrl(u.image)) continue;

    const url = toAbsoluteUrl(u.image);
    console.log(`  [user ${u.id}] avatar: ${u.image} → Cloudinary`);

    if (!DRY_RUN) {
      try {
        const newUrl = await uploadFromUrl(
          url,
          "inksigma/avatars",
          `avatar-${u.id}`,
        );
        await pool.query(
          `UPDATE "user" SET image = $1, "updatedAt" = NOW() WHERE id = $2`,
          [newUrl, u.id],
        );
        migrated++;
        console.log(`    ✓ DB updated`);
      } catch (err) {
        console.error(`    ✗ upload failed: ${err.message}`);
      }
    }
  }

  return migrated;
}

// ─── Blog cover images ──────────────────────────────────────────────────────

async function migrateBlogImages() {
  const { rows } = await pool.query(
    `SELECT id, image FROM blog WHERE image IS NOT NULL`,
  );

  let migrated = 0;

  for (const b of rows) {
    if (!isLocalUrl(b.image)) continue;

    const url = toAbsoluteUrl(b.image);
    console.log(`  [blog ${b.id}] image: ${b.image} → Cloudinary`);

    if (!DRY_RUN) {
      try {
        const newUrl = await uploadFromUrl(
          url,
          "inksigma/blog-images",
          `blog-${b.id}-cover`,
        );
        await pool.query(
          `UPDATE blog SET image = $1, "updatedAt" = NOW() WHERE id = $2`,
          [newUrl, b.id],
        );
        migrated++;
        console.log(`    ✓ DB updated`);
      } catch (err) {
        console.error(`    ✗ upload failed: ${err.message}`);
      }
    }
  }

  return migrated;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Image Migration: Local → Cloudinary`);
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (pass --execute to apply)" : "LIVE"}`);
  console.log(`  Backend origin: ${BACKEND_ORIGIN}`);
  console.log(`  Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME || "(not set!)"}`);
  console.log(`${"=".repeat(60)}\n`);

  if (!process.env.CLOUDINARY_CLOUD_NAME && !DRY_RUN) {
    console.error("ERROR: CLOUDINARY_CLOUD_NAME is not set. Aborting.");
    process.exit(1);
  }

  console.log("── Publications ──");
  const pubCount = await migratePublications();

  console.log("\n── User Avatars ──");
  const avatarCount = await migrateUserAvatars();

  console.log("\n── Blog Cover Images ──");
  const blogCount = await migrateBlogImages();

  console.log(`\n${"─".repeat(60)}`);
  if (DRY_RUN) {
    console.log("  DRY RUN complete — no changes made.");
    console.log("  Run with --execute to apply migrations.");
  } else {
    console.log(`  Done! Migrated:`);
    console.log(`    Publications: ${pubCount}`);
    console.log(`    Avatars:      ${avatarCount}`);
    console.log(`    Blog images:  ${blogCount}`);
  }
  console.log(`${"─".repeat(60)}\n`);

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  pool.end();
  process.exit(1);
});
