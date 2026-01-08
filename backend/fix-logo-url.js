// fix-logo-url.js
import "dotenv/config";
import { db } from "./config/database.js";
import { publication } from "./models/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function fixLogoUrls() {
  try {
    console.log("Fetching publications...");
    const pubs = await db.select().from(publication);
    
    for (const pub of pubs) {
      let updated = false;
      const updates = {};
      
      // Fix logoUrl
      if (pub.logoUrl && pub.logoUrl.includes('.svg+xml')) {
        const oldPath = pub.logoUrl.replace('/uploads/publications/', '');
        const newPath = oldPath.replace('.svg+xml', '.svg');
        const oldFilePath = path.join('uploads/publications', oldPath);
        const newFilePath = path.join('uploads/publications', newPath);
        
        // Rename file if it exists
        if (fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, newFilePath);
          console.log(`Renamed: ${oldPath} -> ${newPath}`);
        }
        
        updates.logoUrl = `/uploads/publications/${newPath}`;
        updated = true;
      }
      
      // Fix faviconUrl
      if (pub.faviconUrl && pub.faviconUrl.includes('.svg+xml')) {
        const oldPath = pub.faviconUrl.replace('/uploads/publications/', '');
        const newPath = oldPath.replace('.svg+xml', '.svg');
        const oldFilePath = path.join('uploads/publications', oldPath);
        const newFilePath = path.join('uploads/publications', newPath);
        
        if (fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, newFilePath);
          console.log(`Renamed: ${oldPath} -> ${newPath}`);
        }
        
        updates.faviconUrl = `/uploads/publications/${newPath}`;
        updated = true;
      }
      
      // Fix metaOgImageUrl
      if (pub.metaOgImageUrl && pub.metaOgImageUrl.includes('.svg+xml')) {
        const oldPath = pub.metaOgImageUrl.replace('/uploads/publications/', '');
        const newPath = oldPath.replace('.svg+xml', '.svg');
        const oldFilePath = path.join('uploads/publications', oldPath);
        const newFilePath = path.join('uploads/publications', newPath);
        
        if (fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, newFilePath);
          console.log(`Renamed: ${oldPath} -> ${newPath}`);
        }
        
        updates.metaOgImageUrl = `/uploads/publications/${newPath}`;
        updated = true;
      }
      
      if (updated) {
        await db
          .update(publication)
          .set(updates)
          .where(eq(publication.id, pub.id));
        
        console.log(`Updated publication ${pub.id} (${pub.name})`);
      }
    }
    
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixLogoUrls();
