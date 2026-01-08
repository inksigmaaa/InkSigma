// Script to sync blog status and published fields
// This ensures all existing blogs have consistent status and published values

import { db } from "./config/database.js";
import { blog } from "./models/schema.js";
import { eq, ne, and, or } from "drizzle-orm";

async function syncBlogStatus() {
    try {
        console.log("Starting blog status synchronization...");

        // Get all blogs
        const allBlogs = await db.select().from(blog);
        console.log(`Found ${allBlogs.length} total blog(s)`);

        let updatedCount = 0;

        // Update each blog to ensure status and published are in sync
        for (const blogPost of allBlogs) {
            const shouldBePublished = blogPost.status === 'published';
            
            // Check if update is needed
            if (blogPost.published !== shouldBePublished) {
                await db
                    .update(blog)
                    .set({ 
                        published: shouldBePublished,
                        updatedAt: new Date()
                    })
                    .where(eq(blog.id, blogPost.id));
                
                console.log(`Updated blog #${blogPost.id} "${blogPost.title}": status=${blogPost.status}, published=${blogPost.published} → ${shouldBePublished}`);
                updatedCount++;
            }
        }

        console.log("\nSynchronization complete!");
        console.log(`Updated ${updatedCount} blog(s) with inconsistent status/published values`);

        // Show current status distribution
        const updatedBlogs = await db.select().from(blog);
        const stats = {};
        
        updatedBlogs.forEach(b => {
            const key = `${b.status} (published=${b.published})`;
            stats[key] = (stats[key] || 0) + 1;
        });

        console.log("\nCurrent blog status distribution:");
        console.table(stats);

        process.exit(0);
    } catch (error) {
        console.error("Error syncing blog status:", error);
        console.error(error.stack);
        process.exit(1);
    }
}

syncBlogStatus();
